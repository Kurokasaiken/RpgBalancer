/* R-357 v3 (from R-353 Gemini driver): HUD screen + Events + Event Detail mockup. */
import { chromium } from 'playwright';
import { mkdirSync, readFileSync } from 'node:fs';

const RUN = '/Users/faustoboni/progetti_personali/RPG/.mw/runs/20261117-r357-eventi-mockup-v3';
const OUT = `${RUN}/gen-gemini`;
mkdirSync(OUT, { recursive: true });
const PROMPT = 'Crea un\'immagine.\n\n' + readFileSync(`${RUN}/prompt.txt`, 'utf8');
const IMG = `${RUN}/ref-hud-solo.png`;

const b = await chromium.connectOverCDP('http://localhost:9222');
let page = null;
for (const ctx of b.contexts()) for (const p of ctx.pages()) if (!page && /gemini\.google\.com/.test(p.url())) page = p;
if (!page) { console.log('NO_TAB'); process.exit(1); }
console.log('tab:', page.url().slice(0, 70));

/* new chat for a clean turn */
await page.goto('https://gemini.google.com/app', { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(5000);

try { await page.getByRole('button', { name: /^Chiudi$/ }).first().click({ timeout: 3000 }); } catch {}
await page.waitForTimeout(1000);

const inputs = await page.locator('input[type=file]').all();
let attached = false;
for (const inp of inputs) {
  try { await inp.setInputFiles(IMG, { timeout: 3000 }); attached = true; break; } catch {}
}
if (!attached) {
  console.log('direct attach failed, trying + menu');
  try {
    await page.locator('button[aria-label*="Caricamento" i], button[aria-label*="upload" i], button[aria-label*="Aggiungi" i]').first().click({ timeout: 4000 });
    await page.waitForTimeout(1200);
    await page.locator('input[type=file]').first().setInputFiles(IMG);
    attached = true;
  } catch (e) { console.log('attach via menu failed:', String(e).slice(0, 120)); }
}
console.log('attached:', attached);
await page.waitForTimeout(4000);
await page.screenshot({ path: `${OUT}/attach-state.png` });

const composer = page.locator('[contenteditable=true]').first();
await composer.click();
await page.evaluate((text) => {
  const el = document.querySelector('[contenteditable=true]');
  el.focus();
  document.execCommand('insertText', false, text);
}, PROMPT);
await page.waitForTimeout(800);
await page.keyboard.press('Enter');
console.log('sent, waiting for response…');

const deadline = Date.now() + 600000;
await page.waitForTimeout(15000);
let lastCount = -1, stableTicks = 0;
while (Date.now() < deadline) {
  const count = await page.evaluate(() => [...document.querySelectorAll('GENERATED-IMAGE img, SINGLE-IMAGE img, img')]
    .filter(i => i.src && i.naturalWidth > 200 && (i.src.startsWith('blob:') || i.src.includes('googleusercontent') || i.src.includes('ggpht'))).length);
  if (count > 0 && count === lastCount) { if (++stableTicks >= 4) break; }
  else { stableTicks = 0; lastCount = count; }
  await page.waitForTimeout(4000);
}
console.log('images found:', lastCount);
await page.screenshot({ path: `${OUT}/response.png` });

const saved = await page.evaluate(() => {
  const els = [...document.querySelectorAll('GENERATED-IMAGE img, SINGLE-IMAGE img')]
    .filter(e => e.naturalWidth > 200);
  const el = els[els.length - 1] || [...document.querySelectorAll('img')]
    .filter(i => i.src && i.naturalWidth > 400 && i.src.startsWith('blob:')).pop();
  if (!el) return null;
  const c = document.createElement('canvas'); c.width = el.naturalWidth; c.height = el.naturalHeight;
  c.getContext('2d').drawImage(el, 0, 0);
  return { w: c.width, h: c.height, data: c.toDataURL('image/png').split(',')[1] };
});
if (!saved) { console.log('NO_IMAGE'); process.exit(2); }
const { writeFileSync } = await import('node:fs');
writeFileSync(`${OUT}/eventi-hud.png`, Buffer.from(saved.data, 'base64'));
console.log('saved', `${OUT}/eventi-hud.png`, saved.w + 'x' + saved.h);
console.log('chat url:', page.url());
process.exit(0);
