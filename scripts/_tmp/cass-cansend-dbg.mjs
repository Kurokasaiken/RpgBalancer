import { chromium } from 'playwright';
const POI = 'poi-goblin';
const b = await chromium.launch({ headless: true, args: ['--enable-unsafe-swiftshader'] });
const page = await b.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto('http://localhost:5173/game', { waitUntil: 'domcontentloaded', timeout: 120000 });
await page.waitForFunction((poi) => Boolean(window.__idleVillageTestHooks?.expedition?.[poi]), POI, { timeout: 60000 });
await page.waitForSelector('[data-testid="game-boot-screen"]', { state: 'hidden', timeout: 120000 }).catch(() => {});
const dbg = await page.evaluate((poi) => {
  const e = window.__idleVillageTestHooks?.expedition?.[poi];
  return { actions: e ? Object.keys(e) : null };
}, POI);
console.log('hook actions:', dbg.actions);
const exp = async (action, ...args) => page.evaluate(([act, fnArgs, poi]) => {
  const e = window.__idleVillageTestHooks?.expedition?.[poi];
  return e[act](...fnArgs);
}, [action, args, POI]);
await exp('openDetail');
await page.waitForSelector('[data-cassetto-column]', { timeout: 30000 });
const slots = [`${POI}:goblin-slot-leader`, `${POI}:goblin-slot-member-1`, `${POI}:goblin-slot-member-2`, `${POI}:goblin-slot-bodyguard`];
const folk = ['hero-sir-spaccaculi', 'villager-mastro-beppe', 'villager-lisetta', 'villager-baldassarre'];
for (let i = 0; i < slots.length; i++) {
  const res = await exp('assignToSlot', slots[i], folk[i]);
  console.log(`assign ${folk[i]} -> ${slots[i]}:`, res);
}
await page.waitForTimeout(1000);
const state = await page.evaluate((poi) => {
  const e = window.__idleVillageTestHooks?.expedition?.[poi];
  const out = {};
  for (const k of Object.keys(e)) {
    if (k.startsWith('get') || k === 'canSend') {
      try { out[k] = typeof e[k] === 'function' ? e[k]() : e[k]; } catch (err) { out[k] = 'err'; }
    }
  }
  const cta = document.querySelector('[data-testid="cassetto-confirm"]');
  out.ctaDisabled = cta?.disabled;
  out.jewels = document.querySelectorAll('.cta-jewel').length;
  return out;
}, POI);
console.log(JSON.stringify(state, null, 1));
await b.close();
