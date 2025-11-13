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
    if (!accessToken || !user) {
      console.log('[WebSocket] Не подключаемся: нет токена или пользователя', { accessToken: !!accessToken, user: !!user });
      return;
    }

    // Determine client type based on role and shop presence
    // Priority: role (admin) > shop presence > default (user)
    let clientType: 'user' | 'shop' | 'admin';

    if (user.role === ROLES.ADMIN) {
      clientType = 'admin';
      console.log('[WebSocket] Подключаемся как ADMIN');
    } else if (user.role === ROLES.SHOP_OWNER) {
      // Для shop_owner нужен магазин
      if (!shop) {
        console.log('[WebSocket] Не подключаемся: shop_owner без магазина');
        return;
      }

      // Only connect WebSocket for approved and active shops
      // Unapproved shops should not have real-time access
      if (!shop.is_approved || !shop.is_active) {
        console.log('[WebSocket] Не подключаемся: магазин не одобрен или неактивен', {
          is_approved: shop.is_approved,
          is_active: shop.is_active
        });
        return;
      }

      clientType = 'shop';
      console.log('[WebSocket] Подключаемся как SHOP', { shop_id: shop.id });
    } else {
      clientType = 'user';
      console.log('[WebSocket] Подключаемся как USER');
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
            background: '#fff',
            color: '#1f2937',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
            border: '1px solid #e5e7eb',
            borderRadius: '12px',
            padding: '16px',
            fontSize: '14px',
            maxWidth: '500px',
          },
          success: {
            duration: 3000,
            style: {
              background: '#f0fdf4',
              color: '#166534',
              border: '1px solid #86efac',
            },
            iconTheme: {
              primary: '#10b981',
              secondary: '#fff',
            },
          },
          error: {
            duration: 6000,
            style: {
              background: '#fef2f2',
              color: '#991b1b',
              border: '1px solid #fca5a5',
            },
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fff',
            },
          },
          loading: {
            style: {
              background: '#f0f9ff',
              color: '#1e40af',
              border: '1px solid #93c5fd',
            },
            iconTheme: {
              primary: '#3b82f6',
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
