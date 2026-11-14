#!/usr/bin/env node
/**
 * _tmp-gemini-diorama — PLAN-117 F2-T0: ask Gemini web (CDP :9222, background
 * tab) to generate the central fan diorama in its FINAL 3/4 pose (= mockup
 * centre). Dedicated chat. Refs: mockup-hub-fan-village.jpg + ref-village.png.
 * CTR-foreground-001: tab via Target.createTarget background:true.
 */
import { chromium } from 'playwright';
import fs from 'fs';

const SPEC = '.mw/specs/poi-radial/diorama/';
const IMGS = [
  '.mw/specs/poi-radial/refs/mockup-hub-fan-village.jpg',
  '.mw/specs/hud-real/village-icon/ref-village.png',
];
const OUT = SPEC + 'gen/diorama-final-c0.png';
const PROMPT = fs.readFileSync(SPEC + 'prompt-final.txt', 'utf8');

const browser = await chromium.connectOverCDP('http://127.0.0.1:9222', { timeout: 90000 });
const ctx = browser.contexts()[0];
const cdp = await browser.newBrowserCDPSession();
const { targetId } = await cdp.send('Target.createTarget', { url: 'about:blank', background: true });
let page;
for (let i = 0; i < 40; i++) {
  page = ctx.pages().find((p) => p.url() === 'about:blank');
  if (page) break;
  await new Promise((r) => setTimeout(r, 250));
}
if (!page) { console.error('background tab not found'); process.exit(3); }

await page.goto('https://gemini.google.com/app', { waitUntil: 'domcontentloaded', timeout: 60000 });
await page.waitForSelector('div[contenteditable="true"], .ql-editor', { timeout: 30000 });

let attached = false;
// open "Caricamento e strumenti" menu -> file inputs appear
try {
  const menuBtn = page.locator('button[aria-label*="Caricamento e strumenti" i], button[aria-label*="pload" i]').first();
  await menuBtn.click({ timeout: 5000 });
  await page.waitForSelector('input[type="file"]', { timeout: 8000 });
} catch { /* menu may already expose inputs */ }
const fis = page.locator('input[type="file"]');
const nfi = await fis.count();
console.log('file inputs:', nfi);
for (let i = 0; i < nfi && !attached; i++) {
  try {
    const accept = (await fis.nth(i).getAttribute('accept')) || '';
    if (accept && !/image|\*/.test(accept)) continue;
    await fis.nth(i).setInputFiles(IMGS);
    attached = true;
    console.log('attached via input', i, 'accept:', accept.slice(0, 60));
  } catch (e) { console.log('input', i, 'failed:', String(e).slice(0, 80)); }
}
if (!attached) {
  try {
    const [chooser] = await Promise.all([
      page.waitForEvent('filechooser', { timeout: 6000 }),
      page.locator('button[role="menuitem"]:has-text("Carica file"), button:has-text("Carica file")').first().click(),
    ]);
    await chooser.setFiles(IMGS);
    attached = true;
    console.log('attached via filechooser');
  } catch (e) { console.log('chooser failed:', String(e).slice(0, 80)); }
}
console.log('image attached:', attached);
if (!attached) { console.error('ATTACH_FAILED'); process.exit(4); }
await page.waitForTimeout(4000);

const box = page.locator('div[contenteditable="true"]').first();
await box.click();
await box.fill(PROMPT);
await page.waitForTimeout(500);
await page.screenshot({ path: SPEC + 'gen/composed.png' });
await box.press('Enter');
console.log('prompt sent, url:', page.url());

const SEL = 'GENERATED-IMAGE img, SINGLE-IMAGE img, model-response img, message-content img';
let last = { n: 0, stable: 0 };
const deadline = Date.now() + 300000;
while (Date.now() < deadline) {
  const n = await page.evaluate((s) => [...document.querySelectorAll(s)].filter((e) => e.naturalWidth > 64).length, SEL);
  if (n === last.n && n > 0) { if (++last.stable >= 4) break; }
  else last = { n, stable: 0 };
  await page.waitForTimeout(2500);
}
console.log('generated images:', last.n);
if (!last.n) { console.error('NO_IMAGE'); process.exit(5); }

const b64 = await page.evaluate((s) => {
  const els = [...document.querySelectorAll(s)].filter((e) => e.naturalWidth > 64);
  const el = els[els.length - 1];
  const c = document.createElement('canvas');
  c.width = el.naturalWidth; c.height = el.naturalHeight;
  c.getContext('2d').drawImage(el, 0, 0);
  return { w: c.width, h: c.height, data: c.toDataURL('image/png').split(',')[1] };
}, SEL);
fs.writeFileSync(OUT, Buffer.from(b64.data, 'base64'));
console.log('saved', OUT, b64.w + 'x' + b64.h, '| chat:', page.url());
await page.close();
process.exit(0);
