/**
 * skill-check-v15 — LA STELLA COPRE LA TRAMA. Desiderata v15, PLAN-009 T-001/T-008.
 *
 *     la stella = il personaggio   la trama = la difficolta
 *     la prova  = quanto resta scoperto
 *
 * La pagina NON calcola probabilita': le misura con `measureCoverage` e le
 * stampa. Se il numero a schermo non coincide con il disegno, e' il disegno che
 * ha torto — ed e' per questo che il pannello mostra la copertura misurata
 * accanto ai controlli, invece di una percentuale scritta a mano.
 *
 * T-001: la trama e' `rCheckAt`, che oggi e' un muro INVISIBILE. Qui viene
 * disegnata con gli idiomi della tela (`drawWeb`), che sono l'unica materia che
 * il progetto sa animare — il catrame no, ed e' il vincolo che ha deciso la v15.
 */
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { buildSnapshot, DEFAULT_CHECK_CONFIG, AXES, rOf, rWallAt, R } from '@/ui/skillCheckWebV1/zones';
import { measureCoverage, rHeroAt, shouldRoll } from '@/ui/skillCheckWebV1/coverage';
import { drawWeb, WEB_DEFAULTS } from '@/ui/skillCheckWebV1/adversaryShapes';

const TAU = Math.PI * 2;
const SIZE = 760;
const K = (SIZE / 2 - 28) / R;

/* la stella e' il PERSONAGGIO: nessun colore "della vittoria", e' il suo colore */
const INK = {
  silk: 'rgba(214,238,246,0.95)',
  silkDim: 'rgba(150,206,222,0.72)',
  frame: 'rgba(236,250,254,1.00)',
  shade: 'rgba(6,14,22,0.88)',
  ward: 'rgba(252,250,244,1)',
  wardGlow: 'rgba(104,198,186,1)',
  wardCool: 'rgba(88,200,210,1)',
  wardWarm: 'rgba(255,212,138,1)',
};

