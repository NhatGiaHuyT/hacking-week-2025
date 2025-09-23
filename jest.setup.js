import '@testing-library/jest-dom'

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
    }
  },
  useSearchParams() {
    return new URLSearchParams()
  },
  usePathname() {
    return ''
  },
}))

// Mock environment variables
process.env.NEXTAUTH_URL = 'http://localhost:3000'
process.env.NEXTAUTH_SECRET = 'test-secret'
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test'
process.env.OPENAI_API_KEY = 'test-key'
process.env.PINECONE_API_KEY = 'test-key'
process.env.PINECONE_INDEX_NAME = 'test-index'
process.env.JWT_SECRET = 'test-secret'

// Global test utilities
global.fetch = jest.fn()

// Suppress console warnings in tests
const originalConsoleError = console.error
beforeAll(() => {
  console.error = (...args) => {
    if (
      typeof args[0] === 'string' &&
      args[0].includes('Warning: ReactDOM.render is deprecated')
    ) {
      return
    }
    originalConsoleError.apply(console, args)
  }
})

afterAll(() => {
  console.error = originalConsoleError
})
