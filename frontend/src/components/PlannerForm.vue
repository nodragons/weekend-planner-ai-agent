<template>
  <div class="planner-form">
    <h1 class="title">Weekend Planner 🎉</h1>
    <p class="subtitle">Find perfect family activities based on weather and your kids' ages</p>

    <form @submit.prevent="handleSubmit" class="form">
      <div class="form-group">
        <label for="zipCode" class="label">
          Zip Code
          <span class="tooltip" title="Enter your 5-digit zip code">❔</span>
        </label>
        <input
          id="zipCode"
          v-model="zipCode"
          type="text"
          placeholder="90120"
          maxlength="5"
          pattern="[0-9]{5}"
          class="input"
          :disabled="isLoading"
          required
        />
      </div>

      <div class="form-group">
        <label for="kidsAges" class="label">
          Kids' Ages
          <span class="tooltip" title="Enter ages separated by commas (e.g., 5,8 or 7, 10)">❔</span>
        </label>
        <input
          id="kidsAges"
          v-model="kidsAges"
          type="text"
          placeholder="5,8"
          class="input"
          :disabled="isLoading"
          required
        />
      </div>

      <button
        type="submit"
        class="submit-button"
        :disabled="isLoading || !isFormValid"
      >
        <span v-if="!isLoading">Plan My Weekend 🚀</span>
        <span v-else>Planning... ⏳</span>
      </button>
    </form>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  isLoading: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['submit'])

const zipCode = ref('90120')
const kidsAges = ref('5,8')

const isFormValid = computed(() => {
  const zipValid = /^[0-9]{5}$/.test(zipCode.value.trim())
  const agesValid = kidsAges.value.trim().length > 0
  return zipValid && agesValid
})

function handleSubmit() {
  if (!isFormValid.value || props.isLoading) {
    return
  }

  emit('submit', {
    zipCode: zipCode.value.trim(),
    kidsAges: kidsAges.value.trim()
  })
}
</script>

<style scoped>
.planner-form {
  background: white;
  border-radius: 16px;
  padding: 32px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
  max-width: 500px;
  margin: 0 auto;
}

.title {
  font-size: 32px;
  font-weight: 700;
  color: #2d3748;
  margin-bottom: 8px;
  text-align: center;
}

.subtitle {
  font-size: 14px;
  color: #718096;
  text-align: center;
  margin-bottom: 32px;
  line-height: 1.5;
}

.form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.label {
  font-size: 14px;
  font-weight: 600;
  color: #4a5568;
  display: flex;
  align-items: center;
  gap: 6px;
}

.tooltip {
  cursor: help;
  font-size: 12px;
  opacity: 0.6;
}

.input {
  padding: 12px 16px;
  border: 2px solid #e2e8f0;
  border-radius: 8px;
  font-size: 16px;
  transition: all 0.2s;
  font-family: inherit;
}

.input:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.input:disabled {
  background-color: #f7fafc;
  cursor: not-allowed;
  opacity: 0.6;
}

.submit-button {
  padding: 14px 24px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  margin-top: 8px;
}

.submit-button:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.submit-button:active:not(:disabled) {
  transform: translateY(0);
}

.submit-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>
