/**
 * Ragnatela Lab — GREY BOX dei due beat della geometria avversariale.
 *
 * Desiderata v9. Serve a rispondere a UNA domanda: tessitura e strappo si
 * sentono giusti? Niente materiali, niente palette: se il movimento regge in
 * grigio, il resto è vestizione.
 *
 * Non è produzione. Cancellabile senza conseguenze.
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  AXES,
  DEFAULTS,
  R,
  phaseAt,
  readout,
  rOf,
  rStarAt,
  totalMs,
  type RagnatelaParams,
} from '@/ui/skillCheckWebV1/webEngine';
import {
  WEB_DEFAULTS,
  drawWeb,
  type ShapeCtx,
  type WebOpts,
} from '@/ui/skillCheckWebV1/adversaryShapes';

type NumKey = {
  [K in keyof RagnatelaParams]: RagnatelaParams[K] extends number ? K : never;
}[keyof RagnatelaParams];

/** Definito a livello di modulo: un componente creato dentro il render
    violerebbe react-hooks/static-components e rimonterebbe a ogni frame. */
function Slider({
  label,
  value,
  min,
  max,
  step = 1,
  fmt,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  fmt?: (v: number) => string;
  onChange: (v: number) => void;
}) {
  return (
    <label className="block">
      <span className="flex justify-between text-xs text-gray-400 mb-1">
        <span>{label}</span>
        <span className="tabular-nums text-gray-200">{fmt ? fmt(value) : value}</span>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full"
      />
    </label>
  );
}

