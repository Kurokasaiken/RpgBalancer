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

const BUDGET = { dust: 16, ash: 6, ember: 2 };

const OUTER_CLIP = 'polygon(2% 0%, 98% 0%, 100% 3%, 99.3% 96%, 96% 100%, 4% 100%, 0% 97%, 1% 3%)';
const INNER_CLIP = 'polygon(1% 0%, 99% 0%, 100% 2%, 99.5% 98%, 98% 100%, 2% 100%, 0% 98%, 0.5% 2%)';

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
        borderRadius: 8,
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
 * Carved timber + dark bronze frame, narrative golden light, three particle families,
 * convex glass and a physical sticker reveal.
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
        padding: RIM,
        clipPath: OUTER_CLIP,
        cursor: 'pointer',
        background: `
          linear-gradient(135deg, rgba(255,220,145,.35), transparent 12%),
          linear-gradient(155deg, #67451f 0%, #4a3015 18%, #3b2718 52%, #5c3c1d 82%, #7a5225 100%)
        `,
        boxShadow: `
          0 22px 50px rgba(0,0,0,0.65),
          0 10px 24px rgba(0,0,0,0.45),
          inset 0 1px 0 rgba(255,235,170,.45),
          inset 0 -4px 8px rgba(0,0,0,.65)
        `,
        '--mx': mx,
        '--my': my,
        ...style,
      } as React.CSSProperties}
      role="img"
      aria-label={ariaLabel}
      aria-hidden={!ariaLabel}
    >
      {/* Bevel / highlight plane */}
      <div
        style={{
          position: 'absolute',
          inset: 8,
          clipPath: OUTER_CLIP,
          background: `
            linear-gradient(145deg, rgba(255,238,180,.55), transparent 14%),
            linear-gradient(325deg, rgba(15,7,2,.65), transparent 22%)
          `,
          zIndex: 2,
          pointerEvents: 'none',
        }}
      />

      {/* Secondary carved plane */}
      <div
        style={{
          position: 'absolute',
          inset: 14,
          clipPath: INNER_CLIP,
          background: `
            linear-gradient(180deg, rgba(255,222,142,.35), transparent 8%),
            linear-gradient(0deg, rgba(0,0,0,.55), transparent 15%),
            #1b110b
          `,
          boxShadow: `
            inset 0 1px 0 rgba(255,255,255,.25),
            inset 0 -2px 4px rgba(0,0,0,.7)
          `,
          zIndex: 3,
          pointerEvents: 'none',
        }}
      />

      {/* Inner rim light — discontinuous */}
      <div
        style={{
          position: 'absolute',
          inset: 14,
          clipPath: INNER_CLIP,
          border: '1px solid transparent',
          borderTopColor: 'rgba(240,207,106,.45)',
          borderLeftColor: 'rgba(240,207,106,.22)',
          borderBottomColor: 'rgba(0,0,0,.55)',
          borderRightColor: 'rgba(0,0,0,.35)',
          zIndex: 4,
          pointerEvents: 'none',
        }}
      />

      {/* Diorama */}
      <div
        style={{
          position: 'relative',
          width: INNER_W,
          height: INNER_H,
          clipPath: INNER_CLIP,
          overflow: 'hidden',
          transform: reduced
            ? 'none'
            : `perspective(900px) rotateX(calc(var(--my) * -1deg)) rotateY(calc(var(--mx) * 1.5deg))`,
          zIndex: 5,
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
            transition: reduced
              ? 'none'
              : 'clip-path 0.9s cubic-bezier(0.22, 1, 0.36, 1), transform 0.9s cubic-bezier(0.22, 1, 0.36, 1)',
            transform: reduced
              ? 'none'
              : `translate3d(calc(var(--mx) * 9px - ${isPeeled ? 0 : 60}px), calc(var(--my) * 6px + ${isPeeled ? 0 : 20}px), 0) scale(${isPeeled ? 1 : 0.97})`,
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
              background: 'linear-gradient(135deg, rgba(255,255,255,.16), transparent 20%, transparent 80%, rgba(255,220,150,.08))',
            }}
          />
        </div>

        {/* Vignette */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'radial-gradient(ellipse at 50% 45%, transparent 40%, rgba(0,0,0,.45) 100%)',
            pointerEvents: 'none',
            zIndex: 9,
          }}
        />
      </div>

      {/* Contact shadow between frame and diorama */}
      <div
        style={{
          position: 'absolute',
          top: RIM,
          left: RIM,
          width: INNER_W,
          height: INNER_H,
          clipPath: INNER_CLIP,
          pointerEvents: 'none',
          zIndex: 10,
          boxShadow: `
            inset 0 0 0 1px rgba(255,220,150,.12),
            inset 0 0 18px rgba(0,0,0,.75),
            inset 0 -10px 20px rgba(0,0,0,.28)
          `,
        }}
      />
    </div>
  );
};

export default GoblinInvasionWindow;
