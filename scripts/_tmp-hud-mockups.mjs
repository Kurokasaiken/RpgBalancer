/* Mockup delle modifiche HUD aperte (run 20261124-hud-critique-multi-ai):
 * ogni opzione è una manipolazione DOM/CSS sul /game vivo (headless, 1600×900,
 * dsf 2), catturata come crop e composta in una board 2×2 per tema.
 * Output: .mw/runs/20261124-hud-critique-multi-ai/mockups/ */
import { chromium } from 'playwright';
import fs from 'node:fs';

const OUT = '.mw/runs/20261124-hud-critique-multi-ai/mockups';
fs.mkdirSync(OUT, { recursive: true });

/* clip: rect CSS-pixel del frame 1600×900 — {x,y,w,h} o nome target {el,pad}. */
const TOPICS = [
  {
    id: 'busto',
    clip: { x: 0, y: 620, w: 400, h: 280 },
    options: [
      { id: 'B1', name: 'attuale', js: `null` },
      {
        id: 'B2', name: 'alone oro (affordance)',
        js: `(() => {
          const b = document.querySelector('[data-hr-voce-bust]');
          const img = b.querySelector('img');
          img.style.filter = 'drop-shadow(0 0 10px rgba(240,201,135,.75)) drop-shadow(0 0 3px rgba(20,12,4,.9))';
          const chip = document.createElement('div');
          chip.setAttribute('data-mock','');
          Object.assign(chip.style, { position:'fixed', zIndex:60, left:'118px', top:'818px', width:'26px', height:'26px', borderRadius:'50%',
            background:'radial-gradient(circle at 42% 32%, #f6e3a4, #8a6a2a 82%)', boxShadow:'0 0 0 1.5px rgba(20,12,4,.85), 0 0 8px rgba(240,201,135,.6)',
            display:'flex', alignItems:'center', justifyContent:'center', color:'#241a08', font:'700 14px Georgia', pointerEvents:'none' });
          chip.textContent = '↻';
          document.body.appendChild(chip);
          return true; })()`,
      },
      {
        id: 'B3', probe: `(document.querySelector('[data-hr-voce-bust]')?.getBoundingClientRect().width ?? 0) > 50 && document.querySelector('[data-mock]') !== null`, name: 'placca smalto+ottone',
        js: `(() => {
          const v = document.querySelector('[data-hr-voce-bust]');
          const pl = document.createElement('div');
          pl.setAttribute('data-mock','');
          Object.assign(pl.style, { position:'absolute', zIndex:-1, left:'-16px', top:'-16px', right:'-16px', bottom:'-16px', pointerEvents:'none',
            borderRadius:'18px', border:'1.5px solid #b8933f',
            background:'linear-gradient(180deg, #12524b, #08302c 85%)',
            boxShadow:'inset 0 0 0 2px rgba(6,26,24,.9), inset 0 0 12px rgba(0,0,0,.45), 0 0 0 2px rgba(20,12,4,.6), 0 6px 14px rgba(0,0,0,.5)' });
          v.style.position = 'relative'; v.style.isolation = 'isolate';
          v.appendChild(pl);
          return true; })()`,
      },
      {
        id: 'B4', name: 'attenuato (dim)',
        js: `(() => {
          const v = document.querySelector('[data-hudreal-voce]');
          v.style.filter = 'brightness(.72) saturate(.7)';
          return true; })()`,
      },
    ],
  },
  {
    id: 'astrolabio',
    clip: { x: 620, y: 720, w: 360, h: 180 },
    options: [
      { id: 'A1', name: 'attuale', js: `null` },
      {
        id: 'A2', name: 'etichetta «Ricentra»',
        js: `(() => {
          const btn = document.querySelector('[data-hr-nav="recenter"]');
          const r = btn.getBoundingClientRect();
          const l = document.createElement('div');
          l.setAttribute('data-mock','');
          Object.assign(l.style, { position:'fixed', zIndex:60, left:(r.x+r.width/2)+'px', top:(r.bottom-6)+'px', transform:'translateX(-50%)',
            font:'italic 700 11px Cardo, Georgia', letterSpacing:'1px', color:'#f6e3a4', textShadow:'0 1px 2px rgba(3,26,30,.95), 0 0 6px rgba(3,26,30,.9)', pointerEvents:'none' });
          l.textContent = 'RICENTRA';
          document.body.appendChild(l);
          return true; })()`,
      },
      {
        id: 'A3', name: 'anello marcato',
        js: `(() => {
          const btn = document.querySelector('[data-hr-nav="recenter"]');
          btn.style.boxShadow = '0 0 0 3px #b8933f, 0 0 0 4px rgba(20,12,4,.7), 0 0 14px 3px rgba(240,201,135,.5)';
          btn.style.borderRadius = '50%';
          return true; })()`,
      },
      {
        id: 'A4', name: 'etichetta + anello',
        js: `(() => {
          const btn = document.querySelector('[data-hr-nav="recenter"]');
          btn.style.boxShadow = '0 0 0 3px #b8933f, 0 0 0 4px rgba(20,12,4,.7), 0 0 14px 3px rgba(240,201,135,.5)';
          btn.style.borderRadius = '50%';
          const r = btn.getBoundingClientRect();
          const l = document.createElement('div');
          l.setAttribute('data-mock','');
          Object.assign(l.style, { position:'fixed', zIndex:60, left:(r.x+r.width/2)+'px', top:(r.bottom-6)+'px', transform:'translateX(-50%)',
            font:'italic 700 11px Cardo, Georgia', letterSpacing:'1px', color:'#f6e3a4', textShadow:'0 1px 2px rgba(3,26,30,.95), 0 0 6px rgba(3,26,30,.9)', pointerEvents:'none' });
          l.textContent = 'RICENTRA';
          document.body.appendChild(l);
          return true; })()`,
      },
    ],
  },
  {
    id: 'nav',
    clip: { x: 520, y: 730, w: 560, h: 170 },
    options: [
      { id: 'N1', name: '100% (attuale)', js: `null` },
      {
        id: 'N2', name: '85%',
        js: `(() => { const n = document.querySelector('[data-hudreal-nav]') || document.querySelector('nav');
          const w = n.parentElement; w.style.transform = 'scale(.85)'; w.style.transformOrigin = 'bottom center'; return true; })()`,
      },
      {
        id: 'N3', name: '75%',
        js: `(() => { const n = document.querySelector('[data-hudreal-nav]') || document.querySelector('nav');
          const w = n.parentElement; w.style.transform = 'scale(.75)'; w.style.transformOrigin = 'bottom center'; return true; })()`,
      },
      {
        id: 'N4', name: '85% + pulsanti dim',
        js: `(() => { const n = document.querySelector('[data-hudreal-nav]') || document.querySelector('nav');
          const w = n.parentElement; w.style.transform = 'scale(.85)'; w.style.transformOrigin = 'bottom center';
          n.style.filter = 'brightness(.85)'; return true; })()`,
      },
    ],
  },
  {
    id: 'capsula',
    clip: { x: 1360, y: 770, w: 240, h: 130 },
    options: [
      { id: 'C1', name: 'attuale (dischi separati)', js: `null` },
      {
        id: 'C2', name: 'pill smalto condivisa',
        js: `(() => {
          const c = document.querySelector('[data-hud-corner]');
          const pl = document.createElement('div');
          pl.setAttribute('data-mock','');
          Object.assign(pl.style, { position:'absolute', zIndex:0, left:'-14px', top:'-8px', right:'-14px', bottom:'-8px', pointerEvents:'none',
            borderRadius:'30px', border:'1.5px solid #b8933f',
            background:'linear-gradient(180deg, #12524b, #08302c 85%)',
            boxShadow:'inset 0 0 0 2px rgba(6,26,24,.9), inset 0 0 12px rgba(0,0,0,.45), 0 0 0 2px rgba(20,12,4,.6), 0 6px 14px rgba(0,0,0,.5)' });
          c.style.position = 'relative';
          c.querySelectorAll('button').forEach((b) => { b.style.position = 'relative'; b.style.zIndex = '2'; });
          c.appendChild(pl);
          return true; })()`,
      },
      {
        id: 'C3', name: 'lastra rettangolare',
        js: `(() => {
          const c = document.querySelector('[data-hud-corner]');
          const r = c.getBoundingClientRect();
          const pl = document.createElement('div');
          pl.setAttribute('data-mock','');
          Object.assign(pl.style, { position:'absolute', zIndex:0, left:'-16px', top:'-10px', right:'-16px', bottom:'-10px', pointerEvents:'none',
            borderRadius:'10px', border:'1.5px solid #b8933f',
            background:'linear-gradient(180deg, #14605a, #0a3a36 85%)',
            boxShadow:'inset 0 0 0 2px rgba(6,26,24,.9), inset 0 0 12px rgba(0,0,0,.45), 0 0 0 2px rgba(20,12,4,.6), 0 6px 14px rgba(0,0,0,.5)' });
          c.style.position = 'relative';
          c.querySelectorAll('button').forEach((b) => { b.style.position = 'relative'; b.style.zIndex = '2'; });
          c.appendChild(pl);
          return true; })()`,
      },
      {
        id: 'C4', name: 'dischi dentro pozzetti',
        js: `(() => {
          const c = document.querySelector('[data-hud-corner]');
          c.querySelectorAll('button').forEach((b) => {
            b.style.boxShadow = 'inset 0 2px 5px rgba(0,0,0,.8), inset 0 0 0 1.5px rgba(241,216,138,.9), 0 0 0 2.5px #b8933f, 0 0 0 3.5px rgba(20,12,4,.7)';
          });
          const pl = document.createElement('div');
          pl.setAttribute('data-mock','');
          Object.assign(pl.style, { position:'absolute', zIndex:0, left:'-14px', top:'-8px', right:'-14px', bottom:'-8px', pointerEvents:'none',
            borderRadius:'30px', border:'1.5px solid #b8933f',
            background:'linear-gradient(180deg, #12524b, #08302c 85%)',
            boxShadow:'inset 0 0 0 2px rgba(6,26,24,.9), 0 0 0 2px rgba(20,12,4,.6)' });
          c.style.position = 'relative';
          c.querySelectorAll('button').forEach((b) => { b.style.position = 'relative'; b.style.zIndex = '2'; });
          c.appendChild(pl);
          return true; })()`,
      },
    ],
  },
  {
    id: 'gerarchia',
    clip: { x: 0, y: 0, w: 1600, h: 900 },
    options: [
      { id: 'H1', name: 'piatta (attuale)', js: `null` },
      {
        id: 'H2', name: 'secondario dim .78',
        js: `(() => {
          for (const s of ['[data-hudreal-voce]', '[data-hud-corner]']) { const e = document.querySelector(s); if (e) e.style.filter = 'brightness(.78)'; }
          const a = document.querySelector('[data-hr-nav="recenter"]'); if (a) a.style.filter = 'brightness(.78)';
          return true; })()`,
      },
      {
        id: 'H3', name: 'secondario dim .6',
        js: `(() => {
          for (const s of ['[data-hudreal-voce]', '[data-hud-corner]']) { const e = document.querySelector(s); if (e) e.style.filter = 'brightness(.6)'; }
          const a = document.querySelector('[data-hr-nav="recenter"]'); if (a) a.style.filter = 'brightness(.6)';
          return true; })()`,
      },
      {
        id: 'H4', name: 'dim + desatura',
        js: `(() => {
          for (const s of ['[data-hudreal-voce]', '[data-hud-corner]']) { const e = document.querySelector(s); if (e) e.style.filter = 'brightness(.72) saturate(.7)'; }
          const a = document.querySelector('[data-hr-nav="recenter"]'); if (a) a.style.filter = 'brightness(.72) saturate(.7)';
          return true; })()`,
      },
    ],
  },
];

