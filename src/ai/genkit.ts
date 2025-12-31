import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';

/**
 * We use a clean initialization here. 
 * If you are using Google AI Studio (API Key), do NOT add a 'location'.
 * If you see red lines, it's often because 'location' is only for Vertex AI.
 */
export const ai = genkit({
  plugins: [
    googleAI() 
  ],
  // Using a string ID here is safer than an imported object 
  // to avoid 'Module not found' or 'Type' errors.
  model: 'googleai/gemini-2.0-flash', 
});