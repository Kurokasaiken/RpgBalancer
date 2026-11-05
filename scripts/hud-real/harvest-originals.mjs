#!/usr/bin/env node
/**
 * harvest-originals — downloads the ORIGINAL generated images of an existing Gemini
 * chat (download button), in chat order. Never types or submits anything: zero quota.
 * Background tab (Target.createTarget background:true), closed at the end.
 * Usage: node scripts/hud-real/harvest-originals.mjs <chatUrl> <outDir>
 */
import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const [chatUrl, outDir] = process.argv.slice(2);
fs.mkdirSync(outDir, { recursive: true });
const SEL = 'GENERATED-IMAGE img, SINGLE-IMAGE img';
const browser = await chromium.connectOverCDP('http://127.0.0.1:9222');
const ctx = browser.contexts()[0];
const session = await browser.newBrowserCDPSession();
const marker = `hv-${process.pid}-${Date.now().toString(36)}`;
await session.send('Target.createTarget', { url: `${chatUrl}#${marker}`, background: true });
let page;
for (let i = 0; i < 80 && !page; i++) {
  page = ctx.pages().find((p) => { try { return p.url().includes(marker); } catch { return false; } });
  if (!page) await new Promise((r) => setTimeout(r, 200));
}
await page.waitForLoadState('domcontentloaded').catch(() => {});
await page.waitForTimeout(6000);
// scroll to the top repeatedly so every turn of the chat is rendered
for (let i = 0; i < 12; i++) { await page.mouse.wheel(0, -4000); await page.waitForTimeout(700); }
await page.waitForTimeout(2000);
const n = await page.locator(SEL).count();
console.log('generated images in chat:', n);
const out = [];
for (let i = 0; i < n; i++) {
  const img = page.locator(SEL).nth(i);
  await img.scrollIntoViewIfNeeded().catch(() => {});
  await page.waitForTimeout(500);
  const nat = await img.evaluate((el) => [el.naturalWidth, el.naturalHeight]).catch(() => [0, 0]);
  const file = path.join(outDir, `orig-${String(i + 1).padStart(2, '0')}.png`);
  let how = 'none';
  try {
    await img.hover();
    const wrap = img.locator('xpath=ancestor::GENERATED-IMAGE | ancestor::SINGLE-IMAGE').first();
    const btn = wrap.locator('DOWNLOAD-GENERATED-IMAGE-BUTTON button, [aria-label*="Scarica" i], [aria-label*="Download" i]').first();
    const [dl] = await Promise.all([page.waitForEvent('download', { timeout: 25000 }), btn.click({ timeout: 5000 })]);
    await dl.saveAs(file); how = 'download';
  } catch (e) {
    try {
      const b64 = await img.evaluate((el) => { const c = document.createElement('canvas'); c.width = el.naturalWidth; c.height = el.naturalHeight; c.getContext('2d').drawImage(el, 0, 0); return c.toDataURL('image/png').split(',')[1]; });
      fs.writeFileSync(file, Buffer.from(b64, 'base64')); how = 'canvas';
    } catch (e2) { how = 'failed: ' + String(e2).slice(0, 80); }
  }
  out.push({ i: i + 1, natural: nat, how, file });
  console.log(i + 1, nat.join('x'), how);
}
fs.writeFileSync(path.join(outDir, 'harvest.json'), JSON.stringify({ chatUrl, when: new Date().toISOString(), images: out }, null, 2));
try { await page.close(); } catch {}
await browser.close();
