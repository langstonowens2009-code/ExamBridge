'use server';

import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENAI_API_KEY!);
const model = genAI.getGenerativeModel({ 
  model: "gemini-1.5-flash-latest",
  generationConfig: { responseMimeType: "application/json" }
});

export async function generateStudySessionAction(topic: string, exam: string, time: string) {
  try {
    const prompt = `Act as an expert tutor for the ${exam} exam. The student wants to study the topic "${topic}" for approximately ${time} minutes. 
    Provide two things in a JSON object:
    1. "notes": A concise summary of the most important concepts for this topic, formatted as an HTML string with headings, lists, and bold text.
    2. "questions": An array of exactly three multiple-choice practice questions. Each question object in the array should have: "q" (the question text), "options" (an array of 4 string options), "answer" (the 0-based index of the correct option), and "explanation" (a brief justification for the correct answer).
    
    Return ONLY the raw JSON object, without any markdown formatting or commentary.
    
    Example JSON Structure:
    { 
      "notes": "<h1>Main Concept</h1><p>Details about the concept...</p>", 
      "questions": [
        { 
          "q": "What is the capital of France?", 
          "options": ["London", "Berlin", "Paris", "Madrid"], 
          "answer": 2, 
          "explanation": "Paris is the capital of France, known for its iconic Eiffel Tower." 
        }
      ] 
    }`;

    const result = await model.generateContent(prompt);
    const rawText = result.response.text().trim();
    // Clean potential markdown code fences
    const cleanText = rawText.replace(/^```json\s*|```\s*$/g, '');
    const data = JSON.parse(cleanText);

    // Basic validation to ensure the structure is correct
    if (!data.notes || !Array.isArray(data.questions)) {
      throw new Error("AI returned data in an unexpected format.");
    }
    
    return { success: true, data };
  } catch (error: any) {
    console.error("AI_SESSION_ERROR:", error.message);
    return { success: false, error: "The AI failed to generate a study session. The model may be temporarily overloaded. Please try again in a moment." };
  }
}
