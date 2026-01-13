import { ImageFormat, CropArea } from '../types';

/**
 * Loads an image from a URL into an HTMLImageElement.
 */
export const loadImage = (url: string): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = (e) => reject(e);
    img.src = url;
  });
};

/**
 * Formats file size into readable string.
 */
export const formatBytes = (bytes: number, decimals = 2): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

/**
 * Resizes an image.
 */
export const resizeImage = async (
  imageUrl: string,
  width: number,
  height: number,
  format: string = 'image/png'
): Promise<string> => {
  const img = await loadImage(imageUrl);
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas context unavailable');
  
  // High quality scaling
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(img, 0, 0, width, height);
  
  return canvas.toDataURL(format);
};

/**
 * Crops an image.
 */
export const cropImage = async (
  imageUrl: string,
  crop: CropArea,
  format: string = 'image/png'
): Promise<string> => {
  const img = await loadImage(imageUrl);
  const canvas = document.createElement('canvas');
  canvas.width = crop.width;
  canvas.height = crop.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas context unavailable');

  ctx.drawImage(
    img,
    crop.x,
    crop.y,
    crop.width,
    crop.height,
    0,
    0,
    crop.width,
    crop.height
  );

  return canvas.toDataURL(format);
};

/**
 * Compresses and converts format.
 */
export const compressAndConvertImage = async (
  imageUrl: string,
  quality: number, // 0.0 to 1.0
  format: ImageFormat
): Promise<{ url: string; blob: Blob }> => {
  const img = await loadImage(imageUrl);
  const canvas = document.createElement('canvas');
  canvas.width = img.width;
  canvas.height = img.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas context unavailable');

  // If converting to JPEG, add white background for transparency handling
  if (format === 'image/jpeg') {
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  ctx.drawImage(img, 0, 0);

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error('Compression failed'));
          return;
        }
        const url = URL.createObjectURL(blob);
        resolve({ url, blob });
      },
      format,
      quality
    );
  });
};