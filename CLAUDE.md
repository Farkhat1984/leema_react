# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Leema React** - Fashion AI Platform migration from legacy codebase to modern React + TypeScript stack. This is a multi-role application serving shop owners, administrators, and end users with role-based dashboards, real-time notifications via WebSocket, and Google OAuth authentication.

## Commands

### Development
```bash
npm run dev              # Start dev server on http://localhost:5173
npm run typecheck        # Run TypeScript type checking (NO build)
```

### Testing
```bash
npm run test            # Run unit tests with Vitest
npm run test:ui         # Open Vitest UI
npm run test:e2e        # Run Playwright E2E tests
```

### Code Quality
```bash
npm run lint            # Check for linting errors
npm run lint:fix        # Auto-fix linting errors
npm run format          # Format code with Prettier
npm run format:check    # Check code formatting
```

### Build & Deploy
```bash
npm run build              # Production build (includes type checking)
npm run build:analyze      # Build with bundle analysis (opens dist/stats.html)
npm run preview            # Preview production build locally
```

## Architecture

### Feature-Based Structure

The codebase uses **feature-based architecture** where each feature is self-contained with its own pages, components, hooks, services, types, and store. Features are lazy-loaded for optimal performance.

**Features:**
- `features/auth/` - Authentication (Google OAuth, token management)
- `features/shop-dashboard/` - Shop owner dashboard and analytics
- `features/admin-dashboard/` - Admin management tools
- `features/user-dashboard/` - End user profile and preferences
- `features/products/` - Product catalog and management
- `features/notifications/` - Notification system
- `features/websocket/` - Real-time WebSocket communication

### Shared Code

`shared/` contains reusable code across features:
- `shared/components/` - UI components organized by type (ui/, layout/, feedback/, forms/)
- `shared/hooks/` - Reusable React hooks (useCSRF, useSanitizedInput, useSecureStorage, usePerformanceMonitor)
- `shared/lib/api/` - API client with automatic token refresh, interceptors, and security middleware
- `shared/lib/security/` - Security utilities (sanitization, CSRF, secure storage)
- `shared/lib/validation/` - Zod schemas for input validation
- `shared/lib/utils/` - Helper functions (cn for className merging, performance utilities)
- `shared/types/` - Shared TypeScript types
- `shared/constants/` - App-wide constants (API endpoints, routes, config)

### State Management

- **Zustand** for global state (auth store in `features/auth/store/authStore.ts`)
- **React Query** (@tanstack/react-query) for server state with optimized caching:
  - 5-minute stale time
  - 10-minute garbage collection
  - Smart retry logic (no retry on 4xx errors)
  - Configured in `src/main.tsx`

### Routing

- **React Router v7** with lazy loading
- **Protected routes** via `ProtectedRoute` component with role-based access control
- Route configuration in `src/app/router.tsx`
- All pages use `<Suspense fallback={<PageLoader />}>` for code splitting

### Security Implementation

This application has comprehensive security features. **Always** follow these patterns:

1. **Token Management:**
   - Access tokens stored in `sessionStorage` (NOT localStorage)
   - Refresh tokens in HttpOnly cookies (set by backend)
   - Use `setAccessToken()` / `getAccessToken()` from `@/shared/lib/security`
   - API client automatically handles token refresh on 401 responses

2. **Input Sanitization:**
   - All user inputs **MUST** be sanitized using `sanitizeInput()` or `sanitizeHTML()`
   - API request bodies automatically sanitized by interceptor
   - Use `useSanitizedInput` hook for form inputs

3. **CSRF Protection:**
   - CSRF tokens automatically added to POST/PUT/PATCH/DELETE requests
   - Token stored in sessionStorage, added via `X-CSRF-Token` header
   - Initialized on app startup in `src/shared/lib/api/client.ts`

4. **XSS Prevention:**
   - Use DOMPurify via `sanitizeHTML()` for any user-generated HTML
   - Never use `dangerouslySetInnerHTML` without sanitization
   - Content Security Policy configured in `index.html`

5. **URL Validation:**
   - Use `isValidUrl()` and `sanitizeUrl()` before using user-provided URLs
   - Prevents javascript: and data: URL schemes

See `SECURITY.md` for complete security documentation.

## Path Aliases

TypeScript path aliases are configured in `tsconfig.app.json` and `vite.config.ts`:

```typescript
import Component from '@/shared/components/ui/Button'
import { useAuth } from '@/features/auth/hooks/useAuth'
import logo from '@/assets/images/logo.png'
import { mockUser } from '@/tests/mocks/user'
```

## API Client Usage

The API client (`@/shared/lib/api/client.ts`) automatically handles:
- Authentication headers (Bearer token)
- Token refresh on 401 errors
- CSRF token injection
- Request/response sanitization
- Error handling with retry logic

