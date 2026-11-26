import { chromium } from 'playwright';
const OUT='test-results/plan136-stash-round-sockets';
const b=await chromium.launch({headless:true});
const pg=await b.newPage({viewport:{width:900,height:700}});
await pg.goto('http://localhost:5173/hud-lab',{waitUntil:'networkidle'});
await pg.waitForTimeout(2000);
const card=await pg.$('[data-lab-id="stash"]');
await card.scrollIntoViewIfNeeded();
await pg.waitForTimeout(400);
// first item alcove in the normal stash card
const item=await pg.$('[data-lab-id="stash"] .stash-alcove-face:not([data-testid="stash-empty-alcove"])');
const box=await item.boundingBox();
// before
await pg.screenshot({path:`${OUT}/hover-before.png`,clip:{x:box.x-8,y:box.y-8,width:box.width+70,height:box.height+16}});
// measure border color before/after
const measure=async()=>pg.evaluate(()=>{
 const el=document.querySelector('[data-lab-id="stash"] .stash-alcove-face:not([data-testid="stash-empty-alcove"])');
 const face=el.querySelector('.stash-alcove-face')??el;
 const cs=getComputedStyle(face);
 return {border:cs.borderColor, boxShadow:cs.boxShadow.slice(0,120), filter:cs.filter};
});
console.log('before',JSON.stringify(await measure()));
await item.hover();
await pg.waitForTimeout(500);
console.log('after ',JSON.stringify(await measure()));
await pg.screenshot({path:`${OUT}/hover-after.png`,clip:{x:box.x-8,y:box.y-8,width:box.width+70,height:box.height+16}});
await b.close();
