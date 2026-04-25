/**
 * DraggableCard.tsx — v2
 *
 * Pattern ghost corretto (Blizzard-style):
 * - La card originale rimane al suo posto, opacity 18% durante il drag
 * - Un elemento FIXED (ghost) segue il cursore con spring physics
 * - Al drop valido: ghost sparisce, card fa squash thud
 * - Al drop invalido: ghost torna alla card con rubber-band
 *
 * Drag gestito con Pointer Events (non Framer drag) per controllo
 * totale sulla posizione raw vs spring.
 *
 * Tilt: useVelocity(rawX) → useTransform → rotateZ sul ghost
 * Spring: stiffness/damping/mass dal cfg, aggiornati live via setOptions
 */

'use client';

import React, { useRef, useState, useCallback, useEffect } from 'react';
import {
  motion,
  useMotionValue,
  useSpring,
  useVelocity,
  useTransform,
  AnimatePresence,
} from 'framer-motion';
import type { PhysicsConfig } from '../config/physicsDefaults';

// ─────────────────────────────────────────────────────────────
// CARD CONTENT — condiviso tra originale e ghost
// ─────────────────────────────────────────────────────────────
function CardContent({
  foilRx = 0,
  foilOpacity = 0,
}: {
  foilRx?: number;
  foilOpacity?: number;
}) {
  return (
    <>
      {/* Rarity bar top */}
      <div
        className="absolute top-0 left-[13px] right-[13px] h-[2px] rounded-b-[2px]"
        style={{
          background:
            'linear-gradient(90deg,transparent,var(--go3,#786000),var(--go6,#e0bc50),var(--go7,#f0d47a),var(--go6,#e0bc50),var(--go3,#786000),transparent)',
          boxShadow: '0 0 8px var(--go5,#c8a030)',
        }}
      />

      {/* Holographic foil */}
      <div
        className="absolute inset-0 rounded-[4px] pointer-events-none z-[5]"
        style={{
          mixBlendMode: 'screen',
          background: `linear-gradient(
            calc(135deg + ${foilRx * 28}deg),
            transparent 18%,
            rgba(255,220,80,.07) 34%,
            rgba(80,200,255,.09) 50%,
            rgba(200,80,255,.07) 66%,
            transparent 82%
          )`,
          opacity: foilOpacity,
          transition: 'opacity .3s ease',
        }}
      />

      {/* Icon */}
      <div
        className="text-[24px] text-center mb-[5px]"
        style={{ filter: 'drop-shadow(0 3px 8px rgba(0,0,0,1))' }}
      >
        ⚔️
      </div>

      {/* Name */}
      <div
        className="font-cinzel text-[9.5px] font-bold text-center tracking-[.05em]"
        style={{
          color: 'var(--go7,#f0d47a)',
          textShadow: '0 0 10px var(--acc-glow,rgba(200,160,48,.38))',
        }}
      >
        Blade of Ruin
      </div>

      {/* Type */}
      <div
        className="text-[9.5px] italic text-center mt-[2px]"
        style={{ color: 'var(--t2,#806858)' }}
      >
        Legendary Sword
      </div>

      {/* Separator */}
      <div
        className="h-[1px] my-[8px]"
        style={{
          background: 'linear-gradient(90deg,transparent,rgba(100,80,0,.38),transparent)',
        }}
      />

      {/* Stats */}
      {[
        { label: 'ATK', value: '+14–18', color: 'var(--go7,#f0d47a)' },
        { label: 'Crit', value: '+8%', color: 'var(--go7,#f0d47a)' },
        { label: 'SPD', value: '−3', color: '#e04040' },
      ].map(s => (
        <div
          key={s.label}
          className="flex justify-between text-[10.5px] my-[2px]"
          style={{ color: 'var(--t1,#c8b88a)' }}
        >
          <span>{s.label}</span>
          <b style={{ color: s.color, fontStyle: 'normal', fontWeight: 600 }}>
            {s.value}
          </b>
        </div>
      ))}
    </>
  );
}

