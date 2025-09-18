'use client';

import { useState, useTransition, useEffect } from 'react';
import { ImageDropzone } from '@/components/ImageDropzone';
import { ImagePreview } from '@/components/ImagePreview';
import { ImageErrorBoundary } from '@/components/ImageErrorBoundary';
import { PromptInput } from '@/components/PromptInput';
import { ChatHistory } from '@/components/ChatHistory';
import { MobileHistorySidebar } from '@/components/MobileHistorySidebar';
import { ResizablePanels } from '@/components/ResizablePanels';
import { Alert } from '@/components/retroui/Alert';
import { Loader } from '@/components/retroui/loader';
import { PWAInstallButton } from '@/components/PWAInstallButton';
import { PWAUpdateNotification } from '@/components/PWAUpdateNotification';
import { Bot, Upload } from 'lucide-react';
import { editImage } from '@/app/actions/editImage';
import { resizeImage, shouldResizeImage, batchResizeForAPI, fileToDataURL } from '@/lib/imageUtils';
import { loadHistory, saveHistory, createHistoryItem } from '@/lib/historyUtils';
import { blobURLManager } from '@/lib/blobURLManager';
import { AppState } from '@/types';

export default function Home() {
  const [state, setState] = useState<AppState>({
    imageFile: null,
    prompt: '',
    additionalImages: [],
    outputImage: null,
    status: 'idle',
    imageHistory: [],
    currentHistoryId: null,
    skippedInitialImage: false
  });

  const [, startTransition] = useTransition();
  const [cachedBlobURL, setCachedBlobURL] = useState<string | null>(null);

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

  // Manage blob URL for current image file
  useEffect(() => {
    // Clean up previous cached URL
    if (cachedBlobURL) {
      blobURLManager.releaseURL(cachedBlobURL);
      setCachedBlobURL(null);
    }

    // Create new cached URL if we have an image file
    if (state.imageFile) {
      const newURL = blobURLManager.getOrCreateURL(state.imageFile);
      setCachedBlobURL(newURL);
    }

    // Cleanup function
    return () => {
      if (cachedBlobURL) {
        blobURLManager.releaseURL(cachedBlobURL);
      }
    };
  }, [state.imageFile]); // Only depend on imageFile, not cachedBlobURL to avoid loops

  const handleImageSelect = async (file: File) => {
    try {
      // Convert file to compressed base64 for history storage
      const base64Data = await fileToDataURL(file, true); // true = compress for storage
      const originalItem = createHistoryItem(base64Data, '', true);
      const newHistory = [originalItem];

      setState(prev => ({
        ...prev,
        imageFile: file,
        status: 'idle',
        outputImage: null,
        errorMessage: undefined,
        additionalImages: [], // Reset additional images when new main image is selected
        imageHistory: newHistory,
        currentHistoryId: originalItem.id,
        skippedInitialImage: false // Reset skip flag when image is selected
      }));

      saveHistory(newHistory);
    } catch (error) {
      console.error('[Page] Error processing image:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to process the selected image. Please try again.';
      setState(prev => ({
        ...prev,
        status: 'error',
        errorMessage
      }));
    }
  };

  const handlePromptChange = (prompt: string) => {
    setState(prev => ({ ...prev, prompt }));
  };
  
  const handleAdditionalImagesChange = (images: File[]) => {
    // Additional images can only be added when there's already a main image
    // or when the initial image has been skipped
    setState(prev => ({ ...prev, additionalImages: images }));
  };
  
  const handleSkipImage = () => {
    // Proceed without an image - just change the app state
    setState(prev => ({
      ...prev,
      imageFile: null, // Explicitly set to null to indicate skipped
      status: 'idle',
      outputImage: null,
      additionalImages: [],
      imageHistory: [],
      currentHistoryId: null,
      skippedInitialImage: true
    }));
  };

  const handleGenerate = () => {
    // Allow generation if we have a prompt (images are optional for text-to-image generation)
    if (!state.prompt.trim()) return;
    
    // Set loading state immediately
    setState(prev => ({ ...prev, status: 'loading' }));
    
    startTransition(async () => {
      try {
        
        // Check if we should use an image from history or the original file
        let imageToProcess: File | null = null;
        
        if (state.imageFile) {
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
              imageToProcess = state.imageFile;
            }
          } else {
            imageToProcess = state.imageFile;
          }
        }
        
        // Resize main image if it exists
        if (imageToProcess) {
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
        }
        
        const formData = new FormData();
        if (imageToProcess) {
          formData.append('image', imageToProcess);
        }
        formData.append('prompt', state.prompt);
        
        // Resize and add additional images if any
        if (state.additionalImages.length > 0) {
          console.log('Optimizing additional images for API...');
          const optimizedAdditionalImages = await batchResizeForAPI(state.additionalImages, 3, 1920);
          for (const optimizedImage of optimizedAdditionalImages) {
            formData.append('additionalImages', optimizedImage);
          }
        }
        
        const result = await editImage(formData);
        
        if (result.success && result.data) {
          // Create compressed version for history storage
          const imageData = `data:image/png;base64,${result.data}`;

          // Convert base64 to blob, then to File for compression
          const response = await fetch(imageData);
          const blob = await response.blob();
          const imageFile = new File([blob], 'generated-image.png', { type: 'image/png' });

          // Get compressed version for storage
          const compressedData = await fileToDataURL(imageFile, true);
          const newHistoryItem = createHistoryItem(compressedData, state.prompt);

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



  // Determine the current image to display based on history
  const getCurrentImageUrl = () => {
    if (state.currentHistoryId && state.imageHistory.length > 0) {
      const currentHistoryItem = state.imageHistory.find(item => item.id === state.currentHistoryId);
      if (currentHistoryItem) {
        if (currentHistoryItem.isOriginal && state.imageFile) {
          // Use cached blob URL to prevent recreating it on every render
          return cachedBlobURL;
        } else {
          const imageData = currentHistoryItem.imageData.startsWith('data:') ?
            currentHistoryItem.imageData : `data:image/png;base64,${currentHistoryItem.imageData}`;
          return imageData;
        }
      }
    }
    // Fallback to cached blob URL if we have an image file
    return cachedBlobURL;
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
    <div className="min-h-screen bg-background">
      {/* Mobile Layout */}
      <div className="md:hidden h-dvh flex flex-col mobile-safe-top mobile-safe-bottom">
        {!state.imageFile && !state.skippedInitialImage ? (
          <div className="h-full flex items-center justify-center p-4">
            <ImageDropzone 
              onImageSelect={handleImageSelect}
              onSkip={handleSkipImage}
              error={state.status === 'error' ? state.errorMessage : undefined}
            />
          </div>
        ) : (
          <div className="h-full flex flex-col">
            {/* Main Panel - Similar to desktop right panel */}
            <div className="flex-1 flex flex-col p-4 pb-0 mobile-main-panel overflow-hidden min-h-0 mobile-safe-left mobile-safe-right">
              <div className="flex-1 flex items-center justify-center min-h-0 relative">
                {currentImageUrl ? (
                  <ImageErrorBoundary
                    onReset={() => {
                      setState(prev => ({ ...prev, status: 'idle', errorMessage: undefined }));
                    }}
                  >
                    <ImagePreview
                      src={currentImageUrl}
                      alt={currentImageInfo.title}
                      isMobile={false}
                      className="mobile-main-image"
                      isLoading={state.status === 'loading'}
                      optimizeForContainer={true}
                    />
                  </ImageErrorBoundary>
                ) : state.status === 'loading' ? (
                  <div className="flex items-center justify-center w-full h-full text-center p-6">
                    <div className="space-y-4 max-w-sm">
                      <div className="text-center space-y-4">
                        <Loader variant="default" size="lg" count={5} duration={0.8} delayStep={150} className="justify-center" />
                        <div className="space-y-3">
                          <p className="font-head text-lg font-black text-foreground">
                            AI is generating your image...
                          </p>
                          <p className="font-sans text-sm text-muted-foreground">
                            This may take a few moments
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center w-full h-full text-center p-6">
                    <div className="space-y-4 max-w-sm">
                      <div className="w-16 h-16 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-full flex items-center justify-center mx-auto shadow-sm">
                        <Upload className="w-8 h-8 text-muted-foreground" />
                      </div>
                      <div className="space-y-2">
                        <p className="font-head text-base font-bold text-foreground">
                          No image yet
                        </p>
                        <p className="font-sans text-sm text-muted-foreground leading-relaxed">
                          Add an image using the + button below to get started, or generate text-only content.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
            </div>
            
            {/* Prompt Input Area - Below main panel */}
            <div className="flex-shrink-0 border-t border-border bg-background p-4 mobile-safe-left mobile-safe-right">
              <PromptInput
                prompt={state.prompt}
                onPromptChange={handlePromptChange}
                onGenerate={handleGenerate}
                isLoading={state.status === 'loading'}
                additionalImages={state.additionalImages}
                onAdditionalImagesChange={handleAdditionalImagesChange}
                hasMainImage={!!state.imageFile}
                skippedInitialImage={state.skippedInitialImage}
              />
              
              {/* Error Display */}
              {state.status === 'error' && state.errorMessage && (
                <div className="mt-3">
                  <Alert status="error">
                    <Alert.Description>{state.errorMessage}</Alert.Description>
                  </Alert>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      
      {/* Mobile History Sidebar - Only show when image is uploaded */}
      {state.imageFile && (
        <MobileHistorySidebar
          history={state.imageHistory}
          currentId={state.currentHistoryId}
          onRevert={handleRevert}
        />
      )}
      
      {/* Desktop Layout: Resizable Two-Panel */}
      <div className="hidden md:block">
        {!state.imageFile && !state.skippedInitialImage ? (
          /* Desktop dropzone - full width */
          <div className="h-screen flex items-center justify-center p-8">
            <div className="w-full max-w-2xl">
              <ImageDropzone 
                onImageSelect={handleImageSelect}
                onSkip={handleSkipImage}
                error={state.status === 'error' ? state.errorMessage : undefined}
              />
            </div>
          </div>
        ) : (
          <ResizablePanels
            defaultLeftWidth={35}
            minLeftWidth={25}
            maxLeftWidth={65}
            leftPanel={
              <>
                {/* History Messages - Scrollable */}
                <div className="flex-1 overflow-y-auto p-4 pb-0 chat-history-scroll">
                  {state.imageHistory.length > 0 ? (
                    <ChatHistory 
                      history={state.imageHistory}
                      currentId={state.currentHistoryId}
                      onRevert={handleRevert}
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full text-center p-8">
                      <div className="space-y-4 max-w-[280px]">
                        <div className="w-16 h-16 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-full flex items-center justify-center mx-auto shadow-sm">
                          <Bot className="w-8 h-8 text-muted-foreground" />
                        </div>
                        <div className="space-y-2">
                          <p className="font-head text-base font-bold text-foreground">
                            Ready to create!
                          </p>
                          <p className="font-sans text-sm text-muted-foreground leading-relaxed">
                            Describe how you want to transform your image using the prompt below and click the ✨ button to generate.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Fixed Prompt Input at Bottom */}
                <div className="flex-shrink-0 border-t border-border bg-background p-4">
                  <PromptInput
                    prompt={state.prompt}
                    onPromptChange={handlePromptChange}
                    onGenerate={handleGenerate}
                    isLoading={state.status === 'loading'}
                    additionalImages={state.additionalImages}
                    onAdditionalImagesChange={handleAdditionalImagesChange}
                    hasMainImage={!!state.imageFile}
                    skippedInitialImage={state.skippedInitialImage}
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
              </>
            }
            rightPanel={
              <div className="flex-1 flex flex-col p-6 image-display-panel overflow-hidden min-h-0">
                <div className="flex-1 flex items-center justify-center min-h-0 relative">
                  {currentImageUrl ? (
                    <ImageErrorBoundary
                      onReset={() => {
                        setState(prev => ({ ...prev, status: 'idle', errorMessage: undefined }));
                      }}
                    >
                      <ImagePreview
                        src={currentImageUrl}
                        alt={currentImageInfo.title}
                        className=""
                        isLoading={state.status === 'loading'}
                        optimizeForContainer={true}
                      />
                    </ImageErrorBoundary>
                  ) : state.status === 'loading' ? (
                    <div className="flex items-center justify-center w-full h-full text-center p-8">
                      <div className="space-y-6 max-w-md">
                        <div className="text-center space-y-4">
                          <Loader variant="default" size="lg" count={5} duration={0.8} delayStep={150} className="justify-center" />
                          <div className="space-y-3">
                            <p className="font-head text-xl font-black text-foreground">
                              AI is generating your image...
                            </p>
                            <p className="font-sans text-base text-muted-foreground">
                              This may take a few moments
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center w-full h-full text-center p-8">
                      <div className="space-y-6 max-w-md">
                        <div className="w-20 h-20 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-full flex items-center justify-center mx-auto shadow-sm">
                          <Upload className="w-10 h-10 text-muted-foreground" />
                        </div>
                        <div className="space-y-3">
                          <p className="font-head text-xl font-bold text-foreground">
                            No image yet
                          </p>
                          <p className="font-sans text-base text-muted-foreground leading-relaxed">
                            Add an image using the + button in the prompt area to get started, or generate text-only content.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            }
          />
        )}
      </div>

      {/* PWA Install Button - Mobile */}
      <div className="md:hidden fixed top-4 right-4 z-40">
        <PWAInstallButton />
      </div>

      {/* PWA Install Button - Desktop */}
      <div className="hidden md:block fixed top-4 right-4 z-40">
        <PWAInstallButton />
      </div>

      {/* PWA Update Notification */}
      <PWAUpdateNotification />

    </div>
  );
}
