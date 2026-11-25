/* 2026-11-25 triage witness — cassetto on REAL /game.
 * States: empty(disabled) / partial / full(ready, jewels) / scrolled.
 * Measures: column coverage vs map, text px vs 11px floor, hit-test under column.
 * Headless only (CTR-foreground-001).
 */
import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';

const OUT = '.mw/runs/20261125-cassetto-final-witness';
mkdirSync(OUT, { recursive: true });

const POI = 'poi-goblin';
const SLOT_LEADER = `${POI}:goblin-slot-leader`;
const SLOT_MEMBER = `${POI}:goblin-slot-member-1`;
const SLOT_MEMBER_2 = `${POI}:goblin-slot-member-2`;
const SLOT_BODYGUARD = `${POI}:goblin-slot-bodyguard`;
const VALID_LEADER = 'hero-sir-spaccaculi';
const FOLK = ['villager-mastro-beppe', 'villager-lisetta', 'villager-baldassarre'];

const report = { viewports: {} };

const exp = async (page, action, ...args) => {
  // strict-mode remounts delete/re-add the hook object — wait for the exact action to be a function
  await page.waitForFunction(([act, poi]) => {
    const e = window.__idleVillageTestHooks?.expedition?.[poi];
    return Boolean(e && typeof e[act] === 'function');
  }, [action, POI], { timeout: 60000 });
  return page.evaluate(([act, fnArgs, poi]) => {
    const e = window.__idleVillageTestHooks?.expedition?.[poi];
    if (!e || typeof e[act] !== 'function') throw new Error(`hook ${act} missing`);
    return e[act](...fnArgs);
  }, [action, args, POI]);
};

const boot = async (browser, w, h) => {
  const page = await browser.newPage({ viewport: { width: w, height: h } });
  const errors = [];
  page.on('pageerror', (e) => errors.push('PAGEERROR ' + String(e).slice(0, 200)));
  page.on('console', (m) => m.type() === 'error' && errors.push('CONSOLE ' + m.text().slice(0, 160)));
  await page.goto('http://localhost:5173/game', { waitUntil: 'domcontentloaded', timeout: 120000 });
  await page.waitForFunction(
    (poi) => Boolean(window.__idleVillageTestHooks?.expedition?.[poi]), POI, { timeout: 60000 });
  await page.waitForSelector('[data-testid="game-boot-screen"]', { state: 'hidden', timeout: 120000 }).catch(() => {});
  return { page, errors };
};

const openDetail = async (page) => {
  await exp(page, 'openDetail');
  await page.waitForSelector('[data-cassetto-column]', { state: 'attached', timeout: 60000 });
  await page.waitForTimeout(1800);
};

const measure = async (page) =>
  page.evaluate(() => {
    const r = (el) => { const b = el.getBoundingClientRect(); return { x: +b.x.toFixed(1), y: +b.y.toFixed(1), w: +b.width.toFixed(1), h: +b.height.toFixed(1) }; };
    const col = document.querySelector('[data-cassetto-column]');
    const cta = document.querySelector('[data-testid="cassetto-confirm"]');
    const colR = col ? r(col) : null;
    // text sizes inside the column
    const texts = [];
    if (col) {
      const walker = document.createTreeWalker(col, NodeFilter.SHOW_ELEMENT);
      let n;
      while ((n = walker.nextNode())) {
        if (n.children.length === 0 && (n.textContent || '').trim().length > 0) {
          const cs = getComputedStyle(n);
          const b = n.getBoundingClientRect();
          if (b.width > 0 && b.height > 0) {
            texts.push({
              tag: n.tagName.toLowerCase(),
              px: +parseFloat(cs.fontSize).toFixed(1),
              sample: (n.textContent || '').trim().slice(0, 24),
            });
          }
        }
      }
    }
    const under11 = texts.filter((t) => t.px < 11);
    const jewels = [...document.querySelectorAll('.cta-jewel')];
    const jewelAnim = jewels.length ? getComputedStyle(jewels[0]).animationName : null;
    const jewelOpacity = jewels.length ? getComputedStyle(jewels[0]).opacity : null;
    // hit-test: what is at the visual center of the column — does the map receive events there?
    let hitAtColCenter = null;
    if (colR) {
      const el = document.elementFromPoint(colR.x + colR.w / 2, colR.y + colR.h / 2);
      hitAtColCenter = el ? `${el.tagName.toLowerCase()}${el.dataset && el.dataset.cassettoColumn !== undefined ? '[in-column]' : ''}` : null;
    }
    // is there any canvas/pixi near the right edge UNDER the column?
    const canvas = document.querySelector('canvas');
    const canvasR = canvas ? r(canvas) : null;
    return {
      viewport: { w: innerWidth, h: innerHeight },
      col: colR,
      coveragePct: colR ? +((colR.w / innerWidth) * 100).toFixed(1) : null,
      cta: cta ? { ...r(cta), disabled: cta.disabled } : null,
      ctaAriaReason: cta ? (cta.getAttribute('aria-describedby') ? 'present' : null) : null,
      textCount: texts.length,
      textMinPx: texts.length ? Math.min(...texts.map((t) => t.px)) : null,
      under11Count: under11.length,
      under11Samples: under11.slice(0, 8),
      textDistribution: texts.reduce((acc, t) => { acc[t.px] = (acc[t.px] || 0) + 1; return acc; }, {}),
      jewels: jewels.length, jewelAnim, jewelOpacity,
      hitAtColCenter, canvasR,
    };
  });

