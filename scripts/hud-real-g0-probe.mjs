#!/usr/bin/env node
/**
 * hud-real-g0-probe — PLAN-110 G-0, read-only part: reads the Gemini web UI
 * (model picker, tools, banners) and tests how many images the composer accepts.
 * NEVER submits a prompt (no generation, no quota). Opens its own background tab
 * (Target.createTarget background:true) and closes it at the end.
 * Usage: node scripts/hud-real-g0-probe.mjs <outDir> <img1> <img2> ... (>= 12 images)
 */
import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const [outDir, ...imgs] = process.argv.slice(2);
fs.mkdirSync(outDir, { recursive: true });
const browser = await chromium.connectOverCDP('http://127.0.0.1:9222');
const ctx = browser.contexts()[0];
const session = await browser.newBrowserCDPSession();
const marker = `g0-${process.pid}-${Date.now().toString(36)}`;
await session.send('Target.createTarget', { url: `https://gemini.google.com/app#${marker}`, background: true });
let page;
for (let i = 0; i < 60 && !page; i++) {
  page = ctx.pages().find((p) => { try { return p.url().includes(marker); } catch { return false; } });
  if (!page) await new Promise((r) => setTimeout(r, 200));
}
await page.waitForSelector('div[contenteditable="true"], .ql-editor, textarea', { state: 'attached', timeout: 60000 });
await page.waitForTimeout(3000);
const report = { when: new Date().toISOString(), url: page.url() };

// 1) model picker + visible controls (read-only)
report.buttons = await page.evaluate(() => [...document.querySelectorAll('button')]
  .filter((e) => e.offsetParent !== null)
  .map((e) => ({ aria: e.getAttribute('aria-label') || '', text: (e.textContent || '').trim().slice(0, 60) }))
  .filter((b) => b.aria || b.text).slice(0, 60));
report.pickerGuess = await page.evaluate(() => {
  const c = [...document.querySelectorAll('button, [role="button"]')].filter((e) => e.offsetParent !== null)
    .map((e) => (e.getAttribute('aria-label') || e.textContent || '').trim()).filter((t) => /gemini|pro|flash|thinking|ragionamento|veloce|modello|model|banana|immagin/i.test(t));
  return [...new Set(c)].slice(0, 20);
});
report.banners = await page.evaluate(() => [...document.querySelectorAll('[role="alert"], [role="status"], [class*="banner" i], [class*="limit" i], [class*="quota" i]')]
  .map((e) => (e.textContent || '').trim().slice(0, 200)).filter(Boolean).slice(0, 10));
await page.screenshot({ path: path.join(outDir, 'ui-initial.png') });

// try to open the model picker without selecting anything
try {
  const pick = page.locator('button:has-text("Pro"), button:has-text("Veloce"), button:has-text("Fast"), button:has-text("Thinking"), button[aria-label*="modello" i], button[aria-label*="model" i]').first();
  if ((await pick.count()) > 0 && (await pick.isVisible({ timeout: 1000 }))) {
    report.pickerButtonText = (await pick.textContent() || '').trim().slice(0, 80);
    await pick.click({ timeout: 3000 });
    await page.waitForTimeout(1200);
    report.pickerMenu = await page.evaluate(() => [...document.querySelectorAll('[role="menu"] *, [role="listbox"] *, mat-action-list *')]
      .filter((e) => e.children.length === 0).map((e) => (e.textContent || '').trim()).filter(Boolean).slice(0, 40));
    await page.screenshot({ path: path.join(outDir, 'ui-model-menu.png') });
    await page.keyboard.press('Escape');
  }
} catch (e) { report.pickerError = String(e).slice(0, 120); }

// 2) attachment limits: attach cumulatively, never submit
report.attach = [];
async function chips() {
  return await page.evaluate(() => document.querySelectorAll('button[aria-label*="chiudi allegato" i], button[aria-label*="rimuovi" i], button[aria-label*="remove" i]').length);
}
async function toastText() {
  return await page.evaluate(() => [...document.querySelectorAll('[role="alert"], snack-bar-container, simple-snack-bar, [class*="snack" i], [class*="toast" i]')]
    .map((e) => (e.textContent || '').trim().slice(0, 160)).filter(Boolean));
}
let attached = 0;
for (const target of [1, 3, 5, 8, 12]) {
  if (imgs.length < target) break;
  const batch = imgs.slice(attached, target).map((p) => path.resolve(p));
  const inputs = page.locator('input[type="file"]');
  let ok = false;
  for (let q = 0; q < Math.min(await inputs.count(), 5) && !ok; q++) {
    try { await inputs.nth(q).setInputFiles(batch, { timeout: 4000 }); ok = true; } catch (e) { report.attach.push({ target, input: q, err: String(e).slice(0, 100) }); }
  }
  await page.waitForTimeout(9000);
  const n = await chips();
  const toasts = await toastText();
  report.attach.push({ target, sentFiles: batch.length, setOk: ok, chipsVisible: n, toasts });
  await page.screenshot({ path: path.join(outDir, `ui-attach-${target}.png`) });
  attached = target;
  if (ok && n < target) break; // the composer stopped accepting
}
report.inputsMultiple = await page.evaluate(() => [...document.querySelectorAll('input[type="file"]')].map((i) => ({ multiple: i.multiple, accept: i.accept })));
fs.writeFileSync(path.join(outDir, 'probe.json'), JSON.stringify(report, null, 2));
console.log(JSON.stringify({ pickerGuess: report.pickerGuess, pickerButtonText: report.pickerButtonText, banners: report.banners, attach: report.attach, inputs: report.inputsMultiple }, null, 1));
try { await page.close(); } catch {}
await browser.close();
