import { Genkit } from 'genkit';

declare global {
  namespace globalThis {
    var genkitAi: Genkit;
  }
}
