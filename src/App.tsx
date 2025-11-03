/**
 * App Component
 * Root component with router integration
 */

import { useEffect } from 'react';
import { RouterProvider } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { router } from './app/router';
import { AuthInitializer } from './features/auth/components/AuthInitializer';
import { useWebSocketStore } from './features/websocket';
import { useAuthStore } from './features/auth/store/authStore';

function App() {
  const { accessToken, user, shop } = useAuthStore();
  const connect = useWebSocketStore((state) => state.connect);
  const disconnect = useWebSocketStore((state) => state.disconnect);

  // Initialize WebSocket connection when user is authenticated
  useEffect(() => {
    if (accessToken && user) {
      // Determine client type based on account type
      const clientType = shop ? 'shop' : user.accountType || 'user';
      connect(accessToken, clientType as 'user' | 'shop' | 'admin');
    }

    return () => {
      disconnect();
    };
    // Only re-run when accessToken or user changes, connect/disconnect are stable
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken, user, shop]);

  return (
    <AuthInitializer>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
          },
          success: {
            duration: 3000,
            iconTheme: {
              primary: '#10b981',
              secondary: '#fff',
            },
          },
          error: {
            duration: 5000,
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fff',
            },
          },
        }}
      />
      <RouterProvider router={router} />
    </AuthInitializer>
  );
}

export default App;
