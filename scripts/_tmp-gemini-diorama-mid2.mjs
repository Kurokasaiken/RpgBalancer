#!/usr/bin/env node
// F2-T0: intermediate frame — between front2 (front) and c0 (final 3/4).
import { chromium } from 'playwright';
import fs from 'fs';
const CHAT = 'd9c147e0b3b074e6';
const OUT = '.mw/specs/poi-radial/diorama/gen/diorama-frame-a.png';
const PROMPT = `Edit THIS image only. Keep the EXACT same diorama — one single square stone watchtower, same thatched cottages in the same positions, same palisade, same trees, same engraved gold pedestal with the same gems. ONLY rotate the viewpoint about 20 degrees toward a three-quarter view (halfway between this straight front view and a full 3/4): the diorama turns slightly, we begin to see the right side depth of the tower and cottages, the pedestal becomes slightly elliptical. Same deep dark navy flat background, no text, no frame, no border.`;
const browser = await chromium.connectOverCDP('http://127.0.0.1:9222', { timeout: 90000 });
const ctx = browser.contexts()[0];
const cdp = await browser.newBrowserCDPSession();
await cdp.send('Target.createTarget', { url: 'about:blank', background: true });
let page;
for (let i = 0; i < 40; i++) { page = ctx.pages().find(p => p.url() === 'about:blank'); if (page) break; await new Promise(r => setTimeout(r, 250)); }
if (!page) { console.error('no bg tab'); process.exit(3); }
await page.goto('https://gemini.google.com/app/' + CHAT, { waitUntil: 'domcontentloaded', timeout: 60000 });
await page.waitForSelector('div[contenteditable="true"], .ql-editor', { timeout: 30000 });
await page.locator('div[contenteditable="true"]').first().click();
await page.waitForTimeout(1500);
const menuBtn = page.locator('button[aria-label*="Caricamento e strumenti" i], button[aria-label*="pload" i]').first();
await menuBtn.click({ timeout: 15000, force: true });
await page.waitForSelector('input[type="file"]', { state: 'attached', timeout: 20000 });
const fis = page.locator('input[type="file"]');
let attached = false;
for (let i = 0; i < await fis.count(); i++) {
  const accept = (await fis.nth(i).getAttribute('accept')) || '';
  if (accept && !/image|\*/.test(accept)) continue;
  try { await fis.nth(i).setInputFiles('.mw/specs/poi-radial/diorama/gen/diorama-frame-front2.png'); attached = true; break; } catch {}
}
console.log('attached:', attached);
if (!attached) process.exit(4);
await page.waitForTimeout(3000);
const box = page.locator('div[contenteditable="true"]').first();
await box.click(); await box.fill(PROMPT); await page.waitForTimeout(400); await box.press('Enter');
console.log('sent');
const SEL = 'GENERATED-IMAGE img, SINGLE-IMAGE img, model-response img, message-content img';
let last = { n: 0, stable: 0 };
const deadline = Date.now() + 300000;
while (Date.now() < deadline) {
  const n = await page.evaluate((s) => [...document.querySelectorAll(s)].filter(e => e.naturalWidth > 64).length, SEL);
  if (n === last.n && n > 6) { if (++last.stable >= 4) break; } else last = { n, stable: 0 };
  await page.waitForTimeout(2500);
}
console.log('images:', last.n);
const b64 = await page.evaluate((s) => {
  const els = [...document.querySelectorAll(s)].filter(e => e.naturalWidth > 64);
  const el = els[els.length - 1];
  const c = document.createElement('canvas'); c.width = el.naturalWidth; c.height = el.naturalHeight;
  c.getContext('2d').drawImage(el, 0, 0);
  return { w: c.width, h: c.height, data: c.toDataURL('image/png').split(',')[1] };
}, SEL);
fs.writeFileSync(OUT, Buffer.from(b64.data, 'base64'));
console.log('saved', OUT, b64.w + 'x' + b64.h);
await page.close();
process.exit(0);
