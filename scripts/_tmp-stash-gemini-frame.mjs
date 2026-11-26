import { chromium } from 'playwright';
import fs from 'node:fs';
const URL_ARG = 'https://www.google.com/search?q=hey&oq=hey&gs_lcrp=EgZjaHJvbWUyBggAEEUYOTIKCAEQLhixAxiABDITCAIQLhiDARjHARixAxjRAxiABDIHCAMQABiABDINCAQQABiDARixAxiABDIHCAUQABiABDIHCAYQABiABDIHCAcQABiABDINCAgQLhjHARjRAxiABNIBCDIyMjZqMGo3qAIAsAIA&sourceid=chrome&source=chrome.ob&ie=UTF-8&mstk=AUtExfB5FgTZIlaIchwZLoeHr-qZXw5_EJ6izNRi45EPbDDDKjakJ5S-7D3qUcM1n27qU9CYspmnhqWCqg9xi4lAh_Sl8jWwCI_i7KPB8ifJ5AXZS0lGN8wPNPSPQemV4LMT8oGWOU5eltxR00vVWyOAcbt_GlL6Ik4ykmL8wRTZFvWP4LBp9A5iKm3897HRvUsWEhbyFt8lOTSySM69w9M_EIeaBk4rrLKs0EmmPPSNZ7e0aBXzY0iT0AyPE_OT9MmHQgHSTTzsKkaRKKkX_w56CHijqbNy1nXKh5ZfDg5UZW5yt_RFpfAgPB1KEmyz24EwkrpuBAVcUXGZ7g&csuir=1&aioh=3&mtid=lx4Ia6SKNt_ri-gP1oa2qAI&lns_mode=cvst&udm=50#aof=1&sv=CB8SNwoYYWltLWltZy0xM2M2MDVjZS13cmFwcGVyEAAaBllBWnpJYiIRI2FpbS1pbWctMTNjNjA1Y2UYQyCi7-jzDFICCAQ';
const DL = '/Users/faustoboni/progetti_personali/RPG/.mw/runs/stash-frame-slice/dl';
const SEND = process.argv[2] === 'send';
const PROMPT = `Rigenera la cornice intera su fucsia che mi hai fatto prima (quella quadrata con le viti spinose, le gemme tonde smeraldo agli angoli e le gemme a rombo a meta' dei lati), IDENTICA nel disegno, nella forma e nelle proporzioni, con questi soli cambi:
- risoluzione piu' alta, dettagli nitidi;
- oro champagne chiaro e luminoso, circa #D1C48B, luci color crema, non bronzeo, non arancione, non verdastro;
- lo spessore del bordo e' lo stesso su tutti e quattro i lati;
- interno della cornice vuoto, dello stesso fucsia uniforme dello sfondo esterno;
- sfondo fucsia uniforme ovunque, nessuna ombra esterna, nessun testo.
Una sola immagine con una sola cornice.`;
const PROMPT_UNUSED = `Cambio approccio: i pezzi separati non combaciano tra loro. Genera invece UNA SOLA cornice intera, in un'unica immagine, nello stile del componente allegato all'inizio:
- forma: rettangolo orizzontale, larghezza circa 1,38 volte l'altezza, angoli interni arrotondati;
- i 4 angoli con le viti intrecciate, le spine e le gemme tonde smeraldo, come nell'originale, ma compatti (ognuno occupa al massimo il 18% della larghezza);
- a meta' di ogni lato una gemma smeraldo a rombo con piccole viti ai lati;
- tra ogni angolo e la gemma centrale il lato e' un TRATTO LUNGO DI FILO LISCIO: doppio filo oro con una linea verde scura al centro, perfettamente dritto e uniforme, SENZA viti, spine o decorazioni, cosi' che si possa ripetere;
- lo spessore del filo e' identico su tutti e quattro i lati e uguale al braccio degli angoli;
- oro champagne chiaro e luminoso, circa #D1C48B, luci color crema, non bronzeo, non arancione, non verdastro;
- interno della cornice VUOTO e dello stesso fucsia uniforme dello sfondo esterno;
- sfondo fucsia uniforme ovunque, nessuna ombra esterna, nessun testo.
Una sola immagine con una sola cornice.`;
const b = await chromium.connectOverCDP('http://localhost:9222', { timeout: 60000 });
const bs = await b.newBrowserCDPSession();
await bs.send('Browser.setDownloadBehavior', { behavior: 'allow', downloadPath: DL, eventsEnabled: true });
const ctx = b.contexts()[0];
const before = new Set(ctx.pages());
await bs.send('Target.createTarget', { url: URL_ARG, background: true });
let page = null;
for (let i = 0; i < 40 && !page; i++) {
  await new Promise((r) => setTimeout(r, 1000));
  for (const p of ctx.pages()) if (!before.has(p) && /google\.com/.test(p.url())) page = p;
}
await page.setViewportSize({ width: 2600, height: 1600 });
await page.waitForTimeout(14000);
await page.keyboard.press('Escape').catch(() => {});
const count = async () => page.evaluate(() => document.querySelectorAll('[aria-label*="Scarica questa immagine"]').length);
const n0 = await count();
console.log('download buttons before', n0);
if (SEND) {
  const ta = page.locator('textarea[aria-label="Chiedi qualsiasi cosa"]').first();
  await ta.click({ timeout: 15000 });
  await ta.fill(PROMPT);
  await page.keyboard.press('Enter');
  console.log('sent');
  let n1 = n0;
  for (let i = 0; i < 70; i++) { await page.waitForTimeout(3000); n1 = await count(); if (n1 > n0) break; }
  console.log('download buttons after', n1);
  await page.waitForTimeout(8000);
}
const files0 = new Set(fs.readdirSync(DL));
await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
await page.waitForTimeout(2000);
const dl = page.locator('[aria-label*="Scarica questa immagine"]');
const n = await dl.count();
for (let attempt = 0; attempt < 3; attempt++) {
  for (let k = n - 1; k >= 0; k--) {
    const el = dl.nth(k);
    if (await el.isVisible().catch(() => false)) { await el.click({ timeout: 8000 }).catch(() => {}); console.log('clicked', k); break; }
  }
  await page.waitForTimeout(6000);
  const added = fs.readdirSync(DL).filter((f) => !files0.has(f));
  if (added.length) { console.log('downloaded', added.join(',')); break; }
}
await page.close().catch(() => {});
await b.close();
