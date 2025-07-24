import React from 'react';

// LoadingSpinner Component: Displays a centered, animated loading spinner.
const LoadingSpinner = () => {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="flex flex-col items-center">
        {/* Spinner animation */}
        <div
          className="w-16 h-16 border-4 border-t-4 border-blue-500 border-solid rounded-full animate-spin dark:border-t-blue-500"
          role="status"
          aria-label="Loading"
        >
          {/* SR-only text for accessibility */}
          <span className="sr-only text-black">Loading...</span>
        </div>
        {/* Optional loading text */}
        <p className="mt-4 text-lg font-medium text-gray-700">Loading data...</p>
      </div>
    </div>
  );
};

export default LoadingSpinner;

