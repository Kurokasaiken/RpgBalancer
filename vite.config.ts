import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import crypto from 'crypto';
import path from 'path';

const isVitest = process.env.VITEST === 'true';

// Polyfill for Node 16
if (!globalThis.crypto) {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  globalThis.crypto = crypto.webcrypto;
}

const alias: Record<string, string> = {
  '@': path.resolve(__dirname, './src'),
};

if (isVitest) {
  alias['@tauri-apps/api/fs'] = path.resolve(__dirname, './src/test/mocks/tauriFsMock.ts');
  alias['@tauri-apps/api/path'] = path.resolve(__dirname, './src/test/mocks/tauriPathMock.ts');
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias,
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['src/setupTests.ts'],
  },
});
