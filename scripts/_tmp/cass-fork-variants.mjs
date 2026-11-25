/* Fork visiva 2026-11-25 — varianti pozzi + testo sul cassetto REALE (/game), solo preview.
 * Nessuna modifica al codice: override in-page via JS, screenshot, revert implicito (pagina buttata). */
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';

const OUT = '.mw/runs/20261125-cassetto-fork';
mkdirSync(OUT, { recursive: true });

const WELLS = ['[data-block="party-slots"]', '[data-block="bag-slots"]', '[data-block="journey-strip"]', '[data-testid="cassetto-risk-well"]', '[data-testid="cassetto-reward-well"]'];

const VARIANTS = {
  'A-flat-attuale': null, // baseline
  'B-marmo-velato': `
    linear-gradient(rgba(3,8,7,.80), rgba(3,8,7,.80)),
    url(/assets/ui/hud-real/slicekit/cassetto/ground.webp) center / cover no-repeat,
    #04222b`,
  'C-velluto-vignetta': [
    'radial-gradient(ellipse 120% 90% at 50% 0%, rgba(30,130,90,.30) 0%, transparent 55%)',
    'radial-gradient(ellipse 140% 120% at 50% 115%, rgba(0,0,0,.62) 0%, transparent 60%)',
    'linear-gradient(180deg, #04222b 0%, #01141c 50%, #03302a 100%)',
  ].join(', '),
};

const boot = async (browser) => {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  page.setDefaultTimeout(120000);
  await page.goto('http://localhost:5173/hud-compose?comp=cassetto&poi=poi-goblin&risk=3&pcts=28,74', { waitUntil: 'domcontentloaded', timeout: 120000 });
  const exp = await page.waitForSelector('[data-testid="expedition-drawer-expand"]', { timeout: 20000 }).catch(() => null);
  if (exp) await exp.click();
  await page.waitForSelector('[data-cassetto-column]', { state: 'attached' });
  await page.waitForTimeout(2000);
  return page;
};

const browser = await chromium.launch({ headless: true, args: ['--enable-unsafe-swiftshader'] });

/* ---------- POZZI: una pagina per variante, stessa crop (party+bag+journey+risk) ---------- */
for (const [name, bg] of Object.entries(VARIANTS)) {
  const page = await boot(browser);
  if (bg) {
    await page.evaluate(([selectors, background]) => {
      for (const sel of selectors) {
        const el = document.querySelector(sel);
        if (el) el.style.background = background;
      }
    }, [WELLS, bg]);
    await page.waitForTimeout(900); // texture decode
  }
  const crop = await page.evaluate(() => {
    const col = document.querySelector('[data-cassetto-column]').getBoundingClientRect();
    const party = document.querySelector('[data-block="party-slots"]').getBoundingClientRect();
    const risk = document.querySelector('[data-block="risk-rewards"]').getBoundingClientRect();
    return { x: col.x, y: party.y - 8, w: col.width, h: (risk.y + risk.height) - party.y + 16 };
  });
  await page.screenshot({ timeout: 120000, path: `${OUT}/pozzi-${name}.png`, clip: { x: Math.max(0, crop.x), y: crop.y, width: crop.w, height: crop.h } });
  console.log('pozzi', name, 'ok');
  await page.close();
}

/* ---------- TESTO: varianti T1/T2/T3, crop party+journey ---------- */
const TEXT_VARIANTS = {
  'T1-attuale-11px': null,
  'T2-floor12-copy-corta': 'floor12',
  'T3-11px-peso-oro': 'weight',
};
for (const [name, mode] of Object.entries(TEXT_VARIANTS)) {
  const page = await boot(browser);
  if (mode) {
    await page.evaluate((m) => {
      const col = document.querySelector('[data-cassetto-column]');
      const walker = document.createTreeWalker(col, NodeFilter.SHOW_ELEMENT);
      let n;
      while ((n = walker.nextNode())) {
        if (n.children.length === 0 && (n.textContent || '').trim()) {
          const px = parseFloat(getComputedStyle(n).fontSize);
          if (px <= 11.7) {
            if (m === 'floor12') n.style.fontSize = '12px';
            if (m === 'weight') { n.style.fontWeight = '600'; n.style.color = '#f3e193'; n.style.opacity = '1'; }
          }
        }
      }
      if (m === 'floor12') {
        // copy corta: solo la label del ruolo leader
        for (const el of col.querySelectorAll('*')) {
          if (el.children.length === 0 && el.textContent.trim() === 'Expedition leader') el.textContent = 'Leader';
        }
      }
    }, mode);
    await page.waitForTimeout(500);
  }
  const crop = await page.evaluate(() => {
    const col = document.querySelector('[data-cassetto-column]').getBoundingClientRect();
    const party = document.querySelector('[data-block="party-slots"]').getBoundingClientRect();
    const journey = document.querySelector('[data-block="journey-strip"]').getBoundingClientRect();
    return { x: col.x, y: party.y - 4, w: col.width, h: (journey.y + journey.height) - party.y + 8 };
  });
  await page.screenshot({ timeout: 120000, path: `${OUT}/testo-${name}.png`, clip: { x: Math.max(0, crop.x), y: crop.y, width: crop.w, height: crop.h } });
  console.log('testo', name, 'ok');
  await page.close();
}

await browser.close();
console.log('DONE', OUT);
