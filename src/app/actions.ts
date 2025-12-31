'use server';

import { z } from 'zod';
import { analyzeSyllabusAndMatchResources } from '@/ai/flows/analyze-syllabus-and-match-resources';

const formSchema = z.discriminatedUnion('inputType', [
  z.object({
    inputType: z.literal('url'),
    originalUrl: z.string().url(),
    examType: z.string().min(1),
  }),
  z.object({
    inputType: z.literal('text'),
    syllabusText: z.string().min(20, 'Syllabus text must be at least 20 characters.'),
    examType: z.string().min(1),
  }),
]);

type ActionResult = {
  success: boolean;
  data?: any;
  error?: string;
}

export async function generateStudyPathAction(data: z.infer<typeof formSchema>): Promise<ActionResult> {
  const validation = formSchema.safeParse(data);
  if (!validation.success) {
    const errorMessage = validation.error.errors.map(e => e.message).join(', ');
    return { success: false, error: errorMessage };
  }
  
  try {
    const studyPath = await analyzeSyllabusAndMatchResources(validation.data);
    if (!studyPath || studyPath.length === 0) {
        return { success: false, error: "Could not find any modules or resources for the provided syllabus. Please try again." };
    }
    return { success: true, data: studyPath };
  } catch (error: any) {
    // Detailed logging as requested
    console.error("Error in generateStudyPathAction:", {
      status: error.status,
      reason: error.reason,
      message: error.message,
      stack: error.stack,
    });

    // This is a user-facing error. Be careful not to leak implementation details.
    return { success: false, error: "An unexpected error occurred while analyzing the syllabus. The AI may be unavailable." };
  }
}
