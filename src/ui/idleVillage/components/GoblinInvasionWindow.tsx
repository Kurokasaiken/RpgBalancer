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
  /** Frame prototype level: A structural, B material, C history. */
  variant?: 'A' | 'B' | 'C';
  /** If provided, the peeled sticker state is controlled from outside. */
  peeled?: boolean;
}

const W = 520;
const H = 420;
const RIM = 26;
const INNER_W = W - RIM * 2;
const INNER_H = H - RIM * 2;
const RX = 24;

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
 * Material bronze frame, narrative golden light, three particle families,
 * convex glass and a physical sticker reveal.
 */
export const GoblinInvasionWindow: React.FC<GoblinInvasionWindowProps> = ({
  ariaLabel,
  className,
  style,
  backgroundImage = defaultBackgroundImage,
  goblinImage = defaultGoblinImage,
  goblinImageWithBorder = defaultGoblinImageWithBorder,
  variant = 'C',
  peeled: peeledProp,
}) => {
  const [internalPeeled, setInternalPeeled] = useState(false);
  const isPeeled = peeledProp !== undefined ? peeledProp : internalPeeled;
  const [mx, setMx] = useState(0);
  const [my, setMy] = useState(0);
  const reduced = useReducedMotion();
  const rootRef = useRef<HTMLDivElement>(null);
  const uid = React.useId();

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
      {/* Material frame */}
      <svg width={W} height={H} style={{ position: 'absolute', inset: 0, zIndex: 1 }} aria-hidden="true">
        <defs>
          <linearGradient id={`bronze-${uid}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#c9a45c" />
            <stop offset="22%" stopColor="#8a5a20" />
            <stop offset="55%" stopColor="#4a2810" />
            <stop offset="85%" stopColor="#1f1208" />
            <stop offset="100%" stopColor="#140a05" />
          </linearGradient>
          {variant !== 'A' && (
            <filter id={`noise-${uid}`} x="0%" y="0%" width="100%" height="100%">
              <feTurbulence type="fractalNoise" baseFrequency="0.52" numOctaves={variant === 'C' ? 4 : 3} seed="7" result="n" />
              <feColorMatrix in="n" type="matrix" values="0 0 0 0 .45  0 0 0 0 .35  0 0 0 0 .22  0 0 0 .15 0" result="c" />
              <feBlend in="SourceGraphic" in2="c" mode="overlay" />
            </filter>
          )}
          {variant !== 'A' && (
            <linearGradient id={`patina-${uid}`} x1="0%" y1="100%" x2="0%" y2="0%">
              <stop offset="0%" stopColor="#0b2a26" stopOpacity={0.55} />
              <stop offset="55%" stopColor="#1a3d36" stopOpacity={0.2} />
              <stop offset="100%" stopColor="transparent" />
            </linearGradient>
          )}
        </defs>
        <rect
          x={0} y={0} width={W} height={H} rx={RX}
          fill={`url(#bronze-${uid})`}
          filter={variant !== 'A' ? `url(#noise-${uid})` : undefined}
        />
        {variant !== 'A' && (
          <path d="M0 360 Q260 430 520 370 L520 420 L0 420 Z" fill={`url(#patina-${uid})`} style={{ mixBlendMode: 'multiply' }} />
        )}
        {variant === 'C' && (
          <path d="M500 0 Q530 210 480 420 L520 420 L520 0 Z" fill="#0b2a26" opacity={0.25} style={{ mixBlendMode: 'multiply' }} />
        )}
        {variant !== 'A' && (
          <>
            <rect x={6} y={6} width={W - 12} height={H - 12} rx={RX - 6} fill="none" stroke="rgba(240,207,106,.2)" strokeWidth={1.5} />
            <rect x={10} y={10} width={W - 20} height={H - 20} rx={RX - 10} fill="none" stroke="rgba(0,0,0,.5)" strokeWidth={2} />
          </>
        )}
        {variant === 'C' && (
          <>
            <path d="M22 38 L34 41 L22 44 Z" fill="#0a0502" opacity={0.7} />
            <path d="M498 78 L486 81 L498 84 Z" fill="#0a0502" opacity={0.6} />
            <path d="M42 398 L54 395 L42 392 Z" fill="#0a0502" opacity={0.5} />
            <path d="M470 60 Q500 120 490 180" stroke="#c9a45c" strokeWidth="1" strokeOpacity={0.25} fill="none" filter="blur(1px)" />
            <path d="M60 390 Q120 396 180 382" stroke="#f0cf6a" strokeWidth="0.8" strokeOpacity={0.18} fill="none" filter="blur(1px)" />
          </>
        )}
      </svg>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: RX,
          boxShadow: 'inset 0 1px 0 rgba(255,245,200,.28), inset 0 -4px 10px rgba(0,0,0,.55)',
          zIndex: 2,
          pointerEvents: 'none',
        }}
      />
      <div
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: RX,
          border: '1px solid transparent',
          borderTopColor: 'rgba(240,207,106,.4)',
          borderLeftColor: 'rgba(240,207,106,.2)',
          zIndex: 3,
          pointerEvents: 'none',
        }}
      />

      {/* Diorama */}
      <div
        style={{
          position: 'absolute',
          top: RIM,
          left: RIM,
          width: INNER_W,
          height: INNER_H,
          borderRadius: 16,
          overflow: 'hidden',
          transform: reduced
            ? 'none'
            : `perspective(900px) rotateX(calc(var(--my) * -1deg)) rotateY(calc(var(--mx) * 1.5deg))`,
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
              : `translate3d(calc(var(--mx) * 2px), calc(var(--my) * 1px), 0)`,
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
              : `translate3d(calc(var(--mx) * 7px), calc(var(--my) * 4px), 0)`,
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
            transition: reduced ? 'none' : 'clip-path 0.9s cubic-bezier(0.22, 1, 0.36, 1)',
            transform: reduced
              ? 'none'
              : `translate3d(calc(var(--mx) * 7px), calc(var(--my) * 4px), 0)`,
            filter: peeled ? 'drop-shadow(8px 0 18px rgba(0,0,0,0.55))' : 'none',
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
            background: 'linear-gradient(115deg, transparent 35%, rgba(255,205,100,.14) 45%, rgba(255,235,180,.24) 50%, transparent 60%)',
            filter: 'blur(22px)',
            mixBlendMode: 'screen',
            opacity: 0.75,
            animation: reduced ? 'none' : 'window-light-breathe 6s ease-in-out infinite',
            transform: reduced
              ? 'rotate(18deg)'
              : 'rotate(18deg) translateX(calc(var(--mx) * -8px))',
            pointerEvents: 'none',
            zIndex: 6,
          }}
        />

        {/* Atmosphere fog */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'radial-gradient(ellipse at 50% 45%, rgba(220,190,130,.06), transparent 65%)',
            mixBlendMode: 'screen',
            pointerEvents: 'none',
            zIndex: 6,
          }}
        />

        {/* Dust motes */}
        <DustCanvas mx={mx} my={my} active={!reduced} />

        {/* Glass */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: 16,
            pointerEvents: 'none',
            zIndex: 8,
            background: `
              linear-gradient(125deg, transparent 35%, rgba(255,255,255,.06) 45%, rgba(255,255,255,.14) 48%, transparent 56%),
              linear-gradient(-45deg, transparent 65%, rgba(255,255,255,.04) 95%)
            `,
            transform: reduced ? 'none' : `translateX(calc(var(--mx) * 4px))`,
            boxShadow: `
              inset 0 1px 0 rgba(255,255,255,.35),
              inset 1px 0 0 rgba(255,255,255,.15),
              inset 0 -2px 6px rgba(0,0,0,.45),
              inset 0 0 18px rgba(180,210,255,.05)
            `,
          }}
        >
          <div
            style={{
              position: 'absolute',
              inset: 0,
              borderRadius: 16,
              background: 'linear-gradient(135deg, rgba(255,255,255,.16), transparent 20%, transparent 80%, rgba(255,220,150,.08))',
            }}
          />
        </div>

        {/* Vignette */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: 16,
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
