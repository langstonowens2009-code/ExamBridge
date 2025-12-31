'use server';

import { z } from 'zod';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { analyzeSyllabusAndMatchResources } from '@/ai/flows/analyze-syllabus-and-match-resources';
import { adminApp } from '@/firebase/admin';

const formSchema = z.discriminatedUnion('inputType', [
  z.object({
    inputType: z.literal('url'),
    originalUrl: z.string().url(),
    examType: z.string().min(1),
    testDate: z.date().optional(),
  }),
  z.object({
    inputType: z.literal('text'),
    syllabusText: z.string().min(20, 'Syllabus text must be at least 20 characters.'),
    examType: z.string().min(1),
    testDate: z.date().optional(),
  }),
]);

type ActionResult = {
  success: boolean;
  data?: any;
  error?: string;
}

async function getUserIdFromToken(idToken: string | undefined) {
  if (!idToken) return null;
  try {
    const decodedToken = await getAuth(adminApp).verifyIdToken(idToken);
    return decodedToken.uid;
  } catch (error) {
    console.error('Error verifying ID token:', error);
    return null;
  }
}

export async function generateStudyPathAction(data: z.infer<typeof formSchema>, idToken?: string): Promise<ActionResult> {
  const validation = formSchema.safeParse(data);
  if (!validation.success) {
    const errorMessage = validation.error.errors.map(e => e.message).join(', ');
    return { success: false, error: errorMessage };
  }
  
  try {
    const studyPath = await analyzeSyllabusAndMatchResources(validation.data);
    if (!studyPath || studyPath.length === 0) {
        if (validation.data.inputType === 'url') {
            return { success: false, error: "I couldn't reach that site's syllabus. Please try pasting the syllabus text manually so I can build your plan." };
        }
        return { success: false, error: "Could not find any modules or resources for the provided syllabus. Please try again." };
    }

    const userId = await getUserIdFromToken(idToken);
    if (userId) {
      const db = getFirestore(adminApp);
      await db.collection('users').doc(userId).collection('studyPlans').add({
        examType: validation.data.examType,
        createdAt: new Date(),
        modules: studyPath,
      });
    }

    return { success: true, data: studyPath };
  } catch (error: any) {
    console.error("Error in generateStudyPathAction:", error);
    return { success: false, error: "An unexpected error occurred while analyzing the syllabus. The AI may be unavailable." };
  }
}

export async function getStudyPlansAction(idToken: string): Promise<ActionResult> {
  const userId = await getUserIdFromToken(idToken);
  if (!userId) {
    return { success: false, error: 'Authentication failed.' };
  }

  try {
    const db = getFirestore(adminApp);
    const plansSnapshot = await db.collection('users').doc(userId).collection('studyPlans').orderBy('createdAt', 'desc').get();
    const plans = plansSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return { success: true, data: plans };
  } catch (error) {
    console.error("Error fetching study plans:", error);
    return { success: false, error: 'Failed to fetch study plans.' };
  }
}
