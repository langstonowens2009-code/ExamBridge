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
    Structure: { "topic": string, "weeks": [{ "weekNumber": number, "theme": string, "activities": string[] }] }`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();

    const rawData = JSON.parse(text.trim());
    const planData = rawData.studyPlan ? rawData.studyPlan : rawData;
    
    // This strips any non-plain object metadata (Zod junk)
    const cleanPlan = JSON.parse(JSON.stringify(planData));

    // THE FIX: Explicitly cast the properties to remove the red squiggly
    const output: GenerateStudyPlanOutput = {
      topic: (cleanPlan.topic as string) || input.examType,
      weeks: Array.isArray(cleanPlan.weeks) 
        ? cleanPlan.weeks 
        : (Array.isArray(cleanPlan.weeklySchedule) ? cleanPlan.weeklySchedule : [])
    };

    return output;

  } catch (error: any) {
    console.error("FINAL_TS_ERROR:", error.message);
    throw new Error("AI generated the plan, but it failed to render.");
  }
}