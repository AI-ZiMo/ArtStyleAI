import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import ImageUploader from './ImageUploader';
import RechargeDialog from './RechargeDialog';
import ProcessingStatus from './ProcessingStatus';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { UploadedFile } from '@/types';
import { uploadImages, transformImages } from '@/lib/api';
import { useUser } from '@/contexts/UserContext';
import { X, ArrowRight } from 'lucide-react';
import { Loader2, Check } from 'lucide-react';

export default function BatchGenerate() {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedStyle, setSelectedStyle] = useState('Ghibli Anime Style');
  const [readyToProcess, setReadyToProcess] = useState(false);
  const [pendingImageIds, setPendingImageIds] = useState<number[]>([]);
  const [processing, setProcessing] = useState(false);
  const [showRechargeDialog, setShowRechargeDialog] = useState(false);
  const [showProcessingStatus, setShowProcessingStatus] = useState(false);
  const { toast } = useToast();
  const { user, refreshUser } = useUser();

  // Clean up previews when component unmounts
  useEffect(() => {
    return () => {
      uploadedFiles.forEach(file => URL.revokeObjectURL(file.preview));
    };
  }, [uploadedFiles]);

  const handleFilesSelected = async (files: UploadedFile[]) => {
    if (!user) {
      toast({
        title: "错误",
        description: "请先登录",
        variant: 'destructive',
      });
      return;
    }
    
    // 将新上传的文件添加到现有文件列表中，同时检查总数不超过最大限制
    let newFiles: UploadedFile[] = [];
    
    setUploadedFiles(prevFiles => {
      // 如果添加这些文件会导致总数超过50个，显示提示并只取前面的部分
      const combinedList = [...prevFiles, ...files];
      if (combinedList.length > 50) {
        toast({
          title: "警告",
          description: "最多可上传50张照片",
          variant: 'destructive',
        });
        newFiles = files.slice(0, 50 - prevFiles.length);
        return combinedList.slice(0, 50);
      }
      newFiles = files;
      return combinedList;
    });
    
    if (newFiles.length === 0) return;
    
    try {
      setIsUploading(true);
      
      // 标记新文件为正在上传状态
      setUploadedFiles(prevFiles => 
        prevFiles.map(file => ({
          ...file,
          isUploaded: newFiles.some(newFile => newFile.id === file.id) ? false : file.isUploaded
        }))
      );
      
      // 上传图片到服务器
      const uploadResult = await uploadImages(
        newFiles,
        selectedStyle,
        user.email
      );
      
      console.log('Upload successful:', uploadResult);
      
      // 标记新上传的文件为已上传
      setUploadedFiles(prevFiles => 
        prevFiles.map(file => ({
          ...file,
          isUploaded: newFiles.some(newFile => newFile.id === file.id) ? true : file.isUploaded
        }))
      );
      
      // 更新待处理图片ID列表
      const newImageIds = uploadResult.images.map(img => img.id);
      setPendingImageIds(prev => [...prev, ...newImageIds]);
      
      // 显示上传成功提示
      toast({
        title: "上传成功",
        description: `已上传 ${newFiles.length} 张图片`,
      });
      
    } catch (error) {
      console.error('Upload failed:', error);
      toast({
        title: "上传失败",
        description: "图片上传失败，请稍后重试",
        variant: 'destructive',
      });
      
      // 重置上传状态
      setUploadedFiles(prevFiles => 
        prevFiles.map(file => ({
          ...file,
          isUploaded: newFiles.some(newFile => newFile.id === file.id) ? false : file.isUploaded
        }))
      );
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveFile = (id: string) => {
    const fileToRemove = uploadedFiles.find(file => file.id === id);
    if (fileToRemove) {
      URL.revokeObjectURL(fileToRemove.preview);
    }
    
    setUploadedFiles(uploadedFiles.filter(file => file.id !== id));
  };

  // 重置上传界面
  const handleReupload = () => {
    setShowProcessingStatus(false);
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
    
    if (pendingImageIds.length === 0) {
      toast({
        title: "错误",
        description: "没有可处理的图片",
        variant: 'destructive',
      });
      return;
    }
    
    // 检查积分是否足够
    if (user.points < pendingImageIds.length) {
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
      setReadyToProcess(true);
      
      console.log('Starting transformation for images:', pendingImageIds);
      console.log('Using style:', selectedStyle);
      
      const transformResult = await transformImages(pendingImageIds, selectedStyle, user.email);
      console.log('Transformation initiated:', transformResult);
      
      // 刷新用户数据获取更新后的积分
      await refreshUser();
      
      // 清理文件预览并重置状态
      uploadedFiles.forEach(file => URL.revokeObjectURL(file.preview));
      setUploadedFiles([]);
      setPendingImageIds([]);
      
      toast({
        title: "处理启动",
        description: `已开始处理 ${pendingImageIds.length} 张图片`,
      });
      
      // 显示处理状态页面
      setShowProcessingStatus(true);
    } catch (error) {
      console.error('Transformation failed:', error);
      toast({
        title: "处理失败",
        description: "图片转换失败，请稍后重试",
        variant: 'destructive',
      });
      setReadyToProcess(false);
    } finally {
      setProcessing(false);
    }
  };

  // 添加一个测试按钮 - 实际使用时删除
  const testProcessingStatus = () => {
    setShowProcessingStatus(true);
  };

  // 如果正在显示处理状态页面，则渲染处理状态组件
  if (showProcessingStatus) {
    return <ProcessingStatus onReupload={handleReupload} />;
  }

  // 否则渲染上传页面
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
                          
                          {/* 上传状态指示器：加载中、已上传、错误 */}
                          {isUploading && !file.isUploaded ? (
                            // 加载中 - 显示旋转加载图标
                            <div className="absolute top-1 right-1 bg-indigo-500 text-white rounded-full p-1 shadow-sm animate-pulse">
                              <Loader2 className="h-3 w-3 animate-spin" />
                            </div>
                          ) : file.isUploaded ? (
                            // 已上传成功 - 显示绿色对勾
                            <div className="absolute top-1 right-1 bg-green-500 text-white rounded-full p-1 shadow-sm">
                              <Check className="h-3 w-3" />
                            </div>
                          ) : null}
                          
                          {/* 红色删除按钮 - 不管上传状态如何都显示 */}
                          <button 
                            className="absolute bottom-1 right-1 bg-red-500 text-white rounded-full p-1 shadow-sm"
                            onClick={() => handleRemoveFile(file.id)}
                            disabled={isUploading || processing}
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                    ))}
                    
                    {/* 添加新图片按钮 - 如果正在上传则禁用 */}
                    {!isUploading && !processing && (
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
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
          
          <Card className="mb-6 border border-gray-200">
            <CardContent className="p-6">
              <h2 className="font-semibold text-xl mb-2">选择风格 (所有图片将应用相同风格)</h2>
              <p className="text-gray-500 mb-4">为您的图片选择最合适的处理风格</p>
              
              {/* 风格选择器 */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
                <div 
                  className={`relative border rounded-lg p-4 cursor-pointer transition-all ${
                    selectedStyle === 'Ghibli Anime Style' 
                      ? 'border-indigo-700 bg-indigo-50' 
                      : 'border-gray-200 hover:border-indigo-300'
                  }`}
                  onClick={() => setSelectedStyle('Ghibli Anime Style')}
                >
                  {selectedStyle === 'Ghibli Anime Style' && (
                    <div className="absolute top-2 right-2 h-5 w-5 bg-indigo-700 rounded-full flex items-center justify-center">
                      <Check className="h-3 w-3 text-white" />
                    </div>
                  )}
                  <h3 className="font-medium text-base mb-1">吉卜力动画风格</h3>
                  <p className="text-sm text-gray-500">温暖、多彩的手绘风格，力求展现宫崎骏作品中的动画风格</p>
                </div>
                
                <div 
                  className={`relative border rounded-lg p-4 cursor-pointer transition-all ${
                    selectedStyle === 'Watercolor Art' 
                      ? 'border-indigo-700 bg-indigo-50' 
                      : 'border-gray-200 hover:border-indigo-300'
                  }`}
                  onClick={() => setSelectedStyle('Watercolor Art')}
                >
                  {selectedStyle === 'Watercolor Art' && (
                    <div className="absolute top-2 right-2 h-5 w-5 bg-indigo-700 rounded-full flex items-center justify-center">
                      <Check className="h-3 w-3 text-white" />
                    </div>
                  )}
                  <h3 className="font-medium text-base mb-1">水彩艺术风格</h3>
                  <p className="text-sm text-gray-500">柔和流畅的水彩画风格，带有优雅的手绘质感</p>
                </div>
              </div>
              
              <div className="flex flex-col items-end mt-4 border-t border-gray-100 pt-4">
                <div className="text-lg font-semibold mb-2">
                  待处理图片: <span className="text-indigo-700">{pendingImageIds.length}</span> 张 
                  {pendingImageIds.length > 0 && <span className="ml-3 text-green-600">（已上传）</span>}
                </div>
                <div className="text-sm text-gray-500 mb-3">费用：{pendingImageIds.length}张图片 × ¥1/张 = <span className="text-indigo-700 font-semibold">¥{pendingImageIds.length}.00</span></div>
                <Button
                  className="px-6 py-5 bg-green-600 hover:bg-green-700 text-white"
                  size="lg"
                  onClick={handleStartTransformation}
                  disabled={pendingImageIds.length === 0 || processing || !user}
                >
                  {processing ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      处理中...
                    </>
                  ) : (
                    <>
                      <span>开始处理</span>
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
                <p className="mb-2">风格转换消耗1积分/张</p>
                <p>
                  <a href="#" className="text-indigo-700 hover:underline">
                    查看详细积分规则
                  </a>
                </p>
                <button 
                  onClick={testProcessingStatus}
                  className="mt-4 w-full bg-amber-500 text-white py-2 px-4 rounded-md hover:bg-amber-600"
                >
                  测试处理状态页面
                </button>
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
