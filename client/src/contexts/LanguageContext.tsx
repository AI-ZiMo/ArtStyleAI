import { createContext, useContext, useState, ReactNode, useEffect } from 'react';

// Define language type
export type Language = 'en' | 'zh';

// Define language context properties
interface LanguageContextType {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (key: string) => string;
}

// Create language context
const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// Define translations type
type TranslationSet = Record<string, string>;

// Define translations
export const translations: Record<Language, TranslationSet> = {
  en: {
    // NavBar
    'nav.home': 'Home',
    'nav.batchGenerate': 'Batch Generate',
    'nav.redeemPoints': 'Redeem Points',
    'nav.history': 'History',
    'nav.logout': 'Logout',
    
    // HomePage
    'home.hero.title': 'Transform Photos into Ghibli Anime Style with One Click',
    'home.hero.description': 'Transform your photos into beautiful Ghibli anime style with our AI technology. Limited time offer only $0.15 per image, try it now!',
    'home.hero.startButton': 'Get Started',
    'home.hero.priceButton': 'View Pricing',
    'home.features.title': 'Why Choose Imagic',
    'home.features.ai.title': 'Advanced AI Transformation',
    'home.features.ai.description': 'Accurately captures thousands of anime art styles, transforming your photos into Miyazaki-style artwork',
    'home.features.speed.title': 'Fast Processing, Instant Delivery',
    'home.features.speed.description': 'Get high-quality Ghibli-style images in just seconds, no waiting required',
    'home.features.security.title': 'Secure Processing',
    'home.features.security.description': 'Protecting your privacy, all image processing happens in a secure cloud environment, and we don\'t store your original photos',
    'home.examples.title': 'Amazing Transformation Results',
    'home.examples.description': 'With our AI technology, transform your photos into Ghibli-style animations with smooth, natural conversion effects that will amaze you',
    'home.stats.users': 'Users',
    'home.stats.images': 'Generated Images',
    'home.stats.rating': 'Average Rating',
    'home.cta.title': 'Ready to Experience Ghibli Style?',
    'home.cta.description': 'Upload your photos now and let AI transform them into charming Ghibli-style animations',
    'home.cta.button': 'Start Now',
    
    // BatchGenerate
    'batch.title': 'Batch Image Generation',
    'batch.upload.title': 'Batch Upload Photos',
    'batch.upload.description': 'Upload up to 50 photos, $1 per photo',
    'batch.upload.drag': 'Drag images here or click to browse',
    'batch.upload.drop': 'Drop images here',
    'batch.upload.formats': 'Supports PNG, JPG or WebP (max 5MB per image)',
    'batch.upload.selected': 'Selected:',
    'batch.upload.price': 'Total Price:',
    'batch.style.title': 'Select Style',
    'batch.style.description': '(All images will apply the same style)',
    'batch.generate': 'Generate',
    'batch.processing': 'Processing...',
    'batch.images': 'images',
    
    // Points Panel
    'points.title': 'My Points',
    'points.available': 'Available points',
    'points.cost': 'Style transformation costs 10 points per image',
    'points.rules': 'View detailed rules',
    'points.add': 'Add Points',
    'points.package.title': 'Choose a Package',
    'points.confirm': 'Confirm',
    
    // Gallery
    'gallery.title': 'Previously Generated Images',
    'gallery.description': 'Your recent transformations are displayed here. Click on any image to download.',
    'gallery.refresh': 'Refresh',
    'gallery.empty': 'You haven\'t generated any images yet',
    'gallery.start': 'Start Creating',
    'gallery.viewAll': 'View All History',
    
    // History
    'history.title': 'Generation History',
    'history.description': 'View all your previously generated images',
    'history.tab.all': 'All',
    'history.tab.pending': 'Pending',
    'history.tab.processing': 'Processing',
    'history.tab.completed': 'Completed',
    'history.tab.failed': 'Failed',
    'history.empty.title': 'No history yet',
    'history.empty.description': 'You haven\'t generated any images yet or have no images with ',
    'history.empty.status': 'status',
    'history.create': 'Start Creating',
    
    // Redeem Points
    'redeem.title': 'Redeem Points',
    'redeem.description': 'Enter your redemption code to get Imagic AI generation points',
    'redeem.form.title': 'Please fill in the following information',
    'redeem.form.code': 'Redemption Code',
    'redeem.form.code.placeholder': 'Enter redemption code',
    'redeem.form.email': 'Email Address',
    'redeem.form.email.placeholder': 'For binding points to this account',
    'redeem.form.notes': 'Notes (Optional)',
    'redeem.form.notes.placeholder': 'Your notes',
    'redeem.form.submit': 'Redeem Points',
    'redeem.form.processing': 'Processing...',
    
    // Toast Messages
    'toast.error': 'Error',
    'toast.success': 'Success',
    'toast.refresh.error': 'Failed to refresh user data',
    'toast.load.error': 'Failed to load user data',
    'toast.styles.error': 'Failed to load style options',
    'toast.transform.error': 'You must be logged in to transform images',
    'toast.noImages.error': 'Please upload at least one image to transform',
    'toast.transform.start': 'Transformation Started',
    'toast.transform.description': ' image(s) are being processed. Check the history tab to see results.',
    'toast.transform.failed': 'Transformation Failed',
    'toast.transform.failed.description': 'An error occurred while processing your images',
    'toast.purchase.success': 'Purchase Successful',
    'toast.purchase.added': 'Added ',
    'toast.purchase.points': ' points to your account!',
    'toast.purchase.failed': 'Purchase Failed',
    'toast.purchase.failed.description': 'An error occurred while processing your purchase',
    'toast.download.start': 'Download Started',
    'toast.download.description': 'Your image is being downloaded',
    'toast.download.failed': 'Download Failed',
    'toast.download.failed.description': 'Failed to download the image',
    'toast.refresh.title': 'Refreshed',
    'toast.refresh.description': 'Your image history has been updated',
    'toast.refresh.failed': 'Failed to refresh image history',
    'toast.redeem.success': 'Redemption Successful',
    'toast.redeem.added': 'Successfully added ',
    'toast.redeem.points': ' points to your account',
    'toast.redeem.failed': 'Redemption Failed',
    'toast.redeem.failed.description': 'Invalid redemption code or the code has already been used',
    
    // Footer
    'footer.services': 'Services',
    'footer.services.ghibli': 'Ghibli Style Transformation',
    'footer.services.pricing': 'Pricing Plans',
    'footer.services.enterprise': 'Enterprise Services',
    'footer.services.batch': 'Batch Processing',
    'footer.company': 'Company',
    'footer.company.about': 'About Us',
    'footer.company.blog': 'Tech Blog',
    'footer.company.careers': 'Join Us',
    'footer.company.contact': 'Contact Us',
    'footer.legal': 'Legal',
    'footer.legal.privacy': 'Privacy Policy',
    'footer.legal.terms': 'Terms of Use',
    'footer.legal.copyright': 'Copyright Notice',
    'footer.legal.refund': 'Refund Policy',
    'footer.copyright': '© 2023 Imagic AI. All rights reserved.',
  },
  zh: {
    // NavBar
    'nav.home': '首页',
    'nav.batchGenerate': '批量生成',
    'nav.redeemPoints': '兑换积分',
    'nav.history': '历史记录',
    'nav.logout': '退出登录',
    
    // HomePage
    'home.hero.title': '一键将照片转换为吉卜力动画风格',
    'home.hero.description': '使用我们的AI技术将您的照片转换为精美的吉卜力动画风格。限时优惠每张图片仅需 $0.15，立即尝试！',
    'home.hero.startButton': '开始体验',
    'home.hero.priceButton': '查看价格',
    'home.features.title': '为什么选择 Imagic',
    'home.features.ai.title': '先进的AI转换技术',
    'home.features.ai.description': '精确捕捉上千种动画艺术风格，将您的照片转换为宫崎骏的艺术作品',
    'home.features.speed.title': '快速处理，即时交付',
    'home.features.speed.description': '仅需几秒钟，即可获得高质量的吉卜力风格图像，无需等待',
    'home.features.security.title': '安全可靠的处理',
    'home.features.security.description': '保护您的隐私，所有图像处理在安全的云环境中，并且不会保存您的原始照片',
    'home.examples.title': '惊人的转换效果',
    'home.examples.description': '使用我们的AI技术，将您的照片变成吉卜力风格的动画作品，流畅自然的转换效果让您惊叹',
    'home.stats.users': '用户',
    'home.stats.images': '生成图像',
    'home.stats.rating': '平均评分',
    'home.cta.title': '准备好体验吉卜力风格了吗？',
    'home.cta.description': '立即上传您的照片，让AI将它们转换成迷人的吉卜力风格动画',
    'home.cta.button': '立即开始',
    
    // BatchGenerate
    'batch.title': '批量图片生成',
    'batch.upload.title': '批量上传照片',
    'batch.upload.description': '最多可上传50张照片，每张照片 ¥1',
    'batch.upload.drag': '拖拽图片到这里或点击浏览',
    'batch.upload.drop': '放下图片',
    'batch.upload.formats': '支持PNG、JPG或WebP格式（每张最大5MB）',
    'batch.upload.selected': '已选择:',
    'batch.upload.price': '总价:',
    'batch.style.title': '选择风格',
    'batch.style.description': '（所有图片将应用相同风格）',
    'batch.generate': '生成',
    'batch.processing': '处理中...',
    'batch.images': '张图片',
    
    // Points Panel
    'points.title': '我的积分',
    'points.available': '可用积分',
    'points.cost': '风格转换每张图片消耗10点积分',
    'points.rules': '查看详细规则',
    'points.add': '添加积分',
    'points.package.title': '选择套餐',
    'points.confirm': '确认',
    
    // Gallery
    'gallery.title': '之前生成的图片',
    'gallery.description': '您最近的转换作品显示在这里。点击任意图片下载。',
    'gallery.refresh': '刷新',
    'gallery.empty': '您还没有生成任何图片',
    'gallery.start': '开始创建',
    'gallery.viewAll': '查看所有历史',
    
    // History
    'history.title': '生成历史记录',
    'history.description': '查看您之前生成的所有图片',
    'history.tab.all': '全部',
    'history.tab.pending': '等待中',
    'history.tab.processing': '处理中',
    'history.tab.completed': '已完成',
    'history.tab.failed': '失败',
    'history.empty.title': '暂无历史记录',
    'history.empty.description': '您还没有生成任何图片或没有',
    'history.empty.status': '状态的图片',
    'history.create': '开始创建',
    
    // Redeem Points
    'redeem.title': '兑换积分',
    'redeem.description': '输入您的兑换码，获取 Imagic AI 生成积分',
    'redeem.form.title': '请填写以下信息',
    'redeem.form.code': '兑换码',
    'redeem.form.code.placeholder': '输入兑换码',
    'redeem.form.email': '邮箱地址',
    'redeem.form.email.placeholder': '用于绑定积分到该账户',
    'redeem.form.notes': '备注（可选）',
    'redeem.form.notes.placeholder': '您的备注',
    'redeem.form.submit': '兑换积分',
    'redeem.form.processing': '处理中...',
    
    // Toast Messages
    'toast.error': '错误',
    'toast.success': '成功',
    'toast.refresh.error': '刷新用户数据失败',
    'toast.load.error': '加载用户数据失败',
    'toast.styles.error': '加载风格选项失败',
    'toast.transform.error': '您必须登录才能转换图片',
    'toast.noImages.error': '请上传至少一张图片进行转换',
    'toast.transform.start': '转换已开始',
    'toast.transform.description': ' 张图片正在处理中。请到历史选项卡查看结果。',
    'toast.transform.failed': '转换失败',
    'toast.transform.failed.description': '处理图片时发生错误',
    'toast.purchase.success': '购买成功',
    'toast.purchase.added': '已添加 ',
    'toast.purchase.points': ' 积分到您的账户！',
    'toast.purchase.failed': '购买失败',
    'toast.purchase.failed.description': '处理您的购买时发生错误',
    'toast.download.start': '下载已开始',
    'toast.download.description': '您的图片正在下载中',
    'toast.download.failed': '下载失败',
    'toast.download.failed.description': '图片下载失败',
    'toast.refresh.title': '已刷新',
    'toast.refresh.description': '您的图片历史已更新',
    'toast.refresh.failed': '刷新图片历史失败',
    'toast.redeem.success': '兑换成功',
    'toast.redeem.added': '成功添加 ',
    'toast.redeem.points': ' 积分到您的账户',
    'toast.redeem.failed': '兑换失败',
    'toast.redeem.failed.description': '无效的兑换码或该兑换码已被使用',
    
    // Footer
    'footer.services': '服务',
    'footer.services.ghibli': '吉卜力风格转换',
    'footer.services.pricing': '价格方案',
    'footer.services.enterprise': '企业服务',
    'footer.services.batch': '批量处理',
    'footer.company': '公司',
    'footer.company.about': '关于我们',
    'footer.company.blog': '技术博客',
    'footer.company.careers': '加入我们',
    'footer.company.contact': '联系我们',
    'footer.legal': '法律',
    'footer.legal.privacy': '隐私政策',
    'footer.legal.terms': '使用条款',
    'footer.legal.copyright': '版权声明',
    'footer.legal.refund': '退款政策',
    'footer.copyright': '© 2023 Imagic AI. 保留所有权利。',
  }
};

// Create language provider component
interface LanguageProviderProps {
  children: ReactNode;
}

export function LanguageProvider({ children }: LanguageProviderProps) {
  // Get browser language or stored preference
  const getBrowserLanguage = (): Language => {
    // Try to get from localStorage first
    const storedLanguage = localStorage.getItem('language') as Language;
    if (storedLanguage && ['en', 'zh'].includes(storedLanguage)) {
      return storedLanguage;
    }
    
    // Otherwise detect from browser
    const browserLang = navigator.language.split('-')[0];
    return browserLang === 'zh' ? 'zh' : 'en';
  };

  const [language, setLanguage] = useState<Language>(getBrowserLanguage());

  // Save language preference to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('language', language);
  }, [language]);

  // Translation function
  const t = (key: string): string => {
    const translationSet = translations[language];
    // Type assertion to avoid TypeScript error
    return (translationSet as Record<string, string>)[key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

// Create hook for using the language context
export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}