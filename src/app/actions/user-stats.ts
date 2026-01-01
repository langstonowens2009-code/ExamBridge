'use server';

import { db } from '@/lib/firebaseAdmin';

type ActionResult = {
  success: boolean;
  error?: string;
  message?: string;
}

/**
 * Seeds a sample userStats document in Firestore for testing purposes.
 * @param userId The ID of the user to seed stats for.
 */
export async function seedUserStats(userId: string): Promise<ActionResult> {
  if (!userId) {
    return { success: false, error: 'User ID is required.' };
  }

  try {
    console.log(`Seeding user stats for user: ${userId}`);
    const userStatsRef = db.collection('userStats').doc(userId);

    const statsData = {
      weakTopics: ['Right triangles and trigonometry', 'Nonlinear equations'],
      masteryLevel: 'Beginner',
      testDate: new Date(new Date().setDate(new Date().getDate() + 30)), // 30 days from now
    };

    await userStatsRef.set(statsData);

    console.log('Successfully seeded user stats.');
    return { success: true, message: `Sample stats for user ${userId} have been created.` };
  } catch (error: any) {
    console.error("Error seeding user stats:", error);
    return { success: false, error: error.message || 'Failed to seed user stats.' };
  }
}
