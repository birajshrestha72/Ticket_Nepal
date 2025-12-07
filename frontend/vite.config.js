import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // Remove restrictive CORS headers to allow Firebase popup authentication
    // headers: {
    //   'Cross-Origin-Opener-Policy': 'same-origin-allow-popups',
    //   'Cross-Origin-Embedder-Policy': 'require-corp'
    // }
  }
})
