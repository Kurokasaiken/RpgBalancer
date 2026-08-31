import React, { useCallback, useEffect, useRef, useState } from 'react';
import defaultBackgroundImage from '@/assets/ui/idleVillage/goblin-invasion-libro-background.jpg';
import defaultGoblinImage from '@/assets/ui/idleVillage/goblin-invasion-transparent-no-sticker.png';
import defaultGoblinImageWithBorder from '@/assets/ui/idleVillage/goblin-march-trasparente.png';

export interface GoblinInvasionWindowProps {
  /** Accessible name for the scene. Pass an i18n-resolved string if it is not purely decorative. */
  ariaLabel?: string;
  /** Additional CSS class. */
  className?: string;
  /** Inline styles for the root element. */
  style?: React.CSSProperties;
  /** Background image URL. */
  backgroundImage?: string;
  /** Base goblin image (without sticker border). */
  goblinImage?: string;
  /** Goblin image with the sticker border. */
  goblinImageWithBorder?: string;
  /** If provided, the peeled sticker state is controlled from outside. */
  peeled?: boolean;
}

const W = 520;
const H = 420;
const RIM = 22;
const INNER_W = W - RIM * 2;
const INNER_H = H - RIM * 2;
const RX = 16;

const BUDGET = { dust: 16, ash: 6, ember: 2 };

function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReduced(mq.matches);
    update();
    if ('addEventListener' in mq) {
      mq.addEventListener('change', update);
      return () => mq.removeEventListener('change', update);
    }
    (mq as MediaQueryList).addListener(update);
    return () => (mq as MediaQueryList).removeListener(update);
  }, []);
  return reduced;
}

type Kind = 'dust' | 'ash' | 'ember';

interface Mote {
  x: number;
  y: number;
  r: number;
  vx: number;
  vy: number;
  o: number;
  kind: Kind;
}

function createMotes(w: number, h: number): Mote[] {
  const out: Mote[] = [];
  for (let i = 0; i < BUDGET.dust; i++) {
    out.push({
      x: Math.random() * w, y: Math.random() * h,
      r: 1 + Math.random() * 0.6,
      vx: (Math.random() - 0.5) * 0.06,
      vy: (Math.random() - 0.5) * 0.04,
      o: 0.12 + Math.random() * 0.08,
      kind: 'dust',
    });
  }
  for (let i = 0; i < BUDGET.ash; i++) {
    out.push({
      x: Math.random() * w, y: Math.random() * h,
      r: 1.8 + Math.random() * 1.2,
      vx: (Math.random() - 0.5) * 0.12,
      vy: (Math.random() - 0.5) * 0.06,
      o: 0.25 + Math.random() * 0.12,
      kind: 'ash',
    });
  }
  for (let i = 0; i < BUDGET.ember; i++) {
    out.push({
      x: Math.random() * w, y: Math.random() * h,
      r: 2 + Math.random() * 1,
      vx: (Math.random() - 0.5) * 0.3,
      vy: -0.05 - Math.random() * 0.25,
      o: 0.55 + Math.random() * 0.2,
      kind: 'ember',
    });
  }
  return out;
}

