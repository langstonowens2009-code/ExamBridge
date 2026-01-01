
'use server';

import { db } from '@/lib/firebaseAdmin';
import resourcesData from '@/lib/resourcesData.json';

type ActionResult = {
  success: boolean;
  error?: string;
  count?: number;
}

export async function seedResourcesAction(): Promise<ActionResult> {
  try {
    console.log('Seeding started...');
    const resources = resourcesData.resources;

    if (!resources || resources.length === 0) {
      return { success: false, error: 'No resources found in resourcesData.json' };
    }
    
    // Use a batch write for efficiency with the Admin SDK
    const batch = db.batch();
    
    resources.forEach(resource => {
      // Use the 'id' from the JSON file as the document ID to prevent duplicates
      const resourceRef = db.collection('resources').doc(resource.id);
      batch.set(resourceRef, resource);
    });
    
    await batch.commit();

    console.log(`Successfully seeded ${resources.length} resources.`);
    return { success: true, count: resources.length };
  } catch (error: any) {
    console.error("Error seeding resources:", error);
    return { success: false, error: error.message || 'Failed to seed resources.' };
  }
}

