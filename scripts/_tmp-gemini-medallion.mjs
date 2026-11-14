#!/usr/bin/env node
/**
 * _tmp-gemini-medallion — ask Gemini web (CDP :9222, background tab) to edit
 * the medallion PNG: keep only the medallion, empty the centre, magenta bg.
 * Saves the generated image to out/medallion-edit/ai-gemini.png
 *
 * CTR-foreground-001: tab created via Target.createTarget background:true —
 * never brings a window/tab to front, never bringToFront.
 */
import { chromium } from 'playwright';
import fs from 'fs';

const SRC = 'out/medallion-edit/source.png';
const OUT = 'out/medallion-edit/ai-gemini.png';
const PROMPT = `Edit this image. Keep ONLY the golden ornate compass medallion: the outer gold ring, the four gold spikes at top/bottom/left/right with their emerald gems, and the inner dark teal-green glassy disc. Remove EVERYTHING else: the map background, the horizontal green-and-gold banner plaque behind the medallion, and any text. Inside the medallion, empty the very center completely: remove the big central emerald gem, the gold four-pointed star needles and the gold diagonal cross in the middle. Fill that central area with the same smooth dark teal-green glassy material as the inner disc, clean and empty, ready to hold an icon. Keep every spike, gem and gold detail of the medallion pixel-faithful. Place the medallion centered on a flat solid magenta background (pure #FF00FF), edge to edge.`;

const browser = await chromium.connectOverCDP('http://127.0.0.1:9222');
const ctx = browser.contexts()[0];

// background tab (no focus steal)
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

// attach image: hidden file input if present, else "+" menu -> upload
let attached = false;
const fi = page.locator('input[type="file"]').first;
if ((await fi.count()) > 0) {
  await fi.setInputFiles(SRC);
  attached = true;
} else {
  for (const sel of [
    'button[aria-label*="pload" i]', 'button[aria-label*="allega" i]',
    'button[aria-label*="Attach" i]', 'button[aria-label*="file" i]',
    'button[aria-label*="foto" i]', 'button[aria-label*="menu" i]',
  ]) {
    const b = page.locator(sel).first;
    if (await b.count() === 0) continue;
    try {
      const [chooser] = await Promise.all([
        page.waitForEvent('filechooser', { timeout: 5000 }),
        b.click(),
      ]);
      await chooser.setFiles(SRC);
      attached = true;
      break;
    } catch { /* next selector */ }
    try {
      const item = page.locator('button:has-text("pload"), [role="menuitem"]:has-text("pload"), button:has-text("arica"), [role="menuitem"]:has-text("arica")').first;
      if (await item.count() > 0) {
        const [chooser] = await Promise.all([
          page.waitForEvent('filechooser', { timeout: 5000 }),
          item.click(),
        ]);
        await chooser.setFiles(SRC);
        attached = true;
        break;
      }
    } catch { /* continue */ }
  }
}
console.log('image attached:', attached);
if (!attached) { console.error('ATTACH_FAILED'); process.exit(4); }
await page.waitForTimeout(2500);

const box = page.locator('div[contenteditable="true"]').first;
await box.click();
await box.fill(PROMPT);
await page.waitForTimeout(500);
await box.press('Enter');
console.log('prompt sent');

// wait for the generated image to appear and stabilise
const SEL = 'GENERATED-IMAGE img, SINGLE-IMAGE img, model-response img, message-content img';
let last = { n: 0, stable: 0 };
const deadline = Date.now() + 240000;
while (Date.now() < deadline) {
  const n = await page.evaluate((s) => {
    const els = [...document.querySelectorAll(s)].filter((e) => e.naturalWidth > 64);
    return els.length;
  }, SEL);
  if (n === last.n && n > 0) {
    if (++last.stable >= 4) break;
  } else last = { n, stable: 0 };
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
console.log('saved', OUT, b64.w + 'x' + b64.h);
await page.close();
process.exit(0);
