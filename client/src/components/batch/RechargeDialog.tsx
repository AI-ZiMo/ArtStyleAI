import { useState } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter,
  DialogClose
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Package } from '@/types';
import { purchasePackage } from '@/lib/api';
import { useUser } from '@/contexts/UserContext';
import { useToast } from '@/hooks/use-toast';
import { Check } from 'lucide-react';

// 充值套餐
const packages: Package[] = [
  {
    id: 1,
    name: '初级套餐',
    description: '适合小规模使用，10张照片处理额度',
    points: 100,
    price: 9.9
  },
  {
    id: 2,
    name: '标准套餐',
    description: '适合中等规模使用，50张照片处理额度',
    points: 500,
    price: 39.9
  },
  {
    id: 3,
    name: '高级套餐',
    description: '适合大规模使用，150张照片处理额度',
    points: 1500,
    price: 99.9
  }
];

interface RechargeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function RechargeDialog({ open, onOpenChange }: RechargeDialogProps) {
  const [selectedPackage, setSelectedPackage] = useState<number | null>(null);
  const [purchasing, setPurchasing] = useState(false);
  const { user, refreshUser } = useUser();
  const { toast } = useToast();

  const handlePurchase = async () => {
    if (!selectedPackage || !user) return;
    
    try {
      setPurchasing(true);
      
      const result = await purchasePackage(selectedPackage, user.email);
      
      // 更新用户数据
      await refreshUser();
      
      toast({
        title: '充值成功',
        description: `成功充值 ${result.pointsAdded} 积分`,
      });
      
      // 关闭对话框
      onOpenChange(false);
    } catch (error) {
      console.error('Purchase failed:', error);
      toast({
        title: '充值失败',
        description: '充值过程中出现错误，请稍后重试',
        variant: 'destructive',
      });
    } finally {
      setPurchasing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-2xl">充值积分</DialogTitle>
          <DialogDescription>
            选择适合您需求的充值套餐，充值后可立即使用
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-1 gap-4">
            {packages.map((pkg) => (
              <div 
                key={pkg.id}
                className={`relative border rounded-lg p-4 cursor-pointer transition-all ${
                  selectedPackage === pkg.id 
                    ? 'border-indigo-700 bg-indigo-50' 
                    : 'border-gray-200 hover:border-indigo-300'
                }`}
                onClick={() => setSelectedPackage(pkg.id)}
              >
                {selectedPackage === pkg.id && (
                  <div className="absolute top-3 right-3 h-5 w-5 bg-indigo-700 rounded-full flex items-center justify-center">
                    <Check className="h-3 w-3 text-white" />
                  </div>
                )}
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-medium text-lg">{pkg.name}</h3>
                    <p className="text-gray-500 text-sm mt-1">{pkg.description}</p>
                    <div className="mt-2 text-indigo-700 font-semibold">
                      {pkg.points} 积分
                    </div>
                  </div>
                  <div className="text-lg font-bold">
                    ¥{pkg.price}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <DialogFooter className="flex justify-between">
          <DialogClose asChild>
            <Button type="button" variant="outline">
              取消
            </Button>
          </DialogClose>
          <Button 
            onClick={handlePurchase}
            disabled={!selectedPackage || purchasing}
            className="bg-indigo-700 hover:bg-indigo-800"
          >
            {purchasing ? '处理中...' : '确认充值'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}