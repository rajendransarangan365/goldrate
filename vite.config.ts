import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api/local-ai': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/local-ai/, '')
      },
      '/api/goldprice-proxy': {
        target: 'https://api.goldprice.dev',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/goldprice-proxy/, '')
      }
    }
  }
});

