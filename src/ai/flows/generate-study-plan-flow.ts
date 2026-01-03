'use server';

import { GoogleGenerativeAI } from "@google/generative-ai";
import { type GenerateStudyPlanInput, type GenerateStudyPlanOutput } from '@/ai/schemas/study-path';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENAI_API_KEY!);
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

export async function generateStudyPlan(input: GenerateStudyPlanInput): Promise<GenerateStudyPlanOutput> {
  try {
    const prompt = `Plan for ${input.examType}. Start: ${input.startDate}. Topics: ${input.topics.map(t => t.topic)}.
    For each week, create a 'studyLink' that carries the specific topic and context.`;

    const result = await model.generateContent(prompt);
    const data = JSON.parse(result.response.text().trim());
    
    // THE ACELY FIX: Link redirects to your own /study page with the context attached
    return {
      studyPlan: data.studyPlan.map((w: any) => ({
        week: w.week,
        modules: w.modules.map((m: any) => ({
          topic: m.topic,
          description: m.description,
          // This tells your app: "When clicked, open our Study Room for this specific topic"
          link: `/dashboard/study?topic=${encodeURIComponent(m.topic)}&exam=${encodeURIComponent(input.examType)}&days=${input.studyDays.join(',')}`
        }))
      }))
    };
  } catch (error: any) {
    throw new Error("Failed to link resources to study plan.");
  }
}