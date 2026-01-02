'use server';

import { GoogleGenerativeAI } from "@google/generative-ai";
import { 
  GenerateStudyPlanInputSchema, 
  GenerateStudyPlanOutputSchema,
  type GenerateStudyPlanInput,
  type GenerateStudyPlanOutput 
} from '@/ai/schemas/study-path';

// Use the stable model name to ensure compatibility with the v1beta endpoint
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENAI_API_KEY!);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

/**
 * Generates a study plan using the Gemini AI.
 * This function is a Server Action and relies on the persistent 
 * NEXT_SERVER_ACTIONS_ENCRYPTION_KEY we configured earlier.
 */
export async function generateStudyPlan(
  input: GenerateStudyPlanInput
): Promise<GenerateStudyPlanOutput> {
  try {
    const prompt = `You are an expert educational planner. Create a comprehensive study plan for: ${input.examType}.
    Topics to cover: ${input.topics.map(t => `${t.topic}`).join(', ')}.
    Return ONLY valid JSON matching this exact structure: ${JSON.stringify(GenerateStudyPlanOutputSchema)}`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Clean potential markdown backticks from AI response
    const cleanedJson = text.replace(/```json|```/g, "").trim();
    const jsonMatch = cleanedJson.match(/\{[\s\S]*\}/);
    
    if (!jsonMatch) {
      throw new Error("AI returned invalid formatting.");
    }
    
    return JSON.parse(jsonMatch[0]) as GenerateStudyPlanOutput;

  } catch (error) {
    console.error("Server Action Error:", error);
    throw new Error("The AI was unable to generate your plan. Please try again.");
  }
}