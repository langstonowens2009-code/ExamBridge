'use server';

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { WeeklyStudyPathModuleSchema } from '@/ai/schemas/study-path';

// Local knowledge base for core syllabi
const EXAM_DATA: Record<string, string> = {
  "SAT": "Evidence-Based Reading, Writing and Language, Math (No Calculator), Math (Calculator), Essay (Optional)",
  "ACT": "English, Mathematics, Reading, Science, Writing (Optional)",
  "AP": "Core curriculum mastery for specific AP subject (e.g., Calculus, US History, Biology) and free-response question strategies.",
  "AP CALCULUS AB": "Limits and Continuity, Differentiation, Integration, Differential Equations",
  "AP CALCULUS BC": "All AB topics plus Parametric Equations, Polar Coordinates, Vector-Valued Functions, and Series",
  "AP STATISTICS": "Exploring Data, Sampling and Experimentation, Probability, Statistical Inference",
  "AP PHYSICS 1": "Kinematics, Dynamics, Circular Motion and Gravitation, Energy, Momentum, Simple Harmonic Motion, Torque and Rotational Motion",
  "AP CHEMISTRY": "Atomic Structure, Intermolecular Forces, Chemical Reactions, Kinetics, Thermodynamics, Equilibrium",
  "AP BIOLOGY": "Evolution, Cellular Processes, Genetics, Information Transfer, Ecology",
  "AP US HISTORY": "American and National Identity; Politics and Power; Work, Exchange, and Technology; Culture and Society; Migration and Settlement; Geography and the Environment; America in the World",
  "AP WORLD HISTORY": "The Global Tapestry, Networks of Exchange, Land-Based Empires, Transoceanic Interconnections, Revolutions, Consequences of Industrialization, Global Conflict, Cold War and Decolonization, Globalization",
  "AP ENGLISH LANGUAGE AND COMPOSITION": "Rhetorical Analysis, Argumentation, Synthesis",
  "AP ENGLISH LITERATURE AND COMPOSITION": "Literary Analysis of prose and poetry",
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
  testDate: z.date().optional(),
});

const studyPathOutputSchema = z.array(WeeklyStudyPathModuleSchema);

const fallbackResult = [{
    week: 'Week 1',
    modules: [{
        topic: 'Search Timed Out',
        description: 'The AI search took too long to complete. This can happen during peak hours. Please try generating the plan again.',
        link: '#'
    }]
}];

/**
 * Analyzes a syllabus (either from a knowledge base or custom text) and finds free learning resources.
 * This function uses a two-step AI process:
 * 1. Researcher: Finds what paid study companies offer, then finds free equivalents.
 * 2. Architect: Formats the raw findings into a structured JSON output.
 */
export async function analyzeSyllabusAndMatchResources(
  input: z.infer<typeof syllabusAnalysisInputSchema>
): Promise<z.infer<typeof studyPathOutputSchema>> {
  try {
    const examKey = input.examType.toUpperCase();
    const syllabusContext = EXAM_DATA[examKey] || input.syllabusText || `Core topics for the ${input.examType} exam`;

    let timelinePrompt = '';
    if (input.testDate) {
      const today = new Date();
      const timeDiff = input.testDate.getTime() - today.getTime();
      const daysLeft = Math.ceil(timeDiff / (1000 * 3600 * 24));
      timelinePrompt = `The user's test is on ${input.testDate.toLocaleDateString()}. They have ${daysLeft} days to prepare. Create a study plan organized by week (e.g., 'Week 1', 'Week 2'). Prioritize the most important topics first.`;
    } else {
      timelinePrompt = `Create a study plan organized by week (e.g., 'Week 1', 'Week 2').`;
    }

    // Step 1: The "Researcher" - Perform competitive analysis and find free alternatives.
    const researcherResult = await ai.generate({
      model: 'gemini-pro',
      prompt: `
        You are an expert academic tutor performing competitive analysis.
        Your goal is to build a free study plan that competes with paid platforms like UWorld, Acely, and Princeton Review for the ${input.examType}.

        First, mentally review what paid test prep sites offer for the topics in the syllabus below.
        Then, find the best free learning resources (like specific YouTube videos from major educational channels, Khan Academy, or official documentation) that teach those same concepts for 2025 exam prep.
        
        ${timelinePrompt}

        Syllabus Context:
        ${syllabusContext}

        Provide a list of topics and the links to the free resources you found, organized by week.
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
        You are a meticulous study plan architect. Take the following raw research notes and format them into a clean JSON array of weekly study modules. 
        Each object in the array must have a 'week' property (e.g., "Week 1") and a 'modules' property, which is an array of study objects.
        Each study object must have three properties: 'topic', 'description', and 'link'.
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
