
import { z } from 'zod';

// Schema for the AI flow that generates tasks for a specific topic
export const StudyTaskSchema = z.object({
  description: z
    .string()
    .describe('A concise, actionable study task for the student to complete.'),
});

export const DailyPlanSchema = z.object({
  date: z.string().describe('The date for this set of tasks in YYYY-MM-DD format.'),
  tasks: z.array(StudyTaskSchema).describe('A list of 1-3 specific tasks for this day.'),
});

export const GenerateStudyTasksOutputSchema = z.object({
  studyDays: z.array(DailyPlanSchema),
});
export type GenerateStudyTasksOutput = z.infer<typeof GenerateStudyTasksOutputSchema>;


// Schema for the input to the AI flow
const ExpertResourceSchema = z.object({
    url: z.string().url(),
    description: z.string(),
    type: z.string()
});

export const GenerateStudyTasksInputSchema = z.object({
  topic: z.string().describe('The specific topic to generate a study plan for.'),
  examType: z.string().describe('The overall exam type (e.g., "SAT Math").'),
  studyDates: z.array(z.string()).describe('The specific dates allocated to study this topic in "YYYY-MM-DD" format.'),
  expertResources: z.array(ExpertResourceSchema).optional().describe('A list of expert-vetted resources. Use these if provided.'),
});
export type GenerateStudyTasksInput = z.infer<typeof GenerateStudyTasksInputSchema>;
