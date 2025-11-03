# Security Quick Reference

Quick copy-paste examples for common security tasks.

## Sanitize User Input

```typescript
import { sanitizeInput, sanitizeHTML } from '@/shared/lib/security';

// Text input
const cleanText = sanitizeInput(userInput);

// HTML content
const safeHTML = sanitizeHTML(htmlContent);
```

## Validate Input

```typescript
import { isValidEmail, isValidPhone, isValidUrl } from '@/shared/lib/security';

// Email
if (!isValidEmail(email)) {
  throw new Error('Invalid email');
}

// Phone (Kazakhstan format)
if (!isValidPhone(phone)) {
  throw new Error('Invalid phone');
}

// URL
if (!isValidUrl(url)) {
  throw new Error('Invalid URL');
}
```

## Secure Storage

```typescript
import { setAccessToken, setUserData, clearAuthStorage } from '@/shared/lib/security';

// Store access token (sessionStorage)
setAccessToken(response.accessToken);

// Store user data (localStorage, non-sensitive only)
setUserData({
  id: user.id,
  name: user.name,
  email: user.email,
});

// Clear all auth data on logout
clearAuthStorage();
```

## API Requests

```typescript
import { apiRequest } from '@/shared/lib/api';

// Security headers and CSRF tokens added automatically
const data = await apiRequest('/api/products', 'POST', {
  name: 'Product Name',
  price: 100,
});
```

## Forms with Validation

```typescript
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { isValidEmail } from '@/shared/lib/security';

const schema = z.object({
  email: z.string().refine(isValidEmail, 'Invalid email'),
  password: z.string().min(8),
});

const { register, handleSubmit } = useForm({
  resolver: zodResolver(schema),
});
```

## Sanitized Input Hook

```typescript
import { useSanitizedInput } from '@/shared/hooks';

const { value, onChange, error } = useSanitizedInput('', {
  maxLength: 100,
  pattern: /^[a-zA-Z0-9\s]+$/,
});

return (
  <input
    value={value}
    onChange={(e) => onChange(e.target.value)}
  />
);
```

## CSRF Token

```typescript
import { useCSRF } from '@/shared/hooks';

const { token } = useCSRF();

// Token automatically added to POST/PUT/PATCH/DELETE requests
```

## Safe HTML Rendering

```typescript
import { sanitizeHTML } from '@/shared/lib/security';

// In component
<div dangerouslySetInnerHTML={{ __html: sanitizeHTML(userContent) }} />
```

## Error Handling

```typescript
import { handleApiError } from '@/shared/lib/api/security-middleware';

try {
  await apiRequest(endpoint);
} catch (error) {
  const safeError = handleApiError(error);
  showError(safeError.message); // Safe for users
}
```

## Rate Limiting

```typescript
import { checkRateLimit } from '@/shared/lib/api/security-middleware';

if (!checkRateLimit(endpoint)) {
  throw new Error('Too many requests');
}
```

## Protected Routes

```tsx
import { ProtectedRoute } from '@/features/auth/components/ProtectedRoute';

<ProtectedRoute allowedRoles={['admin']}>
  <AdminDashboard />
</ProtectedRoute>
```

## Environment Variables

```typescript
// .env.local
VITE_API_URL=https://api.leema.kz
VITE_WS_URL=wss://api.leema.kz/ws

// Usage
const apiUrl = import.meta.env.VITE_API_URL;
```

## Security Headers (Backend Required)

```python
# FastAPI example - tell backend team
response.set_cookie(
    key="refresh_token",
    value=refresh_token,
    httponly=True,      # Not accessible to JS
    secure=True,        # HTTPS only
    samesite="strict",  # CSRF protection
    max_age=604800      # 7 days
)
```

## Common Pitfalls

### ❌ DON'T

```typescript
// Don't store tokens in localStorage
localStorage.setItem('token', token);

// Don't render raw HTML
<div dangerouslySetInnerHTML={{ __html: userContent }} />

// Don't expose internal errors
catch (error) {
  showError(error.message);
}

// Don't hardcode secrets
const SECRET = 'sk_live_123...';
```

### ✅ DO

```typescript
// Use sessionStorage for access tokens
setAccessToken(token);

// Sanitize before rendering
<div dangerouslySetInnerHTML={{ __html: sanitizeHTML(userContent) }} />

// Handle errors safely
catch (error) {
  const safeError = handleApiError(error);
  showError(safeError.message);
}

// Use environment variables
const SECRET = import.meta.env.VITE_API_KEY;
```
