import { z } from 'genkit';

// Define the exact dashboard shape
export const StudyPathModuleSchema = z.object({
  topic: z.string(),
  description: z.string(),
  link: z.string(),
});

export type StudyPathModule = z.infer<typeof StudyPathModuleSchema>;
