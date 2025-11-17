# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Leema React** - Frontend for AI-powered fashion e-commerce platform
**Stack:** React 18 + TypeScript + Vite + TailwindCSS + Zustand + React Query
**Working Directory:** `/var/www/leema_react/`

## Essential Commands

### Development
```bash
npm run dev              # Start Vite dev server (:5173)
npm run build            # TypeScript check + build
npm run build:fast       # Build without typecheck (faster)
npm run typecheck        # Run TypeScript checks only
npm run preview          # Preview production build
```

### Code Quality
```bash
npm run lint             # Run ESLint
npm run lint:fix         # Auto-fix ESLint issues
npm run format           # Format with Prettier
npm run format:check     # Check formatting
```

### Testing
```bash
npm test                 # Run tests in watch mode
npm run test:run         # Run tests once
npm run test:coverage    # Generate coverage report
npm run test:ui          # Open Vitest UI
npm run test:e2e         # Run Playwright E2E tests
```

### Bundle Analysis
```bash
npm run build:analyze    # Build and open bundle visualizer
npm run size             # Check bundle sizes
npm run size:why         # Analyze why bundle is large
```

### Docker (Hot-Reload Enabled)
```bash
docker-compose up -d          # Start container (dev mode)
docker-compose logs -f        # View logs
docker-compose restart        # Restart (NO rebuild needed)
docker-compose down           # Stop container

# NEVER run docker-compose build for code changes
# Hot-reload is enabled - just edit files
```

## Architecture

### Directory Structure

```
src/
├── app/              # App configuration
│   └── router.tsx    # Route definitions with lazy loading
├── features/         # Feature modules (by domain)
│   ├── auth/         # Authentication
│   ├── shop-dashboard/
│   ├── admin-dashboard/
│   ├── products/
│   ├── orders/
│   ├── billing/
│   ├── newsletters/
│   ├── analytics/
│   ├── notifications/
│   ├── payment/
│   ├── websocket/
│   └── user-dashboard/ # Minimal (users use mobile app)
└── shared/           # Shared resources
    ├── components/   # Reusable UI components
    │   ├── ui/       # Base components (Button, Modal, etc.)
    │   ├── forms/    # Form components (FormInput, FormSelect, etc.)
    │   ├── layout/   # Layout components
    │   ├── feedback/ # Loading, errors, toasts
    │   └── charts/   # Chart components
    ├── lib/          # Core utilities
    │   ├── api/      # API client with security
    │   ├── security/ # CSRF, XSS protection, token storage
    │   ├── validation/ # Zod schemas
    │   ├── monitoring/ # Sentry, web vitals
    │   └── utils/    # Error handling, logger, performance
    ├── hooks/        # Reusable hooks
    ├── types/        # TypeScript types
    └── constants/    # Config, routes, API endpoints
```

### Feature Module Structure

Each feature follows this pattern:
```
features/{feature}/
├── components/       # Feature-specific components
├── domain/          # Business logic
├── hooks/           # Feature-specific hooks
├── pages/           # Page components (lazy loaded)
├── services/        # API service functions
├── store/           # Zustand state (if needed)
├── types/           # TypeScript types
└── index.ts         # Public exports
```

### Path Aliases

TypeScript and Vite configured with:
```typescript
@/                   // src/
@/features/         // src/features/
@/shared/           // src/shared/
@/assets/           // src/assets/
@/tests/            // src/tests/
```

## Key Patterns

### 1. API Layer (`@/shared/lib/api/client.ts`)

Centralized API client with:
- Automatic token refresh on 401
- CSRF token handling
- Request/response sanitization
- Retry logic with exponential backoff
- Security headers

```typescript
import { apiRequest } from '@/shared/lib/api/client';

// Usage in services
export const productsService = {
  getProducts: (params: ProductFilters) =>
    apiRequest<ProductsResponse>('/api/v1/products', 'GET', undefined, params),

  createProduct: (data: ProductCreate) =>
    apiRequest<Product>('/api/v1/products', 'POST', data),
};

// Usage in components with React Query
const { data, isLoading } = useQuery({
  queryKey: ['products', filters],
  queryFn: () => productsService.getProducts(filters),
});
```

### 2. Forms (React Hook Form + Zod)

All forms use:
- `react-hook-form` for form state
- `zod` for validation schemas
- Shared form components from `@/shared/components/forms/`

