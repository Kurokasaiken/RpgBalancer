import { chromium } from 'playwright';
import fs from 'node:fs';
const OUT='test-results/plan136-stash-round-sockets';
const b=await chromium.launch({headless:true});
const pg=await b.newPage({viewport:{width:900,height:700}});
await pg.goto('http://localhost:5173/hud-lab?host=stash-overflow',{waitUntil:'networkidle'});
await pg.waitForTimeout(2500);
const report=await pg.evaluate(()=>{
 const card=document.querySelector('[data-lab-id="stash-overflow-fixture"]');
 if(!card) return {error:'no card'};
 const shelf=card.querySelector('[data-testid="stash-shelf"]');
 if(!shelf) return {error:'no shelf'};
 const panel=shelf.closest('div');
 let root=shelf; while(root.parentElement && !root.parentElement.style?.width && root.parentElement!==document.body) root=root.parentElement;
 shelf.scrollIntoView({block:'center'});
 const track=card.querySelector('[data-testid="stash-scroll-track"]');
 const items=shelf.querySelectorAll('[data-testid^="stash-item-"]').length;
 const empties=shelf.querySelectorAll('[data-testid="stash-empty-alcove"]').length;
 return {
  items, empties,
  scrollHeight: shelf.scrollHeight, clientHeight: shelf.clientHeight,
  shelfOverflowY: getComputedStyle(shelf).overflowY,
  trackFound: !!track,
  trackVisible: track ? track.getBoundingClientRect().width>0 : false,
 };
});
console.log(JSON.stringify(report));
await pg.waitForTimeout(400);
await pg.screenshot({path:`${OUT}/witness-overflow-full.png`});
const shelf2=await pg.$('[data-testid="stash-shelf"]');
// capture the whole panel: climb to the positioned ancestor
const handle=await pg.evaluateHandle(()=>{
 const shelf=document.querySelector('[data-lab-id="stash-overflow-fixture"] [data-testid="stash-shelf"]');
 let el=shelf;
 while(el && !(el.style?.position==='absolute'||getComputedStyle(el).position==='absolute'&&el.style.width)) el=el.parentElement;
 return el??shelf;
});
await handle.screenshot({path:`${OUT}/witness-overflow-panel.png`});
fs.writeFileSync(`${OUT}/witness-overflow-report.json`,JSON.stringify(report,null,2));
// drag-to-scroll probe: scroll shelf programmatically then check thumb movement
const drag=await pg.evaluate(()=>{
 const shelf=document.querySelector('[data-lab-id="stash-overflow-fixture"] [data-testid="stash-shelf"]');
 shelf.scrollTop=120;
 return {scrolled:shelf.scrollTop};
});
console.log('drag probe',JSON.stringify(drag));
await pg.waitForTimeout(300);
await pg.screenshot({path:`${OUT}/witness-overflow-scrolled.png`});
await b.close();
