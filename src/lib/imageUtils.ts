/**
 * Utility functions for image processing on the client side
 */

export interface ImageResizeOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  format?: 'jpeg' | 'png' | 'webp';
}

/**
 * Resize an image file while maintaining aspect ratio
 */
export function resizeImage(
  file: File, 
  options: ImageResizeOptions = {}
): Promise<File> {
  const {
    maxWidth = 2048,
    maxHeight = 2048,
    quality = 0.9,
    format = 'jpeg'
  } = options;

  return new Promise((resolve, reject) => {
    const img = new Image();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      reject(new Error('Failed to get canvas context'));
      return;
    }

    img.onload = () => {
      // Calculate new dimensions while maintaining aspect ratio
      let { width, height } = img;
      
      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height);
        width *= ratio;
        height *= ratio;
      }

      // Set canvas size
      canvas.width = width;
      canvas.height = height;

      // Draw and resize image
      ctx.drawImage(img, 0, 0, width, height);

      // Convert to blob
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('Failed to resize image'));
            return;
          }

          // Create new file with original name but potentially different extension
          const extension = format === 'jpeg' ? 'jpg' : format;
          const originalName = file.name.split('.').slice(0, -1).join('.');
          const newFileName = `${originalName}_resized.${extension}`;
          
          const resizedFile = new File([blob], newFileName, {
            type: `image/${format}`,
            lastModified: Date.now(),
          });

          resolve(resizedFile);
        },
        `image/${format}`,
        quality
      );
    };

    img.onerror = () => {
      reject(new Error('Failed to load image'));
    };

    // Load the image
    img.src = URL.createObjectURL(file);
  });
}

/**
 * Get image dimensions without loading the full image
 */
export function getImageDimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    
    img.onload = () => {
      resolve({ width: img.width, height: img.height });
      URL.revokeObjectURL(img.src);
    };

    img.onerror = () => {
      reject(new Error('Failed to load image'));
      URL.revokeObjectURL(img.src);
    };

    img.src = URL.createObjectURL(file);
  });
}

/**
 * Check if an image needs resizing based on file size and dimensions
 */
export async function shouldResizeImage(
  file: File,
  maxSizeMB: number = 5,
  maxDimension: number = 2048
): Promise<boolean> {
  // Check file size (convert MB to bytes)
  if (file.size > maxSizeMB * 1024 * 1024) {
    return true;
  }

  try {
    // Check dimensions
    const { width, height } = await getImageDimensions(file);
    return width > maxDimension || height > maxDimension;
  } catch {
    // If we can't get dimensions, assume resizing is needed for large files
    return file.size > 2 * 1024 * 1024; // 2MB threshold
  }
}