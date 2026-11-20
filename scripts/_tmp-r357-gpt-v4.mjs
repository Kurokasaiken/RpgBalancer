/* R-357 v4 ChatGPT driver (account chosen by tab match). args: <tabMatch> <promptFile> <outDir> <img...> ; fresh chat, attach, send, harvest assistant image(s). */
import { chromium } from 'playwright';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
const [ACCT, PROMPT_F, OUT, ...IMGS] = process.argv.slice(2); const TAB = 'chatgpt.com';
mkdirSync(OUT, { recursive: true });
const PROMPT = readFileSync(PROMPT_F, 'utf8');
const b = await chromium.connectOverCDP('http://localhost:9222');
let page = null;
for (const ctx of b.contexts()) for (const p of ctx.pages()) if (p.url().includes(TAB) && p.url().includes('chatgpt.com')) { const em = await p.evaluate(async () => { try { return (await fetch('/api/auth/session').then((r) => r.json())).user?.email || ''; } catch { return ''; } }); if (em.startsWith(ACCT)) page = p; }
if (!page) { console.log('NO_TAB'); process.exit(1); }
await page.goto('https://chatgpt.com/'); await page.waitForTimeout(6000);
for (let i = 0; i < 6; i++) { const rm = page.locator('button[aria-label*="Remove" i], button[aria-label*="Rimuovi" i]'); if (!(await rm.count())) break; await rm.first().click(); await page.waitForTimeout(400); }
await page.locator('[contenteditable=true]').first().click(); await page.keyboard.press('Meta+A'); await page.keyboard.press('Backspace');
await page.locator('input[type=file][multiple]').first().setInputFiles(IMGS.map((f) => path.resolve(f)));
await page.waitForTimeout(10000);
await page.screenshot({ path: `${OUT}/attach.png` });
await page.evaluate((t) => { const el = document.querySelector('[contenteditable=true]'); el.focus(); document.execCommand('insertText', false, t); }, PROMPT);
await page.waitForTimeout(1500);
const sendSel = 'button[data-testid="send-button"], #composer-submit-button, button[aria-label*="Send" i], button[aria-label*="Invia" i]';
let sent = false;
for (let i = 0; i < 20 && !sent; i++) { const btn = page.locator(sendSel).first(); if (await btn.count() && await btn.isEnabled()) { await btn.click(); sent = true; } else await page.waitForTimeout(1500); }
if (!sent) { await page.locator('[contenteditable=true]').first().click(); await page.keyboard.press('Enter'); }
console.log('sent', sent ? 'button' : 'enter');
await page.waitForTimeout(25000);
const pick = () => page.evaluate(() => [...document.querySelectorAll('img')].filter((i) => i.src && !i.closest('[data-message-author-role="user"]')).filter((i) => /blob:|oaiusercontent|chatgpt\.com\/backend/.test(i.src)).filter((i) => i.naturalWidth >= 512 && i.naturalHeight >= 400).map((i) => i.src));
let urls = []; const deadline = Date.now() + 900000;
while (Date.now() < deadline) {
  const streaming = await page.locator('button[data-testid="stop-button"], button[aria-label*="Stop" i]').count();
  urls = [...new Set(await pick())];
  if (!streaming && urls.length) { await page.waitForTimeout(8000); urls = [...new Set(await pick())]; break; }
  const txt = await page.evaluate(() => document.querySelector('main')?.innerText.slice(-300) || '');
  if (!streaming && /limite|limit/i.test(txt) && !urls.length) { console.log('LIMIT:', txt.replace(/\n/g, ' ')); break; }
  await page.waitForTimeout(6000);
}
console.log('conversation:', page.url(), 'images:', urls.length);
let k = 0;
for (const u of urls) { const b64 = await page.evaluate(async (s) => { const r = await fetch(s); const buf = new Uint8Array(await r.arrayBuffer()); let o = ''; for (let i = 0; i < buf.length; i += 32768) o += String.fromCharCode.apply(null, buf.subarray(i, i + 32768)); return btoa(o); }, u); k += 1; writeFileSync(`${OUT}/full-${k}.png`, Buffer.from(b64, 'base64')); }
await page.screenshot({ path: `${OUT}/response.png` });
console.log('saved', k); await b.close();
