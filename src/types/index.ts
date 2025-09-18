export interface ImageEditRequest {
  imageFile: File;
  prompt: string;
}

export interface ImageEditResponse {
  success: boolean;
  data?: string; // base64 image data
  error?: string;
}

export interface HistoryItem {
  id: string;
  imageData: string; // base64 image data
  prompt: string;
  timestamp: number;
  isOriginal?: boolean; // marks the original uploaded image
}

export type EditStatus = 'idle' | 'loading' | 'success' | 'error';

export interface AppState {
  imageFile: File | null;
  prompt: string;
  outputImage: string | null;
  status: EditStatus;
  errorMessage?: string;
  imageHistory: HistoryItem[];
  currentHistoryId: string | null;
}
