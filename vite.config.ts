import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import crypto from 'crypto';
import path from 'path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import type { Plugin } from 'vite';
const dirname = typeof __dirname !== 'undefined' ? __dirname : path.dirname(fileURLToPath(import.meta.url));

// Polyfill for Node 16
if (!globalThis.crypto) {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  globalThis.crypto = crypto.webcrypto;
}
const alias: Record<string, string> = {
  '@': path.resolve(dirname, 'src'),
  '@docs': path.resolve(dirname, 'src/docs')
};

const coverageDir = path.resolve(dirname, 'coverage');
const coverageTmpDir = path.join(coverageDir, '.tmp');
fs.mkdirSync(coverageTmpDir, { recursive: true });

const guardianStatsPlugin = (): Plugin => ({
  name: 'guardian-stats',
  generateBundle(_options, bundle) {
    const assets = Object.entries(bundle).map(([fileName, output]) => {
      const baseInfo = {
        fileName,
        type: output.type,
      };

      if (output.type === 'chunk') {
        return {
          ...baseInfo,
          size: Buffer.byteLength(output.code ?? '', 'utf8'),
          modules: Object.keys(output.modules ?? {}),
        };
      }

      const source = typeof output.source === 'string' ? Buffer.from(output.source, 'utf8') : output.source ?? Buffer.alloc(0);
      return {
        ...baseInfo,
        size: source.length,
      };
    });

    this.emitFile({
      type: 'asset',
      fileName: 'stats.json',
      source: JSON.stringify({
        generatedAt: new Date().toISOString(),
        assets,
      }, null, 2),
    });
  },
});

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [
    react(), 
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: null,
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
        globIgnores: ['**/wanderlust-mockup.html']
      },
      injectManifest: {
        // Wanderlust mockups and other design surfaces exceed the default 2 MiB cap
        maximumFileSizeToCacheInBytes: 6 * 1024 * 1024,
        globIgnores: ['**/wanderlust-mockup.html']
      },
      srcDir: 'src',
      filename: 'service-worker.ts',
      strategies: 'injectManifest'
    }),
    // Plugin to exclude problematic files from build
    {
      name: 'exclude-problematic-files',
      resolveId(id) {
        if (id.includes('QuestDecisionFeed')) {
          return 'virtual:empty-module';
        }
        return null;
      },
      load(id) {
        if (id === 'virtual:empty-module') {
          return 'export default {};';
        }
        return null;
      }
    },
    // Plugin to ignore playwright-report directory completely
    {
      name: 'block-playwright-report',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          if (req.url?.includes('playwright-report')) {
            res.statusCode = 404;
            res.end('Not Found');
            return;
          }
          next();
        });
      },
      resolveId(id) {
        if (id.includes('playwright-report')) {
          return false; // Don't resolve any modules from playwright-report
        }
        return null;
      },
      load(id) {
        if (id.includes('playwright-report')) {
          return ''; // Return empty content for any playwright-report files
        }
        return null;
      }
    },
    ...(process.env.GUARDIAN_BUILD_STATS === 'true' ? [guardianStatsPlugin()] : [])
  ],
  resolve: {
    alias
  },
  assetsInclude: ['**/*.md'],
  define: {
    __MINIMAL_UI_FROZEN__: process.env.MINIMAL_UI_FROZEN === 'true',
    'process.env': JSON.stringify(process.env),
  },
  server: {
    hmr: {
      overlay: false, // Disable HMR overlay to prevent playwright-report errors
    },
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        secure: false,
      },
    },
  },
  build: {
    copyPublicDir: true,
    rollupOptions: {
      external: mode === 'production' ? [
        // Exclude analytics and telemetry in production
        'src/analytics/**/*',
        'src/ui/tools/**/*',
        'src/__tests__/**/*',
        'tests/**/*',
        'scripts/**/*',
        'docs/**/*'
      ] : [],
      onwarn(warning, warn) {
        // Suppress warnings about QuestDecisionFeed component
        if (warning.code === 'MODULE_NOT_FOUND' && warning.id?.includes('QuestDecisionFeed')) {
          return;
        }
        warn(warning);
      }
    }
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['src/setupTests.ts'],
    include: [
      'tests/unit/balancing/stressTesting/**/*.{test,spec}.{js,ts,jsx,tsx}',
      'tests/unit/balancing/**/*.{test,spec}.{js,ts,jsx,tsx}',
      'src/api/**/*.{test,spec}.{js,ts,jsx,tsx}',
    ],
    coverage: {
      provider: 'v8',
      reportsDirectory: coverageDir,
      reporter: ['text', 'json-summary', 'html']
    }
  }
}));