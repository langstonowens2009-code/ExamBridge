'use server';

import { db } from '@/lib/firebaseAdmin';

// This action is now only used for fetching study plans.
// The generation logic has been moved to 'src/app/actions/generate-plan.ts'

type ActionResult = {
  success: boolean;
  data?: any;
  error?: string;
}


// This action retrieves the list of study plans for the user's dashboard.
// It is intended to be called from a client component that has access to the user's auth state.
export async function getStudyPlansAction(userId: string): Promise<ActionResult> {
  if (!userId) {
    return { success: false, error: 'Authentication failed.' };
  }

  try {
    // We query the 'tests' subcollection which now holds the study plans.
    const testsSnapshot = await db.collection('users').doc(userId).collection('tests').get();
    
    const plans = testsSnapshot.docs.map(doc => {
      const data = doc.data();
      return { 
        id: doc.id, 
        ...data,
        // The new structure doesn't have a top-level 'createdAt' field in the 'test' document.
        // We'll use the testName and other data available.
        // If a creation date is needed, it should be added when the 'test' document is created.
        examType: data.testName || 'Untitled Plan', // Fallback for examType
      };
    });

    return { success: true, data: plans };
  } catch (error: any) {
    console.error("Error fetching study plans:", error.stack || error);
    // Provide a more specific error if it's a permission issue
    if (error.code === 'permission-denied') {
        return { success: false, error: 'You do not have permission to access these study plans.' };
    }
    return { success: false, error: 'Failed to fetch study plans due to a server error.' };
  }
}
