# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

## ⚠️ CRITICAL RULES - READ FIRST ⚠️

### 🔥 HOT-RELOAD IS ENABLED - DO NOT REBUILD CONTAINERS 🔥

**Frontend has Vite HMR (Hot Module Replacement) configured:**
- All files in `src/` auto-reload via Vite dev server
- Docker volume mount: `./src:/app/src` (and other key directories)

**THIS MEANS:**
- ❌ **NEVER** rebuild Docker containers after editing `src/` files
- ❌ **NEVER** run `docker-compose build` for code changes
- ❌ **NEVER** restart containers for TypeScript/React/CSS changes
- ✅ Just edit files - Vite HMR reloads instantly (< 1 second)
- ✅ Only rebuild if changing `package.json`, `Dockerfile`, `vite.config.ts`, or `.env`

**If hot-reload appears broken:**
1. Check logs: `docker-compose logs -f leema_frontend`
2. Look for "VITE" messages and HMR status
3. Verify Vite dev server is running on port 5173
4. Check browser console for HMR connection errors
5. Only then consider restart: `docker-compose restart leema_frontend` (NOT rebuild)

---

### 🚫 STRICT FILE CREATION POLICY 🚫

**ABSOLUTELY FORBIDDEN** to create the following files **UNLESS EXPLICITLY REQUESTED:**

#### ❌ NEVER CREATE THESE FILES:
- **Markdown files:** `*.md` (README.md, CONTRIBUTING.md, CHANGELOG.md, API.md, COMPONENTS.md, etc.)
- **Text documentation:** `*.txt`, `*.doc`, `*.rtf`
- **Notes/docs:** TODO.md, NOTES.md, GUIDE.md, INSTRUCTIONS.md, FEATURES.md
- **Any documentation files** in any format

**The ONLY exceptions are:**
1. User explicitly says: "Create a README.md file" or "Write me a TODO.md"
2. User asks: "Document this in a markdown file"
3. User requests: "Make a .txt file with..."

**Why this rule exists:**
- Documentation clutter in codebase
- Unnecessary git commits for non-code files
- Project stays clean and focused on production code

**What to do instead:**
- Communicate documentation directly in chat responses
- Update existing CLAUDE.md if needed (with permission)
- Suggest documentation structure verbally
- Wait for explicit user request before creating any docs

**Examples of FORBIDDEN actions:**
```bash
# ❌ DON'T DO THIS:
echo "# Components Guide" > COMPONENTS.md
cat > TODO.md <<EOF
touch FEATURES.md
echo "Setup instructions" > SETUP.txt

# ✅ DO THIS INSTEAD:
# Just tell the user: "Here's how the components work: ..."
# Or ask: "Would you like me to create a markdown file documenting this?"
```

---

## Project Overview

Leema React is a production e-commerce frontend built with React 18, TypeScript, and Vite. It provides separate dashboards for:
- **Shop Owners** (shop_owner role): Manage products, orders, customers, WhatsApp integration, billing, newsletters
- **Administrators** (admin role): Platform-wide management, user oversight, shop approvals, system settings
- **Users**: Use mobile app only - no web dashboard

The frontend communicates with a FastAPI backend at `https://api.leema.kz` via REST API and WebSocket.

## Development Environment

### Docker Hot-Reload Setup (Currently Active)

Both backend and frontend run in Docker containers with hot-reload enabled:

**Frontend Container:**
- Container: `leema_frontend`
- Image: `leema_react-leema_frontend:latest`
- Port: `3000:5173` (Vite dev server)
- Target: `development` (in docker-compose.yml)
- Vite HMR is active - changes to `src/` files auto-reload

**Commands:**
```bash
cd /var/www/leema_react

# Restart container
docker-compose restart leema_frontend

# View logs
docker-compose logs -f leema_frontend

# Rebuild (if Dockerfile or dependencies changed)
docker-compose down
docker-compose build
docker-compose up -d

# Full rebuild (if something broke)
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

### Build Commands

```bash
# Development server (with hot-reload)
npm run dev

# Production build (with TypeScript checking)
npm run build

# Fast build (skip typecheck - used in Docker)
npm run build:fast

# Build with bundle analysis
npm run build:analyze

# Type checking only
npm run typecheck