export default function SkillCheckV15Page(): JSX.Element {
  const cv = useRef<HTMLCanvasElement | null>(null);
  const [stats, setStats] = useState<number[]>([70, 55, 62, 30, 66]);
  const [diffs, setDiffs] = useState<number[]>([50, 50, 50, 50, 50]);
  const [painted, setPainted] = useState(false);   // trama dipinta o di solo filo
  const [bg, setBg] = useState<HTMLImageElement | null>(null);

  const snap = useMemo(
    () => buildSnapshot({ stats, diffs }, DEFAULT_CHECK_CONFIG, 0),
    [stats, diffs],
  );
  const cov = useMemo(() => measureCoverage(snap), [snap]);

  useEffect(() => {
    const img = new Image();
    img.onload = () => setBg(img);
    img.src = '/assets/ui/bg.png';
  }, []);

  useEffect(() => {
    const c = cv.current;
    if (!c) return;
    const ctx = c.getContext('2d');
    if (!ctx) return;
    const CX = SIZE / 2, CY = SIZE / 2;
    ctx.clearRect(0, 0, SIZE, SIZE);
    ctx.fillStyle = '#0a0f12';
    ctx.fillRect(0, 0, SIZE, SIZE);

    const tramaAt = (a: number) => rWallAt(snap, a) * K;
    const heroAt = (a: number) => rHeroAt(snap.axisTip, a) * K;
    const pathOf = (f: (a: number) => number) => {
      ctx.beginPath();
      for (let i = 0; i <= 1440; i += 1) {
        const a = (i / 1440) * TAU;
        const r = f(a);
        const x = CX + Math.cos(a) * r, y = CY + Math.sin(a) * r;
        if (i) ctx.lineTo(x, y); else ctx.moveTo(x, y);
      }
      ctx.closePath();
    };

    /* ── 1. LA TRAMA = LA DIFFICOLTA. Il muro invisibile, reso visibile. ── */
    ctx.save();
    pathOf(tramaAt);
    ctx.clip();
    if (painted && bg) {
      /* la trama dipinta: e' il goo che non sappiamo animare, quindi qui la
         pittura sta FERMA e il movimento lo portano i fili sopra */
      ctx.filter = 'grayscale(1) brightness(.30) contrast(1.3)';
      ctx.drawImage(bg, CX - SIZE / 2, CY - SIZE / 2, SIZE, SIZE);
      ctx.filter = 'none';
    } else {
      ctx.fillStyle = '#111a1c';
      ctx.fill();
    }
    ctx.restore();

    /* i fili: la materia che sappiamo animare */
    drawWeb(
      ctx,
      {
        cx: CX, cy: CY, k: K,
        rFrame: Math.max(...snap.axisCheck),
        rFrameAt: (a: number) => rWallAt(snap, a),
        rStar: (a: number) => rHeroAt(snap.axisTip, a),
        anchorAngles: Array.from({ length: AXES }, (_, i) => -Math.PI / 2 + i * TAU / AXES),
        rWallAt: (a: number) => rWallAt(snap, a),
        seed: 0x51c5,
        skipArena: true,
        ink: INK as never,
      } as never,
      { ...WEB_DEFAULTS, radii: 22, weftStep: 16, perSector: 1, secFrame: 0.16,
        droplets: true, beads: 0.10 } as never,
      { launch: 1, showStar: false, starS: 0, tearMs: 900, tearT: 0,
        snapFrac: 0.55, recoil: 0, damping: 6 } as never,
    );

    /* ── 2. LA STELLA = IL PERSONAGGIO, sopra. Il coperto e' il successo. ── */
    ctx.save();
    pathOf(heroAt);
    /* dentro la trama: la copertura vera */
    ctx.save();
    ctx.clip();
    pathOf(tramaAt);
    const g = ctx.createRadialGradient(CX, CY, 0, CX, CY, R * K);
    g.addColorStop(0, 'rgba(255,246,226,0.97)');
    g.addColorStop(0.62, 'rgba(238,216,170,0.94)');
    g.addColorStop(1, 'rgba(206,170,116,0.9)');
    ctx.fillStyle = g;
    ctx.fill();
    ctx.restore();
    /* fuori dalla trama: TALENTO CHE LA PROVA NON CHIEDE. Disegnato, non
       troncato: se lo si taglia al muro il significato non esiste.
       ATTENZIONE — `save`/`restore` NON salvano il PATH CORRENTE: dopo il blocco
       qui sopra il path era ancora quello della trama, e lo sbordo veniva
       ridisegnato sulla trama stessa. A 99/15 (talento sprecato 635%) a schermo
       si vedeva solo un dischetto: il bug si vedeva solo nel caso estremo. */
    pathOf(heroAt);
    ctx.globalAlpha = 0.20;
    ctx.fillStyle = 'rgba(238,216,170,1)';
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.lineWidth = 1.1;
    ctx.strokeStyle = 'rgba(255,240,206,0.55)';
    ctx.stroke();
    ctx.restore();

    /* le cinque punte, a rOf(stat): l'invariante che non si muove */
    for (let i = 0; i < AXES; i += 1) {
      const a = -Math.PI / 2 + i * TAU / AXES;
      const r = snap.axisTip[i] * K;
      ctx.beginPath();
      ctx.arc(CX + Math.cos(a) * r, CY + Math.sin(a) * r, 2.4, 0, TAU);
      ctx.fillStyle = 'rgba(255,248,232,0.9)';
      ctx.fill();
    }
  }, [snap, painted, bg]);

  const setAt = (arr: number[], i: number, v: number) =>
    arr.map((x, j) => (j === i ? v : x));

  return (
    <div style={{ background: '#080c0e', minHeight: '100vh', color: '#e8e2d4',
                  font: '13px ui-sans-serif, system-ui, sans-serif', padding: 18 }}>
      <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
        <canvas ref={cv} width={SIZE} height={SIZE}
                style={{ borderRadius: 6, flex: '0 0 auto' }} />
        <div style={{ minWidth: 320, maxWidth: 380 }}>
          <h1 style={{ fontSize: 16, fontWeight: 600, margin: '2px 0 2px' }}>
            Skill Check v15 — la stella copre la trama
          </h1>
          <p style={{ color: '#8d9aa0', margin: '0 0 14px', lineHeight: 1.5 }}>
            La stella è il personaggio, la trama è la difficoltà, la prova è
            quanto resta scoperto. La percentuale qui sotto è <b>misurata</b> dal
            disegno, non impostata.
          </p>
          <div style={{ border: '1px solid #2a3a3e', borderRadius: 8, padding: '10px 12px',
                        marginBottom: 14, background: '#0d1417' }}>
            <div style={{ fontSize: 26, fontWeight: 500 }}>
              {cov.pct.toFixed(2)}<span style={{ fontSize: 15, color: '#8d9aa0' }}>% successo</span>
            </div>
            <div style={{ color: '#8d9aa0', marginTop: 2 }}>
              scoperto {(100 - cov.pct).toFixed(2)}% · talento non richiesto{' '}
              {((cov.wastedArea / cov.tramaArea) * 100).toFixed(0)}% dell'area della trama
            </div>
            <div style={{ marginTop: 6, color: shouldRoll(cov) ? '#7fe0ab' : '#e0b87f' }}>
              {shouldRoll(cov) ? 'si tira lo skill check' : 'successo automatico: non si tira, si mostra il risultato'}
            </div>
          </div>
          {Array.from({ length: AXES }, (_, i) => (
            <div key={i} style={{ marginBottom: 9 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#9fb0b6' }}>
                <span>asse {i + 1}</span>
                <span>
                  stat {stats[i]} vs prova {diffs[i]} ·{' '}
                  <b style={{ color: cov.exposedByAxis[i] > 60 ? '#e08c7f' : '#9fb0b6' }}>
                    scoperto {cov.exposedByAxis[i].toFixed(0)}%
                  </b>
                </span>
              </div>
              <input type="range" min={1} max={99} value={stats[i]} style={{ width: '100%' }}
                     onChange={e => setStats(s => setAt(s, i, Number(e.target.value)))} />
              <input type="range" min={1} max={99} value={diffs[i]} style={{ width: '100%' }}
                     onChange={e => setDiffs(d => setAt(d, i, Number(e.target.value)))} />
            </div>
          ))}
          <label style={{ display: 'block', marginTop: 12, color: '#9fb0b6' }}>
            <input type="checkbox" checked={painted}
                   onChange={e => setPainted(e.target.checked)} />{' '}
            trama dipinta (bg.png desaturato) invece che di solo filo
          </label>
          <div style={{ marginTop: 14, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button onClick={() => { setStats([70, 70, 70, 70, 70]); setDiffs([70, 70, 70, 70, 70]); }}
                    style={btn}>parità</button>
            <button onClick={() => { setStats([95, 95, 95, 25, 95]); setDiffs([70, 70, 70, 70, 70]); }}
                    style={btn}>una skill tradisce</button>
            <button onClick={() => { setStats([95, 25, 25, 25, 25]); setDiffs([60, 60, 60, 60, 60]); }}
                    style={btn}>specialista</button>
            <button onClick={() => { setStats([99, 99, 99, 99, 99]); setDiffs([15, 15, 15, 15, 15]); }}
                    style={btn}>talento sprecato</button>
          </div>
        </div>
      </div>
    </div>
  );
}

const btn: React.CSSProperties = {
  background: '#16211f', color: '#cfe0d8', border: '1px solid #2a3a3e',
  borderRadius: 6, padding: '5px 9px', cursor: 'pointer', font: 'inherit',
};
