'use client';

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // This will now show the actual error message in your browser console
    console.error('Frontend Error Boundary Caught:', error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center p-8 bg-red-50 border border-red-200 rounded-lg">
      <h2 className="text-xl font-bold text-red-800">Application Error</h2>
      <p className="mt-2 text-red-600">
        {error.message || "A client-side exception occurred."}
      </p>
      <button
        onClick={() => reset()}
        className="mt-6 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition"
      >
        Retry Generation
      </button>
    </div>
  );
}