'use server';

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { StudyPathModuleSchema } from '@/ai/schemas/study-path';

const MASTER_SYLLABUS: Record<string, string> = {
  "SAT": "Algebra, Advanced Math, Problem Solving, Geometry, Reading, Writing.",
  "ACT": "English, Math, Reading Comprehension, Science Data.",
  "LSAT": "Logical Reasoning, Reading Comp, Analytical Reasoning.",
  "MCAT": "Biochem, Biology, Physics, Psych, Sociology, CARS.",
  "GMAT": "Quant, Verbal, Data Insights.",
  "USMLE": "Step 1: Basic Sciences. Step 2: Clinical. Step 3: Management.",
  "COMLEX": "Osteopathic Principles, Clinical Sciences, Patient Care.",
  "NCLEX": "Management of Care, Safety, Pharmacology, Physiological Adaptation.",
  "BAR": "Civil Procedure, Con Law, Contracts, Criminal Law, Evidence, Property, Torts.",
  "AP": "Core unit mastery and exam-specific free response prep."
};

const syllabusAnalysisInputSchema = z.object({
  examType: z.string(),
  syllabusText: z.string().optional(),
  websiteContent: z.string().optional(),
});

const studyPathOutputSchema = z.array(StudyPathModuleSchema);

export async function analyzeSyllabusAndMatchResources(input: {
  examType: string;
  syllabusText?: string;
  websiteContent?: string;
}) {
  return await analyzeSyllabusAndMatchResourcesFlow(input);
}

const architectPrompt = ai.definePrompt({
  name: 'studyPlanArchitect',
  input: { schema: z.object({ examType: z.string(), context: z.string() }) },
  output: { schema: studyPathOutputSchema },
  model: 'gemini-1.5-flash',
  prompt: `
    You are an Elite Academic Tutor.
    Your task is to create a structured study plan with links to free, high-quality resources.
    The study plan is for the {{examType}} exam.
    
    Here is the raw data on the syllabus topics:
    {{context}}
    
    From this data, create a study plan. For each topic, provide a concise one-sentence description and a link to a helpful free resource (like Khan Academy, a YouTube video, or a reputable educational website).
    
    Output a JSON array of objects, where each object has 'topic', 'description', and 'link'.
  `,
});

const analyzeSyllabusAndMatchResourcesFlow = ai.defineFlow(
  {
    name: 'analyzeSyllabusAndMatchResourcesFlow',
    inputSchema: syllabusAnalysisInputSchema,
    outputSchema: studyPathOutputSchema,
  },
  async (input) => {
    const exam = (input.examType || 'SAT').toUpperCase();
    const lookupKey = exam.includes('AP') ? 'AP' : exam;
    const syllabusContext = MASTER_SYLLABUS[lookupKey] || "General Exam Prep";

    // Step 1: Architect - Structure the raw text into JSON
    const architectInput = {
      examType: input.examType,
      context: syllabusContext,
    };
    
    const { output } = await architectPrompt(architectInput);

    if (!output) {
      console.error("Architect failed to produce an output. Returning empty array.");
      return [];
    }

    return output;
  }
);
