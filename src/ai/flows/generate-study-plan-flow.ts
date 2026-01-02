'use server';

import { GoogleGenerativeAI } from "@google/generative-ai";
import { 
  GenerateStudyPlanInputSchema, 
  GenerateStudyPlanOutputSchema,
  type GenerateStudyPlanInput,
  type GenerateStudyPlanOutput 
} from '@/ai/schemas/study-path';

// 1. Using the auto-updated stable alias 'gemini-2.0-flash' to prevent 404 errors
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENAI_API_KEY!);
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

export async function generateStudyPlan(
  input: GenerateStudyPlanInput
): Promise<GenerateStudyPlanOutput> {
  try {
    const prompt = `You are an expert educational planner. Create a detailed study plan for: ${input.examType}.
    Topics: ${input.topics.map(t => `${t.topic} (Difficulty: ${t.difficulty})`).join(', ')}
    Test Date: ${input.testDate}. Available Days: ${input.availableStudyDays.join(', ')}.
    Return ONLY a valid JSON object matching this schema: ${JSON.stringify(GenerateStudyPlanOutputSchema)}`;

    // 2. Direct call to the new stable model
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // 3. Robust JSON cleaning
    const cleanedJson = text.replace(/```json|```/g, "").trim();
    const jsonMatch = cleanedJson.match(/\{[\s\S]*\}/);
    
    if (!jsonMatch) throw new Error("AI failed to return structured data.");
    
    return JSON.parse(jsonMatch[0]) as GenerateStudyPlanOutput;

  } catch (error) {
    console.error("Direct SDK Generation Error:", error);
    throw new Error("Generation failed. Please try again.");
  }
}