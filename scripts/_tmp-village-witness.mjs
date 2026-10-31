import { chromium } from 'playwright';
const OUT = '/Users/faustoboni/progetti_personali/RPG/test-results/village-witness-2026-10-30';
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
await p.goto('http://localhost:5173/mappa2-lab', { waitUntil: 'domcontentloaded', timeout: 60000 });
await p.waitForFunction(() => window.__worldCam && window.__worldCamCtl, { timeout: 60000 });
await p.waitForTimeout(2500);
// Centre the village zone (1450,520 300x260 → centre 1600,650) at zoom ~1.6
await p.evaluate(() => {
  const zoom = 1.6;
  window.__worldCamCtl.set({ panX: 1600 - 720 / zoom, panY: 650 - 450 / zoom, zoom });
});
await p.waitForTimeout(800);
// open village tab
await p.click('button:has-text("village")').catch(() => {});
await p.waitForTimeout(400);
await p.screenshot({ path: `${OUT}/01-zone-context.png` });
// stage 0 = nessuna casa
await p.click('button:has-text("nessuna casa")').catch((e) => console.log('stage0 click', e.message.slice(0, 80)));
await p.waitForTimeout(600);
await p.screenshot({ path: `${OUT}/02-stage0-bare.png` });
// stage 1 = 7 casette
await p.click('button:has-text("7 casette")').catch((e) => console.log('stage1 click', e.message.slice(0, 80)));
await p.waitForTimeout(600);
await p.screenshot({ path: `${OUT}/03-stage1-houses.png` });
// + palizzata
await p.click('button:has-text("palizzata")').catch(() => {});
await p.waitForTimeout(500);
await p.screenshot({ path: `${OUT}/04-palizzata.png` });
// + torri legno
await p.click('button:has-text("torre-legno-1")').catch(() => {});
await p.click('button:has-text("torre-legno-2")').catch(() => {});
await p.waitForTimeout(500);
await p.screenshot({ path: `${OUT}/05-palizzata-torri.png` });
// switch to muro + torri pietra
await p.click('button:has-text("muro")').catch(() => {});
await p.click('button:has-text("torre-pietra-1")').catch(() => {});
await p.click('button:has-text("torre-pietra-2")').catch(() => {});
await p.waitForTimeout(500);
await p.screenshot({ path: `${OUT}/06-muro-torri-pietra.png` });
// zoom out a bit for context
await p.evaluate(() => {
  const zoom = 1.0;
  window.__worldCamCtl.set({ panX: 1600 - 720 / zoom, panY: 650 - 450 / zoom, zoom });
});
await p.waitForTimeout(600);
await p.screenshot({ path: `${OUT}/07-context-zoom1.png` });
await b.close();
console.log('done');
