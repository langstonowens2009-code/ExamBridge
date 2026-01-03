import { getFirestore } from "@/lib/firebaseAdmin";

export async function getUserPerformance(userId: string) {
  const db = getFirestore();
  
  // If db is null (common during build steps), return a safe error object
  if (!db) {
    return { success: false, error: "Database not initialized" };
  }

  try {
    const snapshot = await db
      .collection("users")
      .doc(userId)
      .collection("performance")
      .orderBy("timestamp", "desc")
      .limit(1)
      .get();

    if (snapshot.empty) {
      return { success: false, data: null };
    }

    return { 
      success: true, 
      data: snapshot.docs[0].data() 
    };
  } catch (error) {
    console.error("Error fetching performance:", error);
    return { success: false, error: "Failed to fetch performance data" };
  }
}