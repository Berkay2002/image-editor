'use client';

import { useState, useRef, useEffect } from 'react';
import { Textarea } from '@/components/retroui/Textarea';
import { Button } from '@/components/retroui/Button';
import { Loader2, Sparkles, Plus, X } from 'lucide-react';
import { createThumbnail } from '@/lib/imageUtils';

interface PromptInputProps {
  prompt: string;
  onPromptChange: (prompt: string) => void;
  onGenerate: () => void;
  isLoading?: boolean;
  disabled?: boolean;
  additionalImages?: File[];
  onAdditionalImagesChange?: (images: File[]) => void;
  hasMainImage?: boolean;
  skippedInitialImage?: boolean;
}

const MAX_PROMPT_LENGTH = 1000;

export function PromptInput({
  prompt,
  onPromptChange,
  onGenerate,
  isLoading = false,
  disabled = false,
  additionalImages = [],
  onAdditionalImagesChange,
  hasMainImage = false,
  skippedInitialImage = false
}: PromptInputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [thumbnailUrls, setThumbnailUrls] = useState<string[]>([]);

  const characterCount = prompt.length;
  const isOverLimit = characterCount > MAX_PROMPT_LENGTH;
  const canGenerate = prompt.trim().length > 0 && !isOverLimit && !isLoading && !disabled;

  // Generate thumbnails when additional images change
  useEffect(() => {
    const generateThumbnails = async () => {
      // Clean up old thumbnail URLs
      thumbnailUrls.forEach(url => {
        if (url.startsWith('blob:')) {
          URL.revokeObjectURL(url);
        }
      });

      if (additionalImages.length === 0) {
        setThumbnailUrls([]);
        return;
      }

      try {
        const newThumbnailUrls: string[] = [];

        for (const image of additionalImages) {
          // Create compressed thumbnail
          const thumbnail = await createThumbnail(image, 64, 0.7); // 64px max, 70% quality
          const thumbnailUrl = URL.createObjectURL(thumbnail);
          newThumbnailUrls.push(thumbnailUrl);
        }

        setThumbnailUrls(newThumbnailUrls);
      } catch (error) {
        console.warn('Failed to generate thumbnails:', error);
        // Fall back to original image URLs
        const fallbackUrls = additionalImages.map(image => URL.createObjectURL(image));
        setThumbnailUrls(fallbackUrls);
      }
    };

    generateThumbnails();

    // Cleanup function for when dependencies change
    return () => {
      // This will clean up thumbnails when additionalImages changes
    };
  }, [additionalImages]); // Only depend on additionalImages, not thumbnailUrls

  // Cleanup on unmount - use ref to avoid dependency
  useEffect(() => {
    const currentThumbnails = thumbnailUrls;
    return () => {
      currentThumbnails.forEach(url => {
        if (url.startsWith('blob:')) {
          URL.revokeObjectURL(url);
        }
      });
    };
  }, [thumbnailUrls]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Trigger generation on Enter (but not Shift+Enter for new lines)
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (canGenerate) {
        onGenerate();
      }
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;

    // Only allow additional images if there's a main image or the initial image was skipped
    if (!hasMainImage && !skippedInitialImage) {
      console.warn('[PromptInput] Cannot add additional images without a main image.');
      if (e.target) {
        e.target.value = '';
      }
      return;
    }

    if (files && files.length > 0 && onAdditionalImagesChange) {
      // Validate file types
      const validTypes = ['image/png', 'image/jpeg', 'image/webp'];
      const validFiles = Array.from(files).filter(file => validTypes.includes(file.type));

      if (validFiles.length > 0) {
        const newImages = [...additionalImages, ...validFiles].slice(0, 3); // Max 3 additional images
        onAdditionalImagesChange(newImages);
      }
    }
    // Reset the input value so the same file can be selected again
    if (e.target) {
      e.target.value = '';
    }
  };

  const handleImageRemove = (index: number) => {
    if (onAdditionalImagesChange) {
      const newImages = additionalImages.filter((_, i) => i !== index);
      onAdditionalImagesChange(newImages);
    }
  };

  const openImageUpload = () => {
    // Only allow additional images if there's a main image or the initial image was skipped
    if (!hasMainImage && !skippedInitialImage) {
      console.warn('[PromptInput] Cannot add additional images without a main image. Please upload an image first.');
      return;
    }
    fileInputRef.current?.click();
  };

  return (
    <div className="w-full space-y-3">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        multiple
        onChange={handleImageUpload}
        className="hidden"
      />
      
      {/* Additional Images Preview */}
      {additionalImages.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {additionalImages.map((image, index) => (
            <div key={index} className="relative group">
              <div className="w-16 h-16 bg-muted rounded border-2 border-border overflow-hidden">
                <img
                  src={thumbnailUrls[index] || URL.createObjectURL(image)}
                  alt={`Additional image ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              </div>
              <button
                onClick={() => handleImageRemove(index)}
                className="absolute -top-2 -right-2 w-5 h-5 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive/80"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}
      
      {/* Input Row: Textarea, Plus Icon Button, Generate Button */}
      <div className="flex gap-2 items-end">
        {/* Textarea */}
        <div className="flex-1 relative">
          <Textarea
            id="prompt"
            placeholder="Describe how you want to edit your image..."
            value={prompt}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => onPromptChange(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            disabled={isLoading || disabled}
            className={`min-h-[80px] resize-none transition-all pr-12 ${
              isFocused ? 'ring-2 ring-blue-500' : ''
            } ${isOverLimit ? 'border-red-500 focus:border-red-500' : ''}`}
          />
          
          {/* Character count */}
          <div className={`absolute bottom-3 right-3 font-sans text-xs font-medium transition-colors pointer-events-none ${
            isOverLimit 
              ? 'text-destructive' 
              : characterCount > MAX_PROMPT_LENGTH * 0.8 
                ? 'text-primary' 
                : 'text-muted-foreground'
          }`}>
            {characterCount > 0 && `${characterCount}/${MAX_PROMPT_LENGTH}`}
          </div>
        </div>
        
        {/* Plus Icon Button */}
        <Button
          onClick={openImageUpload}
          disabled={isLoading || disabled || additionalImages.length >= 3 || (!hasMainImage && !skippedInitialImage)}
          variant="outline"
          className="h-[80px] w-12 flex items-center justify-center p-0 flex-shrink-0"
          size="sm"
          title={(!hasMainImage && !skippedInitialImage) ? "Upload a main image first to add additional images" : additionalImages.length >= 3 ? "Maximum 3 additional images allowed" : "Add additional images"}
        >
          <Plus className="h-5 w-5" />
        </Button>
        
        {/* Generate Button */}
        <Button
          onClick={onGenerate}
          disabled={!canGenerate}
          className="h-[80px] w-12 flex items-center justify-center p-0 flex-shrink-0"
          size="sm"
        >
          {isLoading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <Sparkles className="h-5 w-5" />
          )}
        </Button>
      </div>
      
      {/* Error Message */}
      {isOverLimit && (
        <p className="font-sans text-sm text-destructive font-medium">
          Please keep your prompt under {MAX_PROMPT_LENGTH} characters.
        </p>
      )}
    </div>
  );
}