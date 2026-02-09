import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  server: {
    port: 5173,
    proxy: {
      '/apps': {
        target: 'http://localhost:8000',
        changeOrigin: true
      },
      '/run_sse': {
        target: 'http://localhost:8000',
        changeOrigin: true
      }
    }
  }
})
