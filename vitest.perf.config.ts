import { defineConfig } from 'vitest/config';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const alias: Record<string, string> = {
  '@': path.resolve(__dirname, 'src'),
  '@docs': path.resolve(__dirname, 'src/docs'),
};

export default defineConfig({
  resolve: {
    alias,
  },
  test: {
    globals: true,
    environment: 'node',
    include: [
      'tests/perf/**/*.{test,spec}.{ts,tsx}',
    ],
    exclude: [
      'src/ui/**/*',
      'src/components/**/*',
      'src/pages/**/*',
      'src/stories/**/*',
      '**/*.rtl.test.tsx',
      '**/*.integration.test.{ts,tsx}',
    ],
  },
});
