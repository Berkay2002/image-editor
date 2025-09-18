'use client';

import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Alert } from '@/components/retroui/Alert';
import { Button } from '@/components/retroui/Button';
import { Upload, ArrowRight } from 'lucide-react';

interface ImageDropzoneProps {
  onImageSelect: (file: File) => void;
  onSkip?: () => void;
  error?: string;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ACCEPTED_TYPES = {
  'image/png': ['.png'],
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/webp': ['.webp']
};

export function ImageDropzone({ onImageSelect, onSkip, error }: ImageDropzoneProps) {
  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      onImageSelect(file);
    }
  }, [onImageSelect]);

  const {
    getRootProps,
    getInputProps,
    isDragActive,
    fileRejections
  } = useDropzone({
    onDrop,
    accept: ACCEPTED_TYPES,
    maxFiles: 1,
    maxSize: MAX_FILE_SIZE
  });

  const rejectionError = fileRejections.length > 0 
    ? fileRejections[0].errors[0]?.message 
    : null;

  return (
    <div className="w-full max-w-none md:max-w-2xl mx-auto space-y-6">
      <div
        {...getRootProps()}
        className={`
          border-2 border-dashed rounded-lg p-6 md:p-12 text-center cursor-pointer transition-all duration-200 min-h-[200px] md:min-h-auto flex flex-col justify-center
          ${isDragActive 
            ? 'border-primary bg-primary/10' 
            : 'border-border hover:border-primary'
          }
        `}
      >
        <input {...getInputProps()} />
        <Upload className="mx-auto h-10 w-10 md:h-12 md:w-12 text-muted-foreground mb-4 md:mb-6" />
        
        {isDragActive ? (
          <p className="font-head text-lg md:text-xl font-black text-primary">
            Drop your image here...
          </p>
        ) : (
          <div className="space-y-3 md:space-y-4">
            <p className="font-head text-lg md:text-xl font-black text-card-foreground">
              Drag & drop an image here
            </p>
            <p className="font-sans text-sm md:text-base text-muted-foreground">
              or tap to select from your device
            </p>
            <p className="font-sans text-xs md:text-sm text-muted-foreground">
              Supports PNG, JPEG, WebP <span className="hidden sm:inline">• Max 10MB</span>
            </p>
          </div>
        )}
      </div>
      
      {/* Skip Option */}
      {onSkip && (
        <div className="text-center space-y-3">
          <div className="flex items-center justify-center space-x-4">
            <div className="flex-1 h-px bg-border"></div>
            <span className="font-sans text-sm text-muted-foreground px-2">or</span>
            <div className="flex-1 h-px bg-border"></div>
          </div>
          <Button
            onClick={onSkip}
            variant="outline"
            className="w-full md:w-auto"
          >
            Skip and use text only
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      )}

      {(error || rejectionError) && (
        <Alert className="mt-4" status="error">
          <Alert.Description>
            {error || rejectionError}
          </Alert.Description>
        </Alert>
      )}
    </div>
  );
}