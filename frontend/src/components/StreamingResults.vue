<template>
  <div class="streaming-results">
    <div v-if="agentOutputs.length === 0 && !error" class="empty-state">
      <p class="empty-message">👆 Enter your zip code and kids' ages to get started!</p>
    </div>

    <div v-if="error" :class="['error-message', `error-${errorType}`]">
      <!-- Quota Error -->
      <div v-if="errorType === 'quota'" class="quota-error">
        <h3>🔒 API Quota Exceeded</h3>
        <p class="error-text">{{ error }}</p>

        <div class="quota-details">
          <div class="quota-info">
            <span class="icon">📊</span>
            <div>
              <strong>Free Tier Limit Reached</strong>
              <p>You've used all 20 requests for today</p>
            </div>
          </div>

          <div class="reset-info">
            <span class="icon">🕐</span>
            <div>
              <strong>Quota Resets</strong>
              <p>Midnight Pacific Time (daily)</p>
            </div>
          </div>
        </div>

        <div class="action-buttons">
          <a
            href="https://aistudio.google.com/apikey"
            target="_blank"
            class="primary-button"
          >
            🔑 Get New API Key
          </a>
          <button @click="$emit('retry')" class="secondary-button">
            🔄 Try Again
          </button>
          <button @click="location.reload()" class="secondary-button">
            ↻ Reset Page
          </button>
        </div>

        <div class="help-text">
          <p><strong>Quick Fix:</strong> Create a new API key in a new Google Cloud project to get fresh quota instantly.</p>
        </div>
      </div>

      <!-- Network Error -->
      <div v-else-if="errorType === 'network'" class="network-error">
        <h3>🌐 Connection Error</h3>
        <p class="error-text">{{ error }}</p>

        <div class="action-buttons">
          <button @click="$emit('retry')" class="primary-button">
            🔄 Try Again
          </button>
          <button @click="location.reload()" class="secondary-button">
            ↻ Reset Page
          </button>
        </div>

        <div class="help-text">
          <p><strong>Troubleshooting:</strong></p>
          <ul>
            <li>Check that ADK backend is running: <code>adk web</code></li>
            <li>Verify backend is on port 8000</li>
            <li>Check browser console for errors</li>
          </ul>
        </div>
      </div>

      <!-- Invalid API Key Error -->
      <div v-else-if="errorType === 'apikey'" class="apikey-error">
        <h3>🔑 Invalid API Key</h3>
        <p class="error-text">{{ error }}</p>

        <div class="action-buttons">
          <a href="https://aistudio.google.com/apikey" target="_blank" class="primary-button">
            🔑 Get API Key
          </a>
          <button @click="location.reload()" class="secondary-button">
            ↻ Reset Page
          </button>
        </div>

        <div class="help-text">
          <p><strong>How to fix:</strong></p>
          <ol>
            <li>Get API key from Google AI Studio</li>
            <li>Update <code>WeekendPlanner/.env</code> file</li>
            <li>Restart backend: <code>pkill -f 'adk web' && adk web</code></li>
          </ol>
        </div>
      </div>

      <!-- Rate Limit Error -->
      <div v-else-if="errorType === 'ratelimit'" class="ratelimit-error">
        <h3>⏱️ Rate Limited</h3>
        <p class="error-text">{{ error }}</p>

        <div class="action-buttons">
          <button @click="$emit('retry')" class="primary-button" :disabled="retryAfter > 0">
            {{ retryAfter ? `Wait ${Math.ceil(retryAfter)}s` : '🔄 Try Again' }}
          </button>
          <button @click="location.reload()" class="secondary-button">
            ↻ Reset Page
          </button>
        </div>
      </div>

      <!-- Timeout Error -->
      <div v-else-if="errorType === 'timeout'" class="timeout-error">
        <h3>⏰ Request Timeout</h3>
        <p class="error-text">{{ error }}</p>

        <div class="action-buttons">
          <button @click="$emit('retry')" class="primary-button">
            🔄 Try Again
          </button>
          <button @click="location.reload()" class="secondary-button">
            ↻ Reset Page
          </button>
        </div>

        <div class="help-text">
          <p><strong>Tips:</strong> Try simpler queries or wait a few minutes for API load to decrease.</p>
        </div>
      </div>

      <!-- Session Error -->
      <div v-else-if="errorType === 'session'" class="session-error">
        <h3>🔄 Session Expired</h3>
        <p class="error-text">{{ error }}</p>
        <p>Reloading page...</p>
      </div>

      <!-- Model Error -->
      <div v-else-if="errorType === 'model'" class="model-error">
        <h3>🤖 Model Error</h3>
        <p class="error-text">{{ error }}</p>

        <div class="action-buttons">
          <button @click="location.reload()" class="primary-button">
            ↻ Reset Page
          </button>
        </div>

        <div class="help-text">
          <p>Check that <code>gemini-2.5-flash</code> is available in your region and API key has access.</p>
        </div>
      </div>

      <!-- Generic Error -->
      <div v-else class="generic-error">
        <h3>❌ Error</h3>
        <p class="error-text">{{ error }}</p>

        <div class="action-buttons">
          <button @click="$emit('retry')" class="primary-button">
            🔄 Try Again
          </button>
          <button @click="location.reload()" class="secondary-button">
            ↻ Reset Page
          </button>
        </div>
      </div>
    </div>

    <div v-if="agentOutputs.length > 0" class="results-container" ref="resultsContainer">
      <div class="results-header">
        <h2 class="results-title">Your Weekend Plan</h2>
        <span class="agent-count">{{ agentOutputs.length }} agent{{ agentOutputs.length !== 1 ? 's' : '' }} responded</span>
      </div>

      <div class="outputs-list">
        <AgentOutput
          v-for="(output, index) in agentOutputs"
          :key="index"
          :agent-name="output.author"
          :output="output.text"
          :timestamp="output.timestamp"
        />

        <div v-if="isStreaming" class="loading-indicator">
          <div class="spinner"></div>
          <span>{{ currentAgentName || 'Processing' }}...</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, nextTick } from 'vue'
