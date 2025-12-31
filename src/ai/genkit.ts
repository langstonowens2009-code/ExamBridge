import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';

export const ai = genkit({
  plugins: [
    googleAI({
      location: 'global',
    }) 
  ],
  // Explicitly using the string ID prevents the editor from trying 
  // to 'look up' the model object, which clears that vertical red line.
  model: 'googleai/gemini-pro', 
});
