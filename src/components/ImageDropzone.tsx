'use client';

import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Alert } from '@/components/retroui/Alert';
import { Upload } from 'lucide-react';

interface ImageDropzoneProps {
  onImageSelect: (file: File) => void;
  error?: string;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ACCEPTED_TYPES = {
  'image/png': ['.png'],
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/webp': ['.webp']
};

export function ImageDropzone({ onImageSelect, error }: ImageDropzoneProps) {
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
    <div className="w-full max-w-2xl mx-auto">
      <div
        {...getRootProps()}
        className={`
          border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-all duration-200
          ${isDragActive 
            ? 'border-primary bg-primary/10' 
            : 'border-border hover:border-primary'
          }
        `}
      >
        <input {...getInputProps()} />
        <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-6" />
        
        {isDragActive ? (
          <p className="font-head text-xl font-black text-primary">
            Drop your image here...
          </p>
        ) : (
          <div>
            <p className="font-head text-xl font-black text-card-foreground mb-3">
              Drag & drop an image here
            </p>
            <p className="font-sans text-base text-muted-foreground mb-6">
              or click to select from your computer
            </p>
            <p className="font-sans text-sm text-muted-foreground">
              Supports PNG, JPEG, WebP • Max 10MB
            </p>
          </div>
        )}
      </div>

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