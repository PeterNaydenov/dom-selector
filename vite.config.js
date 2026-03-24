import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  build: { 
    lib: { 
      entry: 'src/main.js', 
      name: 'domSelector', 
      fileName: (format) => `dom-selector.${format}.js`,
      formats: [ 'umd', 'cjs', 'es' ]
    },
    rollupOptions: {
      output: {
        assetFileNames: 'dom-selector.[ext]'
      }
    }
  },
})