'use server';

import { ai } from '@/ai/genkit';
import { gemini15Flash } from '@genkit-ai/googleai'; 
import {
  GenerateStudyPlanInputSchema,
  GenerateStudyPlanOutputSchema,
  type GenerateStudyPlanInput,
  type GenerateStudyPlanOutput,
} from '@/ai/schemas/study-path';

const prompt = ai.definePrompt({
  name: 'generateStudyPlanPrompt',
  model: gemini15Flash, 
  input: { schema: GenerateStudyPlanInputSchema },
  output: { schema: GenerateStudyPlanOutputSchema },
  prompt: `You are an expert educational planner. A student needs a personalized study plan for the '{{examType}}' exam.
  Analyze topics: {{#each topics}}- {{this.topic}} (Difficulty: {{this.difficulty}}){{/each}}
  Test date: {{testDate}}. Available: {{#each availableStudyDays}}{{this}}{{/each}}.
  Generate the study plan in the required JSON format.`,
});

const generateStudyPlanFlow = ai.defineFlow(
  {
    name: 'generateStudyPlanFlow',
    inputSchema: GenerateStudyPlanInputSchema,
    outputSchema: GenerateStudyPlanOutputSchema,
  },
  async (input) => {
    // Passing the model object here is what fixes the "INVALID_ARGUMENT" crash
    const { output } = await prompt(input, { model: gemini15Flash }); 
    return output!;
  }
);

export async function generateStudyPlan(
  input: GenerateStudyPlanInput
): Promise<GenerateStudyPlanOutput> {
  return generateStudyPlanFlow(input);
}