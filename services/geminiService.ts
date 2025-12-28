import { GoogleGenAI, Type } from "@google/genai";
import { VerificationResult } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Note: In a production environment, direct client-side calls to the Twitter API 
// are often blocked by CORS. This implementation assumes a proxy or environment 
// setup that allows these requests to fulfill the hybrid verification requirement.
const TWITTER_BEARER_TOKEN = (process.env as any).TWITTER_BEARER_TOKEN || '';

/**
 * Extracts Tweet ID from various URL formats or returns the string if it's already an ID
 */
function extractTweetId(input: string): string | null {
  const match = input.match(/\/status\/(\d+)/);
  if (match) return match[1];
  const idMatch = input.match(/^\d+$/);
  return idMatch ? input : null;
}

/**
 * Fetches real-time data from Twitter API v2 using the tweets endpoint.
 * This path verifies ownership by comparing author_id and checks public_metrics for view count.
 */
async function verifyViaTwitterAPI(tweetId: string, authenticatedUserId: string): Promise<VerificationResult> {
  try {
    const response = await fetch(`https://api.twitter.com/2/tweets/${tweetId}?tweet.fields=public_metrics,author_id,text&expansions=author_id&user.fields=username,name`, {
      headers: {
        'Authorization': `Bearer ${TWITTER_BEARER_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error("Twitter API request failed");
    }

    const data = await response.json();
    const tweet = data.data;
    const user = data.includes?.users?.[0];

    if (!tweet || !user) {
      throw new Error("Tweet not found or malformed response");
    }

    const viewCount = tweet.public_metrics?.view_count || 0;
    const isOwner = tweet.author_id === authenticatedUserId;
    const isValid = isOwner && viewCount >= 10000;

    return {
      isValid,
      isOwner,
      viewCount,
      content: tweet.text,
      author: user.name,
      handle: `@${user.username}`
    };
  } catch (error) {
    console.error("Twitter API Error:", error);
    return {
      isValid: false,
      isOwner: false,
      viewCount: 0,
      content: "",
      author: "",
      handle: "",
      error: "Could not verify tweet data, please try again."
    };
  }
}

/**
 * Uses Gemini AI to analyze a screenshot.
 * Extracts content, author, handle, and view count visually.
 */
async function verifyViaGemini(base64: string, mimeType: string, authenticatedHandle: string): Promise<VerificationResult> {
  const model = 'gemini-3-flash-preview';
  
  const systemInstruction = `
    You are a specialized Twitter Verification Agent. 
    Analyze the provided tweet screenshot and extract:
    - The full text content of the tweet.
    - The author's display name.
    - The author's @handle (include the @).
    - The total View Count. 
    
    Convert shorthand numbers to integers (e.g., '12.5K' -> 12500, '1.2M' -> 1200000).
    Respond strictly in JSON format matching the provided schema.
  `;

  const prompt = "Please analyze this tweet screenshot and extract all relevant metadata including the view count.";
  
  const config = {
    responseMimeType: "application/json",
    responseSchema: {
      type: Type.OBJECT,
      properties: {
        content: { type: Type.STRING },
        author: { type: Type.STRING },
        handle: { type: Type.STRING },
        viewCount: { type: Type.INTEGER }
      },
      required: ["content", "author", "handle", "viewCount"]
    }
  };

  try {
    const response = await ai.models.generateContent({
      model,
      contents: {
        parts: [
          { inlineData: { data: base64, mimeType: mimeType } },
          { text: prompt }
        ]
      },
      config: { ...config, systemInstruction }
    });

    const result = JSON.parse(response.text);
    
    // For screenshots, we verify ownership by matching the handle.
    const cleanHandle = result.handle.replace('@', '').toLowerCase();
    const cleanAuthHandle = authenticatedHandle.replace('@', '').toLowerCase();
    const isOwner = cleanHandle === cleanAuthHandle;
    const isValid = isOwner && result.viewCount >= 10000;

    return {
      isValid,
      isOwner,
      viewCount: result.viewCount,
      content: result.content,
      author: result.author,
      handle: result.handle
    };
  } catch (error) {
    console.error("Gemini Error:", error);
    return {
      isValid: false,
      isOwner: false,
      viewCount: 0,
      content: "",
      author: "",
      handle: "",
      error: "Screenshot analysis failed, please upload a clearer image."
    };
  }
}

/**
 * Main entry point for tweet verification. 
 * Orchestrates between visual (Gemini) and data-driven (Twitter API) validation.
 */
export async function verifyTweetData(
  input: string | { base64: string, mimeType: string },
  authenticatedUser: { id: string, username: string }
): Promise<VerificationResult> {
  
  // Case 1: Image Input (Screenshot)
  if (typeof input !== 'string') {
    return await verifyViaGemini(input.base64, input.mimeType, authenticatedUser.username);
  }

  // Case 2: String Input (URL or ID)
  const tweetId = extractTweetId(input);
  if (tweetId) {
    return await verifyViaTwitterAPI(tweetId, authenticatedUser.id);
  }

  // Fallback for invalid formats
  return {
    isValid: false,
    isOwner: false,
    viewCount: 0,
    content: "",
    author: "",
    handle: "",
    error: "Invalid input. Please provide a valid Tweet URL, ID, or upload a screenshot."
  };
}