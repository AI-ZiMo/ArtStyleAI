import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(price: number): string {
  // Convert cents to dollars and format with two decimal places
  return `¥${(price / 100).toFixed(2)}`;
}

export function formatDate(date: Date | string): string {
  if (typeof date === 'string') {
    date = new Date(date);
  }
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(date);
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}

// Function to validate file before upload
export function validateFile(file: File): { valid: boolean; message: string; needsCompression?: boolean } {
  // Check file type
  if (!file.type.match(/image\/(jpeg|png|webp)/)) {
    return {
      valid: false,
      message: 'Only JPG, PNG, and WebP files are allowed',
    };
  }

  // Check file size (5MB max)
  if (file.size > 5 * 1024 * 1024) {
    return {
      valid: true, // Now allow large files but mark them for compression
      message: '',
      needsCompression: true // Flag that this file needs compression
    };
  }

  return { valid: true, message: '', needsCompression: false };
}

// Generate unique IDs for elements
export function generateId(): string {
  return Math.random().toString(36).substring(2, 15);
}

// Format file size for display
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' bytes';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

export const imageStyles = [
  {
    id: 1,
    name: "Ghibli Anime Style",
    description: "Warm, dreamy Studio Ghibli animation style",
    beforeImage: "https://images.unsplash.com/photo-1547055442-5e3f464cf044?ixlib=rb-1.2.1&auto=format&fit=crop&w=600&q=80",
    afterImage: "https://images.unsplash.com/photo-1563994234673-9436c578ab4b?ixlib=rb-1.2.1&auto=format&fit=crop&w=600&q=80"
  },
  {
    id: 2,
    name: "Watercolor Art",
    description: "Soft, flowing watercolor painting style",
    beforeImage: "https://images.unsplash.com/photo-1506748686214-e9df14d4d9d0?ixlib=rb-1.2.1&auto=format&fit=crop&w=600&q=80",
    afterImage: "https://images.unsplash.com/photo-1578301978693-85fa9c0320b9?ixlib=rb-1.2.1&auto=format&fit=crop&w=600&q=80"
  },
  {
    id: 3,
    name: "Cyberpunk Neon",
    description: "Futuristic neon-lit cyberpunk aesthetic",
    beforeImage: "https://images.unsplash.com/photo-1445966275305-9806327ea2b5?ixlib=rb-1.2.1&auto=format&fit=crop&w=600&q=80",
    afterImage: "https://images.unsplash.com/photo-1520036739699-715c34e82e0f?ixlib=rb-1.2.1&auto=format&fit=crop&w=600&q=80"
  },
  {
    id: 4,
    name: "Van Gogh Style",
    description: "Bold brushstrokes and vivid colors",
    beforeImage: "https://images.unsplash.com/photo-1556195332-95503f664ced?ixlib=rb-1.2.1&auto=format&fit=crop&w=600&q=80",
    afterImage: "https://images.unsplash.com/photo-1541680670548-88e8cd23c0f4?ixlib=rb-1.2.1&auto=format&fit=crop&w=600&q=80"
  }
];

export const packageOptions = [
  {
    id: 1,
    name: "Basic Package",
    price: 990,
    description: "Perfect for beginners, generate 10 images",
    points: 100
  },
  {
    id: 2,
    name: "Standard Package",
    price: 2290,
    description: "Daily use, generate 25 images",
    points: 250
  },
  {
    id: 3,
    name: "Premium Package",
    price: 4990,
    description: "Professional creation, generate 60 images",
    points: 600
  },
  {
    id: 4,
    name: "Unlimited Package",
    price: 11990,
    description: "Unlimited creativity, generate 150 images",
    points: 1500
  }
];
