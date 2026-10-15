import { chromium } from 'playwright';
const POI='poi-goblin', LEADER=`${POI}:goblin-slot-leader`, M1=`${POI}:goblin-slot-member-1`;
const b = await chromium.launch(); const page = await b.newPage({ viewport:{width:1600,height:1000} });
await page.goto('http://127.0.0.1:5179/game');
await page.waitForFunction((pid:string)=>Boolean((window as any).__idleVillageTestHooks?.expedition?.[pid]), POI, {timeout:60000});
await page.evaluate(()=>(window as any).__idleVillageTestHooks?.expedition?.['poi-goblin']?.openDetail?.());
await page.getByTestId(`floating-panel-quest-expedition-${POI}`).waitFor();
// assign via hooks (assignToSlot exists in the session's hook surface)
await page.evaluate(()=>{const e=(window as any).__idleVillageTestHooks?.expedition?.['poi-goblin'];e?.assignToSlot?.('poi-goblin:goblin-slot-leader','villager-mastro-beppe');e?.assignToSlot?.('poi-goblin:goblin-slot-member-1','hero-sir-spaccaculi');});
await page.waitForTimeout(500);
const asg = await page.evaluate(()=>(window as any).__idleVillageTestHooks?.expedition?.['poi-goblin']?.getAssignments?.());
console.log('assignments:', JSON.stringify(asg));
const token = page.getByTestId(`slot-token-${LEADER}`);
const target = page.locator(`[data-slot-id="${M1}"]`).first();
console.log('token visible:', await token.isVisible(), 'box:', await token.boundingBox());
const a = await token.boundingBox(), bb = await target.boundingBox();
const from={x:a.x+a.width/2,y:a.y+a.height/2}, to={x:bb.x+bb.width/2,y:bb.y+bb.height/3};
await page.mouse.move(from.x,from.y); await page.mouse.down();
for(let i=1;i<=10;i++){
  await page.mouse.move(from.x+(to.x-from.x)*i/10, from.y+(to.y-from.y)*i/10);
  if(i===5){
    await page.waitForTimeout(300);
    const states = await page.evaluate(()=>Array.from(document.querySelectorAll('[data-slot-id]')).map(el=>`${el.getAttribute('data-slot-id')}:${el.getAttribute('data-drop-state')}`));
    console.log('mid states:', states.join(' | '));
    console.log('ghost:', await page.getByTestId('slot-token-ghost').count());
  }
}
await page.mouse.up();
await page.waitForTimeout(800);
console.log('after:', JSON.stringify(await page.evaluate(()=>(window as any).__idleVillageTestHooks?.expedition?.['poi-goblin']?.getAssignments?.())));
await b.close();
