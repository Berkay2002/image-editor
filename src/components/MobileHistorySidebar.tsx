'use client';

import { useState } from 'react';
import { Button } from '@/components/retroui/Button';
import { Menu, X } from 'lucide-react';
import { HistoryItem } from '@/types';

interface MobileHistorySidebarProps {
  history: HistoryItem[];
  currentId: string | null;
  onRevert: (id: string) => void;
}

export function MobileHistorySidebar({
  history,
  currentId,
  onRevert,
}: MobileHistorySidebarProps) {
  const [isOpen, setIsOpen] = useState(false);

  const openSidebar = () => setIsOpen(true);
  const closeSidebar = () => setIsOpen(false);

  // Don't render if there's no image uploaded yet
  if (history.length === 0) {
    return null;
  }

  return (
    <>
      {/* Hamburger Menu Button - Fixed position top-left */}
      <Button
        variant="outline"
        size="sm"
        onClick={openSidebar}
        className="fixed z-40 md:hidden w-10 h-10 p-0 bg-background/80 backdrop-blur-sm border-border flex items-center justify-center mobile-hamburger-position"
      >
        <Menu className="h-4 w-4" />
      </Button>

      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-50 md:hidden"
          onClick={closeSidebar}
        />
      )}

      {/* Sidebar */}
      <div
        className={`
          fixed top-0 left-0 h-full w-80 max-w-[85vw] bg-background border-r border-border z-50 md:hidden
          transform transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        {/* Sidebar Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="font-head text-lg font-bold text-foreground">
            History
          </h2>
          <Button
            variant="default"
            size="sm"
            onClick={closeSidebar}
            className="w-8 h-8 p-0 flex items-center justify-center"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Sidebar Content */}
        <div className="p-4 overflow-y-auto h-[calc(100%-4rem)]">
          {history.length > 1 ? (
            <div className="space-y-4">
              <p className="font-sans text-sm text-muted-foreground">
                Tap any image to return to that version
              </p>
              <div className="space-y-3">
                {history.map((item, index) => {
                  const isCurrent = item.id === currentId;
                  const isAfterCurrent = currentId ? history.findIndex(h => h.id === currentId) < index : false;
                  
                  return (
                    <div
                      key={item.id}
                      className={`
                        relative border rounded-lg p-3 transition-all
                        ${isCurrent 
                          ? 'border-primary bg-primary/5' 
                          : isAfterCurrent 
                            ? 'border-border/50 opacity-50' 
                            : 'border-border hover:border-primary/50 cursor-pointer'
                        }
                      `}
                      onClick={() => !isCurrent && !isAfterCurrent && onRevert(item.id)}
                    >
                      <div className="flex items-start gap-3">
                        {/* Thumbnail */}
                        <div className="w-12 h-12 rounded overflow-hidden flex-shrink-0">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={item.imageData.startsWith('data:') ? item.imageData : `data:image/png;base64,${item.imageData}`}
                            alt={item.prompt || 'History image'}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        
                        {/* Details */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-sans text-sm font-medium">
                              {item.isOriginal ? 'Original' : `Edit ${index}`}
                            </span>
                            {isCurrent && (
                              <span className="text-xs bg-primary text-primary-foreground px-1.5 py-0.5 rounded">
                                Current
                              </span>
                            )}
                          </div>
                          {item.prompt && !item.isOriginal && (
                            <p className="font-sans text-xs text-muted-foreground line-clamp-2">
                              {item.prompt}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="text-center py-8 space-y-4">
              <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mx-auto">
                <Menu className="h-6 w-6 text-muted-foreground" />
              </div>
              <div className="space-y-2">
                <p className="font-head text-base font-bold text-foreground">
                  Start editing!
                </p>
                <p className="font-sans text-sm text-muted-foreground leading-relaxed">
                  Use the prompt input below to describe how you want to edit your image. Your history will appear here.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}