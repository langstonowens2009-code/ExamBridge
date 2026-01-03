'use server';

import { GoogleGenerativeAI } from "@google/generative-ai";
import { 
  GenerateStudyPlanInputSchema, 
  GenerateStudyPlanOutputSchema,
  type GenerateStudyPlanInput,
  type GenerateStudyPlanOutput 
} from '@/ai/schemas/study-path';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENAI_API_KEY!);
// Using the 2.0 stable model to avoid 1.5-flash retirement errors
const model = genAI.getGenerativeModel({ 
  model: "gemini-2.0-flash",
  generationConfig: { responseMimeType: "application/json" } // Forces JSON output
});

export async function generateStudyPlan(
  input: GenerateStudyPlanInput
): Promise<GenerateStudyPlanOutput> {
  try {
    const prompt = `Create a study plan for: ${input.examType}.
    Topics: ${input.topics.map(t => t.topic).join(', ')}.
    Return ONLY a JSON object matching this schema: ${JSON.stringify(GenerateStudyPlanOutputSchema)}`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Log the actual text for your Cloud Run dashboard
    console.log("DEBUG_AI_TEXT:", text);

    if (!text) throw new Error("AI returned nothing.");

    // Parse the JSON directly since we forced MIME type
    return JSON.parse(text) as GenerateStudyPlanOutput;

  } catch (error: any) {
    // This detailed log will show up in your Firebase logs
    console.error("DETAILED_AI_ERROR:", error.message || error);
    
    // This message goes to your website UI
    throw new Error(error.message || "AI failed to generate plan.");
  }
}