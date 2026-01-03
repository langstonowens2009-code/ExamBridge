import admin from "firebase-admin";

if (!admin.apps.length) {
  const privateKey = (process.env.FIREBASE_PRIVATE_KEY || process.env.PRIVATE_KEY)?.replace(/\\n/g, '\n');
  
  try {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL || process.env.CLIENT_EMAIL,
        privateKey: privateKey,
      }),
    });
    console.log("Firebase Admin restored successfully");
  } catch (error) {
    console.error("Firebase Admin restoration error:", error);
  }
}

export const db = admin.firestore();