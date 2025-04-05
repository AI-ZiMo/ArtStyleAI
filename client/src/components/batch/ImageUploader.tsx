import { useState, useRef, ChangeEvent } from 'react';
import { UploadedFile } from '@/types';
import { validateFile, generateId } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { AlertCircle, Loader2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import imageCompression from 'browser-image-compression';

interface ImageUploaderProps {
  onFilesSelected: (files: UploadedFile[]) => void;
  maxFiles?: number;
}

export default function ImageUploader({ onFilesSelected, maxFiles = 50 }: ImageUploaderProps) {
  const [error, setError] = useState<string | null>(null);
  const [isCompressing, setIsCompressing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 图片压缩函数
  const compressImage = async (file: File): Promise<File> => {
    // 如果文件小于5MB，则不需要压缩
    if (file.size <= 5 * 1024 * 1024) {
      return file;
    }
    
    const options = {
      maxSizeMB: 5,              // 最大5MB
      maxWidthOrHeight: 1920,    // 最大宽高
      useWebWorker: true,        // 使用WebWorker进行压缩
      fileType: file.type        // 保持原始格式
    };
    
    try {
      const compressedFile = await imageCompression(file, options);
      console.log(`Compressed: ${file.size} -> ${compressedFile.size}, ${file.size/compressedFile.size}x smaller`);
      return compressedFile;
    } catch (error) {
      console.error("图片压缩失败:", error);
      return file; // 如果压缩失败，返回原始文件
    }
  };

  // 文件转base64函数
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });
  };

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    
    // 清空错误信息
    setError(null);
    setIsCompressing(true);
    console.log('Selected files:', files.length);
    
    try {
      // 检查文件数量限制，如果超过则只取前maxFiles个
      const fileArray = Array.from(files).slice(0, maxFiles);
      if (files.length > maxFiles) {
        setError(`已选择前${maxFiles}张照片，超出的被忽略`);
      }
      
      // 处理选中的文件
      const processedFiles: UploadedFile[] = [];
      
      for (let i = 0; i < fileArray.length; i++) {
        const file = fileArray[i];
        
        // 验证文件
        const validation = validateFile(file);
        if (!validation.valid) {
          setError(validation.message);
          continue; // 继续处理其他文件，而不是直接返回
        }
        
        // 压缩图片（如果需要）
        const compressedFile = await compressImage(file);
        
        // 转换为base64以便存储和传输
        const base64Data = await fileToBase64(compressedFile);
        
        // 创建UploadedFile对象
        const uploadedFile: UploadedFile = {
          ...compressedFile,
          id: generateId(),
          preview: URL.createObjectURL(compressedFile),
          name: file.name,
          size: compressedFile.size,
          type: compressedFile.type,
          lastModified: file.lastModified,
          slice: compressedFile.slice,
          stream: compressedFile.stream,
          text: compressedFile.text,
          arrayBuffer: compressedFile.arrayBuffer,
          base64Data: base64Data,  // 存储base64格式的图片数据
          isUploaded: false        // 初始设置为未上传
        };
        
        processedFiles.push(uploadedFile);
      }
      
      console.log('Processed files:', processedFiles.length);
      
      // 清空文件输入以便再次选择相同的文件
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      
      // 将处理后的文件传递给父组件
      if (processedFiles.length > 0) {
        onFilesSelected(processedFiles);
      }
    } catch (error) {
      console.error('处理文件时出错:', error);
      setError('处理文件时发生错误，请重试');
    } finally {
      setIsCompressing(false);
    }
  };

  // 触发文件选择对话框
  const openFileSelector = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <div className="w-full">
      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      {/* 隐藏的文件输入 */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/jpeg,image/png,image/webp"
        multiple
        className="hidden"
      />
      
      {/* 拖放区域 */}
      <div 
        className={`border border-dashed rounded-md p-6 bg-gray-50 text-center hover:border-indigo-300 transition-colors ${isCompressing ? 'cursor-not-allowed' : 'cursor-pointer'}`}
        onClick={!isCompressing ? openFileSelector : undefined}
        onDragOver={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
        onDrop={(e) => {
          e.preventDefault();
          e.stopPropagation();
          
          if (isCompressing) return;
          
          const files = e.dataTransfer.files;
          if (files && files.length > 0) {
            // 模拟文件输入变化
            const event = {
              target: {
                files
              }
            } as unknown as ChangeEvent<HTMLInputElement>;
            
            handleFileChange(event);
          }
        }}
      >
        <div className="flex flex-col items-center justify-center">
          {isCompressing ? (
            <>
              <Loader2 className="h-10 w-10 text-indigo-500 animate-spin mb-3" />
              <div className="text-sm font-medium text-gray-700 mb-2">
                正在处理图片...
              </div>
              <div className="text-xs text-gray-500">
                大图片需要压缩，请稍候
              </div>
            </>
          ) : (
            <>
              <div className="mb-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div className="text-sm font-medium text-gray-700 mb-2">
                浏览文件 或拖放图片至此处
              </div>
              <div className="text-xs text-gray-500 mb-3">
                支持PNG、JPG或WebP，最大5MB/张 (大图会自动压缩)
              </div>
              
              <Button 
                type="button"
                id="browsefile-btn"
                variant="secondary"
                size="sm"
                className="bg-white text-indigo-700 border border-indigo-300 hover:bg-indigo-50"
                onClick={(e) => {
                  e.stopPropagation();
                  openFileSelector();
                }}
              >
                浏览文件
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
