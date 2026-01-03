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
  model: "gemini-2.0-flash", // Jan 2026 stable model
  generationConfig: { responseMimeType: "application/json" } 
});

export async function generateStudyPlan(
  input: GenerateStudyPlanInput
): Promise<GenerateStudyPlanOutput> {
  // Log 1: Monitor input data
  console.log("AI_INPUT_RECEIVED:", JSON.stringify(input));
  
  try {
    const prompt = `Create a study plan for: ${input.examType}.
    Topics: ${input.topics.map(t => t.topic).join(', ')}.
    Return ONLY a JSON object matching this schema: ${JSON.stringify(GenerateStudyPlanOutputSchema)}`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Log 2: The "Key Line" - what did the AI actually say?
    console.log("RAW_AI_TEXT:", text);

    if (!text) throw new Error("AI_RETURNED_EMPTY_TEXT");

    // 1. Parse the AI response
    const rawJson = JSON.parse(text.trim());

    // 2. Log 3: Verify the data before serialization
    console.log("PARSED_PLAN_PRE_SERIALIZATION:", JSON.stringify(rawJson));

    // 3. THE FIX: Convert to a plain object to prevent "Only plain objects" error
    // This strips out complex Classes/Timestamps so Next.js can pass it to the client
    const cleanObject = JSON.parse(JSON.stringify(rawJson));

    return cleanObject as GenerateStudyPlanOutput;

  } catch (error: any) {
    // Log 4: Full error details for Cloud Run
    console.error("FULL_AI_ERROR_DETAILS:", error.message || error);
    
    // Send a plain string back to the UI to avoid crashing error.tsx
    throw new Error(error.message || "AI failed to generate plan.");
  }
}