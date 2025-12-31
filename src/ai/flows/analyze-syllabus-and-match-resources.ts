'use server';

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { StudyPathModuleSchema } from '@/ai/schemas/study-path';

// 1. The Researcher Step: Find raw data using Google Search.
const findSyllabusTopicsPrompt = ai.definePrompt(
  {
    name: 'findSyllabusTopics',
    input: { schema: z.any() },
    // NO output schema here - just get raw text.
  },
  async (input) => {
    // Determine the query based on input type
    const query = input.inputType === 'url' 
      ? `Find syllabus topics from ${input.originalUrl} for the ${input.examType} exam.`
      // For text input, the text *is* the syllabus
      : `Here is a syllabus for the ${input.examType} exam: ${input.syllabusText}`;
    
    // For both cases, ask the AI to find free resources for each topic
    return `${query} For each topic, find a high-quality free online resource (article, video, etc.). Then, provide a list of topics, their descriptions, and the URLs for the resources you found.`;
  }
);

// 2. The Architect Step: Format the raw text into structured JSON.
const formatStudyPathPrompt = ai.definePrompt(
  {
    name: 'formatStudyPath',
    input: { schema: z.string() },
    output: { schema: z.array(StudyPathModuleSchema) }, // Use Zod schema for structured output
  },
  async (rawText) => {
    // Instruct the AI to act as an expert curriculum designer.
    // This prompt is highly defensive to ensure only JSON is returned.
    return `You are an expert curriculum designer. Your ONLY task is to format the following text into a valid JSON array of objects.
    Each object must have three string properties: "topic", "description", and "link".
    Do not include any introductory text, explanations, or markdown code blocks. Output ONLY the raw JSON object.
    
    Here is the text to format:
    "${rawText}"`;
  }
);


// 3. The Main Flow Orchestrator
const analyzeSyllabusAndMatchResourcesFlow = ai.defineFlow(
  {
    name: 'analyzeSyllabusAndMatchResources',
    inputSchema: z.any(),
    outputSchema: z.array(StudyPathModuleSchema),
  },
  async (input) => {
    // STEP 1: RESEARCHER (Web Search for raw data)
    // This step does NOT use a JSON schema to avoid conflicts.
    const researchResponse = await ai.generate({
      prompt: await findSyllabusTopicsPrompt(input),
      config: { tools: [{ googleSearch: {} }] },
      model: 'googleai/gemini-2.0-flash', // Specify model for clarity
    });

    const rawData = researchResponse.text;
    console.log("--- Raw Research Data ---");
    console.log(rawData);

    // If the researcher finds nothing, stop here.
    if (!rawData || rawData.length < 10) {
      return [];
    }

    // STEP 2: ARCHITECT (JSON Formatting - NO TOOLS)
    const architectResponse = await ai.generate({
      prompt: await formatStudyPathPrompt(rawData),
      model: 'googleai/gemini-2.0-flash', // Use a consistent model
      // CRITICAL: No tools are enabled here to prevent conflicts with JSON output.
      config: { tools: [] } 
    });

    // Directly use the structured output from the Architect step
    const studyPath = architectResponse.output;

    // Log the final structured data for debugging
    console.log("--- Final Study Path ---");
    console.log(JSON.stringify(studyPath, null, 2));

    return studyPath || [];
  }
);

// 4. The Bridge (This is the only function exported to the app)
export async function analyzeSyllabusAndMatchResources(input: any) {
  return await analyzeSyllabusAndMatchResourcesFlow(input);
}
