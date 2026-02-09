import { describe, it } from 'vitest'
import { createSession, runAgentWithStreaming } from '../services/adkClient.js'

describe('Debug Streaming Issues', () => {
  it('should stream ALL agent responses until completion', async () => {
    console.log('\n🔍 DEBUG: Full agent streaming test\n')

    const { sessionId, userId } = await createSession()
    console.log('Session:', sessionId)

    const message = '90210 kids are 5 and 8'
    console.log('Message:', message)

    let eventCount = 0
    let lastEventTime = Date.now()
    const agentsSeen = new Set()

    try {
      for await (const event of runAgentWithStreaming(sessionId, userId, message)) {
        eventCount++
        const now = Date.now()
        const timeSinceLastEvent = now - lastEventTime
        lastEventTime = now

        agentsSeen.add(event.author)

        console.log(`\n[Event ${eventCount}] +${timeSinceLastEvent}ms`)
        console.log(`  Agent: ${event.author}`)
        console.log(`  Text length: ${event.text.length} chars`)
        console.log(`  Preview: ${event.text.substring(0, 80).replace(/\n/g, ' ')}...`)

        // Check if this looks like a final summary
        if (event.author.includes('Summarizer') || event.author.includes('summarizer')) {
          console.log('\n✅ GOT SUMMARIZER AGENT!')
        }
      }

      console.log(`\n📊 Stream ended after ${eventCount} events`)
      console.log('Unique agents seen:', Array.from(agentsSeen))
      console.log('\n❌ PROBLEM: Stream ended prematurely!')
      console.log('Expected agents: PreprocessInputAgent, WeatherAgent, WeatherRouter, Activities, Summarizer')

    } catch (error) {
      console.error('\n❌ Stream error:', error.message)
      console.error('Stack:', error.stack)
      throw error
    }
  }, 120000)
})
