# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

```bash
# Development
npm run dev          # Start development server with Turbopack
npm run build        # Create production build with Turbopack
npm run start        # Start production server
npm run lint         # Run ESLint

# Note: If 'npm run build' fails with unusual errors, check if 'npm run dev' is running
# on localhost as they may conflict.
```

## Architecture Overview

This is a modern AI-powered image editing application built with Next.js 15 App Router. The app follows a client-side state management pattern with server actions for AI processing.

### Key Architecture Patterns

**State Management**: Single `AppState` object manages all application state including:
- Current image file and additional images
- Edit history with linear progression
- Current editing status and error states
- Prompt input and generation state

**Responsive Design**: Mobile-first approach with distinct layouts:
- Mobile: Vertical stack with sticky action bar (single column)
- Desktop: Resizable two-panel layout (history + image preview)

**Image Processing Flow**:
1. Client uploads image → converted to base64 for history storage
2. Form data sent to server action (`editImage`)
3. Google Generative AI processes images + prompt
4. Result stored in linear history chain
5. User can revert to any previous state

### Core Components Structure

- `src/app/page.tsx` - Main application component with state management
- `src/app/actions/editImage.ts` - Server action for AI image processing
- `src/components/` - UI components (dropzone, preview, history, prompt input)
- `src/components/retroui/` - Custom design system components
- `src/lib/` - Utility functions (image processing, history management, AI client)
- `src/types/index.ts` - TypeScript type definitions

### AI Integration

Uses Google Generative AI (`gemini-2.5-flash-image-preview`) for image editing:
- Supports image-to-image editing and text-to-image generation
- Handles multiple additional images as context
- Automatic image resizing for API limits (10MB max, resizes at 3MB)
- Comprehensive error handling for API limits, safety filters, etc.

### History System

Linear history model where each edit creates a new history item:
- Original image → Edit 1 → Edit 2 → Edit 3...
- Reverting to previous state truncates future history
- All history stored in localStorage with base64 image data
- Each item has unique ID, timestamp, prompt, and original flag

### Environment Requirements

Required environment variable:
- `GOOGLE_AI_API_KEY` - Google AI Studio API key

### Mobile Optimization

Specifically designed for mobile-first usage:
- Zero-scroll interface that fits within viewport
- Touch-friendly 44px+ interactive elements
- Safe area handling for modern mobile devices
- Sticky action bars for primary controls