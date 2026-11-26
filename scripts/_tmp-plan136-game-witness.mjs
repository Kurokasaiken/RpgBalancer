import { chromium } from 'playwright';
import fs from 'node:fs';
const OUT='test-results/plan136-stash-round-sockets';
const b=await chromium.launch({headless:true,args:['--use-angle=metal','--enable-gpu']});
const pg=await b.newPage({viewport:{width:1440,height:900},deviceScaleFactor:1});
pg.on('pageerror',e=>console.log('PAGEERROR',String(e).slice(0,180)));
await pg.goto('http://localhost:5173/game',{waitUntil:'domcontentloaded',timeout:45000});
for(let i=0;i<90;i++){const n=await pg.evaluate(()=>document.querySelectorAll('[data-nav-id]').length).catch(()=>0);if(n>0)break;await pg.waitForTimeout(1000)}
await pg.waitForTimeout(2000);
for(let i=0;i<8;i++){await pg.evaluate(()=>document.querySelector('[data-nav-id="villageStash"]')?.click());await pg.waitForTimeout(700);if(await pg.evaluate(()=>!!document.querySelector('[data-hud-panel="villageStash"]')).catch(()=>false))break}
const panel=pg.locator('[data-hud-panel="villageStash"]');
console.log('panel',await panel.count(),'nav',await pg.locator('[data-nav-id]').count());
if(await panel.count()){
 await pg.evaluate(()=>{const boot=document.querySelector('[data-testid="game-boot-screen"]'); if(boot) boot.style.display='none';});
 await pg.waitForTimeout(1000);
 await pg.screenshot({path:`${OUT}/witness-game-stash.png`});
 const bb=await panel.boundingBox(); if(bb) await pg.screenshot({path:`${OUT}/witness-game-stash-panel.png`,clip:{x:Math.max(0,bb.x-8),y:Math.max(0,bb.y-8),width:bb.width+16,height:bb.height+16}});
 const report=await pg.evaluate(()=>{const q=s=>document.querySelector(s);const r=e=>{if(!e)return null;const b=e.getBoundingClientRect();return{x:Math.round(b.x),y:Math.round(b.y),w:Math.round(b.width),h:Math.round(b.height)}};return{title:q('#village-stash-panel-title')?.textContent,filters:r(q('[data-testid="stash-filters"]')),close:r(q('[data-panel-close]')),track:!!q('[data-testid="stash-scroll-track"]'),empties:document.querySelectorAll('[data-testid="stash-empty-alcove"]').length,items:document.querySelectorAll('[role="listitem"]').length}});
 console.log(JSON.stringify(report));
 fs.writeFileSync(`${OUT}/witness-game-report.json`,JSON.stringify(report,null,2));
}
await b.close();
