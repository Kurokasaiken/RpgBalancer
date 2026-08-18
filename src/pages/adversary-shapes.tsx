/**
 * Test di fattibilità delle sagome avversariali — statico, grigio.
 *
 * Una domanda sola: canvas 2D regge una ragnatela che sembri una ragnatela e un
 * rovereto che sappia di rampicante? Nessun materiale, nessuna palette, nessuna
 * animazione: se la sagoma non legge qui, niente la salva dopo.
 */

import { useEffect, useRef, useState } from 'react';
import {
  BRAMBLE_DEFAULTS,
  WEB_DEFAULTS,
  drawBrambles,
  drawWeb,
  type BrambleOpts,
  type ShapeCtx,
  type WebOpts,
} from '@/ui/skillCheckWebV1/adversaryShapes';
import { R, rOf, rStarAt, AXES } from '@/ui/skillCheckWebV1/webEngine';

type Shape = 'web' | 'brambles';

function Board({
  shape,
  stat,
  difficulty,
  seed,
  web,
  bram,
}: {
  shape: Shape;
  stat: number;
  difficulty: number;
  seed: number;
  web: WebOpts;
  bram: BrambleOpts;
}) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    const box = cv.getBoundingClientRect();
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const w = Math.max(1, Math.round(box.width));
    const h = Math.max(1, Math.round(box.height));
    cv.width = w * dpr;
    cv.height = h * dpr;
    const ctx = cv.getContext('2d');
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = '#0d1117';
    ctx.fillRect(0, 0, w, h);

    const rFrame = rOf(difficulty);
    const tips = Array.from({ length: AXES }, () => rOf(stat));
    const S: ShapeCtx = {
      cx: w / 2,
      cy: h / 2,
      k: Math.min(w, h) / 2 / (R * 0.58),
      rFrame,
      /* NON clampata al telaio: le punte che lo superano devono sporgere,
         perché lo bucano. È il telaio che si interrompe, non la stella. */
      rStar: (a) => rStarAt(a, tips, 1),
      seed,
    };
    if (shape === 'web') drawWeb(ctx, S, web);
    else drawBrambles(ctx, S, bram);
  }, [shape, stat, difficulty, seed, web, bram]);

  return <canvas ref={ref} className="w-full h-full block" />;
}

