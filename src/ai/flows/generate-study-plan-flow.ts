'use server';

import { GoogleGenerativeAI } from "@google/generative-ai";
import { 
  GenerateStudyPlanInputSchema, 
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
    // Added "be concise" to prevent the response from being cut off
    const prompt = `Create a CONCISE study plan for: ${input.examType}.
    Topics: ${input.topics.map(t => t.topic).join(', ')}.
    Return ONLY a JSON object matching this schema: ${JSON.stringify(GenerateStudyPlanOutputSchema)}.
    Limit the plan to exactly 3 main sections.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    if (!text) throw new Error("AI returned empty text.");

    // Directly parse since we are forcing JSON mode
    return JSON.parse(text.trim()) as GenerateStudyPlanOutput;

  } catch (error: any) {
    console.error("FINAL_DEBUG_ERROR:", error.message || error);
    throw new Error("Almost there! The plan was too long to load. Trying again...");
  }
}