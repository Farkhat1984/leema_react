import { describe, it, expect, beforeEach } from 'vitest'
import { useAuthStore } from './authStore'
import type { User, Shop } from '../types'

describe('authStore', () => {
  // Reset store before each test
  beforeEach(() => {
    useAuthStore.setState({
      user: null,
      shop: null,
      accessToken: null,
      isAuthenticated: false,
      isLoading: false,
    })
    localStorage.clear()
  })

  describe('Initial State', () => {
    it('should have correct initial state', () => {
      const state = useAuthStore.getState()

      expect(state.user).toBeNull()
      expect(state.shop).toBeNull()
      expect(state.accessToken).toBeNull()
      expect(state.isAuthenticated).toBe(false)
      expect(state.isLoading).toBe(false)
    })
  })

  describe('login action', () => {
    it('should set user and token on login', () => {
      const mockUser: User = {
        id: '1',
        email: 'test@example.com',
        name: 'Test User',
        role: 'user',
        accountType: 'user',
        avatar: undefined,
        createdAt: new Date().toISOString(),
      }
      const mockToken = 'test-access-token'

      useAuthStore.getState().login(mockUser, mockToken)

      const state = useAuthStore.getState()
      expect(state.user).toEqual(mockUser)
      expect(state.accessToken).toBe(mockToken)
      expect(state.isAuthenticated).toBe(true)
      expect(state.isLoading).toBe(false)
      expect(state.shop).toBeNull()
    })

    it('should set shop data when provided', () => {
      const mockUser: User = {
        id: '1',
        email: 'shop@example.com',
        name: 'Shop Owner',
        role: 'shop_owner',
        accountType: 'shop',
        avatar: undefined,
        createdAt: new Date().toISOString(),
      }
      const mockShop: Shop = {
        id: '1',
        name: 'Test Shop',
        ownerId: '1',
        status: 'active',
        balance: 10000,
        createdAt: new Date().toISOString(),
      }
      const mockToken = 'test-access-token'

      useAuthStore.getState().login(mockUser, mockToken, mockShop)

      const state = useAuthStore.getState()
      expect(state.user).toEqual(mockUser)
      expect(state.shop).toEqual(mockShop)
      expect(state.accessToken).toBe(mockToken)
      expect(state.isAuthenticated).toBe(true)
    })
  })

  describe('logout action', () => {
    it('should clear all auth data on logout', () => {
      // First login
      const mockUser: User = {
        id: '1',
        email: 'test@example.com',
        name: 'Test User',
        role: 'user',
        accountType: 'user',
        avatar: undefined,
        createdAt: new Date().toISOString(),
      }
      useAuthStore.getState().login(mockUser, 'test-token')

      // Then logout
      useAuthStore.getState().logout()

      const state = useAuthStore.getState()
      expect(state.user).toBeNull()
      expect(state.shop).toBeNull()
      expect(state.accessToken).toBeNull()
      expect(state.isAuthenticated).toBe(false)
      expect(state.isLoading).toBe(false)
    })

    // Note: refresh token tests removed - refresh tokens are now managed via HttpOnly cookies
    // The backend automatically handles refresh token clearing on logout
  })

  describe('setAccessToken action', () => {
    it('should update access token', () => {
      const newToken = 'new-access-token'

      useAuthStore.getState().setAccessToken(newToken)

      expect(useAuthStore.getState().accessToken).toBe(newToken)
    })
  })

  describe('setUser action', () => {
    it('should update user data', () => {
      const initialUser: User = {
        id: '1',
        email: 'test@example.com',
        name: 'Test User',
        role: 'user',
        accountType: 'user',
        avatar: undefined,
        createdAt: new Date().toISOString(),
      }

      useAuthStore.getState().login(initialUser, 'token')

      const updatedUser: User = {
        ...initialUser,
        name: 'Updated User',
        avatar: 'https://example.com/avatar.jpg',
      }

      useAuthStore.getState().setUser(updatedUser)

      expect(useAuthStore.getState().user).toEqual(updatedUser)
    })
  })

  describe('setShop action', () => {
    it('should update shop data', () => {
      const mockShop: Shop = {
        id: '1',
        name: 'Test Shop',
        ownerId: '1',
        status: 'active',
        balance: 10000,
        createdAt: new Date().toISOString(),
      }

      useAuthStore.getState().setShop(mockShop)

      expect(useAuthStore.getState().shop).toEqual(mockShop)
    })

    it('should set shop to null', () => {
      const mockShop: Shop = {
        id: '1',
        name: 'Test Shop',
        ownerId: '1',
        status: 'active',
        balance: 10000,
        createdAt: new Date().toISOString(),
      }

      useAuthStore.getState().setShop(mockShop)
      expect(useAuthStore.getState().shop).toEqual(mockShop)

      useAuthStore.getState().setShop(null)
      expect(useAuthStore.getState().shop).toBeNull()
    })
  })

  describe('setLoading action', () => {
    it('should update loading state', () => {
      useAuthStore.getState().setLoading(true)
      expect(useAuthStore.getState().isLoading).toBe(true)

      useAuthStore.getState().setLoading(false)
      expect(useAuthStore.getState().isLoading).toBe(false)
    })
  })

  describe('Persistence', () => {
    it('should persist user and shop data', () => {
      const mockUser: User = {
        id: '1',
        email: 'test@example.com',
        name: 'Test User',
        role: 'user',
        accountType: 'user',
        avatar: undefined,
        createdAt: new Date().toISOString(),
      }
      const mockShop: Shop = {
        id: '1',
        name: 'Test Shop',
        ownerId: '1',
        status: 'active',
        balance: 10000,
        createdAt: new Date().toISOString(),
      }

      useAuthStore.getState().login(mockUser, 'test-token', mockShop)

      // Check localStorage has the persisted data
      const persistedData = localStorage.getItem('auth-storage')
      expect(persistedData).toBeTruthy()

      if (persistedData) {
        const parsed = JSON.parse(persistedData)
        expect(parsed.state.user).toEqual(mockUser)
        expect(parsed.state.shop).toEqual(mockShop)
        expect(parsed.state.isAuthenticated).toBe(true)

        // Access token should NOT be persisted (security)
        expect(parsed.state.accessToken).toBeUndefined()
      }
    })
  })
})