# Linting
npm run lint
npm run lint:fix

# Code formatting
npm run format
npm run format:check

# Testing
npm run test              # Watch mode
npm run test:run          # Single run
npm run test:coverage     # With coverage
npm run test:ui           # Vitest UI
npm run test:e2e          # Playwright E2E tests

# Bundle size analysis
npm run size
npm run size:why
```

### Switching Between Dev and Production Modes

**To Production Mode (Nginx + static files):**
```bash
# Edit docker-compose.yml: target: production
docker-compose down
docker-compose build
docker-compose up -d
# Port becomes 3000:80 (Nginx)
```

**Back to Dev Mode:**
```bash
# Edit docker-compose.yml: target: development
docker-compose down
docker-compose up -d
# Port becomes 3000:5173 (Vite)
```

## Architecture

### Feature-Based Structure

The codebase uses feature-based organization under `src/features/`:

```
src/
├── features/
│   ├── auth/                 # Authentication (Google OAuth, JWT)
│   ├── admin-dashboard/      # Admin pages and components
│   ├── shop-dashboard/       # Shop owner pages and components
│   ├── user-dashboard/       # User pages (minimal - mobile app focus)
│   ├── products/             # Product management (admin + shop)
│   ├── orders/               # Order management (admin + shop)
│   ├── newsletters/          # Newsletter system (admin + shop)
│   ├── billing/              # Billing and top-up (shop only)
│   ├── analytics/            # Analytics dashboard (shop)
│   ├── payment/              # Payment success/cancel pages
│   ├── websocket/            # WebSocket real-time events
│   └── notifications/        # Notification system
├── shared/
│   ├── components/           # Reusable UI components
│   │   ├── ui/              # Basic UI elements (Button, Modal, etc.)
│   │   ├── forms/           # Form components (FormInput, FormSelect, etc.)
│   │   ├── layout/          # Layout components (Header, Sidebar, etc.)
│   │   ├── feedback/        # Feedback components (Alert, Badge, etc.)
│   │   └── charts/          # Chart components (Recharts wrappers)
│   ├── lib/
│   │   ├── api/             # API client (axios with interceptors)
│   │   ├── security/        # Security utilities (CSRF, sanitization, storage)
│   │   ├── utils/           # Utilities (logger, error-handler, cn)
│   │   ├── validation/      # Zod schemas
│   │   └── monitoring/      # Web vitals monitoring
│   ├── hooks/               # Custom React hooks
│   ├── types/               # Shared TypeScript types
│   └── constants/           # Constants and config
├── app/
│   └── router.tsx           # Route configuration (React Router v7)
├── tests/                   # Test setup and mocks
└── main.tsx                 # Entry point
```

### Key Architectural Patterns

**1. Feature Structure:**
Each feature follows this pattern:
```
features/{feature-name}/
├── pages/              # Page components (lazy-loaded)
├── components/         # Feature-specific components
├── services/           # API service layer
├── types/              # TypeScript types
├── hooks/              # Feature-specific hooks
├── store/              # State management (Zustand)
└── index.ts            # Public exports
```

**2. State Management:**
- **Zustand** for global state (auth, websocket)
- **React Query (@tanstack/react-query)** for server state
- **React Hook Form** for form state
- Session storage for auth tokens (security)

**3. Routing:**
- React Router v7 with lazy loading
- Protected routes with role-based access (`<ProtectedRoute>`)
- Error boundaries on all routes
- Routes defined in `src/app/router.tsx`

**4. API Communication:**
- Centralized axios client: `src/shared/lib/api/client.ts`
- Automatic token refresh (JWT + HttpOnly refresh cookie)
- Request/response interceptors for auth, CSRF, sanitization
- Retry logic with exponential backoff (3 retries for 5xx errors)
- Error handling via `handleError` utility

**5. WebSocket Integration:**
- WebSocket manager: `src/features/websocket/WebSocketManager.ts`
- Auto-reconnect (max 5 attempts, 5s delay)
- Heartbeat every 30s
- Event-based subscription system
- Client types: `user`, `shop`, `admin`
- Real-time events: orders, products, notifications, balance, WhatsApp, shops

**6. Security:**
- CSRF tokens on state-changing requests
- XSS prevention via DOMPurify sanitization
- JWT validation before adding to requests
- CSP headers (configured in Nginx)
- Secure storage (sessionStorage for tokens, HttpOnly cookies for refresh)
- Input sanitization on all form submissions

## Important Implementation Notes

### Authentication Flow

1. **Login:** Google OAuth → Backend → JWT access token + HttpOnly refresh cookie
2. **Token Storage:** Access token in sessionStorage (via Zustand persist)
3. **Token Refresh:** Automatic via interceptor when 401 received
4. **Logout:** Clear sessionStorage + backend clears HttpOnly cookie

**Auth Store:** `src/features/auth/store/authStore.ts`
- `login(user, accessToken, shop?)` - Set auth state
- `logout()` - Clear all auth state
- `setAccessToken(token)` - Update token after refresh

### WebSocket Connection Rules

**Connection is established when:**
- User is authenticated (`accessToken` exists)
- For shop owners: Shop must be `is_approved && is_active`
- Unapproved/inactive shops don't get WebSocket access

**Client Type Determination:**
```typescript
if (user.role === 'admin') → clientType = 'admin'
else if (shop && shop.is_approved && shop.is_active) → clientType = 'shop'
else → clientType = 'user'
```

**Connection:** `src/App.tsx` (useEffect with user/shop dependencies)

### API Request Pattern

**Using React Query (preferred):**
```typescript
import { useQuery, useMutation } from '@tanstack/react-query';
import { ordersService } from '@/features/orders/services/orders.service';

