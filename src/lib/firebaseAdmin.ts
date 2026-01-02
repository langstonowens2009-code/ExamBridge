import { initializeApp, getApps, getApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

/**
 * Initializes the Firebase Admin SDK safely for Next.js.
 * This pattern prevents "App already exists" errors during development.
 */
function createFirebaseAdminApp() {
  if (getApps().length > 0) {
    return getApp(); // Reuse existing app
  }

  // On Firebase App Hosting, this picks up "Application Default Credentials"
  // automatically without needing a JSON key file.
  return initializeApp(); 
}

const adminApp = createFirebaseAdminApp();
export const db = getFirestore(adminApp);
