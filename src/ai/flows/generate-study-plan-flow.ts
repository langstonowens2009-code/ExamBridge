'use server';

import { GoogleGenerativeAI } from "@google/generative-ai";
import { 
  GenerateStudyPlanInputSchema, 
  GenerateStudyPlanOutputSchema,
  type GenerateStudyPlanInput,
  type GenerateStudyPlanOutput 
} from '@/ai/schemas/study-path';

// Using the fully qualified 'gemini-1.5-flash-latest' to resolve 404s on v1beta
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENAI_API_KEY!);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });

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
    
    // Extract JSON from AI response
    const cleanedJson = text.replace(/```json|```/g, "").trim();
    const jsonMatch = cleanedJson.match(/\{[\s\S]*\}/);
    
    if (!jsonMatch) throw new Error("AI returned invalid JSON format.");
    
    return JSON.parse(jsonMatch[0]) as GenerateStudyPlanOutput;

  } catch (error: any) {
    // Log the full technical error to Cloud Run logs
    console.error("Detailed AI Error:", error.message || error);
    
    // Send a clearer message to the user interface
    throw new Error(error.message || "AI failed to generate plan.");
  }
}