// Fetch data
const { data, isLoading, error } = useQuery({
  queryKey: ['orders', filters],
  queryFn: () => ordersService.getOrders(filters),
});

// Mutate data
const { mutate } = useMutation({
  mutationFn: ordersService.updateOrder,
  onSuccess: () => queryClient.invalidateQueries(['orders']),
});
```

**Service Layer Pattern:**
```typescript
// features/orders/services/orders.service.ts
import { apiRequest } from '@/shared/lib/api/client';
import { API_ENDPOINTS } from '@/shared/constants/api-endpoints';

export const ordersService = {
  getOrders: (params) =>
    apiRequest<OrdersResponse>(API_ENDPOINTS.ORDERS.LIST, 'GET', undefined, params),

  updateOrder: (id, data) =>
    apiRequest(API_ENDPOINTS.ORDERS.UPDATE(id), 'PUT', data),
};
```

### Path Aliases

Configured in `vite.config.ts` and `tsconfig.json`:
```typescript
@/                    → ./src/
@/features/          → ./src/features/
@/shared/            → ./src/shared/
@/assets/            → ./src/assets/
@/tests/             → ./src/tests/
```

### Bundle Optimization

Vite configured with manual chunking:
- `react-vendor` - React, React DOM, React Router
- `query-vendor` - TanStack React Query
- `form-vendor` - React Hook Form, Zod
- `charts-vendor` - Recharts
- `ui-vendor` - Lucide icons, DOMPurify, CVA, clsx
- `shop-features`, `admin-features`, `user-features`, `auth-features` - Feature chunks
- `shared-components` - Shared UI components

**Size Limits:** See `package.json` → `size-limit` array

### Form Handling

**Stack:** React Hook Form + Zod + Custom form components

```typescript
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { FormInput, FormSelect } from '@/shared/components/forms';

const schema = z.object({
  name: z.string().min(1, 'Required'),
  email: z.string().email('Invalid email'),
});

const { control, handleSubmit } = useForm({
  resolver: zodResolver(schema),
});

<FormInput control={control} name="name" label="Name" />
```

### Russian UI Translation

**Status:** Frontend UI is ~100% translated to Russian
- All user-facing text (labels, buttons, messages) in Russian
- Technical elements remain in English (variable names, function names, API keys)
- Comments can be in English or Russian
- Error messages from backend may be in English

### Testing

**Vitest** for unit/integration tests
**Playwright** for E2E tests
**Mock Service Worker (MSW)** for API mocking

Test setup: `src/tests/setup.ts`
API mocks: `src/tests/mocks/handlers.ts`

## Common Workflows

### Adding a New Feature

1. Create feature directory: `src/features/{feature-name}/`
2. Add subdirectories: `pages/`, `components/`, `services/`, `types/`
3. Create service layer for API calls
4. Add React Query hooks in page/component
5. Define routes in `src/app/router.tsx`
6. Add to feature's `index.ts` for exports
7. Use lazy loading for pages

### Adding a New API Endpoint

1. Add endpoint constant to `src/shared/constants/api-endpoints.ts`
2. Create/update service in feature's `services/` directory
3. Use `apiRequest` helper from `@/shared/lib/api/client`
4. Add TypeScript types for request/response

### Handling Errors

Use centralized error handler:
```typescript
import { handleError, createError } from '@/shared/lib/utils/error-handler';

