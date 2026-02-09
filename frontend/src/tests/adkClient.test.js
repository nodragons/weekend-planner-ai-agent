import { describe, it, expect, beforeAll } from 'vitest'
import {
  createSession,
  formatUserMessage,
  getAgentDisplayName
} from '../services/adkClient.js'

describe('ADK Client Integration Tests', () => {
  describe('Session Creation', () => {
    it('should create a session and return sessionId and userId', async () => {
      try {
        const result = await createSession()

        console.log('Session creation result:', result)

        expect(result).toBeDefined()
        expect(result.sessionId).toBeDefined()
        expect(result.userId).toBeDefined()
        expect(typeof result.sessionId).toBe('string')
        expect(typeof result.userId).toBe('string')
        expect(result.userId).toMatch(/^user_\d+$/)

        console.log('✅ Session created successfully:', result.sessionId)
      } catch (error) {
        console.error('❌ Session creation failed:', error.message)
        throw error
      }
    }, 10000)

    it('should create unique sessions on multiple calls', async () => {
      try {
        const session1 = await createSession()
        const session2 = await createSession()

        expect(session1.sessionId).not.toBe(session2.sessionId)
        expect(session1.userId).not.toBe(session2.userId)

        console.log('✅ Multiple unique sessions created')
      } catch (error) {
        console.error('❌ Multiple session creation failed:', error.message)
        throw error
      }
    }, 10000)
  })

  describe('User Message Formatting', () => {
    it('should format user message correctly', () => {
      const message = formatUserMessage('90210', '5,8')
      expect(message).toBe('90210 kids are 5,8')
    })

    it('should handle different age formats', () => {
      expect(formatUserMessage('90210', '7, 10')).toBe('90210 kids are 7, 10')
      expect(formatUserMessage('12345', '3')).toBe('12345 kids are 3')
    })
  })

  describe('Agent Display Names', () => {
    it('should map PascalCase agent names to display names', () => {
      expect(getAgentDisplayName('PreprocessInputAgent')).toBe('📋 Input Processing')
      expect(getAgentDisplayName('WeatherAgent')).toBe('🌤️ Weather Check')
      expect(getAgentDisplayName('WeatherRouter')).toBe('🔀 Planning Router')
      expect(getAgentDisplayName('LocalActivitiesAgent')).toBe('🎯 Local Activities')
      expect(getAgentDisplayName('SpecialEventsAgent')).toBe('🎉 Special Events')
      expect(getAgentDisplayName('HomeActivitiesAgent')).toBe('🏠 Home Activities')
      expect(getAgentDisplayName('SummarizerAgent')).toBe('📝 Final Summary')
    })

    it('should handle legacy snake_case agent names', () => {
      expect(getAgentDisplayName('preprocess_agent')).toBe('📋 Input Processing')
      expect(getAgentDisplayName('weather_agent')).toBe('🌤️ Weather Check')
    })

    it('should handle unknown agent names', () => {
      const result = getAgentDisplayName('unknown_agent')
      expect(result).toMatch(/^🤖/)
    })
  })
})

describe('ADK Backend Health Check', () => {
  it('should verify backend is running', async () => {
    try {
      const response = await fetch('http://localhost:8000/')
      console.log('Backend health check:', response.status)
      expect(response).toBeDefined()
      console.log('✅ Backend is responding')
    } catch (error) {
      console.error('❌ Backend health check failed:', error.message)
      throw new Error('ADK backend is not running on port 8000')
    }
  })

  it('should verify WeekendPlanner app exists', async () => {
    try {
      const userId = `test_user_${Date.now()}`
      const response = await fetch(
        `http://localhost:8000/apps/WeekendPlanner/users/${userId}/sessions`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({})
        }
      )

      expect(response.ok).toBe(true)

      const data = await response.json()
      console.log('Session response structure:', Object.keys(data))
      console.log('✅ WeekendPlanner app is accessible')

      // Verify response structure
      expect(data).toHaveProperty('id')
      expect(data).toHaveProperty('appName')
      expect(data.appName).toBe('WeekendPlanner')
    } catch (error) {
      console.error('❌ WeekendPlanner app check failed:', error.message)
      throw error
    }
  })
})
