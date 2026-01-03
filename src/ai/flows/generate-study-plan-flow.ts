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
    Return structure: { "studyPlan": [ { "week": string, "modules": [ { "topic": string, "description": string, "link": string } ] } ] }
    IMPORTANT: Provide real, valid educational URLs (Khan Academy, YouTube, etc.) for each module link.`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();

    const rawData = JSON.parse(text.trim());
    const data = rawData.studyPlan || rawData;
    const clean = JSON.parse(JSON.stringify(data));

    const finalized: GenerateStudyPlanOutput = {
      studyPlan: (Array.isArray(clean) ? clean : []).map((w: any) => ({
        week: String(w.week || "Study Week"),
        modules: (Array.isArray(w.modules) ? w.modules : []).map((m: any) => ({
          topic: String(m.topic || "Topic"),
          description: String(m.description || "Study activity"),
          // FIXED: Now uses the AI-generated link instead of "#"
          link: String(m.link && m.link !== "#" ? m.link : "https://www.khanacademy.org")
        }))
      }))
    };

    return finalized;

  } catch (error: any) {
    console.error("AI_FLOW_CRASH:", error.message);
    throw new Error("AI failed to generate plan.");
  }
}