import { chromium } from 'playwright';
import fs from 'fs';
const SRC = '/Users/faustoboni/progetti_personali/RPG/.mw/specs/poi-radial/refs/mockup-hub-fan-village.jpg';
const OUT = '.mw/specs/poi-radial/gen/mockup-detext.png';
const PROMPT = `Edit this image: remove ALL text labels and letters from every card/plate (TAGLIALEGNA, MINA, AGRICOLTURA, FORGIA, MERCATO, TAVERNA, MAPPA DEL MONDO and any other text), replacing each text area with the same painted vitreous enamel texture that surrounds it. Keep every other element pixel-identical: card shapes, gold borders, gems, painted icons, the central village diorama on its gold pedestal, and the painted map background.`;
const browser = await chromium.connectOverCDP('http://127.0.0.1:9222', { timeout: 60000 });
const ctx = browser.contexts()[0];
const cdp = await browser.newBrowserCDPSession();
await cdp.send('Target.createTarget', { url: 'about:blank', background: true });
let page;
for (let i = 0; i < 80; i++) { page = ctx.pages().find(p => p.url() === 'about:blank'); if (page) break; await new Promise(r => setTimeout(r, 250)); }
if (!page) { console.error('no bg tab'); process.exit(3); }
await page.goto('https://chatgpt.com/', { waitUntil: 'domcontentloaded', timeout: 60000 });
console.log('on:', page.url());
await page.waitForTimeout(6000);
// open attach menu (paperclip / + button)
const plusBtn = page.locator('button[data-testid="composer-plus-btn"], button[aria-label*="Attach"], button[aria-label*="Allega"], button[aria-label*="files"], button[aria-label*="File"]').first();
const nIn0 = await page.evaluate(() => document.querySelectorAll('input[type="file"]').length);
console.log('file inputs before menu:', nIn0);
if (await plusBtn.count()) { await plusBtn.click().catch(()=>{}); await page.waitForTimeout(1500); }
// look for menu item "Carica dal computer" / "Upload from computer"
const menuItem = page.locator('[role="menuitem"], [role="menuitemradio"], li, button').filter({ hasText: /computer|upload|carica/i }).first();
if (await menuItem.count()) {
  const [fc] = await Promise.all([
    page.waitForEvent('filechooser', { timeout: 5000 }).catch(() => null),
    menuItem.click().catch(() => {})
  ]);
  if (fc) { await fc.setFiles(SRC); console.log('filechooser upload ok'); }
}
if (!(await page.evaluate(() => !!document.querySelector('input[type="file"]') && document.querySelector('input[type="file"]').files.length))) {
  const fis = page.locator('input[type="file"]');
  for (let i = 0; i < await fis.count(); i++) {
    try { await fis.nth(i).setInputFiles(SRC); console.log('direct setInputFiles ok'); break; } catch {}
  }
}
await page.waitForTimeout(6000);
await page.screenshot({ path: '/tmp/gpt-attach.png' });
// type prompt
const editor = page.locator('#prompt-textarea, div[contenteditable="true"]').first();
await editor.click();
await page.evaluate((txt) => {
  const ed = document.querySelector('#prompt-textarea, div[contenteditable="true"]');
  ed.focus();
  document.execCommand('insertText', false, txt);
}, PROMPT);
await page.waitForTimeout(800);
await page.keyboard.press('Enter');
console.log('sent');
// wait for generated image
const SEL = 'img[alt*="Generated"], img[src*="oaiusercontent"], .message img, [data-message-author-role="assistant"] img';
let last = { n: 0, stable: 0 };
const deadline = Date.now() + 360000;
while (Date.now() < deadline) {
  const n = await page.evaluate((s) => [...document.querySelectorAll(s)].filter(e => e.naturalWidth > 128).length, SEL);
  if (n === last.n && n >= 1) { if (++last.stable >= 4) break; } else last = { n, stable: 0 };
  await page.waitForTimeout(4000);
}
console.log('imgs:', last.n);
if (last.n < 1) { const t = await page.evaluate(() => { const m=[...document.querySelectorAll('[data-message-author-role="assistant"]')]; return (m.slice(-1)[0]?.innerText||'').slice(0,400); }); console.log('RESP:', t); process.exit(5); }
const b64 = await page.evaluate((s) => {
  const els = [...document.querySelectorAll(s)].filter(e => e.naturalWidth > 128);
  const el = els[els.length - 1];
  const c = document.createElement('canvas'); c.width = el.naturalWidth; c.height = el.naturalHeight;
  c.getContext('2d').drawImage(el, 0, 0);
  return { w: c.width, h: c.height, data: c.toDataURL('image/png').split(',')[1] };
}, SEL);
fs.mkdirSync('.mw/specs/poi-radial/gen', { recursive: true });
fs.writeFileSync(OUT, Buffer.from(b64.data, 'base64'));
console.log('saved', OUT, b64.w + 'x' + b64.h);
process.exit(0);
