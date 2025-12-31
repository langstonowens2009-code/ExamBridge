'use server';

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { StudyPathModuleSchema } from '../schemas/study-path';
import { googleAI } from '@genkit-ai/google-genai';

const analyzeSyllabusAndMatchResourcesFlow = ai.defineFlow(
  {
    name: 'analyzeSyllabusAndMatchResources',
    inputSchema: z.object({
        examType: z.string(),
        inputType: z.string(), 
        syllabusText: z.string().optional(),
        originalUrl: z.string().optional(),
    }),
    outputSchema: z.array(StudyPathModuleSchema),
  },
  async (input) => {
    
    const researcherPrompt = `You are a world-class academic researcher. Your task is to find the syllabus or table of contents from the provided source.
    
    Source: ${input.inputType === 'url' ? input.originalUrl : input.syllabusText}

    Return only the raw, unstructured text of the syllabus topics.
    `;

    const researcher = await ai.generate({
      model: googleAI('gemini-pro'),
      prompt: researcherPrompt,
      tools: [googleAI.search()],
    });

    const researchText = researcher.text();
    console.log('AI Researcher found the following text:', researchText);

    if (!researchText || researchText.length < 20) {
        return [];
    }

    const architect = await ai.generate({
      prompt: `You are an Elite Academic Tutor. Your task is to create a study plan based on the provided syllabus topics.
               For each topic, provide a brief, one-sentence description and find a link to a high-quality, free study resource (like Khan Academy, Coursera, YouTube, or .edu sites) using your search tool.
               
               Syllabus Topics: "${researchText}"

               Return your response as a valid JSON array. Do not include any introductory text or markdown code blocks. Output ONLY the raw JSON array.`,
      model: googleAI('gemini-pro'),
      tools: [googleAI.search()],
      output: { 
        schema: z.array(StudyPathModuleSchema),
      },
    });
    
    const output = architect.output();
    
    if (!output) {
      const textOutput = architect.text();
      if (textOutput) {
        try {
          const cleanedString = textOutput.replace(/```json|```/g, '').trim();
          return JSON.parse(cleanedString);
        } catch (e) {
          console.error("Failed to parse AI text output:", e);
          return [];
        }
      }
      return [];
    }

    return output;
  }
);

export async function analyzeSyllabusAndMatchResources(input: z.infer<typeof analyzeSyllabusAndMatchResourcesFlow.inputSchema>) {
  return await analyzeSyllabusAndMatchResourcesFlow(input);
}
