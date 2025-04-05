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
    
    // 记录请求详情
    console.log(`=============== OpenAI API 请求开始 [图像ID: ${imageId}] ===============`);
    console.log(`请求模型: ${process.env.OPENAI_MODEL || "gpt-4o-image-vip"}`);
    console.log(`请求基础URL: ${process.env.OPENAI_BASE_URL || "https://api.tu-zi.com/v1"}`);
    console.log(`提示词: ${enhancedPrompt}`);
    console.log(`流式请求: true`);
    console.log(`最大tokens: 4096`);
    
    // 准备记录时间
    const startTime = Date.now();
    console.log(`开始请求时间: ${new Date(startTime).toISOString()}`);
    
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

    console.log(`API请求已发送，等待流式响应...`);
    
    // 收集流式响应
    let fullContent = '';
    let chunkCount = 0;
    let lastLogTime = Date.now();
    const logInterval = 1000; // 每秒记录一次进度
    
    for await (const chunk of stream) {
      chunkCount++;
      const content = chunk.choices[0]?.delta?.content || '';
      const currentTime = Date.now();
      
      // 添加内容到完整响应
      fullContent += content;
      
      // 详细记录每个chunk的信息
      if (content) {
        // 避免日志过于频繁，超过logInterval时间间隔才记录
        if (currentTime - lastLogTime > logInterval) {
          console.log(`收到chunk #${chunkCount}: ${content.length}字节 [总计: ${fullContent.length}字节]`);
          console.log(`chunk内容预览: ${content.substring(0, Math.min(50, content.length))}${content.length > 50 ? '...' : ''}`);
          lastLogTime = currentTime;
        }
        
        // 记录找到的图像数据
        if (content.includes("data:image")) {
          console.log(`[重要] 在chunk #${chunkCount}中找到图像数据标记`);
          console.log(`图像数据出现在响应的第${fullContent.length - content.length + fullContent.lastIndexOf("data:image")}字节位置`);
        }
      }
    }
    
    // 计算总时间
    const endTime = Date.now();
    const totalTime = (endTime - startTime) / 1000;
    
    console.log(`=============== OpenAI API 请求完成 [图像ID: ${imageId}] ===============`);
    console.log(`总响应时间: ${totalTime.toFixed(2)}秒`);
    console.log(`接收到的总chunks数量: ${chunkCount}`);
    console.log(`接收到的总内容长度: ${fullContent.length}字节`);
    
    // 记录响应内容摘要（为避免日志过长，只显示前200和后200个字符）
    if (fullContent.length > 400) {
      console.log(`响应内容开头200字节: ${fullContent.substring(0, 200)}`);
      console.log(`响应内容结尾200字节: ${fullContent.substring(fullContent.length - 200)}`);
    } else {
      console.log(`完整响应内容: ${fullContent}`);
    }
    
    // 处理接收到的完整内容
    if (!fullContent) {
      console.error(`Empty content received for image ${imageId}`);
      throw new Error("Failed to generate transformed image: Empty content received");
    }
    
    // 提取图像数据
    console.log(`=============== 图像数据提取开始 [图像ID: ${imageId}] ===============`);
    let transformedBase64;
    
    // 方法1: 直接从文本中尝试提取图像URL
    console.log(`[方法1] 直接从完整响应中提取图像数据URL...`);
    const directMatch = fullContent.match(/data:image\/(jpeg|png|webp);base64,[^"'`\s]+/);
    if (directMatch) {
      transformedBase64 = directMatch[0];
      console.log(`[✓] 成功: 直接从响应中提取到图像数据`);
      console.log(`[信息] 图像格式: ${directMatch[1]}`);
      console.log(`[信息] 图像数据长度: ${transformedBase64.length - transformedBase64.indexOf(',') - 1}字节`);
    } else {
      console.log(`[✗] 失败: 未能直接从响应中提取图像数据`);
      
      // 方法2: 尝试从响应中查找并解析JSON
      console.log(`[方法2] 尝试从响应中解析JSON数据...`);
      try {
        // 检查内容是否包含JSON格式的字符串
        console.log(`[步骤2.1] 查找JSON格式字符串...`);
        const jsonMatch = fullContent.match(/{[\s\S]*}/);
        if (jsonMatch) {
          const jsonString = jsonMatch[0];
          console.log(`[✓] 找到潜在JSON数据: ${jsonString.substring(0, 100)}${jsonString.length > 100 ? '...' : ''}`);
          
          // 尝试解析JSON
          console.log(`[步骤2.2] 尝试解析JSON数据...`);
          try {
            const jsonData = JSON.parse(jsonString);
            console.log(`[✓] 成功解析JSON, 字段列表: ${Object.keys(jsonData).join(', ')}`);
            
            // 检查各种可能的字段名称
            console.log(`[步骤2.3] 在JSON字段中查找图像数据...`);
            const possibleImageFields = ["image", "imageUrl", "image_url", "url", "data", "base64", "result", "output"];
            console.log(`[信息] 检查的可能字段: ${possibleImageFields.join(', ')}`);
            
            for (const field of possibleImageFields) {
              console.log(`[检查] 字段 "${field}": ${jsonData[field] ? '存在' : '不存在'}`);
              if (jsonData[field] && typeof jsonData[field] === "string") {
                console.log(`[信息] 字段 "${field}" 内容类型: ${typeof jsonData[field]}, 长度: ${jsonData[field].length}`);
                if (jsonData[field].includes("data:image")) {
                  transformedBase64 = jsonData[field];
                  console.log(`[✓] 在JSON字段 "${field}" 中找到图像数据`);
                  break;
                } else {
                  console.log(`[✗] 字段 "${field}" 不包含图像数据`);
                }
              }
            }
            
            // 如果没有找到图像数据，在整个JSON字符串中搜索
            if (!transformedBase64) {
              console.log(`[步骤2.4] 在完整JSON字符串中搜索图像数据...`);
              const jsonImageMatch = jsonString.match(/data:image\/(jpeg|png|webp);base64,[^"'`\s]+/);
              if (jsonImageMatch) {
                transformedBase64 = jsonImageMatch[0];
                console.log(`[✓] 在JSON字符串中找到图像数据`);
                console.log(`[信息] 图像格式: ${jsonImageMatch[1]}`);
              } else {
                console.log(`[✗] 在JSON字符串中未找到图像数据`);
              }
            }
          } catch (parseError) {
            console.error(`[✗] JSON解析失败: ${parseError.message}`);
            console.log(`[信息] 无效JSON内容预览: ${jsonString.substring(0, 200)}...`);
          }
        } else {
          console.log(`[✗] 未找到JSON格式数据`);
        }
      } catch (error) {
        console.error(`[✗] 内容解析过程出错: ${error.message}`);
      }
      
      // 方法3: 尝试查找更宽松的图像数据模式
      if (!transformedBase64) {
        console.log(`[方法3] 使用更宽松的模式查找图像数据...`);
        // 查找任何可能的base64编码图像数据
        const looseMatch = fullContent.match(/base64,[a-zA-Z0-9+/=]+/);
        if (looseMatch) {
          // 添加适当的前缀
          transformedBase64 = `data:image/jpeg;${looseMatch[0]}`;
          console.log(`[✓] 使用宽松模式找到可能的图像数据`);
          console.log(`[警告] 这可能不是完整的图像数据URL格式`);
        } else {
          console.log(`[✗] 使用宽松模式也未找到图像数据`);
        }
      }
    }
    
    console.log(`=============== 图像数据提取结束 [图像ID: ${imageId}] ===============`);
    if (transformedBase64) {
      console.log(`[结果] 成功提取图像数据, 长度: ${transformedBase64.length}字节`);
    } else {
      console.log(`[结果] 未能提取图像数据`);
      // 打印完整内容以便调试
      console.log(`完整响应内容:\n${fullContent}`);
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
