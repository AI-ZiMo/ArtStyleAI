import { useState, useEffect } from 'react';
import { useUser } from '@/contexts/UserContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { getQueueStatus, getUserImages } from '@/lib/api';
import { Image } from '@/types';
import { Clock, AlertCircle, CheckCircle, RotateCw, Upload, History } from 'lucide-react';
import { formatDate } from '@/lib/utils';

interface ProcessingStatusProps {
  onReupload: () => void;
}

export default function ProcessingStatus({ onReupload }: ProcessingStatusProps) {
  const [images, setImages] = useState<Image[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useUser();
  
  // 状态统计
  const [stats, setStats] = useState({
    completed: 0,
    processing: 0,
    pending: 0,
    failed: 0,
    total: 0
  });
  
  // 队列状态
  const [queueStatus, setQueueStatus] = useState({
    queueLength: 0,
    processing: false,
    currentProcessing: 0
  });

  // 获取用户图片和状态
  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      
      try {
        setIsLoading(true);
        
        // 获取用户图片
        const userImages = await getUserImages(user.email);
        setImages(userImages);
        
        // 计算各状态数量
        const completed = userImages.filter(img => img.status === 'completed').length;
        const processing = userImages.filter(img => img.status === 'processing').length;
        const pending = userImages.filter(img => img.status === 'pending').length;
        const failed = userImages.filter(img => img.status === 'failed').length;
        
        setStats({
          completed,
          processing,
          pending,
          failed,
          total: userImages.length
        });
        
        // 获取队列状态
        const queueData = await getQueueStatus();
        setQueueStatus(queueData);
      } catch (error) {
        console.error('Failed to fetch images:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
    
    // 每5秒自动刷新一次
    const intervalId = setInterval(fetchData, 5000);
    
    return () => clearInterval(intervalId);
  }, [user]);

  // 开始处理下一批图片（目前假设每次处理10张图片）
  const handleStartProcessing = async () => {
    // 这里会根据实际情况调用API来开始处理队列中的图片
    console.log('Starting to process images...');
  };

  // 生成当前日期时间
  const now = new Date();
  const formattedDate = formatDate(now);

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <h1 className="text-3xl font-bold mb-6">批量图片生成</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3">
          <Card className="mb-6 border border-gray-200">
            <CardContent className="p-6">
              <h2 className="font-semibold text-xl mb-4">处理状态</h2>
              <div className="mb-4">
                <div className="flex justify-between mb-2">
                  <span>已完成: {stats.completed}/{stats.total}</span>
                </div>
                <Progress value={(stats.completed / Math.max(stats.total, 1)) * 100} className="h-2" />
              </div>
              
              {/* 队列状态信息 */}
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg mb-4">
                <h3 className="font-medium text-amber-800 mb-2">系统队列状态</h3>
                <div className="grid grid-cols-3 gap-3">
                  <div className="text-center">
                    <div className="text-lg font-semibold text-amber-700">{queueStatus.queueLength}</div>
                    <div className="text-xs text-amber-600">等待中</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-semibold text-amber-700">{queueStatus.currentProcessing}</div>
                    <div className="text-xs text-amber-600">正在处理</div>
                  </div>
                  <div className="text-center">
                    <div className={`text-lg font-semibold ${queueStatus.processing ? 'text-green-600' : 'text-gray-500'}`}>
                      {queueStatus.processing ? '运行中' : '空闲'}
                    </div>
                    <div className="text-xs text-amber-600">系统状态</div>
                  </div>
                </div>
                
                {queueStatus.processing && (
                  <div className="mt-3 pt-3 border-t border-amber-200">
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-amber-800">
                        <span className="font-medium">当前处理:</span> 
                        <span className="ml-1">
                          图片 #{stats.processing > 0 ? images.find(img => img.status === 'processing')?.id || '...' : '...'}
                        </span>
                      </div>
                      <div className="flex items-center">
                        <span className="text-xs text-amber-600 mr-2">预计剩余时间:</span>
                        <span className="text-xs font-medium text-amber-800">
                          {queueStatus.queueLength === 0 
                            ? "处理完成中..." 
                            : `${Math.max(1, Math.round(queueStatus.queueLength * 1.5))}分钟`}
                        </span>
                      </div>
                    </div>
                    <div className="mt-1">
                      <div className="w-full bg-amber-200 rounded-full h-1.5 dark:bg-amber-700">
                        <div 
                          className="bg-amber-600 h-1.5 rounded-full transition-all duration-500"
                          style={{ width: `${Math.round(((stats.completed + stats.processing) / Math.max(stats.total, 1)) * 100)}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="grid grid-cols-4 gap-4 mb-6">
                <div className="flex flex-col items-center p-3 border rounded-md">
                  <div className="text-green-500 mb-1 flex items-center">
                    <CheckCircle className="h-4 w-4 mr-1" />
                    <span className="font-medium">{stats.completed}</span>
                  </div>
                  <span className="text-sm text-gray-500">已完成</span>
                </div>
                
                <div className="flex flex-col items-center p-3 border rounded-md">
                  <div className="text-amber-500 mb-1 flex items-center">
                    <RotateCw className="h-4 w-4 mr-1" />
                    <span className="font-medium">{stats.processing}</span>
                  </div>
                  <span className="text-sm text-gray-500">处理中</span>
                </div>
                
                <div className="flex flex-col items-center p-3 border rounded-md">
                  <div className="text-blue-500 mb-1 flex items-center">
                    <Clock className="h-4 w-4 mr-1" />
                    <span className="font-medium">{stats.pending}</span>
                  </div>
                  <span className="text-sm text-gray-500">等待中</span>
                </div>
                
                <div className="flex flex-col items-center p-3 border rounded-md">
                  <div className="text-red-500 mb-1 flex items-center">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    <span className="font-medium">{stats.failed}</span>
                  </div>
                  <span className="text-sm text-gray-500">失败</span>
                </div>
              </div>
              
              <div className="flex items-center text-gray-500 mb-4">
                <Clock className="h-4 w-4 mr-2" />
                <span>自动保存于: {formattedDate}</span>
              </div>
              
              <div className="flex flex-wrap gap-3 mb-3">
                <div className="flex items-center">
                  <span className="mr-2">每次处理图片数:</span>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    defaultValue="10"
                    className="w-20 rounded-md border border-gray-300 px-3 py-1"
                  />
                  <span className="ml-2 text-gray-500 text-sm">(须通过验证小于10)</span>
                </div>
              </div>
              
              <div className="flex flex-wrap gap-3">
                <Button 
                  onClick={handleStartProcessing}
                  className="bg-indigo-700 hover:bg-indigo-800"
                >
                  开始处理
                </Button>
                
                <Button 
                  variant="outline"
                  className="border-amber-500 text-amber-600 hover:bg-amber-50"
                >
                  继续生成
                </Button>
                
                <Button 
                  variant="outline"
                  className="border-gray-300 text-gray-700 hover:bg-gray-50"
                  onClick={onReupload}
                >
                  重新上传
                </Button>
              </div>
            </CardContent>
          </Card>
          
          {/* 图片列表 */}
          {images.length > 0 && (
            <div className="space-y-4">
              {images.map((image) => (
                <Card key={image.id} className="border border-gray-200">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex items-start gap-4">
                        <div className="w-28 h-28 flex-shrink-0 rounded-md overflow-hidden bg-gray-100 border border-gray-200">
                          <img 
                            src={image.originalUrl} 
                            className="w-full h-full object-cover" 
                            alt="Original" 
                          />
                        </div>
                        <div>
                          <div className="flex items-center mb-2">
                            <h3 className="font-medium">风格: {image.style}</h3>
                            <div className="ml-3 px-2 py-0.5 text-xs rounded-full bg-gray-100 text-gray-600">
                              {image.status === 'completed' && '已完成'}
                              {image.status === 'processing' && '处理中'}
                              {image.status === 'pending' && '等待中'}
                              {image.status === 'failed' && '失败'}
                            </div>
                          </div>
                          <p className="text-sm text-gray-500 mb-2">提交时间: {formatDate(new Date(image.createdAt))}</p>
                          {image.errorMessage && (
                            <p className="text-sm text-red-500">错误: {image.errorMessage}</p>
                          )}
                        </div>
                      </div>
                      
                      {image.status === 'completed' && image.transformedUrl && (
                        <a 
                          href={image.transformedUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-indigo-700 hover:underline text-sm flex items-center"
                        >
                          查看结果
                        </a>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
          
          {images.length === 0 && !isLoading && (
            <Card className="border border-gray-200 text-center">
              <CardContent className="p-8">
                <div className="text-gray-500">
                  暂无处理记录
                </div>
              </CardContent>
            </Card>
          )}
          
          <div className="mt-4 flex justify-center">
            <Button
              variant="outline"
              className="flex items-center gap-2"
            >
              <History className="h-4 w-4" />
              查看历史记录
            </Button>
          </div>
        </div>
        
        <div className="lg:col-span-1">
          <Card className="border border-gray-200">
            <CardContent className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="font-semibold text-xl">我的积分</h2>
                <Button 
                  className="bg-indigo-700 hover:bg-indigo-800 text-white"
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
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}