const clip = (x, y, w, h) => ({ x: Math.max(0, x), y: Math.max(0, y), width: w, height: h });

const browser = await chromium.launch({ headless: true, args: ['--enable-unsafe-swiftshader'] });

for (const [w, h] of [[1440, 900], [1280, 800]]) {
  const tag = `${w}x${h}`;
  const vp = {};
  report.viewports[tag] = vp;

  // ---- STATE 1: empty / disabled CTA
  {
    const { page, errors } = await boot(browser, w, h);
    await openDetail(page);
    vp.empty = await measure(page);
    vp.empty.pageErrors = errors;
    await page.screenshot({ path: `${OUT}/${tag}-empty-full.png` });
    const c = vp.empty.col;
    if (c) await page.screenshot({ path: `${OUT}/${tag}-empty-col.png`, clip: clip(c.x - 6, c.y, c.w + 6, c.h) });
    if (vp.empty.cta) await page.screenshot({ path: `${OUT}/${tag}-cta-disabled.png`, clip: clip(c.x, vp.empty.cta.y - 24, c.w, vp.empty.cta.h + 40) });
    await page.close();
  }

  // ---- STATE 2: partial party
  {
    const { page, errors } = await boot(browser, w, h);
    await openDetail(page);
    await exp(page, 'assignToSlot', SLOT_LEADER, VALID_LEADER);
    await page.waitForSelector(`[data-testid="slot-token-${SLOT_LEADER}"]`, { timeout: 15000 }).catch(() => {});
    await page.waitForTimeout(800);
    vp.partial = await measure(page);
    vp.partial.pageErrors = errors;
    const c = vp.partial.col;
    if (c) await page.screenshot({ path: `${OUT}/${tag}-partial-col.png`, clip: clip(c.x - 6, c.y, c.w + 6, c.h) });
    await page.close();
  }

  // ---- STATE 3: full party — ready / jewels pulsing
  {
    const { page, errors } = await boot(browser, w, h);
    await openDetail(page);
    await exp(page, 'assignToSlot', SLOT_LEADER, VALID_LEADER);
    await exp(page, 'assignToSlot', SLOT_MEMBER, FOLK[0]);
    await exp(page, 'assignToSlot', SLOT_MEMBER_2, FOLK[1]);
    await exp(page, 'assignToSlot', SLOT_BODYGUARD, FOLK[2]);
    for (const sl of [SLOT_LEADER, SLOT_MEMBER, SLOT_MEMBER_2, SLOT_BODYGUARD]) {
      await page.waitForSelector(`[data-testid="slot-token-${sl}"]`, { timeout: 15000 }).catch(() => console.log('token missing:', sl));
    }
    await page.waitForTimeout(800);
    vp.full = await measure(page);
    vp.full.estimate = await exp(page, 'getEstimate').catch(() => null);
    vp.full.assignments = await exp(page, 'getAssignments').catch(() => null);
    vp.full.pageErrors = errors;
    const c = vp.full.col;
    if (c) await page.screenshot({ path: `${OUT}/${tag}-full-col.png`, clip: clip(c.x - 6, c.y, c.w + 6, c.h) });
    if (vp.full.cta) {
      for (const [t, ms] of [['t0', 0], ['t500', 500], ['t1000', 500]]) {
        if (ms) await page.waitForTimeout(ms);
        await page.screenshot({ path: `${OUT}/${tag}-cta-lit-${t}.png`, clip: clip(c.x, vp.full.cta.y - 24, c.w, vp.full.cta.h + 40) });
      }
    }
    // ---- STATE 4: scrolled party scroller
    const scrollInfo = await page.evaluate(() => {
      const sc = document.querySelector('[data-cassetto-party-scroll]');
      if (!sc) return { present: false };
      const before = { scrollLeft: sc.scrollLeft, scrollWidth: sc.scrollWidth, clientWidth: sc.clientWidth, overflow: sc.scrollWidth - sc.clientWidth };
      sc.scrollLeft = sc.scrollWidth;
      return { present: true, before, after: sc.scrollLeft };
    });
    vp.scroller = scrollInfo;
    await page.waitForTimeout(700);
    const party = await page.evaluate(() => {
      const el = document.querySelector('[data-cassetto-party-scroll]');
      if (!el) return null;
      const b = el.getBoundingClientRect();
      return { x: b.x, y: b.y, w: b.width, h: b.height };
    });
    if (party) await page.screenshot({ path: `${OUT}/${tag}-scrolled.png`, clip: clip(party.x - 10, party.y - 10, party.w + 20, party.h + 20) });
    // rest state (scroll back to 0) for comparison
    await page.evaluate(() => { const sc = document.querySelector('[data-cassetto-party-scroll]'); if (sc) sc.scrollLeft = 0; });
    await page.waitForTimeout(700);
    if (party) await page.screenshot({ path: `${OUT}/${tag}-party-rest.png`, clip: clip(party.x - 10, party.y - 10, party.w + 20, party.h + 20) });
    await page.close();
  }
}

writeFileSync(`${OUT}/measures.json`, JSON.stringify(report, null, 1));
console.log(JSON.stringify(report, null, 1).slice(0, 6000));
console.log('\nWITNESS DIR:', OUT);
await browser.close();
