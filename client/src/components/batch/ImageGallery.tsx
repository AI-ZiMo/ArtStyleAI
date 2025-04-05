import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Image } from '@/types';
import { getUserImages, downloadImage } from '@/lib/api';
import { useUser } from '@/contexts/UserContext';
import { Skeleton } from '@/components/ui/skeleton';
import { Download, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { formatDate } from '@/lib/utils';
import { useLocation } from 'wouter';

export default function ImageGallery() {
  const { user } = useUser();
  const [images, setImages] = useState<Image[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  useEffect(() => {
    const fetchImages = async () => {
      if (!user) return;
      
      try {
        setLoading(true);
        const data = await getUserImages(user.email);
        
        // Only show completed images in the gallery
        const completedImages = data.filter(
          (image) => image.status === 'completed' && image.transformedUrl
        );
        
        // Limit to the latest 8 images for the gallery view
        setImages(completedImages.slice(0, 8));
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

  const handleViewHistory = () => {
    setLocation('/history');
  };

  if (loading) {
    return (
      <div>
        <div className="flex justify-between items-center mb-6">
          <div>
            <Skeleton className="h-8 w-64 mb-2" />
            <Skeleton className="h-5 w-96" />
          </div>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i}>
              <Skeleton className="aspect-square rounded-lg mb-2" />
              <Skeleton className="h-4 w-24" />
            </div>
          ))}
        </div>
        
        <div className="flex justify-center">
          <Skeleton className="h-10 w-32" />
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="font-poppins font-semibold text-2xl mb-4">Previously Generated Images</h2>
          <p className="text-gray-600 mb-6">Your recent transformations are displayed here. Click on any image to download.</p>
        </div>
        
        {images.length > 0 && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => setLoading(true)}
            className="flex items-center gap-1"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Refresh</span>
          </Button>
        )}
      </div>
      
      {images.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
          <p className="text-gray-500 mb-4">You haven't generated any images yet</p>
          <Button
            variant="outline"
            onClick={() => setLocation('/batch-generate')}
          >
            Start Creating
          </Button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-6">
            {images.map((image) => (
              <div key={image.id} className="group">
                <div className="aspect-square rounded-lg overflow-hidden bg-gray-100 shadow-sm mb-2 relative">
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
                </div>
                <div className="text-sm text-gray-600">
                  Generated on {formatDate(image.createdAt)}
                </div>
              </div>
            ))}
          </div>
          
          <div className="flex justify-center">
            <Button
              variant="secondary"
              className="bg-gray-100 text-gray-700 hover:bg-gray-200"
              onClick={handleViewHistory}
            >
              View All History
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
