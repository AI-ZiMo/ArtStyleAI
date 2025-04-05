import OpenAI from "openai";
import fs from "fs";
import path from "path";
import { storage } from "./storage";

// Initialize OpenAI with API key and custom base URL
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY,
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
    console.log(`Transforming image ${imageId} with style: ${style}`);
    console.log(`Using prompt template: ${styleData.promptTemplate}`);
    
    // Enhance the prompt to explicitly instruct the model to return an image
    const enhancedPrompt = `${styleData.promptTemplate}\n\nIMPORTANT: Your response MUST include a transformed version of the provided image. Generate the image according to the style description above, then return it as a data URL in the format: "data:image/jpeg;base64,..." or "data:image/png;base64,...". The data URL should be on its own line in your response.`;
    
    console.log(`Enhanced prompt for image ${imageId}: ${enhancedPrompt.substring(0, 100)}...`);
    
    const response = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || "gpt-4o-image-vip", // Using the specified OpenAI vision model
      response_format: { type: "json_object" }, // 指定返回JSON格式
      messages: [
        {
          role: "system",
          content: "你是一个专业的图像处理AI。按照提供的风格描述转换图像，并将转换后的图像作为base64 URL返回。必须按照以下JSON格式返回响应：{\"prompt\": \"风格描述\", \"image\": \"data:image/jpeg;base64,...\"}"
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
              text: `${enhancedPrompt}\n\n重要提示：请将转换后的图像作为base64 URL返回，格式为JSON：{\"prompt\": \"风格描述\", \"image\": \"data:image/jpeg;base64,...\"}`
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
    
    // 尝试解析JSON响应（适应自定义API响应格式）
    let transformedBase64;
    
    // 首先检查是否有直接的图像数据URL
    if (content.includes("data:image")) {
      // 标准方式：从文本中提取图像URL
      const match = content.match(/data:image\/(jpeg|png|webp);base64,[^"'`\s]+/);
      if (match) {
        transformedBase64 = match[0];
        console.log(`Successfully extracted direct image data for image ${imageId}`);
      }
    }
    
    // 如果没有找到直接的图像数据，尝试解析为JSON
    if (!transformedBase64) {
      try {
        // 尝试清理内容中的markdown代码块（如果有的话）
        let cleanContent = content;
        if (content.includes("```")) {
          cleanContent = content.replace(/```(?:json)?([\s\S]*?)```/g, "$1").trim();
        }
        
        // 尝试解析JSON
        const jsonData = JSON.parse(cleanContent);
        console.log(`Successfully parsed JSON for image ${imageId}`, Object.keys(jsonData));
        
        // 检查JSON响应中是否有图像数据字段
        // 这里我们检查几种可能的字段名称
        const possibleImageFields = ["image", "imageUrl", "image_url", "url", "data", "base64", "result", "output"];
        
        for (const field of possibleImageFields) {
          if (jsonData[field] && typeof jsonData[field] === "string" && jsonData[field].includes("data:image")) {
            transformedBase64 = jsonData[field];
            console.log(`Found image data in JSON field: ${field}`);
            break;
          }
        }
        
        // 如果没有找到标准字段，但响应包含任何base64图像数据，也尝试提取
        if (!transformedBase64) {
          const jsonString = JSON.stringify(jsonData);
          const match = jsonString.match(/data:image\/(jpeg|png|webp);base64,[^"'`\s]+/);
          if (match) {
            transformedBase64 = match[0];
            console.log(`Found image data in JSON string representation`);
          }
        }
      } catch (error) {
        console.error(`Failed to parse JSON from content for image ${imageId}:`, error);
      }
    }
    
    // 如果仍然没有找到图像数据，则抛出错误
    if (!transformedBase64) {
      console.error(`No valid image data found in the response for image ${imageId}`);
      console.log(`Content preview: ${content.substring(0, 300)}...`);
      throw new Error("No valid image data found in the response");
    }
    
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
