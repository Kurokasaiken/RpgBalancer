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
 * T-001: la trama e' `rCheckAt`, che oggi e' un muro INVISIBILE. Il disegno sta
 * in `SkillCheckBoardV15`, pilotato da props sul modello di `QuestChronicle`:
 * un consumabile che alza una stat cambia le props e il board si ridisegna.
 */
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AXES, DEFAULT_CHECK_CONFIG } from '@/ui/skillCheckWebV1/zones';
import { shouldRoll, type Coverage } from '@/ui/skillCheckWebV1/coverage';
import { SkillCheckBoardV15 } from '@/ui/skillCheckWebV1/SkillCheckBoardV15';

const TAU = Math.PI * 2;
const SIZE = 760;


export default function SkillCheckV15Page(): JSX.Element {
  const [stats, setStats] = useState<number[]>([70, 55, 62, 30, 66]);
  const [diffs, setDiffs] = useState<number[]>([50, 50, 50, 50, 50]);
  const [painted, setPainted] = useState(false);
  const [starShape, setStarShape] = useState(false);   // stella (0.2675) invece di fiore
  const [seed, setSeed] = useState(0x51c5);
  const [bg, setBg] = useState<HTMLImageElement | null>(null);
  const [cov, setCov] = useState<Coverage | null>(null);
  const [narrow, setNarrow] = useState(true);
  const [beat, setBeat] = useState<'nascita' | 'check' | 'uscita'>('check');
  const [pcts, setPcts] = useState({ almost: 5, crit: 5, critWin: 5 });
  const config = useMemo(() => ({ ...DEFAULT_CHECK_CONFIG, ...pcts }), [pcts]);

  useEffect(() => {
    const img = new Image();
    img.onload = () => setBg(img);
    img.src = '/assets/ui/bg.png';
  }, []);

  /* IL CONSUMABILE. Non notifica niente e non conosce il board: alza una stat,
     e il board si ridisegna perche' le props sono cambiate. E' il pattern di
     QuestChronicle, ed e' il motivo per cui il disegno sta in un componente. */
  const drinkPotion = (delta: number) =>
    setStats(s => s.map(v => Math.max(1, Math.min(99, v + delta))));

  const setAt = (arr: number[], i: number, v: number) =>
    arr.map((x, j) => (j === i ? v : x));

  return (
    <div style={{ background: '#080c0e', minHeight: '100vh', color: '#e8e2d4',
                  font: '13px ui-sans-serif, system-ui, sans-serif', padding: 18 }}>
      <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
        <div style={{ flex: '0 0 auto' }}>
          <SkillCheckBoardV15
            stats={stats} diffs={diffs} size={SIZE} seed={seed}
            valleyF={starShape ? 0.2675 : undefined}
            paintedWith={painted ? bg : null}
            narrow={narrow}
            clipIn={beat === 'nascita' ? 0 : 1}
            outbound={beat === 'uscita' ? 0.55 : 0}
            mode={beat === 'check' ? 'dark' : 'woven'}
            config={config}
            onMeasure={setCov}
          />
        </div>
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
              {(cov?.pct ?? 0).toFixed(2)}<span style={{ fontSize: 15, color: '#8d9aa0' }}>% successo</span>
            </div>
            <div style={{ color: '#8d9aa0', marginTop: 2 }}>
              scoperto {(100 - (cov?.pct ?? 0)).toFixed(2)}% · talento non richiesto{' '}
              {(((cov?.wastedArea ?? 0) / (cov?.tramaArea || 1)) * 100).toFixed(0)}% dell'area della trama
            </div>
            <div style={{ marginTop: 6, color: cov && shouldRoll(cov) ? '#7fe0ab' : '#e0b87f' }}>
              {cov && shouldRoll(cov) ? 'si tira lo skill check' : 'successo automatico: non si tira, si mostra il risultato'}
            </div>
          </div>
          {Array.from({ length: AXES }, (_, i) => (
            <div key={i} style={{ marginBottom: 9 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#9fb0b6' }}>
                <span>asse {i + 1}</span>
                <span>
                  stat {stats[i]} vs prova {diffs[i]} ·{' '}
                  <b style={{ color: (cov?.exposedByAxis[i] ?? 0) > 60 ? '#e08c7f' : '#9fb0b6' }}>
                    scoperto {(cov?.exposedByAxis[i] ?? 0).toFixed(0)}%
                  </b>
                </span>
              </div>
              <input type="range" min={1} max={99} value={stats[i]} style={{ width: '100%' }}
                     onChange={e => setStats(s => setAt(s, i, Number(e.target.value)))} />
              <input type="range" min={1} max={99} value={diffs[i]} style={{ width: '100%' }}
                     onChange={e => setDiffs(d => setAt(d, i, Number(e.target.value)))} />
            </div>
          ))}
          <div style={{ marginTop: 12, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            {([['almost', 'almost'], ['crit', 'fall. critico'], ['critWin', 'succ. critico']] as const)
              .map(([k, label]) => (
                <label key={k} style={{ color: '#9fb0b6', fontSize: 12 }}>
                  {label}{' '}
                  <input type="number" min={0} max={40} step={1} value={pcts[k]}
                         onChange={e => setPcts(v => ({ ...v, [k]: Number(e.target.value) }))}
                         style={{ width: 52, background: '#0d1417', color: '#e8e2d4',
                                  border: '1px solid #2a3a3e', borderRadius: 4, padding: '2px 4px' }} />%
                </label>
              ))}
          </div>
          <div style={{ marginTop: 12, display: 'flex', gap: 6 }}>
            {(['nascita', 'check', 'uscita'] as const).map(b => (
              <button key={b} onClick={() => setBeat(b)}
                      style={{ ...btn, background: beat === b ? '#2b4a3f' : '#16211f' }}>
                {b}
              </button>
            ))}
          </div>
          <label style={{ display: 'block', marginTop: 10, color: '#9fb0b6' }}>
            <input type="checkbox" checked={narrow}
                   onChange={e => setNarrow(e.target.checked)} />{' '}
            punte che si allungano e si stringono
          </label>
          <label style={{ display: 'block', marginTop: 6, color: '#9fb0b6' }}>
            <input type="checkbox" checked={starShape}
                   onChange={e => setStarShape(e.target.checked)} />{' '}
            stella (valle 0,2675) invece di fiore — la parità scende a ~44,6%
          </label>
          <label style={{ display: 'block', marginTop: 6, color: '#9fb0b6' }}>
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
            <button onClick={() => drinkPotion(+12)} style={btn}>consumabile +12</button>
            <button onClick={() => drinkPotion(-12)} style={btn}>consumabile −12</button>
            <button onClick={() => setSeed(s => (s * 1103515245 + 12345) >>> 0)} style={btn}>
              ritessi la trama
            </button>
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
