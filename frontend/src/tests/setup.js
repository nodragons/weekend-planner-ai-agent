// Test setup file
import { beforeAll, afterAll, afterEach } from 'vitest'

// Mock environment variables
beforeAll(() => {
  import.meta.env.VITE_ADK_API_URL = 'http://localhost:8000'
})
