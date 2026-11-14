import { chromium } from 'playwright';
import { readFileSync, writeFileSync, mkdirSync } from 'fs';
const IMGS = [
  '/Users/faustoboni/progetti_personali/RPG/.mw/specs/hud-real/nav/design-nav.png',
  '/Users/faustoboni/progetti_personali/RPG/.mw/specs/hud-real/village-icon/ref-village.png',
];
const OUT = '.mw/specs/hud-real/village-icon/gen';
mkdirSync(OUT, { recursive: true });
const prompt = readFileSync('.mw/specs/hud-real/village-icon/prompt.txt', 'utf8');
const b = await chromium.connectOverCDP('http://localhost:9222');
const p = await b.contexts()[0].newPage();
await p.goto('https://gemini.google.com/app', { waitUntil: 'domcontentloaded' });
await p.waitForTimeout(5000);
const composer = p.locator('div[contenteditable="true"]').first();
await composer.click();
await p.keyboard.insertText(prompt);
await p.waitForTimeout(600);
let attached = false;
try {
  const chooserP = p.waitForEvent('filechooser', { timeout: 6000 });
  await p.locator('button[aria-label*="Caricamento" i], button[aria-label*="pload" i]').first().click({ timeout: 3000 });
  const chooser = await chooserP;
  await chooser.setFiles(IMGS);
  attached = true;
  console.log('attached via upload-tools');
} catch (e) {
  // menu opened? click "Carica file"/"Upload files" item then chooser
  try {
    const chooserP = p.waitForEvent('filechooser', { timeout: 6000 });
    await p.locator('button:has-text("Carica file"), [role="menuitem"]:has-text("Carica"), button:has-text("Upload")').first().click({ timeout: 3000 });
    const chooser = await chooserP;
    await chooser.setFiles(IMGS);
    attached = true;
    console.log('attached via menu item');
  } catch (e2) { console.log('ATTACH FAIL'); }
}
if (!attached) { await p.screenshot({ path: `${OUT}/attach-fail.png` }); process.exit(1); }
await p.waitForTimeout(3000);
await p.locator('button[aria-label*="Invia" i], button[aria-label*="Send" i]').first().click();
console.log('sent');
await p.waitForSelector('generated-image img, .image-container img, img[src*="googleusercontent"]', { timeout: 180000 });
await p.waitForTimeout(5000);
const src = await p.$$eval('generated-image img, .image-container img', els => els[els.length-1].src);
const buf = Buffer.from(await (await p.request.get(src)).body());
writeFileSync(`${OUT}/village-icon-0.png`, buf);
await p.screenshot({ path: `${OUT}/chat.png` });
console.log('saved', buf.length, 'bytes');
await b.close();
