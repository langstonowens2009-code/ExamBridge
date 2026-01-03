'use server';

import { GoogleGenerativeAI } from "@google/generative-ai";
import { 
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
  console.log("AI_INPUT_START:", input.examType);
  
  try {
    const prompt = `Create a study plan for: ${input.examType}.
    Topics: ${input.topics.map(t => t.topic).join(', ')}.
    Return structure: { "studyPlan": [ { "week": string, "modules": [ { "topic": string, "description": string, "link": string } ] } ] }`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    console.log("RAW_AI_TEXT:", text);

    // 1. Parse raw AI JSON
    const rawData = JSON.parse(text.trim());
    
    // 2. Extract the array (AI might wrap it or return it raw)
    const rawArray = Array.isArray(rawData.studyPlan) ? rawData.studyPlan : 
                     (Array.isArray(rawData) ? rawData : []);

    // 3. THE FIX: Strip Zod metadata using JSON roundtrip (fixes "Ln is not a function")
    const cleanArray = JSON.parse(JSON.stringify(rawArray));

    // 4. THE SCHEMA FIX: Map to the exact 'modules' structure (fixes ts2353)
    const finalized: GenerateStudyPlanOutput = {
      studyPlan: cleanArray.map((w: any) => ({
        week: String(w.week || w.weekNumber || "Study Week"),
        modules: (Array.isArray(w.modules) ? w.modules : (Array.isArray(w.activities) ? w.activities : [])).map((m: any) => ({
          topic: typeof m === 'string' ? m : String(m.topic || "Topic"),
          description: typeof m === 'string' ? "AI-generated study module" : String(m.description || ""),
          link: "#" 
        }))
      }))
    };

    console.log("CLEAN_PLAN_FINAL:", JSON.stringify(finalized));
    return finalized;

  } catch (error: any) {
    console.error("FINAL_SERIALIZATION_ERROR:", error.message);
    throw new Error("AI failed to generate a plan matching the required format.");
  }
}