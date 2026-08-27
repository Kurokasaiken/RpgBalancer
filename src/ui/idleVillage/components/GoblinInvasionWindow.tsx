import React, { useEffect, useRef, useCallback } from 'react';
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
}

const W = 520;
const H = 420;
const RIM = 26;
const INNER_W = W - RIM * 2;
const INNER_H = H - RIM * 2;
const RX = 24;

function useReducedMotion(): boolean {
  const [reduced, setReduced] = React.useState(false);
  React.useEffect(() => {
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

type Depth = 'far' | 'mid' | 'front';

interface Mote {
  x: number;
  y: number;
  r: number;
  vx: number;
  vy: number;
  o: number;
  depth: Depth;
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
      const depths: Depth[] = ['far', 'far', 'mid', 'mid', 'mid', 'front', 'front', 'front'];
      motesRef.current = depths.map((depth) => ({
        x: Math.random() * INNER_W,
        y: Math.random() * INNER_H,
        r: depth === 'far' ? 1 : depth === 'mid' ? 2 : 3,
        vx: (Math.random() - 0.5) * 0.08,
        vy: (Math.random() - 0.5) * 0.08,
        o: depth === 'far' ? 0.12 : depth === 'mid' ? 0.25 : 0.42,
        depth,
      }));
    }

    const loop = () => {
      ctx.clearRect(0, 0, INNER_W, INNER_H);
      const t = Date.now() * 0.0006;
      for (const m of motesRef.current) {
        m.x += m.vx;
        m.y += m.vy;
        if (m.x < 0) m.x += INNER_W;
        if (m.x > INNER_W) m.x -= INNER_W;
        if (m.y < 0) m.y += INNER_H;
        if (m.y > INNER_H) m.y -= INNER_H;
        const p = m.depth === 'far' ? 0.8 : m.depth === 'mid' ? 2.5 : 5;
        const px = m.x + mx * p;
        const py = m.y + my * p;
        const flicker = 1 + Math.sin(t + m.x * 0.1) * 0.18;
        ctx.beginPath();
        ctx.arc(px, py, m.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,245,200,${m.o * flicker})`;
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
 * React + CSS parallax, golden ray, Canvas dust, convex glass and a sticker peel.
 */
export const GoblinInvasionWindow: React.FC<GoblinInvasionWindowProps> = ({
  ariaLabel,
  className,
  style,
  backgroundImage = defaultBackgroundImage,
  goblinImage = defaultGoblinImage,
  goblinImageWithBorder = defaultGoblinImageWithBorder,
}) => {
  const [peeled, setPeeled] = React.useState(false);
  const [mx, setMx] = React.useState(0);
  const [my, setMy] = React.useState(0);
  const reduced = useReducedMotion();
  const rootRef = useRef<HTMLDivElement>(null);

  const handlePointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (!rootRef.current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    const px = (x - 0.5) * 2;
    const py = (y - 0.5) * 2;
    setMx(px);
    setMy(py);
  }, []);

  const handleLeave = useCallback(() => {
    setMx(0);
    setMy(0);
  }, []);

  return (
    <div
      ref={rootRef}
      className={className}
      onClick={() => setPeeled((p) => !p)}
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
        background: '#060f16',
        '--mx': mx,
        '--my': my,
        ...style,
      } as React.CSSProperties}
      role="img"
      aria-label={ariaLabel}
      aria-hidden={!ariaLabel}
    >
      {/* Outer frame */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: RX,
          background: 'linear-gradient(135deg, #f0cf6a 0%, #dfb857 12%, #8a5a20 32%, #060f16 58%, #060f16 100%)',
          boxShadow: 'inset 0 1px 1px rgba(255,255,255,.18), inset 0 -2px 6px rgba(0,0,0,.55)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          inset: 4,
          borderRadius: RX - 4,
          border: '1px solid rgba(240,207,106,.26)',
          boxShadow: 'inset 0 0 5px rgba(240,207,106,.15)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          top: RIM - 5,
          left: RIM - 5,
          right: RIM - 5,
          bottom: RIM - 5,
          borderRadius: 22,
          background: 'linear-gradient(135deg, rgba(240,207,106,.55), rgba(138,90,32,.35) 40%, rgba(6,15,22,.92) 80%)',
          boxShadow: '0 0 0 1px rgba(0,0,0,.7), inset 0 0 4px rgba(0,0,0,.5)',
        }}
      />

      {/* Diorama: the inner world */}
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
        }}
      >
        {/* Background layer — parallax slow */}
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

        {/* Field stone recede */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'radial-gradient(ellipse at 45% 40%, rgba(12,21,23,.0) 0%, rgba(6,15,22,.55) 65%, rgba(5,10,13,.85) 100%)',
            mixBlendMode: 'multiply',
          }}
        />

        {/* Goblin group — parallax mid */}
        <img
          src={goblinNoSticker}
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
          src={goblinWithSticker}
          alt=""
          style={{
            position: 'absolute',
            width: '100%',
            height: '100%',
            objectFit: 'contain',
            clipPath: peeled
              ? 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)'
              : 'polygon(0% 0%, 0% 0%, 0% 100%, 0% 100%)',
            transition: reduced ? 'none' : 'clip-path 0.8s ease-in-out',
            transform: reduced
              ? 'none'
              : `translate3d(calc(var(--mx) * 7px), calc(var(--my) * 4px), 0)`,
          }}
        />

        {/* Golden ray */}
        <div
          style={{
            position: 'absolute',
            width: '35%',
            height: '130%',
            top: '-15%',
            left: '52%',
            background: 'linear-gradient(90deg, transparent, rgba(255,205,100,.12), rgba(255,225,150,.24), transparent)',
            filter: 'blur(18px)',
            transform: reduced
              ? 'rotate(18deg)'
              : 'rotate(18deg) translateX(calc(var(--mx) * -8px))',
            mixBlendMode: 'screen',
            opacity: 0.75,
            animation: reduced ? 'none' : 'window-light-breathe 7s ease-in-out infinite',
            pointerEvents: 'none',
          }}
        />

        {/* Atmosphere fog */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'radial-gradient(ellipse at 50% 45%, rgba(220,190,130,.08), transparent 65%)',
            mixBlendMode: 'screen',
            pointerEvents: 'none',
          }}
        />

        {/* Dust motes via Canvas */}
        <DustCanvas mx={mx} my={my} active={!reduced} />

        {/* Glass layer */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: 16,
            pointerEvents: 'none',
            background: `
              linear-gradient(125deg, transparent 35%, rgba(255,255,255,.06) 45%, rgba(255,255,255,.14) 48%, transparent 56%),
              linear-gradient(-45deg, transparent 65%, rgba(255,255,255,.04) 95%)
            `,
            transform: reduced ? 'none' : `translateX(calc(var(--mx) * 4px))`,
            boxShadow: `
              inset 0 1px 0 rgba(255,255,255,.35),
              inset 1px 0 0 rgba(255,255,255,.15),
              inset 0 -2px 4px rgba(0,0,0,.35),
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
          }}
        />
      </div>
    </div>
  );
};

export default GoblinInvasionWindow;
