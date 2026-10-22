import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
export default defineConfig(({ mode }) => ({
  plugins: [react()],
  base: mode === 'pages' ? '/LebFlow/' : '/',
  define: { __LEBFLOW_API__: mode === 'api' },
  server: { proxy: { '/api': 'http://127.0.0.1:8000', '/sanctum': 'http://127.0.0.1:8000' } },
}));
