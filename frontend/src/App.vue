<template>
  <div class="app">
    <div class="container">
      <PlannerForm
        :is-loading="isLoading"
        @submit="handleFormSubmit"
      />

      <StreamingResults
        :agent-outputs="agentMessages"
        :is-streaming="isStreaming"
        :current-agent-name="currentAgentName"
        :error="errorMessage"
        :error-type="errorType"
        :retry-after="retryAfter"
        @retry="handleRetry"
      />

      <footer class="footer">
        <p>Powered by Google ADK & Gemini 2.5 Flash</p>
        <p class="disclaimer">
          Recommendations are AI-generated. Always verify weather and activity details before planning.
        </p>
      </footer>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import PlannerForm from './components/PlannerForm.vue'
import StreamingResults from './components/StreamingResults.vue'
import {
  createSession,
  runAgentWithStreaming,
  formatUserMessage,
  QuotaExceededError,
  InvalidAPIKeyError,
  SessionNotFoundError,
  RateLimitError,
  BackendTimeoutError
} from './services/adkClient.js'

const isLoading = ref(false)
const isStreaming = ref(false)
const agentMessages = ref([])
const currentAgentName = ref(null)
const errorMessage = ref(null)
const errorType = ref(null) // 'quota' | 'network' | 'generic'
const retryAfter = ref(null) // Seconds until retry
const lastInput = ref(null)

async function handleFormSubmit({ zipCode, kidsAges }) {
  // Create a fresh session for each request to avoid state issues
  let sessionId, userId

  try {
    console.log('Creating new session...')
    const session = await createSession()
    sessionId = session.sessionId
    userId = session.userId
    console.log('Session created:', sessionId)
  } catch (error) {
    console.error('Failed to create session:', error)
    errorMessage.value = 'Could not connect to planner. Please ensure ADK backend is running.'
    return
  }

  // Clear previous results and errors
  agentMessages.value = []
  errorMessage.value = null
  errorType.value = null
  retryAfter.value = null
  currentAgentName.value = null
  isLoading.value = true
  isStreaming.value = true

  // Store input for retry
  lastInput.value = { zipCode, kidsAges }

  // Format message
  const message = formatUserMessage(zipCode, kidsAges)
  console.log('Submitting:', message)

  try {
    // Stream agent responses (using fresh session)
    const eventStream = runAgentWithStreaming(sessionId, userId, message)

    for await (const event of eventStream) {
      console.log('Agent event:', event.author, event.text.substring(0, 50) + '...')

      // Add to messages
      agentMessages.value.push({
        author: event.author,
        text: event.text,
        timestamp: event.timestamp
      })

      // Update current agent
      currentAgentName.value = event.author
    }

    console.log('Planning complete!')
  } catch (error) {
    console.error('Error during planning:', error)

    // Handle specific error types
    if (error instanceof QuotaExceededError || error.isQuotaError) {
      // Quota exceeded error
      errorType.value = 'quota'
      retryAfter.value = error.retryAfterSeconds
      errorMessage.value = `API quota exceeded (${error.quotaLimit || 20} requests/day limit). ` +
        `Get a new API key or wait for daily reset at midnight PT.`

    } else if (error instanceof InvalidAPIKeyError || error.isAPIKeyError) {
      // Invalid API key
      errorType.value = 'apikey'
      errorMessage.value = 'Invalid or missing Google API key. Please check your .env configuration and ensure you have a valid Gemini API key.'

    } else if (error instanceof SessionNotFoundError || error.isSessionError) {
      // Session not found (usually means we need to refresh)
      errorType.value = 'session'
      errorMessage.value = 'Session expired or not found. The page will reload automatically.'
      setTimeout(() => location.reload(), 2000)

    } else if (error instanceof RateLimitError || error.isRateLimitError) {
      // Rate limiting
      errorType.value = 'ratelimit'
      retryAfter.value = error.retryAfterSeconds
      errorMessage.value = `Too many requests. Please wait ${error.retryAfterSeconds ? Math.ceil(error.retryAfterSeconds) + ' seconds' : 'a moment'} before trying again.`

    } else if (error instanceof BackendTimeoutError || error.isTimeoutError) {
      // Timeout
      errorType.value = 'timeout'
      errorMessage.value = 'Request timed out. The agents took too long to respond. This may be due to high API load or complex queries.'

    } else if (error.message?.includes('Failed to fetch') || error.message?.includes('NetworkError')) {
      // Network error
      errorType.value = 'network'
      errorMessage.value = 'Could not connect to backend. Please ensure ADK is running on port 8000.'

    } else if (error.message?.includes('Model Error')) {
      // Model errors
      errorType.value = 'model'
      errorMessage.value = error.message

    } else {
      // Generic error
      errorType.value = 'generic'
      errorMessage.value = error.message || 'An unexpected error occurred. Please try again.'
    }
  } finally {
    isLoading.value = false
    isStreaming.value = false
    currentAgentName.value = null
  }
}

async function handleRetry() {
  if (lastInput.value) {
    await handleFormSubmit(lastInput.value)
  } else {
    errorMessage.value = null
  }
}
</script>

<style scoped>
.app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.container {
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.footer {
  margin-top: 48px;
  padding: 24px;
  text-align: center;
  color: rgba(255, 255, 255, 0.9);
  font-size: 14px;
}

.footer p {
  margin: 8px 0;
}

.disclaimer {
  font-size: 12px;
  opacity: 0.8;
  font-style: italic;
}

@media (max-width: 768px) {
  .container {
    padding: 16px;
  }
}
</style>
