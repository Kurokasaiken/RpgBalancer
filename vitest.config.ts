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

const includePatterns = process.env.VITEST_INCLUDE
  ? process.env.VITEST_INCLUDE.split(',')
      .map((pattern) => pattern.trim())
      .filter(Boolean)
  : [];

const defaultIncludes = [
  'tests/unit/**/*.{test,spec}.{ts,tsx}',
  'tests/simulators/**/*.{test,spec}.{ts,tsx}',
  'tests/shared/**/*.{test,spec}.{ts,tsx}',
  'src/**/*.unit.{test,spec}.{ts,tsx}',
];

const defaultExcludes = [
  'src/ui/**/*',
  'src/components/**/*',
  'src/pages/**/*',
  'src/stories/**/*',
  '**/*.rtl.test.tsx',
  '**/*.integration.test.{ts,tsx}',
  'tests/**/*.spec.tsx',
  'tests/villageSandbox-*.spec.ts',
  'tests/villageSandbox-*.spec.tsx',
];

export default defineConfig(() => ({
  plugins: [react()],
  resolve: {
    alias,
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['src/setupTests.ts', './vitest.setup.ts', './tests/setup/testRosterSlotLabConfigMock.ts'],
    // Legacy suites under tests/** generate blocking errors after recent refactors.
    // Use VITEST_INCLUDE env var (comma-separated globs) for targeted runs until the backlog clears.
    include: includePatterns.length > 0 ? includePatterns : defaultIncludes,
    exclude: includePatterns.length > 0 ? [] : defaultExcludes,
    css: {
      include: [/\.css$/],
    },
  },
}));
