import { useMemo, useState } from 'react';
import { WorldSurfaceSeaMarks } from '../components/WorldSurfaceSeaMarks';
import {
  coastOnlySeaMarksConfig,
  defaultSeaMarksConfig,
  openOnlySeaMarksConfig,
} from '../config/seaMarksConfig';

/**
 * Sea Effect Lab — small tiles, sea only.
 *
 * The previous version mounted two full `WorldSurfaceRenderer` panels, which meant
 * every judgement about the water was made through clouds, cloud shadows, foam,
 * birds, glass and the frame. The Director asked for the opposite: strip everything
 * away, keep the painted sea, and put the candidate techniques side by side in many
 * small tiles so they can be compared at a glance.
 *
 * Each tile is a fixed crop of the sea layer (`Mare.webp`) with one candidate motion
 * treatment on top. No renderer, no camera, no atmosphere. Nothing here uses RAF:
 * every effect is a CSS keyframe or SMIL, both of which keep running in the preview
 * pane where RAF is frozen.
 *
 * The tiles are a comparison instrument, not production code. Whatever wins here
 * gets rebuilt inside the renderer as a real, config-first, profiled layer.
 */

const SEA_SRC = '/assets/world/wanderlust/base/layers/Mare.webp';
const BACKGROUND_SRC = '/assets/world/wanderlust/base/layers/Background.webp';
const WAVE_DIR = '/assets/atmosphere/waves';
const WATER_DIR = '/assets/atmosphere/water';

/** Natural size of the sea painting. Crops are fractions of this box. */
const SEA_W = 3072;
const SEA_H = 2049;

/**
 * Crops are fractions of the sea layer's own image box, so they survive the fact
 * that `Mare.webp` (3072x2049) is smaller than the manifest canvas (4240x2828) and
 * is stretched to fill it at runtime.
 */
