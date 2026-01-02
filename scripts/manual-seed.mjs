/**
 * This script is for one-time, manual seeding of the 'resources' collection in Firestore.
 * It is intended to be run from your local machine's terminal, not as part of the app's deployment.
 *
 * How to run:
 * 1. Make sure you are logged into the gcloud CLI.
 * 2. Authenticate for Application Default Credentials by running:
 *    `gcloud auth application-default login`
 * 3. Set your project ID with gcloud:
 *    `gcloud config set project studio-2413639035-7ed5f`
 * 4. Run the script from the root of your project:
 *    `node scripts/manual-seed.mjs`
 *    OR, more simply, use the package.json script:
 *    `npm run seed:db`
 */
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readFile } from 'fs/promises';

// --- Configuration ---
const PROJECT_ID = 'studio-2413639035-7ed5f';
const RESOURCES_FILE_PATH = 'src/lib/resourcesData.json';
const TARGET_COLLECTION = 'resources';
// --- End Configuration ---


// Initialize Firebase Admin SDK.
// When running locally with ADC, you don't need to pass any credentials.
// The SDK will automatically find them.
try {
  initializeApp({
    projectId: PROJECT_ID,
  });
  console.log('Firebase Admin SDK initialized successfully.');
} catch (error) {
  console.error('Error initializing Firebase Admin SDK:', error);
  process.exit(1);
}

const db = getFirestore();

async function seedDatabase() {
  try {
    console.log(`Reading resources from ${RESOURCES_FILE_PATH}...`);
    const fileContent = await readFile(new URL(`../${RESOURCES_FILE_PATH}`, import.meta.url), 'utf-8');
    const { resources } = JSON.parse(fileContent);

    if (!resources || resources.length === 0) {
      console.error('No resources found in the JSON file. Aborting.');
      return;
    }

    console.log(`Found ${resources.length} resources to seed.`);

    // Create a new batch
    const batch = db.batch();

    const resourcesCollection = db.collection(TARGET_COLLECTION);
    
    resources.forEach((resource) => {
      // Use the 'id' from the JSON as the document ID to prevent duplicates on re-runs.
      const docRef = resourcesCollection.doc(resource.id);
      batch.set(docRef, resource);
    });

    console.log('Committing batch to Firestore...');
    await batch.commit();

    console.log('----------------------------------------------------');
    console.log('✅ Success! Database has been seeded.');
    console.log(`✅ ${resources.length} documents written to the '${TARGET_COLLECTION}' collection.`);
    console.log('----------------------------------------------------');

  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
}

seedDatabase();
