/* Varianti per lo stato "velocità ingaggiata" del radiogroup data-ctl della
 * time bar — catturate sul DOM vivo di /game (dev server 5173, headless).
 * Output: .mw/runs/20261124-hud-critique-multi-ai/variants/v-*.png + board.png */
import { chromium } from 'playwright';
import fs from 'node:fs';

const OUT = '.mw/runs/20261124-hud-critique-multi-ai/variants2';
fs.mkdirSync(OUT, { recursive: true });

/* Ogni variante: style props applicate al bottone ingaggiato + marker opzionale
 * (elemento figlio, per la barra-sotto). Le prop non elencate restano quelle
 * di default della pill (posizione, raggio, font). */
const VARIANTS = [
  {
    id: 'G', name: 'pozzetto + anello ottone',
    style: {
      background: 'radial-gradient(circle at 50% 55%, #0c2b28, #051614 78%)',
      boxShadow: 'inset 0 2px 5px rgba(0,0,0,.8), inset 0 0 0 1.5px rgba(241,216,138,.9), 0 0 0 2.5px #b8933f, 0 0 0 3.5px rgba(20,12,4,.7)',
      color: '#f6e3a4',
      textShadow: '0 0 6px rgba(240,201,135,.6)',
    },
  },
  {
    id: 'H', name: 'pozzetto + anello + alone',
    style: {
      background: 'radial-gradient(circle at 50% 55%, #0c2b28, #051614 78%)',
      boxShadow: 'inset 0 2px 5px rgba(0,0,0,.8), inset 0 0 0 1.5px rgba(241,216,138,.9), 0 0 0 2.5px #b8933f, 0 0 14px 3px rgba(240,201,135,.55)',
      color: '#f6e3a4',
      textShadow: '0 0 6px rgba(240,201,135,.6)',
    },
  },
  {
    id: 'I', name: 'pozzetto + cifra ingrandita',
    style: {
      background: 'radial-gradient(circle at 50% 55%, #0c2b28, #051614 78%)',
      boxShadow: 'inset 0 2px 5px rgba(0,0,0,.8), inset 0 0 0 1.5px rgba(241,216,138,.9), 0 1px 0 rgba(255,244,200,.15)',
      color: '#f6e3a4',
      textShadow: '0 0 8px rgba(240,201,135,.8)',
      fontSize: '18px',
    },
  },
  {
    id: 'J', name: 'anello ottone + alone (senza pozzetto)',
    style: {
      background: 'none',
      boxShadow: '0 0 0 3px #b8933f, 0 0 0 4px rgba(20,12,4,.7), 0 0 12px 2px rgba(240,201,135,.5)',
      color: '#f6e3a4',
      textShadow: '0 0 6px rgba(240,201,135,.6)',
    },
  },
];

const b = await chromium.launch({ args: ['--enable-unsafe-swiftshader'] });
const p = await b.newPage({ viewport: { width: 1600, height: 900 }, deviceScaleFactor: 2 });
p.on('pageerror', (e) => console.log('[pageerror]', String(e).slice(0, 300)));
await p.goto('http://localhost:5173/game', { waitUntil: 'domcontentloaded', timeout: 45000 });
await p.waitForSelector('[data-hr-time="x4"]', { timeout: 120000 });
await p.waitForSelector('canvas', { timeout: 120000 });
try {
  await p.waitForSelector('[data-boot-phase]', { state: 'detached', timeout: 180000 });
} catch {
  console.log('[warn] boot screen ancora presente dopo 180s — procedo comunque');
}
await p.waitForTimeout(1200);
await p.evaluate(() => document.querySelector('[data-hr-time="x4"]').click());
await p.waitForTimeout(300);

// Stile originale di ogni pill, per resettare tra le varianti.
await p.evaluate(() => {
  document.querySelectorAll('[data-hr-time]').forEach((btn) => {
    btn.setAttribute('data-orig-style', btn.getAttribute('style') ?? '');
  });
});

/* Clip stretto sui socket velocità: include il pulsante pausa a sx e un tratto
 * di banda + il terminale a dx — la pill si giudica in scala leggibile. */
const r = await p.evaluate(() => document.querySelector('[role="radiogroup"]').getBoundingClientRect().toJSON());
const clip = { x: Math.max(0, r.x - 55), y: Math.max(0, r.y - 26), width: r.width + 150, height: 68 };

for (const v of VARIANTS) {
  if (fs.existsSync(`${OUT}/v-${v.id}.png`)) { console.log('skip', v.id); continue; }
  await p.evaluate(({ style, marker }) => {
    document.querySelectorAll('[data-hr-time]').forEach((btn) => {
      btn.setAttribute('style', btn.getAttribute('data-orig-style'));
      btn.querySelectorAll('[data-marker]').forEach((m) => m.remove());
    });
    const on = document.querySelector('[data-hr-time="x4"]');
    Object.assign(on.style, style);
    if (marker) {
      const m = document.createElement('span');
      m.setAttribute('data-marker', '');
      Object.assign(m.style, marker);
      on.appendChild(m);
    }
  }, v);
  await p.waitForTimeout(150);
  for (let att = 0; att < 3; att++) {
    try { await p.screenshot({ path: `${OUT}/v-${v.id}.png`, clip, timeout: 90000 }); break; }
    catch (e) { if (att === 2) throw e; console.log('retry screenshot', v.id); await p.waitForTimeout(1500); }
  }
  console.log('saved', v.id, v.name);
}

// Ripristina ×1 (setContent sotto rimpiazza il DOM, quindi prima).
await p.evaluate(() => document.querySelector('[data-hr-time="x1"]')?.click()).catch(() => {});

// Griglia 3×3 con label sopra ogni cella (regola comparison boards).
const imgs = VARIANTS.map((v) => ({
  ...v,
  b64: fs.readFileSync(`${OUT}/v-${v.id}.png`).toString('base64'),
}));
const cells = imgs.map((v) => `
  <div class="cell">
    <div class="lbl">${v.id} — ${v.name}</div>
    <img src="data:image/png;base64,${v.b64}" />
  </div>`).join('');
const empty = '<div class="cell empty"></div>'.repeat(Math.max(0, 9 - imgs.length));
await p.setContent(`<body style="margin:0;background:#081416;font-family:Georgia,serif">
  <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:18px;padding:22px">
    ${cells}${empty}
  </div>
  <style>
    .cell{background:#0d2426;border:1px solid rgba(241,216,138,.35);border-radius:10px;padding:12px;text-align:center}
    .lbl{color:#f1d88a;font-size:20px;font-style:italic;margin-bottom:10px;letter-spacing:.4px}
    .cell img{width:100%;display:block;border-radius:6px}
    .empty{background:transparent;border:1px dashed rgba(241,216,138,.15)}
  </style>`);
const grid = await p.locator('body > div');
await grid.screenshot({ path: `${OUT}/board.png`, timeout: 90000 });
console.log('board saved →', `${OUT}/board.png`);
await b.close();
