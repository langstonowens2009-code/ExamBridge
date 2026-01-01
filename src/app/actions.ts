'use server';

import { z } from 'zod';
import { analyzeSyllabusAndMatchResources } from '@/ai/flows/analyze-syllabus-and-match-resources';
import { auth } from 'firebase-admin';

// NOTE: Removed firebase-admin imports as they are not suitable for client-invoked server actions.
// All Firestore operations that depend on user auth should be handled on the client
// or through secure server actions that properly verify the user's token.

const formSchema = z.discriminatedUnion('inputType', [
  z.object({
    inputType: z.literal('url'),
    originalUrl: z.string().url(),
    examType: z.string().min(1),
    testDate: z.date().optional(),
    customInstructions: z.string().optional(),
  }),
  z.object({
    inputType: z.literal('text'),
    syllabusText: z.string().min(20, 'Syllabus text must be at least 20 characters.'),
    examType: z.string().min(1),
    testDate: z.date().optional(),
    customInstructions: z.string().optional(),
  }),
]);

type ActionResult = {
  success: boolean;
  data?: any;
  error?: string;
}

// This action is called from the client to generate a study plan.
// It now also accepts a userId to pass to the adaptive learning flow.
export async function generateStudyPathAction(
  data: z.infer<typeof formSchema>,
  userId?: string
): Promise<ActionResult> {
  const validation = formSchema.safeParse(data);
  if (!validation.success) {
    const errorMessage = validation.error.errors.map(e => e.message).join(', ');
    return { success: false, error: errorMessage };
  }
  
  try {
    // Pass the validated data and the userId to the AI flow.
    const studyPath = await analyzeSyllabusAndMatchResources({
      ...validation.data,
      userId: userId,
    });
    
    if (!studyPath || studyPath.length === 0 || (studyPath[0]?.modules[0]?.topic === 'Search Timed Out')) {
        return { success: false, error: "The AI search timed out. This can happen during peak hours. Please try generating the plan again." };
    }
    if (studyPath[0]?.modules[0]?.topic === 'Error Generating Plan') {
        return { success: false, error: "An unexpected error occurred while creating your study plan. Please try again." };
    }

    // The action now only returns the generated data. Saving is handled by the client.
    return { success: true, data: studyPath };

  } catch (error: any) {
    console.error("Error in generateStudyPathAction:", error);
    return { success: false, error: "An unexpected error occurred while analyzing the syllabus. The AI may be unavailable." };
  }
}

// This action is no longer using firebase-admin and relies on the client to have auth.
// It is now intended to be called from a client component that has access to the user's auth state.
export async function getStudyPlansAction(userId: string): Promise<ActionResult> {
  if (!userId) {
    return { success: false, error: 'Authentication failed.' };
  }

  try {
    // Dynamic import of client-side firestore
    const { getFirestore, collection, getDocs, orderBy, query } = await import('firebase/firestore');
    const { app } = await import('@/firebase/config');
    const db = getFirestore(app);

    const plansCollectionRef = collection(db, 'users', userId, 'studyPlans');
    const q = query(plansCollectionRef, orderBy('createdAt', 'desc'));
    const plansSnapshot = await getDocs(q);
    
    const plans = plansSnapshot.docs.map(doc => ({ 
      id: doc.id, 
      ...doc.data(),
      // Convert Firestore Timestamp to a serializable format (ISO string)
      createdAt: doc.data().createdAt.toDate().toISOString(),
    }));

    return { success: true, data: plans };
  } catch (error) {
    console.error("Error fetching study plans:", error);
    return { success: false, error: 'Failed to fetch study plans.' };
  }
}