```typescript
import { apiRequest } from '@/shared/lib/api/client'
import { API_ENDPOINTS } from '@/shared/constants/api-endpoints'

// Generic request
const data = await apiRequest<UserData>(API_ENDPOINTS.USER.PROFILE)

// With method and data
await apiRequest(API_ENDPOINTS.USER.UPDATE, 'PUT', { name: 'John' })
```

**Important:** Never bypass the API client. It includes critical security middleware.

## Performance Optimizations

Stage 6 optimizations are fully implemented:

1. **Code Splitting:**
   - Route-based splitting via React.lazy
   - Manual vendor chunking (react-vendor, query-vendor, form-vendor, charts-vendor)
   - Feature-based chunks (shop-features, admin-features, user-features, auth-features)

2. **Image Optimization:**
   - Automatic compression via vite-plugin-imagemin
   - JPEG/PNG/WebP quality: 80%
   - SVG optimization with SVGO

3. **Build Optimizations:**
   - Gzip and Brotli compression (threshold: 10KB)
   - Content hash filenames for cache busting
   - Bundle analyzer integration (`npm run build:analyze`)
   - Pre-optimized dependencies (react, react-dom, react-router-dom, @tanstack/react-query, zustand)

4. **Virtual Scrolling:**
   - Use `@tanstack/react-virtual` for long lists
   - Components: `VirtualList`, `VirtualGrid` in `@/shared/components/ui/`

See `PERFORMANCE.md` for complete performance documentation.

## Environment Variables

Required environment variables (create `.env` from `.env.example`):

```env
VITE_API_URL=https://api.leema.kz
VITE_WS_URL=wss://api.leema.kz/ws
VITE_GOOGLE_CLIENT_ID=your-google-client-id
VITE_ENV=development
```

Access via `import.meta.env.VITE_*` or use `CONFIG` object from `@/shared/constants/config`.

## Common Patterns

### Creating a New Feature

1. Create feature directory: `src/features/my-feature/`
2. Add subdirectories: `pages/`, `components/`, `hooks/`, `services/`, `types/`, `store/`
3. Export main page from feature
4. Add lazy-loaded route in `src/app/router.tsx`
5. Add API endpoints to `@/shared/constants/api-endpoints.ts`
6. Update manual chunking in `vite.config.ts` if needed

### Adding Protected Routes

```typescript
<ProtectedRoute allowedRoles={['admin', 'shop_owner']}>
  <Suspense fallback={<PageLoader />}>
    <MyPage />
  </Suspense>
</ProtectedRoute>
```

### Using React Query

```typescript
import { useQuery, useMutation } from '@tanstack/react-query'
import { apiRequest } from '@/shared/lib/api/client'

// Query
const { data, isLoading } = useQuery({
  queryKey: ['users', userId],
  queryFn: () => apiRequest<User>(`/api/users/${userId}`)
})

// Mutation
const mutation = useMutation({
  mutationFn: (data) => apiRequest('/api/users', 'POST', data),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['users'] })
  }
})
```

### Form Validation with Zod

```typescript
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { isValidEmail } from '@/shared/lib/security'

const schema = z.object({
  email: z.string().refine(isValidEmail, 'Invalid email'),
  password: z.string().min(8)
})

const { register, handleSubmit } = useForm({
  resolver: zodResolver(schema)
})
```

## Testing

- **Unit tests:** Vitest + React Testing Library
- **E2E tests:** Playwright
- **Test utilities:** `src/tests/utils/` and `src/tests/mocks/`

Currently, test coverage is minimal (Stage 7 pending). When writing tests, place them adjacent to the code being tested: `MyComponent.test.tsx`

## Important Notes

- **TypeScript strict mode is enabled** - all code must be type-safe
- **Do NOT store tokens in localStorage** - use security helpers only
- **All user input must be sanitized** - no exceptions
- **CSP is enforced** - inline scripts are restricted
- **The project is NOT in a git repository** - no git commands available
- **Role-based access:** 'admin', 'shop_owner', 'user'
- **The backend API is at https://api.leema.kz** - uses HttpOnly cookies for refresh tokens

## Migration Status

This is an ongoing migration from a legacy codebase. Stages completed:
- ✅ Stage 1: Project initialization
- ✅ Stage 3: Core infrastructure (API client, auth, routing, WebSocket)
- ✅ Stage 5: Feature migration (all dashboards, Google OAuth)
- ✅ Stage 6: Performance optimizations

Pending stages:
- ⏳ Stage 2: Design system completion
- ⏳ Stage 7: Testing & QA (80%+ coverage goal)
- ⏳ Stage 8: Documentation

See `README.md` for complete migration roadmap and `STAGE*_COMPLETE.md` files for detailed completion reports.
