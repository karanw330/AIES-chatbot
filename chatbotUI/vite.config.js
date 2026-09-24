import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  server:{
    proxy: {
      '/chat': {
        target: 'http://localhost:5000',
        changeOrigin: true,        // adjust the Host header for the target
        secure: false,             // ignore self-signed https certs (if needed)
      }
    }

  },
  plugins: [react()],
})
