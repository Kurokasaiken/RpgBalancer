/* Focused witness: FULL party / ready state + pan-under-drawer check. */
import { chromium } from 'playwright';
import { writeFileSync } from 'node:fs';
const OUT = '.mw/runs/20261125-cassetto-triage-witness';
const POI = 'poi-goblin';
const SLOTS = [`${POI}:goblin-slot-leader`, `${POI}:goblin-slot-member-1`, `${POI}:goblin-slot-member-2`, `${POI}:goblin-slot-bodyguard`];
const FOLK = ['hero-sir-spaccaculi', 'villager-mastro-beppe', 'villager-lisetta', 'villager-baldassarre'];

const browser = await chromium.launch({ headless: true, args: ['--enable-unsafe-swiftshader'] });
const out = {};
for (const [w, h] of [[1440, 900], [1280, 800]]) {
  const tag = `${w}x${h}`;
  const page = await browser.newPage({ viewport: { width: w, height: h } });
  page.setDefaultTimeout(90000);
  const errors = [];
  page.on('pageerror', (e) => errors.push('PAGEERROR ' + String(e).slice(0, 160)));
  try {
    await page.goto('http://localhost:5173/game', { waitUntil: 'domcontentloaded', timeout: 180000 });
    await page.waitForFunction((poi) => Boolean(window.__idleVillageTestHooks?.expedition?.[poi]), POI, { timeout: 90000 });
    await page.waitForSelector('[data-testid="game-boot-screen"]', { state: 'hidden', timeout: 180000 }).catch(() => {});
    const exp = (action, ...args) => page.evaluate(([act, fnArgs, poi]) => {
      const e = window.__idleVillageTestHooks?.expedition?.[poi];
      return e[act](...fnArgs);
    }, [action, args, POI]);
    await exp('openDetail');
    await page.waitForSelector('[data-cassetto-column]', { state: 'attached' });
    await page.waitForTimeout(1500);
    for (let i = 0; i < SLOTS.length; i++) await exp('assignToSlot', SLOTS[i], FOLK[i]);
    for (const sl of SLOTS) await page.waitForSelector(`[data-testid="slot-token-${sl}"]`, { timeout: 30000 }).catch(() => out[tag + '-missing-token'] = sl);
    await page.waitForTimeout(1000);
    const m = await page.evaluate(() => {
      const cta = document.querySelector('[data-testid="cassetto-confirm"]');
      const jewels = [...document.querySelectorAll('.cta-jewel')];
      const col = document.querySelector('[data-cassetto-column]');
      const b = col?.getBoundingClientRect();
      const cb = cta?.getBoundingClientRect();
      return {
        ctaDisabled: cta?.disabled ?? null,
        jewels: jewels.length,
        jewelAnim: jewels.length ? getComputedStyle(jewels[0]).animationName : null,
        col: b ? { x: b.x, y: b.y, w: b.width, h: b.height } : null,
        ctaRect: cb ? { x: cb.x, y: cb.y, w: cb.width, h: cb.height } : null,
      };
    });
    m.estimate = await exp('getEstimate').catch(() => null);
    m.assignments = await exp('getAssignments').catch(() => null);
    m.pageErrors = errors;
    out[tag] = m;
    const clip = (x, y, w2, h2) => ({ x: Math.max(0, x), y: Math.max(0, y), width: w2, height: h2 });
    if (m.col) await page.screenshot({ timeout: 120000, path: `${OUT}/${tag}-full-col.png`, clip: clip(m.col.x - 6, m.col.y, m.col.w + 6, m.col.h) }).catch((e) => console.log('shot col fail', e.message.split('\n')[0]));
    if (m.ctaRect && m.col) {
      for (const [t, ms] of [['t0', 0], ['t500', 500], ['t1000', 500]]) {
        if (ms) await page.waitForTimeout(ms);
        await page.screenshot({ timeout: 120000, path: `${OUT}/${tag}-cta-lit-${t}.png`, clip: clip(m.col.x, m.ctaRect.y - 24, m.col.w, m.ctaRect.h + 40) }).catch(() => {});
      }
    }
    // pan check: drag the map on the LEFT half while drawer open — does the world move?
    if (tag === '1440x900') {
      const before = await page.evaluate(() => document.querySelector('canvas') ? true : false);
      await page.mouse.move(400, 500);
      await page.mouse.down();
      await page.mouse.move(250, 500, { steps: 8 });
      await page.mouse.up();
      await page.waitForTimeout(600);
      out.panCheck = { canvasPresent: before, dragged: true, note: 'input accepted on uncovered area — no input lock found in code; visual diff not asserted' };
    }
  } catch (e) {
    out[tag] = { fatal: String(e).slice(0, 300), pageErrors: errors };
  }
  await page.close();
}
writeFileSync(`${OUT}/full-state.json`, JSON.stringify(out, null, 1));
console.log(JSON.stringify(out, null, 1));
await browser.close();
