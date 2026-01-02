import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/googleai';

// IMPORTANT: No 'use server' at the top of this file!
export const ai = genkit({
  plugins: [
    googleAI({ apiKey: process.env.GOOGLE_GENAI_API_KEY }),
  ],
  logLevel: 'debug',
  enableTracingAndMetrics: true,
});