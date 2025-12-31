'use server';

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { StudyPathModuleSchema } from '@/ai/schemas/study-path';

// Local knowledge base for core syllabi
const EXAM_DATA: Record<string, string> = {
  "SAT": "Evidence-Based Reading, Writing and Language, Math (No Calculator), Math (Calculator), Essay (Optional)",
  "ACT": "English, Mathematics, Reading, Science, Writing (Optional)",
  "AP": "Core curriculum mastery for specific AP subject (e.g., Calculus, US History, Biology) and free-response question strategies.",
  "LSAT": "Logical Reasoning, Analytical Reasoning (Logic Games), Reading Comprehension, Unscored Experimental Section, Unscored Writing Sample",
  "MCAT": "Chemical and Physical Foundations of Biological Systems; Critical Analysis and Reading Skills (CARS); Biological and Biochemical Foundations of Living Systems; Psychological, Social, and Biological Foundations of Behavior",
  "GMAT": "Quantitative Reasoning, Verbal Reasoning, Integrated Reasoning, Analytical Writing Assessment",
  "USMLE": "Step 1: Basic Sciences, Step 2: Clinical Knowledge (CK) and Clinical Skills (CS), Step 3: Advanced Clinical Medicine and Management",
  "COMLEX": "Dimension 1: Competency Domains (e.g., Osteopathic Principles), Dimension 2: Clinical Presentations",
  "NCLEX": "Safe and Effective Care Environment, Health Promotion and Maintenance, Psychosocial Integrity, Physiological Integrity",
  "BAR": "Torts, Contracts, Constitutional Law, Criminal Law and Procedure, Evidence, Real Property, Civil Procedure",
};

const syllabusAnalysisInputSchema = z.object({
  examType: z.string(),
  syllabusText: z.string().optional(),
});

const studyPathOutputSchema = z.array(StudyPathModuleSchema);

const fallbackResult = [{
    topic: 'Search Timed Out',
    description: 'The AI search took too long to complete. This can happen during peak hours. Please try generating the plan again.',
    link: '#'
}];

/**
 * Analyzes a syllabus (either from a knowledge base or custom text) and finds free learning resources.
 * This function uses a two-step AI process:
 * 1. Researcher: Finds relevant topics and resources using a search tool.
 * 2. Architect: Formats the raw findings into a structured JSON output.
 */
export async function analyzeSyllabusAndMatchResources(
  input: z.infer<typeof syllabusAnalysisInputSchema>
): Promise<z.infer<typeof studyPathOutputSchema>> {
  try {
    const examKey = input.examType.includes('AP') ? 'AP' : input.examType.toUpperCase();
    const syllabusContext = EXAM_DATA[examKey] || input.syllabusText || `Core topics for the ${input.examType} exam`;

    // Step 1: The "Researcher" - Use the AI's knowledge and search to find raw information.
    const researcherResult = await ai.generate({
      model: 'gemini-pro',
      prompt: `
        You are an expert academic researcher. Based on the following syllabus topics for the ${input.examType}, 
        find the most important sub-topics and links to the best free learning resources (like YouTube videos from major educational channels, Khan Academy, or official documentation) for 2025 exam prep.
        
        Syllabus Context:
        ${syllabusContext}
      `,
    });

    const rawText = researcherResult.text;
    
    if (!rawText) {
        console.error("Researcher AI failed to produce any text.");
        return fallbackResult;
    }

    // Step 2: The "Architect" - Use a second AI call to structure the raw text into clean JSON.
    const architectResult = await ai.generate({
      model: 'gemini-1.5-flash',
      prompt: `
        You are a meticulous study plan architect. Take the following raw research notes and format them into a clean JSON array of study modules. 
        Each object in the array must have three properties: 'topic', 'description', and 'link'.
        The description should be a concise, one-sentence summary of the topic.
        Only output the JSON array.

        Raw Research:
        ${rawText}
      `,
      output: {
        schema: studyPathOutputSchema,
      },
    });

    const structuredOutput = architectResult.output;
    
    if (!structuredOutput || structuredOutput.length === 0) {
        console.error("Architect AI failed to produce structured output.");
        return fallbackResult;
    }

    return structuredOutput;

  } catch (error) {
    console.error("Error in analyzeSyllabusAndMatchResources flow:", error);
    // On any failure (including timeout), return the fallback object to stop the loading spinner.
    return fallbackResult;
  }
}
