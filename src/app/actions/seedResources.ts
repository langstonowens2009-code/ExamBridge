
'use server';

import { getFirestore, collection, doc, setDoc, writeBatch } from 'firebase/firestore';
import { app } from '@/firebase/config';
import resourcesData from '@/lib/resourcesData.json';

type ActionResult = {
  success: boolean;
  error?: string;
  count?: number;
}

export async function seedResourcesAction(): Promise<ActionResult> {
  try {
    const db = getFirestore(app);
    const resources = resourcesData.resources;

    if (!resources || resources.length === 0) {
      return { success: false, error: 'No resources found in resourcesData.json' };
    }
    
    // Use a batch write for efficiency
    const batch = writeBatch(db);
    
    resources.forEach(resource => {
      // Use the 'id' from the JSON file as the document ID to prevent duplicates
      const resourceRef = doc(db, 'resources', resource.id);
      batch.set(resourceRef, resource);
    });
    
    await batch.commit();

    return { success: true, count: resources.length };
  } catch (error: any) {
    console.error("Error seeding resources:", error);
    return { success: false, error: error.message || 'Failed to seed resources.' };
  }
}
