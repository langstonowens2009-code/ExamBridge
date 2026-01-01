
import admin from 'firebase-admin';
import { readFile } from 'fs/promises';
import { fileURLToPath } from 'url';
import path, { dirname } from 'path';
import 'dotenv/config';

// --- Configuration ---
const PROJECT_ID = 'exambridge-34136';
const COLLECTION_NAME = 'resources';

// Construct path to the service account and data file
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PATH_TO_RESOURCES_DATA = path.join(__dirname, '../src/lib/resourcesData.json');

// --- Firebase Admin Initialization ---
// The service account details will be loaded from environment variables
// Ensure FIREBASE_CLIENT_EMAIL and FIREBASE_PRIVATE_KEY are set in your .env file
const serviceAccount = {
  projectId: PROJECT_ID,
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  privateKey: (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
};

if (!serviceAccount.clientEmail || !serviceAccount.privateKey) {
    console.error('🔴 Error: FIREBASE_CLIENT_EMAIL and FIREBASE_PRIVATE_KEY environment variables are not set.');
    console.error('Please add them to your .env file to run this script.');
    process.exit(1);
}

try {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: PROJECT_ID,
    });
    console.log('Firebase Admin SDK initialized for project:', PROJECT_ID);
} catch (error) {
    if (error.code === 'app/duplicate-app') {
        console.log('Firebase Admin SDK already initialized.');
    } else {
        console.error('🔴 Error initializing Firebase Admin SDK:', error);
        process.exit(1);
    }
}


const db = admin.firestore();

// --- Main Seeding Function ---
async function seedDatabase() {
    try {
        console.log(`Reading data from ${PATH_TO_RESOURCES_DATA}...`);
        const fileContent = await readFile(PATH_TO_RESOURCES_DATA, 'utf8');
        const data = JSON.parse(fileContent);
        const resources = data.resources;

        if (!resources || resources.length === 0) {
            console.log('🟡 No resources found in the JSON file. Exiting.');
            return;
        }

        console.log(`Found ${resources.length} resources. Preparing to upload to '${COLLECTION_NAME}' collection...`);

        const batch = db.batch();

        resources.forEach(resource => {
            if (!resource.id) {
                console.warn('⚠️ Skipping resource due to missing ID:', resource);
                return;
            }
            const docRef = db.collection(COLLECTION_NAME).doc(resource.id);
            batch.set(docRef, resource);
        });

        await batch.commit();

        console.log(`✅ Successfully uploaded ${resources.length} resources to Firestore!`);

    } catch (error) {
        console.error('🔴 An error occurred during the seeding process:');
        console.error(error);
        process.exit(1);
    }
}

// --- Execute Script ---
seedDatabase();
