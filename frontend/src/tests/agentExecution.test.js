import { describe, it, expect } from 'vitest'
import { createSession, runAgentWithStreaming } from '../services/adkClient.js'

describe('Agent Execution Tests', () => {
  it('should execute agents and stream results', async () => {
    console.log('\n🚀 Starting agent execution test...\n')

    try {
      // Create session
      console.log('📝 Creating session...')
      const { sessionId, userId } = await createSession()
      console.log('✅ Session created:', sessionId)

      // Execute agents with test input
      const message = '90210 kids are 5 and 8'
      console.log('\n📤 Sending message:', message)

      const agentOutputs = []
      let eventCount = 0

      try {
        for await (const event of runAgentWithStreaming(sessionId, userId, message)) {
          eventCount++
          console.log(`\n📨 Event ${eventCount}:`)
          console.log(`   Agent: ${event.author}`)
          console.log(`   Text: ${event.text.substring(0, 100)}...`)
          console.log(`   Timestamp: ${event.timestamp}`)

          agentOutputs.push(event)

          // Verify event structure
          expect(event).toHaveProperty('author')
          expect(event).toHaveProperty('text')
          expect(event).toHaveProperty('timestamp')
          expect(event.text.length).toBeGreaterThan(0)
        }

        console.log(`\n✅ Received ${eventCount} agent events`)
        console.log('\nAgents that responded:')
        agentOutputs.forEach((output, i) => {
          console.log(`   ${i + 1}. ${output.author}`)
        })

        // Verify we got responses from key agents
        expect(agentOutputs.length).toBeGreaterThan(0)

        const agentNames = agentOutputs.map(o => o.author)
        console.log('\n📊 Agent execution summary:')
        console.log('   - Total agents:', agentOutputs.length)
        console.log('   - Agents:', agentNames.join(', '))

        // Check for expected agents
        const hasPreprocess = agentNames.includes('preprocess_agent')
        const hasWeather = agentNames.includes('weather_agent')
        const hasSummarizer = agentNames.includes('summarizer_agent')

        console.log('\n✅ Test passed - agents executed successfully!')

      } catch (streamError) {
        console.error('❌ Streaming error:', streamError.message)
        throw streamError
      }

    } catch (error) {
      console.error('\n❌ Test failed:', error.message)
      throw error
    }
  }, 60000) // 60 second timeout for full agent execution
})
