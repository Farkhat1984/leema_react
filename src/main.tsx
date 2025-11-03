/**
 * Application Entry Point
 * Sets up React Query and renders the app
 */

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import './index.css';
import App from './App.tsx';
import { logger } from './shared/lib/utils/logger';

// Create a React Query client with optimized caching
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Cache configuration
      staleTime: 5 * 60 * 1000, // 5 minutes - data is fresh for 5 mins
      gcTime: 10 * 60 * 1000, // 10 minutes - cache cleanup after 10 mins (formerly cacheTime)

      // Retry configuration
      retry: (failureCount, error: unknown) => {
        // Don't retry on 4xx errors (client errors)
        if (
          error &&
          typeof error === 'object' &&
          'response' in error &&
          typeof (error as { response: { status?: number } }).response === 'object' &&
          (error as { response: { status?: number } }).response !== null
        ) {
          const status = (error as { response: { status?: number } }).response.status;
          if (status && status >= 400 && status < 500) {
            return false;
          }
        }
        // Retry up to 2 times for network/server errors
        return failureCount < 2;
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),

      // Refetch configuration
      refetchOnWindowFocus: false,
      refetchOnMount: true,
      refetchOnReconnect: true,

      // Performance optimizations
      structuralSharing: true, // Enable structural sharing to minimize re-renders
    },
    mutations: {
      retry: 1,
      retryDelay: 1000,
      // Global mutation error handler
      onError: (error: unknown) => {
        logger.error('Mutation error', error);
      },
    },
  },
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </StrictMode>
);
