import * as admin from 'firebase-admin';

// Check if the app is already initialized to prevent errors
if (!admin.apps.length) {
  admin.initializeApp({
    // By leaving the 'credential' field blank, it automatically uses the 
    // permissions of the App Hosting environment.
    // Explicitly setting the projectId ensures a stable connection.
    projectId: 'exambridge-34136', 
  });
}

export const db = admin.firestore();
export const auth = admin.auth();
