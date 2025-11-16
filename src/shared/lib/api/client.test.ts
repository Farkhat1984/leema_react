/**
 * Integration Tests for API Client
 *
 * Tests authentication header injection, token refresh, CSRF protection,
 * request/response sanitization, and error handling with MSW
 */

import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { useAuthStore } from '@/features/auth/store/authStore';
import { getCSRFToken, setCSRFToken } from '../security/csrf';
import { API_ENDPOINTS } from '@/shared/constants/api-endpoints';

// Mock CONFIG before importing client
vi.mock('@/shared/constants/config', () => ({
  CONFIG: {
    API_URL: 'https://api.leema.kz',
    WS_URL: 'wss://api.leema.kz/ws',
    GOOGLE_CLIENT_ID: 'test-client-id',
    ENV: 'test',
  },
}));

import { apiClient, apiRequest } from './client';

const BASE_URL = 'https://api.leema.kz';

// Create MSW server for mocking API calls
const server = setupServer();

// Start server before all tests
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));

// Reset handlers after each test
afterEach(() => {
  server.resetHandlers();
  useAuthStore.setState({
    user: null,
    shop: null,
    accessToken: null,
    isAuthenticated: false,
    isLoading: false,
  });
  sessionStorage.clear();
});

// Close server after all tests
afterAll(() => server.close());

