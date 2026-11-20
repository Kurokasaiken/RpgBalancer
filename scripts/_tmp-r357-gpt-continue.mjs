/* send a follow-up turn in an existing ChatGPT chat (no attachments), then harvest the NEW assistant image */
import { chromium } from 'playwright';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
const [CHAT, PROMPT_F, OUT] = process.argv.slice(2); mkdirSync(OUT, { recursive: true });
const b = await chromium.connectOverCDP('http://localhost:9222');
let page = null; for (const ctx of b.contexts()) for (const p of ctx.pages()) if (p.url().includes(CHAT)) page = p;
if (!page) { console.log('NO_TAB'); process.exit(1); }
const sel = '[data-message-author-role="assistant"] img, [data-testid*="image" i] img';
const before = await page.evaluate((s) => [...document.querySelectorAll(s)].filter((i) => i.naturalWidth >= 700).map((i) => i.src), sel);
await page.locator('[contenteditable=true]').first().click();
await page.evaluate((t) => { const el = document.querySelector('[contenteditable=true]'); el.focus(); document.execCommand('insertText', false, t); }, readFileSync(PROMPT_F, 'utf8'));
await page.waitForTimeout(1500);
const sendSel = 'button[data-testid="send-button"], #composer-submit-button, button[aria-label*="Send" i], button[aria-label*="Invia" i]';
let sent = false; for (let i = 0; i < 20 && !sent; i++) { const btn = page.locator(sendSel).first(); if (await btn.count() && await btn.isEnabled()) { await btn.click(); sent = true; } else await page.waitForTimeout(1500); }
if (!sent) { await page.keyboard.press('Enter'); } console.log('sent', sent);
await page.waitForTimeout(25000);
let fresh = []; const deadline = Date.now() + 1200000;
while (Date.now() < deadline) {
  const streaming = await page.locator('button[data-testid="stop-button"], button[aria-label*="Stop" i]').count();
  const now = await page.evaluate((s) => [...document.querySelectorAll(s)].filter((i) => i.naturalWidth >= 700).map((i) => i.src), sel);
  fresh = [...new Set(now)].filter((u) => !before.includes(u));
  const txt = await page.evaluate(() => document.querySelector('main')?.innerText.slice(-400) || '');
  if (!streaming && fresh.length) { await page.waitForTimeout(8000); break; }
  if (!streaming && /limite|limit/i.test(txt)) { console.log('LIMIT:', txt.replace(/\n/g, ' ')); break; }
  await page.waitForTimeout(8000);
}
console.log('fresh images', fresh.length);
let k = 0; for (const u of fresh) { const b64 = await page.evaluate(async (s) => { const r = await fetch(s); const buf = new Uint8Array(await r.arrayBuffer()); let o = ''; for (let i = 0; i < buf.length; i += 32768) o += String.fromCharCode.apply(null, buf.subarray(i, i + 32768)); return btoa(o); }, u); k++; writeFileSync(`${OUT}/gen-${k}.png`, Buffer.from(b64, 'base64')); }
await page.screenshot({ path: `${OUT}/response.png` }); console.log('saved', k); await b.close();
