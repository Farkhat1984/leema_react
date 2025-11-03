import { http, HttpResponse } from 'msw'
import { API_ENDPOINTS } from '@/shared/constants/api-endpoints'

const BASE_URL = 'http://localhost:3000'

export const handlers = [
  // Auth endpoints
  http.get(`${BASE_URL}${API_ENDPOINTS.AUTH.ME}`, () => {
    return HttpResponse.json({
      success: true,
      data: {
        id: 1,
        email: 'test@example.com',
        name: 'Test User',
        role: 'user',
        avatar: null,
      },
    })
  }),

  http.post(`${BASE_URL}${API_ENDPOINTS.AUTH.LOGOUT}`, () => {
    return HttpResponse.json({
      success: true,
      message: 'Logged out successfully',
    })
  }),

  http.post(`${BASE_URL}${API_ENDPOINTS.AUTH.REFRESH}`, () => {
    return HttpResponse.json({
      success: true,
      data: {
        accessToken: 'new-test-access-token',
      },
    })
  }),

  // Shop endpoints
  http.get(`${BASE_URL}${API_ENDPOINTS.SHOPS.ME}`, () => {
    return HttpResponse.json({
      success: true,
      data: {
        id: 1,
        name: 'Test Shop',
        email: 'shop@example.com',
        status: 'approved',
        balance: 10000,
      },
    })
  }),

  // Products endpoints
  http.get(`${BASE_URL}${API_ENDPOINTS.PRODUCTS.BASE}`, () => {
    return HttpResponse.json({
      success: true,
      data: {
        products: [
          {
            id: 1,
            name: 'Test Product',
            price: 5000,
            status: 'approved',
            images: [],
          },
        ],
        pagination: {
          total: 1,
          page: 1,
          limit: 12,
        },
      },
    })
  }),

  // Categories endpoints
  http.get(`${BASE_URL}${API_ENDPOINTS.CATEGORIES.LIST}`, () => {
    return HttpResponse.json({
      success: true,
      data: [
        { id: 1, name: 'Category 1', icon: '👕' },
        { id: 2, name: 'Category 2', icon: '👗' },
      ],
    })
  }),

  // Admin dashboard
  http.get(`${BASE_URL}${API_ENDPOINTS.ADMIN.DASHBOARD}`, () => {
    return HttpResponse.json({
      success: true,
      data: {
        stats: {
          totalUsers: 100,
          totalShops: 50,
          totalProducts: 200,
          totalRevenue: 1000000,
        },
      },
    })
  }),
]
