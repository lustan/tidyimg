export type ImageFormat = 'image/jpeg' | 'image/png' | 'image/webp' | 'image/svg+xml';

export interface ImageState {
  originalFile: File | null;
  originalUrl: string | null;
  currentUrl: string | null;
  history: string[]; // URLs for undo
  dimensions: { width: number; height: number };
  name: string;
  type: string;
  size: number;
}

export interface CropArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface AIAnalysisResult {
  altText: string;
  tags: string[];
  suggestedFilename: string;
}

export enum ToolType {
  NONE = 'NONE',
  RESIZE = 'RESIZE',
  CROP = 'CROP',
  COMPRESS = 'COMPRESS',
  CONVERT = 'CONVERT',
  AI = 'AI'
}

export interface ProcessingOptions {
  resize?: { width: number; height: number };
  crop?: CropArea;
  compress?: { quality: number }; // 0 to 1
  convert?: { format: ImageFormat };
}