import AgentOutput from './AgentOutput.vue'

const props = defineProps({
  agentOutputs: {
    type: Array,
    required: true,
    default: () => []
  },
  isStreaming: {
    type: Boolean,
    default: false
  },
  currentAgentName: {
    type: String,
    default: null
  },
  error: {
    type: String,
    default: null
  },
  errorType: {
    type: String,
    default: null // 'quota' | 'network' | 'generic'
  },
  retryAfter: {
    type: Number,
    default: null
  }
})

defineEmits(['retry'])

const resultsContainer = ref(null)

// Auto-scroll to latest output
watch(() => props.agentOutputs.length, async () => {
  await nextTick()
  if (resultsContainer.value) {
    const lastOutput = resultsContainer.value.querySelector('.outputs-list > *:last-child')
    if (lastOutput) {
      lastOutput.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    }
  }
})
</script>

<style scoped>
.streaming-results {
  max-width: 800px;
  margin: 32px auto 0;
}

.empty-state {
  background: white;
  border-radius: 12px;
  padding: 48px 32px;
  text-align: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.empty-message {
  font-size: 16px;
  color: #718096;
  margin: 0;
}

.error-message {
  background: white;
  border-radius: 16px;
  padding: 32px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  text-align: left;
}

.error-quota {
  border: 3px solid #f59e0b;
}

.error-apikey {
  border: 3px solid #dc2626;
}

.error-ratelimit {
  border: 3px solid #f97316;
}

.error-timeout {
  border: 3px solid #8b5cf6;
}

.error-session {
  border: 3px solid #06b6d4;
}

.error-model {
  border: 3px solid #ec4899;
}

.error-network {
  border: 3px solid #ef4444;
}

.error-generic {
  border: 3px solid #6b7280;
}

.error-message h3 {
  margin: 0 0 16px 0;
  font-size: 24px;
  color: #1f2937;
}

.error-text {
  margin: 0 0 24px 0;
  font-size: 15px;
  color: #4b5563;
  line-height: 1.6;
}

.quota-details {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin-bottom: 24px;
  padding: 20px;
  background: #fef3c7;
  border-radius: 8px;
}

.quota-info, .reset-info {
  display: flex;
  gap: 12px;
  align-items: flex-start;
}

.quota-info .icon, .reset-info .icon {
  font-size: 24px;
  flex-shrink: 0;
}

.quota-info strong, .reset-info strong {
  display: block;
  font-size: 14px;
  color: #78350f;
  margin-bottom: 4px;
}

.quota-info p, .reset-info p {
  margin: 0;
  font-size: 13px;
  color: #92400e;
}

.action-buttons {
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.primary-button {
  flex: 1;
  padding: 12px 24px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  text-decoration: none;
  display: inline-block;
  text-align: center;
}

.primary-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.secondary-button {
  padding: 12px 20px;
  background: white;
  color: #4b5563;
  border: 2px solid #d1d5db;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.secondary-button:hover {
  border-color: #9ca3af;
  background: #f9fafb;
}

.help-text {
  padding: 16px;
  background: #f3f4f6;
  border-radius: 8px;
  font-size: 13px;
  color: #374151;
  line-height: 1.6;
}

.help-text strong {
  color: #1f2937;
}

.help-text ul,
.help-text ol {
  margin: 8px 0 0 0;
  padding-left: 20px;
}

.help-text li {
  margin: 4px 0;
}

.help-text code {
  background: #e5e7eb;
  padding: 2px 6px;
  border-radius: 4px;
  font-family: monospace;
  font-size: 12px;
}

.results-container {
  background: rgba(255, 255, 255, 0.95);
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
}

.results-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 2px solid #e2e8f0;
}

.results-title {
  font-size: 24px;
  font-weight: 700;
  color: #2d3748;
  margin: 0;
}

.agent-count {
  font-size: 14px;
  color: #718096;
  background: #edf2f7;
  padding: 6px 12px;
  border-radius: 20px;
  font-weight: 500;
}

.outputs-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.loading-indicator {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: #f7fafc;
  border-radius: 8px;
  color: #4a5568;
  font-size: 14px;
  font-weight: 500;
}

.spinner {
  width: 20px;
  height: 20px;
  border: 3px solid #e2e8f0;
  border-top-color: #667eea;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
