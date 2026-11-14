#!/usr/bin/env node
// F2-T0 variant c1: same dedicated chat, anchored variant — higher camera.
import { chromium } from 'playwright';
import fs from 'fs';
const CHAT = 'd9c147e0b3b074e6';
const OUT = '.mw/specs/poi-radial/diorama/gen/diorama-final-c1.png';
const PROMPT = `Second variant of the same miniature village diorama on its engraved antique-gold pedestal with inset gems: identical subject, identical impasto painterly style, identical warm lit windows, same small birch, crimson maple and little orchard tree with different canopies. Only change the CAMERA: raise the viewpoint slightly so the three-quarter view reveals more of the village square, the dirt paths and the rooftops from above (closer to a tabletop miniature seen standing in front of it). Keep the pedestal fully visible at the bottom, the same deep dark navy flat background, no text, no frame, no border.`;
const browser = await chromium.connectOverCDP('http://127.0.0.1:9222', { timeout: 90000 });
const ctx = browser.contexts()[0];
const cdp = await browser.newBrowserCDPSession();
await cdp.send('Target.createTarget', { url: 'about:blank', background: true });
let page;
for (let i = 0; i < 40; i++) { page = ctx.pages().find(p => p.url() === 'about:blank'); if (page) break; await new Promise(r => setTimeout(r, 250)); }
if (!page) { console.error('no bg tab'); process.exit(3); }
await page.goto('https://gemini.google.com/app/' + CHAT, { waitUntil: 'domcontentloaded', timeout: 60000 });
await page.waitForSelector('div[contenteditable="true"], .ql-editor', { timeout: 30000 });
const box = page.locator('div[contenteditable="true"]').first();
await box.click(); await box.fill(PROMPT); await page.waitForTimeout(400); await box.press('Enter');
console.log('sent');
const SEL = 'GENERATED-IMAGE img, SINGLE-IMAGE img, model-response img, message-content img';
let last = { n: 1, stable: 0 };
const deadline = Date.now() + 300000;
while (Date.now() < deadline) {
  const n = await page.evaluate((s) => [...document.querySelectorAll(s)].filter(e => e.naturalWidth > 64).length, SEL);
  if (n === last.n && n > 1) { if (++last.stable >= 4) break; } else last = { n, stable: 0 };
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
