import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
  plugins: [react()],
  base: '/taz-klima-globus/visualizations/24_annual_ecmwf_t2m/dist/',
  resolve: {
    alias: {
      '@shared': path.resolve(__dirname, '../../shared'),
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
