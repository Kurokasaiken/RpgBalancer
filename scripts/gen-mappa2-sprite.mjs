#!/usr/bin/env node
/**
 * gen-mappa2-sprite — submit an asset prompt to the Gemini web UI (CDP :9222)
 * and capture the generated image.
 *
 * Durable runner (learn 2026-10-25: batch scripts live in the repo, not /tmp).
 * Flow: new chat per call → attach ref image(s) → type prompt → submit →
 * wait for generated-img count increment → download at the NEW index.
 * Never touches existing tabs: it opens its own page and closes nothing else.
 *
 * Usage:
 *   node scripts/gen-mappa2-sprite.mjs \
 *     --ref path/to/ref.png [--ref path/to/ref2.png] \
 *     --prompt path/to/prompt.txt \
 *     --out out/dir/prefix \
 *     [--chat https://gemini.google.com/app/<id>]  # reuse a chat (anchored edit)
 *     [--timeout 240]
 *
 * Exit 0 on >=1 captured image, non-zero otherwise.
 */
import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const args = process.argv.slice(2);
function opt(name, def) {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : def;
}
const refs = args.reduce((acc, a, i) => (a === '--ref' ? [...acc, args[i + 1]] : acc), []);
const promptFile = opt('prompt');
const outPrefix = opt('out');
const chatUrl = opt('chat', null);
const TIMEOUT_S = parseInt(opt('timeout', '240'), 10);

if (!promptFile || !outPrefix) {
  console.error('need --prompt and --out');
  process.exit(2);
}
// Gemini's composer submits on Enter — typing raw newlines would split the
// prompt into multiple partial messages (observed 2026-10-29: paragraph 1
// alone produced an off-spec ranger). Flatten to a single line.
const prompt = fs.readFileSync(promptFile, 'utf8').trim().replace(/\s*\n+\s*/g, ' ');
fs.mkdirSync(path.dirname(outPrefix), { recursive: true });

// generated images live inside these custom elements (locale-agnostic)
const GEN_IMG_SEL = 'GENERATED-IMAGE img, SINGLE-IMAGE img';

async function countGenerated(page) {
  return await page.evaluate((sel) =>
    [...document.querySelectorAll(sel)].filter((el) => el.naturalWidth > 32).length,
  GEN_IMG_SEL);
}

async function previewVisible(page, timeoutMs = 4500) {
  const sels = [
    'img[src^="blob:"]', 'img[src^="data:image"]',
    '[data-testid*="attachment" i]', '[data-testid*="image" i]',
    '[data-attachment-id]', 'button[aria-label*="Remove" i]',
    'button[aria-label*="rimuovi" i]', 'button[aria-label*="elimina" i]',
    'div[class*="attachment" i] img', 'div[class*="preview" i] img',
    'div[class*="thumbnail" i]', '[class*="file-chip" i]',
  ];
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    for (const sel of sels) {
      try {
        const el = page.locator(sel).first();
        if ((await el.count()) > 0 && (await el.isVisible({ timeout: 300 }))) return true;
      } catch {}
    }
    await page.waitForTimeout(300);
  }
  return false;
}

async function uploadFailed(page) {
  // chip di anteprima con errore (icona rossa / "riprova") — l'upload è fallito
  // anche se la thumbnail esiste
  return page.evaluate(() => {
    // scope: solo dentro il composer (il disclaimer a piè pagina "può fare errori"
    // è un falso positivo se si cerca in tutto il documento)
    const box = document.querySelector('div[contenteditable="true"], .ql-editor, textarea');
    const root = box ? (box.closest('form') || box.closest('[class*="input"], [class*="composer"]') || box.parentElement.parentElement.parentElement) : document.body;
    const err = [...root.querySelectorAll('[aria-label], mat-icon, button, [class*="error" i], [class*="warn" i]')];
    return err.some((e) => {
      const t = ((e.getAttribute && e.getAttribute('aria-label')) || e.textContent || '').toLowerCase();
      return /riprova|retry|failed|non riuscit|errore di caricamento|upload error/.test(t) && e.offsetParent !== null;
    });
  }).catch(() => false);
}

