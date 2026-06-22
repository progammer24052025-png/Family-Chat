import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    allowedHosts: [
      'localhost',
      '[IP_ADDRESS]',
      'postmeningeal-homeoplastic-janiyah.ngrok-free.dev',
      'buddy-chat-bwy9.onrender.com'
    ],
  },
})
