/**
 * Hook for CSRF token management
 */

import { useEffect, useState } from 'react';
import { initCSRFToken, getCSRFToken, clearCSRFToken } from '@/shared/lib/security';

export const useCSRF = () => {
  const [token, setToken] = useState<string>(() => initCSRFToken());

  useEffect(() => {
    // Initialize CSRF token on mount
    const currentToken = initCSRFToken();
    setToken(currentToken);

    // Cleanup on unmount
    return () => {
      // Note: We don't clear the token on unmount by default
      // as it should persist for the session
    };
  }, []);

  const refreshToken = () => {
    clearCSRFToken();
    const newToken = initCSRFToken();
    setToken(newToken);
    return newToken;
  };

  const clearToken = () => {
    clearCSRFToken();
    setToken('');
  };

  return {
    token,
    refreshToken,
    clearToken,
    getToken: getCSRFToken,
  };
};
