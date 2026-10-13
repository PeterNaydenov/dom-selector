import { defineConfig } from 'vite'

export default defineConfig({
  build: { 
    lib: { 
      entry: 'src/main.js', 
      name: 'domSelector', 
      fileName: (format) => format === 'cjs' ? 'dom-selector.cjs' : `dom-selector.${format}.js`,
      formats: [ 'umd', 'cjs', 'es' ]
    },
    rollupOptions: {
      output: {
        assetFileNames: 'dom-selector.[ext]'
      }
    }
  },
})