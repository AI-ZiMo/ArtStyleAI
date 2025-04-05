import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import ImageUploader from './ImageUploader';
import RechargeDialog from './RechargeDialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { UploadedFile } from '@/types';
import { uploadImages, transformImages } from '@/lib/api';
import { useUser } from '@/contexts/UserContext';
import { X, ArrowRight } from 'lucide-react';
import { Loader2, Check } from 'lucide-react';

export default function BatchGenerate() {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [selectedStyle, setSelectedStyle] = useState('宫崎骏风格');
  const [processing, setProcessing] = useState(false);
  const [showRechargeDialog, setShowRechargeDialog] = useState(false);
  const { toast } = useToast();
  const { user, refreshUser } = useUser();

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
          title: "警告",
          description: "最多可上传50张照片",
          variant: 'destructive',
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

  const handleStartTransformation = async () => {
    if (!user) {
      toast({
        title: "错误",
        description: "请先登录",
        variant: 'destructive',
      });
      return;
    }
    
    if (uploadedFiles.length === 0) {
      toast({
        title: "错误",
        description: "请先上传图片",
        variant: 'destructive',
      });
      return;
    }
    
    // 检查积分是否足够
    if (user.points < uploadedFiles.length) {
      toast({
        title: "积分不足",
        description: "您的积分不足，请充值后再试",
        variant: 'destructive',
      });
      // 显示充值对话框
      setShowRechargeDialog(true);
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
        title: "处理启动",
        description: `已开始处理 ${uploadedFiles.length} 张图片`,
      });
    } catch (error) {
      console.error('Transformation failed:', error);
      toast({
        title: "处理失败",
        description: "图片处理失败，请稍后重试",
        variant: 'destructive',
      });
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <h1 className="text-3xl font-bold mb-6">批量图片生成</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3">
          <Card className="mb-6 border border-gray-200">
            <CardContent className="p-6">
              <h2 className="font-semibold text-xl mb-2">批量上传照片</h2>
              <p className="text-gray-500 mb-4">最多可上传50张照片，每张照片 ¥1</p>
              
              <ImageUploader onFilesSelected={handleFilesSelected} />
              
              {uploadedFiles.length > 0 && (
                <div className="mt-4">
                  <div className="flex justify-between items-center mb-3 border-t border-gray-100 pt-3">
                    <div>
                      <span className="font-medium">已选择 </span>
                      <span>{uploadedFiles.length}/50 张照片</span>
                    </div>
                    <div className="text-right">
                      <span className="font-medium">总价: </span>
                      <span className="text-indigo-700 font-semibold">¥{uploadedFiles.length}.00</span>
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap gap-2 mb-4">
                    {uploadedFiles.map((file) => (
                      <div key={file.id} className="relative">
                        <div className="w-28 h-28 rounded-md overflow-hidden bg-gray-100 border border-gray-200">
                          <img 
                            src={file.preview} 
                            className="w-full h-full object-cover" 
                            alt="Preview" 
                          />
                          {/* 绿色对勾图标 */}
                          <div className="absolute top-1 right-1 bg-green-500 text-white rounded-full p-1 shadow-sm">
                            <Check className="h-3 w-3" />
                          </div>
                          {/* 红色删除按钮 */}
                          <button 
                            className="absolute bottom-1 right-1 bg-red-500 text-white rounded-full p-1 shadow-sm"
                            onClick={() => handleRemoveFile(file.id)}
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                    ))}
                    
                    {/* 添加新图片按钮 */}
                    <div 
                      className="w-28 h-28 rounded-md border-2 border-dashed border-gray-300 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 transition"
                      onClick={() => {
                        const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
                        if (fileInput) fileInput.click();
                      }}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-400 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
                      </svg>
                      <span className="text-xs text-gray-500">添加图片</span>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
          
          <Card className="mb-6 border border-gray-200">
            <CardContent className="p-6">
              <h2 className="font-semibold text-xl mb-2">选择风格 (所有图片将应用相同风格)</h2>
              <p className="text-gray-500 mb-4">为您的图片选择最合适的处理风格</p>
              
              {/* 简化的风格选择器 */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
                <div 
                  className={`relative border rounded-lg p-4 cursor-pointer transition-all ${
                    selectedStyle === '宫崎骏风格' 
                      ? 'border-indigo-700 bg-indigo-50' 
                      : 'border-gray-200 hover:border-indigo-300'
                  }`}
                  onClick={() => setSelectedStyle('宫崎骏风格')}
                >
                  {selectedStyle === '宫崎骏风格' && (
                    <div className="absolute top-2 right-2 h-5 w-5 bg-indigo-700 rounded-full flex items-center justify-center">
                      <Check className="h-3 w-3 text-white" />
                    </div>
                  )}
                  <h3 className="font-medium text-base mb-1">宫崎骏风格</h3>
                  <p className="text-sm text-gray-500">温暖、多彩的手绘风格，力求展现宫崎骏作品中的动画风格</p>
                </div>
                
                <div 
                  className={`relative border rounded-lg p-4 cursor-pointer transition-all ${
                    selectedStyle === '人物包装盒' 
                      ? 'border-indigo-700 bg-indigo-50' 
                      : 'border-gray-200 hover:border-indigo-300'
                  }`}
                  onClick={() => setSelectedStyle('人物包装盒')}
                >
                  {selectedStyle === '人物包装盒' && (
                    <div className="absolute top-2 right-2 h-5 w-5 bg-indigo-700 rounded-full flex items-center justify-center">
                      <Check className="h-3 w-3 text-white" />
                    </div>
                  )}
                  <h3 className="font-medium text-base mb-1">人物包装盒</h3>
                  <p className="text-sm text-gray-500">将人物设计成适合真实的仿人偶包装盒</p>
                </div>
              </div>
              
              <div className="flex flex-col items-end mt-4 border-t border-gray-100 pt-4">
                <div className="text-lg font-semibold mb-2">总计: <span className="text-indigo-700">¥{uploadedFiles.length}.00</span></div>
                <div className="text-sm text-gray-500 mb-3">{uploadedFiles.length}张图片 × ¥1/张</div>
                <Button
                  className="px-6 py-5 bg-indigo-700 hover:bg-indigo-800 text-white"
                  size="lg"
                  onClick={handleStartTransformation}
                  disabled={uploadedFiles.length === 0 || processing || !user}
                >
                  {processing ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      处理中...
                    </>
                  ) : (
                    <>
                      <span>提交图片</span>
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <div className="lg:col-span-1">
          <Card className="border border-gray-200">
            <CardContent className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="font-semibold text-xl">我的积分</h2>
                <Button 
                  className="bg-indigo-700 hover:bg-indigo-800 text-white"
                  onClick={() => setShowRechargeDialog(true)}
                >
                  充值
                </Button>
              </div>
              
              <div className="text-center py-4">
                <div className="text-5xl font-bold text-indigo-700 mb-1">{user?.points || 0}</div>
                <div className="text-gray-500 text-sm">可用积分</div>
              </div>
              
              <div className="mt-4 text-sm text-gray-600">
                <p className="mb-2">风格转换消耗10积分/张</p>
                <p>
                  <a href="#" className="text-indigo-700 hover:underline">
                    查看详细积分规则
                  </a>
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      
      {/* 充值对话框 */}
      <RechargeDialog 
        open={showRechargeDialog} 
        onOpenChange={setShowRechargeDialog} 
      />
    </div>
  );
}
