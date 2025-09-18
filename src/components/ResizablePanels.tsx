'use client';

import { useState, useRef, useCallback, useEffect, ReactNode } from 'react';
import { GripVertical } from 'lucide-react';

interface ResizablePanelsProps {
  leftPanel: ReactNode;
  rightPanel: ReactNode;
  defaultLeftWidth?: number; // percentage
  minLeftWidth?: number; // percentage
  maxLeftWidth?: number; // percentage
  className?: string;
}

export function ResizablePanels({
  leftPanel,
  rightPanel,
  defaultLeftWidth = 35,
  minLeftWidth = 25,
  maxLeftWidth = 60,
  className = ''
}: ResizablePanelsProps) {
  const [leftWidth, setLeftWidth] = useState(defaultLeftWidth);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const startX = useRef(0);
  const startLeftWidth = useRef(0);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    startX.current = e.clientX;
    startLeftWidth.current = leftWidth;
    
    // Add cursor style to body during drag
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    document.body.classList.add('resizing');
  }, [leftWidth]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    const step = 2; // 2% step size
    let newWidth = leftWidth;
    
    switch (e.key) {
      case 'ArrowLeft':
        newWidth = Math.max(leftWidth - step, minLeftWidth);
        break;
      case 'ArrowRight':
        newWidth = Math.min(leftWidth + step, maxLeftWidth);
        break;
      case 'Home':
        newWidth = minLeftWidth;
        break;
      case 'End':
        newWidth = maxLeftWidth;
        break;
      case 'Enter':
      case ' ':
        newWidth = defaultLeftWidth;
        break;
      default:
        return; // Don't prevent default for other keys
    }
    
    e.preventDefault();
    setLeftWidth(newWidth);
  }, [leftWidth, minLeftWidth, maxLeftWidth, defaultLeftWidth]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging || !containerRef.current) return;

    const container = containerRef.current;
    const containerWidth = container.offsetWidth;
    const deltaX = e.clientX - startX.current;
    const deltaPercentage = (deltaX / containerWidth) * 100;
    const newLeftWidth = startLeftWidth.current + deltaPercentage;

    // Apply constraints
    const constrainedWidth = Math.min(Math.max(newLeftWidth, minLeftWidth), maxLeftWidth);
    setLeftWidth(constrainedWidth);
  }, [isDragging, minLeftWidth, maxLeftWidth]);

  const handleMouseUp = useCallback(() => {
    if (!isDragging) return;
    
    setIsDragging(false);
    
    // Remove cursor style from body
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
    document.body.classList.remove('resizing');
  }, [isDragging]);

  // Effect for handling mouse events
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  // Save panel width to localStorage
  useEffect(() => {
    localStorage.setItem('panelLeftWidth', leftWidth.toString());
  }, [leftWidth]);

  // Load panel width from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('panelLeftWidth');
    if (saved) {
      const savedWidth = parseFloat(saved);
      if (savedWidth >= minLeftWidth && savedWidth <= maxLeftWidth) {
        setLeftWidth(savedWidth);
      }
    }
  }, [minLeftWidth, maxLeftWidth]);

  const rightWidth = 100 - leftWidth;

  return (
    <div 
      ref={containerRef} 
      className={`flex h-screen w-full ${className}`}
    >
      {/* Left Panel */}
      <div 
        style={{ width: `${leftWidth}%` }}
        className="flex flex-col border-r border-border bg-background transition-all duration-75 ease-out min-w-0"
      >
        {leftPanel}
      </div>
      
      {/* Resize Handle */}
      <div
        className={`relative flex items-center justify-center w-1 bg-border hover:bg-primary/20 cursor-col-resize group transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary/50 ${
          isDragging ? 'bg-primary/30' : ''
        }`}
        onMouseDown={handleMouseDown}
        onKeyDown={handleKeyDown}
        tabIndex={0}
        role="separator"
        aria-orientation="vertical"
        aria-valuenow={leftWidth}
        aria-valuemin={minLeftWidth}
        aria-valuemax={maxLeftWidth}
        aria-label="Resize panels (use arrow keys, Home/End, Enter to reset)"
      >
        {/* Visual grip indicator */}
        <div className={`absolute inset-y-0 flex items-center justify-center w-3 -mx-1 rounded transition-all duration-200 ${
          isDragging ? 'bg-primary/20 scale-110' : 'group-hover:bg-muted/50'
        }`}>
          <GripVertical className={`w-3 h-8 transition-colors duration-200 ${
            isDragging ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'
          }`} />
        </div>
        
        {/* Tooltip */}
        <div className="absolute top-4 left-4 bg-background border border-border rounded-md px-2 py-1 text-xs font-medium text-muted-foreground opacity-0 group-hover:opacity-100 group-focus:opacity-100 transition-opacity duration-200 pointer-events-none z-10 whitespace-nowrap">
          {isDragging ? 'Resizing...' : 'Drag to resize ← →'}
        </div>
      </div>
      
      {/* Right Panel */}
      <div 
        style={{ width: `${rightWidth}%` }}
        className="flex flex-col bg-background transition-all duration-75 ease-out min-w-0"
      >
        {rightPanel}
      </div>
    </div>
  );
}