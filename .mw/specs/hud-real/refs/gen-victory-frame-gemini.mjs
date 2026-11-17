/* R-348: Gemini web turn via CDP — attach B, ask clean empty tall frame. */
import { chromium } from 'playwright';
import { mkdirSync, readFileSync } from 'node:fs';

const RUN = '/Users/faustoboni/progetti_personali/RPG/.mw/runs/20261116-victory-clean-frame';
const OUT = `${RUN}/gen`;
mkdirSync(OUT, { recursive: true });
const PROMPT = `Edit this fantasy game UI illustration: produce a CLEAN EMPTY version of the same sealed parchment scroll. Keep the rolled top and bottom edges, brass caps, ornate top plaque, teal ribbon, wax seal on the right edge, illustrated landscape strip and ALL ornaments exactly as they are, same painterly style. REMOVE completely: all text and letters, the portrait inside the medallion (keep only the empty ring), reward icons and rows. The parchment writing area must be completely EMPTY clean aged paper — no lettering, no placeholder lines. Make the image about 30% TALLER by extending the parchment vertically so the empty writing area is larger. Output ONE image only.`;
const IMG = '/Users/faustoboni/progetti_personali/RPG/public/mockups/victory-reward/ai/B-pergamena-suggellata.png';

const b = await chromium.connectOverCDP('http://localhost:9222');
let page = null;
for (const ctx of b.contexts()) for (const p of ctx.pages())
  if (/gemini\.google\.com/.test(p.url())) page = p;
if (!page) { console.log('NO_TAB'); process.exit(1); }
console.log('tab:', page.url().slice(0, 70));

/* dismiss privacy banner if present */
try { await page.getByRole('button', { name: /^Chiudi$/ }).first().click({ timeout: 3000 }); } catch {}
await page.waitForTimeout(1000);

/* attach image: try direct setInputFiles on file inputs; else open + menu */
const inputs = await page.locator('input[type=file]').all();
let attached = false;
for (const inp of inputs) {
  try { await inp.setInputFiles(IMG, { timeout: 3000 }); attached = true; break; } catch {}
}
if (!attached) {
  console.log('direct attach failed, trying + menu');
  try {
    await page.locator('button[aria-label*="Caricamento" i], button[aria-label*="upload" i]').first().click({ timeout: 4000 });
    await page.waitForTimeout(800);
    await page.locator('input[type=file]').first().setInputFiles(IMG);
    attached = true;
  } catch (e) { console.log('attach via menu failed:', String(e).slice(0, 120)); }
}
console.log('attached:', attached);
await page.waitForTimeout(4000);
await page.screenshot({ path: `${OUT}/attach-state.png` });

/* insert prompt */
const composer = page.locator('[contenteditable=true]').first();
await composer.click();
await page.evaluate((text) => {
  const el = document.querySelector('[contenteditable=true]');
  el.focus();
  document.execCommand('insertText', false, text);
}, PROMPT);
await page.waitForTimeout(800);

/* send: Enter usually submits in Gemini */
await page.keyboard.press('Enter');
console.log('sent, waiting for response…');

/* poll for generated image: Gemini renders generated imgs in response cards */
const deadline = Date.now() + 300000;
let lastCount = -1, stableTicks = 0;
while (Date.now() < deadline) {
  const count = await page.evaluate(() => [...document.querySelectorAll('img')]
    .filter(i => i.src && (i.src.startsWith('blob:') || i.src.includes('googleusercontent') || i.src.includes('ggpht')))
    .filter(i => i.naturalWidth >= 400).length);
  const busy = await page.locator('[aria-label*="Stop" i], [aria-label*="Interrompi" i]').count();
  if (count !== lastCount) { lastCount = count; stableTicks = 0; } else stableTicks++;
  if (count >= 1 && !busy && stableTicks >= 4) break;
  await page.waitForTimeout(3000);
}
console.log('stable, count:', lastCount);
await page.screenshot({ path: `${OUT}/response-state.png` });

/* harvest big generated images */
const locs = await page.locator('img').all();
let n = 0;
for (const loc of locs) {
  try {
    const src = (await loc.getAttribute('src', { timeout: 500 })) || '';
    if (!(/blob:|googleusercontent|ggpht/.test(src))) continue;
    const w = await loc.evaluate(i => i.naturalWidth);
    if (w < 400) continue;
    n += 1;
    await loc.screenshot({ path: `${OUT}/gemini-${n}.png` });
    if (n >= 6) break;
  } catch { /* skip */ }
}
console.log('saved:', n, 'files in', OUT);
await b.close();
