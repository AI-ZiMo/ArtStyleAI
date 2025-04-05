import OpenAI from "openai";
import fs from "fs";
import path from "path";
import { storage } from "./storage";

// Initialize OpenAI with API key
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY 
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
    console.log(`Transforming image ${imageId} with style: ${style}`);
    console.log(`Using prompt template: ${styleData.promptTemplate}`);
    
    // Enhance the prompt to explicitly instruct the model to return an image
    const enhancedPrompt = `${styleData.promptTemplate}\n\nIMPORTANT: Your response MUST include a transformed version of the provided image. Generate the image according to the style description above, then return it as a data URL in the format: "data:image/jpeg;base64,..." or "data:image/png;base64,...". The data URL should be on its own line in your response.`;
    
    console.log(`Enhanced prompt for image ${imageId}: ${enhancedPrompt.substring(0, 100)}...`);
    
    const response = await openai.chat.completions.create({
      model: "gpt-4o", // Using the latest OpenAI vision model
      messages: [
        {
          role: "system",
          content: "You are an expert image transformation AI. Your task is to transform the provided image according to the style description and return the transformed image as a data URL. Always return your response with a data:image base64 URL that contains the transformed image."
        },
        {
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
              text: enhancedPrompt
            },
          ]
        }
      ],
      max_tokens: 4096,
    });
    
    console.log(`Got response for image ${imageId}, status: ${response.choices[0]?.finish_reason || 'unknown'}`);
    

    // Extract the response content
    const content = response.choices[0].message.content;
    console.log(`Response content for image ${imageId} (truncated): ${content?.substring(0, 100)}...`);
    
    if (!content) {
      console.error(`Empty content received for image ${imageId}`);
      throw new Error("Failed to generate transformed image: Empty content received");
    }
    
    if (!content.includes("data:image")) {
      console.error(`No image data marker found in content for image ${imageId}`);
      console.log(`Content preview: ${content.substring(0, 200)}...`);
      throw new Error("Failed to generate transformed image: No image data marker found");
    }

    // Extract base64 from the response
    const match = content.match(/data:image\/(jpeg|png|webp);base64,[^"'`\s]+/);
    if (!match) {
      console.error(`Failed to extract base64 data from content for image ${imageId}`);
      console.log(`Content preview: ${content.substring(0, 200)}...`);
      throw new Error("No valid image data found in the response");
    }

    const transformedBase64 = match[0];
    console.log(`Successfully extracted image data for image ${imageId}`);
    
    
    // Save the transformed image (in a real application, you would upload to cloud storage)
    // For this example, we'll just return the base64 string directly
    return transformedBase64;
  } catch (error: any) {
    console.error(`Error transforming image ${imageId}:`, error);
    
    // Log detailed error information
    if (error.response) {
      // OpenAI API error response
      console.error(`OpenAI API Error Status: ${error.response.status}`);
      console.error(`Error message: ${JSON.stringify(error.response.data)}`);
    } else if (error.message) {
      console.error(`Error message: ${error.message}`);
    }
    
    if (error.stack) {
      console.error(`Error stack: ${error.stack}`);
    }
    
    // Update image status to failed
    await storage.updateImageStatus(imageId, "failed");
    throw error;
  }
}
