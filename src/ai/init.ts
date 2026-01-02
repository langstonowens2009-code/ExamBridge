'use server';

import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';

/**
 * We are using a server-side only file to initialize Genkit.
 * This is because Genkit is not compatible with the 'use server' directive
 * and we need to use it in our server actions.
 */

if (!global.genkitAi) {
  console.log('Initializing Genkit...');
  global.genkitAi = genkit({
    plugins: [googleAI()],
    logLevel: 'debug',
    enableTracingAndMetrics: true,
  });
}

export const ai = global.genkitAi;
