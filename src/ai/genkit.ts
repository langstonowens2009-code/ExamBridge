import { ai } from '@/ai/init';
import { gemini15Flash } from '@genkit-ai/google-genai';
// This file is now a re-exporter. 
// You can use this to centralize which models or other AI configurations you use.
export { ai };
export const gemini15FlashModel = gemini15Flash;
