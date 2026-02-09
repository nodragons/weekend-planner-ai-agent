/**
 * ADK API Client for Weekend Planner
 * Handles session creation and streaming agent execution
 */

// Custom error classes for specific scenarios
export class QuotaExceededError extends Error {
  constructor(message) {
    super(message)
    this.name = 'QuotaExceededError'
    this.isQuotaError = true

    // Extract retry time if available
    const retryMatch = message.match(/retry in (\d+\.?\d*)s/)
    this.retryAfterSeconds = retryMatch ? parseFloat(retryMatch[1]) : null

    // Extract quota info
    const quotaMatch = message.match(/limit: (\d+)/)
    this.quotaLimit = quotaMatch ? parseInt(quotaMatch[1]) : null
  }
}

export class InvalidAPIKeyError extends Error {
  constructor(message) {
    super(message)
    this.name = 'InvalidAPIKeyError'
    this.isAPIKeyError = true
  }
}

export class SessionNotFoundError extends Error {
  constructor(message) {
    super(message)
    this.name = 'SessionNotFoundError'
    this.isSessionError = true
  }
}

export class RateLimitError extends Error {
  constructor(message, retryAfter = null) {
    super(message)
    this.name = 'RateLimitError'
    this.isRateLimitError = true
    this.retryAfterSeconds = retryAfter
  }
}

export class BackendTimeoutError extends Error {
  constructor(message) {
    super(message)
    this.name = 'BackendTimeoutError'
    this.isTimeoutError = true
  }
}

// In browser: use relative URLs so Vite proxy handles routing (avoids CORS)
// In tests: use full URL since tests don't go through Vite proxy
const ADK_BASE_URL = import.meta.env.VITE_ADK_API_URL ||
  (import.meta.env.MODE === 'test' ? 'http://localhost:8000' : '')
const APP_NAME = 'WeekendPlanner'

/**
 * Creates a new session with the ADK backend
 * @returns {Promise<string>} Session ID
 */
export async function createSession() {
  const userId = `user_${Date.now()}`
  const url = `${ADK_BASE_URL}/apps/${APP_NAME}/users/${userId}/sessions`

  try {
    console.log(`[ADK Client] Creating session: ${url}`)

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({})
    })

    console.log(`[ADK Client] Session response status: ${response.status}`)

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`[ADK Client] Session creation failed: ${response.status} ${response.statusText}`, errorText)
      throw new Error(`Failed to create session: ${response.status} ${response.statusText} - ${errorText}`)
    }

    const data = await response.json()
    console.log(`[ADK Client] Session created successfully:`, data.id)

    return {
      sessionId: data.id,  // ADK returns 'id' not 'session_id'
      userId: userId
    }
  } catch (error) {
    console.error('[ADK Client] Error creating session:', error)
    // Re-throw the actual error so users can see what went wrong
    throw error
  }
}

/**
 * Executes the agent with streaming responses via Server-Sent Events
 * @param {string} sessionId - The session ID
 * @param {string} userId - The user ID
 * @param {string} message - User message (e.g., "90210 kids are 5 and 8")
 * @returns {AsyncGenerator} Yields SSE events
 */
