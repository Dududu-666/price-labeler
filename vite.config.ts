import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  base: '/price-labeler/',
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
