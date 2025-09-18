'use client';

import { useState } from 'react';
import { HistoryItem } from '@/types';
import { Button } from '@/components/retroui/Button';
import { Card } from '@/components/retroui/Card';
import { Badge } from '@/components/retroui/Badge';
import { Dialog } from '@/components/retroui/Dialog';
import { Tooltip } from '@/components/retroui/Tooltip';
import { ScrollArea } from '@/components/retroui/ScrollArea';
import { formatTimestamp } from '@/lib/historyUtils';
import { History, RotateCcw, Trash2, Image as ImageIcon } from 'lucide-react';

interface ImageHistoryProps {
  history: HistoryItem[];
  currentId: string | null;
  previewId?: string | null; // ID of the item being previewed (not committed)
  onPreview: (id: string) => void; // Just preview the image
  onRevert: (id: string) => void; // Actually revert to this version
  onClearHistory: () => void;
}

export function ImageHistory({ history, currentId, previewId, onPreview, onRevert, onClearHistory }: ImageHistoryProps) {
  const [showConfirmClear, setShowConfirmClear] = useState(false);

  if (history.length === 0) {
    return null;
  }

  const currentIndex = currentId ? history.findIndex(item => item.id === currentId) : -1;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-head text-xl font-black text-foreground flex items-center gap-3">
          <History className="h-6 w-6" />
          Image History ({history.length})
        </h3>
        
        <Dialog open={showConfirmClear} onOpenChange={setShowConfirmClear}>
          <Dialog.Trigger asChild>
            <Button variant="outline" size="sm" className="text-destructive hover:text-destructive font-sans font-bold">
              <Trash2 className="h-4 w-4 mr-2" />
              Clear History
            </Button>
          </Dialog.Trigger>
          <Dialog.Content>
            <Dialog.Header>
              <h3 className="font-head text-lg font-black text-foreground">Clear Image History</h3>
              <Dialog.Description className="font-sans text-muted-foreground">
                This will permanently delete all images in your history. This action cannot be undone.
              </Dialog.Description>
            </Dialog.Header>
            <Dialog.Footer>
              <Button variant="outline" onClick={() => setShowConfirmClear(false)} className="font-sans font-bold">
                Cancel
              </Button>
              <Button
                onClick={() => {
                  onClearHistory();
                  setShowConfirmClear(false);
                }}
                className="bg-destructive hover:bg-destructive/90 font-sans font-bold"
              >
                Clear History
              </Button>
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog>
      </div>

      <ScrollArea className="w-full whitespace-nowrap">
        <div className="flex gap-4 pb-4">
          <Tooltip.Provider>
            {history.map((item, index) => {
              const isCurrent = item.id === currentId;
              const isBeingPreviewed = item.id === previewId;
              const isAfterCurrent = currentIndex !== -1 && index > currentIndex;
              
              return (
                <Tooltip key={item.id}>
                  <Tooltip.Trigger asChild>
                    <Card 
                      className={`
                        relative flex-shrink-0 w-32 h-32 p-2 cursor-pointer transition-all duration-200
                        ${isCurrent 
                          ? 'ring-2 ring-green-500 bg-green-500/10' 
                          : isBeingPreviewed
                            ? 'ring-2 ring-blue-500 bg-blue-500/10'
                            : isAfterCurrent 
                              ? 'opacity-50' 
                              : 'hover:bg-accent/50'
                        }
                      `}
                      onClick={() => onPreview(item.id)}
                    >
                      <div className="w-full h-20 bg-muted rounded overflow-hidden mb-2">
                        <img
                          src={item.imageData.startsWith('data:') ? item.imageData : `data:image/png;base64,${item.imageData}`}
                          alt={item.prompt}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1">
                          {item.isOriginal ? (
                            <Badge variant="surface" size="sm" className="text-xs px-1 py-0">
                              <ImageIcon className="h-3 w-3 mr-1" />
                              Original
                            </Badge>
                          ) : (
                            <Badge variant="outline" size="sm" className="text-xs px-1 py-0">
                              #{index}
                            </Badge>
                          )}
                        </div>
                        
                        {!isCurrent && (
                          <Button
                            size="sm"
                            variant={isBeingPreviewed ? "default" : "outline"}
                            className={`h-6 w-6 p-0 ${
                              isBeingPreviewed 
                                ? 'bg-primary hover:bg-primary/90 text-primary-foreground' 
                                : 'hover:bg-primary/20'
                            }`}
                            onClick={(e) => {
                              e.stopPropagation();
                              onRevert(item.id);
                            }}
                          >
                            <RotateCcw className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                      
                      {isCurrent && (
                        <div className="absolute -top-1 -right-1">
                          <div className="w-3 h-3 bg-green-500 rounded-full border-2 border-background"></div>
                        </div>
                      )}
                      {isBeingPreviewed && !isCurrent && (
                        <div className="absolute -top-1 -left-1">
                          <div className="w-3 h-3 bg-blue-500 rounded-full border-2 border-background"></div>
                        </div>
                      )}
                    </Card>
                  </Tooltip.Trigger>
                  <Tooltip.Content side="bottom" className="max-w-xs">
                    <div className="space-y-1">
                      <p className="font-sans font-bold text-foreground">
                        {item.isOriginal ? 'Original Image' : `Edit #${index}`}
                      </p>
                      <p className="font-sans text-sm text-muted-foreground">
                        {item.prompt || 'No prompt'}
                      </p>
                      <p className="font-sans text-xs text-muted-foreground">
                        {formatTimestamp(item.timestamp)}
                      </p>
                      {!isCurrent && (
                        <p className="font-sans text-xs text-primary font-medium">
                          {isBeingPreviewed 
                            ? 'Click ↻ button to revert to this version' 
                            : 'Click to preview • Click ↻ to revert'}
                        </p>
                      )}
                    </div>
                  </Tooltip.Content>
                </Tooltip>
              );
            })}
          </Tooltip.Provider>
        </div>
      </ScrollArea>
      
      {currentIndex !== -1 && currentIndex < history.length - 1 && (
        <div className="font-sans text-sm text-primary bg-primary/10 border border-primary/30 p-4 rounded-lg">
          <p className="font-bold">⚠️ You&apos;re viewing a previous version</p>
          <p className="text-xs mt-1 text-muted-foreground">
            {history.length - currentIndex - 1} newer version(s) will be removed if you generate a new image from here.
          </p>
        </div>
      )}
    </div>
  );
}