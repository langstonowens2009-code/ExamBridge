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
  try {
    const prompt = `Create a study plan for: ${input.examType}.
    Topics: ${input.topics.map(t => t.topic).join(', ')}.
    Return structure: { "studyPlan": [ { "week": string, "modules": [ { "topic": string, "description": string, "link": string } ] } ] }`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();

    const rawData = JSON.parse(text.trim());
    // Extract the array, whether it's raw or wrapped in 'studyPlan'
    const planArray = Array.isArray(rawData.studyPlan) ? rawData.studyPlan : (Array.isArray(rawData) ? rawData : []);
    
    // Deep clone to strip metadata
    const cleanArray = JSON.parse(JSON.stringify(planArray));

    // THE FIX: This structure matches your schema exactly based on the error log.
    const finalized: GenerateStudyPlanOutput = {
      studyPlan: cleanArray.map((w: any) => ({
        week: String(w.week || "Week"),
        modules: Array.isArray(w.modules) ? w.modules.map((m: any) => ({
          topic: String(m.topic || "Topic"),
          description: String(m.description || ""),
          link: String(m.link || "#")
        })) : []
      }))
    };

    return finalized;

  } catch (error: any) {
    console.error("AI_SCHEMA_MISMATCH_ERROR:", error.message);
    throw new Error("AI failed to generate a plan matching the required format.");
  }
}