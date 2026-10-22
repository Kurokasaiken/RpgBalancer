/* TMP probe — DEF-06 drag under browser HUD zoom (headless, dev :5173). */
import { chromium } from 'playwright';

const POI = 'poi-goblin';
const SLOT = `${POI}:goblin-slot-leader`;
const RESIDENT = 'hero-giggiolillo';

const main = async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 2560, height: 1440 } });
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  await page.goto('http://localhost:5173/game', { waitUntil: 'networkidle', timeout: 60000 });
  await page.waitForSelector('[data-testid="game-boot-screen"]', { state: 'detached', timeout: 60000 }).catch(() => undefined);
  await page.waitForFunction(
    (poiId) => Boolean((window as any).__idleVillageTestHooks?.expedition?.[poiId]),
    POI,
    { timeout: 30000 },
  );
  await page.keyboard.press('r');
  await page.waitForSelector('[data-testid="resident-roster-panel"], [data-testid="drag-test-container"]', { timeout: 15000 });
  const mode = process.env.MODE ?? 'auto';
  if (mode !== 'auto') {
    const menuBtn = page.locator('[data-hud-controls] button[aria-haspopup="menu"]').first();
    if (await menuBtn.count()) {
      await menuBtn.click();
      await page.waitForTimeout(400);
      const pct = mode === '1' ? '100' : mode === '1.25' ? '125' : mode === '1.5' ? '150' : '200';
      await page.locator(`[role="menuitemradio"]`, { hasText: `${pct}%` }).first().click().catch(() => undefined);
      await page.waitForTimeout(600);
      await page.keyboard.press('Escape');
      await page.waitForTimeout(400);
    }
  }

  await page.evaluate((poiId) => (window as any).__idleVillageTestHooks.expedition[poiId].openDetail(), POI);
  await page.waitForSelector('[data-testid="quest-expedition-detail"]', { state: 'attached', timeout: 15000 });
  await page.waitForTimeout(1200);

  const zoom = await page.evaluate(() => getComputedStyle(document.querySelector('[data-hud-zoom-layer]')!).zoom);
  console.log('layer zoom =', zoom);

  const resident = page.locator(`[data-resident-id="${RESIDENT}"]`).first();
  const slot = page.locator(`[data-testid="slot-button-${SLOT}"]`).first();
  const source = await resident.boundingBox();
  const dest = await slot.boundingBox();
  console.log('resident box', JSON.stringify(source), '| slot box', JSON.stringify(dest));
  if (!source || !dest) { console.log('MISSING BOXES'); await browser.close(); return; }

  const hit = await page.evaluate((pos) => {
    const el = document.elementFromPoint(pos.x, pos.y);
    const card = document.querySelector(`[data-resident-id="hero-giggiolillo"]`);
    return {
      hitTag: el ? `${el.tagName}#${el.id || (el as HTMLElement).dataset?.testid || ''} .${(el.className || '').toString().slice(0, 40)}` : null,
      inside: el && card ? (card.contains(el) || el === card || el.contains(card)) : null,
      cardDetached: card ? !card.isConnected : true,
      cardNow: card ? (() => { const r = card.getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height }; })() : null,
    };
  }, { x: source.x + source.width / 2, y: source.y + source.height / 2 });
  console.log('hit test at card center:', JSON.stringify(hit));

  const activeOverlay = page.locator('[data-dnd-overlay][data-debug-active-id]');
  let activated = false;
  for (let attempt = 0; attempt < 3 && !activated; attempt += 1) {
    await page.mouse.move(source.x + source.width / 2, source.y + source.height / 2);
    await page.mouse.down();
    await page.mouse.move(source.x + source.width / 2 + 24, source.y + source.height / 2, { steps: 4 });
    activated = await activeOverlay.waitFor({ state: 'visible', timeout: 3000 }).then(() => true).catch(() => false);
    if (!activated) await page.mouse.up();
  }
  console.log('drag activated:', activated);

  // Track overlay-vs-cursor alignment mid-drag.
  const midX = (source.x + dest.x + dest.width / 2) / 2;
  const midY = (source.y + dest.y + dest.height / 2) / 2;
  await page.mouse.move(midX, midY, { steps: 6 });
  const mid = await page.evaluate(() => {
    const ov = document.querySelector('[data-dnd-overlay][data-debug-active-id]');
    if (!ov) return null;
    const b = ov.getBoundingClientRect();
    const medal = ov.querySelector('.tok-svg') ?? ov.firstElementChild;
    const mb = medal?.getBoundingClientRect();
    return {
      box: { cx: b.x + b.width / 2, cy: b.y + b.height / 2, w: b.width, h: b.height },
      medal: mb ? { cx: mb.x + mb.width / 2, cy: mb.y + mb.height / 2, w: mb.width, h: mb.height } : null,
    };
  });
  console.log('mid-drag', JSON.stringify(mid), 'cursor', { x: midX, y: midY },
    'medal err =', mid?.medal ? Math.hypot(mid.medal.cx - midX, mid.medal.cy - midY).toFixed(1) : 'n/a');

  // Drop on the slot → flight proxy → seated check.
  await page.mouse.move(dest.x + dest.width / 2, dest.y + dest.height / 2, { steps: 6 });
  await page.mouse.up();
  await page.waitForSelector('[data-testid="flight-proxy"]', { timeout: 5000 }).catch(() => undefined);
  // sample flight end
  await page.waitForTimeout(500);
  const seated = await page.evaluate((slotId) => {
    const slot = document.querySelector(`[data-testid="slot-button-${slotId}"]`);
    if (!slot) return { err: 'no slot' };
    const sr = slot.getBoundingClientRect();
    const scx = sr.left + sr.width / 2, scy = sr.top + sr.height / 2;
    // seated medallion inside slot
    const medal = slot.querySelector('.tok-svg, [data-testid*="medal"], img') ?? slot;
    const mr = medal.getBoundingClientRect();
    return { slotCenter: { x: scx, y: scy }, medalCenter: { x: mr.left + mr.width / 2, y: mr.top + mr.height / 2 }, err: Math.hypot(mr.left + mr.width / 2 - scx, mr.top + mr.height / 2 - scy) };
  }, SLOT);
  console.log('seated', JSON.stringify(seated));
  const assignment = await page.evaluate((poiId) => (window as any).__idleVillageTestHooks.expedition[poiId].getAssignments?.(), POI);
  console.log('assignments', JSON.stringify(assignment));
  await page.screenshot({ path: 'test-results/plan-043/ws5/zoom-drag-2560.png' });
  console.log('errors:', errors.slice(0, 5));
  await browser.close();
};
void main();
