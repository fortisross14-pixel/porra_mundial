import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Vercel sirve desde la raíz, así que NO se necesita 'base' (a diferencia de GitHub Pages).
// En desarrollo, /api se redirige al backend local de Vercel (vercel dev).
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': 'http://localhost:3000',
    },
  },
});
