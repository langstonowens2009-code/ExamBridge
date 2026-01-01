import { NextResponse } from 'next/server';
import { seedResourcesAction } from '@/app/actions/seedResources';

export const maxDuration = 60; // Allow up to 60 seconds for the seeding to complete

/**
 * API route to manually trigger the database seeding process.
 * Visiting /api/force-seed will execute the seedResourcesAction.
 */
export async function GET() {
  try {
    console.log('Force-seed API route triggered.');
    const result = await seedResourcesAction();

    if (result.success) {
      return NextResponse.json({
        message: 'Success! The database has been seeded.',
        count: result.count,
      });
    } else {
      console.error('Seeding failed:', result.error);
      return NextResponse.json(
        { message: 'Seeding failed.', error: result.error },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('An unexpected error occurred in the force-seed route:', error);
    return NextResponse.json(
      { message: 'An unexpected server error occurred.', error: error.message },
      { status: 500 }
    );
  }
}
