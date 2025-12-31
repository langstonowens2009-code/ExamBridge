import { z } from 'genkit';

// Define the exact dashboard shape
export const StudyPathModuleSchema = z.object({
  topic: z.string(),
  description: z.string(),
  link: z.string(),
});

export type StudyPathModule = z.infer<typeof StudyPathModuleSchema>;

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
