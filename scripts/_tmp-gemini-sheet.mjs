/* Generic Gemini-web sheet generator — CDP :9222 background target.
 * usage: node scripts/_tmp-gemini-sheet.mjs <promptFile> <outPng> [refImg] */
import { chromium } from 'playwright';
import fs from 'node:fs';

const [promptFile, outPng, refImg] = process.argv.slice(2);
const PROMPT = fs.readFileSync(promptFile, 'utf8');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const browser = await chromium.connectOverCDP('http://127.0.0.1:9222');
const ctx = browser.contexts()[0];
// browser-level session: ctx.newPage() creates an ACTIVE tab and raises the window (REG-001/CTR-foreground-001)
const cdp = await browser.newBrowserCDPSession();
const { targetId } = await cdp.send('Target.createTarget', { url: 'about:blank', background: true });
await cdp.detach();
let page = null;
for (let i = 0; i < 20 && !page; i++) {
  page = ctx.pages().find((p) => p.url() === 'about:blank');
  if (!page) await sleep(400);
}
if (!page) { console.log('no dedicated target'); process.exit(1); }
await page.goto('https://gemini.google.com/app', { waitUntil: 'domcontentloaded' });
await sleep(5000);

const editor = page.locator('.ql-editor[contenteditable="true"], rich-textarea .ql-editor, div[contenteditable="true"]').first();
await editor.waitFor({ timeout: 20000 });
if (refImg) {
  const fi = page.locator('input[type="file"]');
  if (await fi.count()) await fi.first().setInputFiles(refImg);
  else { await page.locator('button[aria-label*="pload"], button[aria-label*="add" i]').first().click(); await sleep(1000); await page.locator('input[type="file"]').first().setInputFiles(refImg); }
  await sleep(5000);
}
await editor.click();
await editor.fill(PROMPT);
await sleep(600);
await page.keyboard.press('Enter');
console.log('prompt sent');

let lastSrc = '', stable = 0, good = null;
for (let i = 0; i < 80; i++) {
  await sleep(3000);
  const info = await page.evaluate(() =>
    [...document.querySelectorAll('img')].map((im) => ({ s: im.src, w: im.naturalWidth })));
  const big = info.filter((x) => x.w > 400).sort((a, b) => b.w - a.w)[0];
  if (big) {
    if (big.s === lastSrc) stable++; else { stable = 0; lastSrc = big.s; }
    if (stable >= 2) { good = big; break; }
  }
}
if (!good) { console.log('NO IMAGE'); process.exit(1); }
console.log('image found', good.w, good.s.slice(0, 60));
// harvest: element screenshot (blob:/CORS-safe)
const el = await page.evaluateHandle((src) => [...document.querySelectorAll('img')].find((im) => im.src === src), good.s);
await el.asElement().screenshot({ path: outPng });
console.log('saved', outPng);
try { const s2 = await ctx.newCDPSession(page); await s2.send('Target.closeTarget', { targetId }); } catch {}
process.exit(0);
