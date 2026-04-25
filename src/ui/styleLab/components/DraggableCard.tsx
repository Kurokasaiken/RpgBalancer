/**
 * DraggableCard.tsx
 * Card fisica con Framer Motion v11.
 * Spring stiffness/damping/mass dal PhysicsConfig.
 * Tilt da useVelocity su x MotionValue.
 */

'use client';

import React, { useRef, useState, useCallback } from 'react';
import {
  motion,
  useMotionValue,
  useSpring,
  useVelocity,
  useTransform,
} from 'framer-motion';
import type { PhysicsConfig } from '../config/physicsDefaults';

interface DraggableCardProps {
  cfg: PhysicsConfig;
  /** Chiamata quando la card entra/esce da un'area valida di drop */
  onDragOverSlot?: (over: boolean) => void;
  /** Chiamata al drop — true se sopra slot valido */
  onDrop?: (success: boolean) => void;
  /** ref dello slot target per hit-test */
  slotRef?: React.RefObject<HTMLElement>;
}

/** Ombra che cambia con la scala (simulazione profondità) */
function cardShadow(lifted: boolean, liftScale: number): string {
  if (!lifted) {
    return `
      0 8px 28px rgba(0,0,0,.95),
      0 3px 8px rgba(0,0,0,1),
      0 0 0 1px rgba(80,64,0,.08),
      inset 0 2px 0 rgba(255,255,255,.055),
      inset 0 -2px 0 rgba(0,0,0,.88)
    `;
  }
  const extra = (liftScale - 1) * 200;
  return `
    0 ${14 + extra}px ${28 + extra}px rgba(0,0,0,.96),
    0 6px 14px rgba(0,0,0,1),
    0 0 0 1px var(--go4, #a08020),
    0 0 44px var(--acc-glow, rgba(200,160,48,.38)),
    inset 0 2px 0 rgba(255,255,255,.08),
    inset 0 -2px 0 rgba(0,0,0,.85)
  `;
}

export function DraggableCard({
  cfg,
  onDragOverSlot,
  onDrop,
  slotRef,
}: DraggableCardProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isLifted, setIsLifted] = useState(false);
  const dragX = useMotionValue(0);
  const dragY = useMotionValue(0);
  const velocityX = useVelocity(dragX);
  const tiltX = useSpring(useTransform(velocityX, [-1000, 1000], [-cfg.tiltIntensity, cfg.tiltIntensity]), {
    stiffness: cfg.springStiffness,
    damping: cfg.springDamping,
    mass: cfg.mass,
  });

  const handleDragStart = useCallback(() => {
    setIsDragging(true);
    setIsLifted(true);
    onDragOverSlot?.(false);
  }, [onDragOverSlot]);

  const handleDrag = useCallback(() => {
    if (!slotRef?.current) return;
    
    const card = document.getElementById('draggable-card');
    if (!card) return;
    
    const cardRect = card.getBoundingClientRect();
    const slotRect = slotRef.current.getBoundingClientRect();
    
    const isOver = (
      cardRect.left < slotRect.right &&
      cardRect.right > slotRect.left &&
      cardRect.top < slotRect.bottom &&
      cardRect.bottom > slotRect.top
    );
    
    onDragOverSlot?.(isOver);
  }, [slotRef, onDragOverSlot]);

  const handleDragEnd = useCallback(() => {
    setIsDragging(false);
    setIsLifted(false);
    
    if (!slotRef?.current) {
      onDrop?.(false);
      return;
    }
    
    const card = document.getElementById('draggable-card');
    if (!card) return;
    
    const cardRect = card.getBoundingClientRect();
    const slotRect = slotRef.current.getBoundingClientRect();
    
    const isOver = (
      cardRect.left < slotRect.right &&
      cardRect.right > slotRect.left &&
      cardRect.top < slotRect.bottom &&
      cardRect.bottom > slotRect.top
    );
    
    onDrop?.(isOver);
    onDragOverSlot?.(false);
  }, [slotRef, onDrop, onDragOverSlot]);

  return (
    <motion.div
      id="draggable-card"
      drag
      dragElastic={0.2}
      dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
      onDragStart={handleDragStart}
      onDrag={handleDrag}
      onDragEnd={handleDragEnd}
      style={{
        x: dragX,
        y: dragY,
        rotate: tiltX,
        scale: isLifted ? cfg.liftScale : 1,
        boxShadow: cardShadow(isLifted, cfg.liftScale),
        background: `
          url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='turbulence' baseFrequency='0.5' numOctaves='4' seed='7' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0.18'/%3E%3C/filter%3E%3Crect width='400' height='400' filter='url(%23n)' opacity='0.1'/%3E%3C/svg%3E"),
          linear-gradient(135deg, var(--iron-md, #181c24) 0%, var(--iron-dk, #0c0e12) 100%)
        `,
        border: '1px solid var(--go3, #786000)',
        borderRadius: '4px',
        padding: '20px',
        cursor: isDragging ? 'grabbing' : 'grab',
        transition: 'border-color 0.2s',
        borderColor: isDragging ? 'var(--go5, #c8a030)' : 'var(--go3, #786000)',
      }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      transition={{
        type: 'spring',
        stiffness: cfg.springStiffness,
        damping: cfg.springDamping,
        mass: cfg.mass,
      }}
    >
      <div
        style={{
          fontFamily: 'var(--font-display, Cinzel)',
          fontSize: '14px',
          fontWeight: 600,
          color: 'var(--t1, #c8b88a)',
          textShadow: '0 0 8px var(--acc-glow, rgba(200,160,48,.38))',
          textAlign: 'center',
          letterSpacing: '0.05em',
          textTransform: 'uppercase',
        }}
      >
        Drag Me
      </div>
    </motion.div>
  );
}
