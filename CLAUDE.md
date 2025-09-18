# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project: Retrofy

**Retrofy** is a retro-themed AI-powered image editor that transforms images using AI with a nostalgic aesthetic. The app features the nano banana as its official logo and supports comprehensive cross-platform branding.

## Tech Stack

- **Framework**: Next.js 15 with App Router and Turbopack
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: Shadcn/ui with custom RetroUI design system
- **AI Integration**: Google Generative AI (Gemini)
- **Image Processing**: Sharp (for icon generation)
- **Deployment**: Vercel

## Development Commands

```bash
# Development
npm run dev          # Start development server with Turbopack
npm run build        # Create production build with Turbopack
npm run start        # Start production server
npm run lint         # Run ESLint

# Branding & Assets
npm run generate-icons  # Generate all app icons from source logo using Sharp

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
- `src/components/retroui/` - Custom RetroUI design system (built on Shadcn/ui)
- `src/lib/` - Utility functions (image processing, history management, AI client)
- `src/types/index.ts` - TypeScript type definitions

### AI Integration

Uses Google Generative AI (`gemini-2.5-flash-image-preview`) for image editing:
- Supports image-to-image editing and text-to-image generation
- Handles multiple additional images as context
- Automatic image resizing for API limits (10MB max, resizes at 3MB)
- Comprehensive error handling for API limits, safety filters, etc.

**IMPORTANT**: When making changes to the Gemini API integration, always read the latest documentation at: https://ai.google.dev/gemini-api/docs/image-generation#javascript

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

## Branding & Logo System

### Logo & Visual Identity

**Logo**: The nano banana (from `public/nano-banana-transparent-removebg-preview.png`) serves as the official Retrofy logo, reflecting the retro aesthetic and playful nature of the app.

### Cross-Platform Icon Support

Comprehensive icon system supporting all major platforms:

**Generated Icons** (via `npm run generate-icons`):
- **Favicons**: 16x16, 32x32, 48x48 (.png) + favicon.ico for browser tabs
- **Apple Touch Icons**: All iOS sizes (57x57 to 180x180) for home screen installation
- **Android Chrome**: 192x192, 512x512 for PWA and home screen support
- **Web App Manifest**: Multiple sizes for progressive web app installation
- **Social Media**: 1200x630 Open Graph image for link previews

**Platform Coverage**:
- Desktop browsers (Chrome, Firefox, Safari, Edge)
- iOS Safari (home screen icons, web app support)
- Android Chrome (PWA icons, home screen installation)
- Social platforms (Twitter/X cards, Facebook/LinkedIn previews)
- Progressive Web App (full installation support)

### Icon Generation System

**Automated Process**: `scripts/generate-icons.js` uses Sharp to generate all required icon sizes from the source logo with optimized quality and transparency handling.

**Metadata Integration**: `src/app/layout.tsx` includes comprehensive meta tags for:
- Favicon support across all browsers
- Apple touch icon declarations
- PWA manifest reference
- Open Graph and Twitter card meta tags
- Theme colors and tile configurations

**PWA Support**: `public/manifest.json` enables app installation on mobile devices and desktop with proper icon references and app metadata.

## Future Development Priorities

### Image Optimization (Next Major Objective)
- Performance optimization for large image handling
- Advanced compression and format conversion
- Lazy loading and progressive image enhancement
- Bundle size optimization for faster load times
- Memory management for client-side image processing

## Deployment

**Platform**: Vercel
- Automatic deployments from main branch
- Environment variables configured in Vercel dashboard
- Production URL: Referenced in metadata for Open Graph and social sharing