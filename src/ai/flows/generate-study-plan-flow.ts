'use server';

import { GoogleGenerativeAI } from "@google/generative-ai";
import { 
  GenerateStudyPlanInputSchema, 
  GenerateStudyPlanOutputSchema,
  type GenerateStudyPlanInput,
  type GenerateStudyPlanOutput 
} from '@/ai/schemas/study-path';

// Using the latest 2.0 Flash model to resolve the 404/Not Found errors
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENAI_API_KEY!);
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

export async function generateStudyPlan(
  input: GenerateStudyPlanInput
): Promise<GenerateStudyPlanOutput> {
  try {
    const prompt = `You are an expert educational planner. Create a detailed study plan for the '${input.examType}' exam.
    
    Student Profile:
    - Topics: ${input.topics.map(t => `${t.topic} (Difficulty: ${t.difficulty})`).join(', ')}
    - Test Date: ${input.testDate}
    - Schedule: Available on ${input.availableStudyDays.join(', ')}
    - Daily Time: ${input.minutesPerDay} minutes.

    Requirement: Prioritize harder topics. Group related concepts.
    Return ONLY a valid JSON object strictly following this structure: ${JSON.stringify(GenerateStudyPlanOutputSchema)}`;

    // Direct call to the new stable model endpoint
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Robust JSON cleaning to handle markdown backticks
    const cleanedJson = text.replace(/```json|```/g, "").trim();
    const jsonMatch = cleanedJson.match(/\{[\s\S]*\}/);
    
    if (!jsonMatch) {
      console.error("AI Response was not JSON:", text);
      throw new Error("AI failed to return structured data.");
    }
    
    return JSON.parse(jsonMatch[0]) as GenerateStudyPlanOutput;

  } catch (error) {
    console.error("Direct SDK Generation Error:", error);
    throw new Error("The AI was unable to generate your plan. Please try again in a moment.");
  }
}