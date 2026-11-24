#!/usr/bin/env node
/**
 * _tmp-goblin-scene-gen — drive a BACKGROUND Gemini tab (created via
 * Target.createTarget background:true, never foregrounded) on the
 * Director's Chrome at CDP :9222.
 *
 * Usage:
 *   node scripts/_tmp-goblin-scene-gen.mjs --prompt <file.txt> --ref <img> --out <png> [--target <id>] [--wait 240]
 *
 * With --target it drives the existing background tab with that targetId;
 * without it a new background tab is created and DRIVEN via its own
 * webSocketDebuggerUrl (ctx.pages() does not see CDP-created targets).
 */
import { chromium } from 'playwright';
import fs from 'fs';

const args = process.argv.slice(2);
const get = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d; };
const promptFile = get('--prompt');
const refFile = get('--ref');
const outFile = get('--out');
let targetId = get('--target');
const maxWait = parseInt(get('--wait', '240'), 10);
if (!promptFile || !outFile) { console.error('usage: --prompt <txt> --ref <img> --out <png>'); process.exit(2); }
const promptText = fs.readFileSync(promptFile, 'utf8').trim();

const targets = await (await fetch('http://127.0.0.1:9222/json')).json();

if (!targetId) {
  /* Create a background target through an existing page's CDP session. */
  const bootstrap = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const ctx0 = bootstrap.contexts()[0];
  const anchor = ctx0.pages().find((p) => p.url().includes('gemini')) ?? ctx0.pages()[0];
  const sess = await ctx0.newCDPSession(anchor);
  const res = await sess.send('Target.createTarget', { url: 'https://gemini.google.com/app', background: true });
  targetId = res.targetId;
  await bootstrap.close();
  await new Promise((r) => setTimeout(r, 2500));
}

const target = targets.find((t) => t.id.startsWith(targetId.slice(0, 12))) ??
  (await (await fetch('http://127.0.0.1:9222/json')).json()).find((t) => t.id === targetId);
if (!target) { console.error('target not found:', targetId); process.exit(3); }

const browser = await chromium.connectOverCDP(target.webSocketDebuggerUrl);
const ctx = browser.contexts()[0];
const page = ctx.pages()[0] ?? (await ctx.waitForEvent('page'));
await page.waitForLoadState('domcontentloaded').catch(() => {});
await page.waitForTimeout(4000);
console.log('driving', page.url());

/* Attach the ref via the upload menu / hidden file input. */
if (refFile) {
  let attached = false;
  try {
    await page.locator('button[aria-label*="Caricamento"], button[aria-label*="pload"], button[aria-label*="llega"]').first().click({ timeout: 8000 });
    await page.waitForTimeout(1200);
    if (await page.locator('input[type="file"]').count()) {
      await page.locator('input[type="file"]').first().setInputFiles(refFile);
      attached = true;
    } else {
      const [fc] = await Promise.all([
        page.waitForEvent('filechooser', { timeout: 8000 }),
        page.locator('[role="menuitem"]:has-text("File"), button:has-text("File"), mat-option:has-text("File")').first().click(),
      ]);
      await fc.setFiles(refFile);
      attached = true;
    }
  } catch (e) { console.error('attach failed:', e.message.split('\n')[0]); }
  console.log('ref attached:', attached);
  await page.waitForTimeout(4000);
}

const box = page.locator('div[contenteditable="true"], .ql-editor, textarea').first();
await box.click();
await box.fill(promptText);
await page.waitForTimeout(800);
await page.keyboard.press('Enter');
console.log('prompt submitted');

const SEL = 'GENERATED-IMAGE img, SINGLE-IMAGE img, model-response img, MODEL-RESPONSE img, img[src^="https://lh3.googleusercontent.com"]';
let ok = false;
for (let s = 0; s < maxWait; s += 4) {
  ok = await page.evaluate((sel) => {
    const els = [...document.querySelectorAll(sel)].filter((e) => e.naturalWidth > 100 && e.complete);
    return els.length > 0;
  }, SEL);
  if (ok) break;
  await page.waitForTimeout(4000);
}
if (!ok) { console.error('no image after', maxWait, 's — chat:', page.url()); process.exit(4); }
await page.waitForTimeout(5000);

const b64 = await page.evaluate((sel) => {
  const els = [...document.querySelectorAll(sel)].filter((e) => e.naturalWidth > 100);
  const el = els[els.length - 1];
  const c = document.createElement('canvas');
  c.width = el.naturalWidth; c.height = el.naturalHeight;
  c.getContext('2d').drawImage(el, 0, 0);
  return { w: el.naturalWidth, h: el.naturalHeight, src: (el.src || '').slice(0, 120), data: c.toDataURL('image/png').split(',')[1] };
}, SEL);
fs.mkdirSync(outFile.split('/').slice(0, -1).join('/'), { recursive: true });
fs.writeFileSync(outFile, Buffer.from(b64.data, 'base64'));
console.log('saved', outFile, `${b64.w}x${b64.h}`, b64.src);
console.log('chat:', page.url());
process.exit(0);
