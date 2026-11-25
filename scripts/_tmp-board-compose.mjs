import { chromium } from 'playwright';
import fs from 'node:fs';
const OUT = process.argv[2] ?? '.mw/runs/20261124-hud-critique-multi-ai/variants2';
const NAMES = {
  A:'sede ottone piena (attuale)',B:'pozzetto incassato',C:'smalto acceso',D:'anello ottone pieno',
  E:'tratteggio inciso',F:'alone luminoso',
  G:'pozzetto + anello ottone',H:'pozzetto + anello + alone',I:'pozzetto + cifra ingrandita',J:'anello ottone + alone (senza pozzetto)',
};
const ids = fs.readdirSync(OUT).filter((f) => /^v-[A-Z]\.png$/.test(f)).map((f) => f[2]).sort();
const cols = ids.length <= 4 ? 2 : 3;
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: cols * 1700, height: 2400 }, deviceScaleFactor: 1 });
const cell = (id) => {
  const full = fs.readFileSync(`${OUT}/v-${id}.png`).toString('base64');
  const det = fs.existsSync(`${OUT}/detail-${id}.png`) ? fs.readFileSync(`${OUT}/detail-${id}.png`).toString('base64') : full;
  return `<div class="cell"><div class="lbl">${id} — ${NAMES[id] ?? id}</div>
    <img class="ctx" src="data:image/png;base64,${full}" />
    <img class="det" src="data:image/png;base64,${det}" /></div>`;
};
const cells = ids.map(cell).join('');
await p.setContent(`<body style="margin:0;background:#081416;font-family:Georgia,serif">
<div style="display:grid;grid-template-columns:repeat(${cols},1fr);gap:18px;padding:22px">${cells}</div>
<style>
.cell{background:#0d2426;border:1px solid rgba(241,216,138,.35);border-radius:10px;padding:14px;text-align:center}
.lbl{color:#f1d88a;font-size:26px;font-style:italic;margin-bottom:10px}
.ctx{width:60%;display:block;margin:0 auto 10px;border-radius:5px}
.det{width:100%;display:block;border-radius:5px}
</style>`);
await p.locator('body > div').screenshot({ path: `${OUT}/board.png`, timeout: 90000 });
await b.close();
console.log('board ok', ids.join(','));