const b = await chromium.launch({ args: ['--enable-unsafe-swiftshader'] });
const p = await b.newPage({ viewport: { width: 1600, height: 900 }, deviceScaleFactor: 2 });
p.on('pageerror', (e) => console.log('[pageerror]', String(e).slice(0, 200)));
await p.goto('http://localhost:5173/game', { waitUntil: 'domcontentloaded', timeout: 45000 });
await p.waitForSelector('canvas', { timeout: 120000 });
await p.waitForSelector('[data-hudreal-voce]', { timeout: 120000 });
await p.waitForTimeout(2000);
/* Boot overlay opaco ma DOM già montato: lo nascondiamo e catturiamo il chrome
 *  reale sotto (il mondo può essere ancora in caricamento — il giudizio è sul
 *  chrome, non sulla mappa). */
await p.evaluate(() => { const e = document.querySelector('[data-boot-phase]'); if (e) e.style.display = 'none'; });
await p.waitForTimeout(800);

/* Salva gli stili originali dei target per il reset tra opzioni. */
await p.evaluate(() => {
  document.querySelectorAll('[data-hudreal-voce],[data-hr-voce-bust],[data-hudreal-nav],[data-hr-nav="recenter"],[data-hud-corner],[data-hud-corner] button,[data-hudreal-voce] img')
    .forEach((el) => el.setAttribute('data-orig-style', el.getAttribute('style') ?? ''));
});
const reset = `(() => {
  document.querySelectorAll('[data-mock]').forEach((m) => m.remove());
  document.querySelectorAll('[data-orig-style]').forEach((el) => el.setAttribute('style', el.getAttribute('data-orig-style')));
  const nav = document.querySelector('[data-hudreal-nav]') || document.querySelector('nav');
  if (nav && nav.parentElement) { nav.parentElement.style.transform = ''; }
  return true; })()`;

