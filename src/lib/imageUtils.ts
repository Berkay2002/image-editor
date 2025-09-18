/**
 * Utility functions for image processing on the client side
 */

// Enhanced error types for better debugging
export class ImageProcessingError extends Error {
  constructor(message: string, public originalError?: Error, public context?: Record<string, unknown>) {
    super(message);
    this.name = 'ImageProcessingError';
  }
}

// Retry helper for image operations
export async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000,
  operationName: string = 'operation'
): Promise<T> {
  let lastError: Error = new Error('Unknown error');

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      // Only log first attempt and final attempts to reduce console spam
      if (attempt === 1 || attempt === maxRetries) {
        console.log(`[ImageUtils] ${operationName} - attempt ${attempt}/${maxRetries}`);
      }
      return await operation();
    } catch (error) {
      lastError = error as Error;
      console.warn(`[ImageUtils] ${operationName} failed on attempt ${attempt}:`, error);

      if (attempt === maxRetries) {
        break;
      }

      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay * attempt));
    }
  }

  throw new ImageProcessingError(
    `${operationName} failed after ${maxRetries} attempts`,
    lastError,
    { maxRetries, lastAttempt: maxRetries }
  );
}

// File validation helper
export function validateImageFile(file: File): void {
  if (!file) {
    throw new ImageProcessingError('No file provided');
  }

  if (!file.type.startsWith('image/')) {
    throw new ImageProcessingError(`Invalid file type: ${file.type}. Expected image file.`);
  }

  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
  if (!allowedTypes.includes(file.type)) {
    throw new ImageProcessingError(`Unsupported image type: ${file.type}. Supported: ${allowedTypes.join(', ')}`);
  }

  if (file.size === 0) {
    throw new ImageProcessingError('File is empty');
  }

  // Check for reasonable file size (max 50MB)
  const maxSize = 50 * 1024 * 1024;
  if (file.size > maxSize) {
    throw new ImageProcessingError(`File too large: ${(file.size / 1024 / 1024).toFixed(2)}MB. Maximum: ${maxSize / 1024 / 1024}MB`);
  }
}

export interface ImageResizeOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  format?: 'jpeg' | 'png' | 'webp';
}

/**
 * Resize an image file while maintaining aspect ratio (internal implementation)
 */
function _resizeImageCore(
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
    try {
      // Validate input file
      validateImageFile(file);
    } catch (error) {
      reject(error instanceof ImageProcessingError ? error : new ImageProcessingError('Failed to validate input file', error as Error));
      return;
    }

    // Reduced logging for resize operations

    const img = new Image();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      reject(new ImageProcessingError('Failed to get canvas 2D context - browser may not support canvas'));
      return;
    }

    img.onload = () => {
      try {
        // Calculate new dimensions while maintaining aspect ratio
        let { width, height } = img;
        const originalDimensions = { width, height };

        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }

        // Reduced logging for resize dimensions

        // Set canvas size
        canvas.width = width;
        canvas.height = height;

        // Draw and resize image
        ctx.drawImage(img, 0, 0, width, height);

        // Convert to blob with timeout
        const blobTimeout = setTimeout(() => {
          reject(new ImageProcessingError('Image resize timed out - image may be too large or complex'));
        }, 30000); // 30 second timeout

        canvas.toBlob(
          (blob) => {
            clearTimeout(blobTimeout);

            if (!blob) {
              reject(new ImageProcessingError(`Failed to create blob from canvas. Format: ${format}, Quality: ${quality}`, undefined, {
                dimensions: { width, height },
                format,
                quality
              }));
              return;
            }

            // Create new file with original name but potentially different extension
            const extension = format === 'jpeg' ? 'jpg' : format;
            const originalName = file.name.split('.').slice(0, -1).join('.') || 'image';
            const newFileName = `${originalName}_resized.${extension}`;

            const resizedFile = new File([blob], newFileName, {
              type: `image/${format}`,
              lastModified: Date.now(),
            });

            // Resize complete (logging reduced)
            URL.revokeObjectURL(img.src); // Clean up
            resolve(resizedFile);
          },
          `image/${format}`,
          quality
        );
      } catch (error) {
        reject(new ImageProcessingError('Failed during image processing', error as Error, {
          originalFile: file.name,
          targetDimensions: { maxWidth, maxHeight },
          format,
          quality
        }));
      }
    };

    img.onerror = (event) => {
      URL.revokeObjectURL(img.src); // Clean up on error
      reject(new ImageProcessingError(
        `Failed to load image for resizing: ${file.name}`,
        undefined,
        {
          fileName: file.name,
          fileSize: file.size,
          fileType: file.type,
          event: event.toString()
        }
      ));
    };

    // Load the image with error handling
    try {
      img.src = URL.createObjectURL(file);
    } catch (error) {
      reject(new ImageProcessingError('Failed to create object URL for image', error as Error, {
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type
      }));
    }
  });
}

