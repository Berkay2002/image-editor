import { HistoryItem } from '@/types';

const HISTORY_STORAGE_KEY = 'ai-image-editor-history';
const MAX_HISTORY_ITEMS = 50; // Limit to prevent localStorage bloat

export function generateId(): string {
  return crypto.randomUUID();
}

export function saveHistory(history: HistoryItem[]): void {
  try {
    // Limit history size to prevent localStorage quota issues
    const limitedHistory = history.slice(-MAX_HISTORY_ITEMS);
    localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(limitedHistory));
  } catch (error) {
    console.warn('Failed to save history to localStorage:', error);
    // Try to clear old history and save again
    try {
      localStorage.removeItem(HISTORY_STORAGE_KEY);
      const reducedHistory = history.slice(-10); // Keep only last 10 items
      localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(reducedHistory));
    } catch (secondError) {
      console.error('Failed to save reduced history:', secondError);
    }
  }
}

export function loadHistory(): HistoryItem[] {
  try {
    const stored = localStorage.getItem(HISTORY_STORAGE_KEY);
    if (!stored) return [];
    
    const parsed = JSON.parse(stored);
    if (!Array.isArray(parsed)) return [];
    
    // Validate history items
    return parsed.filter((item): item is HistoryItem => 
      typeof item === 'object' &&
      typeof item.id === 'string' &&
      typeof item.imageData === 'string' &&
      typeof item.prompt === 'string' &&
      typeof item.timestamp === 'number'
    );
  } catch (error) {
    console.warn('Failed to load history from localStorage:', error);
    return [];
  }
}

export function clearHistory(): void {
  try {
    localStorage.removeItem(HISTORY_STORAGE_KEY);
  } catch (error) {
    console.warn('Failed to clear history from localStorage:', error);
  }
}

export function createHistoryItem(
  imageData: string,
  prompt: string,
  isOriginal = false
): HistoryItem {
  return {
    id: generateId(),
    imageData,
    prompt,
    timestamp: Date.now(),
    isOriginal
  };
}

export function formatTimestamp(timestamp: number): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  
  // Less than a minute ago
  if (diff < 60000) {
    return 'Just now';
  }
  
  // Less than an hour ago
  if (diff < 3600000) {
    const minutes = Math.floor(diff / 60000);
    return `${minutes}m ago`;
  }
  
  // Less than a day ago
  if (diff < 86400000) {
    const hours = Math.floor(diff / 3600000);
    return `${hours}h ago`;
  }
  
  // More than a day ago
  return date.toLocaleDateString();
}