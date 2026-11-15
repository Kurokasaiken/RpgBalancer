import { chromium } from 'playwright';
const b = await chromium.launch({ args: ['--enable-unsafe-swiftshader'] });
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
p.on('pageerror', e => console.log('[pageerror]', String(e).slice(0, 200)));
await p.goto('http://localhost:5173/game?poiDemo=1', { waitUntil: 'domcontentloaded', timeout: 45000 });
let ready = false;
for (let i = 0; i < 90; i++) {
  if (await p.evaluate(() => !!document.querySelector('[data-map-ready]'))) { ready = true; console.log('ready at', i); break; }
  await p.waitForTimeout(2000);
}
await p.evaluate(() => { const v = document.querySelector('[data-testid="game-boot-screen"]'); if (v) v.style.display = 'none'; });
const failures = [];
// silent state first: bust alone, no plaque
const silent = await p.evaluate(() => ({ bust: !!document.querySelector('[data-hr-voce-bust]'), plaque: !!document.querySelector('[data-hr-voce-plaque]') }));
console.log('silent state:', JSON.stringify(silent));
if (!silent.bust) failures.push('busto assente a feed silenzioso');
if (silent.plaque) failures.push('placca presente a feed silenzioso');
// register a real threat in the ledger (no theatre timing) → feed → voce speaks
await p.evaluate(() => window.__idleVillageTestHooks?.confirmInvasion?.());
let spoke = false;
try {
  await p.waitForSelector('[data-hr-voce-plaque]', { state: 'attached', timeout: 30000 });
  spoke = true;
  console.log('voce spoke');
} catch {
  console.log('voce silent after 30s');
}
if (!spoke) failures.push('la voce non ha parlato entro 30s');
// Hold the plaque open (autoCloseMs suspends on hover/focus): a synthetic
// mouseover pins `held` deterministically — a real Playwright hover can stall
// under memory pressure and its 30s timeout alone would blow the 15s window.
if (spoke) await p.evaluate(() => document.querySelector('[data-hudreal-voce]')?.dispatchEvent(new MouseEvent('mouseover', { bubbles: true })));
const out = await p.evaluate(() => {
  const plaque = document.querySelector('[data-hr-voce-plaque]');
  const slot = document.querySelector('[data-hudslot="voce"]');
  const rr = (e) => { const r = e?.getBoundingClientRect(); return r ? {x:+r.x.toFixed(1),y:+r.y.toFixed(1),w:+r.width.toFixed(1),h:+r.height.toFixed(1)} : null; };
  return {
    slot: rr(slot), plaque: rr(plaque),
    title: plaque?.querySelector('span')?.textContent,
    text: document.querySelector('[data-hr-voce-text]')?.textContent,
  };
});
console.log(JSON.stringify(out));
if (!out.plaque) failures.push('placca non misurabile');
if (!out.text) failures.push('testo messaggio assente');
// interaction first (inside the 15s autoClose window), screenshots last —
// screenshots can eat seconds under memory pressure and must not race the fold.
const closeOk = await p.locator('[data-hr-voce-close]').click({ timeout: 10000 }).then(() => true).catch(() => false);
if (!closeOk) failures.push('close button non cliccabile');
await p.waitForTimeout(900);
const closed = await p.evaluate(() => ({ bust: !!document.querySelector('[data-hr-voce-bust]'), plaque: !!document.querySelector('[data-hr-voce-plaque]') }));
console.log('after dismiss:', JSON.stringify(closed));
if (closed.plaque) failures.push('placca ancora aperta dopo dismiss');
if (!closed.bust) failures.push('busto sparito dopo dismiss');
const bustOk = await p.locator('[data-hr-voce-bust]').click({ timeout: 10000 }).then(() => true).catch(() => false);
if (!bustOk) failures.push('bust click fallito');
await p.waitForTimeout(900);
const reopened = await p.evaluate(() => !!document.querySelector('[data-hr-voce-plaque]'));
console.log('after bust click plaque:', reopened);
if (!reopened) failures.push('reopen dal busto fallita');
await p.screenshot({ path: 'test-results/r338-voce-game.png', timeout: 15000 }).catch(e => console.log('shot1 failed', String(e).slice(0, 80)));
await p.screenshot({ path: 'test-results/r338-voce-crop.png', clip: { x: 0, y: 560, width: 480, height: 340 }, timeout: 15000 }).catch(e => console.log('shot2 failed', String(e).slice(0, 80)));
await p.screenshot({ path: 'test-results/r338-voce-reopen.png', timeout: 15000 }).catch(e => console.log('shot3 failed', String(e).slice(0, 80)));
await b.close();
if (failures.length) { console.log('FAILURES:', JSON.stringify(failures)); process.exit(1); }
