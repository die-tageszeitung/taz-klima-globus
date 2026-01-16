// WebGPU stub
// This file prevents errors when Three.js tries to import WebGPU modules
// We don't need WebGPU for this visualization - WebGL is sufficient

// Export empty objects/classes for all WebGPU-related imports
export default {};

// GPU Constants
export const GPUShaderStage = {};
export const GPUBufferUsage = {};
export const GPUTextureUsage = {};

// WebGPU Renderer (stub class)
export class WebGPURenderer {
  constructor() {
    console.warn('WebGPURenderer stub - not actually rendering');
  }
  render() {}
  setSize() {}
  dispose() {}
}

// Storage Instanced Buffer Attribute (stub class)
export class StorageInstancedBufferAttribute {
  constructor() {
    console.warn('StorageInstancedBufferAttribute stub - not actually used');
  }
}
