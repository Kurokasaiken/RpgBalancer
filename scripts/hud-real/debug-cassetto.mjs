import { chromium } from 'playwright';
const b = await chromium.launch({args:['--enable-unsafe-swiftshader']});
const page = await b.newPage({viewport:{width:1600,height:900}});
page.on('console', m => { if (m.type()==='error') console.log('ERR', m.text().slice(0,400)); });
page.on('pageerror', e => console.log('PAGEERR', e.message?.slice(0,400), e.stack?.split('\n').slice(0,6).join(' | ')));
await page.goto('http://localhost:5173/hud-compose?comp=cassetto&view=context',{waitUntil:'domcontentloaded',timeout:30000});
await page.waitForTimeout(5000);
await b.close();
console.log('done');