interface Crop {
  id: string;
  label: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

const CROPS: Crop[] = [
  // Top-left band: 100% open water, verified against the sea layer's own alpha.
  { id: 'open', label: 'Mare aperto', x: 0.005, y: 0.005, w: 0.12, h: 0.058 },
  // West strip: open water, portrait framing.
  { id: 'west', label: 'Fascia ovest', x: 0.005, y: 0.3, w: 0.05, h: 0.2 },
  // East strait: water plus two coastlines. Motion reads differently against a coast.
  { id: 'strait', label: 'Stretto est', x: 0.86, y: 0.3, w: 0.135, h: 0.24 },
  // Small southern island: ~70% water around a coastline, so motion can be judged
  // against a shore without the tile turning into a land silhouette.
  { id: 'coast', label: 'Isolotto sud', x: 0.32, y: 0.82, w: 0.16, h: 0.15 },
];

type VariantId =
  | 'static'
  | 'seamarksCoast'
  | 'seamarksOpen'
  | 'seamarksBoth'
  | 'dashes'
  | 'sweep'
  | 'rippleSoft'
  | 'rippleStrong'
  | 'rippleSwell'
  | 'drift'
  | 'detail'
  | 'glints'
  | 'shimmer'
  | 'tint'
  | 'combo';

interface Variant {
  id: VariantId;
  label: string;
  note: string;
}

const VARIANTS: Variant[] = [
  { id: 'static', label: '00 · Statico', note: 'Controllo. Nessun effetto.' },
  { id: 'seamarksCoast', label: '01a · Sea marks — coste', note: 'PLAN-013: solo coste.' },
  { id: 'seamarksOpen', label: '01b · Sea marks — aperto', note: 'PLAN-013: solo mare aperto.' },
  { id: 'seamarksBoth', label: '01c · Sea marks — entrambi', note: 'PLAN-013: coste + aperto.' },
  { id: 'dashes', label: '02 · Dashes dipinte', note: 'Idioma attuale, densificato.' },
  { id: 'sweep', label: '02 · Luce che scorre', note: 'Non muove l\'acqua: muove la luce.' },
  { id: 'rippleSoft', label: '03 · Ripple leggero', note: 'feTurbulence + displacement, scale 4.' },
  { id: 'rippleStrong', label: '04 · Ripple forte', note: 'Stesso filtro, scale 14. Soglia alta.' },
  { id: 'rippleSwell', label: '05 · Swell lento', note: 'Frequenza bassa, onda lunga.' },
  { id: 'drift', label: '06 · Doppia copia', note: 'Copia in soft-light che deriva.' },
  { id: 'detail', label: '07 · Micro-dettaglio', note: 'Tile water_detail in scroll (R-056).' },
  { id: 'glints', label: '08 · Riflessi', note: 'Punti speculari che pulsano.' },
  { id: 'shimmer', label: '09 · Shimmer', note: 'Bande chiare in maschera scorrevole.' },
  { id: 'tint', label: '10 · Respiro di colore', note: 'Solo tinta che pulsa. Zero geometria.' },
  { id: 'combo', label: '11 · Combo', note: 'Ripple leggero + luce + dashes.' },
];

/** Deterministic scatter, so every reload compares the same picture. */
function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const WAVE_SPRITES = ['onda1.webp', 'onda2.webp', 'ondine1.webp', 'schiuma1.webp'];

interface DashMark {
  src: string;
  left: number;
  top: number;
  width: number;
  delay: number;
  flip: number;
}

function buildDashes(seed: number, count: number): DashMark[] {
  const rnd = mulberry32(seed);
  return Array.from({ length: count }, () => ({
    src: WAVE_SPRITES[Math.floor(rnd() * WAVE_SPRITES.length)],
    left: 4 + rnd() * 88,
    top: 6 + rnd() * 84,
    width: 10 + rnd() * 16,
    delay: rnd() * 14,
    flip: rnd() > 0.5 ? -1 : 1,
  }));
}

interface GlintMark {
  left: number;
  top: number;
  size: number;
  delay: number;
}

function buildGlints(seed: number, count: number): GlintMark[] {
  const rnd = mulberry32(seed);
  return Array.from({ length: count }, () => ({
    left: rnd() * 96,
    top: rnd() * 94,
    size: 3 + rnd() * 7,
    delay: rnd() * 9,
  }));
}

/** The sea crop itself: background under, sea layer over, both at the same crop. */
function CropImage({ crop, filterId, className, style }: {
  crop: Crop;
  filterId?: string;
  className?: string;
  style?: React.CSSProperties;
}) {
  const boxed: React.CSSProperties = {
    position: 'absolute',
    left: `${(-crop.x / crop.w) * 100}%`,
    top: `${(-crop.y / crop.h) * 100}%`,
    width: `${100 / crop.w}%`,
    height: `${100 / crop.h}%`,
    // Tailwind preflight caps images at `max-width: 100%`, which would collapse the
    // crop back to the tile width and show the whole map squeezed instead.
    maxWidth: 'none',
    maxHeight: 'none',
  };
  return (
    <img
      src={SEA_SRC}
      alt=""
      aria-hidden="true"
      draggable={false}
      className={className}
      style={{
        ...boxed,
        ...(filterId ? { filter: `url(#${filterId})` } : null),
        ...style,
      }}
    />
  );
}

function CropBackground({ crop }: { crop: Crop }) {
  return (
    <img
      src={BACKGROUND_SRC}
      alt=""
      aria-hidden="true"
      draggable={false}
      style={{
        position: 'absolute',
        left: `${(-crop.x / crop.w) * 100}%`,
        top: `${(-crop.y / crop.h) * 100}%`,
        width: `${100 / crop.w}%`,
        height: `${100 / crop.h}%`,
        maxWidth: 'none',
        maxHeight: 'none',
      }}
    />
  );
}

/**
 * Animated displacement filter.
 *
 * SMIL rather than a JS ticker: `<animate>` runs off the document timeline, like a
 * CSS keyframe, so it survives the preview pane where RAF never fires.
 */
function RippleFilter({ id, baseFrequency, scale, seconds }: {
  id: string;
  baseFrequency: number;
  scale: number;
  seconds: number;
}) {
  return (
    <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden="true">
      <filter id={id} x="-5%" y="-5%" width="110%" height="110%">
        <feTurbulence
          type="fractalNoise"
          baseFrequency={`${baseFrequency} ${baseFrequency * 1.6}`}
          numOctaves={2}
          seed={7}
          result="noise"
        >
          <animate
            attributeName="baseFrequency"
            dur={`${seconds}s`}
            values={
              `${baseFrequency} ${baseFrequency * 1.6};` +
              `${baseFrequency * 1.35} ${baseFrequency * 1.15};` +
              `${baseFrequency} ${baseFrequency * 1.6}`
            }
            repeatCount="indefinite"
          />
        </feTurbulence>
        <feDisplacementMap in="SourceGraphic" in2="noise" xChannelSelector="R" yChannelSelector="G" scale={scale}>
          <animate
            attributeName="scale"
            dur={`${seconds * 0.7}s`}
            values={`${scale * 0.55};${scale};${scale * 0.55}`}
            repeatCount="indefinite"
          />
        </feDisplacementMap>
      </filter>
    </svg>
  );
}

const TILE_CSS = `
  @keyframes seaLabDash {
    0%   { opacity: 0; transform: translate3d(0, var(--bob), 0) scaleX(var(--flip)); }
    12%  { opacity: var(--peak); }
    46%  { opacity: var(--peak); }
    62%  { opacity: 0; transform: translate3d(0, calc(var(--bob) * -1), 0) scaleX(var(--flip)); }
    100% { opacity: 0; transform: translate3d(0, calc(var(--bob) * -1), 0) scaleX(var(--flip)); }
  }
  @keyframes seaLabSweep {
    0%   { transform: translate3d(-60%, 0, 0); }
    100% { transform: translate3d(60%, 0, 0); }
  }
  @keyframes seaLabDrift {
    0%   { transform: translate3d(0, 0, 0); }
    50%  { transform: translate3d(var(--driftX), var(--driftY), 0); }
    100% { transform: translate3d(0, 0, 0); }
  }
  @keyframes seaLabDetail {
    0%   { background-position: 0 0, 0 0; }
    100% { background-position: var(--detailA), var(--detailB); }
  }
  @keyframes seaLabGlint {
    0%, 100% { opacity: 0; transform: scale(0.6); }
    50%      { opacity: var(--peak); transform: scale(1); }
  }
  @keyframes seaLabShimmer {
    0%   { -webkit-mask-position: 0 0; mask-position: 0 0; }
    100% { -webkit-mask-position: var(--shimmerShift) 0; mask-position: var(--shimmerShift) 0; }
  }
  @keyframes seaLabTint {
    0%, 100% { opacity: calc(var(--peak) * 0.22); }
    50%      { opacity: var(--peak); }
  }
  @media (prefers-reduced-motion: reduce) {
    .sea-lab-anim { animation: none !important; }
  }
`;

function VariantOverlay({ variant, crop, seed, zoom, gain }: {
  variant: VariantId;
  crop: Crop;
  seed: number;
  /** Screen px per source px of the sea painting. */
  zoom: number;
  /** Intensity multiplier: separates "too subtle to see" from "nothing to see". */
  gain: number;
}) {
  const dashes = useMemo(() => buildDashes(seed, 14), [seed]);
  const glints = useMemo(() => buildGlints(seed + 31, 16), [seed]);

  const dashLayer = (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
      {dashes.map((mark, i) => (
        <img
          key={`${mark.src}-${i}`}
          className="sea-lab-anim"
          src={`${WAVE_DIR}/${mark.src}`}
          alt=""
          aria-hidden="true"
          style={{
            position: 'absolute',
            left: `${mark.left}%`,
            top: `${mark.top}%`,
            width: `${mark.width}%`,
            opacity: 0,
            ['--peak' as string]: Math.min(1, 0.8 * gain),
            ['--bob' as string]: `${2 * zoom}px`,
            ['--flip' as string]: mark.flip,
            animationName: 'seaLabDash',
            animationDuration: '18s',
            animationTimingFunction: 'ease-in-out',
            animationIterationCount: 'infinite',
            animationDelay: `${-mark.delay}s`,
          }}
        />
      ))}
    </div>
  );

  const sweepLayer = (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', mixBlendMode: 'screen' }}>
      <div
        className="sea-lab-anim"
        style={{
          position: 'absolute',
          inset: '-20% -40%',
          background:
            `linear-gradient(105deg, rgba(255,255,255,0) 40%, rgba(214,238,244,${Math.min(0.9, 0.2 * gain)}) 50%, rgba(255,255,255,0) 60%)`,
          animationName: 'seaLabSweep',
          animationDuration: '26s',
          animationTimingFunction: 'ease-in-out',
          animationIterationCount: 'infinite',
          animationDirection: 'alternate',
        }}
      />
    </div>
  );

  switch (variant) {
    case 'dashes':
      return dashLayer;
    case 'sweep':
      return sweepLayer;
    case 'drift':
      return (
        <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
          <CropImage
            crop={crop}
            className="sea-lab-anim"
            style={{
              mixBlendMode: 'soft-light',
              opacity: Math.min(1, 0.7 * gain),
              ['--driftX' as string]: `${6 * zoom * gain}px`,
              ['--driftY' as string]: `${-3 * zoom * gain}px`,
              animationName: 'seaLabDrift',
              animationDuration: '22s',
              animationTimingFunction: 'ease-in-out',
              animationIterationCount: 'infinite',
            }}
          />
        </div>
      );
    case 'detail':
      return (
        <div
          className="sea-lab-anim"
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `url(${WATER_DIR}/water_detail_a.webp), url(${WATER_DIR}/water_detail_b.webp)`,
            backgroundRepeat: 'repeat, repeat',
            backgroundSize: `${280 * zoom}px ${280 * zoom}px, ${200 * zoom}px ${200 * zoom}px`,
            ['--detailA' as string]: `${220 * zoom}px ${60 * zoom}px`,
            ['--detailB' as string]: `${-160 * zoom}px ${90 * zoom}px`,
            opacity: Math.min(1, 0.5 * gain),
            mixBlendMode: 'soft-light',
            animationName: 'seaLabDetail',
            animationDuration: '34s',
            animationTimingFunction: 'linear',
            animationIterationCount: 'infinite',
          }}
        />
      );
    case 'glints':
      return (
        <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', mixBlendMode: 'screen' }}>
          {glints.map((g, i) => (
            <div
              key={i}
              className="sea-lab-anim"
              style={{
                position: 'absolute',
                left: `${g.left}%`,
                top: `${g.top}%`,
                width: `${g.size}%`,
                aspectRatio: '3 / 1',
                borderRadius: '50%',
                background: 'radial-gradient(ellipse, rgba(232,246,250,0.9), rgba(232,246,250,0) 70%)',
                opacity: 0,
                ['--peak' as string]: Math.min(1, 0.75 * gain),
                animationName: 'seaLabGlint',
                animationDuration: '9s',
                animationTimingFunction: 'ease-in-out',
                animationIterationCount: 'infinite',
                animationDelay: `${-g.delay}s`,
              }}
            />
          ))}
        </div>
      );
    case 'shimmer':
      return (
        <div
          className="sea-lab-anim"
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(180deg, rgba(226,242,246,0.55), rgba(226,242,246,0.15))',
            mixBlendMode: 'screen',
            opacity: Math.min(1, 0.5 * gain),
            maskImage: `repeating-linear-gradient(102deg, rgba(0,0,0,0) 0 ${26 * zoom}px, rgba(0,0,0,1) ${34 * zoom}px, rgba(0,0,0,0) ${46 * zoom}px)`,
            WebkitMaskImage: `repeating-linear-gradient(102deg, rgba(0,0,0,0) 0 ${26 * zoom}px, rgba(0,0,0,1) ${34 * zoom}px, rgba(0,0,0,0) ${46 * zoom}px)`,
            ['--shimmerShift' as string]: `${180 * zoom}px`,
            animationName: 'seaLabShimmer',
            animationDuration: '20s',
            animationTimingFunction: 'linear',
            animationIterationCount: 'infinite',
          }}
        />
      );
    case 'tint':
      return (
        <div
          className="sea-lab-anim"
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(160deg, rgba(150,196,206,1), rgba(60,92,104,1))',
            mixBlendMode: 'overlay',
            opacity: 0.05,
            ['--peak' as string]: Math.min(1, 0.22 * gain),
            animationName: 'seaLabTint',
            animationDuration: '16s',
            animationTimingFunction: 'ease-in-out',
            animationIterationCount: 'infinite',
          }}
        />
      );
    case 'combo':
      return (
        <>
          {sweepLayer}
          {dashLayer}
        </>
      );
    case 'seamarksCoast':
      return (
        <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
          <WorldSurfaceSeaMarks zIndex={1} config={coastOnlySeaMarksConfig} />
        </div>
      );
    case 'seamarksOpen':
      return (
        <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
          <WorldSurfaceSeaMarks zIndex={1} config={openOnlySeaMarksConfig} />
        </div>
      );
    case 'seamarksBoth':
      return (
        <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
          <WorldSurfaceSeaMarks zIndex={1} config={defaultSeaMarksConfig} />
        </div>
      );
    default:
      return null;
  }
}

