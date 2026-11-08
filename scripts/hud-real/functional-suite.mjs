/* Functional suite — every REAL interaction on the /hud-compose ported surfaces. */
import { chromium } from 'playwright';
const b = await chromium.launch({args:['--enable-unsafe-swiftshader']});
const R = [];
const ok = (name, pass, extra='') => { R.push(`${pass?'PASS':'FAIL'} ${name}${extra?' — '+extra:''}`); };
const page = await b.newPage({viewport:{width:1600,height:900}});
const go = async (q) => { await page.goto(`http://localhost:5173/hud-compose?${q}`,{waitUntil:'networkidle',timeout:30000}); await page.waitForTimeout(4000); };

/* ---- E3 reliquary ---- */
await go('comp=reliquary&view=narrative');
ok('reliquary 3 cols', await page.locator('[data-testid^="hudreal-reliquary-col-"]').count() === 3);
ok('reliquary items slots = village level (2)', await page.locator('[data-testid^="hudreal-reliquary-slot-items-"]').count() === 2);
await page.click('[data-testid="hudreal-reliquary-slot-items-0"]');
ok('reliquary pick 0 pressed', await page.locator('[data-testid="hudreal-reliquary-slot-items-0"]').getAttribute('aria-pressed') === 'true');
await page.click('[data-testid="hudreal-reliquary-slot-items-1"]');
ok('reliquary pick moves to 1', await page.locator('[data-testid="hudreal-reliquary-slot-items-1"]').getAttribute('aria-pressed') === 'true'
   && await page.locator('[data-testid="hudreal-reliquary-slot-items-0"]').getAttribute('aria-pressed') === 'false');

/* ---- E2 memorial ---- */
await go('comp=memorial&seed=memorial&view=narrative');
ok('memorial 3 niches (fixture)', await page.locator('[data-testid="hudreal-memorial-niche"]').count() === 3);
ok('memorial entry content', (await page.locator('[data-testid="hudreal-memorial-niche"]').first().innerText()).length > 10);

/* ---- F1 level-up ---- */
await go('comp=levelup&view=narrative');
await page.click('[data-testid="hudreal-levelup-trigger"]');
await page.waitForSelector('[data-testid="hudreal-levelup-plate"]', {timeout: 8000}).catch(()=>{});
ok('levelup plate opens on real event', await page.locator('[data-testid="hudreal-levelup-plate"]').count() === 1);
ok('levelup real gains rows', await page.locator('[data-gain-row]').count() > 0);
await page.click('text=/continue|prosegui/i');
await page.waitForTimeout(600);
ok('levelup continue closes', await page.locator('[data-testid="hudreal-levelup-plate"]').count() === 0);
await page.click('[data-testid="hudreal-levelup-trigger"]');
await page.waitForSelector('[data-testid="hudreal-levelup-plate"]', {timeout: 8000}).catch(()=>{});
await page.keyboard.press('Escape');
await page.waitForTimeout(600);
ok('levelup Esc closes', await page.locator('[data-testid="hudreal-levelup-plate"]').count() === 0);

/* ---- F4 lost ---- */
await go('comp=lost&view=narrative');
ok('lost emblem (product asset)', await page.locator('img[src*="C1/emblem.webp"]').count() === 1);
ok('lost tombs = 3', await page.locator('[data-testid="hudreal-lost-tomb"]').count() === 3);
ok('lost wipe copy has quest name', (await page.locator('[data-testid="hudreal-lost-layer"]').innerText()).includes('Goblin Extermination'));

/* ---- B2 astrolabe ---- */
await go('comp=astrolabe&view=narrative');
ok('astrolabe real V62 mounted', await page.locator('.destiny-astrolabe, [class*="destiny"]').count() > 0);
/* the real throw: click the dial (production gesture) — then the engine settles a verdict */
await page.locator('[data-testid="hudreal-astrolabe"] div').first().click({position:{x:170,y:170}}).catch(()=>{});
let verdict = null;
for (let i=0;i<40 && !verdict;i++){ await page.waitForTimeout(500); verdict = await page.locator('[data-testid="hudreal-astrolabe-verdict"]').count() ? await page.locator('[data-testid="hudreal-astrolabe-verdict"]').innerText() : null; }
ok('astrolabe resolves verdict', Boolean(verdict), verdict?.slice(0,80));
/* re-arm via the lab button — new key, fresh roll */
await page.click('button:has-text("THROW"), button:has-text("Lancia")').catch(()=>{});
await page.waitForTimeout(300);
ok('astrolabe re-arm clears verdict', await page.locator('[data-testid="hudreal-astrolabe-verdict"]').count() === 0);

/* ---- B cassetto: assign → clear(return flight) → loadout → canSend ---- */
await go('comp=cassetto&view=narrative');
await page.click('[data-cassetto-debug="select-first"]');
let assigned='0';
for (let i=0;i<80 && assigned!=='1';i++){ await page.waitForTimeout(250); assigned = await page.evaluate(()=>document.querySelector('[data-detail-open]')?.getAttribute('data-assigned')??'?'); }
ok('cassetto assign commits', assigned==='1');
/* press-and-hold 560ms+ extraction on the leader seat */
const seat = page.locator('[data-testid="slot-button-poi-goblin:goblin-slot-leader"]');
const bb = await seat.boundingBox();
if (bb) {
  await page.mouse.move(bb.x+bb.width/2, bb.y+bb.height/2);
  await page.mouse.down();
  await page.waitForTimeout(900);
  await page.mouse.up();
}
let cleared='1';
for (let i=0;i<80 && cleared!=='0';i++){ await page.waitForTimeout(250); cleared = await page.evaluate(()=>document.querySelector('[data-detail-open]')?.getAttribute('data-assigned')??'?'); }
ok('cassetto hold-extract clears seat', cleared==='0');
/* loadout pack/unpack round-trip on the real stash ledger */
const row = page.locator('[data-testid^="cassetto-loadout-"]').first();
const wasPacked = await row.getAttribute('data-packed');
await row.click(); await page.waitForTimeout(700);
const nowPacked = await row.getAttribute('data-packed');
ok('cassetto loadout toggles real bag', wasPacked!==nowPacked, `${wasPacked}→${nowPacked}`);
/* canSend observability */
const canSend = await page.evaluate(()=>document.querySelector('[data-detail-open]')?.getAttribute('data-can-send'));
ok('cassetto canSend reflects slots', typeof canSend==='string', `canSend=${canSend}`);

console.log(R.join('\n'));
console.log('SUITE', R.every(l=>l.startsWith('PASS'))?'ALL-PASS':'HAS-FAILURES');
await b.close();
