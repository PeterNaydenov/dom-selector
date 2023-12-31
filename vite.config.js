import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],
  build: { 
          lib: { entry: 'src/main.js', name: 'DomSelector', fileName: 'dom-selector', formats: [ 'es' ] },
    },
    
})
