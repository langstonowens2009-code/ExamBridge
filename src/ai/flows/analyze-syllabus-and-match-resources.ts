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

// Step 1: Find Raw Syllabus Topics
const findSyllabusTopicsPrompt = ai.definePrompt({
  name: 'findSyllabusTopicsPrompt',
  input: {schema: AnalyzeSyllabusInputSchema},
  tools: [{googleSearch: {}}],
  prompt: `You are an expert in analyzing online learning resources. Your task is to find the public syllabus or list of main topics for the course located at the following URL: {{{originalUrl}}}.

IMPORTANT: Do NOT fetch the content of the URL directly. Instead, use your Google Search tool to find the public syllabus, table of contents, or curriculum for the course.

Return only a list of the main topics you find, separated by newlines. Do not include any other information or formatting.`,
});

// Step 2: Format and Find Resources
const formatStudyPathPrompt = ai.definePrompt({
  name: 'formatStudyPathPrompt',
  input: {schema: z.object({
    syllabusTopics: z.string(),
    examType: z.string(),
  })},
  tools: [{googleSearch: {}}],
  prompt: `You are an expert curriculum designer. You have been given a list of syllabus topics. For each topic, use your search tool to find a relevant, high-quality, and free PDF or video resource that covers that topic. The resources should be suitable for someone studying for the '{{{examType}}}' exam.

Syllabus Topics:
{{{syllabusTopics}}}

Your response MUST be a valid JSON string that can be parsed directly. The string should represent an array of objects. Do not wrap the JSON string in markdown backticks or any other text. Each object must contain 'topic', 'link', and 'description' keys.
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
  async (input) => {
    // Step 1: Get raw syllabus topics as plain text.
    const { text: rawSyllabusTopics } = await findSyllabusTopicsPrompt(input);

    if (!rawSyllabusTopics) {
      console.log("Step 1 failed: No syllabus topics found.");
      return [];
    }
    console.log("Step 1 Success: Found raw topics:", rawSyllabusTopics);

    // Step 2: Pass the raw text to the formatting prompt.
    const { text: jsonString } = await formatStudyPathPrompt({
      syllabusTopics: rawSyllabusTopics,
      examType: input.examType,
    });
    
    if (!jsonString) {
      console.log("Step 2 failed: AI did not return a JSON string.");
      return [];
    }
    console.log("Step 2 Success: Received JSON string:", jsonString);

    try {
      // The model should return a JSON string, so we parse it.
      const parsedOutput = JSON.parse(jsonString);
      // Validate the parsed output against the schema to be safe.
      return AnalyzeSyllabusOutputSchema.parse(parsedOutput);
    } catch (e: any) {
      console.error("Failed to parse JSON from AI response:", e.message);
      console.error("Malformed JSON string:", jsonString);
      // If parsing fails, return an empty array which will trigger a user-facing error.
      return [];
    }
  }
);
