# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Development Commands

```bash
# Start development server with Turbopack (fastest)
npm run dev

# Build for production with Turbopack
npm run build

# Start production server
npm run start

# Run ESLint
npm run lint
```

### Single File Testing/Building
This project doesn't include Jest or Vitest yet. To test individual components during development:
- Use React DevTools browser extension
- Add console.log statements and check browser console
- Use TypeScript compiler for type checking: `npx tsc --noEmit`

## Environment Setup

Required environment variables in `.env.local`:
```env
GOOGLE_GENAI_API_KEY=your_google_ai_api_key_here
```

Get your API key from [Google AI Studio](https://aistudio.google.com/apikey).

## Architecture Overview

This is a Next.js 15 application using the App Router with server actions for AI image editing. The flow is:

1. **Client Upload**: User drags/drops image file into `ImageDropzone` component
2. **Image Processing**: Client-side image resizing (if needed) using Canvas API
3. **Server Action**: Form data sent to `editImage` server action in `src/app/actions/editImage.ts`
4. **AI Processing**: Server converts image to base64 and calls Google Gemini 2.5 Flash Image Preview API
5. **Response**: Edited image returned as base64 data to client
6. **Display**: Client renders result in `ImagePreview` component with download capability

The architecture follows Next.js App Router patterns with TypeScript, using Shadcn UI components for consistency.

## Key Components

### ImageDropzone (`src/components/ImageDropzone.tsx`)
- **Purpose**: File upload interface with drag-and-drop
- **Validation**: PNG/JPEG/WebP files, 10MB max size
- **State**: Manages drag state and file rejection errors
- **Integration**: Uses react-dropzone library

### ImagePreview (`src/components/ImagePreview.tsx`)
- **Purpose**: Display images with loading states
- **Features**: Loading skeletons, error handling, Next.js Image optimization
- **Usage**: Shows both original and generated images

### PromptInput (`src/components/PromptInput.tsx`)
- **Purpose**: Text input for editing instructions
- **Features**: Character limit (1000), loading states, form validation
- **Integration**: Controlled component that triggers generation

### Main Page (`src/app/page.tsx`)
- **State Management**: Single `AppState` object managing entire app state
- **Transitions**: Uses React's `useTransition` for non-blocking updates
- **Error Handling**: Comprehensive error states and user feedback

## AI Integration Details

### Server Action (`src/app/actions/editImage.ts`)
```typescript path=null start=null
// Key aspects:
- FormData handling for file uploads
- Base64 conversion for Gemini API
- Comprehensive error handling for API limits, safety filters
- File size validation (10MB limit)
```

### Image Processing (`src/lib/imageUtils.ts`)
- **Client-side resizing**: Reduces file size before server upload
- **Canvas API**: Maintains aspect ratio while resizing
- **Format conversion**: Can convert to JPEG for smaller sizes
- **Dimension checking**: Validates image dimensions

### Gemini Client (`src/lib/genai.ts`)
- **Model**: Uses `gemini-2.5-flash-image-preview` 
- **Configuration**: Simple client initialization with API key

## File Structure

```
src/
├── app/
│   ├── actions/
│   │   └── editImage.ts          # Server action for AI processing
│   ├── globals.css               # Global Tailwind styles
│   ├── layout.tsx               # Root layout with metadata
│   └── page.tsx                 # Main application page
├── components/
│   ├── ui/                      # Shadcn UI components
│   │   ├── alert.tsx
│   │   ├── button.tsx
│   │   ├── dialog.tsx
│   │   ├── input.tsx
│   │   ├── separator.tsx
│   │   ├── skeleton.tsx
│   │   └── textarea.tsx
│   ├── ImageDropzone.tsx        # File upload component
│   ├── ImagePreview.tsx         # Image display component
│   └── PromptInput.tsx          # Text input component
├── lib/
│   ├── download.ts              # Client-side download utility
│   ├── genai.ts                 # Gemini AI client configuration
│   ├── imageUtils.ts            # Image processing utilities
│   └── utils.ts                 # Shadcn utilities (cn function)
└── types/
    └── index.ts                 # TypeScript type definitions
```

## Technology Stack

- **Framework**: Next.js 15 with App Router and Turbopack
- **Language**: TypeScript 5
- **UI**: Shadcn UI with Tailwind CSS 4
- **Icons**: Lucide React
- **AI API**: Google Gemini 2.5 Flash Image Preview
- **File Handling**: react-dropzone
- **Image Processing**: HTML5 Canvas API

## Error Handling Patterns

The application handles multiple error scenarios:
- **File validation**: Type and size limits in both client and server
- **API errors**: Rate limiting, quota exceeded, safety filters
- **Processing errors**: Image conversion and Canvas API failures
- **Network issues**: Timeout and connectivity problems

All errors are user-friendly and provide actionable feedback.

## State Management

Uses React's built-in state management:
- **Single state object**: `AppState` interface in main component
- **useTransition**: For non-blocking server action calls
- **Loading states**: Managed through status enum ('idle' | 'loading' | 'success' | 'error')

## Development Notes

- **Turbopack**: Enabled for faster development and builds
- **TypeScript**: Strict mode enabled with path aliases (@/* for src/*)
- **Shadcn UI**: Uses "new-york" style variant with CSS variables
- **Image optimization**: Next.js Image component with proper loading states
- **Client-side processing**: Image resizing before server upload to reduce costs