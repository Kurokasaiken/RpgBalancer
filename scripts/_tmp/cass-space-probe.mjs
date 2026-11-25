/* B-analysis: where does vertical space go in the column @1280x800 — block heights, gaps, which texts at floor. */
import { chromium } from 'playwright';
const b = await chromium.launch({ headless: true, args: ['--enable-unsafe-swiftshader'] });
const page = await b.newPage({ viewport: { width: 1280, height: 800 } });
page.setDefaultTimeout(90000);
await page.goto('http://localhost:5173/game', { waitUntil: 'domcontentloaded', timeout: 180000 });
await page.waitForFunction((poi) => Boolean(window.__idleVillageTestHooks?.expedition?.[poi]), 'poi-goblin', { timeout: 90000 });
await page.waitForSelector('[data-testid="game-boot-screen"]', { state: 'hidden', timeout: 180000 }).catch(() => {});
await page.evaluate((poi) => window.__idleVillageTestHooks?.expedition?.[poi]?.openDetail(), 'poi-goblin');
await page.waitForSelector('[data-cassetto-column]', { state: 'attached' });
await page.waitForTimeout(1800);
const m = await page.evaluate(() => {
  const r = (el) => { const b = el.getBoundingClientRect(); return { y: +b.y.toFixed(1), h: +b.height.toFixed(1), bottom: +(b.y + b.height).toFixed(1) }; };
  const col = document.querySelector('[data-cassetto-column]');
  const colR = r(col);
  const blocks = [...col.querySelectorAll('[data-block]')].map((el) => ({ block: el.dataset.block, ...r(el) }));
  // gaps between consecutive blocks
  const sorted = blocks.slice().sort((a, z) => a.y - z.y);
  const gaps = [];
  for (let i = 1; i < sorted.length; i++) gaps.push({ between: `${sorted[i-1].block}→${sorted[i].block}`, gap: +(sorted[i].y - sorted[i-1].bottom).toFixed(1) });
  // vignette + title heights: look for elements above first block
  const first = sorted[0];
  // texts at exactly 11px with role guess
  const texts = [];
  const walker = document.createTreeWalker(col, NodeFilter.SHOW_ELEMENT);
  let n;
  while ((n = walker.nextNode())) {
    if (n.children.length === 0 && (n.textContent || '').trim()) {
      const px = parseFloat(getComputedStyle(n).fontSize);
      if (px <= 11.6) {
        const b2 = n.getBoundingClientRect();
        if (b2.width > 0) texts.push({ px: +px.toFixed(1), text: n.textContent.trim().slice(0, 30), y: +b2.y.toFixed(0) });
      }
    }
  }
  const cta = document.querySelector('[data-testid="cassetto-confirm"]');
  return {
    colH: colR.h,
    blocks: sorted,
    gaps,
    ctaBottom: cta ? r(cta).bottom : null,
    slackUnderCta: cta ? +(colR.h - r(cta).bottom).toFixed(1) : null,
    headroomAboveFirstBlock: first ? +first.y.toFixed(1) : null,
    smallTexts: texts,
  };
});
console.log(JSON.stringify(m, null, 1));
await b.close();
