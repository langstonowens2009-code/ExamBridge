'use server';

import { GoogleGenerativeAI } from "@google/generative-ai";
import { type GenerateStudyPlanInput, type GenerateStudyPlanOutput } from '@/ai/schemas/study-path';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENAI_API_KEY!);
const model = genAI.getGenerativeModel({ 
  model: "gemini-2.0-flash", 
  generationConfig: { responseMimeType: "application/json" } 
});

export async function generateStudyPlan(input: GenerateStudyPlanInput): Promise<GenerateStudyPlanOutput> {
  try {
    const prompt = `Act as an expert tutor for ${input.examType}. 
    Topics to cover: ${input.topics.map(t => t.topic).join(', ')}.
    Return a JSON object: { "studyPlan": [ { "week": string, "modules": [ { "topic": string, "description": string, "link": string } ] } ] }
    IMPORTANT: The 'link' should be an internal path like: /dashboard/study?topic=NON_MENDELIAN_GENETICS`;

    const result = await model.generateContent(prompt);
    const data = JSON.parse(result.response.text().trim());
    const clean = JSON.parse(JSON.stringify(data.studyPlan || data));

    return {
      studyPlan: clean.map((w: any) => ({
        week: String(w.week || "Week"),
        modules: (w.modules || []).map((m: any) => ({
          topic: String(m.topic),
          description: String(m.description),
          // We convert the topic to a URL-friendly slug
          link: `/dashboard/study?topic=${encodeURIComponent(m.topic)}&exam=${encodeURIComponent(input.examType)}`
        }))
      }))
    };
  } catch (error: any) {
    throw new Error("Failed to generate Acely-style path.");
  }
}