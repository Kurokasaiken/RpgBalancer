import React from 'react';
import { motion } from 'framer-motion';

import marbleBase from './base.png';
import frameCirc from './frame_circ.png';
import frameRect from './frame_rect.png';

const ASSETS = {
  BASE: marbleBase,
  FRAME_CIRC: frameCirc,
  FRAME_RECT: frameRect,
};

export type MarbleCardTone = 'neutral' | 'job' | 'quest' | 'danger' | 'system' | 'day' | 'night';

export interface MarbleCardProps {
  title: string;
  icon: React.ReactNode;
  isActive?: boolean;
  progress?: number; // 0.0 - 1.0
  tone?: MarbleCardTone;
  onClick?: () => void;
}

const TONE_STYLES: Record<
  MarbleCardTone,
  {
    ringStart: string;
    ringTrail: string;
    iconColor: string;
    iconBackground: string;
    glow: string;
  }
> = {
  neutral: {
    ringStart: 'rgba(248, 196, 113, 0.95)',
    ringTrail: 'rgba(15, 23, 42, 0.55)',
    iconColor: '#fef3c7',
    iconBackground: 'rgba(15, 23, 42, 0.85)',
    glow: 'rgba(250, 204, 21, 0.4)',
  },
  job: {
    ringStart: 'rgba(16, 185, 129, 0.95)',
    ringTrail: 'rgba(3, 57, 44, 0.5)',
    iconColor: '#d1fae5',
    iconBackground: 'rgba(3, 57, 44, 0.8)',
    glow: 'rgba(16, 185, 129, 0.35)',
  },
  quest: {
    ringStart: 'rgba(167, 139, 250, 0.95)',
    ringTrail: 'rgba(40, 24, 62, 0.55)',
    iconColor: '#ede9fe',
    iconBackground: 'rgba(40, 24, 62, 0.8)',
    glow: 'rgba(167, 139, 250, 0.35)',
  },
  danger: {
    ringStart: 'rgba(248, 113, 113, 0.95)',
    ringTrail: 'rgba(60, 10, 10, 0.55)',
    iconColor: '#fee2e2',
    iconBackground: 'rgba(60, 10, 10, 0.85)',
    glow: 'rgba(248, 113, 113, 0.45)',
  },
  system: {
    ringStart: 'rgba(59, 130, 246, 0.95)',
    ringTrail: 'rgba(8, 47, 73, 0.55)',
    iconColor: '#dbeafe',
    iconBackground: 'rgba(8, 47, 73, 0.85)',
    glow: 'rgba(96, 165, 250, 0.45)',
  },
  day: {
    ringStart: 'rgba(255, 214, 102, 0.95)',
    ringTrail: 'rgba(109, 76, 16, 0.5)',
    iconColor: '#fff9db',
    iconBackground: 'rgba(133, 77, 14, 0.85)',
    glow: 'rgba(255, 214, 102, 0.5)',
  },
  night: {
    ringStart: 'rgba(96, 165, 250, 0.95)',
    ringTrail: 'rgba(38, 22, 70, 0.55)',
    iconColor: '#e0e7ff',
    iconBackground: 'rgba(30, 27, 75, 0.85)',
    glow: 'rgba(96, 165, 250, 0.45)',
  },
};

const cardVariants = {
  resting: {
    scale: 1,
    rotateX: 15,
    rotateY: 0,
    y: 0,
    z: 0,
    transition: { type: 'spring', stiffness: 280, damping: 32 },
  },
  hover: {
    scale: 1.05,
    rotateX: 0,
    rotateY: 0,
    y: -15,
    z: 40,
    transition: { type: 'spring', stiffness: 360, damping: 35 },
  },
  tap: {
    scale: 1.02,
    y: -5,
    transition: { duration: 0.12 },
  },
};

const clampProgressPercent = (value: number | undefined): number => {
  if (value === undefined || !Number.isFinite(value)) return 0;
  return Math.min(Math.max(value * 100, 0), 100);
};

