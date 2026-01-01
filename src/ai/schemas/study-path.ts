import { z } from 'genkit';

// Schema for a single module in the study plan
export const StudyPathModuleSchema = z.object({
  topic: z
    .string()
    .describe('The specific topic for this study module (e.g., "Linear Equations").'),
  description: z
    .string()
    .describe(
      "A brief, one-sentence rationale explaining why this module is important for the exam."
    ),
  link: z
    .string()
    .url()
    .describe(
      "A URL to a high-quality, free educational resource for the topic (e.g., Khan Academy, a specific YouTube video)."
    ),
});

// Schema for a week's worth of study modules
export const WeeklyStudyPathModuleSchema = z.object({
  week: z.string().describe('The week of the study plan (e.g., "Week 1").'),
  modules: z.array(StudyPathModuleSchema),
});

// Input schema for the AI flow
const TopicInputSchema = z.object({
  topic: z.string(),
  difficulty: z.enum(['Easy', 'Medium', 'Hard']),
});

export const GenerateStudyPlanInputSchema = z.object({
  examType: z.string().describe('The type of exam (e.g., "SAT", "ACT").'),
  testDate: z
    .string()
    .describe('The date of the test in "YYYY-MM-DD" format.'),
  minutesPerDay: z.number().describe('How many minutes the user can study per day.'),
  availableStudyDays: z
    .array(z.string())
    .describe('An array of days of the week the user can study.'),
  topics: z
    .array(TopicInputSchema)
    .describe('An array of topics the user wants to study.'),
});
export type GenerateStudyPlanInput = z.infer<
  typeof GenerateStudyPlanInputSchema
>;

// Output schema for the AI flow - this is the shape of the dashboard
export const GenerateStudyPlanOutputSchema = z.object({
  studyPlan: z
    .array(WeeklyStudyPathModuleSchema)
    .describe(
      'The structured, week-by-week study plan with modules for each topic.'
    ),
});
export type GenerateStudyPlanOutput = z.infer<
  typeof GenerateStudyPlanOutputSchema
>;


// Helper types for easier use in components
export type StudyPathModule = z.infer<typeof StudyPathModuleSchema>;
export type WeeklyStudyPath = z.infer<typeof WeeklyStudyPathModuleSchema>;

// Schemas for resource matching (can be expanded later)
export const ExplainResourceMatchingRationaleInputSchema = z.object({
  topic: z.string().describe('The topic from the paid resource.'),
  resourceLink: z.string().describe('The link to the free resource.'),
});
export type ExplainResourceMatchingRationaleInput = z.infer<
  typeof ExplainResourceMatchingRationaleInputSchema
>;

export const ExplainResourceMatchingRationaleOutputSchema = z.object({
  rationale: z
    .string()
    .describe(
      'A one-sentence explanation of why the free resource is a good substitute for the topic in the paid resource.'
    ),
});
export type ExplainResourceMatchingRationaleOutput = z.infer<
  typeof ExplainResourceMatchingRationaleOutputSchema
>;
