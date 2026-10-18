/**
 * captureGameBaseline — PLAN-043 WS-5 (artifact-r002 §D): supplementary F0
 * baseline capture of /game at a given viewport (default 1366×768,
 * evidence-only — not part of the zero-violation gate).
 *
 * Headless Chromium via playwright; NEVER opens a foreground window
 * (.windsurf/rules/16-no-foreground-windows). Writes into the run dir:
 *   screenshot.png   — full-page capture after the boot screen settles
 *   metrics.json     — env attestation + HUD element inventory + <12px
 *                      computed-font scan (witness evidence for defect recs)
 *
 * Uso: npx tsx scripts/verification/captureGameBaseline.ts \
 *        --url http://localhost:5173/game --viewport 1366x768 \
 *        --out test-results/plan-043/ws5/baseline-1366x768
 */
import { chromium } from 'playwright';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';

interface Args { url: string; w: number; h: number; out: string; settleMs: number }

function parseArgs(): Args {
  const a = process.argv.slice(2);
  const get = (k: string, d: string) => {
    const i = a.indexOf(k);
    return i >= 0 ? a[i + 1] : d;
  };
  const [w, h] = get('--viewport', '1366x768').split('x').map(Number);
  return {
    url: get('--url', 'http://localhost:5173/game'),
    w, h,
    out: path.resolve(get('--out', 'test-results/plan-043/ws5/baseline')),
    settleMs: Number(get('--settle', '6000')),
  };
}

/* T-15: page.evaluate receives a STRING, never a closure. */
const INVENTORY_JS = `
(() => {
  const rect = (el) => {
    const r = el.getBoundingClientRect();
    return { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) };
  };
  const smallFonts = [];
  const hud = [];
  const seen = new Set();
  document.querySelectorAll('*').forEach((el) => {
    const cs = getComputedStyle(el);
    if (cs.display === 'none' || cs.visibility === 'hidden') return;
    const fs = parseFloat(cs.fontSize);
    const text = (el.textContent ?? '').trim();
    if (fs > 0 && fs < 12 && text && el.children.length === 0) {
      const key = el.tagName + '|' + text.slice(0, 24) + '|' + fs;
      if (!seen.has(key)) { seen.add(key); smallFonts.push({ tag: el.tagName, fontSize: fs, text: text.slice(0, 40), rect: rect(el) }); }
    }
  });
  const sel = ['[data-hud-controls]', '[data-hud-panel]', '[data-stage-panel]', '[data-hud-strip-tab]',
    '[data-testid*="hud"]', '[class*="hud"]', '[class*="Hud"]', '[data-hud-panels-trigger]'];
  document.querySelectorAll(sel.join(',')).forEach((el) => {
    const r = el.getBoundingClientRect();
    if (r.width === 0 && r.height === 0) return;
    const cs = getComputedStyle(el);
    if (cs.visibility === 'hidden' || cs.display === 'none') return;
    hud.push({
      sel: el.getAttribute('data-hud-panel') ?? el.getAttribute('data-stage-panel')
        ?? el.getAttribute('data-testid') ?? (el.className?.baseVal ?? el.className ?? '').toString().slice(0, 60),
      tag: el.tagName, rect: rect(el), zIndex: cs.zIndex,
    });
  });
  return {
    viewport: { w: window.innerWidth, h: window.innerHeight, dpr: window.devicePixelRatio },
    url: location.href, visibility: document.visibilityState,
    canvasCount: document.querySelectorAll('canvas').length,
    hudElements: hud.slice(0, 120),
    smallFonts: smallFonts.slice(0, 60),
    scrollOverflow: { x: document.documentElement.scrollWidth - window.innerWidth, y: document.documentElement.scrollHeight - window.innerHeight },
  };
})()`;

async function main() {
  const args = parseArgs();
  mkdirSync(args.out, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: { width: args.w, height: args.h } });
  const page = await ctx.newPage();
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(`console: ${m.text().slice(0, 200)}`); });

  const t0 = Date.now();
  await page.goto(args.url, { waitUntil: 'domcontentloaded', timeout: 60_000 });
  await page.waitForSelector('canvas', { timeout: 60_000 });
  /* Boot screen + reveal choreography need a settle window before the
   * capture witnesses the interactive HUD. */
  await page.waitForTimeout(args.settleMs);
  const metrics = await page.evaluate(INVENTORY_JS);
  await page.screenshot({ path: path.join(args.out, 'screenshot.png'), fullPage: false });
  await browser.close();

  writeFileSync(
    path.join(args.out, 'metrics.json'),
    JSON.stringify({
      captureId: `ws5-baseline-${args.w}x${args.h}`,
      capturedAt: new Date().toISOString(),
      url: args.url, viewport: { w: args.w, h: args.h },
      environment: 'browser (headless chromium, playwright)',
      settleMs: args.settleMs,
      loadMs: Date.now() - t0,
      ...metrics,
      errors,
    }, null, 2) + '\n',
  );
  console.log(`baseline → ${args.out} (${metrics.hudElements.length} hud els, ${metrics.smallFonts.length} <12px texts, ${errors.length} errors)`);
}

main().catch((e) => { console.error(e); process.exit(1); });
