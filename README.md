# AI Image Editor

A modern, mobile-first AI-powered image editing application built with Next.js 15 and Google's Generative AI. Transform your images with natural language prompts and maintain a complete editing history.

![AI Image Editor](https://img.shields.io/badge/Next.js-15.5.3-black?style=flat-square&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=flat-square&logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-06B6D4?style=flat-square&logo=tailwindcss)
![Mobile First](https://img.shields.io/badge/Mobile-First-green?style=flat-square)

## ✨ Features

### 🎨 **AI-Powered Image Editing**
- Transform images using natural language prompts
- Powered by Google's Generative AI
- Support for PNG, JPEG, and WebP formats
- Automatic image optimization and resizing

### 📱 **Mobile-First Design**
- Zero-scroll interface optimized for mobile devices
- Sticky action bar with primary controls
- Touch-friendly interface with 44px+ touch targets
- Responsive design that works on all screen sizes

### 🔄 **Smart History Management**
- Visual thumbnail history of all edits
- One-click revert to any previous version
- Linear editing workflow with branch management
- Automatic local storage persistence

### ⚡ **Performance Optimized**
- Next.js 15 with Turbopack for fast builds
- Optimized images with Next.js Image component
- Client-side image processing with automatic compression
- Production-ready with zero ESLint warnings

## 🚀 Quick Start

### Prerequisites
- Node.js 18.17 or higher
- Google AI API key (from [Google AI Studio](https://aistudio.google.com/))

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Berkay2002/image-editor.git
   cd image-editor
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.local.example .env.local
   ```
   
   Add your Google AI API key to `.env.local`:
   ```env
   GOOGLE_AI_API_KEY=your_api_key_here
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🛠️ Tech Stack

- **Framework:** Next.js 15.5.3 with App Router
- **Language:** TypeScript 5
- **Styling:** Tailwind CSS 4
- **AI:** Google Generative AI
- **UI Components:** Custom Retro/Brutalist design system
- **Icons:** Lucide React
- **File Handling:** React Dropzone
- **Build Tool:** Turbopack

## 📋 Available Scripts

```bash
# Development
npm run dev          # Start development server with Turbopack

# Production
npm run build        # Create production build with Turbopack
npm run start        # Start production server

# Code Quality
npm run lint         # Run ESLint
```

## 🎯 Usage

### Basic Workflow
1. **Upload an image** by dragging & dropping or clicking the upload area
2. **Enter a prompt** describing how you want to edit the image
3. **Generate** the edited version using AI
4. **Review history** and revert to any previous version if needed
5. **Download** your final edited image

### Example Prompts
- "Make the sky more vibrant blue and add flying birds"
- "Change the lighting to golden hour sunset"
- "Remove the background and make it transparent"
- "Add a vintage film effect with warm tones"
- "Convert to black and white with high contrast"

## 📱 Mobile Experience

The app is specifically optimized for mobile devices with:

- **Compact Layout:** History thumbnails at top, main image below, prompt input at bottom
- **Sticky Actions:** Generate and Download buttons always accessible
- **No Scrolling:** Entire interface fits within viewport
- **Touch Optimized:** All interactive elements meet accessibility standards
- **Progressive Enhancement:** Works great on both mobile and desktop

## 🏗️ Architecture

```
src/
├── app/
│   ├── actions/          # Server actions for AI processing
│   ├── globals.css       # Global styles and CSS variables
│   ├── layout.tsx        # Root layout with fonts
│   └── page.tsx          # Main application component
├── components/
│   ├── retroui/          # Custom UI component library
│   ├── ImageDropzone.tsx # File upload component
│   ├── ImageHistory.tsx  # History management
│   ├── ImagePreview.tsx  # Image display component
│   ├── MobileActionBar.tsx # Mobile-specific actions
│   └── PromptInput.tsx   # Text input for prompts
├── lib/                  # Utility functions
├── types/                # TypeScript type definitions
└── ...
```

## 🎨 Design System

The app features a custom **Retro/Brutalist** design system with:
- Bold typography using Archivo Black and Space Grotesk
- High contrast colors with 2px borders
- Drop shadows and button press animations
- Consistent spacing scale
- Mobile-first responsive breakpoints

## 🔧 Configuration

### Environment Variables
```env
GOOGLE_AI_API_KEY=your_google_ai_api_key
```

### Image Processing Limits
- Maximum file size: 10MB
- Automatic resize for files >3MB
- Supported formats: PNG, JPEG, WebP
- Maximum dimensions: 1920x1920 (auto-resized)

## 🚀 Deployment

### Vercel (Recommended)
1. Connect your GitHub repository to Vercel
2. Add your `GOOGLE_AI_API_KEY` environment variable
3. Deploy automatically on push to main

### Other Platforms
The app works with any Next.js-compatible hosting platform:
- Netlify
- AWS Amplify
- Railway
- DigitalOcean App Platform

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Google AI](https://ai.google.dev/) for the Generative AI API
- [Next.js](https://nextjs.org/) for the fantastic framework
- [Tailwind CSS](https://tailwindcss.com/) for the utility-first CSS
- [Lucide](https://lucide.dev/) for the beautiful icons

---

<div align="center">
  <p>Built with ❤️ by <a href="https://github.com/Berkay2002">Berkay2002</a></p>
  <p>⭐ Star this repository if you found it helpful!</p>
</div>
