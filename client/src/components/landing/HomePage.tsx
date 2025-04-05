import { Button } from '@/components/ui/button';
import { useLocation } from 'wouter';
import { imageStyles } from '@/lib/utils';
import ComparisonSlider from '@/components/batch/ComparisonSlider';

export default function HomePage() {
  const [, setLocation] = useLocation();

  return (
    <div>
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary/90 to-primary py-16 text-white mb-10">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-3xl mx-auto">
            <h1 className="font-poppins font-bold text-4xl md:text-5xl mb-4">一键将照片转换为吉卜力动画风格</h1>
            <p className="text-lg opacity-90 mb-8">
              Transform your photos into beautiful Ghibli anime style with our AI technology. 
              Limited time offer only $0.15 per image, try it now!
            </p>
            <div className="flex justify-center space-x-4">
              <Button
                className="bg-white text-primary hover:bg-white/90"
                size="lg"
                onClick={() => setLocation('/batch-generate')}
              >
                开始体验
              </Button>
              <Button
                variant="outline"
                className="border-white text-white hover:bg-white/10"
                size="lg"
                onClick={() => setLocation('/history')}
              >
                查看价格
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-poppins font-bold text-center mb-12">为什么选择 Imagic</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="flex flex-col items-center text-center">
            <div className="bg-primary/10 rounded-full p-4 mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-2">先进的AI转换技术</h3>
            <p className="text-gray-600">精确捕捉上千种动画艺术风格，将您的照片转换为宫崎骏的艺术作品</p>
          </div>
          
          <div className="flex flex-col items-center text-center">
            <div className="bg-primary/10 rounded-full p-4 mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-2">快速处理，即时交付</h3>
            <p className="text-gray-600">仅需几秒钟，即可获得高质量的吉卜力风格图像，无需等待</p>
          </div>
          
          <div className="flex flex-col items-center text-center">
            <div className="bg-primary/10 rounded-full p-4 mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-2">安全可靠的处理</h3>
            <p className="text-gray-600">保护您的隐私，所有图像处理在安全的云环境中，并且不会保存您的原始照片</p>
          </div>
        </div>
      </section>

      {/* Examples Section */}
      <section className="bg-gray-50 py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-poppins font-bold text-center mb-4">惊人的转换效果</h2>
          <p className="text-center text-gray-600 mb-12 max-w-2xl mx-auto">
            使用我们的AI技术，将您的照片变成吉卜力风格的动画作品，流畅自然的转换效果让您惊叹
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {imageStyles.map((style, idx) => (
              <div key={idx} className="bg-white rounded-lg overflow-hidden shadow-lg">
                <div className="aspect-video relative">
                  <ComparisonSlider
                    beforeImage={style.beforeImage}
                    afterImage={style.afterImage}
                  />
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-lg mb-1">{style.name}</h3>
                  <p className="text-gray-600 text-sm">{style.description}</p>
                </div>
              </div>
            ))}
          </div>
          
          <div className="text-center mt-12">
            <Button 
              size="lg"
              onClick={() => setLocation('/batch-generate')}
            >
              开始制作您的动画风格照片
            </Button>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="container mx-auto px-4 py-16 text-center">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <div className="text-5xl font-bold text-primary mb-2">10K+</div>
            <p className="text-gray-600">用户</p>
          </div>
          
          <div>
            <div className="text-5xl font-bold text-primary mb-2">50K+</div>
            <p className="text-gray-600">生成图像</p>
          </div>
          
          <div>
            <div className="text-5xl font-bold text-primary mb-2">4.9</div>
            <p className="text-gray-600">平均评分</p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-primary py-16 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-poppins font-bold mb-4">准备好体验吉卜力风格了吗？</h2>
          <p className="text-xl opacity-90 mb-8 max-w-2xl mx-auto">
            立即上传您的照片，让AI将它们转换成迷人的吉卜力风格动画
          </p>
          <Button 
            size="lg" 
            className="bg-white text-primary hover:bg-white/90"
            onClick={() => setLocation('/batch-generate')}
          >
            立即开始
          </Button>
        </div>
      </section>
    </div>
  );
}
