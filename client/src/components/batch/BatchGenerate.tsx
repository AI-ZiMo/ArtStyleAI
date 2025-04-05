import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import ImageUploader from './ImageUploader';
import StyleSelector from './StyleSelector';
import PointsPanel from './PointsPanel';
import ImageGallery from './ImageGallery';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { UploadedFile } from '@/types';
import { uploadImages, transformImages, getQueueStatus } from '@/lib/api';
import { useUser } from '@/contexts/UserContext';
import { X, ArrowRight, RefreshCw } from 'lucide-react';
import { Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';

export default function BatchGenerate() {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [selectedStyle, setSelectedStyle] = useState('Ghibli Anime Style');
  const [processing, setProcessing] = useState(false);
  const { toast } = useToast();
  const { user, refreshUser } = useUser();
  const { t } = useTranslation();

  // 获取队列状态
  const { data: queueStatus, isLoading: isLoadingQueue, refetch: refetchQueueStatus } = useQuery({
    queryKey: ['queueStatus'],
    queryFn: getQueueStatus,
    refetchInterval: 5000, // 每5秒自动刷新一次
  });

  // Clean up previews when component unmounts
  useEffect(() => {
    return () => {
      uploadedFiles.forEach(file => URL.revokeObjectURL(file.preview));
    };
  }, [uploadedFiles]);

  const handleFilesSelected = (files: UploadedFile[]) => {
    // 将新上传的文件添加到现有文件列表中，同时检查总数不超过最大限制
    setUploadedFiles(prevFiles => {
      // 如果添加这些文件会导致总数超过50个，显示提示并只取前面的部分
      const combinedList = [...prevFiles, ...files];
      if (combinedList.length > 50) {
        toast({
          title: t('toast.warning'),
          description: t('batch.upload.maxError', { max: 50 }),
          variant: 'warning',
        });
        return combinedList.slice(0, 50);
      }
      return combinedList;
    });
  };

  const handleRemoveFile = (id: string) => {
    const fileToRemove = uploadedFiles.find(file => file.id === id);
    if (fileToRemove) {
      URL.revokeObjectURL(fileToRemove.preview);
    }
    
    setUploadedFiles(uploadedFiles.filter(file => file.id !== id));
  };

  const handleStyleSelect = (style: string) => {
    setSelectedStyle(style);
  };

  const handleStartTransformation = async () => {
    if (!user) {
      toast({
        title: t('toast.error'),
        description: t('toast.transform.error'),
        variant: 'destructive',
      });
      return;
    }
    
    if (uploadedFiles.length === 0) {
      toast({
        title: t('toast.error'),
        description: t('toast.noImages.error'),
        variant: 'destructive',
      });
      return;
    }
    
    try {
      setProcessing(true);
      
      // First upload the images
      const uploadResult = await uploadImages(
        uploadedFiles,
        selectedStyle,
        user.email
      );
      
      // Then start the transformation process
      const imageIds = uploadResult.images.map(img => img.id);
      await transformImages(imageIds, selectedStyle, user.email);
      
      // Refresh user data to get updated points
      await refreshUser();
      
      // Clean up file previews
      uploadedFiles.forEach(file => URL.revokeObjectURL(file.preview));
      
      // Reset state
      setUploadedFiles([]);
      
      toast({
        title: t('toast.transform.start'),
        description: uploadedFiles.length + t('toast.transform.description'),
      });
    } catch (error) {
      console.error('Transformation failed:', error);
      toast({
        title: t('toast.transform.failed'),
        description: t('toast.transform.failed.description'),
        variant: 'destructive',
      });
    } finally {
      setProcessing(false);
    }
  };

  const pointCost = uploadedFiles.length * 10; // Each image costs 10 points

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-poppins font-bold mb-8">{t('batch.title')}</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <Card className="mb-8">
            <CardContent className="p-6">
              <h2 className="font-poppins font-semibold text-2xl mb-4">{t('batch.upload.title')}</h2>
              <p className="text-gray-600 mb-6">{t('batch.upload.description')}</p>
              
              <ImageUploader onFilesSelected={handleFilesSelected} />
              
              {uploadedFiles.length > 0 && (
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <div>
                      <span className="font-medium">{t('batch.upload.selected')} </span>
                      <span>{uploadedFiles.length}/50 {t('batch.images')}</span>
                    </div>
                    <div className="text-right">
                      <span className="font-medium">{t('batch.upload.price')} </span>
                      <span className="text-primary font-semibold">¥{uploadedFiles.length}.00</span>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mb-6">
                    {uploadedFiles.map((file) => (
                      <div key={file.id} className="relative group">
                        <div className="aspect-square rounded-lg overflow-hidden bg-gray-100 shadow-sm">
                          <img 
                            src={file.preview} 
                            className="w-full h-full object-cover" 
                            alt="Preview" 
                          />
                        </div>
                        <button 
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => handleRemoveFile(file.id)}
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                    
                    <div 
                      className="aspect-square rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center cursor-pointer hover:bg-gray-50 transition"
                      onClick={() => {
                        const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
                        if (fileInput) fileInput.click();
                      }}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
          
          <Card className="mb-8">
            <CardContent className="p-6">
              <h2 className="font-poppins font-semibold text-2xl mb-4">{t('batch.style.title')}</h2>
              <p className="text-gray-600 mb-6">{t('batch.style.description')}</p>
              
              <StyleSelector 
                selectedStyle={selectedStyle}
                onStyleSelect={handleStyleSelect}
              />
              
              <div className="flex justify-end">
                <Button
                  className="px-8 py-3"
                  onClick={handleStartTransformation}
                  disabled={uploadedFiles.length === 0 || processing || !user || (user?.points < pointCost)}
                >
                  {processing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {t('batch.processing')}
                    </>
                  ) : (
                    <>
                      <span>{t('batch.generate')} {uploadedFiles.length} {t('batch.images')}</span>
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
          
          {/* 成功提交后的提示信息，不显示详细队列状态 */}
          
          <Card>
            <CardContent className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="font-poppins font-semibold text-2xl">{t('batch.gallery.title')}</h2>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => refetchQueueStatus()}
                  className="flex items-center gap-1"
                >
                  <RefreshCw className="h-4 w-4" />
                  {t('batch.gallery.refresh')}
                </Button>
              </div>
              <ImageGallery />
            </CardContent>
          </Card>
        </div>
        
        <div className="lg:col-span-1">
          <PointsPanel />
        </div>
      </div>
    </div>
  );
}
