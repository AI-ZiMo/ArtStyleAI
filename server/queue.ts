import { storage } from "./storage";
import { base64ToBuffer, transformImage } from "./openai-new";

// 任务队列接口
interface Task {
  id: number;      // 任务ID
  imageId: number; // 图片ID
  style: string;   // 处理风格
  userId: number;  // 用户ID
  priority: number; // 优先级（未来可扩展）
  createdAt: Date; // 创建时间
}

// 队列系统
class TaskQueue {
  private queue: Task[] = [];
  private isProcessing: boolean = false;
  private maxConcurrent: number = 1; // 设置允许同时处理的任务数量
  private currentProcessing: number = 0;
  private taskIdCounter: number = 1;

  // 添加任务到队列
  public addTask(imageId: number, style: string, userId: number, priority: number = 0): void {
    const task: Task = {
      id: this.taskIdCounter++,
      imageId,
      style,
      userId,
      priority,
      createdAt: new Date()
    };

    // 添加到队列
    this.queue.push(task);
    console.log(`添加任务到队列: 任务ID ${task.id}, 图片ID ${imageId}, 风格 ${style}`);
    console.log(`当前队列长度: ${this.queue.length}`);

    // 尝试开始处理队列
    this.processQueue();
  }

  // 处理队列
  private async processQueue(): Promise<void> {
    // 如果已经在处理，或队列为空，或已达到最大并发数，则返回
    if (this.isProcessing || this.queue.length === 0 || this.currentProcessing >= this.maxConcurrent) {
      return;
    }

    // 标记为正在处理
    this.isProcessing = true;
    this.currentProcessing++;

    try {
      // 按照优先级和创建时间排序（先处理高优先级的，同优先级按先进先出）
      this.queue.sort((a, b) => {
        if (a.priority !== b.priority) {
          return b.priority - a.priority; // 高优先级在前
        }
        return a.createdAt.getTime() - b.createdAt.getTime(); // 同优先级，先创建的在前
      });

      // 取出队首任务
      const task = this.queue.shift();
      if (!task) {
        this.isProcessing = false;
        this.currentProcessing--;
        return;
      }

      console.log(`开始处理任务: 任务ID ${task.id}, 图片ID ${task.imageId}, 风格 ${task.style}`);

      // 开始处理任务
      try {
        // 获取图像信息
        const image = await storage.getImage(task.imageId);
        if (!image) {
          console.error(`图片不存在: ID ${task.imageId}`);
          this.isProcessing = false;
          this.currentProcessing--;
          this.processQueue(); // 继续处理队列中的下一个任务
          return;
        }

        // 更新图像状态为处理中
        await storage.updateImageStatus(task.imageId, "processing");

        // 解析原始图像数据
        const buffer = base64ToBuffer(image.originalUrl);
        console.log(`成功解析图片 ${task.imageId} 为buffer, 大小: ${buffer.length} 字节`);

        // 转换图片
        console.log(`调用transformImage处理图片 ${task.imageId}...`);
        const transformedUrl = await transformImage(buffer, task.style, task.imageId);
        console.log(`图片 ${task.imageId} 转换完成`);

        // 更新图片状态为已完成
        await storage.updateImageStatus(task.imageId, "completed", transformedUrl);
        console.log(`图片 ${task.imageId} 状态更新为 "completed"`);
      } catch (error: any) {
        console.error(`处理任务时出错: 任务ID ${task.id}, 图片ID ${task.imageId}`, error);
        
        // 更新图片状态为失败
        const errorMessage = error.message || "未知错误";
        await storage.updateImageStatus(task.imageId, "failed", undefined, errorMessage);
        console.log(`图片 ${task.imageId} 状态更新为 "failed", 错误: ${errorMessage}`);
      }

      // 任务完成，减少当前处理数量
      this.currentProcessing--;

      // 继续处理队列中的下一个任务
      this.isProcessing = false;
      this.processQueue();
    } catch (error) {
      console.error('队列处理过程中发生错误:', error);
      this.isProcessing = false;
      this.currentProcessing--;
      this.processQueue(); // 尝试继续处理
    }
  }

  // 获取队列状态
  public getStatus(): { queueLength: number; processing: boolean; currentProcessing: number } {
    return {
      queueLength: this.queue.length,
      processing: this.isProcessing,
      currentProcessing: this.currentProcessing
    };
  }

  // 清空队列
  public clearQueue(): void {
    this.queue = [];
    console.log('任务队列已清空');
  }
}

// 创建和导出任务队列单例
export const taskQueue = new TaskQueue();