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

/**
 * Dev-only: persist the live-tuned sea pattern values as the shipped default.
 *
 * The panel POSTs its current config here and the endpoint rewrites
 * DEFAULT_SEA_PATTERN_CONFIG in place, so a value the Director dialled in on the
 * real map survives a reload instead of living only in component state.
 */
function seaPatternDefaultsPlugin(): Plugin {
  const TARGET = path.resolve(dirname, 'src/ui/idleVillage/components/WorldSurfaceSeaPatternOverlay.tsx');
  const NUMERIC_KEYS = ['patternScale', 'lineOpacity', 'lineWidth', 'motionAmount', 'motionPeriod', 'motionAngle'] as const;
  const COLOR_KEYS = ['lineColor', 'baseColor'] as const;

  return {
    name: 'sea-pattern-defaults',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use('/__sea-pattern-default', (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405;
          res.end('Method Not Allowed');
          return;
        }
        let body = '';
        req.on('data', (chunk) => {
          body += chunk;
          if (body.length > 4096) req.destroy();
        });
        req.on('end', () => {
          try {
            const raw = JSON.parse(body) as Record<string, unknown>;
            // Whitelist + coerce: these values are written into a source file, so
            // nothing outside the known shape may reach the emitted literal.
            const lines: string[] = [];
            for (const key of NUMERIC_KEYS) {
              const value = Number(raw[key]);
              if (!Number.isFinite(value)) throw new Error(`invalid ${key}`);
              lines.push(`  ${key}: ${value},`);
            }
            for (const key of COLOR_KEYS) {
              const value = String(raw[key] ?? '');
              if (!/^#[0-9a-fA-F]{6}$/.test(value)) throw new Error(`invalid ${key}`);
              lines.push(`  ${key}: '${value}',`);
            }
            lines.push(`  motionEnabled: ${raw.motionEnabled === true},`);

            const source = fs.readFileSync(TARGET, 'utf-8');
            const marker = 'export const DEFAULT_SEA_PATTERN_CONFIG: SeaPatternConfig = {';
            const start = source.indexOf(marker);
            if (start === -1) throw new Error('DEFAULT_SEA_PATTERN_CONFIG not found');
            const end = source.indexOf('};', start);
            if (end === -1) throw new Error('unterminated DEFAULT_SEA_PATTERN_CONFIG');

            const next = `${source.slice(0, start)}${marker}\n${lines.join('\n')}\n${source.slice(end)}`;
            fs.writeFileSync(TARGET, next, 'utf-8');

            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ ok: true }));
          } catch (error) {
            res.statusCode = 400;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ ok: false, error: (error as Error).message }));
          }
        });
      });
    },
  };
}

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
        if (id.includes('QuestDecisionFeed') || id.includes('minimal-market')) {
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
    seaPatternDefaultsPlugin(),
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