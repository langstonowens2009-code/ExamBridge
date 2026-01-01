import * as admin from 'firebase-admin';

if (!admin.apps.length) {
  admin.initializeApp({
    // By leaving out the 'credential' line, it uses the 
    // built-in Studio permissions automatically.
    projectId: 'exambridge-34136', 
  });
}

export const db = admin.firestore();
