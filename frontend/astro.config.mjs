// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
  vite: {
    plugins: [tailwindcss()],
    server: {
      proxy: {
        // Redirige las llamadas a la API al backend
        '/api': {
          target: 'http://localhost:5000',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api/, '/api'),
          ws: true,
        },
        // Redirige los enlaces cortos al backend
        '/r/': {
          target: 'http://localhost:5000',
          changeOrigin: true,
        },
      }
    }
  }
});