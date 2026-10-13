import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'jsdom',
    setupFiles: ['./test/setup.js'],
    include: ['test/**/*.spec.js'],
    exclude: ['node_modules/**'],
    coverage: {
      provider: 'v8',
      include: ['src/main.js'],
      exclude: ['node_modules/**', 'test/**', '**/*.spec.js']
    }
  }
})
