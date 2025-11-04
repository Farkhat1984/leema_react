# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Leema React is a production-grade e-commerce platform frontend for shop owners and admins. This is a TypeScript + React + Vite application with a feature-based architecture. **Note: End users access the platform through a separate mobile app (www.app.leema.kz) - this web application is exclusively for shop owners and administrators.**

## Essential Commands

### Development
```bash
npm run dev                    # Start dev server on port 5173
npm run build                  # Full production build with type checking
npm run build:fast             # Fast build without type checking
npm run build:analyze          # Build and open bundle analyzer
npm run preview                # Preview production build
```

### Testing
```bash
npm run test                   # Run tests in watch mode
npm run test:run               # Run tests once
npm run test:coverage          # Run tests with coverage report
npm run test:ui                # Open Vitest UI
npm run test:e2e               # Run Playwright E2E tests
npm run typecheck              # Type check without emitting files
```

### Code Quality
```bash
npm run lint                   # Check for linting errors
npm run lint:fix               # Auto-fix linting errors
npm run format                 # Format code with Prettier
npm run format:check           # Check code formatting
```

### Docker
```bash
docker-compose up -d           # Start in production mode
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up -d  # Start in dev mode
docker-compose ps              # Check container status
docker-compose logs -f         # View logs
docker-compose restart         # Restart containers
```

## Architecture Overview

### Feature-Based Structure

The codebase follows a **strict feature-based architecture** where each feature is self-contained:

```
src/
├── features/              # Feature modules (each feature is independent)
│   ├── auth/             # Authentication (Google OAuth, JWT, token refresh)
│   ├── shop-dashboard/   # Shop owner dashboard & pages
│   ├── admin-dashboard/  # Admin dashboard & pages
│   ├── products/         # Product management (admin & shop views)
│   ├── orders/           # Order management
│   ├── billing/          # Billing and payments
│   ├── analytics/        # Analytics and reports
│   ├── newsletters/      # Newsletter management
│   ├── websocket/        # Real-time WebSocket connection manager
│   └── ...
├── shared/               # Shared utilities and components
│   ├── components/       # Reusable UI components
│   │   ├── ui/          # Base UI components
│   │   ├── forms/       # Form components
│   │   ├── layout/      # Layout components
│   │   └── feedback/    # Loading, error, and toast components
│   ├── lib/             # Core utilities
│   │   ├── api/         # API client with axios interceptors
│   │   ├── security/    # Security utils (CSRF, XSS, JWT validation)
│   │   ├── utils/       # General utilities and error handling
│   │   └── validation/  # Zod schemas
│   ├── constants/       # App-wide constants (routes, config, API endpoints)
│   ├── hooks/           # Shared React hooks
│   └── types/           # Shared TypeScript types
└── app/                 # App-level config
    └── router.tsx       # Route definitions with lazy loading
```

### Key Architectural Patterns

1. **Authentication Flow**
   - Google OAuth via `@react-oauth/google`
   - JWT tokens: Access token (sessionStorage) + HttpOnly refresh token (cookie)
   - Automatic token refresh in axios interceptors (src/shared/lib/api/client.ts)
   - Auth state managed by Zustand store (src/features/auth/store/authStore.ts)
   - Protected routes by role: `admin`, `shop_owner`

2. **State Management**
   - **Zustand** for global state (auth, websocket)
   - **React Query (@tanstack/react-query)** for server state and data fetching
   - Each feature has its own service layer for API calls

3. **API Client (src/shared/lib/api/client.ts)**
   - Centralized axios instance with interceptors
   - Automatic token injection and refresh
   - CSRF protection for state-changing requests
   - XSS sanitization of request bodies
   - Centralized error handling with toast notifications
   - Request/response logging in development

4. **WebSocket Manager (src/features/websocket/WebSocketManager.ts)**
   - Real-time connection for notifications, orders, and updates
   - Automatic reconnection with exponential backoff
   - Client type-based connection (shop/admin)
   - Event subscription system for components
   - Heartbeat mechanism to keep connection alive

5. **Security**
   - CSRF tokens for all mutations
   - XSS sanitization on input/output
   - JWT validation before use
   - HttpOnly cookies for refresh tokens
   - sessionStorage for access tokens (cleared on tab close)
   - Content Security Policy headers

6. **Code Splitting**
   - Route-based code splitting with React lazy()
   - Feature-based chunks (admin-features, shop-features, etc.)
   - Vendor chunks separated by library type (react-vendor, form-vendor, charts-vendor)
   - Configuration in vite.config.ts manualChunks

7. **Error Handling**
   - React Error Boundaries on all routes
   - Centralized error handler (src/shared/lib/utils/error-handler.ts)
   - Toast notifications for user-facing errors
   - Structured error codes and types
   - Automatic error reporting for 5xx errors

## Path Aliases

```typescript
@/*              → ./src/*
@/features/*     → ./src/features/*
@/shared/*       → ./src/shared/*
@/assets/*       → ./src/assets/*
@/tests/*        → ./src/tests/*
```

