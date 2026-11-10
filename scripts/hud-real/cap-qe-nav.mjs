import { chromium } from 'playwright';
const b = await chromium.launch({args:['--enable-unsafe-swiftshader']});
const page = await b.newPage({viewport:{width:1500,height:1000}});
await page.goto('http://localhost:5173/quest-editor', {waitUntil:'domcontentloaded', timeout:20000});
await page.waitForTimeout(4000);
// 1. initial state
await page.screenshot({path:'test-results/qe-scene-0.png'});
// 2. click a mid-scene button — run should jump there (▶ + play surface)
const btn = page.locator('button', {hasText: 'gob-ritorno'});
if (await btn.count()) { await btn.first().click(); await page.waitForTimeout(800); }
await page.screenshot({path:'test-results/qe-scene-nav.png'});
// 3. try removing the selected scene (has inbound refs)
const rm = page.locator('button', {hasText: '− scena'});
if (await rm.count()) { await rm.first().click(); await page.waitForTimeout(600); }
await page.screenshot({path:'test-results/qe-scene-removed.png'});
console.log('done');
await b.close();
