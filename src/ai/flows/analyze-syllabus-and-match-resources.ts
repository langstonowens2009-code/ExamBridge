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

const findFreeResources = ai.defineTool(
  {
    name: 'findFreeResources',
    description: 'Finds free alternative resources that match a given topic for a specific exam type.',
    inputSchema: z.object({
      topic: z.string().describe('The topic to find free resources for.'),
      examType: z.string().describe('The type of exam the resource is for (e.g., SAT, ACT, USMLE).'),
    }),
    outputSchema: z.object({
      link: z.string().describe('Link to a free resource.'),
      description: z.string().describe('A 1-sentence explanation of why this free link is a good substitute.'),
    }),
  },
  async input => {
    // Dummy implementation - replace with actual resource finding logic
    return {
      link: `https://example.com/free-resource-for-${input.topic.replace(/ /g, '-')}`,
      description: `This free resource covers the topic ${input.topic} for the ${input.examType} exam.`, //Fixed: Correctly reference input.topic and input.examType
    };
  }
);

const analyzeSyllabusPrompt = ai.definePrompt({
  name: 'analyzeSyllabusPrompt',
  input: {schema: AnalyzeSyllabusInputSchema},
  output: {schema: z.array(z.string().describe('Topic name from the syllabus'))},
  tools: [findFreeResources],
  prompt: `You are an expert in analyzing online learning resources and identifying key topics in their syllabus.\n  Your task is to analyze the content of the following URL: {{{originalUrl}}} and extract a list of the main topics covered.\n  The resource is for the following exam type: {{{examType}}}.\n  Return a list of topic names.
  Based on the syllabus topics, use the findFreeResources tool to identify free alternative resources for each topic.`,
});

const analyzeSyllabusAndMatchResourcesFlow = ai.defineFlow(
  {
    name: 'analyzeSyllabusAndMatchResourcesFlow',
    inputSchema: AnalyzeSyllabusInputSchema,
    outputSchema: AnalyzeSyllabusOutputSchema,
  },
  async input => {
    const {output: topics} = await analyzeSyllabusPrompt(input);

    if (!topics) {
      return [];
    }

    const studyPathModules: StudyPathModule[] = [];

    for (const topic of topics) {
      const freeResource = await findFreeResources({
        topic: topic,
        examType: input.examType,
      });
      studyPathModules.push({
        topic: topic,
        link: freeResource.link,
        description: freeResource.description,
      });
    }

    return studyPathModules;
  }
);
