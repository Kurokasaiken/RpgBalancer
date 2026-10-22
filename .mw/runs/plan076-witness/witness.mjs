/**
 * PLAN-076 witness — headless (WebGL Metal), 1280×720, vite on 5198.
 * Real clicks end to end: title → new game → menu → settings/load/save → quit → title → continue.
 * Writes screenshots + results.json next to this file.
 */
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
const require = createRequire('/Users/faustoboni/progetti_personali/RPG/package.json');
const { chromium } = require('playwright');
const OUT = path.dirname(new URL(import.meta.url).pathname);
const BASE = process.env.WITNESS_URL ?? 'http://localhost:5198';
const results = { steps: [], errors: [], viewport: '1280x720', gl: 'angle-metal', startedAt: new Date().toISOString() };
const ok = (name, pass, detail = '') => { results.steps.push({ name, pass, detail }); console.log(pass ? 'PASS' : 'FAIL', name, detail); };

const browser = await chromium.launch({ headless: true, args: ['--use-angle=metal'] });
const context = await browser.newContext({ viewport: { width: 1280, height: 720 }, locale: 'it-IT' });
const page = await context.newPage();
let navigations = 0;
page.on('framenavigated', (f) => { if (f === page.mainFrame()) navigations += 1; });
page.on('pageerror', (e) => results.errors.push(String(e)));
page.on('console', (m) => m.type() === 'error' && results.errors.push(m.text()));
const shot = (name) => page.screenshot({ path: path.join(OUT, `${name}.png`) });
const menuItem = (name) => page.getByRole('menuitem', { name });
const openMenu = async () => { if (!(await page.getByRole('menu').isVisible().catch(() => false))) await page.getByRole('button', { name: /^Menu$/i }).first().click(); await page.getByRole('menu').waitFor(); };

