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
    const prompt = `Act as an expert tutor for ${input.examType}. 
    Test Date: ${input.testDate}. 
    Topics: ${input.topics.map(t => t.topic).join(', ')}.
    Return structure: { "studyPlan": [ { "week": string, "modules": [ { "topic": string, "description": string, "link": string } ] } ] }
    IMPORTANT: The 'link' must be: /dashboard/study?topic=TOPIC_NAME&exam=${input.examType}&time=${input.minutesPerDay}`;

    const result = await model.generateContent(prompt);
    const rawData = JSON.parse(result.response.text().trim());
    const clean = JSON.parse(JSON.stringify(rawData.studyPlan || rawData));

    const finalized: GenerateStudyPlanOutput = {
      studyPlan: (Array.isArray(clean) ? clean : []).map((w: any) => ({
        week: String(w.week || "Study Week"),
        modules: (Array.isArray(w.modules) ? w.modules : []).map((m: any) => ({
          topic: String(m.topic),
          description: String(m.description),
          // This creates the link to your internal practice room
          link: `/dashboard/study?topic=${encodeURIComponent(m.topic)}&exam=${encodeURIComponent(input.examType)}&time=${input.minutesPerDay}`
        }))
      }))
    };

    return finalized;

  } catch (error: any) {
    throw new Error("Failed to generate plan.");
  }
}