/**
 * Resize an image file while maintaining aspect ratio (with retry logic)
 */
export function resizeImage(
  file: File,
  options: ImageResizeOptions = {}
): Promise<File> {
  return withRetry(
    () => _resizeImageCore(file, options),
    3,
    1000,
    `Resize image ${file.name}`
  );
}

/**
 * Get image dimensions without loading the full image
 */
export function getImageDimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    try {
      // Validate input file
      validateImageFile(file);
    } catch (error) {
      reject(error instanceof ImageProcessingError ? error : new ImageProcessingError('Failed to validate input file', error as Error));
      return;
    }

    // Getting image dimensions (logging reduced)

    const img = new Image();

    img.onload = () => {
      const dimensions = { width: img.width, height: img.height };
      // Dimensions retrieved (logging reduced)
      URL.revokeObjectURL(img.src);
      resolve(dimensions);
    };

    img.onerror = (event) => {
      URL.revokeObjectURL(img.src);
      reject(new ImageProcessingError(
        `Failed to load image for dimension detection: ${file.name}`,
        undefined,
        {
          fileName: file.name,
          fileSize: file.size,
          fileType: file.type,
          event: event.toString()
        }
      ));
    };

    // Load the image with error handling
    try {
      img.src = URL.createObjectURL(file);
    } catch (error) {
      reject(new ImageProcessingError('Failed to create object URL for dimension detection', error as Error, {
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type
      }));
    }
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
  try {
    validateImageFile(file);

    // Check file size (convert MB to bytes)
    if (file.size > maxSizeMB * 1024 * 1024) {
      // File needs resize due to size (logging reduced)
      return true;
    }

    // Check dimensions
    const { width, height } = await getImageDimensions(file);
    const needsResize = width > maxDimension || height > maxDimension;

    if (needsResize) {
      // File needs resize due to dimensions (logging reduced)
    } else {
      // File doesn't need resize (logging reduced)
    }

    return needsResize;
  } catch (error) {
    console.warn(`[ImageUtils] Failed to check if resize needed for ${file.name}, assuming resize required:`, error);
    // If we can't get dimensions, assume resizing is needed for large files
    return file.size > 2 * 1024 * 1024; // 2MB threshold
  }
}

/**
 * Create a thumbnail version of an image for preview/display purposes
 */
export function createThumbnail(
  file: File,
  maxDimension: number = 200,
  quality: number = 0.8
): Promise<File> {
  return resizeImage(file, {
    maxWidth: maxDimension,
    maxHeight: maxDimension,
    quality,
    format: 'jpeg'
  });
}

/**
 * Optimize an image for display based on container dimensions
 */
