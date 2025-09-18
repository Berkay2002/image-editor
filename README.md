# AI Image Editor

A Next.js application that uses Google's Gemini 2.5 Flash Image Preview API (aka "Nano Banana") to edit images based on text prompts. Upload an image, describe how you'd like to edit it, and let AI transform your vision into reality.

## Features

- 🖼️ **Drag & Drop Upload**: Easy image uploading with validation
- 🎨 **AI-Powered Editing**: Uses Google's Gemini 2.5 Flash Image Preview model
- ✨ **Text-to-Edit**: Describe changes in natural language
- 💾 **Download Results**: Save edited images with a single click
- 🎯 **Modern UI**: Built with Shadcn UI and Tailwind CSS
- 🔒 **Type Safe**: Full TypeScript implementation

## Tech Stack

- **Frontend**: Next.js 15, React 18, TypeScript
- **UI Components**: Shadcn UI, Tailwind CSS
- **AI API**: Google Gemini 2.5 Flash Image Preview
- **File Handling**: React Dropzone
- **Icons**: Lucide React

## Prerequisites

- Node.js 18+ and npm
- Google AI API key from [Google AI Studio](https://aistudio.google.com/apikey)

## Getting Started

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd ai-image-editor
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   
   Create a `.env.local` file in the root directory:
   ```env
   GOOGLE_GENAI_API_KEY=your_actual_api_key_here
   ```
   
   Replace `your_actual_api_key_here` with your actual Google AI API key.

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   
   Navigate to [http://localhost:3000](http://localhost:3000) to see the application.

## Usage

1. **Upload an Image**: Drag and drop an image file (PNG, JPEG, or WebP, max 10MB) into the upload area
2. **Write a Prompt**: Describe how you want to edit the image (e.g., "Make the sky more vibrant blue, add flying birds")
3. **Generate**: Click the "Generate" button and wait for AI to process your request
4. **Download**: Save the edited image using the download button

## Example Prompts

- "Change the background to a sunset scene"
- "Add flying birds in the sky"
- "Make the colors more vibrant and saturated"
- "Convert to black and white with vintage film look"
- "Add snow falling in the scene"
- "Change the lighting to golden hour"

## File Structure

```
src/
├── app/
│   ├── actions/          # Server actions
│   │   └── editImage.ts   # Gemini API integration
│   ├── globals.css        # Global styles
│   └── page.tsx           # Main application page
├── components/
│   ├── ui/                # Shadcn UI components
│   ├── ImageDropzone.tsx  # File upload component
│   ├── ImagePreview.tsx   # Image display component
│   └── PromptInput.tsx    # Text input component
├── lib/
│   ├── genai.ts          # Gemini client configuration
│   ├── download.ts       # Image download utility
│   └── utils.ts          # Shadcn utilities
└── types/
    └── index.ts          # TypeScript type definitions
```

## Available Scripts

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run start    # Start production server
npm run lint     # Run ESLint
```

## Error Handling

The application handles various error scenarios:

- **Invalid file types**: Only PNG, JPEG, and WebP are supported
- **File size limits**: Maximum 10MB per image
- **API errors**: Rate limiting, quota exceeded, safety filters
- **Network issues**: Timeout and connectivity problems

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [Google AI](https://ai.google.dev/) for the Gemini API
- [Shadcn UI](https://ui.shadcn.com/) for beautiful components
- [Vercel](https://vercel.com/) for Next.js and deployment platform
