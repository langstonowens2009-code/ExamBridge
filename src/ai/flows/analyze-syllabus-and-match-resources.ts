'use server';

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { StudyPathModuleSchema } from '../schemas/study-path';

export const analyzeSyllabusAndMatchResourcesFlow = ai.defineFlow(
  {
    name: 'analyzeSyllabusAndMatchResources',
    inputSchema: z.any(),
    outputSchema: z.array(StudyPathModuleSchema),
  },
  async (input) => {
    // Determine the content: Use user text if provided, otherwise search based on URL.
    const isTextBased = input.inputType === 'text' && input.syllabusText;
    const contentToProcess = isTextBased 
      ? input.syllabusText
      : `Find the syllabus or table of contents for the course at this URL: ${input.originalUrl}`;
    
    const examType = (input.examType || 'SAT').toUpperCase();

    // STEP 1: RESEARCHER - Get raw syllabus topics
    const research = await ai.generate({
      prompt: `You are an expert curriculum researcher. Your job is to find the syllabus topics for a given course.
               Course details: ${contentToProcess}.
               Extract the main topics as a raw text list. Do not include introductory text or markdown.`,
      model: 'googleai/gemini-pro',
      config: {
        tools: [{ tool: 'googleSearch' }],
      }
    });

    const rawData = research.text;
    console.log("Raw research data:", rawData);

    if (!rawData || rawData.length < 20) {
        return [];
    }

    // STEP 2: ARCHITECT - Format into UI Cards and find resources
    const architect = await ai.generate({
      prompt: `You are a curriculum architect. Take this list of topics and find the best free, high-quality study resource (like Khan Academy, Coursera, YouTube, or .edu sites) on the web for each one, tailored for the ${examType} exam.
               
               Topics: "${rawData}"

               Return your response as a valid JSON array. Do not include any introductory text or markdown code blocks. Output ONLY the raw JSON object.`,
      model: 'googleai/gemini-pro',
      output: { 
        schema: z.array(StudyPathModuleSchema),
      },
    });
    
    const output = architect.output;
    
    // Clean up potential markdown in the AI output
    if (!output) {
      const textOutput = architect.text;
      if (textOutput) {
        try {
          const cleanedString = textOutput.replace(/```json|```/g, '').trim();
          return JSON.parse(cleanedString);
        } catch (e) {
          console.error("Failed to parse architect text output:", e);
          return [];
        }
      }
      return [];
    }

    return output;
  }
);

export async function analyzeSyllabusAndMatchResources(input: any) {
  return await analyzeSyllabusAndMatchResourcesFlow(input);
}
