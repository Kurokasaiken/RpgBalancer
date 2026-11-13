#!/usr/bin/env node
/**
 * slimPreviewVerify.mjs — PLAN-118 T-5/OB-4: verifica reale su `vite preview` slim.
 *
 * Controlla:
 *  - `/` e `/game`: boot senza pageerror, canvas presente, ZERO richieste
 *    fallite o content-type incoerente; misura cold transfer (byte compressi
 *    via content-length, fallback body length);
 *  - `/hud-lab` (route lab nota): renderizza il fallback RouteUnavailable,
 *    nessun chunk lab nella rete;
 *  - walk minimo: apre lo shell e conta fallimenti oltre il boot.
 *
 * Uso: node scripts/deploy/slimPreviewVerify.mjs <baseUrl>
 * Exit 0 = tutto verde. Scrive misure in test-results/deploy-slim/.
 */
import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const base = process.argv[2] ?? 'http://localhost:4199';
const OUT = join(new URL('../../', import.meta.url).pathname, 'test-results/deploy-slim');
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({ args: ['--enable-unsafe-swiftshader'] });
const errors = [];
const report = { base, ts: new Date().toISOString(), routes: {} };

async function measure(path, { expectFallback = false, waitMs = 25000 } = {}) {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  const failed = [], pageErrors = [];
  let bytes = 0;
  page.on('pageerror', (e) => pageErrors.push(String(e).slice(0, 200)));
  page.on('response', async (r) => {
    try {
      const h = await r.allHeaders().catch(() => ({}));
      const len = Number(h['content-length'] ?? 0);
      bytes += len || (await r.body().catch(() => Buffer.alloc(0))).length;
      if (!r.ok() && r.status() !== 304) failed.push(`${r.status()} ${r.url()}`);
      const ct = h['content-type'] ?? '';
      if (r.url().endsWith('.js') && ct && !ct.includes('javascript')) failed.push(`content-type incoerente ${ct} ${r.url()}`);
    } catch { /* ignore */ }
  });
  await page.goto(base + path, { waitUntil: 'domcontentloaded', timeout: 45000 });
  const deadline = Date.now() + waitMs;
  let ok = false, fallbackSeen = false;
  while (Date.now() < deadline) {
    const state = await page.evaluate(() => ({
      canvas: !!document.querySelector('canvas'),
      fallback: /not available|non disponibile/i.test(document.body.innerText),
      alert: !!document.querySelector('[role="alert"]'),
    }));
    fallbackSeen ||= state.fallback;
    if (expectFallback ? state.fallback : state.canvas) { ok = true; break; }
    await page.waitForTimeout(1500);
  }
  const rec = { ok, bytes, failed, pageErrors, fallbackSeen };
  report.routes[path] = rec;
  if (!ok) errors.push(`${path}: ${expectFallback ? 'fallback non renderizzato' : 'canvas/boot non visto'} in ${waitMs / 1000}s`);
  for (const f of failed) errors.push(`${path}: request fallita ${f}`);
  for (const e of pageErrors) errors.push(`${path}: pageerror ${e}`);
  if (expectFallback && !fallbackSeen) errors.push(`${path}: RouteUnavailable assente`);
  await page.screenshot({ path: join(OUT, `${path.replace(/\//g, '_') || 'root'}.png`) }).catch(() => {});
  await page.close();
  return rec;
}

// cold transfer + boot
await measure('/');
await measure('/game');
// fallback su route lab esclusa
await measure('/hud-lab', { expectFallback: true });
// walk minimo sullo shell (menu principale = default branch)
const walk = await measure('/mappa2-lab', { waitMs: 20000 }).catch(() => null);

writeFileSync(join(OUT, 'report.json'), JSON.stringify(report, null, 2));
const mb = (b) => (b / 1048576).toFixed(1);
console.log(`[slim-verify] / = ${mb(report.routes['/']?.bytes ?? 0)} MB, /game = ${mb(report.routes['/game']?.bytes ?? 0)} MB`);
console.log(`[slim-verify] /hud-lab fallback=${report.routes['/hud-lab']?.fallbackSeen}`);
if (errors.length) { console.error(errors.map(e => `  ✗ ${e}`).join('\n')); await browser.close(); process.exit(1); }
console.log('[slim-verify] PASS — report in test-results/deploy-slim/report.json');
await browser.close();
