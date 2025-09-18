'use client';
import Image from 'next/image';
import { HistoryItem } from '@/types';
import { Button } from '@/components/retroui/Button';
import { RotateCcw, User, Bot } from 'lucide-react';

interface ChatHistoryProps {
  history: HistoryItem[];
  currentId: string | null;
  onRevert: (id: string) => void;
}

export function ChatHistory({ history, currentId, onRevert }: ChatHistoryProps) {
  if (history.length === 0) {
    return null;
  }

  const currentIndex = currentId ? history.findIndex(item => item.id === currentId) : -1;

  return (
    <div className="flex flex-col space-y-6 pb-6">
      {history.map((item, index) => {
        const isCurrent = item.id === currentId;
        const isAfterCurrent = currentIndex !== -1 && index > currentIndex;
        const isOriginal = item.isOriginal;
        
        return (
          <div key={item.id} className={`flex flex-col space-y-3 ${isAfterCurrent ? 'opacity-40' : ''}`}>
            {/* User message for original image upload */}
            {isOriginal && (
              <div className="flex items-start space-x-3 px-2">
                <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center flex-shrink-0 shadow-sm">
                  <User className="w-4 h-4 text-primary-foreground" />
                </div>
                <div className="flex-1 bg-card border border-border rounded-xl p-4 max-w-[85%] shadow-sm">
                  <p className="font-sans text-sm text-card-foreground leading-relaxed">
                    Uploaded an image to edit
                  </p>
                </div>
              </div>
            )}
            
            {/* User message for prompts (except original) */}
            {!isOriginal && item.prompt && (
              <div className="flex items-start space-x-3 px-2">
                <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center flex-shrink-0 shadow-sm">
                  <User className="w-4 h-4 text-primary-foreground" />
                </div>
                <div className="flex-1 bg-card border border-border rounded-xl p-4 max-w-[85%] shadow-sm">
                  <p className="font-sans text-sm text-card-foreground leading-relaxed">
                    {item.prompt}
                  </p>
                </div>
              </div>
            )}

            {/* AI response with image */}
            <div className="flex items-start space-x-3 px-2">
              <div className="w-8 h-8 bg-secondary rounded-full flex items-center justify-center flex-shrink-0 shadow-sm">
                <Bot className="w-4 h-4 text-secondary-foreground" />
              </div>
              <div className="flex-1 space-y-2">
                <div className={`bg-muted/50 border border-border rounded-xl p-4 transition-all hover:bg-muted/70 ${
                  isCurrent ? 'ring-2 ring-primary shadow-md bg-primary/5' : 'shadow-sm'
                }`}>
                  {/* Image thumbnail */}
                  <div className="relative w-full max-w-[220px] aspect-square mb-3">
                    <Image
                      src={item.imageData.startsWith('data:') ? item.imageData : `data:image/png;base64,${item.imageData}`}
                      alt={item.prompt || 'Generated image'}
                      width={220}
                      height={220}
                      className="w-full h-full object-cover rounded-lg border border-border/50"
                      unoptimized
                    />
                    
                    {/* Current indicator */}
                    {isCurrent && (
                      <div className="absolute top-3 right-3">
                        <div className="w-4 h-4 bg-primary rounded-full border-2 border-background shadow-sm flex items-center justify-center">
                          <div className="w-2 h-2 bg-primary-foreground rounded-full"></div>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Message text */}
                  <p className="font-sans text-sm text-muted-foreground leading-relaxed mb-3">
                    {isOriginal ? 'Original image uploaded' : 'Here\'s your edited image'}
                  </p>
                  
                  {/* Action buttons */}
                  <div className="flex items-center justify-between">
                    <span className="font-sans text-xs text-muted-foreground font-medium">
                      {isCurrent ? (
                        <span className="text-primary flex items-center gap-1">
                          <div className="w-2 h-2 bg-primary rounded-full"></div>
                          Currently viewing
                        </span>
                      ) : (
                        `Version ${index + 1}`
                      )}
                    </span>
                    
                    {!isCurrent && !isAfterCurrent && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 px-3 text-xs font-medium hover:bg-primary hover:text-primary-foreground transition-colors"
                        onClick={() => onRevert(item.id)}
                      >
                        <RotateCcw className="h-3 w-3 mr-1" />
                        Use this
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })}
      
      {/* Warning message for reverted state */}
      {currentIndex !== -1 && currentIndex < history.length - 1 && (
        <div className="mx-13 bg-amber-50/80 border border-amber-200/60 rounded-xl p-4 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-amber-600 text-sm">⚠️</span>
            </div>
            <div className="space-y-1">
              <p className="font-sans text-sm font-bold text-amber-800">
                Viewing previous version
              </p>
              <p className="font-sans text-xs text-amber-700 leading-relaxed">
                {history.length - currentIndex - 1} newer version(s) will be removed if you generate from here.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}