const RIPPLE_PARAMS: Partial<Record<VariantId, { baseFrequency: number; scale: number; seconds: number }>> = {
  rippleSoft: { baseFrequency: 0.012, scale: 4, seconds: 18 },
  rippleStrong: { baseFrequency: 0.02, scale: 14, seconds: 14 },
  rippleSwell: { baseFrequency: 0.004, scale: 8, seconds: 30 },
  combo: { baseFrequency: 0.012, scale: 4, seconds: 18 },
};

function SeaTile({ variant, crop, index, showLand, zoom, gain }: {
  variant: Variant;
  crop: Crop;
  index: number;
  showLand: boolean;
  zoom: number;
  gain: number;
}) {
  const ripple = RIPPLE_PARAMS[variant.id];
  // The filter id has to carry zoom and gain: displacement `scale` is in user units,
  // so the same filter reads completely differently at two magnifications, and two
  // tiles sharing an id would silently share the wrong one.
  const filterId = ripple
    ? `seaLabRipple-${variant.id}-${crop.id}-${Math.round(zoom * 100)}-${Math.round(gain * 100)}`
    : undefined;

  return (
    <figure className="m-0 flex flex-col gap-1">
      <div
        className="relative overflow-hidden rounded border border-slate-700/70 bg-slate-900"
        style={{
          width: crop.w * SEA_W * zoom,
          height: crop.h * SEA_H * zoom,
        }}
      >
        {ripple && filterId ? (
          <RippleFilter
            id={filterId}
            baseFrequency={ripple.baseFrequency / zoom}
            scale={ripple.scale * zoom * gain}
            seconds={ripple.seconds}
          />
        ) : null}
        {showLand ? <CropBackground crop={crop} /> : null}
        <CropImage crop={crop} filterId={filterId} />
        <VariantOverlay
          variant={variant.id}
          crop={crop}
          seed={index * 977 + 13}
          zoom={zoom}
          gain={gain}
        />
      </div>
      <figcaption className="px-0.5" style={{ maxWidth: crop.w * SEA_W * zoom }}>
        <div className="text-[11px] font-semibold text-amber-200">{variant.label}</div>
        <div className="text-[10px] leading-tight text-slate-400">{variant.note}</div>
      </figcaption>
    </figure>
  );
}