// ─────────────────────────────────────────────────────────────
// CARD BASE STYLE
// ─────────────────────────────────────────────────────────────
const CARD_MAT: React.CSSProperties = {
  width: '160px',
  borderRadius: '4px',
  padding: '13px',
  background: `
    url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='128' height='128'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' seed='11'/%3E%3CfeColorMatrix type='saturate' values='0.15'/%3E%3C/filter%3E%3Crect width='128' height='128' filter='url(%23n)' opacity='0.055'/%3E%3C/svg%3E"),
    radial-gradient(ellipse 65% 55% at 50% 42%, rgba(28,24,16,0) 0%, rgba(8,6,2,.62) 75%, rgba(0,0,0,.95) 100%),
    linear-gradient(158deg, var(--raised,#14181f) 0%, var(--surface,#0f1218) 45%, var(--base,#0a0c14) 80%, var(--deep,#060810) 100%)
  `,
  border: '1px solid var(--iron-rim,#242c38)',
  position: 'relative',
};

const REST_SHADOW = `
  0 8px 28px rgba(0,0,0,.95),
  0 3px 8px rgba(0,0,0,1),
  0 0 0 1px rgba(80,64,0,.08),
  inset 0 2px 0 rgba(255,255,255,.055),
  inset 0 -2px 0 rgba(0,0,0,.88)
`;

function liftedShadow(liftScale: number): string {
  const d = Math.round(12 + (liftScale - 1) * 180);
  const b = Math.round(24 + (liftScale - 1) * 200);
  return `
    0 ${d}px ${b}px rgba(0,0,0,.97),
    0 0 0 1px var(--go4,#a08020),
    0 0 48px var(--acc-glow,rgba(200,160,48,.38)),
    0 0 80px rgba(200,160,48,.12),
    inset 0 2px 0 rgba(255,255,255,.08),
    inset 0 -2px 0 rgba(0,0,0,.85)
  `;
}

// ─────────────────────────────────────────────────────────────
// MAIN
// ─────────────────────────────────────────────────────────────
export interface DraggableCardProps {
  cfg: PhysicsConfig;
  onDragOverSlot?: (over: boolean) => void;
  /** onDrop(success, pointerX, pointerY) */
  onDrop?: (success: boolean, x: number, y: number) => void;
  slotRef?: React.RefObject<HTMLElement>;
}