describe('API Client - Request Interceptor', () => {
  describe('Authentication Header Injection', () => {
    it('should add Bearer token to request headers when authenticated', async () => {
      const testToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.dozjgNryP4J3jVmNHl0w5N_XgL0n3I9PlFUP0THsR8U';
      useAuthStore.getState().setAccessToken(testToken);

      let capturedHeaders: Headers | undefined;

      server.use(
        http.get(`${BASE_URL}/api/test`, ({ request }) => {
          capturedHeaders = request.headers;
          return HttpResponse.json({ success: true });
        })
      );

      await apiRequest('/api/test');

      expect(capturedHeaders?.get('Authorization')).toBe(`Bearer ${testToken}`);
    });

    it('should not add Authorization header when not authenticated', async () => {
      let capturedHeaders: Headers | undefined;

      server.use(
        http.get(`${BASE_URL}/api/test`, ({ request }) => {
          capturedHeaders = request.headers;
          return HttpResponse.json({ success: true });
        })
      );

      await apiRequest('/api/test');

      expect(capturedHeaders?.get('Authorization')).toBeNull();
    });

    it('should not add invalid JWT tokens to headers', async () => {
      const invalidToken = 'invalid-token';
      useAuthStore.getState().setAccessToken(invalidToken);

      let capturedHeaders: Headers | undefined;

      server.use(
        http.get(`${BASE_URL}/api/test`, ({ request }) => {
          capturedHeaders = request.headers;
          return HttpResponse.json({ success: true });
        })
      );

      await apiRequest('/api/test');

      expect(capturedHeaders?.get('Authorization')).toBeNull();
    });
  });

  describe('CSRF Token Injection', () => {
    beforeEach(() => {
      // Initialize CSRF token
      setCSRFToken('a'.repeat(64)); // Valid 64-char hex string
    });

    it('should add CSRF token to POST requests', async () => {
      let capturedHeaders: Headers | undefined;

      server.use(
        http.post(`${BASE_URL}/api/test`, ({ request }) => {
          capturedHeaders = request.headers;
          return HttpResponse.json({ success: true });
        })
      );

      await apiRequest('/api/test', 'POST', { data: 'test' });

      expect(capturedHeaders?.get('X-CSRF-Token')).toBe('a'.repeat(64));
    });

    it('should add CSRF token to PUT requests', async () => {
      let capturedHeaders: Headers | undefined;

      server.use(
        http.put(`${BASE_URL}/api/test`, ({ request }) => {
          capturedHeaders = request.headers;
          return HttpResponse.json({ success: true });
        })
      );

      await apiRequest('/api/test', 'PUT', { data: 'test' });

      expect(capturedHeaders?.get('X-CSRF-Token')).toBe('a'.repeat(64));
    });

    it('should add CSRF token to PATCH requests', async () => {
      let capturedHeaders: Headers | undefined;

      server.use(
        http.patch(`${BASE_URL}/api/test`, ({ request }) => {
          capturedHeaders = request.headers;
          return HttpResponse.json({ success: true });
        })
      );

      await apiRequest('/api/test', 'PATCH', { data: 'test' });

      expect(capturedHeaders?.get('X-CSRF-Token')).toBe('a'.repeat(64));
    });

    it('should add CSRF token to DELETE requests', async () => {
      let capturedHeaders: Headers | undefined;

      server.use(
        http.delete(`${BASE_URL}/api/test`, ({ request }) => {
          capturedHeaders = request.headers;
          return HttpResponse.json({ success: true });
        })
      );

      await apiRequest('/api/test', 'DELETE');

      expect(capturedHeaders?.get('X-CSRF-Token')).toBe('a'.repeat(64));
    });

    it('should not add CSRF token to GET requests', async () => {
      let capturedHeaders: Headers | undefined;

      server.use(
        http.get(`${BASE_URL}/api/test`, ({ request }) => {
          capturedHeaders = request.headers;
          return HttpResponse.json({ success: true });
        })
      );

      await apiRequest('/api/test', 'GET');

      expect(capturedHeaders?.get('X-CSRF-Token')).toBeNull();
    });
  });

  describe('Request Body Sanitization', () => {
    it('should sanitize string values in request body', async () => {
      let capturedBody: any;

      server.use(
        http.post(`${BASE_URL}/api/test`, async ({ request }) => {
          capturedBody = await request.json();
          return HttpResponse.json({ success: true });
        })
      );

      await apiRequest('/api/test', 'POST', {
        name: '<script>alert("xss")</script>Test',
        description: 'Normal text with <div>html</div>',
      });

      // Sanitization removes < and > characters
      expect(capturedBody.name).not.toContain('<script>');
      expect(capturedBody.name).not.toContain('</script>');
      expect(capturedBody.description).not.toContain('<div>');
      expect(capturedBody.description).not.toContain('</div>');
    });

    it('should sanitize nested objects in request body', async () => {
      let capturedBody: any;

      server.use(
        http.post(`${BASE_URL}/api/test`, async ({ request }) => {
          capturedBody = await request.json();
          return HttpResponse.json({ success: true });
        })
      );

      await apiRequest('/api/test', 'POST', {
        user: {
          name: '<script>alert("xss")</script>',
          address: {
            street: '<div>Street</div>',
          },
        },
      });

      expect(capturedBody.user.name).not.toContain('<script>');
      expect(capturedBody.user.address.street).not.toContain('<div>');
    });

    it('should preserve non-string values in request body', async () => {
      let capturedBody: any;

      server.use(
        http.post(`${BASE_URL}/api/test`, async ({ request }) => {
          capturedBody = await request.json();
          return HttpResponse.json({ success: true });
        })
      );

      await apiRequest('/api/test', 'POST', {
        count: 42,
        isActive: true,
        price: 99.99,
        tags: ['tag1', 'tag2'],
      });

      expect(capturedBody.count).toBe(42);
      expect(capturedBody.isActive).toBe(true);
      expect(capturedBody.price).toBe(99.99);
      expect(capturedBody.tags).toEqual(['tag1', 'tag2']);
    });
  });

  describe('Security Headers', () => {
    it('should add X-Requested-With header', async () => {
      let capturedHeaders: Headers | undefined;

      server.use(
        http.get(`${BASE_URL}/api/test`, ({ request }) => {
          capturedHeaders = request.headers;
          return HttpResponse.json({ success: true });
        })
      );

      await apiRequest('/api/test');

      expect(capturedHeaders?.get('X-Requested-With')).toBe('XMLHttpRequest');
    });

    it('should add X-Client-Version header', async () => {
      let capturedHeaders: Headers | undefined;

      server.use(
        http.get(`${BASE_URL}/api/test`, ({ request }) => {
          capturedHeaders = request.headers;
          return HttpResponse.json({ success: true });
        })
      );

      await apiRequest('/api/test');

      expect(capturedHeaders?.get('X-Client-Version')).toBe('1.0.0');
    });

    it('should set Content-Type to application/json', async () => {
      let capturedHeaders: Headers | undefined;

      server.use(
        http.post(`${BASE_URL}/api/test`, ({ request }) => {
          capturedHeaders = request.headers;
          return HttpResponse.json({ success: true });
        })
      );

      await apiRequest('/api/test', 'POST', { data: 'test' });

      expect(capturedHeaders?.get('Content-Type')).toContain('application/json');
    });
  });
});

