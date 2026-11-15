/* R-339/PLAN-119 T3-S2 witness probe — /hud-compose?comp=cassetto lab:
 * the reserved cost cell must be POPULATED (caption + food icon + qty) and
 * must track the filled party size (party × days × rate). */
import { chromium } from 'playwright';
const b = await chromium.launch({ args: ['--enable-unsafe-swiftshader'] });
const page = await b.newPage({ viewport: { width: 1440, height: 900 } });
const readCell = () => page.evaluate(() => {
  const cell = document.querySelector('[data-testid="cassetto-cost-slot"]');
  const value = document.querySelector('[data-testid="cassetto-cost-value"]');
  return {
    placeholder: cell?.getAttribute('data-placeholder'),
    ariaHidden: cell?.getAttribute('aria-hidden'),
    label: cell?.querySelector('span')?.textContent ?? null,
    value: value?.textContent ?? null,
    tone: value?.getAttribute('data-tone') ?? null,
    img: cell?.querySelector('img')?.getAttribute('src') ?? null,
    pointerEvents: cell ? getComputedStyle(cell).pointerEvents : null,
    assigned: document.querySelector('[data-assigned]')?.getAttribute('data-assigned'),
    canSend: document.querySelector('[data-can-send]')?.getAttribute('data-can-send'),
  };
});
try {
  await page.goto('http://localhost:5173/hud-compose?comp=cassetto', { waitUntil: 'domcontentloaded', timeout: 20000 });
  await page.waitForSelector('[data-testid="cassetto-cost-slot"]', { timeout: 20000 });
  await page.waitForTimeout(800);
  console.log('EMPTY-PARTY:', JSON.stringify(await readCell()));
  /* Fill the real party slots through the lab debug bridge (fires the
   * session's handleResidentSelect for every kit resident). */
  await page.click('[data-cassetto-debug="select-first"]').catch(() => {});
  await page.waitForTimeout(800);
  console.log('FULL-PARTY:', JSON.stringify(await readCell()));
  await page.screenshot({ path: 'test-results/r339-t3s2-cost-slot.png' }).catch(() => {});
} finally {
  await b.close();
}
