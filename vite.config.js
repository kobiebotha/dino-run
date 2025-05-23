import { defineConfig } from 'vite';
export default defineConfig({
  root: '.',
  publicDir: 'assets',
  build: {
    rollupOptions: {
      input: 'index.html',
    },
    outDir: 'dist',
  },
  server: {
    open: true,
  },
}); 