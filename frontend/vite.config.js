import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // Proxy API and WebSocket traffic to the backend so all requests are same-origin.
    // This makes the app work both locally AND via ngrok from other devices.
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
      '/socket.io': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        ws: true, // proxy WebSocket upgrade requests
      },
    },
    allowedHosts: [
      'localhost',
      '[IP_ADDRESS]',
      'postmeningeal-homeoplastic-janiyah.ngrok-free.dev',
      'buddy-chat-bwy9.onrender.com'
    ],
  },
})