const boards = {};
for (const topic of TOPICS) {
  const cells = [];
  for (const opt of topic.options) {
    const file = `${OUT}/${topic.id}-${opt.id}.png`;
    if (fs.existsSync(file)) { cells.push({ id: opt.id, name: opt.name, file }); console.log('skip', `${topic.id}-${opt.id}`); continue; }
    /* HMR della sessione parallela può smontare il chrome tra apply e shot:
     * riapplica finché il probe non conferma che il mock è ancora montato. */
    for (let r = 0; r < 8; r++) {
      await p.evaluate(reset);
      if (opt.js !== 'null') await p.evaluate(opt.js);
      await p.waitForTimeout(220);
      const probe = opt.probe ? await p.evaluate(`(${opt.probe})`) : true;
      if (probe) break;
      if (r === 7) console.log('probe-fail', `${topic.id}-${opt.id}`);
      await p.waitForTimeout(700);
    }
    let shotOk = false;
    for (let att = 0; att < 5 && !shotOk; att++) {
      try { await p.screenshot({ path: file, clip: { x: topic.clip.x, y: topic.clip.y, width: topic.clip.w, height: topic.clip.h }, timeout: 90000 }); } catch (e) { await p.waitForTimeout(1500); continue; }
      const post = opt.probe ? await p.evaluate(`(${opt.probe})`) : true;
      if (post) shotOk = true;
      else { fs.unlinkSync(file); await p.evaluate(reset); if (opt.js !== 'null') await p.evaluate(opt.js); await p.waitForTimeout(700); console.log('resample', `${topic.id}-${opt.id}`); }
    }
    cells.push({ id: opt.id, name: opt.name, file });
    console.log('saved', `${topic.id}-${opt.id}`);
  }
  boards[topic.id] = cells;
}

/* Board 2×2 per tema su pagina separata: la live page può navigare sotto HMR
 *  mentre compone → setContent perderebbe il contesto. */
const bp = await b.newPage({ viewport: { width: 1600, height: 900 }, deviceScaleFactor: 2 });
for (const [tid, cells] of Object.entries(boards)) {
  const html = cells.map((c) => `
    <div class="cell"><div class="lbl">${c.id} — ${c.name}</div>
    <img src="data:image/png;base64,${fs.readFileSync(c.file).toString('base64')}" /></div>`).join('');
  await bp.setContent(`<body style="margin:0;background:#081416;font-family:Georgia,serif">
    <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:18px;padding:22px">${html}</div>
    <style>.cell{background:#0d2426;border:1px solid rgba(241,216,138,.35);border-radius:10px;padding:12px;text-align:center}
    .lbl{color:#f1d88a;font-size:22px;font-style:italic;margin-bottom:8px}
    .cell img{width:100%;display:block;border-radius:6px}</style>`);
  await bp.locator('body > div').screenshot({ path: `${OUT}/board-${tid}.png`, timeout: 90000 });
  console.log('board', tid);
}
await b.close();
console.log('done →', OUT);