export default function RagnatelaLab() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const startRef = useRef<number>(0);
  const pausedAtRef = useRef<number>(0);

  const [p, setP] = useState<RagnatelaParams>(DEFAULTS);
  const [w, setW] = useState<WebOpts>(WEB_DEFAULTS);
  const [playing, setPlaying] = useState(true);
  const [loop, setLoop] = useState(true);
  const [t, setT] = useState(0);
  /* SEED PER PROVA. Prima era `seed: 7` cablato: la tela era identica bit per bit
     a ogni tiro — stessi 13 ancoraggi, stessi 26 raggi, stessi fili che muoiono
     nello stesso ordine. Il lucchetto serve ai confronti A/B, dove la tela deve
     restare ferma mentre si cambia un parametro. */
  const [seed, setSeed] = useState(7);
  const [seedLock, setSeedLock] = useState(false);

  const set = <K extends keyof RagnatelaParams>(k: K, v: RagnatelaParams[K]) =>
    setP((prev) => ({ ...prev, [k]: v }));

  const total = totalMs(p);
  const r = readout(p);
  const ph = phaseAt(t, p);

  const replay = useCallback(() => {
    startRef.current = performance.now();
    pausedAtRef.current = 0;
    setT(0);
    setPlaying(true);
    /* ogni replay e' una PROVA nuova: tela diversa, salvo lucchetto */
    if (!seedLock) setSeed((v) => (v * 1664525 + 1013904223) >>> 8);
  }, [seedLock]);

  /* Mappa la timeline sulla rete.
     Il beat 1 non è più tessitura: è LANCIO. Il ragno non esiste, quindi non
     c'è nessuno che posi i fili uno per volta — la rete arriva come evento
     unico, con la topologia completa dal primo frame. */
  const drawFrame = (ctx: CanvasRenderingContext2D, cw: number, ch: number, t: number) => {
    const ph = phaseAt(t, p);
    ctx.fillStyle = '#0d1117';
    ctx.fillRect(0, 0, cw, ch);

    const tips = Array.from({ length: AXES }, () => rOf(p.stat));
    const S: ShapeCtx = {
      cx: cw / 2,
      cy: ch / 2,
      k: Math.min(cw, ch) / 2 / (R * 1.02),
      rFrame: rOf(p.difficulty),
      /* raggio PIENO della stella: la scala la applica drawWeb */
      rStar: (a) => rStarAt(a, tips, 1),
      /* ancoraggi maestri sugli assi, come nella V7 dove sono gli obelischi */
      anchorAngles: Array.from(
        { length: AXES },
        (_, i) => -Math.PI / 2 + (i * Math.PI * 2) / AXES,
      ),
      /* il ramo: la tela e' appesa al bordo del board */
      rTether: R,
      seed,
      /* il righello: 1..99 sull'intero board, così punta-stella e muro-arena
         si leggono sullo stesso metro */
      rig: {
        axes: Array.from({ length: AXES }, (_, i) => -Math.PI / 2 + (i * Math.PI * 2) / AXES),
        ticks: Array.from({ length: 19 }, (_, i) => {
          const v = (i + 1) * 5;
          return { r: rOf(v), major: v % 25 === 0 };
        }),
      },
    };

    /* showStar era scritto dalla checkbox e non letto da nessuno: la regione di
       SUCCESSO non si poteva spegnere, quindi ogni giudizio su "si vede in
       anticipo?" veniva dato guardando un board che mostra sempre la risposta. */
    drawWeb(ctx, S, w, {
      launch: ph.weaveP,
      starS: ph.starS,
      tearT: ph.tearT,
      tearMs: p.tearMs,
      showStar: p.showStar,
      snapFrac: p.snapFrac,
      recoil: p.recoil,
      damping: p.damping,
    });
  };

  /* render loop — ridisegna anche in pausa così lo scrub è visibile */
  useEffect(() => {
    const cv = canvasRef.current;
    if (!cv) return;

    const tick = () => {
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const box = cv.getBoundingClientRect();
      const cw = Math.max(1, Math.round(box.width));
      const ch = Math.max(1, Math.round(box.height));
      if (cv.width !== cw * dpr || cv.height !== ch * dpr) {
        cv.width = cw * dpr;
        cv.height = ch * dpr;
      }
      const ctx = cv.getContext('2d');
      if (!ctx) return;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      let now = pausedAtRef.current;
      if (playing) {
        const elapsed = performance.now() - startRef.current;
        now = loop ? elapsed % total : Math.min(elapsed, total);
        pausedAtRef.current = now;
        setT(now);
      }

      drawFrame(ctx, cw, ch, now);
      rafRef.current = requestAnimationFrame(tick);
    };

    if (playing && startRef.current === 0) startRef.current = performance.now();
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [p, w, seed, playing, loop, total]);

  const togglePlay = () => {
    if (playing) {
      setPlaying(false);
    } else {
      startRef.current = performance.now() - pausedAtRef.current;
      setPlaying(true);
    }
  };

  const scrub = (v: number) => {
    setPlaying(false);
    pausedAtRef.current = v;
    setT(v);
  };

  /** scorciatoia: uno Slider legato a una chiave numerica dei parametri */
  const num = (
    label: string,
    k: NumKey,
    min: number,
    max: number,
    step = 1,
    fmt?: (v: number) => string,
  ) => (
    <Slider
      label={label}
      value={p[k]}
      min={min}
      max={max}
      step={step}
      fmt={fmt}
      onChange={(v) => set(k, v as RagnatelaParams[NumKey])}
    />
  );

  return (
    /* h-screen + overflow-hidden: un lab di movimento va guardato tutto in una
       schermata. Con min-h-screen il canvas cresceva oltre il viewport e la
       pagina scrollava, che è il modo di non vedere mai un'animazione intera. */
    <div
      className="bg-gray-900 text-gray-100 flex flex-col overflow-hidden"
      style={{ height: '100vh' }}
    >
      <div className="flex items-center justify-between px-6 py-3 border-b border-gray-800">
        <div className="flex items-center gap-4">
          <h1 className="text-lg font-bold text-amber-400">Tela — lab del movimento</h1>
          <span className="text-xs text-gray-500">skill check V1 · lancio della rete + sfondamento</span>
        </div>
        <div className="flex gap-2">
          <a
            href="/minimal-destiny-astrolabe-v7"
            className="px-3 py-1 rounded text-sm font-semibold bg-gray-700 text-gray-300 hover:bg-gray-600"
          >
            V7
          </a>
          <a
            href="/minimal-destiny-astrolabe-v6"
            className="px-3 py-1 rounded text-sm font-semibold bg-gray-700 text-gray-300 hover:bg-gray-600"
          >
            V6
          </a>
        </div>
      </div>

      <div className="flex-1 flex flex-col md:flex-row gap-4 p-4 min-h-0">
        {/* board */}
        <div className="flex-1 flex flex-col min-h-0">
          <div className="flex-1 rounded-lg border border-gray-800 overflow-hidden min-h-0">
            <canvas ref={canvasRef} className="w-full h-full block" />
          </div>

          {/* transport */}
          <div className="flex items-center gap-3 mt-3">
            <button
              onClick={togglePlay}
              className="px-4 py-1.5 rounded font-semibold bg-amber-500 text-black text-sm w-20"
            >
              {playing ? 'Pausa' : 'Play'}
            </button>
            <button
              onClick={replay}
              className="px-4 py-1.5 rounded font-semibold bg-gray-700 text-gray-200 text-sm"
            >
              ↺ Replay
            </button>
            <label className="flex items-center gap-1.5 text-xs text-gray-400">
              <input type="checkbox" checked={loop} onChange={(e) => setLoop(e.target.checked)} />
              loop
            </label>
            <label
              className="flex items-center gap-1.5 text-xs text-gray-400"
              title="tiene la stessa tela fra un replay e l'altro, per confronti A/B"
            >
              <input
                type="checkbox"
                checked={seedLock}
                onChange={(e) => setSeedLock(e.target.checked)}
              />
              tela fissa
            </label>
            <input
              type="range"
              min={0}
              max={total}
              step={10}
              value={Math.min(t, total)}
              onChange={(e) => scrub(Number(e.target.value))}
              className="flex-1"
            />
            <span className="text-xs tabular-nums text-gray-400 w-32 text-right">
              {Math.round(t)} / {total} ms
            </span>
            <span className="text-xs font-bold text-cyan-400 w-16">{ph.name}</span>
          </div>
        </div>

        {/* controls */}
        <div className="w-full md:w-72 flex-shrink-0 space-y-4 overflow-y-auto">
          <section className="space-y-3">
            <h2 className="text-sm font-bold text-amber-400">Prova</h2>
            {num('Stat PG', 'stat', 1, 99)}
            {num('Difficoltà', 'difficulty', 1, 99)}
          </section>

          <section className="space-y-3">
            <h2 className="text-sm font-bold text-amber-400">Beat 1 — lancio</h2>
            {num('Durata', 'weaveMs', 150, 2000, 25, (v) => `${v} ms`)}
            {/* la spazzata è il parametro che separa la tela dalla rete: a 0 il
                perimetro arriva tutto insieme e torna a leggersi come rete. */}
            <Slider label="Spazzata (tela↔rete)" value={w.sweep} min={0} max={0.85} step={0.05}
              fmt={(v) => (v === 0 ? 'rete' : v.toFixed(2))}
              onChange={(v) => setW({ ...w, sweep: v })} />
            <Slider label="Direzione tiro" value={w.shotAngle} min={0} max={6.28} step={0.05}
              fmt={(v) => `${Math.round((v * 180) / Math.PI)}°`}
              onChange={(v) => setW({ ...w, shotAngle: v })} />
            <Slider label="Sovraelongazione" value={w.overshoot} min={0} max={0.3} step={0.01}
              fmt={(v) => `${Math.round(v * 100)}%`}
              onChange={(v) => setW({ ...w, overshoot: v })} />
            <Slider label="Rotazione" value={w.spin} min={0} max={1.6} step={0.02}
              fmt={(v) => `${Math.round((v * 180) / Math.PI)}°`}
              onChange={(v) => setW({ ...w, spin: v })} />
            <Slider label="Traiettoria" value={w.throwOffset} min={0} max={0.6} step={0.01}
              fmt={(v) => v.toFixed(2)} onChange={(v) => setW({ ...w, throwOffset: v })} />
            <Slider label="Ritardo centro" value={w.centerLag} min={0} max={0.8} step={0.05}
              fmt={(v) => v.toFixed(2)} onChange={(v) => setW({ ...w, centerLag: v })} />
            <Slider label="Ancoraggi" value={w.anchors} min={5} max={26}
              onChange={(v) => setW({ ...w, anchors: v })} />
            <Slider label="Irregolarità bordo" value={w.anchorJitter} min={0} max={0.14} step={0.005}
              fmt={(v) => `${(v * 100).toFixed(1)}%`}
              onChange={(v) => setW({ ...w, anchorJitter: v })} />
          </section>

          <section className="space-y-3">
            <h2 className="text-sm font-bold text-amber-400">Geometria della tela</h2>
            <Slider label="Raggi (ordito)" value={w.radii} min={8} max={40}
              onChange={(v) => setW({ ...w, radii: v })} />
            <Slider label="Cedimento trame" value={w.sag} min={0} max={0.4} step={0.01}
              fmt={(v) => v.toFixed(2)} onChange={(v) => setW({ ...w, sag: v })} />
            <Slider label="Passo trame" value={w.weftStep} min={4} max={40}
              onChange={(v) => setW({ ...w, weftStep: v })} />
            <Slider label="Curvatura raggi" value={w.curve} min={0} max={0.3} step={0.005}
              fmt={(v) => v.toFixed(3)} onChange={(v) => setW({ ...w, curve: v })} />
            <Slider label="Zona libera" value={w.freeZone} min={0} max={60}
              onChange={(v) => setW({ ...w, freeZone: v })} />
            <Slider label="Sporgenza punte" value={w.punchOut} min={0} max={0.4} step={0.01}
              fmt={(v) => `${Math.round(v * 100)}%`}
              onChange={(v) => setW({ ...w, punchOut: v })} />
            <Slider label="Mozzo" value={w.hubR} min={0} max={0.3} step={0.01}
              fmt={(v) => `${Math.round(v * 100)}%`}
              onChange={(v) => setW({ ...w, hubR: v })} />
            <Slider label="Filo-ponte" value={w.bridge} min={0} max={0.5} step={0.02}
              fmt={(v) => (v === 0 ? 'no' : `${Math.round(v * 100)}%`)}
              onChange={(v) => setW({ ...w, bridge: v })} />
            {/* a 0 il bordo torna sul muro, cioe' torna un cerchio */}
            <Slider label="Festone (no cerchio)" value={w.secFrame} min={0} max={0.35} step={0.01}
              fmt={(v) => (v === 0 ? 'cerchio' : v.toFixed(2))}
              onChange={(v) => setW({ ...w, secFrame: v })} />
            <Slider label="Festoni per settore" value={w.perSector} min={0} max={3}
              onChange={(v) => setW({ ...w, perSector: v })} />
            <Slider label="Tiranti" value={w.tether} min={0} max={4}
              fmt={(v) => (v === 0 ? 'no' : String(v))}
              onChange={(v) => setW({ ...w, tether: v })} />
            <Slider label="Lampo speculare" value={w.glint} min={0} max={0.9} step={0.05}
              fmt={(v) => v.toFixed(2)} onChange={(v) => setW({ ...w, glint: v })} />
            <Slider label="Alone" value={w.halo} min={0} max={0.3} step={0.01}
              fmt={(v) => v.toFixed(2)} onChange={(v) => setW({ ...w, halo: v })} />
            <Slider label="Gocce" value={w.beads} min={0} max={0.4} step={0.02}
              fmt={(v) => (v === 0 ? 'no' : v.toFixed(2))}
              onChange={(v) => setW({ ...w, beads: v })} />
            <div className="flex gap-3 pt-0.5">
              <label className="flex items-center gap-1.5 text-[11px] text-gray-300">
                <input type="checkbox" checked={w.overStar}
                  onChange={(e) => setW({ ...w, overStar: e.target.checked })} />
                tela davanti al fiore
              </label>
              <label className="flex items-center gap-1.5 text-[11px] text-gray-300">
                <input type="checkbox" checked={w.knots}
                  onChange={(e) => setW({ ...w, knots: e.target.checked })} />
                nodi
              </label>
            </div>
            <div className="flex gap-1.5">
              {(['gravity', 'swirl', 'none'] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => setW({ ...w, curveMode: m })}
                  className={`flex-1 px-1.5 py-1 rounded text-[10px] font-semibold ${
                    w.curveMode === m
                      ? 'bg-amber-500 text-black'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  {m === 'gravity' ? 'verso il basso' : m === 'swirl' ? 'vortice (no)' : 'retti'}
                </button>
              ))}
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="text-sm font-bold text-amber-400">Beat 2 — strappo</h2>
            {num('Durata', 'tearMs', 200, 2500, 50, (v) => `${v} ms`)}
            {num('Soglia di scatto', 'snapFrac', 0.05, 0.95, 0.05, (v) => `${Math.round(v * 100)}%`)}
            {num('Rinculo', 'recoil', 0, 40)}
            {num('Smorzamento', 'damping', 1, 20)}
          </section>

          <section className="space-y-2">
            <h2 className="text-sm font-bold text-amber-400">Vista</h2>
            <label className="flex items-center gap-2 text-xs text-gray-300">
              <input
                type="checkbox"
                checked={w.droplets}
                onChange={(e) => setW({ ...w, droplets: e.target.checked })}
              />
              gocce
            </label>
            <label className="flex items-center gap-2 text-xs text-gray-300">
              <input
                type="checkbox"
                checked={p.showStar}
                onChange={(e) => set('showStar', e.target.checked)}
              />
              stella
            </label>
            <button
              onClick={() => {
                setP(DEFAULTS);
                setW(WEB_DEFAULTS);
              }}
              className="mt-1 px-3 py-1 rounded text-xs font-semibold bg-gray-700 text-gray-300 hover:bg-gray-600"
            >
              ↺ Reset parametri
            </button>
          </section>

          {/* la misura: la ragnatela è una codifica onesta? */}
          <section className="space-y-2 pt-3 border-t border-gray-800">
            <h2 className="text-sm font-bold text-amber-400">Lettura</h2>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-gray-800 rounded p-2">
                <div className="text-gray-500">fili superstiti</div>
                <div className="text-lg font-bold text-gray-100 tabular-nums">
                  {r.survivors}
                  <span className="text-gray-500 text-sm">/{r.total}</span>
                </div>
              </div>
              <div className="bg-gray-800 rounded p-2">
                <div className="text-gray-500">lettura equal-area</div>
                <div className="text-lg font-bold text-emerald-400 tabular-nums">
                  {r.areaEaten.toFixed(1)}%
                </div>
              </div>
              <div className="bg-gray-800 rounded p-2">
                <div className="text-gray-500">prob. geometrica</div>
                <div className="text-lg font-bold text-emerald-400 tabular-nums">
                  {r.areaProb.toFixed(1)}%
                </div>
              </div>
              <div className="bg-gray-800 rounded p-2">
                <div className="text-gray-500">lettura lineare</div>
                <div className="text-lg font-bold text-red-400 tabular-nums">
                  {(r.lengthEaten * 100).toFixed(1)}%
                </div>
              </div>
              <div className="bg-gray-800 rounded p-2">
                <div className="text-gray-500">onorabile (cap D100)</div>
                <div className="text-lg font-bold text-amber-400 tabular-nums">
                  {r.shownPct.toFixed(1)}%
                </div>
              </div>
              <div className="bg-gray-800 rounded p-2">
                <div className="text-gray-500">formula V7</div>
                <div className="text-lg font-bold text-gray-400 tabular-nums">{r.formulaTst}%</div>
              </div>
            </div>
            <p className="text-[11px] leading-snug text-gray-500">
              <b>Equal-area</b> coincide con la probabilità a scarto 0.000 quando la difficoltà è
              uniforme: la ragnatela sposta la lettura da area (rango 4) a posizione su scala (rango
              1) <i>senza mentire</i>. <b>Lineare</b> è la graduazione di V7 oggi, e sbaglia fino a
              +12.5 pt. Con difficoltà diverse per asse l&apos;identità cade: ogni filo resta esatto
              per il proprio asse, ma un numero globale non esiste.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
