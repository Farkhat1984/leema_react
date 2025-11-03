/**
 * Page Loader Component
 * Full-screen loading spinner for page transitions
 */

import { Spinner } from './Spinner';

export const PageLoader = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <Spinner size="lg" className="mb-4" />
        <p className="text-gray-600">Loading...</p>
      </div>
    </div>
  );
};
