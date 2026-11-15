import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// the dev server proxies /api to the express server so the browser never sees the key
export default defineConfig({
  plugins: [react()],
  server: { proxy: { '/api': 'http://localhost:3001' } },
});
