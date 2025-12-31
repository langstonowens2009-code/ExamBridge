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
  tools: [{googleSearch: {}}],
  prompt: `You are an expert in analyzing online learning resources. Your task is to find the public syllabus or list of topics for the course located at the following URL: {{{originalUrl}}}.

IMPORTANT: Do NOT fetch the content of the URL directly. Instead, use Google Search to find the public syllabus, table of contents, or curriculum for the course.

Once you have the list of main topics from your search, for each topic, use your search tool again to find a relevant, high-quality, and free PDF or video resource that covers that topic. The resources should be suitable for someone studying for the '{{{examType}}}' exam.

Return a JSON string representing an array of objects. Each object must contain 'topic', 'link', and 'description' keys.
Example format:
[
  {
    "topic": "Example Topic 1",
    "link": "https://example.com/resource1",
    "description": "This is a good match for the first topic."
  },
  {
    "topic": "Example Topic 2",
    "link": "https://example.com/resource2",
    "description": "This is a good match for the second topic."
  }
]
`,
});

const analyzeSyllabusAndMatchResourcesFlow = ai.defineFlow(
  {
    name: 'analyzeSyllabusAndMatchResourcesFlow',
    inputSchema: AnalyzeSyllabusInputSchema,
    outputSchema: AnalyzeSyllabusOutputSchema,
  },
  async input => {
    const {text} = await analyzeSyllabusPrompt(input);
    
    if (!text) {
      return [];
    }

    try {
      // The model should return a JSON string, so we parse it.
      const parsedOutput = JSON.parse(text);
      // Validate the parsed output against the schema to be safe.
      return AnalyzeSyllabusOutputSchema.parse(parsedOutput);
    } catch (e) {
      console.error("Failed to parse JSON from AI response:", e);
      // If parsing fails, return an empty array or handle as an error.
      return [];
    }
  }
);
