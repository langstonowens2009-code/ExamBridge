'use server';

import { GoogleGenerativeAI } from "@google/generative-ai";
import { 
  GenerateStudyPlanInputSchema, 
  GenerateStudyPlanOutputSchema,
  type GenerateStudyPlanInput,
  type GenerateStudyPlanOutput 
} from '@/ai/schemas/study-path';

// Using a specific version string often resolves the 404 errors found in v1beta
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENAI_API_KEY!);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-002" });

export async function generateStudyPlan(
  input: GenerateStudyPlanInput
): Promise<GenerateStudyPlanOutput> {
  try {
    // 1. Construct the tailored prompt
    const prompt = `You are an expert educational planner. Create a detailed week-by-week study plan for the '${input.examType}' exam.
    
    Student Profile:
    - Topics to cover: ${input.topics.map(t => `${t.topic} (Difficulty: ${t.difficulty})`).join(', ')}
    - Test Date: ${input.testDate}
    - Study Schedule: Available on ${input.availableStudyDays.join(', ')}
    - Daily Commitment: ${input.minutesPerDay} minutes per session.

    Requirement: Prioritize harder topics and group related concepts logically. 
    Return ONLY a valid JSON object strictly following this structure: ${JSON.stringify(GenerateStudyPlanOutputSchema)}`;

    // 2. Call Gemini directly
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // 3. Clean and parse the response (Handling potential Markdown backticks)
    const cleanedJson = text.replace(/```json|```/g, "").trim();
    const jsonMatch = cleanedJson.match(/\{[\s\S]*\}/);
    
    if (!jsonMatch) {
      console.error("Raw AI Response:", text);
      throw new Error("AI failed to return structured data.");
    }
    
    const parsedOutput = JSON.parse(jsonMatch[0]) as GenerateStudyPlanOutput;
    
    return parsedOutput;

  } catch (error) {
    console.error("Direct SDK Generation Error:", error);
    throw new Error("The AI was unable to generate your plan. Please try again in a moment.");
  }
}