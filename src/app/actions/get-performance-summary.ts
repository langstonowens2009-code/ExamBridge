'use server';

// In a real app, you would fetch this data from Firestore
// based on the user's mock exam submissions.
const mockPerformanceData = {
  examType: 'SAT Math',
  difficulty: [
    { name: 'Easy', correct: 25, incorrect: 5 },
    { name: 'Medium', correct: 18, incorrect: 12 },
    { name: 'Hard', correct: 8, incorrect: 10 },
  ],
  domains: [
    { name: 'Algebra', accuracy: 85 },
    { name: 'Advanced Math', accuracy: 60 },
    { name: 'Problem-Solving and Data Analysis', accuracy: 72 },
    { name: 'Geometry and Trigonometry', accuracy: 55 },
  ],
  subdomains: {
    Algebra: [
        { name: 'Linear equations', accuracy: 90},
        { name: 'Systems of equations', accuracy: 80},
    ],
    'Advanced Math': [
        { name: 'Quadratic equations', accuracy: 65},
        { name: 'Polynomials', accuracy: 55},
    ]
  }
};

export interface PerformanceSummary {
    examType: string;
    difficulty: { name: 'Easy' | 'Medium' | 'Hard'; correct: number; incorrect: number; }[];
    domains: { name: string; accuracy: number; }[];
    subdomains: Record<string, { name: string; accuracy: number; }[]>;
}


type ActionResult = {
  success: boolean;
  data?: PerformanceSummary;
  error?: string;
};

export async function getPerformanceSummaryAction(userId: string): Promise<ActionResult> {
  if (!userId) {
    return { success: false, error: 'User not authenticated.' };
  }

  // TODO: Replace this with actual Firestore data fetching logic
  // For now, we return mock data to build the UI.
  // We can return null to test the empty state.
  const hasData = true; // Set to false to see the empty state UI

  if (hasData) {
    return { success: true, data: mockPerformanceData };
  } else {
    return { success: true, data: undefined };
  }
}
