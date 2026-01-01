
'use server';
/**
 * @fileOverview Generates study tasks for a specific topic over a set of dates.
 */

import { ai } from '@/ai/genkit';
import {
  GenerateStudyTasksInputSchema,
  GenerateStudyTasksOutputSchema,
  type GenerateStudyTasksInput,
  type GenerateStudyTasksOutput,
} from '@/ai/schemas/plan-generator';

export async function generateStudyTasksForTopic(
  input: GenerateStudyTasksInput
): Promise<GenerateStudyTasksOutput> {
  // This is a wrapper for the Genkit flow.
  // We can add any additional logic here before or after the flow runs.
  return generateStudyTasksFlow(input);
}

// Define the Genkit prompt with the hybrid logic.
const studyTaskPrompt = ai.definePrompt({
  name: 'studyTaskPrompt',
  input: { schema: GenerateStudyTasksInputSchema },
  output: { schema: GenerateStudyTasksOutputSchema },

  prompt: `You are an expert AI Tutor creating a study plan for the '{{examType}}' exam. Your current task is to generate actionable study items for the topic: '{{topic}}'.

The student has the following dates to study this topic: {{#each studyDates}}{{this}}{{#unless @last}}, {{/unless}}{{/each}}.

You MUST generate a plan for each of these dates.

{{#if expertResources}}
### EXPERT CONTEXT ###
You have been provided with a library of expert-vetted resources. You MUST use these links when suggesting tasks. Do not use the same link for every task. Assign a mix of videos, practice sets, and guides from the provided list to create a professional study roadmap.

Available Resources:
{{#each expertResources}}
- Type: {{this.type}}, URL: {{this.url}}, Description: {{this.description}}
{{/each}}
###################
{{else}}
### NO EXPERT CONTEXT ###
You have not been provided with specific resources. You should suggest generic, high-quality free resources. For example, recommend the student search for '{{topic}} practice problems' on Khan Academy or watch a video on the topic from the official College Board YouTube channel. DO NOT invent URLs.
###################
{{/if}}

For each provided study date, create 1 to 3 specific, actionable tasks. A good task is 'Watch the video on Thermodynamics on Khan Academy and take notes' or 'Complete 10 practice problems on Right Triangles'. A bad task is 'Study Geometry'.
`,
});

// Define the main Genkit flow.
const generateStudyTasksFlow = ai.defineFlow(
  {
    name: 'generateStudyTasksFlow',
    inputSchema: GenerateStudyTasksInputSchema,
    outputSchema: GenerateStudyTasksOutputSchema,
  },
  async (input) => {
    console.log(`Generating AI tasks for topic: ${input.topic}`);
    
    const { output } = await studyTaskPrompt(input);
    if (!output) {
      throw new Error('AI failed to generate study tasks.');
    }

    console.log(`Successfully generated ${output.studyDays.length} day(s) of tasks for ${input.topic}.`);
    return output;
  }
);
