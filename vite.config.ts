import { defineConfig } from 'vitest/config';
import { loadEnv } from 'vite';
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

/**
 * Dev-only: bake the /game Tuning panel values into the shipped defaults (R-181).
 *
 * The panel already autosaves overrides to `hud_tuning_v1` (PersistenceService),
 * but those live in one browser's storage. «Save» POSTs the effective values
 * here and the endpoint rewrites the source constants — `worldDressing.motion`
 * and `worldDressing.seabed` in gameFrameConfig.ts, `DEFAULT_MAP_TUNE` in
 * PixiWorldMap.tsx, `DEFAULT_HUD_BAND_PX` in hudBand.ts — so what the Director
 * dialled in IS the default on every surface, browser and session.
 */
function hudTuningDefaultsPlugin(): Plugin {
  const GAME_FRAME_CONFIG = path.resolve(dirname, 'src/balancing/config/idleVillage/gameFrameConfig.ts');
  const MAP_TUNE_FILE = path.resolve(dirname, 'src/ui/idleVillage/pixiSpike/PixiWorldMap.tsx');
  const HUD_BAND_FILE = path.resolve(dirname, 'src/ui/idleVillage/skins/primitives/hudBand.ts');
  const MOTION_KEYS = [
    'cloudShadowOpacity', 'cloudShadowOffsetX', 'cloudShadowOffsetY', 'cloudSpeed',
    'seaMotionAmount', 'seaMotionPeriod', 'seaLineOpacity', 'foamStrength', 'foamCrestSpeed',
  ] as const;
  const MAP_TUNE_KEYS = [
    'cloudParallax', 'cloudMorph', 'smokeAmount', 'wonderEveryS', 'deepSeaFadePx',
    'forestSway', 'forestSwaySpeed', 'regionLinePx', 'regionHoverDelayS', 'markSpacingPx',
  ] as const;

  /** Coerces one tuning value to a finite number or throws — nothing else may reach the emitted literal. */
  const num = (values: Record<string, unknown>, key: string): number => {
    const value = Number(values[key]);
    if (!Number.isFinite(value)) throw new Error(`invalid ${key}`);
    return value;
  };

  return {
    name: 'hud-tuning-defaults',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use('/__hud-tuning-default', (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405;
          res.end('Method Not Allowed');
          return;
        }
        let body = '';
        req.on('data', (chunk) => {
          body += chunk;
          if (body.length > 8192) req.destroy();
        });
        req.on('end', () => {
          try {
            const values = (JSON.parse(body) as { values?: Record<string, unknown> }).values ?? {};

            // worldDressing.motion + worldDressing.seabed: single-line literals inside DEFAULT_GAME_FRAME_CONFIG.
            let frameConfig = fs.readFileSync(GAME_FRAME_CONFIG, 'utf-8');
            const motionLiteral = `motion: { ${MOTION_KEYS.map((key) => `${key}: ${num(values, key)}`).join(', ')} }`;
            if (!/motion: \{[^}]*\}/.test(frameConfig)) throw new Error('worldDressing.motion literal not found');
            frameConfig = frameConfig.replace(/motion: \{[^}]*\}/, motionLiteral);
            const seabedLiteral = `seabed: { opacity: ${num(values, 'seabedOpacity')}, parallax: ${num(values, 'seabedParallax')} }`;
            if (!/seabed: \{[^}]*\}/.test(frameConfig)) throw new Error('worldDressing.seabed literal not found');
            frameConfig = frameConfig.replace(/seabed: \{[^}]*\}/, seabedLiteral);
            fs.writeFileSync(GAME_FRAME_CONFIG, frameConfig, 'utf-8');

            // DEFAULT_MAP_TUNE block in PixiWorldMap.tsx.
            let mapSource = fs.readFileSync(MAP_TUNE_FILE, 'utf-8');
            const tuneMarker = 'export const DEFAULT_MAP_TUNE: PixiMapTune = {';
            const tuneStart = mapSource.indexOf(tuneMarker);
            if (tuneStart === -1) throw new Error('DEFAULT_MAP_TUNE not found');
            const tuneEnd = mapSource.indexOf('};', tuneStart);
            if (tuneEnd === -1) throw new Error('unterminated DEFAULT_MAP_TUNE');
            const tuneLines = MAP_TUNE_KEYS.map((key) => `  ${key}: ${num(values, key)},`);
            mapSource = `${mapSource.slice(0, tuneStart)}${tuneMarker}\n${tuneLines.join('\n')}\n${mapSource.slice(tuneEnd)}`;
            fs.writeFileSync(MAP_TUNE_FILE, mapSource, 'utf-8');

            // DEFAULT_HUD_BAND_PX in hudBand.ts.
            let bandSource = fs.readFileSync(HUD_BAND_FILE, 'utf-8');
            if (!/DEFAULT_HUD_BAND_PX = [0-9.]+/.test(bandSource)) throw new Error('DEFAULT_HUD_BAND_PX not found');
            bandSource = bandSource.replace(/DEFAULT_HUD_BAND_PX = [0-9.]+/, `DEFAULT_HUD_BAND_PX = ${num(values, 'plaqueBand')}`);
            fs.writeFileSync(HUD_BAND_FILE, bandSource, 'utf-8');

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


/**
 * Dev-only: bake `/mappa2-lab` vectors into the checked-in defaults.
 *
 * The lab POSTs the current sliders/colors here and the endpoint rewrites the
 * `CODE_DEFAULTS` literal in-place, so the Director's accepted tuning becomes
 * the code default for every later run/session. Input is whitelisted and
 * coerced before touching source.
 */
function mappa2LabDefaultsPlugin(): Plugin {
  const TARGET = path.resolve(dirname, 'src/pages/mappa2-lab.tsx');
  const NUMERIC_KEYS = ['wonderEveryS', 'forestSway', 'cloudOpacityScale', 'cloudTintAmount', 'seaTone', 'seaLineOpacity', 'foamStrength', 'waterfallOn', 'waterfallFlowSpeed', 'waterfallFlowStrength', 'waterfallMist', 'waterfallRipples', 'waterfallFoam', 'waterfallPainted', 'waterfallFlipFps', 'waterfallSplash', 'waterfallRainbow', 'waterfallRainbowEveryS', 'swRiversOn', 'swRiverFlowSpeed', 'swBasinPosesPerS', 'swSeaPatchPosesPerS', 'swDeltaSeaPosesPerS', 'swRiverFlowStrength', 'swLakeShimmer', 'swConfluenceFoam', 'ambOn', 'ambIntensity', 'ambProb', 'ambAlpha', 'ambRare', 'landLifeOn', 'landLifeLeaves', 'landLifeMotes', 'landLifeFlutter', 'landLifeSpeed', 'landLifeOpacity'] as const;
  const COLOR_KEYS = ['seaLineColor', 'foamColor'] as const;

  return {
    name: 'mappa2-lab-defaults',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use('/__mappa2-lab-defaults', (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405;
          res.end('Method Not Allowed');
          return;
        }
        let body = '';
        req.on('data', (chunk) => {
          body += chunk;
          if (body.length > 8192) req.destroy();
        });
        req.on('end', () => {
          try {
            const raw = (JSON.parse(body) as { defaults?: Record<string, unknown> }).defaults ?? {};
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

            const source = fs.readFileSync(TARGET, 'utf-8');
            const marker = 'const CODE_DEFAULTS: LabDefaults = {';
            const start = source.indexOf(marker);
            if (start === -1) throw new Error('CODE_DEFAULTS not found');
            const end = source.indexOf('};', start);
            if (end === -1) throw new Error('unterminated CODE_DEFAULTS');
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

/**
 * Dev-only: quest-editor IT→EN auto-translation.
 *
 * `POST /__qe-translate` `{texts: string[]}` → `{translations: string[]}`.
 * The API key stays server-side (`GROQ_API_KEY` from .env via loadEnv) — the
 * lab page only ever sees this endpoint, never the key. 503 when unconfigured,
 * 502 on upstream failure; the page degrades to IT-only edits.
 */
function questEditorTranslatePlugin(): Plugin {
  let apiKey: string | undefined;
  return {
    name: 'quest-editor-translate',
    apply: 'serve',
    configureServer(server) {
      apiKey = loadEnv(server.config.mode, server.config.root, '').GROQ_API_KEY ?? process.env.GROQ_API_KEY;
      server.middlewares.use('/__qe-translate', (req, res) => {
        if (req.method !== 'POST') { res.statusCode = 405; res.end(); return; }
        let body = '';
        req.on('data', (c) => { body += c; });
        req.on('end', () => {
          void (async () => {
            try {
              if (!apiKey) { res.statusCode = 503; res.end(JSON.stringify({ error: 'GROQ_API_KEY missing' })); return; }
              const { texts } = JSON.parse(body) as { texts?: string[] };
              if (!Array.isArray(texts) || !texts.length) { res.statusCode = 400; res.end(JSON.stringify({ error: 'texts[] required' })); return; }
              const r = await fetch('https://api.groq.com/openai/v1/chat/completions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
                body: JSON.stringify({
                  model: 'openai/gpt-oss-120b',
                  temperature: 0.2,
                  response_format: { type: 'json_object' },
                  messages: [
                    { role: 'system', content: 'You translate Italian fantasy-RPG quest text into English. Reply with JSON only: {"translations":["...", ...]} — same order, same count as the input array, no commentary. Literary tone, second person ("you"), keep em-dashes and structure.' },
                    { role: 'user', content: JSON.stringify(texts) },
                  ],
                }),
              });
              if (!r.ok) { res.statusCode = 502; res.end(JSON.stringify({ error: `upstream ${r.status}` })); return; }
              const j = await r.json() as { choices?: { message?: { content?: string } }[] };
              const parsed = JSON.parse(j.choices?.[0]?.message?.content ?? '{}') as { translations?: string[] };
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ translations: parsed.translations ?? [] }));
            } catch (e) {
              res.statusCode = 502;
              res.end(JSON.stringify({ error: e instanceof Error ? e.message : String(e) }));
            }
          })();
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
    hudTuningDefaultsPlugin(),
    mappa2LabDefaultsPlugin(),
    questEditorTranslatePlugin(),
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
    // 'localhost' resolves to both ::1 and 127.0.0.1 on macOS; a default bind
    // lands on a single family and clients pinned to the other get refused
    // (R-276: "Failed to fetch dynamically imported module"). IPv4 loopback
    // always connects; ::1 refuses fast and Happy Eyeballs falls back.
    host: '127.0.0.1',
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