/// <reference types="vitest/config" />
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react()],
  build: {
    chunkSizeWarningLimit: 1100,
  },
  test: {
    include: ['src/**/*.test.ts'],
    environment: 'node',
    passWithNoTests: true,
    coverage: {
      include: ['src/**/*.ts'],
      exclude: [
        'src/**/*.test.ts',
        'src/scene/textures.ts',
        'src/ui/download.ts',
        'src/state/useConfigurator.ts',
      ],
      reporter: ['text-summary', 'text'],
      thresholds: {
        lines: 90,
        statements: 90,
        functions: 90,
        branches: 85,
        'src/domain/**': { lines: 100, statements: 100, functions: 100, branches: 90 },
      },
    },
  },
})
