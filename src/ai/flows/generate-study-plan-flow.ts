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
    
    // Extract the array (AI might wrap it in 'studyPlan' or 'weeklySchedule')
    const rawArray = Array.isArray(rawData.studyPlan) ? rawData.studyPlan : 
                     (Array.isArray(rawData) ? rawData : []);

    // Clean Zod metadata using JSON roundtrip (fixes "Ln is not a function")
    const cleanArray = JSON.parse(JSON.stringify(rawArray));

    // THE FIX: This returns the 'studyPlan' array that the frontend expects.
    const finalized: GenerateStudyPlanOutput = {
      studyPlan: cleanArray.map((w: any) => ({
        week: String(w.week || w.weekNumber || "Study Week"),
        modules: (Array.isArray(w.modules) ? w.modules : (Array.isArray(w.activities) ? w.activities : [])).map((m: any) => ({
          topic: typeof m === 'string' ? m : String(m.topic || "Topic Breakdown"),
          description: typeof m === 'string' ? "Planned study activity" : String(m.description || ""),
          link: "#" 
        }))
      }))
    };

    return finalized;

  } catch (error: any) {
    console.error("DASHBOARD_RENDER_ERROR:", error.message);
    throw new Error("AI generated the plan, but it failed to render.");
  }
}