'use client';

import { useState, useTransition, useEffect } from 'react';
import { ImageDropzone } from '@/components/ImageDropzone';
import { ImagePreview } from '@/components/ImagePreview';
import { PromptInput } from '@/components/PromptInput';
import { ImageHistory } from '@/components/ImageHistory';
import { MobileActionBar } from '@/components/MobileActionBar';
import { Alert } from '@/components/retroui/Alert';
import { Separator } from '@/components/retroui/Separator';
import { Loader } from '@/components/retroui/loader';
import { editImage } from '@/app/actions/editImage';
import { downloadBase64Image } from '@/lib/download';
import { resizeImage, shouldResizeImage } from '@/lib/imageUtils';
import { loadHistory, saveHistory, createHistoryItem } from '@/lib/historyUtils';
import { AppState } from '@/types';

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
          
          // Always append new generated images to history
          // This creates a linear history: Original → Gen1 → Gen2 → Gen3...
          const updatedHistory = [...state.imageHistory, newHistoryItem];
          
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

  // Check if we can generate (for mobile action bar)
  const canGenerate = Boolean(state.imageFile && state.prompt.trim().length > 0 && state.status !== 'loading');
  const hasOutputImage = Boolean(state.outputImage);

  return (
    <div className="h-screen bg-background overflow-hidden">
      <div className="h-full flex flex-col px-4 py-4 md:py-8 max-w-none mx-auto md:max-w-4xl">

        {/* Header - Hidden on mobile, visible on desktop */}
        <header className="hidden md:block text-center mb-6 md:mb-8 flex-shrink-0">
          <h1 className="font-head text-2xl md:text-3xl lg:text-4xl font-black text-foreground mb-2">
            AI Image Editor
          </h1>
          <p className="font-sans text-sm md:text-base text-muted-foreground">
            Transform your images with AI-powered editing
          </p>
        </header>

        {/* Main Content */}
        <div className="flex-1 flex flex-col min-h-0">
          {!state.imageFile ? (
            <ImageDropzone 
              onImageSelect={handleImageSelect}
              error={state.status === 'error' ? state.errorMessage : undefined}
            />
          ) : (
            <>
              {/* Mobile Layout: History at top, Image below, Prompt at bottom */}
              <div className="md:hidden flex flex-col h-full pb-16">
                {/* Image History - Compact at very top */}
                {state.imageHistory.length > 0 && (
                  <div className="flex-shrink-0 mb-3">
                    <ImageHistory 
                      history={state.imageHistory}
                      currentId={state.currentHistoryId}
                      onRevert={handleRevert}
                    />
                  </div>
                )}
                
                {/* Main Image Section - Right below history */}
                <div className="flex-1 flex flex-col space-y-3 min-h-0">
                  {/* Current Image - Positioned right below history */}
                  <div className="flex-1 flex flex-col justify-start min-h-0">
                    <div className="relative w-full max-w-none mx-auto flex-shrink-0">
                      <ImagePreview src={currentImageUrl!} alt={currentImageInfo.title} />
                      {state.status === 'loading' && (
                        <div className="absolute top-0 left-0 right-0 bottom-0 bg-black/50 backdrop-blur-sm rounded-lg flex items-center justify-center">
                          <div className="text-center space-y-3">
                            <Loader variant="default" size="lg" count={5} duration={0.8} delayStep={150} className="justify-center" />
                            <div className="space-y-3">
                              <p className="font-head text-lg font-black text-white">
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
                      <div className="bg-muted/50 rounded-lg p-2 mt-2 flex-shrink-0">
                        <p className="font-sans text-xs text-muted-foreground">
                          <strong>Prompt:</strong> {currentImageInfo.prompt}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Bottom Section: Prompt Input - positioned close to fixed button */}
                <div className="flex-shrink-0 pt-2">
                  <PromptInput
                    prompt={state.prompt}
                    onPromptChange={handlePromptChange}
                    onGenerate={handleGenerate}
                    isLoading={state.status === 'loading'}
                  />
                  
                  {/* Error Display */}
                  {state.status === 'error' && state.errorMessage && (
                    <div className="mt-2">
                      <Alert status="error">
                        <Alert.Description>{state.errorMessage}</Alert.Description>
                      </Alert>
                    </div>
                  )}
                </div>
              </div>

              {/* Desktop Layout: Original order */}
              <div className="hidden md:flex md:flex-col md:h-full md:space-y-6">
                {/* Current Image */}
                <div className="space-y-4">
                  <div className="relative w-full max-w-2xl mx-auto">
                    <ImagePreview src={currentImageUrl!} alt={currentImageInfo.title} />
                    {state.status === 'loading' && (
                      <div className="absolute top-0 left-0 right-0 bottom-0 bg-black/50 backdrop-blur-sm rounded-lg flex items-center justify-center">
                        <div className="text-center space-y-4">
                          <Loader variant="default" size="lg" count={5} duration={0.8} delayStep={150} className="justify-center" />
                          <div className="space-y-4">
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
                    <div className="bg-muted/50 rounded-lg p-4">
                      <p className="font-sans text-base text-muted-foreground">
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
            </>
          )}
        </div>
      </div>
      
      {/* Mobile Action Bar */}
      {state.imageFile && (
        <MobileActionBar
          canGenerate={canGenerate}
          isLoading={state.status === 'loading'}
          hasOutputImage={hasOutputImage}
          onGenerate={handleGenerate}
          onDownload={handleDownload}
        />
      )}
    </div>
  );
}
