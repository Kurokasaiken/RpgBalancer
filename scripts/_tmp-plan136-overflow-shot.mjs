import { chromium } from 'playwright';
const OUT='test-results/plan136-stash-round-sockets';
const b=await chromium.launch({headless:true});
const pg=await b.newPage({viewport:{width:900,height:700}});
await pg.goto('http://localhost:5173/hud-lab',{waitUntil:'networkidle'});
await pg.waitForTimeout(2500);
const card=await pg.$('[data-lab-id="stash-overflow-fixture"] [data-lab-mount]');
await card.scrollIntoViewIfNeeded();
await pg.waitForTimeout(500);
await card.screenshot({path:`${OUT}/witness-overflow-panel.png`});
// also the normal stash card for the no-track comparison at same size
const normal=await pg.$('[data-lab-id="stash"] [data-lab-mount]');
await normal.scrollIntoViewIfNeeded();
await pg.waitForTimeout(300);
await normal.screenshot({path:`${OUT}/witness-nooverflow-panel.png`});
await b.close();
console.log('done');
