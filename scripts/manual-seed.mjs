
import * as admin from 'firebase-admin';
import { readFile } from 'fs/promises';

// Use ADC by only providing the projectId. The environment handles auth.
try {
  admin.initializeApp({
    projectId: 'exambridge-34136'
  });
  console.log('Firebase Admin SDK initialized with project: exambridge-34136');
} catch (error) {
  if (error.code !== 'app/duplicate-app') {
    throw error;
  }
  console.log('Firebase Admin SDK already initialized.');
}


const db = admin.firestore();

// Helper function to introduce a delay
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function seedDatabase() {
  try {
    console.log('Reading resourcesData.json...');
    const resourcesPath = new URL('../src/lib/resourcesData.json', import.meta.url);
    const resourcesData = JSON.parse(await readFile(resourcesPath, 'utf8'));
    const resources = resourcesData.resources;

    if (!resources || resources.length === 0) {
      console.log('No resources found in the JSON file. Exiting.');
      return;
    }

    console.log(`Found ${resources.length} resources. Starting upload to Firestore...`);

    let count = 0;
    for (const resource of resources) {
      if (!resource.id) {
        console.warn('Skipping resource with no id:', resource);
        continue;
      }
      const resourceRef = db.collection('resources').doc(resource.id);
      await resourceRef.set(resource);
      count++;
      console.log(`- Uploaded: ${resource.id}`);
      await sleep(50); // Add a 50ms delay to avoid hitting rate limits
    }

    console.log(`\n✅ Successfully uploaded ${count} resources to Firestore!`);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
  }
}

seedDatabase();
