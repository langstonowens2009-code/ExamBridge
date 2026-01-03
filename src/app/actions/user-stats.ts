'use server';

import { db } from '@/lib/firebaseAdmin';

type ActionResult<T = any> = {
  success: boolean;
  error?: string;
  message?: string;
  data?: T;
};

/**
 * Fetches the user's performance summary for the dashboard.
 */
export async function getUserPerformance(userId: string): Promise<ActionResult> {
  if (!userId) return { success: false, error: 'User ID is required.' };

  try {
    const userStatsDoc = await db.collection('userStats').doc(userId).get();

    if (!userStatsDoc.exists) {
      return { success: true, data: null };
    }

    return { success: true, data: userStatsDoc.data() };
  } catch (error: any) {
    console.error("Error fetching performance:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Seeds sample userStats for testing the dashboard UI.
 */
export async function seedUserStats(userId: string): Promise<ActionResult> {
  if (!userId) return { success: false, error: 'User ID is required.' };

  try {
    const userStatsRef = db.collection('userStats').doc(userId);

    const statsData = {
      weakTopics: ['Right triangles and trigonometry', 'Nonlinear equations', 'Data Analysis'],
      masteryLevel: 'Intermediate',
      completedModules: 12,
      totalModules: 40,
      testDate: new Date(new Date().setDate(new Date().getDate() + 30)).toISOString(),
      lastUpdated: new Date().toISOString(),
    };

    await userStatsRef.set(statsData, { merge: true });

    return { success: true, message: `Sample stats for user ${userId} created.` };
  } catch (error: any) {
    console.error("Error seeding user stats:", error);
    return { success: false, error: error.message };
  }
}