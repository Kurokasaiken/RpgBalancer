import { chromium } from 'playwright';
const b = await chromium.launch({args:['--enable-unsafe-swiftshader']});
const page = await b.newPage({viewport:{width:1600,height:900}});
page.on('pageerror', e => console.log('PAGEERR:', String(e).slice(0,600)));
page.on('requestfailed', r => console.log('REQFAIL:', r.url().slice(-80)));
page.on('response', r => { if (r.status() >= 400) console.log('HTTP', r.status(), r.url().slice(-80)); });
for (const comp of ['reliquary', 'cassetto']) {
  await page.goto(`http://localhost:5173/hud-compose?comp=${comp}&view=narrative`,{waitUntil:'domcontentloaded',timeout:30000});
  await page.waitForTimeout(5000);
  const n = await page.evaluate(() => ({
    slots: document.querySelectorAll('[data-hudslot]').length,
    canvas: document.querySelectorAll('canvas').length,
    body: document.body.innerHTML.length,
  }));
  console.log(comp, JSON.stringify(n));
}
await b.close();
