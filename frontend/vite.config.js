import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// In development, /api requests are forwarded to the Django dev server,
// so the browser sees one origin and no CORS setup is needed (see WFH-15).
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': 'http://127.0.0.1:8000',
    },
  },
})
