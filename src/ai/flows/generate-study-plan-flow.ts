'use server';

import { GoogleGenerativeAI } from "@google/generative-ai";
import { 
  GenerateStudyPlanInputSchema, 
  GenerateStudyPlanOutputSchema,
  type GenerateStudyPlanInput,
  type GenerateStudyPlanOutput 
} from '@/ai/schemas/study-path';

// Fix: Use the stable 2026 production model 'gemini-2.5-flash'
// Old 'gemini-1.5-flash-latest' aliases return 404 errors as they are retired.
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENAI_API_KEY!);
const model = genAI.getGenerativeModel({ 
  model: "gemini-2.5-flash",
  generationConfig: {
    responseMimeType: "application/json",
    maxOutputTokens: 2048,
  }
});

export async function generateStudyPlan(
  input: GenerateStudyPlanInput
): Promise<GenerateStudyPlanOutput> {
  try {
    const prompt = `Create a concise study plan for: ${input.examType}.
    Topics: ${input.topics.map(t => t.topic).join(', ')}.
    Return ONLY a JSON object matching this schema: ${JSON.stringify(GenerateStudyPlanOutputSchema)}`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    if (!text) throw new Error("AI returned no text.");

    // Parse the JSON directly for forced JSON mode
    return JSON.parse(text.trim()) as GenerateStudyPlanOutput;

  } catch (error: any) {
    // Log technical error for Cloud Run dashboard
    console.error("AI_EXECUTION_ERROR:", error.message || error);
    
    // Send a clear message back to the UI
    throw new Error(error.message || "The AI service is currently unavailable.");
  }
}