const DustCanvas: React.FC<{ mx: number; my: number; active: boolean }> = ({ mx, my, active }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const motesRef = useRef<Mote[]>([]);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (!active) return undefined;
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    const ctx = canvas.getContext('2d');
    if (!ctx) return undefined;

    if (motesRef.current.length === 0) {
      motesRef.current = createMotes(INNER_W, INNER_H);
    }

    const loop = () => {
      ctx.clearRect(0, 0, INNER_W, INNER_H);
      const t = Date.now() * 0.0005;
      for (const m of motesRef.current) {
        m.x += m.vx + mx * (m.kind === 'dust' ? 0.2 : m.kind === 'ash' ? 0.5 : 1.2);
        m.y += m.vy + my * (m.kind === 'dust' ? 0.05 : m.kind === 'ash' ? 0.1 : 0.25);
        if (m.y < -8) m.y = INNER_H + 8;
        if (m.y > INNER_H + 8) m.y = -8;
        if (m.x < -8) m.x = INNER_W + 8;
        if (m.x > INNER_W + 8) m.x = -8;
        const flicker = 1 + Math.sin(t + m.x * 0.1 + m.y * 0.05) * 0.2;
        ctx.beginPath();
        ctx.arc(m.x, m.y, m.r, 0, Math.PI * 2);
        ctx.fillStyle = m.kind === 'ember'
          ? `rgba(255,170,60,${m.o * flicker})`
          : `rgba(210,195,160,${m.o * flicker})`;
        ctx.fill();
      }
      rafRef.current = requestAnimationFrame(loop);
    };

    loop();
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [active, mx, my]);

  return (
    <canvas
      ref={canvasRef}
      width={INNER_W}
      height={INNER_H}
      style={{
        position: 'absolute',
        top: RIM,
        left: RIM,
        width: INNER_W,
        height: INNER_H,
        borderRadius: 16,
        pointerEvents: 'none',
        zIndex: 7,
      }}
      aria-hidden="true"
    />
  );
};

/**
 * `GoblinInvasionWindow` — a 2.5D glass case for the Goblin Invasion event.
 *
 * The frame is a rectangular adaptation of the WanderlustMedalOverlay bronze
 * ladder: dark oxidized bronze body, NMM bevel, inner ring, patina, glass and
 * solar light.  No gold; only bronze and the warm light that strikes it.
 */
