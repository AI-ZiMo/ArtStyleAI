import { apiRequest } from "@/lib/queryClient";
import type { User, Package, Style, Image, RedeemCode } from "@/types";

// User related API functions
export async function getUser(email: string): Promise<User> {
  const res = await fetch(`/api/user?email=${encodeURIComponent(email)}`);
  if (!res.ok) {
    throw new Error('Failed to get user');
  }
  return res.json();
}

// Package related API functions
export async function getPackages(): Promise<Package[]> {
  const res = await fetch('/api/packages');
  if (!res.ok) {
    throw new Error('Failed to get packages');
  }
  return res.json();
}

export async function purchasePackage(packageId: number, email: string): Promise<{ user: User; pointsAdded: number }> {
  const res = await apiRequest('POST', '/api/purchase', { packageId, email });
  if (!res.ok) {
    throw new Error('Failed to purchase package');
  }
  return res.json();
}

// Style related API functions
export async function getStyles(): Promise<Style[]> {
  const res = await fetch('/api/styles');
  if (!res.ok) {
    throw new Error('Failed to get styles');
  }
  return res.json();
}

// Redeem code related API functions
export async function redeemCode(code: string, email: string): Promise<{ user: User; pointsAdded: number }> {
  const res = await apiRequest('POST', '/api/redeem', { code, email });
  if (!res.ok) {
    throw new Error('Failed to redeem code');
  }
  return res.json();
}

// Image related API functions
export async function uploadImages(files: File[], style: string, email: string): Promise<{ images: Image[] }> {
  const formData = new FormData();
  files.forEach(file => {
    formData.append('images', file);
  });
  formData.append('style', style);
  formData.append('email', email);

  const res = await fetch('/api/upload', {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) {
    throw new Error('Failed to upload images');
  }
  
  return res.json();
}

export async function transformImages(imageIds: number[], style: string, email: string): Promise<{ message: string; totalCost: number }> {
  const res = await apiRequest('POST', '/api/transform', { imageIds, style, email });
  if (!res.ok) {
    throw new Error('Failed to transform images');
  }
  return res.json();
}

export async function getUserImages(email: string): Promise<Image[]> {
  const res = await fetch(`/api/images?email=${encodeURIComponent(email)}`);
  if (!res.ok) {
    throw new Error('Failed to get user images');
  }
  return res.json();
}

export async function getImageStatus(id: number): Promise<Image> {
  const res = await fetch(`/api/images/${id}`);
  if (!res.ok) {
    throw new Error('Failed to get image status');
  }
  return res.json();
}

// Helper function to download an image
export function downloadImage(dataUrl: string, filename: string = 'download.png'): void {
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
