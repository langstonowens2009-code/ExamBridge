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
    Return ONLY JSON with this structure: { "studyPlan": { "topic": string, "weeks": [...] } }`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // 1. Parse the AI response
    const rawData = JSON.parse(text.trim());

    // 2. CRITICAL FIX: Extract only the studyPlan to strip Zod metadata (_def, vendor)
    // Your logs show the AI is sending back Zod schema objects that crash the UI.
    const planContent = rawData.studyPlan ? rawData.studyPlan : rawData;

    // 3. FINAL CLEANUP: Deep-clone to ensure it's a plain object for Next.js 15
    return JSON.parse(JSON.stringify(planContent)) as GenerateStudyPlanOutput;

  } catch (error: any) {
    console.error("FINAL_SERIALIZATION_ERROR:", error.message);
    throw new Error("AI generated the plan, but it failed to load. Please try again.");
  }
}