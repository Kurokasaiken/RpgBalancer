#!/usr/bin/env node
// R-304: post-deploy boot probe that exercises the REAL render path.
// Headless Chromium without a GPU falls back to the Canvas renderer —
// `meshOk` is false and every mesh/shader code path is silently skipped
// (pack.packRoot incident, 2026-11-01). `--enable-unsafe-swiftshader`
// gives the browser a software WebGL so the probe runs the same path
// real users hit.
//
// Usage: node scripts/deploy/webglBootProbe.mjs <url>
// Exit 0 = world prepared; exit 1 = boot error / timeout / no canvas.

import { chromium } from 'playwright';

const url = process.argv[2];
if (!url) {
  console.error('usage: webglBootProbe.mjs <url>');
  process.exit(2);
}

const MAX_MS = Number(process.env.WEBGL_PROBE_TIMEOUT_MS ?? 150000);
const POLL_MS = 2000;

const browser = await chromium.launch({ args: ['--enable-unsafe-swiftshader'] });
const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
const pageErrors = [];
page.on('pageerror', (e) => pageErrors.push(String(e).slice(0, 300)));

await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 45000 });

let sawBootScreen = false;
let result = 'timeout';
let last = null;
const started = Date.now();
while (Date.now() - started < MAX_MS) {
  last = await page.evaluate(() => ({
    alert: document.querySelector('[role="alert"]')?.textContent?.trim() ?? null,
    bootPhase: document.querySelector('[data-boot-phase]')?.getAttribute('data-boot-phase') ?? null,
    canvas: !!document.querySelector('canvas'),
    readyYes: document.body.innerText.includes('ready: yes'),
    failText: /could not be prepared|boot error:|manifest error:/i.test(document.body.innerText),
  }));
  if (last.bootPhase !== null) sawBootScreen = true;
  if (last.alert || last.failText || pageErrors.length > 0) { result = 'fail'; break; }
  // game frame: boot veil gone after it appeared; lab pages: `ready: yes` line.
  if (last.canvas && ((sawBootScreen && last.bootPhase === null) || last.readyYes)) { result = 'ok'; break; }
  await page.waitForTimeout(POLL_MS);
}

await page.screenshot({ path: `test-results/webgl-probe-${url.replace(/[^a-z0-9]+/gi, '_')}.png` }).catch(() => {});
await browser.close();

if (result === 'ok') {
  console.log(`PASS ${url}`);
  process.exit(0);
}
console.error(`FAIL ${url}: ${result} alert=${last?.alert ?? 'none'} pageerror=${pageErrors[0] ?? 'none'} bootPhase=${last?.bootPhase ?? 'none'}`);
process.exit(1);
