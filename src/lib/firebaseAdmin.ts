
import * as admin from 'firebase-admin';

// Initialize the app if it's not already initialized
if (!admin.apps.length) {
  // Using initializeApp() with no arguments relies on Application Default Credentials
  // and the GOOGLE_CLOUD_PROJECT environment variable.
  admin.initializeApp();
  console.log('Firebase Admin SDK initialized with Application Default Credentials.');
}

export const db = admin.firestore();
export const adminAuth = admin.auth();
