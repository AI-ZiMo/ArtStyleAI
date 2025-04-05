import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import ImageUploader from './ImageUploader';
import StyleSelector from './StyleSelector';
import PointsPanel from './PointsPanel';
import ImageGallery from './ImageGallery';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { UploadedFile } from '@/types';
import { uploadImages, transformImages } from '@/lib/api';
import { useUser } from '@/contexts/UserContext';
import { X, ArrowRight } from 'lucide-react';
import { Loader2 } from 'lucide-react';

export default function BatchGenerate() {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [selectedStyle, setSelectedStyle] = useState('Ghibli Anime Style');
  const [processing, setProcessing] = useState(false);
  const { toast } = useToast();
  const { user, refreshUser } = useUser();

  // Clean up previews when component unmounts
  useEffect(() => {
    return () => {
      uploadedFiles.forEach(file => URL.revokeObjectURL(file.preview));
    };
  }, [uploadedFiles]);

  const handleFilesSelected = (files: UploadedFile[]) => {
    // Clean up any existing previews
    uploadedFiles.forEach(file => URL.revokeObjectURL(file.preview));
    
    setUploadedFiles(files);
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
        title: 'Error',
        description: 'You must be logged in to transform images',
        variant: 'destructive',
      });
      return;
    }
    
    if (uploadedFiles.length === 0) {
      toast({
        title: 'No Images Selected',
        description: 'Please upload at least one image to transform',
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
        title: 'Transformation Started',
        description: `${uploadedFiles.length} image(s) are being processed. Check the history tab to see results.`,
      });
    } catch (error) {
      console.error('Transformation failed:', error);
      toast({
        title: 'Transformation Failed',
        description: 'An error occurred while processing your images',
        variant: 'destructive',
      });
    } finally {
      setProcessing(false);
    }
  };

  const pointCost = uploadedFiles.length * 10; // Each image costs 10 points

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-poppins font-bold mb-8">批量图片生成</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <Card className="mb-8">
            <CardContent className="p-6">
              <h2 className="font-poppins font-semibold text-2xl mb-4">批量上传照片</h2>
              <p className="text-gray-600 mb-6">最多可上传50张照片，每张照片 ¥1</p>
              
              <ImageUploader onFilesSelected={handleFilesSelected} />
              
              {uploadedFiles.length > 0 && (
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <div>
                      <span className="font-medium">已选择: </span>
                      <span>{uploadedFiles.length}/50 张照片</span>
                    </div>
                    <div className="text-right">
                      <span className="font-medium">总价: </span>
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
                      onClick={() => document.querySelector('input[type="file"]')?.click()}
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
              <h2 className="font-poppins font-semibold text-2xl mb-4">选择风格</h2>
              <p className="text-gray-600 mb-6">(所有图片将应用相同风格)</p>
              
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
                      处理中...
                    </>
                  ) : (
                    <>
                      <span>生成 {uploadedFiles.length} 张图片</span>
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
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