These are configured in:
- `tsconfig.app.json` (TypeScript)
- `vite.config.ts` (Vite)
- `vitest.config.ts` (Vitest)

## Environment Configuration

Required environment variables (validated at startup with Zod):

```bash
VITE_API_URL=https://api.leema.kz                    # Backend API URL
VITE_WS_URL=wss://api.leema.kz/ws                    # WebSocket URL
VITE_GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com # Google OAuth Client ID
VITE_ENV=development|staging|production              # Environment
```

Copy `.env.example` to `.env` and fill in values. Missing or invalid variables will cause immediate startup failure.

## Important Conventions

### API Service Pattern
Each feature should have a `services/` folder with API calls:

```typescript
// features/products/services/productService.ts
export const productService = {
  getProducts: (params) => apiRequest<ProductResponse>('/products', 'GET', undefined, params),
  createProduct: (data) => apiRequest<Product>('/products', 'POST', data),
  // ...
};
```

### Protected Routes
All routes except login, auth callback, and payment pages require authentication:

```typescript
// Example from router.tsx
{
  path: ROUTES.SHOP.DASHBOARD,
  element: withErrorBoundary(<ShopDashboard />, { allowedRoles: ['shop_owner'] }),
}
```

### React Query Usage
All data fetching should use React Query hooks:

```typescript
const { data, isLoading, error } = useQuery({
  queryKey: ['products', shopId],
  queryFn: () => productService.getProducts({ shop_id: shopId }),
  staleTime: 5 * 60 * 1000, // 5 minutes
});
```

### Form Validation
Use `react-hook-form` + `zod` + `@hookform/resolvers/zod`:

```typescript
const schema = z.object({
  name: z.string().min(1, 'Name is required'),
});

const { register, handleSubmit, formState: { errors } } = useForm({
  resolver: zodResolver(schema),
});
```

### Component Exports
Features export their pages/components via index.ts:

```typescript
// features/shop-dashboard/index.ts
export { ShopDashboard } from './pages/Dashboard';
export { ShopProductsPage } from './pages/products/ShopProductsPage';
```

## Testing

- **Unit/Integration Tests**: Vitest + React Testing Library
- **E2E Tests**: Playwright
- **Test Setup**: `src/tests/setup.ts` configures test environment
- **Coverage Target**: 80% for branches, functions, lines, statements
- **Mock Service Worker (MSW)**: For API mocking in tests

## Production Build

The production build process:

1. TypeScript compilation (`tsc -b`)
2. Vite bundling with optimizations
3. Image optimization (vite-plugin-imagemin)
4. Gzip and Brotli compression
5. Bundle analysis (stats.html in dist/)
6. Multi-stage Docker build
7. Nginx serving with SSL support

Build outputs include:
- Optimized chunks with content hashing
- Source maps (if enabled)
- Bundle visualization (dist/stats.html)

## API Proxy

Development server proxies `/api` to `https://api.leema.kz` (configured in vite.config.ts). This avoids CORS issues during development.

## Browser Support

Target: ES2022+ browsers. Build target is ES2015 for wider compatibility but uses modern syntax (see vite.config.ts).

## Styling

- **TailwindCSS** for utility-first styling
- **CVA (Class Variance Authority)** for component variants
- **clsx** + **tailwind-merge** for conditional classes
- Custom design system in `src/shared/components/ui/`

## Logging

Use the centralized logger (src/shared/lib/utils/logger.ts):

```typescript
import { logger } from '@/shared/lib/utils/logger';

logger.debug('Debug message', { data });
logger.info('Info message');
logger.warn('Warning message');
logger.error('Error message', error);
```

Logging levels are automatically adjusted based on `VITE_ENV`.

## Key Files to Understand

- **src/app/router.tsx**: All route definitions and lazy loading
- **src/shared/lib/api/client.ts**: API client with auth interceptors
- **src/features/auth/store/authStore.ts**: Authentication state management
- **src/features/websocket/WebSocketManager.ts**: Real-time connection handling
- **src/shared/constants/config.ts**: Environment config and route constants
- **src/shared/lib/utils/error-handler.ts**: Centralized error handling
- **vite.config.ts**: Build configuration and code splitting strategy

## Development Workflow

1. Create feature branches from `main`
2. Run `npm run dev` for development
3. Run `npm run typecheck` before committing
4. Run `npm run lint:fix` to auto-fix issues
5. Run `npm run test` to verify changes
6. Build succeeds with `npm run build` before merging

## Common Issues

- **Token refresh loops**: Check that access token is valid JWT before use
- **WebSocket disconnects**: Verify token is passed correctly in query params
- **CORS errors**: Ensure API proxy is configured in vite.config.ts for dev
- **Build failures**: Run `npm run typecheck` to catch type errors early
- **Slow builds**: Use `npm run build:fast` to skip type checking during development
