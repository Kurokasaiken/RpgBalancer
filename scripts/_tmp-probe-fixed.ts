import { chromium } from 'playwright';
const b = await chromium.launch({ headless: true });
const p = await b.newPage({ viewport: { width: 390, height: 300 } });
await p.setContent(`<div id="w" style="position:absolute;inset:0;zoom:1.5;pointer-events:none">
  <div id="fx" style="position:fixed;right:10px;bottom:10px;width:40px;height:40px;background:red;pointer-events:auto"></div>
  <div id="ab" style="position:absolute;left:10px;top:10px;width:40px;height:40px;background:blue;pointer-events:auto"></div>
</div>`);
await p.waitForTimeout(100);
const r = await p.evaluate(`(() => {
  const m = (id) => { const r = document.getElementById(id).getBoundingClientRect(); return {x:r.x,y:r.y,w:r.width,r:r.right,b:r.bottom}; };
  const fxd = document.getElementById('fx'); const rr = fxd.getBoundingClientRect();
  return { fx: m('fx'), ab: m('ab'), hit: document.elementFromPoint(rr.x+1, rr.y+1)?.id };
})()`);
console.log(JSON.stringify(r));
await b.close();
