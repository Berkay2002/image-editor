import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize Gemini client
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENAI_API_KEY!);

// Get the image generation model
export function getImageModel() {
  return genAI.getGenerativeModel({
    model: "gemini-2.5-flash-image-preview",
  });
}

export type ModelParams = {
  model: string;
};