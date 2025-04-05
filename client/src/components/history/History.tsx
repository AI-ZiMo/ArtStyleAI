import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Image } from '@/types';
import { getUserImages, downloadImage } from '@/lib/api';
import { useUser } from '@/contexts/UserContext';
import { Skeleton } from '@/components/ui/skeleton';
import { Download, RefreshCw, Clock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { formatDate } from '@/lib/utils';
import { useLocation } from 'wouter';

export default function History() {
  const { user } = useUser();
  const [images, setImages] = useState<Image[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  useEffect(() => {
    const fetchImages = async () => {
      if (!user) return;
      
      try {
        setLoading(true);
        const data = await getUserImages(user.email);
        setImages(data);
      } catch (error) {
        console.error('Failed to fetch images:', error);
        toast({
          title: 'Error',
          description: 'Failed to load your generated images',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchImages();
  }, [user, toast]);

  const handleRefresh = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const data = await getUserImages(user.email);
      setImages(data);
      
      toast({
        title: 'Refreshed',
        description: 'Your image history has been updated',
      });
    } catch (error) {
      console.error('Failed to refresh images:', error);
      toast({
        title: 'Error',
        description: 'Failed to refresh image history',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = (image: Image) => {
    if (!image.transformedUrl) return;
    
    try {
      downloadImage(
        image.transformedUrl,
        `transformed-image-${image.id}.png`
      );
      
      toast({
        title: 'Download Started',
        description: 'Your image is being downloaded',
      });
    } catch (error) {
      console.error('Download failed:', error);
      toast({
        title: 'Download Failed',
        description: 'Failed to download the image',
        variant: 'destructive',
      });
    }
  };

  const filteredImages = activeTab === 'all' 
    ? images 
    : images.filter(image => image.status === activeTab);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-poppins font-bold">生成历史记录</h1>
        <Button 
          variant="outline" 
          onClick={handleRefresh}
          disabled={loading}
          className="flex items-center gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          刷新
        </Button>
      </div>
      
      <Card className="mb-8">
        <CardContent className="p-6">
          <p className="text-gray-600 mb-6">查看您之前生成的所有图片</p>
          
          <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-6">
              <TabsTrigger value="all">全部</TabsTrigger>
              <TabsTrigger value="pending">等待中</TabsTrigger>
              <TabsTrigger value="processing">处理中</TabsTrigger>
              <TabsTrigger value="completed">已完成</TabsTrigger>
              <TabsTrigger value="failed">失败</TabsTrigger>
            </TabsList>
            
            <TabsContent value={activeTab}>
              {loading ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                    <div key={i}>
                      <Skeleton className="aspect-square rounded-lg mb-2" />
                      <Skeleton className="h-4 w-24 mb-1" />
                      <Skeleton className="h-4 w-32" />
                    </div>
                  ))}
                </div>
              ) : filteredImages.length === 0 ? (
                <div className="text-center py-16">
                  <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-700 mb-2">暂无历史记录</h3>
                  <p className="text-gray-500 mb-6">您还没有生成任何图片或没有{activeTab !== 'all' ? `${activeTab}状态的` : ''}图片</p>
                  <Button onClick={() => setLocation('/batch-generate')}>
                    开始创建
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                  {filteredImages.map((image) => (
                    <div key={image.id} className="group">
                      <div className="aspect-square rounded-lg overflow-hidden bg-gray-100 shadow-sm mb-2 relative">
                        {image.status === 'completed' && image.transformedUrl ? (
                          <>
                            <img 
                              src={image.transformedUrl} 
                              className="w-full h-full object-cover" 
                              alt="Generated image" 
                            />
                            <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <Button
                                size="icon"
                                variant="outline"
                                className="bg-white text-primary rounded-full p-2 transform transition-transform group-hover:scale-110"
                                onClick={() => handleDownload(image)}
                              >
                                <Download className="h-6 w-6" />
                              </Button>
                            </div>
                          </>
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gray-100">
                            {image.status === 'pending' && (
                              <div className="text-center text-gray-500">
                                <Clock className="h-8 w-8 mx-auto mb-2" />
                                <p>等待处理</p>
                              </div>
                            )}
                            {image.status === 'processing' && (
                              <div className="text-center text-primary">
                                <Loader2 className="h-8 w-8 mx-auto mb-2 animate-spin" />
                                <p>处理中</p>
                              </div>
                            )}
                            {image.status === 'failed' && (
                              <div className="text-center text-red-500">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                                <p>处理失败</p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                      <div className="text-sm font-medium">{image.style}</div>
                      <div className="text-sm text-gray-500">
                        {formatDate(image.createdAt)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