export async function* runAgentWithStreaming(sessionId, userId, message) {
  const url = `${ADK_BASE_URL}/run_sse`

  const requestBody = {
    app_name: APP_NAME,
    user_id: userId,
    session_id: sessionId,
    new_message: {
      role: 'user',
      parts: [
        { text: message }
      ]
    },
    streaming: true
  }

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'text/event-stream'
      },
      body: JSON.stringify(requestBody)
    })

    if (!response.ok) {
      throw new Error(`Agent execution failed: ${response.status} ${response.statusText}`)
    }

    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''

    while (true) {
      const { done, value } = await reader.read()

      if (done) {
        // Process any remaining data in buffer
        if (buffer.trim()) {
          const events = parseSSEBuffer(buffer)
          for (const event of events) {
            yield event
          }
        }
        break
      }

      buffer += decoder.decode(value, { stream: true })

      // Process complete SSE events
      const lines = buffer.split('\n')
      buffer = lines.pop() || '' // Keep incomplete line in buffer

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          try {
            const eventData = line.slice(6) // Remove 'data: ' prefix
            const event = JSON.parse(eventData)

            // Check for API errors and throw specific error types
            if (event.error) {
              const errorMsg = event.error.toLowerCase()
              const originalMsg = event.error

              // Quota exceeded errors (429)
              if (errorMsg.includes('429') || errorMsg.includes('resource_exhausted') ||
                  errorMsg.includes('quota') || errorMsg.includes('quota exceeded')) {
                throw new QuotaExceededError(originalMsg)
              }

              // Invalid API key errors (401, 403)
              if (errorMsg.includes('401') || errorMsg.includes('403') ||
                  errorMsg.includes('unauthorized') || errorMsg.includes('invalid api key') ||
                  errorMsg.includes('api key not valid') || errorMsg.includes('permission denied')) {
                throw new InvalidAPIKeyError(originalMsg)
              }

              // Session not found errors (404)
              if (errorMsg.includes('session not found') || errorMsg.includes('session does not exist')) {
                throw new SessionNotFoundError(originalMsg)
              }

              // Rate limiting errors (different from quota)
              if (errorMsg.includes('rate limit') || errorMsg.includes('too many requests')) {
                const retryMatch = originalMsg.match(/retry.*?(\d+\.?\d*)\s*s/)
                throw new RateLimitError(originalMsg, retryMatch ? parseFloat(retryMatch[1]) : null)
              }

              // Timeout errors
              if (errorMsg.includes('timeout') || errorMsg.includes('timed out') ||
                  errorMsg.includes('deadline exceeded')) {
                throw new BackendTimeoutError(originalMsg)
              }

              // Model not available errors
              if (errorMsg.includes('model not found') || errorMsg.includes('model not available') ||
                  errorMsg.includes('model is not supported')) {
                throw new Error(`Model Error: ${originalMsg}`)
              }

              // Generic API error
              throw new Error(`API Error: ${originalMsg}`)
            }

            // Parse and yield the event
            const parsedEvent = parseSSEEvent(event)
            if (parsedEvent) {
              yield parsedEvent
            }
          } catch (error) {
            // Re-throw all specific error types
            if (error instanceof QuotaExceededError ||
                error instanceof InvalidAPIKeyError ||
                error instanceof SessionNotFoundError ||
                error instanceof RateLimitError ||
                error instanceof BackendTimeoutError) {
              throw error
            }
            console.warn('Failed to parse SSE event:', error, line)
          }
        }
      }
    }
  } catch (error) {
    console.error('Error during agent execution:', error)
    throw new Error('Planning failed. Please try again.')
  }
}

/**
 * Parses remaining buffer for complete SSE events
 * @param {string} buffer - Buffer string
 * @returns {Array} Parsed events
 */
function parseSSEBuffer(buffer) {
  const events = []
  const lines = buffer.split('\n')

  for (const line of lines) {
    if (line.startsWith('data: ')) {
      try {
        const eventData = line.slice(6)
        const event = JSON.parse(eventData)
        const parsedEvent = parseSSEEvent(event)
        if (parsedEvent) {
          events.push(parsedEvent)
        }
      } catch (error) {
        console.warn('Failed to parse buffered event:', error)
      }
    }
  }

  return events
}

/**
 * Parses a single SSE event from ADK
 * @param {Object} event - Raw event object
 * @returns {Object|null} Parsed event with author and text
 */
function parseSSEEvent(event) {
  try {
    // Extract author (agent name)
    const author = event.author || 'unknown'

    // Extract text content from parts
    let text = ''
    if (event.content && event.content.parts && Array.isArray(event.content.parts)) {
      for (const part of event.content.parts) {
        if (part.text) {
          text += part.text
        }
      }
    }

    // Only return events with content
    if (!text.trim()) {
      return null
    }

    return {
      author: author,
      text: text,
      timestamp: new Date()
    }
  } catch (error) {
    console.error('Error parsing SSE event:', error, event)
    return null
  }
}

/**
 * Maps agent names to display-friendly names with emojis
 * @param {string} agentName - Internal agent name
 * @returns {string} Display name
 */
export function getAgentDisplayName(agentName) {
  const nameMap = {
    // Actual agent names from ADK (PascalCase)
    'PreprocessInputAgent': '📋 Input Processing',
    'WeatherAgent': '🌤️ Weather Check',
    'WeatherRouter': '🔀 Planning Router',
    'LocalActivitiesAgent': '🎯 Local Activities',
    'SpecialEventsAgent': '🎉 Special Events',
    'HomeActivitiesAgent': '🏠 Home Activities',
    'SummarizerAgent': '📝 Final Summary',
    // Legacy names (snake_case) - kept for backwards compatibility
    'preprocess_agent': '📋 Input Processing',
    'weather_agent': '🌤️ Weather Check',
    'weather_router_agent': '🔀 Planning Router',
    'local_activities_agent': '🎯 Local Activities',
    'special_events_agent': '🎉 Special Events',
    'home_activities_agent': '🏠 Home Activities',
    'summarizer_agent': '📝 Final Summary'
  }

  return nameMap[agentName] || `🤖 ${agentName}`
}

/**
 * Formats user input into expected message format
 * @param {string} zipCode - Zip code
 * @param {string} kidsAges - Comma-separated ages
 * @returns {string} Formatted message
 */
export function formatUserMessage(zipCode, kidsAges) {
  return `${zipCode} kids are ${kidsAges}`
}
