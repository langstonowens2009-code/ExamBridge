'use server';

import { generateStudyPlan } from '@/ai/flows/generate-study-plan-flow';
import { format } from 'date-fns';
// REMOVED: addDoc, collection, etc. (Not needed for Admin SDK)
import { db } from '@/lib/firebaseAdmin'; 

type TopicInput = {
  topic: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
};

type ActionInput = {
  userId: string;
  examType: string;
  testDate: Date;
  minutesPerDay: number;
  availableStudyDays: string[];
  topics: TopicInput[];
};

type ActionResult = {
  success: boolean;
  data?: any;
  error?: string;
  planId?: string;
};

/**
 * Generates and saves a study plan to Firestore.
 */
export async function generateAndSaveStudyPlanAction(input: ActionInput): Promise<ActionResult> {
  const { userId, ...planRequest } = input;

  if (!userId) {
    return { success: false, error: 'User not authenticated.' };
  }

  try {
    // 1. Call the AI flow to generate the study plan
    const aiResponse = await generateStudyPlan({
      ...planRequest,
      testDate: format(planRequest.testDate, 'yyyy-MM-dd'),
    });

    if (!aiResponse || !aiResponse.studyPlan) {
      throw new Error('AI failed to generate a study plan.');
    }

    // 2. Structure the data for Firestore
    const newPlan = {
      userId: userId,
      request: planRequest,
      response: aiResponse.studyPlan,
      createdAt: new Date(),
    };

    // 3. Save to Firestore (FIXED SYNTAX FOR ADMIN SDK)
    const planRef = await db.collection('users').doc(userId).collection('studyPlans').add(newPlan);

    return { success: true, planId: planRef.id, data: aiResponse.studyPlan };
  } catch (error: any) {
    console.error('Error in generateAndSaveStudyPlanAction:', error);
    return { success: false, error: error.message || 'Failed to generate study plan.' };
  }
}

/**
 * Retrieves the list of study plans (FIXED SYNTAX FOR ADMIN SDK)
 */
export async function getStudyPlansAction(userId: string): Promise<ActionResult> {
  if (!userId) {
    return { success: false, error: 'User not authenticated.' };
  }

  try {
    const querySnapshot = await db.collection('users').doc(userId).collection('studyPlans')
      .where('userId', '==', userId)
      .get();
      
    const plans = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    return { success: true, data: plans };
  } catch (error: any) {
    console.error('Error fetching study plans:', error);
    return { success: false, error: 'Failed to retrieve study plans.' };
  }
}