describe('API Client - Response Interceptor', () => {
  describe('Automatic Token Refresh on 401', () => {
    it('should refresh token and retry request on 401 error', async () => {
      const oldToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.dozjgNryP4J3jVmNHl0w5N_XgL0n3I9PlFUP0THsR8U';
      const newToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI5ODc2NTQzMjEwIn0.Kd4sF9jZ7qL8mN3pQ1rT5vW6xY2zA0bC4eD6fG8hH0I';

      useAuthStore.getState().setAccessToken(oldToken);

      let requestCount = 0;

      server.use(
        // First request returns 401
        http.get(`${BASE_URL}/api/protected`, () => {
          requestCount++;
          if (requestCount === 1) {
            return new HttpResponse(null, { status: 401 });
          }
          return HttpResponse.json({ data: 'protected data' });
        }),
        // Refresh endpoint returns new token
        http.post(`${BASE_URL}${API_ENDPOINTS.AUTH.REFRESH}`, () => {
          return HttpResponse.json({ accessToken: newToken });
        })
      );

      const result = await apiRequest('/api/protected');

      expect(requestCount).toBe(2); // Original request + retry
      expect(result).toEqual({ data: 'protected data' });
      expect(useAuthStore.getState().accessToken).toBe(newToken);
    });

    it('should queue multiple requests during token refresh', async () => {
      const oldToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.dozjgNryP4J3jVmNHl0w5N_XgL0n3I9PlFUP0THsR8U';
      const newToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI5ODc2NTQzMjEwIn0.Kd4sF9jZ7qL8mN3pQ1rT5vW6xY2zA0bC4eD6fG8hH0I';

      useAuthStore.getState().setAccessToken(oldToken);

      let requestCount = 0;

      server.use(
        http.get(`${BASE_URL}/api/endpoint1`, () => {
          requestCount++;
          if (requestCount <= 2) {
            return new HttpResponse(null, { status: 401 });
          }
          return HttpResponse.json({ data: 'endpoint1' });
        }),
        http.get(`${BASE_URL}/api/endpoint2`, () => {
          requestCount++;
          if (requestCount <= 2) {
            return new HttpResponse(null, { status: 401 });
          }
          return HttpResponse.json({ data: 'endpoint2' });
        }),
        http.post(`${BASE_URL}${API_ENDPOINTS.AUTH.REFRESH}`, () => {
          return HttpResponse.json({ accessToken: newToken });
        })
      );

      // Make parallel requests that will all get 401
      const [result1, result2] = await Promise.all([
        apiRequest('/api/endpoint1'),
        apiRequest('/api/endpoint2'),
      ]);

      expect(result1).toEqual({ data: 'endpoint1' });
      expect(result2).toEqual({ data: 'endpoint2' });
      expect(useAuthStore.getState().accessToken).toBe(newToken);
    });

    it('should logout user when refresh token fails', async () => {
      const oldToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.dozjgNryP4J3jVmNHl0w5N_XgL0n3I9PlFUP0THsR8U';

      useAuthStore.getState().setAccessToken(oldToken);
      useAuthStore.getState().login(
        {
          id: '1',
          email: 'test@example.com',
          name: 'Test',
          role: 'user',
          accountType: 'user',
          createdAt: new Date().toISOString()
        },
        oldToken
      );

      server.use(
        http.get(`${BASE_URL}/api/protected`, () => {
          return new HttpResponse(null, { status: 401 });
        }),
        // Refresh fails
        http.post(`${BASE_URL}${API_ENDPOINTS.AUTH.REFRESH}`, () => {
          return new HttpResponse(null, { status: 401 });
        })
      );

      try {
        await apiRequest('/api/protected');
      } catch {
        // Expected to fail
      }

      // User should be logged out
      expect(useAuthStore.getState().isAuthenticated).toBe(false);
      expect(useAuthStore.getState().user).toBeNull();
      expect(useAuthStore.getState().accessToken).toBeNull();
    });

    it('should not retry request that already has _retry flag', async () => {
      const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.dozjgNryP4J3jVmNHl0w5N_XgL0n3I9PlFUP0THsR8U';
      useAuthStore.getState().setAccessToken(token);

      let requestCount = 0;

      server.use(
        // Always return 401
        http.get(`${BASE_URL}/api/protected`, () => {
          requestCount++;
          return new HttpResponse(null, { status: 401 });
        }),
        http.post(`${BASE_URL}${API_ENDPOINTS.AUTH.REFRESH}`, () => {
          return HttpResponse.json({ accessToken: token });
        })
      );

      try {
        await apiRequest('/api/protected');
      } catch {
        // Expected to fail
      }

      // Should only try twice: original + one retry
      expect(requestCount).toBeLessThanOrEqual(2);
    });
  });

  describe('Error Handling', () => {
    it('should handle 400 Bad Request errors', async () => {
      server.use(
        http.get(`${BASE_URL}/api/test`, () => {
          return HttpResponse.json(
            { message: 'Bad request' },
            { status: 400 }
          );
        })
      );

      await expect(apiRequest('/api/test')).rejects.toThrow();
    });

    it('should handle 403 Forbidden errors', async () => {
      server.use(
        http.get(`${BASE_URL}/api/test`, () => {
          return HttpResponse.json(
            { message: 'Forbidden' },
            { status: 403 }
          );
        })
      );

      await expect(apiRequest('/api/test')).rejects.toThrow();
    });

    it('should handle 404 Not Found errors', async () => {
      server.use(
        http.get(`${BASE_URL}/api/test`, () => {
          return HttpResponse.json(
            { message: 'Not found' },
            { status: 404 }
          );
        })
      );

      await expect(apiRequest('/api/test')).rejects.toThrow();
    });

    it('should handle 500 Internal Server errors', async () => {
      server.use(
        http.get(`${BASE_URL}/api/test`, () => {
          return HttpResponse.json(
            { message: 'Internal server error' },
            { status: 500 }
          );
        })
      );

      await expect(apiRequest('/api/test')).rejects.toThrow();
    });

    it('should handle network errors (no response)', async () => {
      server.use(
        http.get(`${BASE_URL}/api/test`, () => {
          return HttpResponse.error();
        })
      );

      await expect(apiRequest('/api/test')).rejects.toThrow();
    });
  });

  describe('Retry Logic', () => {
    it('should not retry 4xx client errors', async () => {
      let requestCount = 0;

      server.use(
        http.get(`${BASE_URL}/api/test`, () => {
          requestCount++;
          return HttpResponse.json(
            { message: 'Bad request' },
            { status: 400 }
          );
        })
      );

      try {
        await apiRequest('/api/test');
      } catch {
        // Expected to fail
      }

      // Should only make one request (no retry for 4xx)
      expect(requestCount).toBe(1);
    });

    it('should handle 429 Rate Limit errors', async () => {
      server.use(
        http.get(`${BASE_URL}/api/test`, () => {
          return HttpResponse.json(
            { message: 'Too many requests' },
            { status: 429 }
          );
        })
      );

      await expect(apiRequest('/api/test')).rejects.toThrow();
    });
  });
});

