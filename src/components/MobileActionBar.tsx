'use client';

import { Button } from '@/components/retroui/Button';
import { Sparkles, Download } from 'lucide-react';

interface MobileActionBarProps {
  canGenerate: boolean;
  isLoading: boolean;
  hasOutputImage: boolean;
  onGenerate: () => void;
  onDownload: () => void;
}

export function MobileActionBar({
  canGenerate,
  isLoading,
  hasOutputImage,
  onGenerate,
  onDownload,
}: MobileActionBarProps) {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-background border-t-2 border-border p-3 md:hidden z-50">
      <div className="flex gap-3 max-w-sm mx-auto">
        {hasOutputImage && (
          <Button
            onClick={onDownload}
            variant="outline"
            className="flex items-center justify-center gap-2 h-12 font-sans font-bold flex-1"
          >
            <Download className="h-4 w-4" />
            Download
          </Button>
        )}
        <Button
          onClick={onGenerate}
          disabled={!canGenerate}
          className={`flex items-center justify-center gap-2 h-12 font-sans font-bold ${
            hasOutputImage ? 'flex-[2]' : 'flex-1'
          }`}
        >
          {isLoading ? (
            <>
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              Generating...
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4" />
              Generate
            </>
          )}
        </Button>
      </div>
    </div>
  );
}