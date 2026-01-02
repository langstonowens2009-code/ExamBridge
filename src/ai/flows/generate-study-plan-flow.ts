'use server';

import { GoogleGenerativeAI } from "@google/generative-ai";
import { 
  GenerateStudyPlanInputSchema, 
  GenerateStudyPlanOutputSchema,
  type GenerateStudyPlanInput,
  type GenerateStudyPlanOutput 
} from '@/ai/schemas/study-path';

// Use a persistent model identifier to avoid 404/Not Found errors
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENAI_API_KEY!);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-002" });

/**
 * EXPLICIT EXPORT: Named exports are more stable for Next.js Server Actions 
 * than wildcard or default exports, helping prevent "Failed to find" errors.
 */
export async function generateStudyPlan(
  input: GenerateStudyPlanInput
): Promise<GenerateStudyPlanOutput> {
  try {
    const prompt = `You are an expert educational planner. Create a study plan for: ${input.examType}.
    Topics: ${input.topics.map(t => `${t.topic}`).join(', ')}.
    Return ONLY valid JSON matching this structure: ${JSON.stringify(GenerateStudyPlanOutputSchema)}`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Robust cleaning to handle potential markdown backticks
    const cleanedJson = text.replace(/```json|```/g, "").trim();
    const jsonMatch = cleanedJson.match(/\{[\s\S]*\}/);
    
    if (!jsonMatch) throw new Error("AI failed to return structured data.");
    
    return JSON.parse(jsonMatch[0]) as GenerateStudyPlanOutput;

  } catch (error) {
    console.error("Server Action Error:", error);
    throw new Error("The AI was unable to generate your plan. Please try again.");
  }
}