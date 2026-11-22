import { chromium } from 'playwright';
const b = await chromium.launch({ args: ['--enable-unsafe-swiftshader'] });
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
await p.goto('http://localhost:5173/hud-compose?comp=cassetto&poi=poi-goblin&pcts=96,4&risk=3', { waitUntil: 'domcontentloaded', timeout: 60000 });
await p.waitForSelector('[data-cassetto-column]', { timeout: 45000 });
await p.waitForTimeout(2000);
const info = await p.evaluate(() => {
  const out = {};
  // what element is the green bar under the party labels (~y=415 abs)?
  const stack = document.elementsFromPoint(1180, 413).map((e) => `${e.tagName}.${e.className && typeof e.className === 'string' ? '.'+e.className.slice(0,40) : ''}[${e.getAttribute('data-hud-band-x')!==null?'hbx':''}${e.getAttribute('data-cassetto-party-scroll')!==null?'pscroll':''}${e.getAttribute('data-testid')??''}]`).slice(0,8);
  out.stack413 = stack;
  const band = document.querySelector('[data-hudreal-cassetto] [data-hud-band-x]');
  if (band) { const cs = getComputedStyle(band); const r = band.getBoundingClientRect(); out.bandX = { vis: cs.visibility, x: r.x, y: r.y, w: r.width, h: r.height }; }
  const scroller = document.querySelector('[data-cassetto-party-scroll]');
  if (scroller) { out.pScroller = { sw: scroller.scrollWidth, cw: scroller.clientWidth, r: scroller.getBoundingClientRect().toJSON() }; }
  // also children of the rack container
  const rack = document.querySelector('[data-cassetto-party-scroller]');
  if (rack) out.partyKids = Array.from(rack.querySelectorAll('*')).filter(e=>{const r=e.getBoundingClientRect(); return r.height<14 && r.width>100 && r.y>390 && r.y<430;}).map(e=>({tag:e.tagName,cls:String(e.className).slice(0,50),r:e.getBoundingClientRect().toJSON()}));
  // CTA label centering
  const cta = document.querySelector('[data-testid="cassetto-confirm"]');
  const txt = cta?.querySelector('.confirm-text');
  if (cta && txt) { const cr = cta.getBoundingClientRect(), tr = txt.getBoundingClientRect(); out.cta = { box: {x:cr.x,w:cr.width,cx:cr.x+cr.width/2}, text: {x:tr.x,w:tr.width,cx:tr.x+tr.width/2} }; }
  // content center
  const col = document.querySelector('[data-cassetto-column]');
  const party = document.querySelector('[data-block="party-slots"]');
  if (col && party) { out.centers = { col: col.getBoundingClientRect().x + col.getBoundingClientRect().width/2, party: party.getBoundingClientRect().x + party.getBoundingClientRect().width/2 }; }
  return out;
});
console.log(JSON.stringify(info, null, 1));
await b.close();
