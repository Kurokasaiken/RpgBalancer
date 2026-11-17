/* R-357 v4 Gemini driver. args: <promptFile> <outPng> <new|continue> [img...] */
import { chromium } from 'playwright';
import { readFileSync, writeFileSync } from 'node:fs';
const [PROMPT_F, OUT, MODE, ...IMGS] = process.argv.slice(2);
const PROMPT = readFileSync(PROMPT_F, 'utf8');
const b = await chromium.connectOverCDP('http://localhost:9222');
let page = null;
const want = MODE === 'new' ? /gemini\.google\.com/ : new RegExp(MODE.replace(/[.?]/g, '\\$&'));
for (const ctx of b.contexts()) for (const p of ctx.pages()) if (!page && want.test(p.url())) page = p;
if (!page) { console.log('NO_TAB'); process.exit(1); }
if (MODE === 'new') { await page.goto('https://gemini.google.com/app', { waitUntil: 'domcontentloaded' }); await page.waitForTimeout(5000); }
try { await page.getByRole('button', { name: /^Chiudi$/ }).first().click({ timeout: 2000 }); } catch {}
const before = await page.evaluate(() => [...document.querySelectorAll('GENERATED-IMAGE img, SINGLE-IMAGE img')].map((i) => i.src));
if (IMGS.length) {
  const path = await import('node:path');
  const files = IMGS.map((f) => path.resolve(f));
  const cdp = await page.context().newCDPSession(page);
  const { root } = await cdp.send('DOM.getDocument', { depth: -1, pierce: true });
  const { nodeIds } = await cdp.send('DOM.querySelectorAll', { nodeId: root.nodeId, selector: 'input[type=file]' });
  let ok = false;
  for (const id of nodeIds) { const { node } = await cdp.send('DOM.describeNode', { nodeId: id }); if ((node.attributes || []).join(' ').includes('image/*')) { await cdp.send('DOM.setFileInputFiles', { nodeId: id, files }); ok = true; break; } }
  await page.waitForTimeout(9000);
  await page.screenshot({ path: OUT.replace(/\.png$/, '-attach.png') });
  console.log('attached', ok, files.length);
  if (!ok) process.exit(3);
}
await page.locator('[contenteditable=true]').first().click();
await page.evaluate((t) => { const el = document.querySelector('[contenteditable=true]'); el.focus(); document.execCommand('insertText', false, t); }, PROMPT);
await page.waitForTimeout(800); await page.keyboard.press('Enter');
console.log('sent');
await page.waitForTimeout(20000);
const deadline = Date.now() + 600000; let src = null;
while (Date.now() < deadline) {
  const now = await page.evaluate(() => [...document.querySelectorAll('GENERATED-IMAGE img, SINGLE-IMAGE img')].filter((i) => i.naturalWidth > 200).map((i) => i.src));
  const fresh = now.filter((s) => !before.includes(s));
  if (fresh.length) { await page.waitForTimeout(6000); src = fresh[fresh.length - 1]; break; }
  await page.waitForTimeout(5000);
}
await page.screenshot({ path: OUT.replace(/\.png$/, '-response.png') });
if (!src) { console.log('NO_IMAGE'); process.exit(2); }
console.log('src', src.slice(0, 120));
/* full-size download via Gemini's own button, into <OUT dir>/dl, then convert to OUT */
const pathm = await import('node:path'); const fs = await import('node:fs'); const { execSync } = await import('node:child_process');
const DL = pathm.resolve(pathm.dirname(OUT), 'dl'); fs.mkdirSync(DL, { recursive: true });
const beforeDl = new Set(fs.readdirSync(DL));
const bs = await b.newBrowserCDPSession(); await bs.send('Browser.setDownloadBehavior', { behavior: 'allow', downloadPath: DL });
let saved = false;
try {
  await page.locator('GENERATED-IMAGE img, SINGLE-IMAGE img').last().hover(); await page.waitForTimeout(1000);
  await page.locator('button[aria-label="Scarica immagine alla massima risoluzione"]').last().click({ timeout: 5000 });
  for (let i = 0; i < 20 && !saved; i++) { await page.waitForTimeout(2000); const nf = fs.readdirSync(DL).filter((f) => !beforeDl.has(f) && !f.endsWith('.crdownload')); if (nf.length) { execSync(`sips -s format png "${DL}/${nf[0]}" --out "${pathm.resolve(OUT)}"`); console.log('full-size', nf[0]); saved = true; } }
} catch (e) { console.log('dl fail', String(e).slice(0, 100)); }
await bs.send('Browser.setDownloadBehavior', { behavior: 'default' });
if (!saved) {
  const d = await page.evaluate((s) => { const el = [...document.querySelectorAll('GENERATED-IMAGE img, SINGLE-IMAGE img')].find((i) => i.src === s); const c = document.createElement('canvas'); c.width = el.naturalWidth; c.height = el.naturalHeight; c.getContext('2d').drawImage(el, 0, 0); return c.toDataURL('image/png').split(',')[1]; }, src);
  writeFileSync(OUT, Buffer.from(d, 'base64')); console.log('canvas save');
}
console.log('chat', page.url()); process.exit(0);
