import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [tailwindcss()],
  server: {
    host: true,
    port: 5173,
    proxy: {
      '/api': process.env.VITE_PROXY_API_TARGET || 'http://127.0.0.1:8080',
    },
  },
})
