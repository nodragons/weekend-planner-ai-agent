import { describe, it, expect } from 'vitest'
import { createSession, runAgentWithStreaming } from '../services/adkClient.js'

describe('Session Management Fix', () => {
  it('should create fresh session and get complete agent response', async () => {
    console.log('\n🔧 Testing session fix...\n')

    // Create a fresh session (like the frontend does now)
    const { sessionId, userId } = await createSession()
    console.log('✅ New session created:', sessionId)

    // Run agents
    const message = '90210 kids are 5 and 8'
    const agents = []
    let gotSummarizer = false

    try {
      for await (const event of runAgentWithStreaming(sessionId, userId, message)) {
        if (!agents.includes(event.author)) {
          agents.push(event.author)
          console.log(`  ✓ ${event.author}`)
        }

        if (event.author.toLowerCase().includes('summarizer')) {
          gotSummarizer = true
        }
      }

      console.log(`\n📊 Total unique agents: ${agents.length}`)
      console.log('Got Summarizer:', gotSummarizer ? '✅' : '❌')

      // This is the real test - did we get the summarizer?
      expect(gotSummarizer).toBe(true)
      expect(agents.length).toBeGreaterThanOrEqual(3)

      console.log('\n✅ TEST PASSED - Session fix working!')

    } catch (error) {
      console.error('\n❌ Error:', error.message)
      throw error
    }
  }, 120000)
})
