// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import netlify from "@astrojs/netlify";



export default defineConfig({
  output: "server",
  adapter: netlify(),
  vite: {
    plugins: [tailwindcss()],
    server: {
      proxy: {
        '/api': {
          target: 'http://localhost:5000',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api/, '/api'),
          ws: false,
        },
        '/r/': {
          target: 'http://localhost:5000',
          changeOrigin: true,
        },
      }
    }
  }
});