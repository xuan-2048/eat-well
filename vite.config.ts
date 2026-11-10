import {defineConfig} from 'vite';
import react from '@vitejs/plugin-react';

const proxy = {'/api': {target: `http://127.0.0.1:${process.env.API_PORT ?? 8020}`, changeOrigin: false}};
export default defineConfig({
  plugins: [react()],
  envPrefix: [],
  server: {host: '127.0.0.1', port: 8011, strictPort: true, proxy},
  preview: {host: '127.0.0.1', port: 8011, strictPort: true, proxy},
  build: {outDir: 'dist'},
});
