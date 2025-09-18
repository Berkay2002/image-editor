'use server';

import { getImageModel } from '@/lib/genai';
import { ImageEditResponse } from '@/types';

export async function editImage(formData: FormData): Promise<ImageEditResponse> {
  try {
    const imageFile = formData.get('image') as File;
    const prompt = formData.get('prompt') as string;

    if (!imageFile || !prompt) {
      return {
        success: false,
        error: 'Missing image file or prompt'
      };
    }

    // Validate file type
    const validTypes = ['image/png', 'image/jpeg', 'image/webp'];
    if (!validTypes.includes(imageFile.type)) {
      return {
        success: false,
        error: 'Invalid file type. Please upload a PNG, JPEG, or WebP image.'
      };
    }

    // Validate file size (10MB limit)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (imageFile.size > maxSize) {
      return {
        success: false,
        error: 'File too large. Please upload an image smaller than 10MB.'
      };
    }

    // Convert image to base64
    const bytes = await imageFile.arrayBuffer();
    const base64Image = Buffer.from(bytes).toString('base64');

    // Get Gemini model
    const model = getImageModel();

    // Create the request
    const result = await model.generateContent([
      {
        inlineData: {
          mimeType: imageFile.type,
          data: base64Image
        }
      },
      prompt
    ]);

    const response = await result.response;
    const candidates = response.candidates;

    if (!candidates || candidates.length === 0) {
      return {
        success: false,
        error: 'No image generated. Please try a different prompt.'
      };
    }

    // Extract the generated image
    const candidate = candidates[0];
    const parts = candidate.content.parts;

    for (const part of parts) {
      if (part.inlineData && part.inlineData.data) {
        return {
          success: true,
          data: part.inlineData.data
        };
      }
    }

    return {
      success: false,
      error: 'No image data returned from the API.'
    };

  } catch (error: unknown) {
    console.error('Error in editImage:', error);
    
    // Handle specific API errors
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    // Handle file size limit errors
    if (errorMessage?.includes('Body exceeded') || errorMessage?.includes('size limit')) {
      return {
        success: false,
        error: 'The image file is too large to process. Please try a smaller image (under 10MB).'
      };
    }
    
    if (errorMessage?.includes('API key')) {
      return {
        success: false,
        error: 'API key is invalid or missing. Please check your configuration.'
      };
    }
    
    if (errorMessage?.includes('quota') || errorMessage?.includes('rate')) {
      return {
        success: false,
        error: 'API rate limit exceeded. Please try again later.'
      };
    }

    if (errorMessage?.includes('safety')) {
      return {
        success: false,
        error: 'Content was flagged by safety filters. Please try a different prompt.'
      };
    }

    return {
      success: false,
      error: 'An unexpected error occurred. Please try again.'
    };
  }
}