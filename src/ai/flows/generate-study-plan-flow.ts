'use server';

import { GoogleGenerativeAI } from "@google/generative-ai";
import { 
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
    const prompt = `Create a study plan for: ${input.examType}.
    Topics: ${input.topics.map(t => t.topic).join(', ')}.
    IMPORTANT: You MUST use the key "weeks" for the array of study sessions.
    Return structure: { "topic": string, "weeks": [{ "weekNumber": number, "theme": string, "activities": string[] }] }`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    const rawData = JSON.parse(text.trim());
    
    // Extract the inner content if AI wrapped it in "studyPlan"
    const content = rawData.studyPlan ? rawData.studyPlan : rawData;

    // NAME MATCHING FIX: If AI used 'weeklySchedule', rename it to 'weeks'
    const finalData = {
      topic: content.topic || input.examType,
      weeks: content.weeks || content.weeklySchedule || []
    };

    // Serialize to plain JSON for Next.js 15
    return JSON.parse(JSON.stringify(finalData)) as GenerateStudyPlanOutput;

  } catch (error: any) {
    console.error("DISPLAY_FIX_ERROR:", error.message);
    throw new Error("AI generated the plan, but it failed to display. Retrying...");
  }
}