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

    console.log(`Transforming image ${imageId} with style: ${style}`);
    console.log(`Using prompt template: ${styleData.promptTemplate}`);
    
    // 简化提示，不再添加复杂的指令
    const enhancedPrompt = styleData.promptTemplate;
    
    console.log(`Starting stream request for image ${imageId}...`);
    
    // 使用流式调用接收响应
    const stream = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || "gpt-4o-image-vip", // Using the specified OpenAI vision model
      messages: [
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
      stream: true,
      max_tokens: 4096,
    });

    // 收集流式响应
    let fullContent = '';
    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content || '';
      fullContent += content;
      
      // 每接收一段数据，就检查是否包含图像数据
      if (content.includes("data:image")) {
        console.log(`Found image data marker in stream chunk for image ${imageId}`);
      }
    }
    
    console.log(`Completed stream for image ${imageId}, total content length: ${fullContent.length}`);
    
    // 处理接收到的完整内容
    if (!fullContent) {
      console.error(`Empty content received for image ${imageId}`);
      throw new Error("Failed to generate transformed image: Empty content received");
    }
    
    // 提取图像数据
    let transformedBase64;
    
    // 直接从文本中尝试提取图像URL
    const directMatch = fullContent.match(/data:image\/(jpeg|png|webp);base64,[^"'`\s]+/);
    if (directMatch) {
      transformedBase64 = directMatch[0];
      console.log(`Successfully extracted direct image data for image ${imageId}`);
    } else {
      console.log(`No direct image data found for image ${imageId}, trying to parse content...`);
      console.log(`Content preview: ${fullContent.substring(0, 200)}...`);
      
      // 尝试从可能的JSON中提取
      try {
        // 检查内容是否包含JSON格式的字符串
        const jsonMatch = fullContent.match(/{[\s\S]*}/);
        if (jsonMatch) {
          const jsonString = jsonMatch[0];
          console.log(`Found potential JSON data: ${jsonString.substring(0, 100)}...`);
          
          // 尝试解析JSON
          const jsonData = JSON.parse(jsonString);
          
          // 检查各种可能的字段名称
          const possibleImageFields = ["image", "imageUrl", "image_url", "url", "data", "base64", "result", "output"];
          for (const field of possibleImageFields) {
            if (jsonData[field] && typeof jsonData[field] === "string" && jsonData[field].includes("data:image")) {
              transformedBase64 = jsonData[field];
              console.log(`Found image data in JSON field: ${field}`);
              break;
            }
          }
          
          // 如果没有找到图像数据，在整个JSON字符串中搜索
          if (!transformedBase64) {
            const jsonImageMatch = jsonString.match(/data:image\/(jpeg|png|webp);base64,[^"'`\s]+/);
            if (jsonImageMatch) {
              transformedBase64 = jsonImageMatch[0];
              console.log(`Found image data in JSON string`);
            }
          }
        }
      } catch (error) {
        console.error(`Failed to parse content for image ${imageId}:`, error);
      }
    }
    
    // 如果仍然没有找到图像数据，则抛出错误
    if (!transformedBase64) {
      console.error(`No valid image data found in the response for image ${imageId}`);
      throw new Error("No valid image data found in the response");
    }
    
    console.log(`Successfully extracted image data for image ${imageId}`);
    
    // 返回提取的图像数据
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
