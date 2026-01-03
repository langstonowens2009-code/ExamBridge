'use server';

import { GoogleGenerativeAI } from "@google/generative-ai";
import { 
  GenerateStudyPlanInputSchema, 
  GenerateStudyPlanOutputSchema,
  type GenerateStudyPlanInput,
  type GenerateStudyPlanOutput 
} from '@/ai/schemas/study-path';

// Using 'gemini-flash-latest' which is the current verified alias for the v1beta endpoint
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENAI_API_KEY!);
const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

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
    // This logs the full technical error to your Cloud Run dashboard
    console.error("Detailed AI Error:", error.message || error);
    
    // This sends the message to your website's UI
    throw new Error("The AI service is currently unavailable. Please try again.");
  }
}