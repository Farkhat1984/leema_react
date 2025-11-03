# Task 2: Remove Refresh Tokens from localStorage - Backend Coordination Required

**Date:** 2025-11-03
**Priority:** CRITICAL - Security Vulnerability
**Status:** Requires Backend Coordination

---

## Overview

Currently, the application stores refresh tokens in `localStorage`, which creates a security vulnerability:
- **XSS Attack Risk:** If an attacker injects malicious JavaScript, they can access `localStorage` and steal refresh tokens
- **Long-lived Credentials:** Refresh tokens are long-lived (7-30 days), making them valuable targets
- **Best Practice Violation:** Industry standard is to use HttpOnly cookies for refresh tokens

---

## Current Implementation

### Files Affected

1. **`/var/www/leema_react/src/features/auth/services/authService.ts`**
   - Lines 91, 130, 165, 196: `localStorage.setItem('refresh_token', refreshToken)`
   - Line 232: `localStorage.removeItem('refresh_token')`
   - Line 242: `localStorage.getItem('refresh_token')`

2. **`/var/www/leema_react/src/features/auth/store/authStore.ts`**
   - Line 51: `localStorage.removeItem('refresh_token')`

3. **`/var/www/leema_react/src/shared/lib/api/client.ts`**
   - Line 148: `localStorage.getItem('refresh_token')`

### Current Flow

```typescript
// Login/OAuth (authService.ts)
if (refreshToken) {
  localStorage.setItem('refresh_token', refreshToken);
}

// Token Refresh (client.ts)
const refreshToken = localStorage.getItem('refresh_token');
const response = await axios.post(refreshEndpoint, { refreshToken });

// Logout (authService.ts, authStore.ts)
localStorage.removeItem('refresh_token');
```

---

## Recommended Solution

### Backend Changes Required

The backend needs to implement the following:

1. **Set HttpOnly Cookie on Login/OAuth**
   ```typescript
   // Backend response headers
   Set-Cookie: refresh_token=<token>; HttpOnly; Secure; SameSite=Strict; Max-Age=2592000; Path=/api/auth
   ```

2. **Automatic Cookie Reading on Refresh**
   ```typescript
   // Backend refresh endpoint
   POST /api/auth/refresh
   // No body required - backend reads refresh_token from HttpOnly cookie
   // Returns: { accessToken: "..." }
   ```

3. **Clear Cookie on Logout**
   ```typescript
   // Backend logout endpoint
   POST /api/auth/logout
   // Backend clears the refresh_token cookie
   Set-Cookie: refresh_token=; HttpOnly; Secure; SameSite=Strict; Max-Age=0; Path=/api/auth
   ```

### Frontend Changes Required

Once backend is ready, update the following files:

#### 1. authService.ts

```typescript
// REMOVE all localStorage.setItem('refresh_token', ...) calls
// Lines 91, 130, 165, 196
export const googleLogin = async (
  code: string,
  accountType: AccountType = 'user',
  platform: ClientPlatform = 'web'
): Promise<GoogleAuthResponse> => {
  const response = await apiRequest<GoogleAuthResponse>(
    API_ENDPOINTS.AUTH.GOOGLE_LOGIN,
    'POST',
    { code, account_type: accountType, platform }
  );

  // Store access token only
  const accessToken = response.access_token || response.accessToken;
  if (accessToken) {
    setStorageToken(accessToken);
  }

  // ❌ REMOVE: localStorage.setItem('refresh_token', refreshToken);
  // ✅ Backend will set HttpOnly cookie automatically

  return response;
};

// REMOVE localStorage operations from logout
export const logout = async (): Promise<void> => {
  try {
    await apiRequest(API_ENDPOINTS.AUTH.LOGOUT, 'POST');
    // Backend will clear HttpOnly cookie
  } finally {
    // ❌ REMOVE: localStorage.removeItem('refresh_token');
    // Access token cleared by clearAuthStorage()
  }
};

// UPDATE refreshToken function
export const refreshToken = async (): Promise<{ accessToken: string }> => {
  // ❌ REMOVE: const refreshToken = localStorage.getItem('refresh_token');
  // ✅ Backend reads refresh token from HttpOnly cookie

  const response = await apiRequest<{ access_token?: string; accessToken?: string }>(
    API_ENDPOINTS.AUTH.REFRESH,
    'POST'
    // No body needed - backend reads cookie
  );

  const accessToken = response.access_token || response.accessToken;
  if (!accessToken) {
    throw new Error('No access token in refresh response');
  }

  return { accessToken };
};
```

#### 2. authStore.ts

