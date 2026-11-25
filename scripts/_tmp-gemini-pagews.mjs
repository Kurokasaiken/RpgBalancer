/* Page-ws variant: connect directly to a page webSocketDebuggerUrl (heavy
 * browser workaround for connectOverCDP timeouts). usage:
 * node _tmp-gemini-pagews.mjs <wsUrlFileOrUrl> <promptFile> <outPng> [refImg] */
import { chromium } from 'playwright';
import fs from 'node:fs';
const [wsArg, promptFile, outPng, refImg] = process.argv.slice(2);
const WS = wsArg.startsWith('ws://') ? wsArg : fs.readFileSync(wsArg, 'utf8').trim();
const PROMPT = fs.readFileSync(promptFile, 'utf8');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const page = await chromium.connect(WS).then(b => b.contexts()[0].pages()[0]);
await page.goto('https://gemini.google.com/app', { waitUntil: 'domcontentloaded' });
await sleep(6000);
const editor = page.locator('.ql-editor[contenteditable="true"], rich-textarea .ql-editor, div[contenteditable="true"]').first();
await editor.waitFor({ timeout: 25000 });
if (refImg) {
  const fi = page.locator('input[type="file"]');
  if (await fi.count()) await fi.first().setInputFiles(refImg);
  else { await page.locator('button[aria-label*="pload"], button[aria-label*="add" i]').first().click(); await sleep(1000); await page.locator('input[type="file"]').first().setInputFiles(refImg); }
  await sleep(5000);
}
await editor.click(); await editor.fill(PROMPT); await sleep(600);
const baseline = await page.evaluate(() => document.querySelectorAll('img').length);
await page.keyboard.press('Enter');
console.log('prompt sent, baseline', baseline);
let lastSrc = '', stable = 0, good = null;
for (let i = 0; i < 80; i++) {
  await sleep(3000);
  const info = await page.evaluate(() =>
    [...document.querySelectorAll('img')].map((im) => ({ s: im.src, w: im.naturalWidth })));
  const big = info.filter((x) => x.w > 400 && x.s.startsWith('blob:')).sort((a, b) => b.w - a.w)[0];
  if (big && info.length > baseline) {
    if (big.s === lastSrc) stable++; else { stable = 0; lastSrc = big.s; }
    if (stable >= 2) { good = big; break; }
  }
}
if (!good) { console.log('NO IMAGE'); process.exit(1); }
const dataUrl = await page.evaluate((s) => {
  const im = [...document.querySelectorAll('img')].find((x) => x.src === s);
  const c = document.createElement('canvas');
  c.width = im.naturalWidth; c.height = im.naturalHeight;
  c.getContext('2d').drawImage(im, 0, 0);
  return c.toDataURL('image/png');
}, good.s);
fs.writeFileSync(outPng, Buffer.from(dataUrl.split(',')[1], 'base64'));
console.log('saved', outPng, good.w);
await page.close();
process.exit(0);
