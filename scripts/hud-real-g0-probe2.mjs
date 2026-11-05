#!/usr/bin/env node
/**
 * hud-real-g0-probe2 — PLAN-110 G-0, read-only: opens the mode selector and tests the
 * attachment limit through the real upload menu. NEVER submits a prompt.
 * Usage: node scripts/hud-real-g0-probe2.mjs <outDir> <img...>
 */
import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const [outDir, ...imgs] = process.argv.slice(2);
const browser = await chromium.connectOverCDP('http://127.0.0.1:9222');
const ctx = browser.contexts()[0];
const session = await browser.newBrowserCDPSession();
const marker = `g0b-${process.pid}-${Date.now().toString(36)}`;
await session.send('Target.createTarget', { url: `https://gemini.google.com/app#${marker}`, background: true });
let page;
for (let i = 0; i < 60 && !page; i++) {
  page = ctx.pages().find((p) => { try { return p.url().includes(marker); } catch { return false; } });
  if (!page) await new Promise((r) => setTimeout(r, 200));
}
await page.waitForSelector('div[contenteditable="true"], .ql-editor, textarea', { state: 'attached', timeout: 60000 });
await page.waitForTimeout(3000);
const report = { when: new Date().toISOString() };

// 1) mode selector (read-only: open, read, close)
try {
  const sel = page.locator('button[aria-label*="selettore modalità" i]').first();
  report.selectorLabel = await sel.getAttribute('aria-label');
  await sel.click({ timeout: 4000 });
  await page.waitForTimeout(1200);
  report.modeMenu = await page.evaluate(() => {
    const root = document.querySelector('[role="menu"], [role="listbox"], .mat-mdc-menu-panel, [class*="mode-menu" i]') || document.body;
    return [...root.querySelectorAll('button, [role="menuitem"], [role="option"]')].filter((e) => e.offsetParent !== null)
      .map((e) => (e.innerText || e.getAttribute('aria-label') || '').replace(/\s+/g, ' ').trim()).filter(Boolean).slice(0, 20);
  });
  await page.screenshot({ path: path.join(outDir, 'ui-mode-menu.png') });
  await page.keyboard.press('Escape');
} catch (e) { report.modeError = String(e).slice(0, 160); }

// 2) the "+" menu (tools): list items
try {
  const plus = page.locator('button[aria-label*="Caricamento" i], button[aria-label*="aggiungi" i], button[aria-label*="insert" i]').first();
  report.plusAria = await plus.getAttribute('aria-label');
  await plus.click({ timeout: 4000 });
  await page.waitForTimeout(1000);
  report.plusMenu = await page.evaluate(() => [...document.querySelectorAll('[role="menuitem"], mat-action-list button, [role="menu"] button')]
    .filter((e) => e.offsetParent !== null).map((e) => (e.innerText || '').replace(/\s+/g, ' ').trim()).filter(Boolean).slice(0, 20));
  await page.screenshot({ path: path.join(outDir, 'ui-plus-menu.png') });
  await page.keyboard.press('Escape');
} catch (e) { report.plusError = String(e).slice(0, 160); }

// 3) attachments one batch at a time through the upload menu
async function attachBatch(files) {
  const plus = page.locator('button[aria-label*="Caricamento" i], button[aria-label*="aggiungi" i], button[aria-label*="insert" i]').first();
  await plus.click({ timeout: 4000 });
  await page.waitForSelector('[role="menu"], mat-action-list', { state: 'visible', timeout: 4000 }).catch(() => {});
  await page.waitForTimeout(400);
  const item = page.locator('[role="menuitem"]:has-text("Carica file"), button:has-text("Carica file")').first();
  const [fc] = await Promise.all([page.waitForEvent('filechooser', { timeout: 5000 }), item.click()]);
  report.chooserMultiple = fc.isMultiple();
  await fc.setFiles(files);
}
const chips = () => page.evaluate(() => document.querySelectorAll('button[aria-label*="chiudi allegato" i], button[aria-label*="rimuovi" i], button[aria-label*="remove" i]').length);
report.attach = [];
let done = 0;
for (const target of [1, 3, 5, 8, 12]) {
  if (imgs.length < target) break;
  const batch = imgs.slice(done, target).map((p) => path.resolve(p));
  let err = null;
  try { await attachBatch(batch); } catch (e) { err = String(e).slice(0, 140); }
  await page.waitForTimeout(10000);
  const n = await chips();
  const msgs = await page.evaluate(() => [...document.querySelectorAll('[role="alert"], snack-bar-container, simple-snack-bar, [class*="snack" i], [class*="toast" i], [class*="error" i]')]
    .map((e) => (e.innerText || '').replace(/\s+/g, ' ').trim().slice(0, 160)).filter(Boolean).slice(0, 5));
  report.attach.push({ target, sent: batch.length, chips: n, err, msgs });
  await page.screenshot({ path: path.join(outDir, `ui2-attach-${target}.png`) });
  done = target;
  if (err || n < target) break;
}
fs.writeFileSync(path.join(outDir, 'probe2.json'), JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 1));
try { await page.close(); } catch {}
await browser.close();
