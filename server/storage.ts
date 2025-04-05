import { 
  users, packages, styles, redeemCodes, images,
  type User, type InsertUser,
  type Package, type InsertPackage,
  type Style, type InsertStyle,
  type RedeemCode, type InsertRedeemCode,
  type Image, type InsertImage
} from "@shared/schema";

// Storage interface
export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserPoints(id: number, points: number): Promise<User | undefined>;
  
  // Package operations
  getAllPackages(): Promise<Package[]>;
  getPackage(id: number): Promise<Package | undefined>;
  createPackage(pkg: InsertPackage): Promise<Package>;
  
  // Style operations
  getAllStyles(): Promise<Style[]>;
  getStyle(id: number): Promise<Style | undefined>;
  getStyleByName(name: string): Promise<Style | undefined>;
  createStyle(style: InsertStyle): Promise<Style>;
  
  // Redeem code operations
  getRedeemCode(code: string): Promise<RedeemCode | undefined>;
  createRedeemCode(code: InsertRedeemCode): Promise<RedeemCode>;
  markRedeemCodeAsUsed(id: number): Promise<RedeemCode | undefined>;
  
  // Image operations
  createImage(image: InsertImage): Promise<Image>;
  getUserImages(userId: number): Promise<Image[]>;
  getImage(id: number): Promise<Image | undefined>;
  updateImageStatus(id: number, status: string, transformedUrl?: string, errorMessage?: string): Promise<Image | undefined>;
}

