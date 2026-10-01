import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  root: 'admin', base: '/private-assets/', publicDir: false, plugins: [react()],
  build: { outDir: '../.private', emptyOutDir: true, assetsDir: 'assets', sourcemap: false },
})
