'use client';

import React, { Component, ReactNode } from 'react';
import { Alert } from '@/components/retroui/Alert';
import { Button } from '@/components/retroui/Button';
import { RefreshCw } from 'lucide-react';
import { blobURLManager } from '@/lib/blobURLManager';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error?: Error;
  retryCount: number;
}

export class ImageErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, retryCount: 0 };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    console.error('[ImageErrorBoundary] Caught error:', error);
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    const isBlobError = error.message.includes('blob:') ||
                       error.message.includes('ERR_FILE_NOT_FOUND') ||
                       error.message.includes('Failed to fetch');

    console.error('[ImageErrorBoundary] Error details:', {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      isBlobError,
      blobManagerDebug: isBlobError ? blobURLManager.getDebugInfo() : undefined
    });

    // If it's a blob-related error, try to provide more context
    if (isBlobError) {
      console.warn('[ImageErrorBoundary] Blob URL error detected. This may be due to premature URL revocation.');
    }
  }

  private isBlobError = (): boolean => {
    const message = this.state.error?.message || '';
    return message.includes('blob:') ||
           message.includes('ERR_FILE_NOT_FOUND') ||
           message.includes('Failed to fetch');
  };

  handleReset = () => {
    this.setState(prevState => ({
      hasError: false,
      error: undefined,
      retryCount: prevState.retryCount + 1
    }));

    console.log(`[ImageErrorBoundary] Retry attempt ${this.state.retryCount + 1}`);
    this.props.onReset?.();
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex items-center justify-center w-full h-full min-h-[200px] p-6">
          <div className="text-center space-y-4 max-w-md">
            <Alert status="error">
              <Alert.Description>
                {this.isBlobError()
                  ? 'Image failed to load. This might be due to browser memory management or temporary file issues.'
                  : 'Something went wrong while processing the image. This might be due to a corrupted file or browser compatibility issue.'
                }
              </Alert.Description>
            </Alert>

            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                Error: {this.state.error?.message || 'Unknown error'}
              </p>
              {this.state.retryCount < 3 && (
                <Button
                  onClick={this.handleReset}
                  variant="outline"
                  size="sm"
                  className="gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  Try Again {this.state.retryCount > 0 && `(${this.state.retryCount}/3)`}
                </Button>
              )}
              {this.state.retryCount >= 3 && (
                <p className="text-sm text-muted-foreground">
                  Multiple retry attempts failed. Please try uploading a different image.
                </p>
              )}
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}