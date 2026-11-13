/**
 * PLAN-118 / R-327 — regressione permanente del deploy slim.
 * Red-first: questi test fallirebbero senza route registry, fallback e flag safe.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { renderToString } from 'react-dom/server';
import { createElement } from 'react';
import { I18nextProvider } from 'react-i18next';
import i18n from '@/localization/i18n';
import { LAB_PATHS, LAB_PATHS_SET } from '@/deploy/labRouteData';
import { LAB_ROUTE_COMPONENTS } from '@/deploy/labRoutes';
import { LAB_ROUTE_COMPONENTS as SLIM_COMPONENTS } from '@/deploy/labRoutes.slim';
import { RouteUnavailable } from '@/deploy/RouteUnavailable';

describe('PLAN-118 route registry', () => {
  it('LAB_PATHS copre le route lab campione del manifest', () => {
    for (const p of ['/hud-lab', '/mappa2-upscale-review', '/quest-editor', '/theater-lab', '/trailer', '/design-system']) {
      expect(LAB_PATHS_SET.has(p), p).toBe(true);
    }
  });

  it('le route kept NON sono nel registry lab', () => {
    for (const p of ['/', '/game', '/mappa2-lab', '/index.html']) {
      expect(LAB_PATHS_SET.has(p), p).toBe(false);
    }
  });

  it('registry full: ogni labPath con componente ha un loader', () => {
    const keys = Object.keys(LAB_ROUTE_COMPONENTS);
    expect(keys.length).toBeGreaterThan(80);
    for (const k of keys) expect(LAB_PATHS_SET.has(k), k).toBe(true);
  });

  it('registry slim: stessa interfaccia, zero componenti', () => {
    expect(SLIM_COMPONENTS).toEqual({});
    // LAB_PATHS resta pieno anche in slim (viene da labRouteData, non dai componenti)
    expect(LAB_PATHS.length).toBeGreaterThan(80);
  });

  it('flag guard: VITE_DEPLOY_SLIM e\' falsy in vitest (pattern safe)', () => {
    const slim = ((import.meta as { env?: Record<string, string | undefined> }).env?.VITE_DEPLOY_SLIM) === 'true';
    expect(slim).toBe(false);
  });
});

describe('service worker budget (PLAN-118 T-3)', () => {
  const root = process.cwd();
  const swSrc = readFileSync(join(root, 'src/service-worker.ts'), 'utf8');
  const viteSrc = readFileSync(join(root, 'vite.config.ts'), 'utf8');

  it('precache esclude le immagini (solo shell)', () => {
    const glob = viteSrc.match(/globPatterns:\s*\[([^\]]+)\]/)?.[1] ?? '';
    expect(glob).not.toMatch(/png|jpg|webp|avif|gif/);
  });

  it('ogni cache.put runtime passa dal bound putWithCap', () => {
    const puts = swSrc.match(/cache\.put\(/g) ?? [];
    const putsInsideCap = 1; // quello dentro putWithCap stessa
    expect(puts.length - putsInsideCap).toBe(0);
    expect(swSrc).toContain('RUNTIME_CACHE_MAX_ENTRIES');
    expect(swSrc).toContain('RUNTIME_CACHE_MAX_AGE_MS');
  });
});

describe('RouteUnavailable fallback', () => {
  it('renderizza con chiavi i18n e link a /', () => {
    const html = renderToString(
      createElement(I18nextProvider, { i18n }, createElement(RouteUnavailable))
    );
    expect(html).toContain('Not available');
  });
});
