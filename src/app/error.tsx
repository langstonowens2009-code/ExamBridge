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
  model: "gemini-2.5-flash",
  generationConfig: { responseMimeType: "application/json" } 
});

export async function generateStudyPlan(
  input: GenerateStudyPlanInput
): Promise<GenerateStudyPlanOutput> {
  try {
    const prompt = `Create a study plan for: ${input.examType}.
    Topics: ${input.topics.map(t => t.topic).join(', ')}.
    Return ONLY JSON matching this schema: ${JSON.stringify(GenerateStudyPlanOutputSchema)}`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // 1. Parse the raw AI response
    const rawData = JSON.parse(text.trim());

    // 2. SERIALIZATION FIX: 
    // This deep-clones the object into a "Plain Object" format.
    // It strips out any hidden Classes or Prototypes that crash Next.js.
    const cleanData = JSON.parse(JSON.stringify(rawData));

    // 3. Ensure dates are strings if they exist in the schema
    if (cleanData.testDate && typeof cleanData.testDate !== 'string') {
      cleanData.testDate = new Date().toISOString(); 
    }

    return cleanData as GenerateStudyPlanOutput;

  } catch (error: any) {
    console.error("SERIALIZATION_OR_AI_ERROR:", error.message || error);
    // Bubble up a plain string error
    throw new Error("Data processing error: Please try generating again.");
  }
}