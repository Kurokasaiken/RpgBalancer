import { chromium } from 'playwright';
const b = await chromium.launch({ args:['--enable-unsafe-swiftshader'] });
const pg = await b.newPage({ viewport:{ width:1600, height:1200 }, deviceScaleFactor:2 });
pg.on('pageerror', e => console.log('PAGEERROR', String(e).slice(0,300)));
pg.on('console', m => { if (m.type()==='error') console.log('CONSOLE', m.text().slice(0,300)); });
await pg.goto('http://localhost:5173/hud-lab', { waitUntil:'domcontentloaded', timeout:60000 });
try {
  await pg.waitForSelector('[data-lab-id="time-sole"]', { timeout:60000 });
} catch { console.log('selector timeout'); }
await pg.waitForTimeout(5000);
await pg.screenshot({ path:'.mw/runs/20261123-lingua-audit/lab-debug.png' });
const card = await pg.$('[data-lab-id="time-sole"]');
if (card) { await card.screenshot({ path:'.mw/runs/20261123-lingua-audit/lab-timesole.png' }); console.log('card ok'); }
await b.close();
