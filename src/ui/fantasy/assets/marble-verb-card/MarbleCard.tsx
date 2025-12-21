import React from 'react';
import { motion } from 'framer-motion';

import marbleBase from './base.png';
import frameRect from './frame_rect.png';
import frameCirc from './frame_circ.png';

const ASSETS = {
  BASE: marbleBase,
  FRAME_RECT: frameRect,
  FRAME_CIRC: frameCirc,
};

export interface MarbleCardProps {
  title: string;
  icon: React.ReactNode;
  isActive?: boolean;
  progress?: number; // 0.0 - 1.0
  onClick?: () => void;
}

const clampProgressPercent = (value: number | undefined): number => {
  if (value === undefined || !Number.isFinite(value)) return 0;
  return Math.min(Math.max(value * 100, 0), 100);
};

const MarbleCard: React.FC<MarbleCardProps> = ({
  title,
  icon,
  isActive = false,
  progress = 0,
  onClick,
}) => {
  const progressPercent = clampProgressPercent(progress);
  const trimmedTitle = title.trim();
  const hasTitle = trimmedTitle.length > 0;

  return (
    <motion.div
      className="group relative h-[400px] w-[260px] cursor-grab rounded-[30px]"
      whileHover={{ scale: 1.02, rotateX: 5, rotateY: 5, y: -5 }}
      whileTap={{ scale: 0.98, rotateX: 0, rotateY: 0, y: 2 }}
      style={{ transformStyle: 'preserve-3d', perspective: '1000px' }}
      onClick={onClick}
    >
      {/* Layer 0: dynamic shadow */}
      <div
        className="pointer-events-none absolute -inset-4 rounded-[40px] bg-black/40 blur-2xl transition-all duration-300 group-hover:bg-amber-900/30 group-hover:blur-3xl"
        style={{ transform: 'translateZ(-30px)' }}
        aria-hidden="true"
      />

      {/* Layer 1: marble base */}
      <div
        className="absolute inset-0 overflow-hidden rounded-[30px] shadow-xl"
        style={{ transform: 'translateZ(0px)' }}
      >
        {/* Marble texture */}
        <img src={ASSETS.BASE} alt="Marble base" className="absolute inset-0 h-full w-full object-cover" />
        <div className="pointer-events-none absolute inset-0 bg-linear-to-tr from-slate-300/30 via-transparent to-white/40" />
      </div>

      {/* Layer 2: content */}
      <div className="relative z-20 flex h-full flex-col items-center p-6" style={{ transform: 'translateZ(10px)' }}>
        {/* Medallion */}
        <div
          className="relative mt-6 flex h-36 w-36 items-center justify-center"
          style={{ transform: 'translateY(35%) scale(0.85)' }}
        >
          {/* Progress liquid */}
          <div className="absolute h-28 w-28 overflow-hidden rounded-full border border-amber-900/20 bg-slate-900/30 shadow-inner">
            <motion.div
              className="absolute left-0 right-0 bottom-0 bg-linear-to-t from-amber-500 via-amber-300 to-yellow-200 opacity-90"
              initial={{ height: '0%' }}
              animate={{ height: `${progressPercent}%` }}
              transition={{ type: 'spring', damping: 20 }}
            >
              <div className="absolute left-0 right-0 top-0 h-2 bg-white/50 blur-sm" />
            </motion.div>
          </div>

          {/* Icon */}
          <div className="relative z-10 text-4xl text-amber-950 drop-shadow-md">{icon}</div>
          <div className="pointer-events-none absolute z-20 h-28 w-28 rounded-full bg-linear-to-tr from-transparent via-white/10 to-white/30 shadow-[inset_0_5px_10px_rgba(255,255,255,0.4)]" />

          {/* Circular frame */}
          <img
            src={ASSETS.FRAME_CIRC}
            alt="Circular frame"
            className="pointer-events-none absolute inset-0 z-30 h-full w-full select-none object-contain drop-shadow-[0_4px_4px_rgba(0,0,0,0.3)]"
          />

          {/* Active glow */}
          {isActive && (
            <div className="absolute -inset-4 z-0 rounded-full bg-amber-400/40 blur-2xl animate-pulse-slow" />
          )}
        </div>

        {/* Title */}
        {hasTitle && (
          <div className="relative mt-auto mb-8 text-center">
            <h3
              className="font-serif text-lg font-bold uppercase tracking-[0.2em] text-slate-800 drop-shadow-sm"
              style={{ textShadow: '1px 1px 0px rgba(255,255,255,0.8), -1px -1px 0px rgba(0,0,0,0.2)' }}
            >
              {title}
            </h3>
          </div>
        )}
      </div>

      {/* Layer 3: rectangular frame */}
      <img
        src={ASSETS.FRAME_RECT}
        alt="Gold frame"
        className="pointer-events-none absolute inset-0 z-40 h-full w-full select-none object-fill opacity-90 mix-blend-hard-light"
        style={{ transform: 'translateZ(2px)' }}
      />
      <div className="pointer-events-none absolute inset-0 z-50 rounded-[30px] bg-linear-to-tr from-transparent via-white/20 to-transparent mix-blend-overlay" />
    </motion.div>
  );
};

export default MarbleCard;
