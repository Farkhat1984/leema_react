/// <reference types="vitest/globals" />
import { setupServer } from 'msw/node'
import { handlers } from './handlers'

// Setup MSW server with default handlers
export const server = setupServer(...handlers)

// Start server before all tests
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))

// Reset handlers after each test
afterEach(() => server.resetHandlers())

// Close server after all tests
afterAll(() => server.close())
