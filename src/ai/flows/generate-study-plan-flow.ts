'use server';

import { GoogleGenerativeAI } from "@google/generative-ai";
import { 
  GenerateStudyPlanInputSchema, 
  GenerateStudyPlanOutputSchema,
  type GenerateStudyPlanInput,
  type GenerateStudyPlanOutput 
} from '@/ai/schemas/study-path';

// Using 'gemini-1.5-flash' as the stable alias to avoid 404 errors
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENAI_API_KEY!);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

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
    
    const cleanedJson = text.replace(/```json|```/g, "").trim();
    const jsonMatch = cleanedJson.match(/\{[\s\S]*\}/);
    
    if (!jsonMatch) throw new Error("AI response was not in a valid JSON format.");
    
    return JSON.parse(jsonMatch[0]) as GenerateStudyPlanOutput;

  } catch (error: any) {
    // Log the full error to Cloud Run logs for debugging
    console.error("Detailed AI Error:", error.message || error);
    
    // Throw a cleaner message to the UI
    throw new Error(error.message || "The AI was unable to generate your plan. Please try again.");
  }
}