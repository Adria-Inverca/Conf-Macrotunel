import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // Si tu GitHub Pages sirve desde una subcarpeta del repo, ajusta base:
  // base: '/nombre-de-tu-repo/',
  base: './',
  build: {
    outDir: 'dist',
  }
})