export function DraggableCard({ cfg, onDragOverSlot, onDrop, slotRef }: DraggableCardProps) {
  const cardRef  = useRef<HTMLDivElement>(null);
  const lastOver = useRef(false);

  const [isDragging,  setIsDragging]  = useState(false);
  const [isThudding,  setIsThudding]  = useState(false);
  const [foil, setFoil] = useState({ rx: 0, opacity: 0 });

  // ── Raw cursor (pointer events, no spring) ───────────────
  const rawX = useMotionValue(0);
  const rawY = useMotionValue(0);
  const xVel = useVelocity(rawX);

  // ── Spring (segue raw con fisica) ────────────────────────
  const springOpts = {
    stiffness: cfg.springStiffness,
    damping:   cfg.springDamping,
    mass:      cfg.mass,
  };
  const sX = useSpring(rawX, springOpts);
  const sY = useSpring(rawY, springOpts);

  // Aggiorna spring config quando cfg cambia (framer-motion v11)
  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (sX as any).setOptions?.(springOpts);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (sY as any).setOptions?.(springOpts);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cfg.springStiffness, cfg.springDamping, cfg.mass]);

  // ── Tilt dal velocity ────────────────────────────────────
  const rotZ = useTransform(
    xVel,
    [-2500, 0, 2500],
    [-cfg.tiltIntensity, 0, cfg.tiltIntensity],
  );

  // ── Pointer handlers ─────────────────────────────────────
  const onPointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (e.button !== 0) return;
      e.currentTarget.setPointerCapture(e.pointerId);
      e.preventDefault();
      rawX.set(e.clientX);
      rawY.set(e.clientY);
      setIsDragging(true);
      lastOver.current = false;
    },
    [rawX, rawY],
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!isDragging) return;
      rawX.set(e.clientX);
      rawY.set(e.clientY);

      if (!slotRef?.current) return;
      const r = slotRef.current.getBoundingClientRect();
      const over =
        e.clientX >= r.left && e.clientX <= r.right &&
        e.clientY >= r.top  && e.clientY <= r.bottom;
      if (over !== lastOver.current) {
        lastOver.current = over;
        onDragOverSlot?.(over);
      }
    },
    [isDragging, rawX, rawY, slotRef, onDragOverSlot],
  );

  const onPointerUp = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!isDragging) return;
      const success = lastOver.current;
      lastOver.current = false;
      setIsDragging(false);
      onDragOverSlot?.(false);

      if (success) {
        setIsThudding(true);
        setTimeout(() => setIsThudding(false), 420);
      }
      onDrop?.(success, e.clientX, e.clientY);
    },
    [isDragging, onDragOverSlot, onDrop],
  );

  // ESC cancel
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key !== 'Escape' || !isDragging) return;
      lastOver.current = false;
      setIsDragging(false);
      onDragOverSlot?.(false);
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [isDragging, onDragOverSlot]);

  // ── Foil (solo hover, non drag) ──────────────────────────
  const onMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (isDragging || !cardRef.current) return;
      const r = cardRef.current.getBoundingClientRect();
      setFoil({ rx: (e.clientX - r.left) / r.width - 0.5, opacity: 1 });
    },
    [isDragging],
  );
  const onMouseLeave = useCallback(() => setFoil(s => ({ ...s, opacity: 0 })), []);

  // ─────────────────────────────────────────────────────────
  return (
    <>
      {/* ══ CARD ORIGINALE (stationary) ══════════════════ */}
      <motion.div
        ref={cardRef}
        className="select-none"
        style={{
          ...CARD_MAT,
          cursor: isDragging ? 'grabbing' : 'grab',
          opacity: isDragging ? 0.18 : 1,
          transition: 'opacity .12s ease',
          boxShadow: REST_SHADOW,
        }}
        animate={
          isThudding
            ? { scaleY: [1, 0.91, 1.03, 0.98, 1], scaleX: [1, 1.06, 0.99, 1.01, 1] }
            : { scaleY: 1, scaleX: 1 }
        }
        transition={
          isThudding
            ? { duration: 0.38, ease: [0.22, 1, 0.36, 1] }
            : { type: 'spring', stiffness: 400, damping: 20 }
        }
        whileHover={
          !isDragging ? { scale: 1.015, transition: { duration: 0.18 } } : undefined
        }
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onMouseMove={onMouseMove}
        onMouseLeave={onMouseLeave}
      >
        <CardContent foilRx={foil.rx} foilOpacity={foil.opacity} />
      </motion.div>

      {/* ══ GHOST (segue cursore con spring, posizione fixed) ══ */}
      <AnimatePresence>
        {isDragging && (
          <motion.div
            className="fixed pointer-events-none z-[9997] select-none"
            style={{
              ...CARD_MAT,
              x: sX,
              y: sY,
              translateX: '-50%',
              translateY: '-50%',
              rotateZ: rotZ,
              boxShadow: liftedShadow(cfg.liftScale),
            }}
            initial={{ opacity: 0, scale: 1 }}
            animate={{ opacity: 0.93, scale: cfg.liftScale }}
            exit={{ opacity: 0, scale: 0.96, transition: { duration: 0.14 } }}
            transition={{ duration: 0.1, ease: [0.22, 1, 0.36, 1] }}
          >
            {/* Ghost ha sempre foil visibile — è "sollevato" e illuminato */}
            <CardContent foilRx={0.3} foilOpacity={0.7} />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
