import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { UploadedFile } from '@/types';
import { validateFile, generateId } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Upload, XCircle, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useTranslation } from 'react-i18next';

interface ImageUploaderProps {
  onFilesSelected: (files: UploadedFile[]) => void;
  maxFiles?: number;
}

export default function ImageUploader({ onFilesSelected, maxFiles = 50 }: ImageUploaderProps) {
  const [error, setError] = useState<string | null>(null);
  const { t } = useTranslation();

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setError(null);
    
    // 由于现在是追加文件，需要确保不超过最大限制
    if (acceptedFiles.length > maxFiles) {
      setError(t('batch.upload.maxError', { max: maxFiles }));
      return;
    }
    
    // 验证和处理每个文件
    const processedFiles: UploadedFile[] = [];
    
    for (const file of acceptedFiles) {
      const validation = validateFile(file);
      
      if (!validation.valid) {
        setError(validation.message);
        return;
      }
      
      const uploadedFile = Object.assign(file, {
        id: generateId(),
        preview: URL.createObjectURL(file)
      });
      
      processedFiles.push(uploadedFile as UploadedFile);
    }
    
    // 将新文件传递给父组件，由父组件追加到现有文件列表中
    onFilesSelected(processedFiles);
  }, [maxFiles, onFilesSelected, t]);
  
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/jpeg': [],
      'image/png': [],
      'image/webp': []
    },
    maxSize: 5 * 1024 * 1024 // 5MB
  });

  return (
    <div className="w-full">
      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-8 bg-gray-50 text-center mb-6 ${
          isDragActive ? 'border-primary bg-primary/5' : 'border-gray-300'
        } hover:border-primary hover:bg-primary/5 transition-colors cursor-pointer`}
      >
        <input {...getInputProps()} />
        
        <div className="flex flex-col items-center justify-center">
          <div className="mb-3">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <div className="text-base font-medium text-gray-700 mb-2">
            {isDragActive ? '释放鼠标上传文件' : '浏览文件 或拖放图片至此处'}
          </div>
          <div className="text-sm text-gray-500 mb-4">
            支持PNG、JPG或WebP，最大5MB/张 (大图会自动压缩)
          </div>
          <Button 
            type="button" 
            variant="outline"
            className="border-dashed"
            onClick={(e) => {
              e.stopPropagation();
              const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
              if (fileInput) fileInput.click();
            }}
          >
            浏览文件
          </Button>
        </div>
      </div>
    </div>
  );
}
