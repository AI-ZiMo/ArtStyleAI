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
        
        <div className="mb-6">
          <div className="flex justify-center mb-4">
            <Upload className="h-16 w-16 text-gray-400" />
          </div>
          <p className="text-lg font-medium text-gray-700 mb-1">
            {isDragActive ? t('batch.upload.drop') : t('batch.upload.drag')}
          </p>
          <p className="text-sm text-gray-500">
            {t('batch.upload.formats')}
          </p>
        </div>
        
        <Button>{t('batch.upload.browse')}</Button>
      </div>
    </div>
  );
}
