'use server';

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { StudyPathModuleSchema } from '@/ai/schemas/study-path';

// 1. MASTER 2025 SYLLABUS DATABASE
const MASTER_SYLLABUS: Record<string, string> = {
  "SAT": "Algebra (Linear/Systems), Advanced Math (Quadratics/Exponents), Problem Solving (Ratios/Stats), Geometry & Trig, Reading: Ideas & Evidence, Writing: Grammar & Logical Flow.",
  "ACT": "English (Grammar/Punctuation), Mathematics (Pre-Algebra to Trig), Reading Comprehension (Social/Natural Sciences), Science (Data Interpretation/Research Summaries).",
  "LSAT": "Logical Reasoning (Argument Evaluation), Reading Comprehension (Scholarly Texts), Analytical Reasoning (Logic Games/Relationship Structures).",
  "MCAT": "Bio/Biochem Foundations, Chem/Phys Foundations, Psych/Social Foundations, Critical Analysis & Reasoning Skills (CARS).",
  "GMAT": "Quantitative Reasoning (Arithmetic/Algebra), Verbal Reasoning (Critical Reasoning/Reading Comp), Data Insights (Multi-source/Table Analysis).",
  "USMLE": "Step 1: Foundational Basic Sciences. Step 2 CK: Clinical Knowledge & Patient Care. Step 3: Patient Management & Clinical Decision Making.",
  "COMLEX": "Osteopathic Principles & Manipulative Treatment, Foundational Biomedical Sciences, Clinical Presentations (Human Development, Nervous System, Musculoskeletal).",
  "NCLEX": "Management of Care, Safety & Infection Control, Pharmacology/Parenteral Therapies, Physiological Adaptation, Health Promotion & Maintenance.",
  "BAR": "MBE Topics: Civil Procedure, Constitutional Law, Contracts, Criminal Law & Procedure, Evidence, Real Property, and Torts.",
  "AP": "Standardized AP curriculum modules focusing on core unit mastery, evidence-based reasoning, and exam-specific free response preparation."
};

const researchPrompt = ai.definePrompt({
  name: 'syllabusResearcher',
  tools: ['googleSearch'],
  prompt: `You are a Research Assistant. Find high-quality, free study resources (like Khan Academy, YouTube, or reputable educational websites) for the following syllabus topics: {{{syllabus}}}. Also provide a brief, one-sentence description for each topic.`,
});

const architectPrompt = ai.definePrompt({
  name: 'studyPlanArchitect',
  output: {
    schema: z.array(StudyPathModuleSchema),
  },
  prompt: `You are a Study Plan Architect. Take the following raw text, which contains syllabus topics and suggested resources, and format it into a structured JSON array. Each object in the array must have a 'topic', a 'description', and a valid 'link'.

RAW TEXT:
{{{rawText}}}
`,
});

export async function analyzeSyllabusAndMatchResources(input: any) {
  const exam = (input.examType || 'SAT').toUpperCase();
  const lookupKey = exam.includes('AP') ? 'AP' : exam;
  const syllabusContext = MASTER_SYLLABUS[lookupKey] || "General Exam Prep";

  // Step 1: The "Researcher" AI finds resources and returns raw text.
  const researchResponse = await researchPrompt({ syllabus: syllabusContext });
  const rawText = researchResponse.text;

  console.log("=============== RESEARCHER OUTPUT (RAW TEXT) ===============");
  console.log(rawText);
  console.log("==========================================================");
  
  if (!rawText || rawText.length < 20) {
    console.warn("Researcher returned little or no data. Aborting.");
    return [];
  }

  // Step 2: The "Architect" AI takes the raw text and formats it into JSON.
  const architectResponse = await architectPrompt({ rawText });
  
  // This can still fail if the model output is not perfect JSON, but it's less likely.
  return architectResponse.output || [];
}