export const SeaEffectLabPage: React.FC = () => {
  const [cropId, setCropId] = useState<string>(CROPS[0].id);
  const [showLand, setShowLand] = useState(true);
  // Screen px per source px of the painting. `/world-surface` shows the whole 4240px
  // canvas in roughly 1400 screen px, so map scale is about 0.33 here. Anything judged
  // at a different zoom is not being judged at the zoom the player will see.
  const [zoom, setZoom] = useState(0.33);
  const [gain, setGain] = useState(1);

  const crop = CROPS.find((c) => c.id === cropId) ?? CROPS[0];

  return (
    <div className="min-h-screen bg-slate-950 text-amber-100">
      <style>{TILE_CSS}</style>

      <header className="sticky top-0 z-10 flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-amber-700/30 bg-slate-900/95 px-4 py-2 backdrop-blur">
        <h1 className="text-base font-semibold text-amber-300">Sea Effect Lab — solo mare</h1>

        <div className="flex items-center gap-1 text-xs">
          {CROPS.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setCropId(c.id)}
              className={`rounded border px-2 py-0.5 ${
                c.id === cropId
                  ? 'border-amber-400 bg-amber-700/30 text-amber-100'
                  : 'border-slate-700 text-slate-300 hover:bg-slate-800'
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>

        <label className="flex items-center gap-1 text-xs text-slate-300">
          <input type="checkbox" checked={showLand} onChange={(e) => setShowLand(e.target.checked)} />
          Sfondo sotto il mare
        </label>

        <label className="flex items-center gap-2 text-xs text-slate-300">
          Zoom
          <input
            type="range"
            min={0.15}
            max={2}
            step={0.01}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
          />
          <span className="w-16 tabular-nums text-slate-400">
            {zoom.toFixed(2)}×{Math.abs(zoom - 0.33) < 0.02 ? ' (mappa)' : ''}
          </span>
        </label>

        <label className="flex items-center gap-2 text-xs text-slate-300">
          Intensità
          <input
            type="range"
            min={0.5}
            max={4}
            step={0.1}
            value={gain}
            onChange={(e) => setGain(Number(e.target.value))}
          />
          <span className="w-10 tabular-nums text-slate-400">{gain.toFixed(1)}×</span>
        </label>

        <button
          type="button"
          onClick={() => { setZoom(0.33); setGain(1); }}
          className="rounded border border-slate-700 px-2 py-0.5 text-xs text-slate-300 hover:bg-slate-800"
        >
          Reset
        </button>

        <a
          href="/test-hub"
          className="ml-auto rounded border border-amber-700/40 px-3 py-1 text-xs hover:bg-amber-700/20"
        >
          Test Hub
        </a>
      </header>

      <p className="px-4 pt-2 text-[11px] leading-snug text-slate-500">
        Intensità alza l\'effetto oltre il valore di produzione: serve a distinguere «troppo
        debole per vedersi» da «non c\'è niente da vedere». Un effetto che resta invisibile a 4×
        non è tarato male — è la tecnica che non ha presa su quel dipinto.
      </p>

      <main className="flex flex-wrap items-start gap-4 p-4">
        {VARIANTS.map((variant, i) => (
          <SeaTile
            key={variant.id}
            variant={variant}
            crop={crop}
            index={i}
            showLand={showLand}
            zoom={zoom}
            gain={gain}
          />
        ))}
      </main>
    </div>
  );
};

export default SeaEffectLabPage;
