import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import { defineConfig } from 'vite'
import { nitro } from 'nitro/vite'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

export default defineConfig({
  plugins: [tanstackStart(), nitro(), tailwindcss()],
  resolve: {
    alias: {
      '~': path.resolve(__dirname, './src'),
      '@baml': path.resolve(__dirname, './baml_client'),
    },
  },
  optimizeDeps: {
    exclude: ['@boundaryml/baml'],
  },
  ssr: {
    external: ['@boundaryml/baml'],
  },
})
