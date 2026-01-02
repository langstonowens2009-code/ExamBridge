'use server';

import { ai } from '@/ai/genkit';
import {
  GenerateStudyPlanInputSchema,
  GenerateStudyPlanOutputSchema,
  type GenerateStudyPlanInput,
  type GenerateStudyPlanOutput,
} from '@/ai/schemas/study-path';

const prompt = ai.definePrompt({
  name: 'generateStudyPlanPrompt',
  model: 'googleai/gemini-1.5-flash-latest',
  input: { schema: GenerateStudyPlanInputSchema },
  output: { schema: GenerateStudyPlanOutputSchema },
  prompt: `You are an expert educational planner. A student needs a personalized study plan for the '{{examType}}' exam.

Analyze the provided list of topics and their self-assessed difficulty levels.

Topics:
{{#each topics}}
- {{this.topic}} (Difficulty: {{this.difficulty}})
{{/each}}

The test is on {{testDate}}. The student can study on the following days: {{#each availableStudyDays}}{{this}}{{#unless @last}}, {{/unless}}{{/each}}. They can study for {{minutesPerDay}} minutes on each of these days.

Based on this, create a structured, week-by-week study plan.
- Prioritize harder topics, giving them more time.
- Group related topics together logically.
- For each module in a week, provide a clear topic, a single-sentence rationale for why it's important, and suggest a generic, high-quality, free resource link. DO NOT invent URLs, but suggest a well-known platform (e.g., 'https://www.khanacademy.org/math/algebra', 'https://www.youtube.com/user/crashcourse').
- Ensure the entire plan is broken down into weekly modules.

Generate the study plan in the required JSON format.
`,
});

const generateStudyPlanFlow = ai.defineFlow(
  {
    name: 'generateStudyPlanFlow',
    inputSchema: GenerateStudyPlanInputSchema,
    outputSchema: GenerateStudyPlanOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);

export async function generateStudyPlan(
  input: GenerateStudyPlanInput
): Promise<GenerateStudyPlanOutput> {
  return generateStudyPlanFlow(input);
}