export const GoblinInvasionWindow: React.FC<GoblinInvasionWindowProps> = ({
  ariaLabel,
  className,
  style,
  backgroundImage = defaultBackgroundImage,
  goblinImage = defaultGoblinImage,
  goblinImageWithBorder = defaultGoblinImageWithBorder,
  peeled: peeledProp,
}) => {
  const [internalPeeled, setInternalPeeled] = useState(false);
  const isPeeled = peeledProp !== undefined ? peeledProp : internalPeeled;
  const [mx, setMx] = useState(0);
  const [my, setMy] = useState(0);
  const reduced = useReducedMotion();
  const rootRef = useRef<HTMLDivElement>(null);
  const uid = React.useId().replace(/:/g, '');

  const handlePointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (!rootRef.current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    setMx((x - 0.5) * 2);
    setMy((y - 0.5) * 2);
  }, []);

  const handleLeave = useCallback(() => {
    setMx(0);
    setMy(0);
  }, []);

  return (
    <div
      ref={rootRef}
      className={className}
      onClick={() => peeledProp === undefined && setInternalPeeled((p) => !p)}
      onPointerMove={reduced ? undefined : handlePointerMove}
      onPointerLeave={reduced ? undefined : handleLeave}
      style={{
        position: 'relative',
        width: W,
        height: H,
        borderRadius: RX,
        overflow: 'hidden',
        cursor: 'pointer',
        boxShadow: '0 22px 50px rgba(0,0,0,0.65), 0 10px 24px rgba(0,0,0,0.45)',
        '--mx': mx,
        '--my': my,
        ...style,
      } as React.CSSProperties}
      role="img"
      aria-label={ariaLabel}
      aria-hidden={!ariaLabel}
    >
      {/* Bronze rectangular frame derived from the medal ladder */}
      <svg width={W} height={H} style={{ position: 'absolute', inset: 0, zIndex: 1 }} aria-hidden="true">
        <defs>
          <clipPath id={`c-body-${uid}`}>
            <rect x={0} y={0} width={W} height={H} rx={RX} />
          </clipPath>
          <clipPath id={`c-field-${uid}`}>
            <rect x={RIM} y={RIM} width={INNER_W} height={INNER_H} rx={RX - 8} />
          </clipPath>

          {/* L1: Bronze outer body — NMM ladder */}
          <linearGradient id={`g-b-${uid}`} x1="14%" y1="4%" x2="86%" y2="96%">
            <stop offset="0%" stopColor="#f0cf6a" />
            <stop offset="9%" stopColor="#dfb857" />
            <stop offset="28%" stopColor="#8a5a20" />
            <stop offset="52%" stopColor="#060f16" />
            <stop offset="76%" stopColor="#060f16" />
            <stop offset="100%" stopColor="#060f16" />
          </linearGradient>

          {/* Bevel diagonal */}
          <linearGradient id={`g-bv-${uid}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="rgba(255,240,165,.30)" />
            <stop offset="22%" stopColor="rgba(255,225,135,.09)" />
            <stop offset="58%" stopColor="rgba(255,210,100,.02)" />
            <stop offset="100%" stopColor="rgba(0,0,0,.62)" />
          </linearGradient>

          {/* Inner ring */}
          <linearGradient id={`g-ri-${uid}`} x1="12%" y1="8%" x2="88%" y2="92%">
            <stop offset="0%" stopColor="#f0cf6a" />
            <stop offset="16%" stopColor="#dfb857" />
            <stop offset="46%" stopColor="#8a5a20" />
            <stop offset="80%" stopColor="#060f16" />
            <stop offset="100%" stopColor="#060f16" />
          </linearGradient>

          {/* Field stone */}
          <radialGradient id={`g-f-${uid}`} cx="40%" cy="33%" r="70%">
            <stop offset="0%" stopColor="#0c1517" />
            <stop offset="38%" stopColor="#060f16" />
            <stop offset="72%" stopColor="#060f16" />
            <stop offset="100%" stopColor="#050a0d" />
          </radialGradient>

          {/* Specular soft */}
          <radialGradient id={`g-sp-${uid}`} cx="26%" cy="20%" r="56%">
            <stop offset="0%" stopColor="rgba(255,245,200,.22)" />
            <stop offset="42%" stopColor="rgba(255,232,168,.05)" />
            <stop offset="100%" stopColor="rgba(255,220,140,0)" />
          </radialGradient>

          {/* Glass gradients */}
          <radialGradient id={`g-glass-${uid}`} cx="50%" cy="48%" r="52%">
            <stop offset="0%" stopColor="rgba(220,235,255,0)" />
            <stop offset="60%" stopColor="rgba(200,220,255,.10)" />
            <stop offset="100%" stopColor="rgba(180,210,255,.22)" />
          </radialGradient>
          <radialGradient id={`g-glass-hl-${uid}`} cx="28%" cy="22%" r="48%">
            <stop offset="0%" stopColor="rgba(255,255,255,.65)" />
            <stop offset="35%" stopColor="rgba(255,255,255,.26)" />
            <stop offset="70%" stopColor="rgba(255,255,255,.08)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0)" />
          </radialGradient>
          <radialGradient id={`g-glass-b-${uid}`} cx="74%" cy="78%" r="32%">
            <stop offset="0%" stopColor="rgba(255,255,255,.18)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0)" />
          </radialGradient>

          {/* Texture noise */}
          <filter id={`f-nm-${uid}`} x="0%" y="0%" width="100%" height="100%">
            <feTurbulence type="fractalNoise" baseFrequency="0.52" numOctaves={4} seed="3" stitchTiles="stitch" result="n" />
            <feColorMatrix in="n" type="matrix" values="0 0 0 0 .020  0 0 0 0 .030  0 0 0 0 .040  0 0 0 .25 0" result="c" />
            <feBlend in="SourceGraphic" in2="c" mode="overlay" />
          </filter>

          <filter id={`f-fs-${uid}`} x="0%" y="0%" width="100%" height="100%">
            <feTurbulence type="fractalNoise" baseFrequency="0.90" numOctaves={5} seed="11" stitchTiles="stitch" result="n" />
            <feColorMatrix in="n" type="matrix" values="0 0 0 0 .020  0 0 0 0 .030  0 0 0 0 .040  0 0 0 .18 0" result="c" />
            <feBlend in="SourceGraphic" in2="c" mode="overlay" />
          </filter>

          <filter id={`f-dp-${uid}`} x="0%" y="0%" width="100%" height="100%">
            <feTurbulence type="turbulence" baseFrequency="0.030" numOctaves={3} seed="7" result="t" />
            <feDisplacementMap in="SourceGraphic" in2="t" scale="3.5" xChannelSelector="R" yChannelSelector="G" />
          </filter>

          <filter id={`f-patina-${uid}`} x="-20%" y="-20%" width="140%" height="140%">
            <feTurbulence type="fractalNoise" baseFrequency="0.15" numOctaves={3} seed="42" result="noise" />
            <feDisplacementMap in="SourceGraphic" in2="noise" scale="2.5" xChannelSelector="R" yChannelSelector="G" />
          </filter>

          <filter id={`f-gl-${uid}`} x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="1.5" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* BODY */}
        <g clipPath={`url(#c-body-${uid})`}>
          {/* L1: Bronze outer body + texture + bevel */}
          <rect x={0} y={0} width={W} height={H} rx={RX} fill="#060f16" />
          <rect x={0} y={0} width={W} height={H} rx={RX} fill={`url(#g-b-${uid})`} filter="url(#f-nm)" opacity={0.90} />
          <rect x={0} y={0} width={W} height={H} rx={RX} fill={`url(#g-bv-${uid})`} filter="url(#f-dp)" opacity={0.48} />

          {/* L2: Rim top — arcs of warm light become rectangular dashes */}
          <rect x={4} y={4} width={W - 8} height={H - 8} rx={RX - 4} fill="none"
            stroke="rgba(240,207,106,.26)" strokeWidth="3.5"
            strokeDasharray={`${W * 0.42} ${(W + H) * 2}`}
            strokeDashoffset={-W * 0.08}
            strokeLinecap="round" filter="url(#f-gl)" />
          <rect x={5} y={5} width={W - 10} height={H - 10} rx={RX - 5} fill="none"
            stroke="rgba(240,207,106,.68)" strokeWidth="0.9"
            strokeDasharray={`${W * 0.28} ${(W + H) * 2}`}
            strokeDashoffset={-W * 0.18}
            strokeLinecap="round" />

          {/* L3: Inner ring separator */}
          <rect x={RIM - 6} y={RIM - 6} width={INNER_W + 12} height={INNER_H + 12} rx={RX - 4} fill="#060f16" />
          <rect x={RIM - 6} y={RIM - 6} width={INNER_W + 12} height={INNER_H + 12} rx={RX - 4} fill={`url(#g-ri-${uid})`} filter="url(#f-nm)" opacity={0.68} />
          <rect x={RIM - 6} y={RIM - 6} width={INNER_W + 12} height={INNER_H + 12} rx={RX - 4} fill="none"
            stroke="rgba(0,0,0,.75)" strokeWidth="2.2" transform="translate(0.3, 0.35)" />
          <rect x={RIM - 5} y={RIM - 5} width={INNER_W + 10} height={INNER_H + 10} rx={RX - 5} fill="none"
            stroke="rgba(240,207,106,.18)" strokeWidth="0.8" />

          {/* L4: Field stone */}
          <rect x={RIM} y={RIM} width={INNER_W} height={INNER_H} rx={RX - 8} fill={`url(#g-f-${uid})`} />
          <rect x={RIM} y={RIM} width={INNER_W} height={INNER_H} rx={RX - 8} fill={`url(#g-f-${uid})`} filter="url(#f-fs)" opacity={0.56} />
          <rect x={RIM} y={RIM} width={INNER_W} height={INNER_H} rx={RX - 8} fill={`url(#g-sp-${uid})`} />

          {/* L7: Patina spots */}
          <ellipse cx={RIM - 10} cy={RIM - 6} rx="6" ry="5" fill="rgba(34,18,8,.40)" filter="url(#f-patina)" />
          <ellipse cx={RIM - 14} cy={RIM - 1} rx="3.5" ry="3" fill="rgba(28,14,6,.32)" filter="url(#f-patina)" />
          <ellipse cx={W - RIM + 10} cy={RIM - 6} rx="5.5" ry="4.5" fill="rgba(32,16,8,.36)" filter="url(#f-patina)" />
          <ellipse cx={RIM - 6} cy={H - RIM + 6} rx="4.5" ry="4" fill="rgba(32,16,8,.34)" filter="url(#f-patina)" />
          <ellipse cx={W - RIM + 6} cy={H - RIM + 4} rx="4" ry="3.5" fill="rgba(28,14,6,.30)" filter="url(#f-patina)" />
          <ellipse cx={W / 2} cy={RIM - 6} rx="3.5" ry="3" fill="rgba(36,20,8,.22)" filter="url(#f-patina)" />

          {/* Scratches */}
          <line x1={RIM - 14} y1={H / 2 - 4} x2={RIM - 6} y2={H / 2 + 4} stroke="rgba(0,0,0,.44)" strokeWidth="1.2" strokeLinecap="round" />
          <line x1={W - RIM + 6} y1={H / 2 - 2} x2={W - RIM + 14} y2={H / 2 + 6} stroke="rgba(0,0,0,.36)" strokeWidth="1" strokeLinecap="round" />
          <line x1={RIM + 10} y1={H - RIM + 6} x2={RIM + 18} y2={H - RIM + 10} stroke="rgba(0,0,0,.32)" strokeWidth="0.9" strokeLinecap="round" />
          <line x1={W - RIM - 10} y1={H - RIM + 6} x2={W - RIM - 2} y2={H - RIM + 10} stroke="rgba(0,0,0,.28)" strokeWidth="0.8" strokeLinecap="round" />

          {/* Oxidation streaks */}
          <line x1={RIM - 12} y1={RIM - 2} x2={RIM - 4} y2={RIM + 10} stroke="rgba(72,92,52,.20)" strokeWidth="1.4" strokeLinecap="round" />
          <line x1={W - RIM + 4} y1={H - RIM - 8} x2={W - RIM + 12} y2={H - RIM + 2} stroke="rgba(72,92,52,.16)" strokeWidth="1.1" strokeLinecap="round" />
        </g>
      </svg>

      {/* Diorama */}
      <div
        style={{
          position: 'absolute',
          top: RIM,
          left: RIM,
          width: INNER_W,
          height: INNER_H,
          borderRadius: RX - 8,
          overflow: 'hidden',
          transform: reduced
            ? 'none'
            : `perspective(900px) rotateX(calc(var(--my) * -2deg)) rotateY(calc(var(--mx) * 3deg))`,
          zIndex: 4,
        }}
      >
        <img
          src={backgroundImage}
          alt=""
          loading="lazy"
          style={{
            position: 'absolute',
            width: '108%',
            height: '108%',
            left: '-4%',
            top: '-4%',
            objectFit: 'cover',
            transform: reduced
              ? 'none'
              : `translate3d(calc(var(--mx) * 6px), calc(var(--my) * 3px), 0)`,
          }}
        />
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'radial-gradient(ellipse at 45% 40%, transparent 0%, rgba(6,15,22,.55) 65%, rgba(5,10,13,.85) 100%)',
            mixBlendMode: 'multiply',
          }}
        />
        <img
          src={goblinImage}
          alt=""
          style={{
            position: 'absolute',
            width: '100%',
            height: '100%',
            objectFit: 'contain',
            transform: reduced
              ? 'none'
              : `translate3d(calc(var(--mx) * 18px), calc(var(--my) * 12px), 0)`,
          }}
        />
        <img
          src={goblinImageWithBorder}
          alt=""
          style={{
            position: 'absolute',
            width: '100%',
            height: '100%',
            objectFit: 'contain',
            clipPath: isPeeled
              ? 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)'
              : 'polygon(0% 0%, 0% 0%, 0% 100%, 0% 100%)',
            transition: reduced ? 'none' : (isPeeled ? 'clip-path 0.9s cubic-bezier(0.22, 1, 0.36, 1)' : 'clip-path 0.08s ease-out'),
            transform: reduced
              ? 'none'
              : `translate3d(calc(var(--mx) * 18px), calc(var(--my) * 12px), 0)`,
            filter: isPeeled ? 'drop-shadow(8px 0 18px rgba(0,0,0,0.55))' : 'none',
          }}
        />

        {/* Golden light */}
        <div
          style={{
            position: 'absolute',
            top: '-20%',
            left: '-10%',
            width: '70%',
            height: '140%',
            background: 'linear-gradient(115deg, transparent 35%, rgba(255,205,100,.28) 45%, rgba(255,235,180,.42) 50%, transparent 60%)',
            filter: 'blur(22px)',
            mixBlendMode: 'screen',
            opacity: 1.0,
            animation: reduced ? 'none' : 'window-light-breathe 6s ease-in-out infinite',
            transform: reduced
              ? 'rotate(18deg)'
              : 'rotate(18deg) translate3d(calc(var(--mx) * -24px), calc(var(--my) * -18px), 0)',
            transition: reduced ? 'none' : 'transform 100ms ease-out',
            pointerEvents: 'none',
            zIndex: 6,
          }}
        />

        {/* Atmosphere fog */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'radial-gradient(ellipse at 50% 45%, rgba(220,190,130,.18), transparent 65%)',
            mixBlendMode: 'screen',
            pointerEvents: 'none',
            zIndex: 6,
          }}
        />

        {/* Caustic light pools — warm and cool spots that slide with the glass */}
        <div
          style={{
            position: 'absolute',
            inset: '-12px',
            borderRadius: 'inherit',
            background: `
              radial-gradient(circle at 30% 25%, rgba(255,230,160,.20) 0%, transparent 30%),
              radial-gradient(circle at 70% 70%, rgba(160,230,255,.14) 0%, transparent 28%)
            `,
            mixBlendMode: 'screen',
            pointerEvents: 'none',
            zIndex: 5,
            transform: reduced
              ? 'none'
              : 'translate3d(calc(var(--mx) * -18px), calc(var(--my) * -14px), 0)',
            transition: reduced ? 'none' : 'transform 100ms ease-out',
          }}
        />

        {/* Dust motes */}
        <DustCanvas mx={mx} my={my} active={!reduced} />

        {/* Glass — derived from WanderlustMedalOverlay convex crystal */}
        <svg
          width={INNER_W}
          height={INNER_H}
          viewBox={`0 0 ${INNER_W} ${INNER_H}`}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            borderRadius: RX - 8,
            pointerEvents: 'none',
            zIndex: 8,
            transform: reduced
              ? 'none'
              : `translate3d(calc(var(--mx) * 10px), calc(var(--my) * 8px), 0)`,
            transition: reduced ? 'none' : 'transform 100ms ease-out',
          }}
          aria-hidden="true"
        >
          <g clipPath={`url(#c-field-${uid})`}>
            <rect x={0} y={0} width={INNER_W} height={INNER_H} fill={`url(#g-glass-${uid})`} />
            <rect x={0} y={0} width={INNER_W} height={INNER_H} fill={`url(#g-glass-hl-${uid})`} />
            <rect x={0} y={0} width={INNER_W} height={INNER_H} fill={`url(#g-glass-b-${uid})`} />
            <rect x={2} y={2} width={INNER_W - 4} height={INNER_H - 4} rx={RX - 10} fill="none"
              stroke="rgba(255,255,255,.45)" strokeWidth="0.9"
              strokeDasharray={`${INNER_W * 0.35} ${(INNER_W + INNER_H) * 2}`}
              strokeDashoffset={-INNER_W * 0.05}
              strokeLinecap="round" />
            <rect x={2} y={2} width={INNER_W - 4} height={INNER_H - 4} rx={RX - 10} fill="none"
              stroke="rgba(0,0,0,.30)" strokeWidth="0.5"
              strokeDasharray={`${INNER_W * 0.33} ${(INNER_W + INNER_H) * 2}`}
              strokeDashoffset={-INNER_W * 0.65}
              strokeLinecap="round" />
          </g>
        </svg>

        {/* Vignette */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: RX - 8,
            background: 'radial-gradient(ellipse at 50% 45%, transparent 40%, rgba(0,0,0,.45) 100%)',
            pointerEvents: 'none',
            zIndex: 9,
          }}
        />
      </div>
    </div>
  );
};

export default GoblinInvasionWindow;