const MarbleCard: React.FC<MarbleCardProps> = ({
  title,
  icon,
  isActive = false,
  progress = 0,
  tone = 'neutral',
  onClick,
}) => {
  const progressPercent = clampProgressPercent(progress);
  const progressFraction = progressPercent / 100;
  const trimmedTitle = title.trim();
  const hasTitle = trimmedTitle.length > 0;
  const accent = TONE_STYLES[tone] ?? TONE_STYLES.neutral;
  const PROGRESS_RING_RADIUS = 70;
  const RING_CIRCUMFERENCE = 2 * Math.PI * PROGRESS_RING_RADIUS;
  const ringDashoffset = RING_CIRCUMFERENCE * (1 - progressFraction);

  return (
    <motion.div
      className="group relative h-[400px] w-[260px] cursor-grab rounded-[30px] bg-transparent"
      variants={cardVariants}
      initial="resting"
      whileHover="hover"
      whileTap="tap"
      style={{ transformStyle: 'preserve-3d' }}
      onClick={onClick}
    >
      {/* Layer 1: marble base */}
      <div
        className="absolute inset-0 overflow-hidden rounded-[30px]"
        style={{ transform: 'translateZ(0px)' }}
      >
        {/* Marble texture */}
        <img src={ASSETS.BASE} alt="Marble base" className="absolute inset-0 h-full w-full object-cover" />
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'linear-gradient(135deg, rgba(255,253,246,0.9) 0%, rgba(248,230,190,0.55) 38%, rgba(255,245,214,0.25) 72%, rgba(255,255,255,0) 100%)',
          }}
        />
      </div>

      {/* Layer 2: content */}
      <div className="relative z-20 flex h-full flex-col items-center p-6" style={{ transform: 'translateZ(10px)' }}>
        {/* Medallion */}
        <div
          className="relative mt-6 flex h-36 w-36 items-center justify-center"
          style={{ transform: 'translateY(35%) scale(0.85)' }}
        >
          <svg
            className="pointer-events-none absolute -inset-5 z-0"
            viewBox="0 0 200 200"
            aria-hidden="true"
          >
            <circle
              cx="100"
              cy="100"
              r={PROGRESS_RING_RADIUS}
              fill="transparent"
              stroke={accent.ringTrail}
              strokeWidth="14"
              strokeLinecap="round"
              opacity={0.35}
            />
            <circle
              cx="100"
              cy="100"
              r={PROGRESS_RING_RADIUS}
              fill="transparent"
              stroke={accent.ringStart}
              strokeWidth="14"
              strokeDasharray={RING_CIRCUMFERENCE}
              strokeDashoffset={ringDashoffset}
              strokeLinecap="round"
              style={{ transition: 'stroke-dashoffset 0.6s ease, stroke 0.6s ease' }}
            />
          </svg>

          {/* Icon */}
          <div
            className="relative z-10 flex h-28 w-28 items-center justify-center rounded-full border border-white/10 text-4xl drop-shadow-md"
            style={{
              background: accent.iconBackground,
              color: accent.iconColor,
              boxShadow: 'inset 0 10px 25px rgba(0,0,0,0.55)',
            }}
          >
            {icon}
          </div>
          <div className="pointer-events-none absolute z-20 h-28 w-28 rounded-full bg-linear-to-tr from-transparent via-white/18 to-white/32 shadow-[inset_0_5px_10px_rgba(255,255,255,0.45)]" />

          {/* Circular frame */}
          <img
            src={ASSETS.FRAME_CIRC}
            alt="Circular frame"
            className="pointer-events-none absolute inset-0 z-30 h-full w-full select-none object-contain"
          />

          {/* Active glow */}
          {isActive && (
            <div
              className="absolute -inset-4 z-0 rounded-full blur-2xl animate-pulse-slow"
              style={{ backgroundColor: accent.glow }}
            />
          )}
        </div>

        {/* Title */}
        {hasTitle && (
          <div className="relative mt-auto mb-24 text-center">
            <span
              className="inline-flex items-center justify-center rounded-full border border-[#2d1c0b]/60 px-3 py-0.5 shadow-[0_2px_6px_rgba(0,0,0,0.45)] backdrop-blur-[1px]"
              style={{
                background:
                  'linear-gradient(120deg, rgba(244,229,173,0.78) 0%, rgba(188,135,62,0.72) 45%, rgba(72,47,21,0.65) 100%)',
              }}
            >
              <h3
                className="font-serif text-[0.84rem] font-semibold uppercase tracking-[0.14em] text-[#c89357] drop-shadow-sm"
                style={{
                  backgroundImage:
                    'linear-gradient(180deg, #fdf6d3 0%, #f2d18b 18%, #c58a34 45%, #8a5f24 65%, #f4e0a2 90%)',
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  color: 'transparent',
                  textShadow: '0px 1px 1px rgba(255,255,255,0.35), -1px -1px 0px rgba(0,0,0,0.6)',
                  WebkitTextStroke: '0.5px rgba(0,0,0,0.9)',
                }}
              >
                {title}
              </h3>
            </span>
          </div>
        )}
      </div>

      <img
        src={ASSETS.FRAME_RECT}
        alt="Gold frame"
        className="pointer-events-none absolute inset-0 z-40 h-full w-full select-none object-cover opacity-90"
        style={{
          transform: 'translateZ(2px)',
          mixBlendMode: 'screen',
        }}
      />
    </motion.div>
  );
};

export default MarbleCard;
