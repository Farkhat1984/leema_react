/**
 * App Component
 * Root component with router integration
 */

import { useEffect, useCallback } from 'react';
import { RouterProvider } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { router } from './app/router';
import { AuthInitializer } from './features/auth/components/AuthInitializer';
import { useWebSocketStore } from './features/websocket';
import { useAuthStore } from './features/auth/store/authStore';
import { ROLES } from './constants/roles';

function App() {
  const { accessToken, user, shop } = useAuthStore();
  const connect = useWebSocketStore((state) => state.connect);
  const disconnect = useWebSocketStore((state) => state.disconnect);

  // Memoize connect/disconnect to prevent unnecessary re-renders
  const handleConnect = useCallback(() => {
    if (!accessToken || !user) return;

    // Determine client type based on role and shop presence
    // Priority: role (admin) > shop presence > default (user)
    let clientType: 'user' | 'shop' | 'admin';

    if (user.role === ROLES.ADMIN) {
      clientType = 'admin';
    } else if (shop) {
      // Only connect WebSocket for approved and active shops
      // Unapproved shops should not have real-time access
      if (shop.is_approved && shop.is_active) {
        clientType = 'shop';
      } else {
        // Don't connect WebSocket for unapproved/inactive shops
        return;
      }
    } else {
      clientType = 'user';
    }

    connect(accessToken, clientType);
  }, [accessToken, user, shop, connect]);

  // Initialize WebSocket connection when user is authenticated
  useEffect(() => {
    handleConnect();

    return () => {
      disconnect();
    };
  }, [handleConnect, disconnect]);

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
