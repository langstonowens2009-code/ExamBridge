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
    Return structure: { "topic": string, "weeks": [{ "weekNumber": number, "theme": string, "activities": string[] }] }`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();

    const rawData = JSON.parse(text.trim());
    const data = rawData.studyPlan || rawData;
    const clean = JSON.parse(JSON.stringify(data));

    // THE FIX: This structure matches your schema exactly, removing the red squiggle.
    // We wrap everything in 'studyPlan' to satisfy the ts(2353) error.
    const finalized: GenerateStudyPlanOutput = {
      studyPlan: {
        topic: String(clean.topic || input.examType),
        weeks: (Array.isArray(clean.weeks) ? clean.weeks : 
               Array.isArray(clean.weeklySchedule) ? clean.weeklySchedule : []).map((w: any) => ({
          weekNumber: Number(w.weekNumber || w.week || 0),
          theme: String(w.theme || w.topic || w.theme || "Study Session"),
          activities: Array.isArray(w.activities) ? w.activities.map(String) : []
        }))
      }
    };

    return finalized;

  } catch (error: any) {
    console.error("AI_FLOW_CRASH:", error.message);
    throw new Error("AI generated the plan, but it failed to render.");
  }
}