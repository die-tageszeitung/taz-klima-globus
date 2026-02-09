import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from 'path';
import { fileURLToPath } from "url";

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
  plugins: [react()],  // Enable React support
  base: '',  // Use relative paths
  publicDir: 'public',  // Copy files from public/ to dist/
  resolve: {
    alias: {
      // Shortcut: @shared points to ../../shared
      '@shared': path.resolve(__dirname, '../../shared'),
      // Stub out WebGPU (we don't need it)
      'three/webgpu': path.resolve(__dirname, './webgpu-stub.js'),
      'three/tsl': path.resolve(__dirname, './tsl-stub.js'),
    },
  },
  build: {
    outDir: 'dist',  // Output folder
    minify: 'esbuild',  // Compress the code
  },
  server: {
    port: 3000,  // Dev server port
    open: true,  // Auto-open browser
  },
});
