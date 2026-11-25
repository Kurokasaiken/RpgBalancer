/**
 * PLAN-134 OB-7 — headless witness for `/hud-lab` LEGO board.
 * Born focus-safe: Playwright headless, no foreground window, browser closed in finally.
 */
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';

const RUN_DIR = path.resolve('.mw/runs/plan134-hud-lego-board');
const SHOT = path.join(RUN_DIR, 'hud-lab-lego-1440x900.png');
const OUT = path.join(RUN_DIR, 'witness.json');
const URL = process.env.HUD_LAB_URL ?? 'http://localhost:5173/hud-lab';

fs.mkdirSync(RUN_DIR, { recursive: true });
const watchdog = setTimeout(() => {
  console.error('witness watchdog timeout');
  process.exit(2);
}, 120000);
watchdog.unref();

let browser;
const pageErrors = [];
const consoleErrors = [];
try {
  browser = await chromium.launch({ headless: true, args: ['--enable-unsafe-swiftshader'] });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  page.on('pageerror', (error) => pageErrors.push(String(error.stack ?? error)));
  page.on('console', (message) => { if (message.type() === 'error') consoleErrors.push(message.text().slice(0, 500)); });
  await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 45000 });
  await page.waitForSelector('[data-lego-board]', { timeout: 30000 });
  await page.waitForTimeout(2500);
  const probe = await page.evaluate(() => ({
    board: !!document.querySelector('[data-lego-board]'),
    inventoryRev: document.querySelector('[data-inventory-rev]')?.getAttribute('data-inventory-rev') ?? null,
    cards: document.querySelectorAll('[data-lego-piece-card]').length,
    kindGroups: [...document.querySelectorAll('[data-lego-kind-group]')].map((node) => node.getAttribute('data-lego-kind-group')),
    unresolvedLane: !!document.querySelector('[data-unresolved-lane]'),
    controlPatternsLane: !!document.querySelector('[data-control-patterns-lane]'),
    coverageMatrix: !!document.querySelector('[data-coverage-matrix]'),
    warning: !!document.querySelector('[data-unsaved-warning]'),
    dialogs: document.querySelectorAll('dialog,[role="dialog"]').length,
    unresolvedRulingControls: document.querySelector('[data-unresolved-lane]')?.querySelectorAll('[data-review-controls]').length ?? 0,
    canvasCount: document.querySelectorAll('canvas').length,
  }));
  await page.screenshot({ path: SHOT, fullPage: false });
  const result = {
    url: URL,
    viewport: { width: 1440, height: 900 },
    screenshot: path.relative(process.cwd(), SHOT),
    pageErrors,
    consoleErrors,
    probe,
    pass: pageErrors.length === 0 && probe.board && probe.cards > 0 && probe.dialogs === 0 && probe.unresolvedRulingControls === 0,
  };
  fs.writeFileSync(OUT, `${JSON.stringify(result, null, 2)}\n`);
  console.log(JSON.stringify({ pass: result.pass, cards: probe.cards, pageErrors: pageErrors.length, dialogs: probe.dialogs, screenshot: result.screenshot }));
  process.exitCode = result.pass ? 0 : 1;
} catch (error) {
  const result = { url: URL, pageErrors, consoleErrors, error: String(error.stack ?? error), pass: false };
  fs.writeFileSync(OUT, `${JSON.stringify(result, null, 2)}\n`);
  console.error('witness failed', error);
  process.exitCode = 1;
} finally {
  clearTimeout(watchdog);
  if (browser) await browser.close().catch(() => undefined);
}
