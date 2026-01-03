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
  console.log("AI_INPUT_START:", input.examType);
  
  try {
    const prompt = `Create a study plan for: ${input.examType}.
    Topics: ${input.topics.map(t => t.topic).join(', ')}.
    Return ONLY a JSON object with this structure: { "topic": string, "weeks": [...] }`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // 1. Parse the AI response
    const rawData = JSON.parse(text.trim());

    // 2. EXTRACTION: Get just the plan data, skipping Zod wrapper if it exists
    const planData = rawData.studyPlan ? rawData.studyPlan : rawData;

    // 3. SERIALIZATION FIX: This strips all Zod metadata (_def, ~standard)
    // and creates a plain object that Next.js 15 can safely pass to the UI.
    const cleanPlan = JSON.parse(JSON.stringify(planData));

    // 4. MAPPING FIX: Ensure the dashboard sees "weeks" even if AI used "weeklySchedule"
    return {
      topic: cleanPlan.topic || input.examType,
      weeks: cleanPlan.weeks || cleanPlan.weeklySchedule || []
    } as GenerateStudyPlanOutput;

  } catch (error: any) {
    console.error("FINAL_PATCH_ERROR:", error.message);
    throw new Error("AI generated the plan, but it failed to render. Please try again.");
  }
}