async function tryAttach(page, imgPath) {
  // strategy -1 (fast): gli input[type=file] sono già nel DOM — set diretto, niente menu
  try {
    const inputs = page.locator('input[type="file"]');
    for (let q = 0; q < Math.min(await inputs.count(), 5); q++) {
      try {
        await inputs.nth(q).setInputFiles(imgPath, { timeout: 2500 });
        if (await previewVisible(page, 8000)) {
          await page.waitForTimeout(6000); // lascia finire l'upload
          if (await uploadFailed(page)) { console.log('  attach direct-input:', q, '→ upload error, retry'); continue; }
          console.log('  attach direct-input:', q); return true;
        }
      } catch {}
    }
  } catch {}
  // strategy 0 (verified 2026-10-29): "Caricamento e strumenti" menu → "Carica file"
  for (const openSel of [
    'button[aria-label*="Caricamento" i]:visible', 'button[aria-label*="insert" i]:visible',
    'button[aria-label*="inserisci" i]:visible', 'button[aria-label*="aggiungi" i]:visible',
    'button[aria-label*="add" i]:visible', 'button[aria-label*="upload" i]:visible',
    'button[aria-label*="più opzioni"]:visible', 'button[aria-label*="more" i]:visible',
    'button[aria-label*="+"]:visible',
  ]) {
    try {
      const ob = page.locator(openSel).first();
      if ((await ob.count()) === 0 || !(await ob.isVisible({ timeout: 800 }))) continue;
      console.log('  trying open:', openSel);
      await ob.click({ timeout: 3000 });
      // attende che il menu sia davvero aperto (fisso 900ms era flaky)
      await page.waitForSelector('[role="menu"], mat-action-list', { state: 'visible', timeout: 4000 }).catch(() => {});
      await page.waitForTimeout(400);
      let ok = false;
      for (const itemSel of [
        '[role="menuitem"]:has-text("Carica file")', 'button[role="menuitem"]:has-text("Carica")',
        '[role="menuitem"]:has-text("file")', '[role="option"]:has-text("File")',
        'mat-menu button:has-text("File")', '[role="menu"] button:has-text("File")',
        'button:has-text("File")', 'button:has-text("Carica file")',
        'button:has-text("Upload")', 'button:has-text("Carica")',
        '[role="menuitem"]:has-text("image")', '[role="menuitem"]:has-text("foto")',
        'li:has-text("Upload")', 'li:has-text("Carica")',
      ]) {
        try {
          const it = page.locator(itemSel).first();
          if ((await it.count()) === 0 || !(await it.isVisible({ timeout: 1000 }))) continue;
          console.log('    menu item:', itemSel);
          let done = false;
          try {
            const [fc] = await Promise.all([
              page.waitForEvent('filechooser', { timeout: 4000 }),
              it.click(),
            ]);
            await fc.setFiles(imgPath);
            done = true;
          } catch {
            // File chooser non scattato: prova ad impostare direttamente gli input[type=file] nascosti
            const inputs = page.locator('input[type="file"]');
            const n = await inputs.count();
            for (let q = 0; q < n && !done; q++) {
              try { await inputs.nth(q).setInputFiles(imgPath); done = true; } catch {}
            }
            if (!done) { try { await page.setInputFiles('input[type="file"]', imgPath); done = true; } catch {} }
          }
          if (done && await previewVisible(page, 8000)) {
            await page.waitForTimeout(6000);
            if (await uploadFailed(page)) { console.log('    upload error after attach — retry next'); done = false; }
            else { ok = true; break; }
          }
        } catch {}
      }
      if (ok) return true;
      await page.keyboard.press('Escape');
    } catch {}
  }
  return false;
}

const browser = await chromium.connectOverCDP('http://127.0.0.1:9222');
const ctx = browser.contexts()[0];
let page;
if (chatUrl) {
  page = ctx.pages().find((p) => p.url().startsWith(chatUrl)) || (await ctx.newPage());
  if (!page.url().startsWith(chatUrl)) await page.goto(chatUrl, { waitUntil: 'domcontentloaded' });
} else {
  page = await ctx.newPage();
  await page.goto('https://gemini.google.com/app', { waitUntil: 'domcontentloaded' });
}
await page.waitForSelector('div[contenteditable="true"], .ql-editor, textarea', { state: 'attached', timeout: 60000 });
await page.waitForTimeout(2500); // settle composer visibile

// ripulisce chip di allegati stale (upload falliti dei run precedenti)
try {
  for (const b of await page.locator('button[aria-label*="chiudi allegato" i]:visible').all()) {
    await b.click({ timeout: 1500 }).catch(() => {});
    await page.waitForTimeout(300);
  }
} catch {}

for (const ref of refs) {
  let ok = false;
  for (let att = 0; att < 3 && !ok; att++) {
    if (att) { console.log(`  attach retry ${att}`); await page.keyboard.press('Escape'); await page.waitForTimeout(800); }
    ok = await tryAttach(page, path.resolve(ref));
  }
  console.log(`attach ${ref}: ${ok ? 'ok' : 'FAILED'}`);
  if (!ok) {
    const dump = await page.evaluate(() =>
      [...document.querySelectorAll('button')]
        .filter((e) => e.offsetParent !== null)
        .map((e) => e.getAttribute('aria-label') || e.textContent.trim().slice(0, 40))
        .slice(-40));
    console.log('visible buttons tail:', JSON.stringify(dump));
    await page.screenshot({ path: `${outPrefix}-ATTACHFAIL.png` });
    console.error('ATTACH_FAIL');
    await browser.close();
    process.exit(3);
  }
  await page.waitForTimeout(5000); // let the upload settle
}

