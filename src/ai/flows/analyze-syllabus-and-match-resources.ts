'use server';
/**
 * @fileOverview Analyzes a paid study resource URL, extracts the syllabus, and matches it with free alternative resources.
 *
 * - analyzeSyllabusAndMatchResources - A function that handles the analysis and matching process.
 * - AnalyzeSyllabusInput - The input type for the analyzeSyllabusAndMatchResources function.
 * - StudyPathModule - Represents a module in the study path with a topic, link, and description.
 * - AnalyzeSyllabusOutput - The return type for the analyzeSyllabusAndMatchResources function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AnalyzeSyllabusInputSchema = z.object({
  originalUrl: z.string().describe('The URL of the paid study resource.'),
  examType: z.string().describe('The type of exam the resource is for (e.g., SAT, ACT, USMLE).'),
});
export type AnalyzeSyllabusInput = z.infer<typeof AnalyzeSyllabusInputSchema>;

const StudyPathModuleSchema = z.object({
  topic: z.string().describe('The topic name from the paid resource.'),
  link: z.string().describe('A link to a free alternative resource.'),
  description: z.string().describe('A 1-sentence explanation of why this free link is a good substitute.'),
});
export type StudyPathModule = z.infer<typeof StudyPathModuleSchema>;

const AnalyzeSyllabusOutputSchema = z.array(StudyPathModuleSchema);
export type AnalyzeSyllabusOutput = z.infer<typeof AnalyzeSyllabusOutputSchema>;

export async function analyzeSyllabusAndMatchResources(
  input: AnalyzeSyllabusInput
): Promise<AnalyzeSyllabusOutput> {
  return analyzeSyllabusAndMatchResourcesFlow(input);
}

const analyzeSyllabusPrompt = ai.definePrompt({
  name: 'analyzeSyllabusPrompt',
  input: {schema: AnalyzeSyllabusInputSchema},
  output: {schema: z.array(z.object({
    topic: z.string().describe('Topic name from the syllabus'),
    link: z.string().describe('A link to a free alternative resource.'),
    description: z.string().describe('A 1-sentence explanation of why this free link is a good substitute.'),
  }))},
  tools: [{googleSearch: {}}],
  prompt: `You are an expert in analyzing online learning resources and identifying key topics in their syllabus.
Your task is to use Google Search to find the public syllabus or list of topics for the course located at the following URL: {{{originalUrl}}}. Do not fetch the URL directly.
Once you have the list of main topics, for each topic, use the provided tools to find a relevant, high-quality, and free PDF or video resource.
The resource is for the following exam type: {{{examType}}}.
Return a list of objects, each containing the topic, the link to the free resource, and a brief description of why it's a good match.`,
});

const analyzeSyllabusAndMatchResourcesFlow = ai.defineFlow(
  {
    name: 'analyzeSyllabusAndMatchResourcesFlow',
    inputSchema: AnalyzeSyllabusInputSchema,
    outputSchema: AnalyzeSyllabusOutputSchema,
  },
  async input => {
    const {output} = await analyzeSyllabusPrompt(input);

    if (!output) {
      return [];
    }

    return output;
  }
);
