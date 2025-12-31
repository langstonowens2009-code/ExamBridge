'use server';

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const StudyPathModuleSchema = z.object({
  topic: z.string().describe('The name of the study topic or module.'),
  description: z
    .string()
    .describe('A brief, one-sentence description of the free resource.'),
  link: z
    .string()
    .url()
    .describe('A direct link to the free study resource.'),
});

const StudyPlanSchema = z.array(StudyPathModuleSchema);

export const analyzeSyllabusAndMatchResources = ai.defineFlow(
  {
    name: 'analyzeSyllabusAndMatchResources',
    inputSchema: z.any(), // Accepts the union object from your UI
    outputSchema: StudyPlanSchema,
  },
  async (input) => {
    const exam = input.examType || 'the requested exam';
    let syllabusSource: string;

    // Use provided text directly if it exists.
    if (input.inputType === 'text' && input.syllabusText) {
      syllabusSource = input.syllabusText;
    } else {
      // STEP 1: The Researcher - Find the raw syllabus text using Google Search.
      const researchPrompt = `You are an expert academic researcher. Your task is to find the syllabus or table of contents for the exam preparation course found at the following source: ${input.originalUrl}. 
      Using your search tool, find the main topics and return them as a simple, unformatted text list. Do not include anything else in your response.`;
      
      const researcher = await ai.generate({
        prompt: researchPrompt,
        config: {
          tools: [{ googleSearch: {} }],
        },
      });

      syllabusSource = researcher.text;
    }
    
    // Log the raw text for debugging.
    console.log('--- Raw Syllabus Text from Researcher ---');
    console.log(syllabusSource);
    console.log('------------------------------------');

    if (!syllabusSource) {
      console.error('Researcher step failed to return any text.');
      return [];
    }
    
    // STEP 2: The Architect - Format the raw text into a structured JSON study plan.
    const formatPrompt = `You are an expert curriculum designer. Take the following raw syllabus text and transform it into a JSON array of study modules for a student preparing for the ${exam}.
    For each topic in the syllabus, you must use your search tool to find a high-quality, free, and publicly accessible online resource (like an article, video, or PDF) that covers the topic.
    
    Your final output MUST be a valid JSON array of objects, where each object has three properties: "topic", "description", and "link".
    - "topic": The name of the study topic.
    - "description": A concise, one-sentence summary of what the free resource covers.
    - "link": The direct URL to the free resource.

    Do not include any introductory text, explanations, or markdown code blocks around the JSON. Your response must be ONLY the raw JSON array.

    Raw Syllabus Text:
    """
    ${syllabusSource}
    """`;

    const architect = await ai.generate({
      prompt: formatPrompt,
      output: {
        schema: StudyPlanSchema,
      },
      config: {
        tools: [{ googleSearch: {} }],
      },
    });

    const studyPlan = architect.output;

    if (!studyPlan) {
      console.error('Architect step failed to generate a study plan.');
      return [];
    }
    
    // Defensive parsing just in case the model returns a string despite the schema.
    if (typeof studyPlan === 'string') {
      try {
        return JSON.parse(studyPlan);
      } catch (e) {
        console.error('Failed to parse study plan string from AI:', e);
        return [];
      }
    }

    return studyPlan;
  }
);
