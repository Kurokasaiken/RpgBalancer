import { chromium } from 'playwright';
const b = await chromium.launch();
const p = await b.newPage({viewport:{width:1760,height:640}, deviceScaleFactor:2});
await p.goto('file:///Users/faustoboni/progetti_personali/RPG/.mw/specs/hud-real/slot-stock-schematic.svg');
await p.waitForTimeout(800);
await p.screenshot({path:'.mw/specs/hud-real/slot-stock-schematic.png'});
await b.close();
console.log('done');
