'use server';

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { StudyPathModuleSchema } from '../schemas/study-path';

// Local constant to bypass the unreliable googleSearch tool for common exams.
const SYLLABUS_LOOKUP: Record<string, string> = {
    'SAT': 'Evidence-Based Reading and Writing, Math (Heart of Algebra, Problem Solving and Data Analysis, Passport to Advanced Math)',
    'ACT': 'English, Math, Reading, Science, Writing',
    'AP Classes': 'Depends on the specific AP subject (e.g., AP Calculus AB: Limits, Derivatives, Integrals; AP US History: Colonial America, The Revolution, Civil War)',
    'LSAT': 'Reading Comprehension, Analytical Reasoning, Logical Reasoning',
    'MCAT': 'Chemical and Physical Foundations of Biological Systems; Critical Analysis and Reasoning Skills; Biological and Biochemical Foundations of Living Systems; Psychological, Social, and Biological Foundations of Behavior',
    'GMAT': 'Quantitative Reasoning, Verbal Reasoning, Integrated Reasoning, Analytical Writing Assessment',
    'USMLE (Steps 1-3)': 'Step 1: Basic Sciences (Anatomy, Physiology, Biochemistry), Step 2: Clinical Knowledge (Internal Medicine, Surgery, Pediatrics), Step 3: Clinical Management',
    'COMLEX-USA': 'Osteopathic Principles and Practice, Medical Knowledge, Patient Care',
    'NCLEX-RN/PN': 'Safe and Effective Care Environment, Health Promotion and Maintenance, Psychosocial Integrity, Physiological Integrity',
    'BAR Exam': 'Constitutional Law, Contracts, Criminal Law and Procedure, Evidence, Real Property, Torts, Civil Procedure',
};


const analyzeSyllabusAndMatchResourcesFlow = ai.defineFlow(
  {
    name: 'analyzeSyllabusAndMatchResources',
    inputSchema: z.object({
        examType: z.string(),
        inputType: z.string(),
        syllabusText: z.string().optional(),
        originalUrl: z.string().optional(),
    }),
    outputSchema: z.array(StudyPathModuleSchema),
  },
  async (input) => {
    // Determine the content: Prioritize the SYLLABUS_LOOKUP. Fallback to user text.
    const examSyllabus = SYLLABUS_LOOKUP[input.examType] || input.syllabusText || '';
    
    // If no syllabus is found, return empty.
    if (!examSyllabus) {
        console.log("No syllabus found from lookup or direct input.");
        return [];
    }

    // The single, reliable AI call.
    const response = await ai.generate({
      prompt: `You are an Elite Academic Tutor. Your task is to create a study plan based on the provided syllabus topics.
               For each topic, provide a brief, one-sentence description and a link to a high-quality, free study resource (like Khan Academy, Coursera, YouTube, or .edu sites).
               
               Syllabus Topics: "${examSyllabus}"

               Return your response as a valid JSON array. Do not include any introductory text or markdown code blocks. Output ONLY the raw JSON array.`,
      model: 'googleai/gemini-pro',
      output: { 
        schema: z.array(StudyPathModuleSchema),
      },
    });
    
    const output = response.output;
    
    // Handle cases where the model might still wrap the output in markdown
    if (!output) {
      const textOutput = response.text;
      if (textOutput) {
        try {
          const cleanedString = textOutput.replace(/```json|```/g, '').trim();
          return JSON.parse(cleanedString);
        } catch (e) {
          console.error("Failed to parse AI text output:", e);
          return [];
        }
      }
      return [];
    }

    return output;
  }
);

export async function analyzeSyllabusAndMatchResources(input: z.infer<typeof analyzeSyllabusAndMatchResourcesFlow.inputSchema>) {
  return await analyzeSyllabusAndMatchResourcesFlow(input);
}
