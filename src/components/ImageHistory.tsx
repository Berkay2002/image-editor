'use client';
import Image from 'next/image';
import { HistoryItem } from '@/types';
import { Button } from '@/components/retroui/Button';
import { ScrollArea } from '@/components/retroui/ScrollArea';
import { RotateCcw } from 'lucide-react';

interface ImageHistoryProps {
  history: HistoryItem[];
  currentId: string | null;
  onRevert: (id: string) => void;
}

export function ImageHistory({ history, currentId, onRevert }: ImageHistoryProps) {

  if (history.length === 0) {
    return null;
  }

  const currentIndex = currentId ? history.findIndex(item => item.id === currentId) : -1;

  return (
    <div>

      {/* Compact History Cards */}
      <ScrollArea className="w-full">
        <div className="flex gap-3 pb-2">
          {history.map((item, index) => {
            const isCurrent = item.id === currentId;
            const isAfterCurrent = currentIndex !== -1 && index > currentIndex;
            
            return (
              <div key={item.id} className="flex-shrink-0 flex flex-col items-center gap-1">
                {/* Image Thumbnail */}
                <div 
                  className={`
                    relative w-16 h-16 md:w-20 md:h-20 transition-all duration-200 overflow-hidden rounded-lg border-2
                    ${isCurrent 
                      ? 'border-primary' 
                      : isAfterCurrent 
                        ? 'opacity-40 grayscale border-border' 
                        : 'border-border hover:border-primary/50'
                    }
                  `}
                >
                  <Image
                    src={item.imageData.startsWith('data:') ? item.imageData : `data:image/png;base64,${item.imageData}`}
                    alt={item.prompt || 'History image'}
                    width={80}
                    height={80}
                    className="w-full h-full object-cover object-center"
                    unoptimized
                  />
                  
                  {/* Current indicator */}
                  {isCurrent && (
                    <div className="absolute top-1 right-1">
                      <div className="w-2 h-2 bg-primary rounded-full"></div>
                    </div>
                  )}
                </div>
                
                {/* Revert button - now outside the image */}
                {!isCurrent && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-6 w-12 p-0 text-xs font-medium"
                    onClick={() => onRevert(item.id)}
                    disabled={isAfterCurrent}
                  >
                    <RotateCcw className="h-2.5 w-2.5 mr-0.5" />
                    Go
                  </Button>
                )}
                
                {/* Current label */}
                {isCurrent && (
                  <div className="text-xs font-medium text-primary px-1">
                    Current
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </ScrollArea>
      
      {/* Compact warning message */}
      {currentIndex !== -1 && currentIndex < history.length - 1 && (
        <div className="bg-amber-50 border border-amber-200 rounded-md p-2">
          <p className="font-sans text-xs font-bold text-amber-800 mb-1">
            ⚠️ Viewing previous version
          </p>
          <p className="font-sans text-xs text-amber-700">
            {history.length - currentIndex - 1} newer version(s) will be removed if you generate from here.
          </p>
        </div>
      )}
    </div>
  );
}