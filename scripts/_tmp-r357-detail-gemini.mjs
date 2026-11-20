/* R-357 Detail mockup — Gemini driver on a NEW background tab (does not touch existing chats/tabs).
   args: <promptFile> <outPng> [img...] */
import { chromium } from 'playwright';
import { readFileSync, writeFileSync } from 'node:fs';
const [PROMPT_F, OUT, ...IMGS] = process.argv.slice(2);
const PROMPT = readFileSync(PROMPT_F, 'utf8');
const b = await chromium.connectOverCDP('http://localhost:9222', { timeout: 180000 });
const bs = await b.newBrowserCDPSession();
let page = null;
// reuse a fresh /app tab if one is already open (avoid multiplying tabs across runs)
for (const ctx of b.contexts()) for (const p of ctx.pages()) if (!page && /gemini\.google\.com\/app\/?$/.test(p.url())) page = p;
if (!page) {
  const before = new Set();
  for (const ctx of b.contexts()) for (const p of ctx.pages()) before.add(p);
  await bs.send('Target.createTarget', { url: 'https://gemini.google.com/app', background: true });
  for (let i = 0; i < 40 && !page; i++) {
    await new Promise((r) => setTimeout(r, 1000));
    for (const ctx of b.contexts()) for (const p of ctx.pages()) if (!before.has(p) && /gemini\.google\.com/.test(p.url())) page = p;
  }
}
if (!page) { console.log('NO_TAB'); process.exit(1); }
await page.waitForTimeout(8000);
try { await page.getByRole('button', { name: /^Chiudi$/ }).first().click({ timeout: 2000 }); } catch {}
const prior = await page.evaluate(() => [...document.querySelectorAll('GENERATED-IMAGE img, SINGLE-IMAGE img')].map((i) => i.src));
const path = await import('node:path');
const files = IMGS.map((f) => path.resolve(f));
const cdp = await page.context().newCDPSession(page);
const setViaCdp = async () => {
  const { root } = await cdp.send('DOM.getDocument', { depth: -1, pierce: true });
  const { nodeIds } = await cdp.send('DOM.querySelectorAll', { nodeId: root.nodeId, selector: 'input[type=file]' });
  for (const id of nodeIds) { const { node } = await cdp.send('DOM.describeNode', { nodeId: id }); if ((node.attributes || []).join(' ').includes('image')) { await cdp.send('DOM.setFileInputFiles', { nodeId: id, files }); return true; } }
  return false;
};
let ok = await setViaCdp();
if (!ok) {
  // the file input only exists after opening the "+" upload menu
  const plus = page.locator('button[aria-label*="Caricamento" i], button[aria-label*="upload" i], button[aria-label*="strumenti" i]').first();
  await plus.click().catch(() => {});
  await page.waitForTimeout(1500);
  ok = await setViaCdp();
  if (!ok) {
    const chooser = page.waitForEvent('filechooser', { timeout: 8000 }).then((fc) => fc.setFiles(files)).then(() => true).catch(() => false);
    await page.locator('[role="menuitem"], li, button').filter({ hasText: /Carica file|Upload file|Foto|Immagini/i }).first().click().catch(() => {});
    ok = await chooser || await setViaCdp();
  }
}
await page.waitForTimeout(9000);
await page.screenshot({ path: OUT.replace(/\.png$/, '-attach.png') });
console.log('attached', ok, files.length);
if (!ok) process.exit(3);
await page.locator('[contenteditable=true]').first().click();
await page.evaluate((t) => { const el = document.querySelector('[contenteditable=true]'); el.focus(); document.execCommand('insertText', false, t); }, PROMPT);
await page.waitForTimeout(800); await page.keyboard.press('Enter');
console.log('sent');
await page.waitForTimeout(20000);
const deadline = Date.now() + 600000; let src = null;
while (Date.now() < deadline) {
  const now = await page.evaluate(() => [...document.querySelectorAll('GENERATED-IMAGE img, SINGLE-IMAGE img')].filter((i) => i.naturalWidth > 200).map((i) => i.src));
  const fresh = now.filter((s) => !prior.includes(s));
  if (fresh.length) { await page.waitForTimeout(6000); src = fresh[fresh.length - 1]; break; }
  await page.waitForTimeout(5000);
}
await page.screenshot({ path: OUT.replace(/\.png$/, '-response.png') });
if (!src) { console.log('NO_IMAGE'); process.exit(2); }
console.log('src', src.slice(0, 120));
const pathm = await import('node:path'); const fs = await import('node:fs'); const { execSync } = await import('node:child_process');
const DL = pathm.resolve(pathm.dirname(OUT), 'dl'); fs.mkdirSync(DL, { recursive: true });
const beforeDl = new Set(fs.readdirSync(DL));
await bs.send('Browser.setDownloadBehavior', { behavior: 'allow', downloadPath: DL });
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
