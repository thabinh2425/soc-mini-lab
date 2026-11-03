import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const apiTarget = loadEnv(mode, '.', 'SOC_').SOC_API_TARGET || 'http://127.0.0.1:8000'
  return {
  plugins: [react()],
  build: {
    rollupOptions: {
      output: { manualChunks: { charts: ['recharts'] } },
    },
  },
  server: { host: '127.0.0.1', proxy: { '/api': apiTarget } },
  preview: { host: '127.0.0.1', proxy: { '/api': apiTarget } },
  }
})