export default function AdversaryShapes() {
  const [stat, setStat] = useState(55);
  const [difficulty, setDifficulty] = useState(70);
  const [seed, setSeed] = useState(7);
  const [web, setWeb] = useState<WebOpts>(WEB_DEFAULTS);
  const [bram, setBram] = useState<BrambleOpts>(BRAMBLE_DEFAULTS);

  const row = (label: string, node: React.ReactNode) => (
    <label className="flex items-center gap-2 text-[11px] text-gray-400">
      <span className="w-24 shrink-0">{label}</span>
      {node}
    </label>
  );
  const sl = (
    v: number,
    set: (n: number) => void,
    min: number,
    max: number,
    step = 1,
  ) => (
    <>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={v}
        onChange={(e) => set(Number(e.target.value))}
        className="flex-1"
      />
      <span className="w-10 text-right tabular-nums text-gray-200">{v}</span>
    </>
  );

  return (
    <div
      className="bg-gray-900 text-gray-100 flex flex-col overflow-hidden"
      style={{ height: '100vh' }}
    >
      <div className="flex items-center justify-between px-5 py-2.5 border-b border-gray-800">
        <div className="flex items-baseline gap-3">
          <h1 className="text-base font-bold text-amber-400">Sagome avversariali — fattibilità</h1>
          <span className="text-[11px] text-gray-500">
            statico · grigio · la stella è il mozzo, il bordo è il cerchio
          </span>
        </div>
        <button
          onClick={() => setSeed((s) => s + 1)}
          className="px-3 py-1 rounded text-xs font-semibold bg-amber-500 text-black"
        >
          ↻ Altro seed ({seed})
        </button>
      </div>

      <div className="flex-1 grid grid-cols-2 gap-3 p-3 min-h-0">
        <div className="flex flex-col min-h-0">
          <div className="text-xs font-bold text-gray-300 mb-1.5 px-1">
            (a) Tela — ordito addolcito, trame cedenti, telaio bucato dalle punte
          </div>
          <div className="flex-1 rounded-lg border border-gray-800 overflow-hidden min-h-0">
            <Board shape="web" stat={stat} difficulty={difficulty} seed={seed} web={web} bram={bram} />
          </div>
        </div>
        <div className="flex flex-col min-h-0">
          <div className="text-xs font-bold text-gray-300 mb-1.5 px-1">
            (b) Rovereto — fusti rastremati, intreccio per alone, spine e foglie
          </div>
          <div className="flex-1 rounded-lg border border-gray-800 overflow-hidden min-h-0">
            <Board
              shape="brambles"
              stat={stat}
              difficulty={difficulty}
              seed={seed}
              web={web}
              bram={bram}
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-5 px-4 py-3 border-t border-gray-800 text-xs">
        <div className="space-y-1.5">
          <h2 className="text-[11px] font-bold text-amber-400">Prova</h2>
          {row('Stat PG', sl(stat, setStat, 1, 99))}
          {row('Difficoltà', sl(difficulty, setDifficulty, 1, 99))}
        </div>
        <div className="space-y-1.5">
          <h2 className="text-[11px] font-bold text-amber-400">Ragnatela</h2>
          {row('Raggi', sl(web.radii, (v) => setWeb({ ...web, radii: v }), 8, 40))}
          {row(
            'Cedimento',
            sl(web.sag, (v) => setWeb({ ...web, sag: v }), 0, 0.4, 0.01),
          )}
          {row('Passo trame', sl(web.weftStep, (v) => setWeb({ ...web, weftStep: v }), 4, 40))}
          {row('Zona libera', sl(web.freeZone, (v) => setWeb({ ...web, freeZone: v }), 0, 60))}
          {row(
            'Curvatura',
            sl(web.curve, (v) => setWeb({ ...web, curve: v }), 0, 0.3, 0.005),
          )}
          <div className="flex gap-1.5 pt-0.5">
            {(['gravity', 'swirl', 'none'] as const).map((m) => (
              <button
                key={m}
                onClick={() => setWeb({ ...web, curveMode: m })}
                className={`flex-1 px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                  web.curveMode === m
                    ? 'bg-amber-500 text-black'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                {m === 'gravity' ? 'verso il basso' : m === 'swirl' ? 'vortice (no)' : 'retti'}
              </button>
            ))}
          </div>
        </div>
        <div className="space-y-1.5">
          <h2 className="text-[11px] font-bold text-amber-400">Rovereto</h2>
          {row('Fusti', sl(bram.vines, (v) => setBram({ ...bram, vines: v }), 4, 44))}
          {row('Fascia', sl(bram.band, (v) => setBram({ ...bram, band: v }), 20, 140))}
          {row('Serpeggia', sl(bram.meander, (v) => setBram({ ...bram, meander: v }), 0, 40))}
          {row('Foglia', sl(bram.leafSize, (v) => setBram({ ...bram, leafSize: v }), 5, 40))}
          {row('Tralci', sl(bram.runners, (v) => setBram({ ...bram, runners: v }), 0, 16))}
          <div className="flex gap-3 pt-0.5">
            <label className="flex items-center gap-1.5 text-[11px] text-gray-300">
              <input
                type="checkbox"
                checked={bram.thorns}
                onChange={(e) => setBram({ ...bram, thorns: e.target.checked })}
              />
              spine
            </label>
            <label className="flex items-center gap-1.5 text-[11px] text-gray-300">
              <input
                type="checkbox"
                checked={bram.leaves}
                onChange={(e) => setBram({ ...bram, leaves: e.target.checked })}
              />
              foglie
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}
