import { defineConfig } from 'vitest/config';

// Só a lógica pura (roteiro frame → tempo); a cena 3D é conferida no render.
export default defineConfig({ test: { include: ['src/**/*.test.ts'], environment: 'node' } });
