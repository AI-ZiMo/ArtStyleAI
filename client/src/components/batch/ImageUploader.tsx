import { useState, useRef, ChangeEvent } from 'react';
import { UploadedFile } from '@/types';
import { validateFile, generateId } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface ImageUploaderProps {
  onFilesSelected: (files: UploadedFile[]) => void;
  maxFiles?: number;
}

export default function ImageUploader({ onFilesSelected, maxFiles = 50 }: ImageUploaderProps) {
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    
    // 清空错误信息
    setError(null);
    console.log('Selected files:', files.length);
    
    // 检查文件数量限制
    if (files.length > maxFiles) {
      setError(`最多可上传${maxFiles}张图片`);
      return;
    }
    
    // 处理选中的文件
    const processedFiles: UploadedFile[] = [];
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      // 验证文件
      const validation = validateFile(file);
      if (!validation.valid) {
        setError(validation.message);
        return;
      }
      
      // 创建UploadedFile对象
      const uploadedFile: UploadedFile = {
        ...file,
        id: generateId(),
        preview: URL.createObjectURL(file),
        name: file.name,
        size: file.size,
        type: file.type,
        lastModified: file.lastModified,
        slice: file.slice,
        stream: file.stream,
        text: file.text,
        arrayBuffer: file.arrayBuffer,
      };
      
      processedFiles.push(uploadedFile);
    }
    
    console.log('Processed files:', processedFiles.length);
    
    // 清空文件输入以便再次选择相同的文件
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    
    // 将处理后的文件传递给父组件
    onFilesSelected(processedFiles);
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
        className="border border-dashed rounded-md p-6 bg-gray-50 text-center hover:border-indigo-300 transition-colors cursor-pointer"
        onClick={openFileSelector}
        onDragOver={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
        onDrop={(e) => {
          e.preventDefault();
          e.stopPropagation();
          
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
        </div>
      </div>
    </div>
  );
}
