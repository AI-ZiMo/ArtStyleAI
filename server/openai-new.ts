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
      model: process.env.OPENAI_MODEL || "gpt-4o-image", // Using the specified OpenAI vision model
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
          console.log(`完整的chunk内容: ${content}`);
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
    
    // 1.1 尝试提取base64编码的图像数据
    const base64Match = fullContent.match(/data:image\/(jpeg|png|webp);base64,[^"'`\s]+/);
    if (base64Match) {
      transformedBase64 = base64Match[0];
      console.log(`[✓] 成功: 直接从响应中提取到base64图像数据`);
      console.log(`[信息] 图像格式: ${base64Match[1]}`);
      console.log(`[信息] 图像数据长度: ${transformedBase64.length - transformedBase64.indexOf(',') - 1}字节`);
    } 
    // 1.2 尝试提取外部图像URL链接
    else {
      console.log(`[✗] 未找到base64图像数据，尝试查找外部图像URL...`);
      // 匹配格式如 ![file_xyz](https://example.com/image.png) 或直接的URL
      const urlMatch = fullContent.match(/!\[.*?\]\((https:\/\/[^\s\)]+)\)|https:\/\/\S+\.(?:png|jpe?g|gif|webp|svg)/i);
      
      if (urlMatch) {
        // 提取URL部分
        const imageUrl = urlMatch[1] || urlMatch[0];
        console.log(`[✓] 成功: 从响应中提取到图像URL链接`);
        console.log(`[信息] 图像URL: ${imageUrl}`);
        
        // 因为是URL，直接使用它
        transformedBase64 = imageUrl;
        console.log(`[✓] 成功: 已提取图像URL`);
      } else {
        console.log(`[✗] 失败: 未能从响应中提取图像URL或base64数据`);
      }
    }
    
    // 方法2: 尝试从响应中查找并解析JSON
    if (!transformedBase64) {
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
          } catch (parseError: any) {
            console.error(`[✗] JSON解析失败: ${parseError.message || '未知错误'}`);
            console.log(`[信息] 无效JSON内容预览: ${jsonString.substring(0, 200)}...`);
          }
        } else {
          console.log(`[✗] 未找到JSON格式数据`);
        }
      } catch (error: any) {
        console.error(`[✗] 内容解析过程出错: ${error.message || '未知错误'}`);
      }
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
    
    console.log(`=============== 图像数据提取结束 [图像ID: ${imageId}] ===============`);
    if (transformedBase64) {
      console.log(`[结果] 成功提取图像数据, 长度: ${transformedBase64.length}字节`);
    } else {
      console.log(`[结果] 未能提取图像数据`);
      // 打印完整内容以便调试
      console.log(`完整响应内容:\n${fullContent}`);
    }
    
    // 检查内容审核失败的情况
    if (!transformedBase64 && fullContent) {
      if (fullContent.toLowerCase().includes("input_moderation") || 
          fullContent.toLowerCase().includes("moderation") || 
          fullContent.toLowerCase().includes("failed") || 
          fullContent.toLowerCase().includes("failure")) {
        
        // 从响应中提取具体的失败原因
        let failureReason = "内容审核失败";
        const failureMatch = fullContent.match(/failure reason[：:]\s*([^\n]+)/i);
        if (failureMatch) {
          failureReason = failureMatch[1].trim();
        }
        
        console.error(`内容审核失败，原因: ${failureReason}`);
        await storage.updateImageStatus(imageId, "failed", undefined, `内容审核失败：${failureReason}`);
        throw new Error(`内容审核失败：${failureReason}`);
      }
    }
    
    // 如果仍然没有找到图像数据，则抛出错误
    if (!transformedBase64) {
      console.error(`No valid image data found in the response for image ${imageId}`);
      await storage.updateImageStatus(imageId, "failed", undefined, "无法从响应中提取有效图像数据");
      throw new Error("No valid image data found in the response");
    }
    
    // 检查是否是URL而不是base64数据
    if (transformedBase64.startsWith('http')) {
      console.log(`提取到的是图像URL，不是base64数据: ${transformedBase64.substring(0, 100)}...`);
      
      // 检查是否同时有下载链接
      const downloadMatch = fullContent.match(/\[下载⏬\]\((https:\/\/[^\s\)]+)\)/i);
      if (downloadMatch) {
        const downloadUrl = downloadMatch[1];
        console.log(`找到匹配的下载链接: ${downloadUrl}`);
        
        // 更新图像状态为已完成，使用URL作为转换后的URL
        await storage.updateImageStatus(imageId, "completed", transformedBase64);
        console.log(`Successfully saved image URL data for image ${imageId}`);
        return transformedBase64;
      }
      
      // 直接使用URL
      await storage.updateImageStatus(imageId, "completed", transformedBase64);
      console.log(`Successfully saved image URL for image ${imageId}`);
      return transformedBase64;
    }
    
    console.log(`Successfully extracted image data for image ${imageId}`);
    
    // 更新图像状态为已完成
    await storage.updateImageStatus(imageId, "completed", transformedBase64);
    
    // 返回提取的图像数据
    return transformedBase64;
  } catch (error: any) {
    console.error(`Error transforming image ${imageId}:`, error);
    
    // 提取详细错误信息
    let errorMessage = error.message || "未知错误";
    
    // Log detailed error information
    if (error.response) {
      // OpenAI API error response
      console.error(`OpenAI API Error Status: ${error.response.status}`);
      console.error(`Error message: ${JSON.stringify(error.response.data)}`);
      
      // 尝试从API错误响应中提取更有用的信息
      try {
        if (error.response.data && error.response.data.error) {
          if (error.response.data.error.message) {
            errorMessage = error.response.data.error.message;
          }
          if (error.response.data.error.code) {
            if (error.response.data.error.code === 'content_filter') {
              errorMessage = "内容审核失败。请尝试使用不同的图像或样式。";
            }
          }
        }
      } catch (e: any) {
        console.error(`Error parsing API error response: ${e.message || '未知错误'}`);
      }
    } else if (error.message) {
      console.error(`Error message: ${error.message}`);
      
      // 为特定错误设置友好的错误消息
      if (error.message.includes("moderation") || error.message.includes("content")) {
        errorMessage = "内容审核失败。请尝试使用不同的图像或样式。";
      } else if (error.message.includes("timeout") || error.message.includes("network")) {
        errorMessage = "网络连接超时。请稍后重试。";
      } else if (error.message.includes("No valid image")) {
        errorMessage = "无法生成有效的图像。请尝试其他图像或样式。";
      }
    }
    
    if (error.stack) {
      console.error(`Error stack: ${error.stack}`);
    }
    
    // Update image status to failed
    await storage.updateImageStatus(imageId, "failed", undefined, errorMessage);
    throw error;
  }
}