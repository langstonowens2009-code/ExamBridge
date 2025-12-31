'use server';

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

// 1. Define the exact dashboard shape
const StudyPathModuleSchema = z.object({
  topic: z.string().describe('A specific topic or unit from the syllabus.'),
  description: z.string().describe('A one-sentence summary of what the free resource covers and why it is a good match for the topic.'),
  link: z.string().url().describe('A direct URL to a high-quality, free resource (article, video, documentation) that covers the topic.'),
});

export type StudyPathModule = z.infer<typeof StudyPathModuleSchema>;

export const analyzeSyllabusAndMatchResources = ai.defineFlow(
  {
    name: 'analyzeSyllabusAndMatchResources',
    inputSchema: z.any(), // Keeps it flexible for different input types
    outputSchema: z.array(StudyPathModuleSchema),
  },
  async (input) => {
    // Determine the source of the syllabus from the user's input
    const syllabusSource = input.inputType === 'url' ? `the course at this URL: ${input.originalUrl}` : `the following syllabus text: "${input.syllabusText}"`;
    const exam = input.examType || 'the requested exam';

    // =================================================================
    // STEP 1: The "Researcher" - Find syllabus topics using Google Search.
    // This step returns ONLY raw text to avoid conflicts.
    // =================================================================
    const researcherResult = await ai.generate({
      prompt: `You are a research assistant. Your goal is to find the main syllabus topics for the ${exam} from ${syllabusSource}. 
               Focus on identifying a list of chapters, units, or key concepts.
               Provide ONLY a list of topics. Do not add any extra text or formatting.`,
      config: {
        tools: [{ googleSearch: {} }],
      },
    });

    const rawSyllabusText = researcherResult.text;
    console.log("=============== RAW SYLLABUS TEXT FROM RESEARCHER ===============");
    console.log(rawSyllabusText);
    console.log("===============================================================");

    if (!rawSyllabusText || rawSyllabusText.trim().length < 10) {
      console.error("Researcher step failed to find a syllabus.");
      return []; // Return empty if no syllabus was found
    }

    // =================================================================
    // STEP 2: The "Architect" - Format the text into a JSON study plan.
    // This step ONLY formats data and does NOT use search tools.
    // =================================================================
    const architectResult = await ai.generate({
      prompt: `You are an expert curriculum designer. You will be given a raw list of topics for the ${exam} exam.
      For each topic, find one high-quality, free, and publicly accessible online resource (like an article, video, or documentation page) that teaches that topic.
      Then, format the results into a JSON array of objects.

      Here is the raw list of topics:
      "${rawSyllabusText}"
      
      IMPORTANT: Respond with ONLY the raw JSON array. Do not include any introductory text, explanations, or markdown code blocks like \`\`\`json.`,
      output: {
        schema: z.array(StudyPathModuleSchema),
      },
      config: {
        tools: [{ googleSearch: {} }], // Allow search for finding free resources
      }
    });

    const studyPath = architectResult.output;
    if (!studyPath) {
        console.error("Architect step failed to generate a valid study path.");
        return [];
    }

    console.log("Architect step successful. Returning study path:", studyPath);
    return studyPath;
  }
);
