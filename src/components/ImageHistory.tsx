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
        <div className="flex gap-2 pb-2">
          {history.map((item, index) => {
            const isCurrent = item.id === currentId;
            const isAfterCurrent = currentIndex !== -1 && index > currentIndex;
            
            return (
              <div key={item.id} className="flex-shrink-0">
                <div 
                  className={`
                    group relative w-16 h-16 md:w-20 md:h-20 cursor-pointer transition-all duration-200 overflow-hidden rounded-lg border-2
                    ${isCurrent 
                      ? 'border-primary' 
                      : isAfterCurrent 
                        ? 'opacity-40 grayscale border-border' 
                        : 'border-border hover:border-primary/50'
                    }
                  `}
                >
                  {/* Image Thumbnail */}
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
                  
                  {/* Revert button */}
                  {!isCurrent && (
                    <div className="absolute inset-0 bg-black/50 opacity-0 transition-opacity duration-200 group-hover:opacity-100 flex items-center justify-center">
                      <Button
                        size="sm"
                        variant="default"
                        className="h-6 w-6 p-0 bg-white/90 hover:bg-white text-black"
                        onClick={(e) => {
                          e.stopPropagation();
                          onRevert(item.id);
                        }}
                      >
                        <RotateCcw className="h-3 w-3" />
                      </Button>
                    </div>
                  )}
                </div>
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