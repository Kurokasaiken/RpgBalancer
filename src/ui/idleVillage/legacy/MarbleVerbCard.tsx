import React from 'react';
import { motion } from 'framer-motion';

export interface MarbleVerbCardProps {
  title: string;
  icon: React.ReactNode;
  isActive?: boolean;
  progress?: number; // 0 to 1
}

const clamp01 = (value: number | undefined) => {
  if (value === undefined || !Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(1, value));
};

/**
 * MarbleVerbCard
 *
 * Premium Verb preview inspired by marble alt-skins.
 * Background layers will later be swapped with config-driven assets.
 */
export const MarbleVerbCard: React.FC<MarbleVerbCardProps> = ({
  title,
  icon,
  isActive = false,
  progress = 0.5,
}) => {
  const clampedProgress = clamp01(progress);

  return (
    <motion.div
      className="relative h-[400px] w-[260px] cursor-grab rounded-[30px] bg-transparent"
      whileHover={{ scale: 1.02, rotateX: 2, rotateY: 2 }}
      whileTap={{ scale: 0.98 }}
      style={{ transformStyle: 'preserve-3d', perspective: '1000px' }}
    >
      {/* Layer 0: drop shadow */}
      <div
        className="pointer-events-none absolute -inset-4 rounded-[30px] bg-black/30 blur-xl transition-all duration-300 group-hover:bg-black/40"
        style={{ transform: 'translateZ(-20px)' }}
        aria-hidden="true"
      />

      {/* Layer 1: marble base (placeholder background) */}
      <div
        className="absolute inset-0 overflow-hidden rounded-[30px] border-b-4 border-slate-300 bg-slate-100 shadow-inner"
        style={{ transform: 'translateZ(-10px)' }}
        aria-hidden="true"
      >
        <div className="absolute inset-0 opacity-50 mix-blend-multiply" style={{ backgroundImage: 'url(https://www.transparenttextures.com/patterns/white-marble.png)' }} />
        <div className="absolute inset-0 bg-linear-to-br from-white/80 via-transparent to-slate-300/50" />
      </div>

      {/* Layer 2: content */}
      <div className="relative z-10 flex h-full flex-col items-center p-6" style={{ transform: 'translateZ(10px)' }}>
        {/* Medallion */}
        <div className="relative mt-4 flex h-32 w-32 items-center justify-center">
          <div className="absolute inset-0 rounded-full border-4 border-amber-400/60 shadow-[inset_0_0_20px_rgba(251,191,36,0.4)]" />

          {isActive && (
            <>
              <div
                className="absolute -inset-4 rounded-full bg-linear-to-r from-cyan-400 via-blue-500 to-cyan-400 blur-md opacity-60 animate-spin-slower"
                style={{ animationDuration: '8s' }}
              />
              <div
                className="absolute -inset-1 rounded-full bg-linear-to-r from-amber-300 via-orange-500 to-amber-300 blur-sm opacity-80 animate-spin-slow"
                style={{ animationDuration: '4s', animationDirection: 'reverse' }}
              />
            </>
          )}

          <div className="relative z-20 flex h-24 w-24 items-center justify-center rounded-full border-2 border-amber-300 bg-slate-900/80 text-amber-200 shadow-[inset_0_0_12px_rgba(15,23,42,0.8)]">
            <div className="absolute inset-0 rounded-full bg-linear-to-tr from-white/0 via-white/20 to-white/40" />
            <div className="relative text-4xl drop-shadow-[0_0_10px_rgba(251,191,36,0.8)]">{icon}</div>
          </div>
        </div>

        {/* Floating progress indicator */}
        <div className="mt-12 w-full text-center">
          <div className="mx-auto h-2 w-40 rounded-full border border-slate-900/30 bg-slate-200/70 shadow-inner">
            <div
              className="h-full rounded-full bg-linear-to-r from-amber-200 via-rose-200 to-amber-400 shadow-[0_0_12px_rgba(251,191,36,0.45)]"
              style={{ width: `${clampedProgress * 100}%` }}
            />
          </div>
          <p className="mt-2 text-[11px] uppercase tracking-[0.25em] text-slate-500">{Math.round(clampedProgress * 100)}% attuned</p>
        </div>

        {/* Title */}
        <div className="mt-auto mb-8 text-center">
          <h3
            className="font-serif text-lg font-bold uppercase tracking-[0.35em] text-slate-700"
            style={{ textShadow: '1px 1px 1px rgba(255,255,255,0.5), -1px -1px 1px rgba(0,0,0,0.1)' }}
          >
            {title}
          </h3>
        </div>
      </div>

      {/* Layer 4: gold frame placeholder */}
      <div className="pointer-events-none absolute inset-0 rounded-[30px] border-12 border-amber-500/30 mix-blend-overlay" aria-hidden="true" />
      <div className="pointer-events-none absolute inset-0 rounded-[30px] shadow-[inset_0_0_15px_rgba(251,191,36,0.3)]" aria-hidden="true" />
    </motion.div>
  );
};

export default MarbleVerbCard;
