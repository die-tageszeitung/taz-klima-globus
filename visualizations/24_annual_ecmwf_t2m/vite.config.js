import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
  plugins: [react()],
  base: './', // Use relative paths - works everywhere
  publicDir: 'public',
  resolve: {
    alias: {
      '@shared': path.resolve(__dirname, '../../shared'),
      'three/webgpu': path.resolve(__dirname, './webgpu-stub.js'),
      'three/tsl': path.resolve(__dirname, './tsl-stub.js'),
    },
    dedupe: ['three', 'react', 'react-dom', 'react-globe.gl']
  },
  build: {
    outDir: 'dist',
    minify: 'esbuild',
    sourcemap: false,
  },
  server: {
    port: 3000,
    open: true,
  },
});
