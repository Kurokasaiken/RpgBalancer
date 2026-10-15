import { chromium } from 'playwright';
const POI='poi-goblin', SLOT=`${POI}:goblin-slot-leader`, RID='villager-mastro-beppe';
for (let round=0; round<2; round++) {
  const b = await chromium.launch(); const page = await b.newPage({ viewport:{width:1600,height:1000} });
  await page.goto('http://127.0.0.1:5179/game');
  await page.waitForFunction((pid)=>Boolean(window.__idleVillageTestHooks?.expedition?.[pid]), POI, {timeout:60000});
  await page.keyboard.press('r');
  await page.waitForSelector(`[data-worker-id="${RID}"]`, {timeout:15000});
  // Director reveal — same as revealQuestPoiViaDirector
  await page.keyboard.press('F10');
  await page.getByTestId('director-panel').waitFor({timeout:10000});
  await page.locator('[data-action-id="quest"]').click();
  await page.getByTestId('pixi-world-anchors').waitFor({timeout:60000});
  await page.locator(`[data-quest-poi-id="${POI}"]`).waitFor({timeout:15000});
  await page.keyboard.press('F10');
  await page.getByTestId('director-panel').waitFor({state:'hidden',timeout:5000});
  // marker click → planner
  await page.locator(`[data-quest-poi-id="${POI}"]`).click();
  await page.getByTestId(`floating-panel-quest-expedition-${POI}`).waitFor();
  // drag
  for (let attempt=0; attempt<2; attempt++) {
    const card = page.locator(`[data-worker-id="${RID}"]`).first();
    const slot = page.locator(`[data-slot-id="${SLOT}"]`).first();
    await slot.scrollIntoViewIfNeeded(); await card.scrollIntoViewIfNeeded();
    await page.evaluate((id)=>window.__idleVillageTestHooks?.setDraggingResidentId?.(id), RID);
    await page.waitForFunction((id)=>window.__idleVillageTestHooks?.getDraggingResidentId?.()===id, RID, {timeout:2000}).catch(()=>console.log('  override never reflected'));
    const cb = await card.boundingBox(), sb = await slot.boundingBox();
    const from={x:cb.x+cb.width/2,y:cb.y+cb.height/2}, to={x:sb.x+sb.width/2,y:sb.y+sb.height/2};
    console.log(`r${round}a${attempt} from=(${from.x|0},${from.y|0}) to=(${to.x|0},${to.y|0})`);
    const pressStack = await page.evaluate(([x,y])=>document.elementsFromPoint(x,y).slice(0,4).map(e=>e.getAttribute('data-testid')||e.getAttribute('data-worker-id')||e.tagName),[from.x,from.y]);
    const c=await page.context().newCDPSession(page);
    await c.send('Input.dispatchMouseEvent',{type:'mouseMoved',x:from.x,y:from.y});
    await new Promise(r=>setTimeout(r,16));
    await c.send('Input.dispatchMouseEvent',{type:'mousePressed',x:from.x,y:from.y,button:'left',clickCount:1});
    await new Promise(r=>setTimeout(r,16));
    for(let i=1;i<=12;i++){ await c.send('Input.dispatchMouseEvent',{type:'mouseMoved',x:from.x+(to.x-from.x)*i/12,y:from.y+(to.y-from.y)*i/12,button:'left'}); await new Promise(r=>setTimeout(r,16)); }
    await new Promise(r=>setTimeout(r,16));
    const mid = await page.evaluate((sid)=>{const el=document.querySelector(`[data-slot-id="${sid}"]`);return {state:el?.getAttribute('data-drop-state'),drag:window.__idleVillageTestHooks?.getDraggingResidentId?.()};},SLOT);
    const relStack = await page.evaluate(([x,y])=>document.elementsFromPoint(x,y).slice(0,4).map(e=>e.getAttribute('data-slot-id')||e.getAttribute('data-testid')||e.tagName),[to.x,to.y]);
    await c.send('Input.dispatchMouseEvent',{type:'mouseReleased',x:to.x,y:to.y,button:'left',clickCount:1});
    await c.detach();
    await page.waitForTimeout(1500);
    const asg = await page.evaluate(()=>window.__idleVillageTestHooks?.expedition?.['poi-goblin']?.getAssignments?.());
    console.log(`  press:${pressStack.join('>')} mid:${JSON.stringify(mid)} rel:${relStack.join('>')} asg:${JSON.stringify(asg)}`);
    if (asg && Object.values(asg).some(v=>v)) break;
  }
  await b.close();
}