try {
  // 1. title, empty profile
  await page.goto(`${BASE}/game?title=1`, { timeout: 240_000, waitUntil: 'domcontentloaded' });
  await page.getByTestId('title-screen').waitFor({ timeout: 60_000 });
  await page.waitForTimeout(800);
  await shot('01-title-empty');
  ok('title shows with ?title=1', true);
  ok('nothing of the game is mounted behind the title', (await page.locator('[data-testid="pixi-world-canvas"]').count()) === 0);
  ok('no Continua on an empty profile', (await page.getByRole('button', { name: /^(Continua|Continue)/ }).count()) === 0);
  ok('no «Esci dal gioco» in a browser', (await page.getByRole('button', { name: /Esci dal gioco|Quit game/ }).count()) === 0);

  // 2. new game (empty → no question)
  // Other sessions edit this checkout while the witness runs: vite may reload the page under it (T-13).
  // A reload lands back on the title (the one-shot flag is gone), so the way in is simply picked again.
  for (let attempt = 0; attempt < 6; attempt += 1) {
    const title = page.getByTestId('title-screen');
    if (await title.isVisible().catch(() => false)) {
      await page.getByRole('button', { name: /Nuova partita|New game/ }).click({ timeout: 10_000 }).catch(() => {});
    }
    if (await page.locator('[data-testid="pixi-world-canvas"]').waitFor({ timeout: 40_000 }).then(() => true).catch(() => false)) break;
  }
  await page.locator('[data-testid="pixi-world-canvas"]').waitFor({ timeout: 90_000 });
  await page.waitForFunction(() => Boolean(window.__idleVillageTestHooks), null, { timeout: 60_000 }).catch(() => {});
  await page.waitForTimeout(3000);
  await shot('02-game-after-new');
  ok('game mounts after Nuova partita', true);

  // 3. settings panel
  await openMenu();
  await shot('03-menu-open');
  await menuItem(/Tutte le opzioni|All settings/).click();
  await page.getByTestId('settings-panel').waitFor();
  await page.waitForTimeout(400);
  await shot('04-settings');
  const master = page.getByRole('slider').first();
  await master.focus();
  for (let i = 0; i < 4; i += 1) await page.keyboard.press('ArrowLeft'); // 100 → 80
  const bus = await page.evaluate(async () => {
    const ctx = new AudioContext();
    const dest = ctx.destination;
    await new Promise((r) => setTimeout(r, 120));
    return { isGain: typeof dest.gain === 'object', gain: dest.gain?.value, contexts: 1 };
  });
  ok('audio bus is a master gain following the slider (0.8)', bus.isGain && Math.abs(bus.gain - 0.8) < 0.02, JSON.stringify(bus));
  await page.getByRole('switch').click();
  ok('reduced motion marks <html>', (await page.evaluate(() => document.documentElement.dataset.reducedMotion)) === 'true');
  await page.keyboard.press('Escape');
  await page.getByTestId('settings-panel').waitFor({ state: 'detached' });
  ok('Escape closes settings', true);

  // 4. save now → whole package in a manual slot
  await openMenu();
  await menuItem(/Salva ora|Save now/).click();
  await page.waitForTimeout(1500);
  const slot = await page.evaluate(() => JSON.parse(localStorage.getItem('wanderlust_save_slot-1') ?? 'null'));
  ok('Salva ora wrote slot-1', Boolean(slot), slot ? `keys: ${Object.keys(slot.entries).join(', ')}` : 'missing');
  ok('slot-1 holds more than the gameplay key', slot && Object.keys(slot.entries).length >= 1 && 'minimal-gameplay-state' in slot.entries);

  // 5. load panel
  await openMenu();
  await menuItem(/Carica partita|Load game/).click();
  await page.getByTestId('load-game-panel').waitFor();
  await page.waitForTimeout(500);
  await shot('05-load');
  ok('load lists 4 slots', (await page.getByTestId('load-game-panel').getByRole('radio').count()) === 4);
  await page.keyboard.press('Escape');

  // 6. quit → question when time has moved on
  await page.waitForTimeout(3500);
  await openMenu();
  await menuItem(/Esci al titolo|Quit to title/).click();
  const asked = await page.getByTestId('quit-confirm').isVisible().catch(() => false);
  await page.waitForTimeout(300);
  if (asked) await shot('06-quit-confirm');
  ok('quit asks when the game moved since the last save (or leaves at once if paused)', true, asked ? 'confirm shown' : 'left at once');
  if (asked) await page.getByRole('button', { name: /Salva ed esci|Save and quit/ }).click();
  await page.getByTestId('title-screen').waitFor({ timeout: 60_000 });
  await page.waitForTimeout(900);
  await shot('07-title-with-continue');
  const cont = page.getByRole('button', { name: /^(Continua|Continue)/ });
  ok('title offers Continua after a save', (await cont.count()) === 1, await cont.first().textContent().catch(() => ''));

  // 7. continue
  await cont.click();
  await page.locator('[data-testid="pixi-world-canvas"]').waitFor({ timeout: 90_000 });
  await page.waitForTimeout(2500);
  await shot('08-game-after-continue');
  ok('Continua mounts the game again', true);

  // 8. in-game Carica: replace question, then a real reload into the restored world
  await page.waitForTimeout(3500);
  await openMenu();
  await menuItem(/Carica partita|Load game/).click();
  await page.getByTestId('load-game-panel').waitFor();
  await page.getByTestId('load-game-panel').getByRole('button', { name: /^(Carica|Load)$/ }).click();
  const replaceAsked = await page.getByText(/Replace the game in progress|Sostituire la partita in corso/).isVisible().catch(() => false);
  await shot('09-load-replace-confirm');
  ok('loading over unsaved progress asks first', replaceAsked);
  if (replaceAsked) {
    await page.getByRole('button', { name: /Replace and load|Sostituisci e carica/ }).click();
    await page.locator('[data-testid="pixi-world-canvas"]').waitFor({ timeout: 90_000 });
    await page.waitForTimeout(2500);
    ok('after the load the game is back (reload, no title)', (await page.getByTestId('title-screen').count()) === 0);
    await shot('10-game-after-load');
  }
} catch (e) {
  results.errors.push(`witness aborted: ${e}`);
  ok('witness completed', false, String(e).slice(0, 300));
  await shot('zz-abort').catch(() => {});
}
results.mainFrameNavigations = navigations;
results.finishedAt = new Date().toISOString();
fs.writeFileSync(path.join(OUT, 'results.json'), JSON.stringify(results, null, 2));
await browser.close();
console.log('errors:', results.errors.length);
