import type { Variants } from 'framer-motion';

export type MarbleCardTone = 'neutral' | 'job' | 'quest' | 'danger' | 'system' | 'day' | 'night';

export interface MarbleToneStyle {
  glow: string;
  ringStart: string;
  ringTrail: string;
  iconBackground: string;
  iconColor: string;
}

export const TONE_STYLES: Record<MarbleCardTone, MarbleToneStyle> = {
  neutral: {
    glow: 'rgba(255, 255, 255, 0.35)',
    ringStart: '#f7e6cb',
    ringTrail: 'rgba(255,255,255,0.15)',
    iconBackground: 'linear-gradient(135deg,#0f172a,#1f2937,#0f172a)',
    iconColor: '#fde68a',
  },
  job: {
    glow: 'rgba(255, 215, 0, 0.35)',
    ringStart: '#ffcb47',
    ringTrail: 'rgba(255, 207, 102, 0.2)',
    iconBackground: 'linear-gradient(135deg,#0a1f24,#06373d,#0a1f24)',
    iconColor: '#ffe7ab',
  },
  quest: {
    glow: 'rgba(71, 228, 255, 0.35)',
    ringStart: '#41d8ff',
    ringTrail: 'rgba(65, 216, 255, 0.15)',
    iconBackground: 'linear-gradient(135deg,#041128,#0a1f44,#041128)',
    iconColor: '#cdefff',
  },
  danger: {
    glow: 'rgba(255, 90, 90, 0.45)',
    ringStart: '#ff7b7b',
    ringTrail: 'rgba(255, 107, 107, 0.2)',
    iconBackground: 'linear-gradient(135deg,#220505,#470a0a,#220505)',
    iconColor: '#ffe7e7',
  },
  system: {
    glow: 'rgba(180, 148, 255, 0.4)',
    ringStart: '#c7a4ff',
    ringTrail: 'rgba(199, 164, 255, 0.25)',
    iconBackground: 'linear-gradient(135deg,#1a0a34,#2b0a4e,#1a0a34)',
    iconColor: '#f4e6ff',
  },
  day: {
    glow: 'rgba(255, 255, 190, 0.45)',
    ringStart: '#ffe9a2',
    ringTrail: 'rgba(255, 233, 162, 0.2)',
    iconBackground: 'linear-gradient(135deg,#33230d,#664316,#33230d)',
    iconColor: '#fff5cc',
  },
  night: {
    glow: 'rgba(109, 150, 255, 0.45)',
    ringStart: '#7f9dff',
    ringTrail: 'rgba(127, 157, 255, 0.2)',
    iconBackground: 'linear-gradient(135deg,#040814,#0a1528,#040814)',
    iconColor: '#e4edff',
  },
};

export const cardVariants: Variants = {
  resting: { rotateX: 15, rotateY: 0, z: 0 },
  hover: { rotateX: 4, rotateY: 2, z: 6 },
  tap: { rotateX: 0, rotateY: 0, z: 2, scale: 0.98 },
};

export const clampProgressPercent = (value: number | undefined): number => {
  if (value === undefined || !Number.isFinite(value)) return 0;
  return Math.min(Math.max(value * 100, 0), 100);
};
