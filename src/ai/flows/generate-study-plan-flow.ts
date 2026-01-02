'use server';

import { GoogleGenerativeAI } from "@google/generative-ai";
import { 
  GenerateStudyPlanInputSchema, 
  GenerateStudyPlanOutputSchema,
  type GenerateStudyPlanInput,
  type GenerateStudyPlanOutput 
} from '@/ai/schemas/study-path';

// Use the latest active model to resolve the 404 error
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENAI_API_KEY!);
const model = genAI.getGenerativeModel({ model: "gemini-3-flash" }); // Updated to latest active model

export async function generateStudyPlan(
  input: GenerateStudyPlanInput
): Promise<GenerateStudyPlanOutput> {
  try {
    const prompt = `You are an expert educational planner. Create a detailed study plan for: ${input.examType}.
    Topics: ${input.topics.map(t => `${t.topic} (Difficulty: ${t.difficulty})`).join(', ')}
    Test Date: ${input.testDate}. Available Days: ${input.availableStudyDays.join(', ')}.
    Return ONLY a valid JSON object matching this schema: ${JSON.stringify(GenerateStudyPlanOutputSchema)}`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    const cleanedJson = text.replace(/```json|```/g, "").trim();
    const jsonMatch = cleanedJson.match(/\{[\s\S]*\}/);
    
    if (!jsonMatch) throw new Error("AI failed to return structured data.");
    
    return JSON.parse(jsonMatch[0]) as GenerateStudyPlanOutput;

  } catch (error) {
    console.error("Direct SDK Generation Error:", error);
    throw new Error("The AI was unable to generate your plan. Please try again in a moment.");
  }
}