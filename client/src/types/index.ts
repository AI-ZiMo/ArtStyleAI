export interface User {
  id: number;
  email: string;
  points: number;
}

export interface Package {
  id: number;
  name: string;
  description: string;
  points: number;
  price: number;
}

export interface Style {
  id: number;
  name: string;
  description: string;
  pointCost: number;
  promptTemplate: string;
  exampleBeforeUrl: string;
  exampleAfterUrl: string;
}

export interface Image {
  id: number;
  userId: number;
  originalUrl: string;
  transformedUrl?: string;
  style: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  errorMessage?: string;
  createdAt: string;
}

export interface RedeemCode {
  id: number;
  code: string;
  points: number;
  isUsed: number;
}

export interface UploadedFile extends File {
  id: string;
  preview: string;
}
