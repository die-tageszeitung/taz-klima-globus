import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
  plugins: [react()],

  // Empty base for production deployment flexibility
  base: '',

  // Ensure public directory is correctly set
  publicDir: 'public',

  resolve: {
    alias: {
      // Alias to shared resources (if needed in future)
      '@shared': path.resolve(__dirname, '../../shared'),

      // CRITICAL: Stub out WebGPU modules to prevent errors
      // These are imported by newer Three.js but not needed
      'three/webgpu': path.resolve(__dirname, './webgpu-stub.js'),
      'three/tsl': path.resolve(__dirname, './tsl-stub.js'),
    },

    // Deduplicate these dependencies to prevent version conflicts
    dedupe: ['three', 'react', 'react-dom', 'react-globe.gl']
  },

  build: {
    outDir: 'dist',
    assetsDir: 'assets',

    // Use esbuild for faster minification
    minify: 'esbuild',

    // Disable sourcemaps for production (smaller bundle)
    sourcemap: false,

    // Increase chunk warning limit since globe.gl is large
    chunkSizeWarningLimit: 1000
  },

  server: {
    port: 3000,
    open: true, // Auto-open browser in dev
  },

  // Optimize dependencies for faster dev server
  optimizeDeps: {
    include: ['react-globe.gl', 'satellite.js', 'three']
  }
});
