<template>
  <div class="agent-output" :class="`agent-${agentType}`">
    <div class="agent-header">
      <h3 class="agent-name">{{ displayName }}</h3>
      <span class="timestamp">{{ formattedTime }}</span>
    </div>
    <div class="agent-content">
      <p v-for="(paragraph, index) in paragraphs" :key="index" class="paragraph">
        {{ paragraph }}
      </p>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { getAgentDisplayName } from '../services/adkClient.js'

const props = defineProps({
  agentName: {
    type: String,
    required: true
  },
  output: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    default: () => new Date()
  }
})

const displayName = computed(() => getAgentDisplayName(props.agentName))

const agentType = computed(() => {
  const typeMap = {
    // PascalCase names (from ADK)
    'PreprocessInputAgent': 'preprocess',
    'WeatherAgent': 'weather',
    'WeatherRouter': 'router',
    'LocalActivitiesAgent': 'activities',
    'SpecialEventsAgent': 'events',
    'HomeActivitiesAgent': 'home',
    'SummarizerAgent': 'summary',
    // Legacy snake_case names
    'preprocess_agent': 'preprocess',
    'weather_agent': 'weather',
    'weather_router_agent': 'router',
    'local_activities_agent': 'activities',
    'special_events_agent': 'events',
    'home_activities_agent': 'home',
    'summarizer_agent': 'summary'
  }
  return typeMap[props.agentName] || 'default'
})

const formattedTime = computed(() => {
  return props.timestamp.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
})

const paragraphs = computed(() => {
  return props.output
    .split('\n')
    .filter(p => p.trim().length > 0)
})
</script>

<style scoped>
.agent-output {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  border-left: 4px solid #cbd5e0;
  transition: all 0.3s;
  animation: slideIn 0.3s ease-out;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.agent-output:hover {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
}

.agent-preprocess {
  border-left-color: #4299e1;
}

.agent-weather {
  border-left-color: #48bb78;
}

.agent-router {
  border-left-color: #ed8936;
}

.agent-activities {
  border-left-color: #9f7aea;
}

.agent-events {
  border-left-color: #f56565;
}

.agent-home {
  border-left-color: #38b2ac;
}

.agent-summary {
  border-left-color: #667eea;
  background: linear-gradient(135deg, #f7faff 0%, #fff5f7 100%);
}

.agent-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  padding-bottom: 12px;
  border-bottom: 1px solid #e2e8f0;
}

.agent-name {
  font-size: 16px;
  font-weight: 600;
  color: #2d3748;
  margin: 0;
}

.timestamp {
  font-size: 12px;
  color: #a0aec0;
  font-family: monospace;
}

.agent-content {
  color: #4a5568;
  line-height: 1.6;
}

.paragraph {
  margin: 0 0 12px 0;
}

.paragraph:last-child {
  margin-bottom: 0;
}
</style>