export function optimizeForDisplay(
  file: File,
  containerWidth: number,
  containerHeight: number,
  quality: number = 0.9
): Promise<File> {
  // Use device pixel ratio for high-DPI displays, but cap at 2x to avoid excessive memory usage
  const pixelRatio = Math.min(typeof window !== 'undefined' ? window.devicePixelRatio : 1, 2);

  const maxWidth = Math.min(containerWidth * pixelRatio, 1920);
  const maxHeight = Math.min(containerHeight * pixelRatio, 1920);

  return resizeImage(file, {
    maxWidth,
    maxHeight,
    quality,
    format: 'jpeg'
  });
}

/**
 * Batch resize multiple images for API submission
 */
export async function batchResizeForAPI(
  files: File[],
  maxSizeMB: number = 3,
  maxDimension: number = 1920
): Promise<File[]> {
  // Batch processing images (logging reduced)
  const resizedFiles: File[] = [];
  const errors: string[] = [];

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    try {
      validateImageFile(file);
      const needsResize = await shouldResizeImage(file, maxSizeMB, maxDimension);

      if (needsResize) {
        // Resizing image (logging reduced)
        const resized = await resizeImage(file, {
          maxWidth: maxDimension,
          maxHeight: maxDimension,
          quality: 0.85,
          format: 'jpeg'
        });
        resizedFiles.push(resized);
      } else {
        // Image doesn't need resize (logging reduced)
        resizedFiles.push(file);
      }
    } catch (error) {
      const errorMsg = `Failed to process image ${file.name}: ${error instanceof Error ? error.message : 'Unknown error'}`;
      console.error(`[ImageUtils] ${errorMsg}`);
      errors.push(errorMsg);
    }
  }

  if (errors.length > 0 && resizedFiles.length === 0) {
    throw new ImageProcessingError(`All images failed to process: ${errors.join('; ')}`);
  } else if (errors.length > 0) {
    console.warn(`[ImageUtils] Some images failed to process but continuing with ${resizedFiles.length} successful images`);
  }

  return resizedFiles;
}

/**
 * Convert a File to a data URL with optional compression
 */
export function fileToDataURL(file: File, compress: boolean = false): Promise<string> {
  return new Promise(async (resolve, reject) => {
    try {
      // Validate input file
      validateImageFile(file);

      // Converting to data URL (logging reduced)
      let fileToProcess = file;

      if (compress) {
        // Create a small compressed version for storage
        const needsResize = await shouldResizeImage(file, 1, 800); // 1MB, 800px max
        if (needsResize) {
          // Compressing for storage (logging reduced)
          fileToProcess = await resizeImage(file, {
            maxWidth: 800,
            maxHeight: 800,
            quality: 0.8,
            format: 'jpeg'
          });
        }
      }

      const reader = new FileReader();

      // Add timeout for FileReader
      const timeout = setTimeout(() => {
        reader.abort();
        reject(new ImageProcessingError('File reading timed out - file may be corrupted or too large', undefined, {
          fileName: file.name,
          fileSize: file.size,
          compress
        }));
      }, 30000); // 30 second timeout

      reader.onload = (e) => {
        clearTimeout(timeout);
        const result = e.target?.result as string;
        if (!result) {
          reject(new ImageProcessingError('FileReader returned empty result'));
          return;
        }
        // Data URL created successfully (logging reduced)
        resolve(result);
      };

      reader.onerror = (e) => {
        clearTimeout(timeout);
        reject(new ImageProcessingError(
          `Failed to read file: ${file.name}`,
          undefined,
          {
            fileName: file.name,
            fileSize: file.size,
            fileType: file.type,
            compress,
            readerError: e.toString()
          }
        ));
      };

      reader.onabort = () => {
        clearTimeout(timeout);
        reject(new ImageProcessingError('File reading was aborted', undefined, {
          fileName: file.name
        }));
      };

      reader.readAsDataURL(fileToProcess);
    } catch (error) {
      reject(error instanceof ImageProcessingError ? error : new ImageProcessingError('Failed to convert file to data URL', error as Error, {
        fileName: file.name,
        fileSize: file.size,
        compress
      }));
    }
  });
}