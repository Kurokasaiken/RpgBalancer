import { chromium } from 'playwright';
const b = await chromium.launch({args:['--enable-unsafe-swiftshader']});
const page = await b.newPage({viewport:{width:1600,height:900}});
page.on('pageerror', e => console.log('PAGEERR:', String(e).slice(0,500)));
await page.goto('http://localhost:5173/hud-compose?comp=cassetto&view=narrative',{waitUntil:'domcontentloaded',timeout:30000});
await page.waitForTimeout(6000);
const state = await page.evaluate(() => ({
  hudslots: document.querySelectorAll('[data-hudslot]').length,
  root: !!document.getElementById('root'),
  rootChildren: document.getElementById('root')?.children.length,
  overlay: !!document.querySelector('vite-error-overlay'),
  overlayText: document.querySelector('vite-error-overlay')?.shadowRoot?.textContent?.slice(0,600),
  canvas: document.querySelectorAll('canvas').length,
}));
console.log(JSON.stringify(state,null,1));
await b.close();
