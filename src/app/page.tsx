'use client';

import { useState, useTransition, useEffect } from 'react';
import { ImageDropzone } from '@/components/ImageDropzone';
import { ImagePreview } from '@/components/ImagePreview';
import { PromptInput } from '@/components/PromptInput';
import { ImageHistory } from '@/components/ImageHistory';
import { Button } from '@/components/retroui/Button';
import { Alert } from '@/components/retroui/Alert';
import { Separator } from '@/components/retroui/Separator';
import { Loader } from '@/components/retroui/loader';
import { editImage } from '@/app/actions/editImage';
import { downloadBase64Image } from '@/lib/download';
import { resizeImage, shouldResizeImage } from '@/lib/imageUtils';
import { loadHistory, saveHistory, clearHistory, createHistoryItem } from '@/lib/historyUtils';
import { AppState } from '@/types';
import { Download } from 'lucide-react';

export default function Home() {
  const [state, setState] = useState<AppState>({
    imageFile: null,
    prompt: '',
    outputImage: null,
    status: 'idle',
    imageHistory: [],
    currentHistoryId: null
  });
  
  const [, startTransition] = useTransition();

  // Load history from localStorage on component mount
  useEffect(() => {
    const savedHistory = loadHistory();
    if (savedHistory.length > 0) {
      setState(prev => ({
        ...prev,
        imageHistory: savedHistory,
        // Set the last item as current if there's history
        currentHistoryId: savedHistory[savedHistory.length - 1]?.id || null,
        outputImage: savedHistory[savedHistory.length - 1]?.imageData || null
      }));
    }
  }, []);

  const handleImageSelect = async (file: File) => {
    // Convert file to base64 for history
    const reader = new FileReader();
    reader.onload = (e) => {
      const base64Data = e.target?.result as string;
      const originalItem = createHistoryItem(base64Data, '', true);
      const newHistory = [originalItem];
      
      setState(prev => ({
        ...prev,
        imageFile: file,
        status: 'idle',
        outputImage: null,
        errorMessage: undefined,
        imageHistory: newHistory,
        currentHistoryId: originalItem.id
      }));
      
      saveHistory(newHistory);
    };
    reader.readAsDataURL(file);
  };

  const handlePromptChange = (prompt: string) => {
    setState(prev => ({ ...prev, prompt }));
  };

  const handleGenerate = () => {
    if (!state.imageFile || !state.prompt.trim()) return;
    
    // Set loading state immediately
    setState(prev => ({ ...prev, status: 'loading' }));
    
    startTransition(async () => {
      try {
        
        // Check if we should use an image from history or the original file
        let imageToProcess: File;
        
        if (state.currentHistoryId && state.imageHistory.length > 0) {
          // Find the current history item
          const currentHistoryItem = state.imageHistory.find(item => item.id === state.currentHistoryId);
          if (currentHistoryItem && !currentHistoryItem.isOriginal) {
            // Convert base64 back to File for processing
            const base64Data = currentHistoryItem.imageData.startsWith('data:') ? 
              currentHistoryItem.imageData : `data:image/png;base64,${currentHistoryItem.imageData}`;
            const response = await fetch(base64Data);
            const blob = await response.blob();
            imageToProcess = new File([blob], 'current-image.png', { type: 'image/png' });
          } else {
            imageToProcess = state.imageFile!;
          }
        } else {
          imageToProcess = state.imageFile!;
        }
        
        const needsResize = await shouldResizeImage(imageToProcess, 3); // 3MB limit for safety
        
        if (needsResize) {
          console.log('Resizing image to reduce file size...');
          imageToProcess = await resizeImage(imageToProcess, {
            maxWidth: 1920,
            maxHeight: 1920,
            quality: 0.85,
            format: 'jpeg' // JPEG typically has smaller file sizes
          });
        }
        
        const formData = new FormData();
        formData.append('image', imageToProcess);
        formData.append('prompt', state.prompt);
        
        const result = await editImage(formData);
        
        if (result.success && result.data) {
          // Create new history item for the generated image
          const newHistoryItem = createHistoryItem(`data:image/png;base64,${result.data}`, state.prompt);
          
          // Get current history up to the current position
          const currentIndex = state.currentHistoryId ? 
            state.imageHistory.findIndex(item => item.id === state.currentHistoryId) : -1;
          
          let updatedHistory;
          
          // Check if we're editing from a non-original image (AI-generated)
          const currentHistoryItem = currentIndex >= 0 ? state.imageHistory[currentIndex] : null;
          const isEditingFromAIGenerated = currentHistoryItem && !currentHistoryItem.isOriginal;
          
          if (isEditingFromAIGenerated) {
            // Replace the current AI-generated image instead of adding a new one
            updatedHistory = [...state.imageHistory];
            updatedHistory[currentIndex] = newHistoryItem;
          } else {
            // Normal behavior: append new item (when editing from original or first generation)
            const historyUpToCurrent = currentIndex >= 0 ? 
              state.imageHistory.slice(0, currentIndex + 1) : state.imageHistory;
            updatedHistory = [...historyUpToCurrent, newHistoryItem];
          }
          
          setState(prev => ({
            ...prev,
            outputImage: result.data!,
            status: 'success',
            errorMessage: undefined,
            imageHistory: updatedHistory,
            currentHistoryId: newHistoryItem.id
          }));
          
          saveHistory(updatedHistory);
        } else {
          setState(prev => ({
            ...prev,
            status: 'error',
            errorMessage: result.error || 'An unexpected error occurred'
          }));
        }
      } catch (error) {
        console.error('Error generating image:', error);
        setState(prev => ({
          ...prev,
          status: 'error',
          errorMessage: 'Failed to process your request. Please try again.'
        }));
      }
    });
  };

  const handleClear = () => {
    setState({
      imageFile: null,
      prompt: '',
      outputImage: null,
      status: 'idle',
      imageHistory: [],
      currentHistoryId: null
    });
    clearHistory();
  };

  const handleRevert = (historyId: string) => {
    const historyItem = state.imageHistory.find(item => item.id === historyId);
    if (!historyItem) return;

    // Get the index of the item to revert to
    const revertIndex = state.imageHistory.findIndex(item => item.id === historyId);
    if (revertIndex === -1) return;

    // Slice history up to and including the reverted item
    const newHistory = state.imageHistory.slice(0, revertIndex + 1);
    
    setState(prev => ({
      ...prev,
      outputImage: historyItem.imageData.startsWith('data:') ? 
        historyItem.imageData.replace('data:image/png;base64,', '').replace('data:image/jpeg;base64,', '') : 
        historyItem.imageData,
      currentHistoryId: historyId,
      imageHistory: newHistory,
      status: 'success'
    }));
    
    saveHistory(newHistory);
  };

  const handleClearHistory = () => {
    setState(prev => ({
      ...prev,
      imageHistory: [],
      currentHistoryId: null,
      outputImage: null
    }));
    clearHistory();
  };

  const handleDownload = () => {
    // Get the current history item to download
    if (state.currentHistoryId && state.imageHistory.length > 0) {
      const currentHistoryItem = state.imageHistory.find(item => item.id === state.currentHistoryId);
      if (currentHistoryItem && !currentHistoryItem.isOriginal) {
        // Download the current generated image
        const imageData = currentHistoryItem.imageData.startsWith('data:') ? 
          currentHistoryItem.imageData.replace(/^data:image\/[a-z]+;base64,/, '') : 
          currentHistoryItem.imageData;
        const success = downloadBase64Image(imageData);
        if (!success) {
          setState(prev => ({
            ...prev,
            status: 'error',
            errorMessage: 'Failed to download image. Please try again.'
          }));
        }
      }
    }
  };

  // Determine the current image to display based on history
  const getCurrentImageUrl = () => {
    if (state.currentHistoryId && state.imageHistory.length > 0) {
      const currentHistoryItem = state.imageHistory.find(item => item.id === state.currentHistoryId);
      if (currentHistoryItem) {
        if (currentHistoryItem.isOriginal && state.imageFile) {
          return URL.createObjectURL(state.imageFile);
        } else {
          const imageData = currentHistoryItem.imageData.startsWith('data:') ? 
            currentHistoryItem.imageData : `data:image/png;base64,${currentHistoryItem.imageData}`;
          return imageData;
        }
      }
    }
    // Fallback to original if no history
    return state.imageFile ? URL.createObjectURL(state.imageFile) : null;
  };
  
  const currentImageUrl = getCurrentImageUrl();
  
  // Get current image title and prompt
  const getCurrentImageInfo = () => {
    if (state.currentHistoryId && state.imageHistory.length > 0) {
      const currentHistoryItem = state.imageHistory.find(item => item.id === state.currentHistoryId);
      if (currentHistoryItem) {
        return {
          title: currentHistoryItem.isOriginal ? 'Original Image' : 'Generated Image',
          prompt: currentHistoryItem.prompt || 'No prompt'
        };
      }
    }
    return {
      title: 'Original Image',
      prompt: 'No prompt'
    };
  };
  
  const currentImageInfo = getCurrentImageInfo();

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-4xl mx-auto">

        {/* Main Content */}
        <div className="space-y-8">
          {!state.imageFile ? (
            <ImageDropzone 
              onImageSelect={handleImageSelect}
              error={state.status === 'error' ? state.errorMessage : undefined}
            />
          ) : (
            <div className="space-y-8">
              {/* Current Image */}
              <div className="space-y-4">
                {!currentImageInfo.title.includes('Original') && (
                  <div className="flex justify-end mb-4">
                    <Button 
                      onClick={handleDownload} 
                      className="flex items-center gap-2 font-sans font-bold"
                      variant="default"
                    >
                      <Download className="h-4 w-4" />
                      Download
                    </Button>
                  </div>
                )}
                
                <div className="relative w-full max-w-2xl mx-auto">
                  <ImagePreview src={currentImageUrl!} alt={currentImageInfo.title} />
                  {state.status === 'loading' && (
                    <div className="absolute top-0 left-0 right-0 bottom-0 bg-black/50 backdrop-blur-sm rounded-lg flex items-center justify-center">
                      <div className="text-center space-y-4">
                        <Loader variant="default" size="lg" count={5} duration={0.8} delayStep={150} className="justify-center" />
                        <div className="space-y-2">
                          <p className="font-head text-xl font-black text-white">
                            AI is generating your image...
                          </p>
                          <p className="font-sans text-sm text-white/80">
                            This may take a few moments
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                
                {!currentImageInfo.title.includes('Original') && currentImageInfo.prompt !== 'No prompt' && (
                  <div className="bg-muted/50 rounded-lg p-3">
                    <p className="font-sans text-sm text-muted-foreground">
                      <strong>Prompt:</strong> {currentImageInfo.prompt}
                    </p>
                  </div>
                )}
              </div>

              <Separator />

              {/* Prompt Input */}
              <PromptInput
                prompt={state.prompt}
                onPromptChange={handlePromptChange}
                onGenerate={handleGenerate}
                onClear={handleClear}
                isLoading={state.status === 'loading'}
              />

              {/* Image History */}
              {state.imageHistory.length > 0 && (
                <>
                  <Separator />
                  <ImageHistory 
                    history={state.imageHistory}
                    currentId={state.currentHistoryId}
                    onRevert={handleRevert}
                    onClearHistory={handleClearHistory}
                  />
                </>
              )}

              {/* Error Display */}
              {state.status === 'error' && state.errorMessage && (
                <Alert status="error">
                  <Alert.Description>{state.errorMessage}</Alert.Description>
                </Alert>
              )}
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
