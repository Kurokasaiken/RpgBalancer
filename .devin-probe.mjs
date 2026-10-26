import { chromium } from 'playwright';
const base = process.argv[2]; const tag = process.argv[3];
const b = await chromium.launch({ headless: true });
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
const errs = []; p.on('pageerror', e => errs.push(e.message.slice(0, 300))); p.on('console', m => { if (m.type()==='error') errs.push('console: '+m.text().slice(0,300)); }); p.on('framenavigated', f => { if (f===p.mainFrame()) console.log('NAV', f.url()); });
await p.goto(base + '/game');
await p.waitForFunction(() => Boolean(window.__idleVillageTestHooks?.expedition?.['poi-goblin']), null, { timeout: 60000 });
await p.evaluate(() => window.__idleVillageTestHooks.revealQuestPois?.());
await p.evaluate(() => window.__idleVillageTestHooks.expedition['poi-goblin'].demoLaunch());
for (let i=0;i<40 && !(await p.locator('[data-testid="quest-window"]').count());i++) await p.waitForTimeout(500);
const win = await p.locator('[data-testid="quest-window"]').count();
const eb = await p.locator('text=/Something went wrong|error/i').count();
await p.screenshot({ path: `/tmp/devin-pw/${tag}-launch.png` });
console.log(JSON.stringify({ tag, questWindow: win, errorText: eb, errs: errs.slice(0, 5) }));
if (win) {
  const seen = new Set(); const t0 = Date.now(); let checkShot = false;
  while (Date.now() - t0 < 150000) {
    const hk = await p.evaluate(() => Boolean(window.__idleVillageTestHooks?.expedition?.['poi-goblin'])); if (!hk) { console.log('HOOKS GONE', p.url(), Math.round((Date.now()-t0)/1000)+'s', 'qw=', await p.locator('[data-testid="quest-window"]').count()); await p.screenshot({ path: `/tmp/devin-pw/${tag}-gone.png` }); break; }
    const run = await p.evaluate(() => { const r = window.__idleVillageTestHooks.expedition['poi-goblin'].getRun(); return r && { node: r.nodeId, ended: r.ended, st: r.frontier?.status }; });
    if (!run || run.ended) { console.log('run end', JSON.stringify(run)); break; }
    seen.add(run.node + ':' + run.st);
    if (await p.locator('[data-testid="quest-check-column"]').count()) { console.log('CHECK COLUMN at', run.node, Math.round((Date.now()-t0)/1000)+'s'); if (!checkShot) { checkShot = true; await p.screenshot({ path: `/tmp/devin-pw/${tag}-check.png` }); } }
    if (await p.locator('.da-tira').isVisible().catch(() => false)) { console.log('THROW visible at', run.node); await p.locator('.da-tira').click({ timeout: 2000 }).catch(() => {}); }
    const ch = p.locator('[data-testid="quest-window-choice"]:not([disabled])');
    if (await ch.count()) { await ch.first().click({ timeout: 3000 }).catch(() => {}); }
    else if (run.st === 'pending' || run.st === 'waiting') await p.evaluate(() => window.__idleVillageTestHooks.expedition['poi-goblin'].advanceTicks?.(1)).catch(() => {});
    await p.waitForTimeout(700);
  }
  console.log('nodes', [...seen].join(' | '));
  await p.screenshot({ path: `/tmp/devin-pw/${tag}-end.png` });
}
console.log('errs', JSON.stringify(errs.slice(0, 5)));
await b.close();
