import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import ComparisonSlider from './ComparisonSlider';
import { Style } from '@/types';
import { getStyles } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { Check } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useTranslation } from 'react-i18next';

interface StyleSelectorProps {
  selectedStyle: string;
  onStyleSelect: (style: string) => void;
}

// 将风格名称转换为翻译键
const getStyleKey = (styleName: string): string => {
  const lowercaseName = styleName.toLowerCase();
  if (lowercaseName.includes('ghibli')) return 'ghibli';
  if (lowercaseName.includes('watercolor')) return 'watercolor';
  if (lowercaseName.includes('cyberpunk')) return 'cyberpunk';
  if (lowercaseName.includes('van gogh')) return 'vangogh';
  return styleName.toLowerCase().split(' ')[0];
};

export default function StyleSelector({ selectedStyle, onStyleSelect }: StyleSelectorProps) {
  const [styles, setStyles] = useState<Style[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { t } = useTranslation();

  useEffect(() => {
    const fetchStyles = async () => {
      try {
        const data = await getStyles();
        setStyles(data);
      } catch (error) {
        console.error('Failed to fetch styles:', error);
        toast({
          title: t('toast.error'),
          description: t('toast.styles.error'),
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchStyles();
  }, [toast, t]);

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="border-2 border-gray-200 p-4">
            <div className="flex items-start mb-3">
              <div className="flex-grow">
                <Skeleton className="h-4 w-32 mb-2" />
                <Skeleton className="h-3 w-48" />
              </div>
              <Skeleton className="w-6 h-6 rounded-full" />
            </div>
            <Skeleton className="aspect-video rounded-lg w-full" />
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
      {styles.map((style) => (
        <Card
          key={style.id}
          className={`border-2 ${
            selectedStyle === style.name
              ? 'border-primary bg-primary/5'
              : 'border-gray-200 hover:border-gray-300'
          } p-4 cursor-pointer transition-colors`}
          onClick={() => onStyleSelect(style.name)}
        >
          <CardContent className="p-0">
            <div className="flex items-start mb-3">
              <div className="flex-grow">
                <h3 className="font-poppins font-semibold">{t(`styles.${getStyleKey(style.name)}.name`)}</h3>
                <p className="text-sm text-gray-600">{t(`styles.${getStyleKey(style.name)}.description`)}</p>
              </div>
              <div className={`w-6 h-6 rounded-full ${
                selectedStyle === style.name ? 'bg-primary' : 'bg-gray-200'
              } flex items-center justify-center`}>
                {selectedStyle === style.name && (
                  <Check className="h-4 w-4 text-white" />
                )}
              </div>
            </div>
            <div className="aspect-video rounded-lg overflow-hidden bg-gray-100">
              <ComparisonSlider
                beforeImage={style.exampleBeforeUrl}
                afterImage={style.exampleAfterUrl}
              />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
