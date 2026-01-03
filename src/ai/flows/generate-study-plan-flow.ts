'use server';

import { GoogleGenerativeAI } from "@google/generative-ai";
import { 
  GenerateStudyPlanOutputSchema,
  type GenerateStudyPlanInput,
  type GenerateStudyPlanOutput 
} from '@/ai/schemas/study-path';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENAI_API_KEY!);
const model = genAI.getGenerativeModel({ 
  model: "gemini-2.0-flash", 
  generationConfig: { responseMimeType: "application/json" } 
});

export async function generateStudyPlan(
  input: GenerateStudyPlanInput
): Promise<GenerateStudyPlanOutput> {
  try {
    const prompt = `Create a study plan for: ${input.examType}.
    Topics: ${input.topics.map(t => t.topic).join(', ')}.
    Return structure: { "topic": string, "weeks": [{ "weekNumber": number, "theme": string, "activities": string[] }] }`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();

    const rawData = JSON.parse(text.trim());
    
    // Extract the plan data from the AI response
    const planData = rawData.studyPlan ? rawData.studyPlan : rawData;

    // Deep clone to strip Zod metadata and ensure plain object
    const cleanPlan = JSON.parse(JSON.stringify(planData));

    // This specific structure clears the TypeScript errors (red squiggles)
    // by ensuring 'weeks' is always an array, even if the AI used a different name.
    const output: GenerateStudyPlanOutput = {
      topic: cleanPlan.topic || input.examType,
      weeks: Array.isArray(cleanPlan.weeks) 
        ? cleanPlan.weeks 
        : (Array.isArray(cleanPlan.weeklySchedule) ? cleanPlan.weeklySchedule : [])
    };

    return output;

  } catch (error: any) {
    console.error("FINAL_PATCH_ERROR:", error.message);
    throw new Error("AI generated the plan, but it failed to render. Please try again.");
  }
}