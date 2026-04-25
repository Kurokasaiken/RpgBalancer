/**
 * SunkenSlot.tsx
 * Slot incavato che reagisce visivamente al drag-over.
 * Il glow è proporzionale a slotGlowIntensity dal PhysicsConfig.
 */

'use client';

import React, { forwardRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { PhysicsConfig } from '../config/physicsDefaults';

interface SunkenSlotProps {
  cfg: PhysicsConfig;
  isOver: boolean;
  droppedIcon?: string;
}

export const SunkenSlot = forwardRef<HTMLDivElement, SunkenSlotProps>(
  ({ cfg, isOver, droppedIcon }, ref) => {
    const g = cfg.slotGlowIntensity;

    const baseShadow = `
      inset 5px 5px 20px rgba(0,0,0,1),
      inset 3px 3px 7px rgba(0,0,0,.98),
      inset -1px -1px 3px rgba(255,255,255,.016),
      inset 0 0 30px rgba(0,0,0,.88),
      0 1px 0 rgba(255,255,255,.018)
    `;

    const overShadow = `
      inset 5px 5px 20px rgba(0,0,0,.95),
      inset 0 0 28px rgba(0,0,0,.8),
      0 0 ${Math.round(g * 40)}px rgba(200,160,48,${(g * 0.45).toFixed(2)}),
      0 0 ${Math.round(g * 70)}px rgba(200,160,48,${(g * 0.22).toFixed(2)}),
      0 0 0 1px rgba(180,140,20,${(g * 0.28).toFixed(2)})
    `;

    return (
      <motion.div
        ref={ref}
        className="flex items-center justify-center rounded-[3px] relative overflow-hidden"
        style={{
          width: '140px',
          height: '160px',
          background: 'linear-gradient(150deg, #020304 0%, #030508 100%)',
          border: `1px solid rgba(50,40,0,${isOver ? g * 0.6 : 0.18})`,
          borderColor: isOver
            ? `rgba(180,140,20,${g.toFixed(2)})`
            : 'rgba(50,40,0,.18)',
        }}
        animate={{
          boxShadow: isOver ? overShadow : baseShadow,
          borderColor: isOver
            ? `rgba(180,140,20,${g.toFixed(2)})`
            : 'rgba(50,40,0,.18)',
        }}
        transition={{ duration: 0.2 }}
      >
        {/* Pulse ring when hovering */}
        <AnimatePresence>
          {isOver && (
            <motion.div
              className="absolute inset-0 rounded-[3px] pointer-events-none"
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, g * 0.5, 0] }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.9, repeat: Infinity, ease: 'easeInOut' }}
              style={{
                boxShadow: `inset 0 0 ${Math.round(g * 30)}px rgba(200,160,48,${(g * 0.3).toFixed(2)})`,
              }}
            />
          )}
        </AnimatePresence>

        {/* Content */}
        <AnimatePresence mode="wait">
          {droppedIcon ? (
            <motion.span
              key="icon"
              initial={{ scale: 1.4, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 400, damping: 20 }}
              style={{ fontSize: '34px', filter: 'drop-shadow(0 3px 10px rgba(0,0,0,1))' }}
            >
              {droppedIcon}
            </motion.span>
          ) : (
            <motion.span
              key="label"
              initial={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="font-cinzel text-[6.5px] tracking-[.25em] uppercase"
              style={{ color: 'var(--t3, #3c2c20)' }}
            >
              Weapon Slot
            </motion.span>
          )}
        </AnimatePresence>
      </motion.div>
    );
  },
);

SunkenSlot.displayName = 'SunkenSlot';
