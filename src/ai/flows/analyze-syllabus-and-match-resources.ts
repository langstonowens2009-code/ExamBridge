'use server';
/**
 * @fileOverview Analyzes a paid study resource URL or raw syllabus text, and matches it with free alternative resources.
 *
 * - analyzeSyllabusAndMatchResources - A function that handles the analysis and matching process.
 * - AnalyzeSyllabusInput - The input type for the analyzeSyllabusAndMatchResources function.
 * - StudyPathModule - Represents a module in the study path with a topic, link, and description.
 * - AnalyzeSyllabusOutput - The return type for the analyzeSyllabusAndMatchResources function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AnalyzeSyllabusInputSchema = z.union([
  z.object({
    inputType: z.literal('url'),
    originalUrl: z.string().describe('The URL of the paid study resource.'),
    examType: z.string().describe('The type of exam the resource is for (e.g., SAT, ACT, USMLE).'),
  }),
  z.object({
    inputType: z.literal('text'),
    syllabusText: z.string().describe('The raw text of the syllabus.'),
    examType: z.string().describe('The type of exam the resource is for (e.g., SAT, ACT, USMLE).'),
  }),
]);
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

// Step 1: Find Raw Syllabus Topics (only if input is a URL)
const findSyllabusTopicsPrompt = ai.definePrompt({
  name: 'findSyllabusTopicsPrompt',
  input: {schema: z.object({
    originalUrl: z.string().describe('The URL of the paid study resource.'),
    examType: z.string().describe('The type of exam the resource is for (e.g., SAT, ACT, USMLE).'),
  })},
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
  output: { schema: AnalyzeSyllabusOutputSchema },
  tools: [{googleSearch: {}}],
  prompt: `You are an expert curriculum designer. You have been given a list of syllabus topics. For each topic, use your search tool to find a relevant, high-quality, and free PDF or video resource that covers that topic. The resources should be suitable for someone studying for the '{{{examType}}}' exam.

Syllabus Topics:
{{{syllabusTopics}}}

Your response MUST be a valid JSON array that conforms to the output schema. Do not include any introductory text or markdown code blocks. Output ONLY the raw JSON object.
`,
});


const analyzeSyllabusAndMatchResourcesFlow = ai.defineFlow(
  {
    name: 'analyzeSyllabusAndMatchResourcesFlow',
    inputSchema: AnalyzeSyllabusInputSchema,
    outputSchema: AnalyzeSyllabusOutputSchema,
  },
  async (input) => {
    let rawSyllabusTopics: string;

    if (input.inputType === 'url') {
      // Step 1: Get raw syllabus topics as plain text from URL.
      const { text } = await findSyllabusTopicsPrompt({ originalUrl: input.originalUrl, examType: input.examType });
      rawSyllabusTopics = text;
      if (!rawSyllabusTopics) {
        console.log("Step 1 failed: No syllabus topics found for URL.");
        // UI Fallback: If step 1 fails, we return an empty array, which the frontend will interpret as a failure.
        return [];
      }
      console.log("Step 1 Success: Found raw topics from URL:", rawSyllabusTopics);
    } else {
      // Input is already raw text, skip step 1.
      rawSyllabusTopics = input.syllabusText;
      console.log("Step 1 Skipped: Using provided raw syllabus text.");
    }


    // Step 2: Pass the raw text to the formatting prompt.
    const { output } = await formatStudyPathPrompt({
      syllabusTopics: rawSyllabusTopics,
      examType: input.examType,
    });
    
    if (!output) {
      console.log("Step 2 failed: AI did not return a valid structured output.");
      return [];
    }

    console.log("Step 2 Success: Formatted study path:", output);
    return output;
  }
);
