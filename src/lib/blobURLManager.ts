/**
 * Centralized blob URL management to prevent memory leaks and race conditions
 */

interface BlobURLReference {
  url: string;
  refCount: number;
  source: File | Blob;
  sourceKey: string; // Unique identifier for the source
  createdAt: number;
}

class BlobURLManager {
  private urlMap = new Map<string, BlobURLReference>();
  private sourceKeyMap = new Map<string, string>(); // sourceKey -> url

  /**
   * Create a unique key for a File or Blob
   */
  private createSourceKey(source: File | Blob): string {
    if (source instanceof File) {
      return `file_${source.name}_${source.size}_${source.lastModified}`;
    }
    return `blob_${source.size}_${source.type}_${Date.now()}`;
  }

  /**
   * Get or create a blob URL for a source, with reference counting
   */
  getOrCreateURL(source: File | Blob): string {
    const sourceKey = this.createSourceKey(source);

    // Check if we already have a URL for this source
    const existingURL = this.sourceKeyMap.get(sourceKey);
    if (existingURL && this.urlMap.has(existingURL)) {
      const ref = this.urlMap.get(existingURL)!;
      ref.refCount++;
      // Reusing URL (logging reduced)
      return existingURL;
    }

    // Create new URL
    const url = URL.createObjectURL(source);
    const reference: BlobURLReference = {
      url,
      refCount: 1,
      source,
      sourceKey,
      createdAt: Date.now()
    };

    this.urlMap.set(url, reference);
    this.sourceKeyMap.set(sourceKey, url);

    // Created new URL (logging reduced)
    return url;
  }

  /**
   * Release a reference to a blob URL
   */
  releaseURL(url: string): void {
    const reference = this.urlMap.get(url);
    if (!reference) {
      // Only warn if it looks like a blob URL that should be managed
      if (url.startsWith('blob:')) {
        console.debug(`[BlobURLManager] Attempted to release unknown blob URL: ${url.substring(0, 30)}...`);
      }
      return;
    }

    reference.refCount--;
    // Released URL (logging reduced)

    if (reference.refCount <= 0) {
      this.revokeURL(url);
    }
  }

  /**
   * Force revoke a blob URL regardless of reference count
   */
  revokeURL(url: string): void {
    const reference = this.urlMap.get(url);
    if (!reference) {
      console.warn(`[BlobURLManager] Attempted to revoke unknown URL: ${url.substring(0, 30)}...`);
      return;
    }

    try {
      URL.revokeObjectURL(url);
      this.urlMap.delete(url);
      this.sourceKeyMap.delete(reference.sourceKey);
      // Revoked URL (logging reduced)
    } catch (error) {
      console.error(`[BlobURLManager] Failed to revoke URL:`, error);
    }
  }

  /**
   * Get the current reference count for a URL
   */
  getRefCount(url: string): number {
    return this.urlMap.get(url)?.refCount || 0;
  }

  /**
   * Check if a URL is managed by this manager
   */
  isManaged(url: string): boolean {
    return this.urlMap.has(url);
  }

  /**
   * Clean up old URLs that haven't been used recently
   */
  cleanup(maxAge: number = 5 * 60 * 1000): void { // 5 minutes default
    const now = Date.now();
    const urlsToRevoke: string[] = [];

    for (const [url, reference] of this.urlMap.entries()) {
      if (reference.refCount <= 0 && (now - reference.createdAt) > maxAge) {
        urlsToRevoke.push(url);
      }
    }

    urlsToRevoke.forEach(url => this.revokeURL(url));

    if (urlsToRevoke.length > 0) {
      // Cleaned up old URLs (logging reduced)
    }
  }

  /**
   * Get debug information about managed URLs
   */
  getDebugInfo() {
    const urls = Array.from(this.urlMap.entries()).map(([url, ref]) => ({
      url: url.substring(0, 30) + '...',
      sourceKey: ref.sourceKey,
      refCount: ref.refCount,
      ageMinutes: Math.round((Date.now() - ref.createdAt) / 60000)
    }));

    return {
      totalURLs: this.urlMap.size,
      urls
    };
  }

  /**
   * Force cleanup all URLs (use with caution)
   */
  dispose(): void {
    // Disposing all managed URLs (logging reduced)

    for (const url of this.urlMap.keys()) {
      try {
        URL.revokeObjectURL(url);
      } catch (error) {
        console.error(`[BlobURLManager] Error disposing URL:`, error);
      }
    }

    this.urlMap.clear();
    this.sourceKeyMap.clear();
  }
}

// Singleton instance
const blobURLManager = new BlobURLManager();

// Cleanup old URLs periodically
if (typeof window !== 'undefined') {
  setInterval(() => {
    blobURLManager.cleanup();
  }, 60000); // Every minute
}

export { blobURLManager };
export type { BlobURLReference };