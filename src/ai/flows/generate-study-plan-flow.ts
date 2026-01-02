'use server';

import { GoogleGenerativeAI } from "@google/generative-ai";
import { 
  GenerateStudyPlanInputSchema, 
  GenerateStudyPlanOutputSchema,
  type GenerateStudyPlanInput,
  type GenerateStudyPlanOutput 
} from '@/ai/schemas/study-path';

/**
 * UPDATED JAN 2026:
 * gemini-2.5-flash is the current stable production model.
 * gemini-1.5 and "-latest" aliases are retired and return 404s.
 */
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENAI_API_KEY!);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

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
    
    // Clean and extract JSON
    const cleanedJson = text.replace(/```json|```/g, "").trim();
    const jsonMatch = cleanedJson.match(/\{[\s\S]*\}/);
    
    if (!jsonMatch) throw new Error("AI failed to return valid JSON format.");
    
    return JSON.parse(jsonMatch[0]) as GenerateStudyPlanOutput;

  } catch (error: any) {
    // Logs the full Google error (like 404 or 429) to Cloud Run
    console.error("Detailed AI Error:", error.message || error);
    
    // Sends the error message to the website interface
    throw new Error(error.message || "The AI service is currently unavailable.");
  }
}