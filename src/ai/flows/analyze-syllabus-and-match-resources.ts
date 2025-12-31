'use server';

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import {StudyPathModuleSchema} from '@/ai/schemas/study-path';

// Fallback database if the primary web search fails.
const EXAM_SYLLABUS_FALLBACKS: Record<string, string[]> = {
  SAT: [
    'Reading: Information and Ideas',
    'Reading: Craft and Structure',
    'Writing: Standard English Conventions',
    'Writing: Expression of Ideas',
    'Math: Algebra',
    'Math: Advanced Math',
    'Math: Problem-Solving and Data Analysis',
    'Math: Geometry and Trigonometry',
  ],
  ACT: [
    'English: Production of Writing',
    'English: Knowledge of Language',
    'English: Conventions of Standard English',
    'Math: Number & Quantity',
    'Math: Algebra & Functions',
    'Math: Geometry & Statistics',
    'Reading: Key Ideas & Details',
    'Reading: Craft & Structure',
    'Science: Interpretation of Data',
    'Science: Scientific Investigation',
  ],
  GRE: [
    'Analytical Writing: Analyze an Issue',
    'Analytical Writing: Analyze an Argument',
    'Verbal Reasoning: Reading Comprehension',
    'Verbal Reasoning: Text Completion',
    'Verbal Reasoning: Sentence Equivalence',
    'Quantitative Reasoning: Arithmetic',
    'Quantitative Reasoning: Algebra',
    'Quantitative Reasoning: Geometry',
    'Quantitative Reasoning: Data Analysis',
  ],
};

const researchSyllabusTopics = ai.definePrompt({
  name: 'researchSyllabusTopics',
  input: {schema: z.object({examType: z.string(), query: z.string()})},
  output: {format: 'text'},
  prompt: `You are a curriculum research assistant. Your task is to find the syllabus or table of contents for the provided query and exam type.

Exam Type: {{{examType}}}
Query: {{{query}}}

Search for the main topics and return them as a simple, comma-separated list. Focus only on the high-level topic names.`,
  config: {
    model: 'gemini-2.0-flash',
    tools: [{googleSearch: {}}],
  },
});

const formatSyllabusIntoStudyPath = ai.definePrompt({
  name: 'formatSyllabusIntoStudyPath',
  input: {
    schema: z.object({examType: z.string(), syllabusText: z.string()}),
  },
  output: {schema: z.array(StudyPathModuleSchema)},
  prompt: `You are an expert curriculum designer. Your task is to take a list of syllabus topics for a specific exam and find the best free online resource (e.g., Khan Academy, YouTube video, or a high-quality article) for each topic.

Your response MUST be a valid JSON array of objects, where each object has "topic", "description", and "link".
Do not include any introductory text, markdown code blocks, or any text other than the raw JSON object.

Example Input Syllabus Text: "Algebra, Geometry, Reading Comprehension"
Example Output:
[
  {
    "topic": "Algebra",
    "description": "This Khan Academy unit covers all foundational algebra concepts needed for the exam.",
    "link": "https://www.khanacademy.org/math/algebra"
  },
  {
    "topic": "Geometry",
    "description": "A comprehensive YouTube playlist that explains geometric proofs and theorems.",
    "link": "https://www.youtube.com/playlist?list=PL...someId"
  }
]

Syllabus Topics:
{{{syllabusText}}}

Exam Type: {{{examType}}}
`,
  config: {
    model: 'gemini-2.0-flash',
  },
});

const analyzeSyllabusAndMatchResourcesFlow = ai.defineFlow(
  {
    name: 'analyzeSyllabusAndMatchResources',
    inputSchema: z.any(),
    outputSchema: z.array(StudyPathModuleSchema),
  },
  async (input: {
    inputType: 'url' | 'text';
    examType: string;
    originalUrl?: string;
    syllabusText?: string;
  }) => {
    let syllabusText = '';
    const examKey = input.examType.toUpperCase();

    // STEP 1: RESEARCHER - Get raw syllabus text
    if (input.inputType === 'url' && input.originalUrl) {
      try {
        const researchResponse = await researchSyllabusTopics({
          examType: input.examType,
          query: `Find syllabus topics for ${input.examType} at this URL: ${input.originalUrl}`,
        });
        syllabusText = researchResponse.text;
      } catch (error) {
        console.error('Syllabus research step failed:', error);
        // Fallback to internal database on failure
        syllabusText = (EXAM_SYLLABUS_FALLBACKS[examKey] || []).join(', ');
      }
    } else if (input.inputType === 'text' && input.syllabusText) {
      syllabusText = input.syllabusText;
    }

    // If still no text, use fallback as a last resort
    if (!syllabusText || syllabusText.trim() === '') {
      console.log(
        `Search returned empty. Using fallback for ${examKey}.`
      );
      syllabusText = (EXAM_SYLLABUS_FALLBACKS[examKey] || []).join(', ');
    }
    
    // If there's truly nothing to process, return empty.
    if (!syllabusText || syllabusText.trim() === '') {
        console.error("Could not find or generate syllabus text.");
        return [];
    }

    console.log('Raw Syllabus Text from Researcher:', syllabusText);

    // STEP 2: ARCHITECT - Format text into structured JSON
    try {
      const formatResponse = await formatSyllabusIntoStudyPath({
        examType: input.examType,
        syllabusText,
      });

      const studyPath = formatResponse.output;

      if (!studyPath || studyPath.length === 0) {
        console.log('Architect could not format the text. Returning empty array.');
        return [];
      }

      return studyPath;
    } catch (error) {
      console.error('Syllabus formatting step failed:', error);
      // This is a critical failure of the AI, return empty
      return [];
    }
  }
);

export async function analyzeSyllabusAndMatchResources(input: any) {
  return await analyzeSyllabusAndMatchResourcesFlow(input);
}