```typescript
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { FormInput, FormSelect } from '@/shared/components/forms';

const schema = z.object({
  name: z.string().min(1, 'Обязательное поле'),
  email: z.string().email('Неверный email'),
});

function MyForm() {
  const { control, handleSubmit } = useForm({
    resolver: zodResolver(schema),
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <FormInput control={control} name="name" label="Имя" />
      <FormInput control={control} name="email" label="Email" />
    </form>
  );
}
```

### 3. Authentication Flow

State managed by Zustand store (`@/features/auth/store/authStore.ts`):
```typescript
import { useAuthStore } from '@/features/auth/store/authStore';

const { user, shop, isAuthenticated, login, logout } = useAuthStore();
```

Token storage:
- Access token: `sessionStorage` (cleared on tab close)
- Refresh token: HttpOnly cookie (handled by backend)
- Auto-refresh on 401 responses

### 4. WebSocket Events

Real-time updates via WebSocket (`@/features/websocket/`):

```typescript
import { useWebSocketEvent } from '@/features/websocket/hooks';

// Listen for specific events
useWebSocketEvent('order:created', (data) => {
  queryClient.invalidateQueries(['orders']);
  toast.success('Новый заказ!');
});
```

Channels:
- `/ws/user` - User notifications
- `/ws/shop` - Shop owner events (requires `is_approved && is_active`)
- `/ws/admin` - Admin events

### 5. State Management

- **Server state:** React Query (`@tanstack/react-query`)
- **Client state:** Zustand (auth, UI state)
- **Form state:** React Hook Form

### 6. Protected Routes

Routes protected by role in `router.tsx`:
```typescript
withErrorBoundary(<ShopDashboard />, {
  allowedRoles: [ROLES.SHOP_OWNER]
})
```

Roles: `admin`, `shop_owner`, `user`

## Security Patterns

### Input Sanitization
```typescript
import { sanitizeInput, sanitizeHtml } from '@/shared/lib/security/sanitize';

// All user input sanitized before rendering
const clean = sanitizeInput(userInput);
const cleanHtml = sanitizeHtml(richTextInput);
```

### CSRF Protection
Automatic CSRF token injection on state-changing requests (POST, PUT, DELETE, PATCH).

### XSS Prevention
- DOMPurify for HTML sanitization
- Content Security Policy headers
- React's built-in XSS protection

## Build Configuration

### Vite Code Splitting Strategy

Manual chunks configured in `vite.config.ts`:
- `react-vendor` - React, React DOM, React Router
- `query-vendor` - React Query
- `form-vendor` - React Hook Form, Zod
- `charts-vendor` - Recharts
- `ui-vendor` - Lucide icons, UI utilities
- `shop-features`, `admin-features`, `auth-features` - Feature-based chunks
- `shared-components` - Shared UI components

### Bundle Size Limits

Enforced by `size-limit` (see `package.json`):
- Initial bundle: 200 KB (gzipped)
- React vendor: 150 KB
- Total bundle: 800 KB

Check: `npm run size`

## Testing Guidelines

### Unit Tests (Vitest)
```typescript
// Example: src/shared/lib/utils/performance.test.ts
import { describe, it, expect } from 'vitest';

describe('formatBytes', () => {
  it('should format bytes correctly', () => {
    expect(formatBytes(1024)).toBe('1.00 KB');
  });
});
```

### Test Setup
- Environment: jsdom
- Setup file: `src/tests/setup.ts`
- Mocks: `src/tests/mocks/`
- Coverage targets: 80% (branches, functions, lines, statements)

### Running Single Test
```bash
npm test -- performance.test.ts
npm test -- --reporter=verbose
```

## Docker Hot-Reload

**CRITICAL:** Hot-reload is ENABLED. Never rebuild for code changes.

How it works:
- `docker-compose.yml` target: `development`
- Volumes mount source code into container
- Vite dev server watches for changes
- Changes apply in 1-2 seconds

Mounted volumes:
- `./src` → `/app/src`
- `./public` → `/app/public`
- `./index.html` → `/app/index.html`
- Config files (vite.config.ts, tsconfig.*)

If hot-reload breaks:
1. Check logs: `docker-compose logs -f`
2. Verify volumes in `docker-compose.yml`
3. Restart only: `docker-compose restart` (NOT rebuild)