const before = await countGenerated(page);
console.log('generated imgs before:', before);

const box = page.locator('div[contenteditable="true"], .ql-editor, textarea').first();
await box.click();
await page.keyboard.press('Meta+a');
// insert atomico + verifica: keyboard.type perdeva l'inizio del prompt quando il
// composer re-renderizza durante il settle degli upload
let typedOk = false;
for (let attempt = 0; attempt < 3 && !typedOk; attempt++) {
  await page.evaluate((txt) => {
    const el = document.querySelector('div[contenteditable="true"], .ql-editor, textarea');
    el.focus();
    document.execCommand('selectAll', false);
    document.execCommand('insertText', false, txt);
  }, prompt);
  await page.waitForTimeout(500);
  const got = await page.evaluate(() =>
    (document.querySelector('div[contenteditable="true"], .ql-editor, textarea')?.textContent || '').trim());
  typedOk = got.endsWith(prompt.slice(-40));
  if (!typedOk) console.log(`  prompt verify failed (got ${got.length}/${prompt.length} chars), retry`);
}
if (!typedOk) {
  await page.screenshot({ path: `${outPrefix}-PROMPTFAIL.png` });
  console.error('PROMPT_INCOMPLETE'); await browser.close(); process.exit(5);
}
await page.waitForTimeout(800);
await page.keyboard.press('Enter');
console.log('prompt submitted, waiting for generation…');

const deadline = Date.now() + TIMEOUT_S * 1000;
let after = before;
while (Date.now() < deadline) {
  after = await countGenerated(page);
  if (after > before) break;
  await page.waitForTimeout(3000);
}
console.log('generated imgs after:', after);
if (after <= before) {
  await page.screenshot({ path: `${outPrefix}-NORESULT.png`, fullPage: false });
  console.error(`NO_IMAGE_INCREMENT (debug shot: ${outPrefix}-NORESULT.png)`);
  await browser.close();
  process.exit(4);
}

// capture the newly generated image(s): prefer the download button (full-res
// original file), fall back to canvas-read of the img element.
const genCount = await page.evaluate((sel) => document.querySelectorAll(sel).length, GEN_IMG_SEL);
let saved = 0;
for (let i = Math.max(0, genCount - (after - before)); i < genCount && saved < 4; i++) {
  const out = `${outPrefix}-${saved}.png`;
  // strategy 1: the element's download button gives the original file
  try {
    const gen = page.locator(GEN_IMG_SEL).nth(i);
    const wrap = gen.locator('xpath=ancestor::GENERATED-IMAGE | ancestor::SINGLE-IMAGE').first();
    const dlBtn = wrap.locator('DOWNLOAD-GENERATED-IMAGE-BUTTON button, DOWNLOAD-GENERATED-IMAGE-BUTTON, [aria-label*="Scarica" i], [aria-label*="Download" i]').first();
    const [dl] = await Promise.all([
      page.waitForEvent('download', { timeout: 20000 }),
      dlBtn.click(),
    ]);
    await dl.saveAs(out);
    saved++;
    console.log('saved (download)', out);
    continue;
  } catch (e) {
    console.log('download path failed:', String(e).slice(0, 100));
  }
  // strategy 2: canvas read of the rendered img (blob: fetch is unreliable)
  try {
    const b64 = await page.evaluate(
      ([sel, idx]) => {
        const el = document.querySelectorAll(sel)[idx];
        const c = document.createElement('canvas');
        c.width = el.naturalWidth;
        c.height = el.naturalHeight;
        c.getContext('2d').drawImage(el, 0, 0);
        return c.toDataURL('image/png').split(',')[1];
      },
      [GEN_IMG_SEL, i],
    );
    fs.writeFileSync(out, Buffer.from(b64, 'base64'));
    saved++;
    console.log('saved (canvas)', out);
  } catch (e) {
    console.log('canvas capture failed:', String(e).slice(0, 120));
  }
}
await page.screenshot({ path: `${outPrefix}-page.png` });
console.log(`CHAT_URL ${page.url()}`);
console.log(saved > 0 ? 'DONE' : 'CAPTURE_EMPTY');
await browser.close();
process.exit(saved > 0 ? 0 : 5);
