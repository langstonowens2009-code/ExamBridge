'use server';

import { generateStudyPlan } from '@/ai/flows/generate-study-plan-flow';
import { format } from 'date-fns';
import { addDoc, collection } from 'firebase/firestore';
import { firestore } from '@/firebase/config'; // Assuming you have a Firestore instance exported

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
      response: aiResponse.studyPlan, // The structured JSON from the AI
      createdAt: new Date(),
    };

    // 3. Save the new study plan to Firestore
    const planRef = await addDoc(collection(firestore, 'users', userId, 'studyPlans'), newPlan);

    return { success: true, planId: planRef.id, data: aiResponse.studyPlan };
  } catch (error: any) {
    console.error('Error in generateAndSaveStudyPlanAction:', error);
    return { success: false, error: error.message || 'Failed to generate study plan.' };
  }
}

/**
 * Retrieves the list of study plans for the user's dashboard.
 */
export async function getStudyPlansAction(userId: string): Promise<ActionResult> {
  // This function will be implemented later to fetch data for the dashboard.
  // For now, it's a placeholder.
  return { success: true, data: [] };
}