## Environment Variables

Required variables (validated at startup):
```bash
VITE_API_URL=https://api.leema.kz           # Backend API
VITE_WS_URL=wss://api.leema.kz/ws           # WebSocket URL
VITE_GOOGLE_CLIENT_ID=...                    # Google OAuth
VITE_ENV=development|staging|production
```

See `.env.example` for full configuration.

## UI/UX Standards

- **Language:** 100% Russian for user-facing text
- **Technical names:** English only (variable names, function names, API keys)
- **Icons:** Lucide React (`lucide-react`)
- **Styling:** TailwindCSS utility classes
- **Responsiveness:** Mobile-first approach
- **Accessibility:** ARIA labels, keyboard navigation

## Common Development Tasks

### Adding a New Feature

1. Create feature directory: `src/features/{feature}/`
2. Structure:
   ```
   {feature}/
   ├── components/
   ├── pages/
   ├── services/{feature}.service.ts
   ├── types/
   ├── hooks/ (if needed)
   ├── store/ (if needed)
   └── index.ts
   ```
3. Add route in `src/app/router.tsx`
4. Create API service using `apiRequest`
5. Use React Query for data fetching
6. Add types to `types/` directory

### Adding a New API Endpoint

1. Add endpoint constant to `@/shared/constants/api-endpoints.ts`
2. Create service function using `apiRequest`
3. Define TypeScript types
4. Use with React Query in component

### Debugging Issues

**TypeScript errors:**
```bash
npm run typecheck          # Check all files
npm run build             # Full build with checks
```

**Linting errors:**
```bash
npm run lint:fix          # Auto-fix
```

**Bundle too large:**
```bash
npm run build:analyze     # Open visualizer
npm run size:why          # See why bundle is large
```

**API issues:**
- Check browser DevTools Network tab
- Check CSRF token in request headers
- Verify authentication token in sessionStorage
- Backend logs: `docker logs leema_backend`

**Hot-reload not working:**
```bash
docker-compose logs -f    # Check for errors
docker-compose restart    # Restart container
```

## Important Notes

### Code Style
- ESLint errors on `console.log` (use `console.warn` or `console.error`, or remove)
- No `any` types in production code (allowed in tests)
- Exhaustive dependencies in `useEffect`

### Performance
- All pages lazy loaded via `React.lazy()`
- Images optimized automatically in production builds
- Gzip + Brotli compression enabled
- Manual chunk splitting for optimal loading

### Production Build
```bash
# Current mode: DEVELOPMENT (hot-reload)
# Switch to production: See docker-compose.yml comments

# Production build in Docker:
# 1. Change target: production in docker-compose.yml
# 2. docker-compose down && docker-compose up -d --build
# 3. Update Nginx config to serve /dist instead of proxy
```

### Git Workflow
- Branch: `main`
- Before commit: `npm run lint:fix && npm run typecheck`
- Hot-reload enabled: Test changes before committing

### Integration with Backend

Backend: `/var/www/backend/` (FastAPI + PostgreSQL)
- API Docs: `http://localhost:8000/docs` (dev only)
- Backend hot-reload also enabled
- CORS configured for frontend origins

### File Uploads
```typescript
// 1. Get presigned URL
const { url } = await apiRequest('/api/v1/products/upload-url', 'POST', {
  filename: file.name,
});

// 2. Upload file
const formData = new FormData();
formData.append('file', file);
await apiRequest(`/api/v1/products/upload/${filename}`, 'PUT', formData);
```

Supported: JPG, PNG, WEBP (validated on backend)

## Troubleshooting

**"Cannot find module '@/...'"**
- Restart TypeScript server in IDE
- Check `tsconfig.json` paths

**"VITE_API_URL is required"**
- Copy `.env.example` to `.env`
- Fill required variables

**Build fails with type errors**
- Use `npm run build:fast` to skip typecheck
- Fix types separately with `npm run typecheck`

**WebSocket won't connect**
- Check user is authenticated
- Shop owners need `is_approved && is_active`
- Check browser console for errors
- Verify backend WebSocket is running

**Tests failing**
- Check test setup: `src/tests/setup.ts`
- Verify mocks: `src/tests/mocks/`
- Run with verbose: `npm test -- --reporter=verbose`
