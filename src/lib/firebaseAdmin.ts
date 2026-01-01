
import * as admin from 'firebase-admin';

// Initialize the app if it's not already initialized
if (!admin.apps.length) {
  admin.initializeApp({
    projectId: 'exambridge-34136',
  });
  console.log('Firebase Admin SDK initialized with Application Default Credentials.');
  console.log('Project ID used:', admin.app().options.projectId);
}

export const db = admin.firestore();
export const adminAuth = admin.auth();
