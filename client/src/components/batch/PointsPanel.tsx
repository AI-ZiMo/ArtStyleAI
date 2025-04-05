import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { formatPrice } from '@/lib/utils';
import { Package } from '@/types';
import { packageOptions } from '@/lib/utils';
import { purchasePackage } from '@/lib/api';
import { useUser } from '@/contexts/UserContext';
import { useToast } from '@/hooks/use-toast';
import { Check } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { TFunction } from 'i18next';

// 获取套餐翻译的辅助函数
const getPackageTranslation = (packageId: number, field: 'name' | 'description', t: TFunction): string => {
  const packageKeys = {
    1: 'basic',
    2: 'standard',
    3: 'premium',
    4: 'unlimited'
  };
  
  const key = packageKeys[packageId as keyof typeof packageKeys];
  if (key) {
    return t(`points.package.${key}.${field}`);
  }
  
  // 如果找不到翻译，返回默认值
  const defaultPackage = packageOptions.find(p => p.id === packageId);
  return field === 'name' ? defaultPackage?.name || '' : defaultPackage?.description || '';
};

export default function PointsPanel() {
  const { user, updateUser } = useUser();
  const { toast } = useToast();
  const { t } = useTranslation();
  const [selectedPackage, setSelectedPackage] = useState<number>(1); // Default to basic package
  const [loading, setLoading] = useState(false);

  if (!user) {
    return (
      <Card className="p-6 mb-6 sticky top-4">
        <CardContent className="p-0">
          <Skeleton className="h-7 w-44 mb-4" />
          <Skeleton className="h-12 w-24 mb-2" />
          <Skeleton className="h-4 w-36 mb-4" />
          <Skeleton className="h-4 w-full mb-2" />
          <Skeleton className="h-4 w-40 mb-4" />
          <Skeleton className="h-10 w-full mb-6" />
          
          <Skeleton className="h-7 w-48 mb-4" />
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-24 w-full mb-3" />
          ))}
          <Skeleton className="h-10 w-full mt-4" />
        </CardContent>
      </Card>
    );
  }

  const handlePackageSelect = (packageId: number) => {
    setSelectedPackage(packageId);
  };

  const handlePurchase = async () => {
    try {
      setLoading(true);
      const result = await purchasePackage(selectedPackage, user.email);
      
      // Update the user with new points
      updateUser(result.user);
      
      toast({
        title: t('toast.purchase.success'),
        description: t('toast.purchase.added') + result.pointsAdded + t('toast.purchase.points'),
        variant: 'default',
      });
    } catch (error) {
      console.error('Purchase failed:', error);
      toast({
        title: t('toast.purchase.failed'),
        description: t('toast.purchase.failed.description'),
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="p-6 mb-6 sticky top-4">
      <CardContent className="p-0">
        <div className="mb-6">
          <h3 className="font-poppins font-semibold text-xl mb-2">{t('points.title')}</h3>
          <div className="text-5xl font-poppins font-bold text-primary mb-2">{user.points}</div>
          <p className="text-gray-600 text-sm mb-4">{t('points.available')}</p>
          <div className="text-sm text-gray-600 mb-4">
            <p>{t('points.cost')}</p>
            <a href="#" className="text-primary font-medium hover:underline">{t('points.rules')}</a>
          </div>
          <Button 
            className="w-full bg-secondary hover:bg-secondary/90 mb-2"
            onClick={handlePurchase}
            disabled={loading}
          >
            {t('points.add')}
          </Button>
        </div>
        
        <div>
          <h3 className="font-poppins font-semibold text-xl mb-4">{t('points.package.title')}</h3>
          
          <div className="space-y-3">
            {packageOptions.map((pkg) => (
              <Card
                key={pkg.id}
                className={`border-2 ${
                  selectedPackage === pkg.id
                    ? 'border-primary bg-primary/5'
                    : 'border-gray-200 hover:border-gray-300'
                } p-4 cursor-pointer transition-colors`}
                onClick={() => handlePackageSelect(pkg.id)}
              >
                <CardContent className="p-0">
                  <div className="flex justify-between items-center mb-1">
                    <h4 className="font-medium">{getPackageTranslation(pkg.id, 'name', t)}</h4>
                    <span className="text-lg font-semibold">{formatPrice(pkg.price)}</span>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{getPackageTranslation(pkg.id, 'description', t)}</p>
                  <div className="text-sm text-primary font-medium">{pkg.points} {t('points.title')}</div>
                </CardContent>
              </Card>
            ))}
          </div>
          
          <Button 
            className="w-full mt-4"
            onClick={handlePurchase}
            disabled={loading}
          >
            {t('points.confirm')}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
