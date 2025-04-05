import OpenAI from "openai";
import fs from "fs";
import path from "path";
import { storage } from "./storage";

// Initialize OpenAI with API key
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || "sk-SdFBDkQDJQylAqwkaa09iq2I7UYrzLAReqsOu20iCiyqMYtg",
  baseURL: process.env.OPENAI_BASE_URL || "https://api.tu-zi.com/v1"
});

// Helper function to convert base64 to buffer
export function base64ToBuffer(base64String: string): Buffer {
  return Buffer.from(base64String.replace(/^data:image\/\w+;base64,/, ""), "base64");
}

// Helper function to convert buffer to base64
export function bufferToBase64(buffer: Buffer, mimeType: string): string {
  return `data:${mimeType};base64,${buffer.toString("base64")}`;
}

// Function to transform image using GPT-4o
export async function transformImage(
  imageBuffer: Buffer, 
  style: string, 
  imageId: number
): Promise<string> {
  try {
    // Get the style prompt template
    const styleData = await storage.getStyleByName(style);
    if (!styleData) {
      throw new Error(`Style ${style} not found`);
    }

    // Convert buffer to base64
    const base64Image = bufferToBase64(imageBuffer, "image/jpeg");
    
    // Update image status to processing
    await storage.updateImageStatus(imageId, "processing");

    // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
    const response = await openai.chat.completions.create({
      model: "gpt-4o-image-vip", // Using the model specified in the project doc
      messages: [{
        role: "user", 
        content: [
          {
            type: "image_url",
            image_url: {
              url: base64Image
            }
          },
          {
            type: "text",
            text: styleData.promptTemplate
          },
        ]
      }],
      max_tokens: 4096,
    });

    // Extract the response content
    const content = response.choices[0].message.content;
    
    if (!content || !content.includes("data:image")) {
      throw new Error("Failed to generate transformed image");
    }

    // Extract base64 from the response
    const match = content.match(/data:image\/(jpeg|png|webp);base64,[^"'`\s]+/);
    if (!match) {
      throw new Error("No image data found in the response");
    }

    const transformedBase64 = match[0];
    
    // Save the transformed image (in a real application, you would upload to cloud storage)
    // For this example, we'll just return the base64 string directly
    return transformedBase64;
  } catch (error) {
    console.error("Error transforming image:", error);
    // Update image status to failed
    await storage.updateImageStatus(imageId, "failed");
    throw error;
  }
}
