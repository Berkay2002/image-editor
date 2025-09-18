'use client';

import { useState } from 'react';
import { Textarea } from '@/components/retroui/Textarea';
import { Button } from '@/components/retroui/Button';
import { Loader2, Sparkles } from 'lucide-react';

interface PromptInputProps {
  prompt: string;
  onPromptChange: (prompt: string) => void;
  onGenerate: () => void;
  isLoading?: boolean;
  disabled?: boolean;
}

const MAX_PROMPT_LENGTH = 1000;

export function PromptInput({
  prompt,
  onPromptChange,
  onGenerate,
  isLoading = false,
  disabled = false
}: PromptInputProps) {
  const [isFocused, setIsFocused] = useState(false);

  const characterCount = prompt.length;
  const isOverLimit = characterCount > MAX_PROMPT_LENGTH;
  const canGenerate = prompt.trim().length > 0 && !isOverLimit && !isLoading && !disabled;

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Trigger generation on Enter (but not Shift+Enter for new lines)
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (canGenerate) {
        onGenerate();
      }
    }
  };

  return (
    <div className="w-full space-y-3">
      {/* Input Row with Textarea and Button */}
      <div className="flex gap-2 items-end">
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