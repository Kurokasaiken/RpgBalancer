import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const alias: Record<string, string> = {
  '@': path.resolve(__dirname, 'src'),
  '@docs': path.resolve(__dirname, 'src/docs'),
  '@/scripts': path.resolve(__dirname, 'scripts'),
};

const targetedSuites = ['src/ui/idleVillage/slots/**/*.test.{ts,tsx}'];

export default defineConfig(() => ({
  plugins: [react()],
  resolve: {
    alias,
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['src/setupTests.ts', './vitest.setup.ts'],
    include: targetedSuites,
    exclude: [
      'tests/legacy/**',
      'tests/**/*.rtl.test.tsx',
      'tests/**/*.integration.test.{ts,tsx}',
    ],
    css: {
      include: [/\.css$/],
    },
  },
}));