```typescript
logout: () => {
  // Clear auth storage
  clearAuthStorage();
  // ❌ REMOVE: localStorage.removeItem('refresh_token');
  // Backend will clear HttpOnly cookie

  set({
    user: null,
    shop: null,
    accessToken: null,
    isAuthenticated: false,
    isLoading: false,
  });
},
```

#### 3. client.ts

```typescript
try {
  // ❌ REMOVE: const refreshToken = localStorage.getItem('refresh_token');
  // ❌ REMOVE: if (!refreshToken) { throw new Error('No refresh token available'); }

  // Call refresh endpoint - backend reads cookie
  const response = await axios.post(
    `${CONFIG.API_URL}${API_ENDPOINTS.AUTH.REFRESH}`,
    {}, // Empty body - backend reads HttpOnly cookie
    { withCredentials: true } // Important: send cookies
  );

  const { accessToken } = response.data;

  // Update token in store and sessionStorage
  setStorageToken(accessToken);
  useAuthStore.getState().setAccessToken(accessToken);

  // ... rest of the logic
} catch (refreshError) {
  // If refresh fails, backend cookie is invalid/expired
  // ... logout logic
}
```

---

## Backend API Requirements

### Required Endpoints

1. **All Login/OAuth Endpoints**
   - Must set HttpOnly cookie in response
   - Cookie name: `refresh_token`
   - Cookie attributes: `HttpOnly; Secure; SameSite=Strict; Path=/api/auth`

2. **POST /api/auth/refresh**
   - Read `refresh_token` from HttpOnly cookie
   - Validate and generate new access token
   - Return: `{ accessToken: string }`
   - If cookie missing/invalid: return 401

3. **POST /api/auth/logout**
   - Clear `refresh_token` HttpOnly cookie
   - Invalidate refresh token on backend
   - Return success response

### Cookie Configuration

```typescript
// Backend cookie settings
{
  httpOnly: true,       // Prevent JavaScript access
  secure: true,         // HTTPS only (disable in dev if needed)
  sameSite: 'strict',   // CSRF protection
  path: '/api/auth',    // Restrict to auth endpoints
  maxAge: 2592000,      // 30 days in seconds
}
```

---

## Testing Checklist

Once backend changes are deployed:

- [ ] Verify refresh token is NOT in localStorage after login
- [ ] Verify refresh token cookie is set (check DevTools > Application > Cookies)
- [ ] Verify token refresh works without sending refresh token in body
- [ ] Verify logout clears the HttpOnly cookie
- [ ] Test token refresh after access token expires
- [ ] Test behavior when refresh token expires
- [ ] Verify CORS settings allow credentials (`withCredentials: true`)
- [ ] Test in production with HTTPS (Secure flag requirement)

---

## CORS Configuration

Backend must allow credentials in CORS:

```typescript
// Backend CORS settings
{
  origin: ['https://leema.kz', 'http://localhost:5173'], // Add all frontend URLs
  credentials: true, // Required for cookies
  allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token'],
}
```

---

## Security Benefits

After implementation:

1. **XSS Protection:** Even if attacker injects JavaScript, they cannot access refresh token
2. **CSRF Protection:** `SameSite=Strict` prevents cross-site request forgery
3. **Reduced Attack Surface:** Refresh tokens never exposed to JavaScript
4. **Industry Standard:** Aligns with OAuth 2.0 best practices

---

## Migration Plan

1. **Backend Team:** Implement HttpOnly cookie support for all auth endpoints
2. **Testing:** Test in staging environment
3. **Frontend Update:** Deploy frontend changes (remove localStorage usage)
4. **Verification:** Monitor error logs for any token refresh issues
5. **Documentation:** Update SECURITY.md with new token flow

---

## Current Status

- ✅ **Frontend is ready:** API client already uses `withCredentials: true`
- ✅ **Frontend expects cookies:** `/src/shared/lib/api/client.ts:23` has `withCredentials: true`
- ⏳ **Waiting on backend:** HttpOnly cookie implementation required
- ❌ **Security risk remains:** Refresh tokens still in localStorage until backend ready

---

## Next Steps

1. Share this document with backend team
2. Backend implements HttpOnly cookie support
3. Test in staging environment
4. Deploy frontend changes to remove localStorage usage
5. Verify in production
6. Update SECURITY.md documentation
7. Mark Task 2 as complete in IMPROVEMENT_CHECKLIST.md

---

## References

- [OAuth 2.0 Security Best Practices](https://datatracker.ietf.org/doc/html/draft-ietf-oauth-security-topics)
- [OWASP: Token Storage Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/HTML5_Security_Cheat_Sheet.html#local-storage)
- [Auth0: Token Storage](https://auth0.com/docs/secure/security-guidance/data-security/token-storage)
