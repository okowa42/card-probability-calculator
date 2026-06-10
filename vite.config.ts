import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/',
  server: {
    // ローカル開発用: /api/* を dev-api サーバーに転送
    proxy: {
      '/api': 'http://localhost:4000',
    },
  },
})
