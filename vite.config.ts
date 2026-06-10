import { defineConfig } from 'vite'
import react from 'itejs/plugin-react'
export default defineConfig({
  plugins: [react()],
  base: '/',
})
