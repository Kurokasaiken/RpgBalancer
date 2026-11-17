/* R-353: Gemini web turn via CDP — fix extracted cassetto column defects. */
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';

const RUN = '/Users/faustoboni/progetti_personali/RPG/.mw/runs/20261116-cassetto-gemini-fix';
const OUT = `${RUN}/gen`;
mkdirSync(OUT, { recursive: true });
const PROMPT = `This is a fantasy game UI panel in "gilded observatory" style: dark teal lacquer field, sculpted gold frame, emerald jewels. It is a drawer column that docks flush to the RIGHT edge of the screen, so the right edge must stay FLAT with NO frame. The image was composited from pieces and has visible defects. Fix ONLY the defects, keep EVERYTHING else pixel-identical — same layout, proportions, positions, colors, painted plaques, ornaments:

1. TOP-LEFT CORNER: the corner ornament (stacked emerald diamonds + gold leaf bracket) has seams/discontinuities where it joins the horizontal gold band and the vertical gold bar below — blend it into one seamless ornate corner.
2. LEFT VERTICAL GOLD BAR: it shows a repetitive tile/scanline banding artifact — rebuild it as a smooth continuous sculpted gold bar consistent with the frame style.
3. Any other small seams, tonal rectangles, ghost edges or doubled lips in the top band area — clean them.

Do NOT change: the flat right edge, the top gold band, the navy resource well, the painted title plaque, the skull icon, the treasure chest icon, the CONFIRM plaque, the bottom ornament. Keep the same image dimensions and the empty/transparent surroundings. Output ONE edited image only.`;
const IMG = '/tmp/cassetto-for-gemini.png';

const b = await chromium.connectOverCDP('ws://127.0.0.1:9222/devtools/page/57627EDDA3BB6237B5144D1037546DFD');
const page = b.contexts()[0].pages().find(p => /gemini\.google\.com/.test(p.url())) || b.contexts()[0].pages()[0];
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

const deadline = Date.now() + 300000;
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
writeFileSync(`${OUT}/fix-1440.png`, Buffer.from(saved.data, 'base64'));
console.log('saved', `${OUT}/fix-1440.png`, saved.w + 'x' + saved.h);
console.log('chat url:', page.url());
process.exit(0);