// In try-catch
try {
  await someApiCall();
} catch (error) {
  handleError(error, {
    showToast: true,
    logError: true,
    context: { operation: 'someApiCall' },
  });
}

// Creating custom errors
throw createError.validation.required('Field name is required');
throw createError.network.connectionError();
```

### Adding WebSocket Event Handlers

1. Define event type in `src/features/websocket/types/events.ts`
2. Create hook in `src/features/websocket/hooks/use{Feature}Events.ts`:
```typescript
import { useWebSocketEvent } from './useWebSocketEvent';

export function useOrderEvents() {
  useWebSocketEvent('order:created', (data) => {
    // Handle event
    queryClient.invalidateQueries(['orders']);
  });
}
```
3. Call hook in page component

## Backend Integration

### API Base URL
- **Production:** `https://api.leema.kz`
- **Development (proxy):** `/api` → proxied to `https://api.leema.kz`
- Configured in `.env` and `vite.config.ts`

### Authentication
- **Access Token:** Short-lived JWT in sessionStorage
- **Refresh Token:** Long-lived HttpOnly cookie (not accessible to JS)
- Backend handles refresh token rotation

### CORS
Backend must allow:
- Origin: `https://www.leema.kz` or `http://localhost:3000`
- Credentials: `true` (for HttpOnly cookies)

## Performance Considerations

1. **Lazy Loading:** All route pages are lazy-loaded
2. **Code Splitting:** Manual chunks for vendors and features
3. **Image Optimization:** vite-plugin-imagemin (WebP, PNG, JPG)
4. **Compression:** Gzip + Brotli via vite-plugin-compression
5. **Virtual Scrolling:** @tanstack/react-virtual for long lists
6. **Debouncing:** Use `useDebounce` hook for search inputs

## Deployment

### Production Build Process

1. Docker builds using `builder` stage (multi-stage Dockerfile)
2. Runs `npm run build:fast` (skips typecheck for speed)
3. Vite generates optimized bundle in `dist/`
4. Nginx serves static files from `dist/`
5. Nginx proxies `/api` requests to backend

### Environment Variables (Production)

Set in `.env` and Docker build args:
- `VITE_API_URL=https://api.leema.kz`
- `VITE_WS_URL=wss://api.leema.kz/ws`
- `VITE_GOOGLE_CLIENT_ID={your-client-id}`
- `VITE_ENV=production`

## Troubleshooting

### Hot-Reload Not Working

```bash
# Check volumes are mounted
docker exec leema_frontend ls -la /app/src

# Check Vite is running
docker-compose logs leema_frontend | grep "VITE"

# Restart container
docker-compose restart leema_frontend
```

### Build Fails with Type Errors

Use fast build (skips typecheck):
```bash
npm run build:fast
# or
VITE_SKIP_TYPE_CHECK=true npm run build
```

Run typecheck separately:
```bash
npm run typecheck
```

### WebSocket Connection Issues

1. Check user is authenticated and has valid token
2. For shops: Verify `is_approved && is_active`
3. Check backend WebSocket endpoint is accessible
4. Review logs: `docker-compose logs -f leema_frontend`

### API Request Failures

1. Check network tab for request details
2. Verify token is present in Authorization header
3. Check backend logs for errors
4. Verify CORS settings on backend

## Git Workflow

Current branch: `main`

Recent work includes:
- Disabling caching for bug fixing
- Nginx configuration and optimization
- Russian UI translation (100% complete)
- Production deployment setup

When committing changes, ensure:
- Run `npm run lint:fix` before commit
- Run `npm run typecheck` to catch type errors
- Test locally in Docker container before pushing