// In-memory storage implementation
export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private packages: Map<number, Package>;
  private styles: Map<number, Style>;
  private redeemCodes: Map<number, RedeemCode>;
  private images: Map<number, Image>;
  
  private currentUserId: number;
  private currentPackageId: number;
  private currentStyleId: number;
  private currentRedeemCodeId: number;
  private currentImageId: number;
  
  constructor() {
    this.users = new Map();
    this.packages = new Map();
    this.styles = new Map();
    this.redeemCodes = new Map();
    this.images = new Map();
    
    this.currentUserId = 1;
    this.currentPackageId = 1;
    this.currentStyleId = 1;
    this.currentRedeemCodeId = 1;
    this.currentImageId = 1;
    
    // Initialize default data
    this.initializeDefaultData();
  }
  
  private initializeDefaultData() {
    // Create default user
    this.createUser({ email: "demo@example.com", points: 100 });
    
    // Create default packages
    this.createPackage({ 
      name: "Basic Package", 
      description: "Perfect for beginners, generate 10 images", 
      points: 100, 
      price: 990
    });
    
    this.createPackage({ 
      name: "Standard Package", 
      description: "Daily use, generate 25 images", 
      points: 250, 
      price: 2290
    });
    
    this.createPackage({ 
      name: "Premium Package", 
      description: "Professional creation, generate 60 images", 
      points: 600, 
      price: 4990
    });
    
    this.createPackage({ 
      name: "Unlimited Package", 
      description: "Unlimited creativity, generate 150 images", 
      points: 1500, 
      price: 11990
    });
    
    // Create default styles
    this.createStyle({
      name: "Ghibli Anime Style",
      description: "Warm, dreamy Studio Ghibli animation style",
      pointCost: 1,
      promptTemplate: "Transform this image into a warm, dreamy anime style reminiscent of classic Japanese animation, with soft colors, detailed backgrounds, and charming character designs.",
      exampleBeforeUrl: "https://images.unsplash.com/photo-1547055442-5e3f464cf044?ixlib=rb-1.2.1&auto=format&fit=crop&w=600&q=80",
      exampleAfterUrl: "https://images.unsplash.com/photo-1563994234673-9436c578ab4b?ixlib=rb-1.2.1&auto=format&fit=crop&w=600&q=80"
    });
    
    // 添加UI中使用的宫崎骏风格
    this.createStyle({
      name: "宫崎骏风格",
      description: "温暖、多彩的手绘风格，力求展现宫崎骏作品中的动画风格",
      pointCost: 1,
      promptTemplate: "将这张图片转换成宫崎骏动画风格，温暖的色调，细致的背景，以及富有魅力的人物设计。",
      exampleBeforeUrl: "https://images.unsplash.com/photo-1547055442-5e3f464cf044?ixlib=rb-1.2.1&auto=format&fit=crop&w=600&q=80",
      exampleAfterUrl: "https://images.unsplash.com/photo-1563994234673-9436c578ab4b?ixlib=rb-1.2.1&auto=format&fit=crop&w=600&q=80"
    });
    
    // 添加UI中使用的人物包装盒风格
    this.createStyle({
      name: "人物包装盒",
      description: "将人物设计成适合真实的仿人偶包装盒",
      pointCost: 1,
      promptTemplate: "将这张人物照片转换成一个精美的人偶玩具包装盒，包括包装盒设计、标签和产品详情。",
      exampleBeforeUrl: "https://images.unsplash.com/photo-1547055442-5e3f464cf044?ixlib=rb-1.2.1&auto=format&fit=crop&w=600&q=80",
      exampleAfterUrl: "https://images.unsplash.com/photo-1563994234673-9436c578ab4b?ixlib=rb-1.2.1&auto=format&fit=crop&w=600&q=80"
    });
    
    this.createStyle({
      name: "Watercolor Art",
      description: "Soft, flowing watercolor painting style",
      pointCost: 1,
      promptTemplate: "Transform this image into a delicate watercolor painting with soft, flowing colors, gentle brush strokes, and artistic texture that gives it an elegant hand-painted feel.",
      exampleBeforeUrl: "https://images.unsplash.com/photo-1506748686214-e9df14d4d9d0?ixlib=rb-1.2.1&auto=format&fit=crop&w=600&q=80",
      exampleAfterUrl: "https://images.unsplash.com/photo-1578301978693-85fa9c0320b9?ixlib=rb-1.2.1&auto=format&fit=crop&w=600&q=80"
    });
    
    this.createStyle({
      name: "Cyberpunk Neon",
      description: "Futuristic neon-lit cyberpunk aesthetic",
      pointCost: 1,
      promptTemplate: "Transform this image into a futuristic cyberpunk scene with vibrant neon lights, high-tech elements, urban dystopian atmosphere, and a color palette dominated by electric blues, pinks, and purples.",
      exampleBeforeUrl: "https://images.unsplash.com/photo-1445966275305-9806327ea2b5?ixlib=rb-1.2.1&auto=format&fit=crop&w=600&q=80",
      exampleAfterUrl: "https://images.unsplash.com/photo-1520036739699-715c34e82e0f?ixlib=rb-1.2.1&auto=format&fit=crop&w=600&q=80"
    });
    
    this.createStyle({
      name: "Van Gogh Style",
      description: "Bold brushstrokes and vivid colors",
      pointCost: 1,
      promptTemplate: "Transform this image into the distinctive style of Vincent Van Gogh, with bold, visible brushstrokes, swirling patterns, intense colors, and the emotional, expressive quality characteristic of his paintings.",
      exampleBeforeUrl: "https://images.unsplash.com/photo-1556195332-95503f664ced?ixlib=rb-1.2.1&auto=format&fit=crop&w=600&q=80",
      exampleAfterUrl: "https://images.unsplash.com/photo-1541680670548-88e8cd23c0f4?ixlib=rb-1.2.1&auto=format&fit=crop&w=600&q=80"
    });
    
    // Create sample redeem codes
    this.createRedeemCode({
      code: "WELCOME100",
      points: 100,
      isUsed: 0
    });
  }
  
  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }
  
  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email === email,
    );
  }
  
  async createUser(user: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const newUser: User = { 
      ...user, 
      id,
      points: user.points || 0 // 确保points有一个默认值
    };
    this.users.set(id, newUser);
    return newUser;
  }
  
  async updateUserPoints(id: number, points: number): Promise<User | undefined> {
    const user = await this.getUser(id);
    if (!user) return undefined;
    
    const updatedUser: User = { ...user, points };
    this.users.set(id, updatedUser);
    return updatedUser;
  }
  
  // Package methods
  async getAllPackages(): Promise<Package[]> {
    return Array.from(this.packages.values());
  }
  
  async getPackage(id: number): Promise<Package | undefined> {
    return this.packages.get(id);
  }
  
  async createPackage(pkg: InsertPackage): Promise<Package> {
    const id = this.currentPackageId++;
    const newPackage: Package = { ...pkg, id };
    this.packages.set(id, newPackage);
    return newPackage;
  }
  
  // Style methods
  async getAllStyles(): Promise<Style[]> {
    return Array.from(this.styles.values());
  }
  
  async getStyle(id: number): Promise<Style | undefined> {
    return this.styles.get(id);
  }
  
  async getStyleByName(name: string): Promise<Style | undefined> {
    return Array.from(this.styles.values()).find(
      (style) => style.name === name,
    );
  }
  
  async createStyle(style: InsertStyle): Promise<Style> {
    const id = this.currentStyleId++;
    const newStyle: Style = { ...style, id };
    this.styles.set(id, newStyle);
    return newStyle;
  }
  
  // Redeem code methods
  async getRedeemCode(code: string): Promise<RedeemCode | undefined> {
    return Array.from(this.redeemCodes.values()).find(
      (redeemCode) => redeemCode.code === code,
    );
  }
  
  async createRedeemCode(code: InsertRedeemCode): Promise<RedeemCode> {
    const id = this.currentRedeemCodeId++;
    const newRedeemCode: RedeemCode = { 
      ...code, 
      id,
      isUsed: code.isUsed || 0 // 确保isUsed有默认值
    };
    this.redeemCodes.set(id, newRedeemCode);
    return newRedeemCode;
  }
  
  async markRedeemCodeAsUsed(id: number): Promise<RedeemCode | undefined> {
    const redeemCode = this.redeemCodes.get(id);
    if (!redeemCode) return undefined;
    
    const updatedRedeemCode: RedeemCode = { ...redeemCode, isUsed: 1 };
    this.redeemCodes.set(id, updatedRedeemCode);
    return updatedRedeemCode;
  }
  
  // Image methods
  async createImage(image: InsertImage): Promise<Image> {
    const id = this.currentImageId++;
    const now = new Date();
    const newImage: Image = { 
      ...image, 
      id, 
      createdAt: now,
      status: image.status || 'pending',
      transformedUrl: image.transformedUrl || null,
      errorMessage: image.errorMessage || null
    };
    this.images.set(id, newImage);
    return newImage;
  }
  
  async getUserImages(userId: number): Promise<Image[]> {
    return Array.from(this.images.values())
      .filter(image => image.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }
  
  async getImage(id: number): Promise<Image | undefined> {
    return this.images.get(id);
  }
  
  async updateImageStatus(id: number, status: string, transformedUrl?: string, errorMessage?: string): Promise<Image | undefined> {
    const image = await this.getImage(id);
    if (!image) return undefined;
    
    const updatedImage: Image = { 
      ...image, 
      status,
      ...(transformedUrl ? { transformedUrl } : {}),
      ...(errorMessage ? { errorMessage } : {})
    };
    
    this.images.set(id, updatedImage);
    return updatedImage;
  }
}

export const storage = new MemStorage();