describe('API Client - Generic Request Handler', () => {
  describe('apiRequest function', () => {
    it('should make successful GET request', async () => {
      server.use(
        http.get(`${BASE_URL}/api/users`, () => {
          return HttpResponse.json({ users: ['user1', 'user2'] });
        })
      );

      const result = await apiRequest('/api/users');

      expect(result).toEqual({ users: ['user1', 'user2'] });
    });

    it('should make successful POST request with data', async () => {
      server.use(
        http.post(`${BASE_URL}/api/users`, async ({ request }) => {
          const body = await request.json();
          return HttpResponse.json({ created: true, data: body });
        })
      );

      const result = await apiRequest('/api/users', 'POST', { name: 'John Doe' });

      expect(result).toHaveProperty('created', true);
    });

    it('should make successful PUT request', async () => {
      server.use(
        http.put(`${BASE_URL}/api/users/1`, async ({ request }) => {
          const body = await request.json();
          return HttpResponse.json({ updated: true, data: body });
        })
      );

      const result = await apiRequest('/api/users/1', 'PUT', { name: 'Jane Doe' });

      expect(result).toHaveProperty('updated', true);
    });

    it('should make successful DELETE request', async () => {
      server.use(
        http.delete(`${BASE_URL}/api/users/1`, () => {
          return HttpResponse.json({ deleted: true });
        })
      );

      const result = await apiRequest('/api/users/1', 'DELETE');

      expect(result).toEqual({ deleted: true });
    });

    it('should support query parameters', async () => {
      let capturedUrl = '';

      server.use(
        http.get(`${BASE_URL}/api/users`, ({ request }) => {
          capturedUrl = request.url;
          return HttpResponse.json({ users: [] });
        })
      );

      await apiRequest('/api/users', 'GET', undefined, { page: 1, limit: 10 });

      const url = new URL(capturedUrl);
      expect(url.searchParams.get('page')).toBe('1');
      expect(url.searchParams.get('limit')).toBe('10');
    });

    it('should support blob response type', async () => {
      server.use(
        http.get(`${BASE_URL}/api/download`, () => {
          return HttpResponse.arrayBuffer(new ArrayBuffer(8));
        })
      );

      const result = await apiRequest('/api/download', 'GET', undefined, undefined, {
        responseType: 'blob',
      });

      expect(result).toBeInstanceOf(ArrayBuffer);
    });

    it('should throw error and re-throw for caller handling', async () => {
      server.use(
        http.get(`${BASE_URL}/api/error`, () => {
          return HttpResponse.json(
            { message: 'Server error' },
            { status: 500 }
          );
        })
      );

      await expect(apiRequest('/api/error')).rejects.toThrow();
    });
  });

  describe('Timeout handling', () => {
    it('should timeout requests after configured time', async () => {
      server.use(
        http.get(`${BASE_URL}/api/slow`, async () => {
          // Simulate slow response
          await new Promise(resolve => setTimeout(resolve, 20000));
          return HttpResponse.json({ data: 'slow response' });
        })
      );

      // The default timeout is 15000ms, this should timeout
      await expect(apiRequest('/api/slow')).rejects.toThrow();
    }, 20000);
  });
});

describe('API Client - withCredentials', () => {
  it('should send requests with credentials for HttpOnly cookies', async () => {
    // This is configured at axios instance level
    expect(apiClient.defaults.withCredentials).toBe(true);
  });
});
