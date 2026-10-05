import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const API_PORT = process.env.PORT ?? '8490';

export default defineConfig({
  root: 'web',
  plugins: [react()],
  build: { outDir: '../dist', emptyOutDir: true },
  server: {
    port: 5190,
    host: true,
    proxy: {
      '/api': `http://localhost:${API_PORT}`,
      '/img': `http://localhost:${API_PORT}`,
    },
  },
});
