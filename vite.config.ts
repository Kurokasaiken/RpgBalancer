import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import crypto from 'crypto';

// Polyfill for Node 16
if (!globalThis.crypto) {
  // @ts-ignore
  globalThis.crypto = crypto.webcrypto;
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['src/setupTests.ts'],
  },
});
