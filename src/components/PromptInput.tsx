'use client';

import { useState } from 'react';
import { Textarea } from '@/components/retroui/Textarea';
import { Button } from '@/components/retroui/Button';
import { Separator } from '@/components/retroui/Separator';
import { Loader2, Sparkles, RotateCcw } from 'lucide-react';

interface PromptInputProps {
  prompt: string;
  onPromptChange: (prompt: string) => void;
  onGenerate: () => void;
  onClear: () => void;
  isLoading?: boolean;
  disabled?: boolean;
}

const MAX_PROMPT_LENGTH = 1000;

export function PromptInput({
  prompt,
  onPromptChange,
  onGenerate,
  onClear,
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
    <div className="w-full max-w-2xl mx-auto space-y-4">
      <div className="space-y-4">
        <label htmlFor="prompt" className="font-head text-lg font-black text-foreground block">
          Describe how you want to edit your image
        </label>
        
        <div className="relative">
          <Textarea
            id="prompt"
            placeholder="e.g., Make the sky more vibrant blue, add flying birds, change to sunset lighting...&#10;&#10;💡 Press Enter to generate • Shift+Enter for new line"
            value={prompt}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => onPromptChange(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            disabled={isLoading || disabled}
            className={`min-h-[100px] resize-none transition-all ${
              isFocused ? 'ring-2 ring-blue-500' : ''
            } ${isOverLimit ? 'border-red-500 focus:border-red-500' : ''}`}
          />
          
          <div className={`absolute bottom-3 right-3 font-sans text-xs font-medium transition-colors ${
            isOverLimit 
              ? 'text-destructive' 
              : characterCount > MAX_PROMPT_LENGTH * 0.8 
                ? 'text-primary' 
                : 'text-muted-foreground'
          }`}>
            {characterCount}/{MAX_PROMPT_LENGTH}
          </div>
        </div>
        
        {isOverLimit && (
          <p className="font-sans text-sm text-destructive font-medium">
            Please keep your prompt under {MAX_PROMPT_LENGTH} characters.
          </p>
        )}
      </div>

      <Separator />

      <div className="flex gap-3 justify-end">
        <Button
          onClick={onGenerate}
          disabled={!canGenerate}
          className="flex items-center gap-2 min-w-[120px] font-sans font-bold"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
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