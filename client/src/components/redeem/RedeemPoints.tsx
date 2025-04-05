import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { redeemCode } from '@/lib/api';
import { useUser } from '@/contexts/UserContext';
import { useToast } from '@/hooks/use-toast';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Loader2 } from 'lucide-react';

const formSchema = z.object({
  code: z.string().min(1, { message: '请输入兑换码' }),
  email: z.string().email({ message: '请输入有效的邮箱地址' }),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export default function RedeemPoints() {
  const { user, updateUser } = useUser();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      code: '',
      email: user?.email || '',
      notes: '',
    },
  });

  const onSubmit = async (data: FormValues) => {
    try {
      setIsSubmitting(true);
      const result = await redeemCode(data.code, data.email);
      
      // Update user with new points
      updateUser(result.user);
      
      toast({
        title: '兑换成功',
        description: `成功添加 ${result.pointsAdded} 积分到您的账户`,
      });
      
      // Reset form
      form.reset({ 
        code: '', 
        email: data.email,
        notes: '' 
      });
    } catch (error) {
      console.error('Redemption failed:', error);
      toast({
        title: '兑换失败',
        description: '无效的兑换码或该兑换码已被使用',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-poppins font-bold mb-8">兑换积分</h1>
        <p className="text-gray-600 mb-8">输入您的兑换码，获取 Imagic AI 生成积分</p>
        
        <Card className="shadow-md">
          <CardContent className="p-6">
            <div className="text-center mb-8">
              <h2 className="text-xl font-semibold mb-2">请填写以下信息</h2>
            </div>
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="code"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>兑换码</FormLabel>
                      <FormControl>
                        <Input placeholder="输入兑换码" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>邮箱地址</FormLabel>
                      <FormControl>
                        <Input 
                          type="email" 
                          placeholder="用于绑定积分到该账户" 
                          {...field} 
                          disabled={!!user}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>备注 (可选)</FormLabel>
                      <FormControl>
                        <Input placeholder="您的备注" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      处理中...
                    </>
                  ) : '兑换积分'}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
