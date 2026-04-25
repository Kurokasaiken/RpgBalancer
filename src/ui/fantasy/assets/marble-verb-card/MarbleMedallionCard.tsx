import React from 'react';
import { motion } from 'framer-motion';

import frameCirc from './frame_circ.png';
import { TONE_STYLES, clampProgressPercent, cardVariants, type MarbleCardTone } from './marbleCardTokens';

export interface MarbleMedallionCardProps {
  title: string;
  icon: React.ReactNode;
  isActive?: boolean;
  progress?: number; // 0.0 - 1.0
  tone?: MarbleCardTone;
  onClick?: () => void;
}

const PROGRESS_RING_RADIUS = 68;
const RING_CIRCUMFERENCE = 2 * Math.PI * PROGRESS_RING_RADIUS;

const MarbleMedallionCard: React.FC<MarbleMedallionCardProps> = ({
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
  const ringDashoffset = RING_CIRCUMFERENCE * (1 - progressFraction);

  return (
    <motion.div
      className="group relative h-[300px] w-[220px] cursor-grab rounded-[26px] bg-transparent"
      variants={cardVariants}
      initial="resting"
      whileHover="hover"
      whileTap="tap"
      style={{ transformStyle: 'preserve-3d' }}
      onClick={onClick}
    >
      <div className="absolute inset-0 rounded-[26px] bg-linear-to-br from-slate-900/70 via-slate-950/85 to-black/80 blur-[1px]" />
      <div className="relative z-10 flex h-full flex-col items-center px-3 pb-4 pt-6" style={{ transform: 'translateZ(16px)' }}>
        <div
          className="relative mt-4 flex h-44 w-44 items-center justify-center"
          style={{ transform: 'translateY(28%) scale(0.96)' }}
        >
          <svg className="pointer-events-none absolute -inset-4 z-0" viewBox="0 0 220 220" aria-hidden="true">
            <circle
              cx="110"
              cy="110"
              r={PROGRESS_RING_RADIUS}
              fill="transparent"
              stroke={accent.ringTrail}
              strokeWidth="14"
              strokeLinecap="round"
              opacity={0.35}
              transform="rotate(-90 110 110)"
            />
            <circle
              cx="110"
              cy="110"
              r={PROGRESS_RING_RADIUS}
              fill="transparent"
              stroke={accent.ringStart}
              strokeWidth="14"
              strokeDasharray={RING_CIRCUMFERENCE}
              strokeDashoffset={ringDashoffset}
              strokeLinecap="round"
              style={{ transition: 'stroke-dashoffset 0.6s ease, stroke 0.6s ease' }}
              transform="rotate(-90 110 110)"
            />
          </svg>

          <div
            className="relative z-10 flex h-32 w-32 items-center justify-center rounded-full border border-white/10 text-4xl drop-shadow-lg"
            style={{
              background: accent.iconBackground,
              color: accent.iconColor,
              boxShadow: 'inset 0 12px 28px rgba(0,0,0,0.6)',
            }}
          >
            {icon}
          </div>
          <div className="pointer-events-none absolute z-20 h-32 w-32 rounded-full bg-linear-to-tr from-transparent via-white/20 to-white/32 shadow-[inset_0_6px_12px_rgba(255,255,255,0.4)]" />

          <img
            src={frameCirc}
            alt="Circular frame"
            className="pointer-events-none absolute inset-0 z-30 h-full w-full select-none object-contain"
          />

          {isActive && (
            <div
              className="absolute -inset-4 z-0 rounded-full blur-3xl opacity-80 transition duration-700 animate-pulse"
              style={{ backgroundColor: accent.glow }}
            />
          )}
        </div>

        {hasTitle && (
          <div className="relative mt-auto mb-10 text-center">
            <span
              className="inline-flex items-center justify-center rounded-full border border-[#2d1c0b]/60 px-4 py-0.5 shadow-[0_2px_6px_rgba(0,0,0,0.45)] backdrop-blur-[1px]"
              style={{
                background:
                  'linear-gradient(120deg, rgba(244,229,173,0.78) 0%, rgba(188,135,62,0.72) 45%, rgba(72,47,21,0.65) 100%)',
              }}
            >
              <h3
                className="font-serif text-[0.84rem] font-semibold uppercase tracking-[0.18em] text-[#c89357]"
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
    </motion.div>
  );
};

export default MarbleMedallionCard;
