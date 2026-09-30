import React, { type ReactNode } from 'react';
import { motion } from 'framer-motion';

export interface HudHangingTagProps {
  /** Small tracked caps above the body, e.g. "CURRENT OBJECTIVE". */
  eyebrow?: ReactNode;
  children: ReactNode;
  /** Length of the cord above the tag, in px. */
  cordPx?: number;
  /** Resting tilt in degrees — a hung object is never perfectly level. */
  tiltDeg?: number;
  width?: number;
}

const TAG_FILL =
  'linear-gradient(180deg, rgba(232,220,192,0.94) 0%, rgba(206,189,153,0.94) 55%, rgba(178,158,120,0.94) 100%)';

/**
 * HudHangingTag — a parchment label hung from a cord, with a pointed bottom
 * edge and a resting tilt.
 *
 * This is the reference mockup's answer to "what's next": not a panel in a
 * corner, an object pinned to the world. It hangs, it tilts, it swings a
 * little when it appears, and its silhouette is a tag — so it reads as
 * something someone attached, which is exactly the register the Director
 * asked for on the roster ("un oggetto appoggiato sopra") applied to the
 * one readout that has earned a permanent place on screen.
 */
export const HudHangingTag: React.FC<HudHangingTagProps> = ({
  eyebrow,
  children,
  cordPx = 26,
  tiltDeg = -1.6,
  width = 200,
}) => (
  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width }}>
    <span
      aria-hidden="true"
      style={{
        width: 1,
        height: cordPx,
        background: 'linear-gradient(180deg, rgba(240,207,106,0.15), rgba(240,207,106,0.55))',
      }}
    />
    <span
      aria-hidden="true"
      style={{
        width: 9,
        height: 9,
        borderRadius: '50%',
        border: '1.5px solid rgba(223,184,87,0.75)',
        background: 'radial-gradient(circle at 36% 32%, rgba(255,240,190,0.5), rgba(90,66,26,0.9))',
        marginBottom: -3,
        zIndex: 1,
      }}
    />
    <motion.div
      initial={{ rotate: tiltDeg - 4, y: -6, opacity: 0 }}
      animate={{ rotate: tiltDeg, y: 0, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 180, damping: 11 }}
      style={{
        width: '100%',
        transformOrigin: 'top center',
        padding: '9px 14px 16px',
        background: TAG_FILL,
        clipPath: 'polygon(0 0, 100% 0, 100% calc(100% - 11px), 50% 100%, 0 calc(100% - 11px))',
        boxShadow: '0 8px 18px rgba(0,0,0,0.5)',
      }}
    >
      {eyebrow != null && (
        <div
          style={{
            fontFamily: 'var(--skin-font-display)',
            fontSize: 11,
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
            color: 'rgba(92,66,24,0.85)',
            marginBottom: 5,
          }}
        >
          {eyebrow}
        </div>
      )}
      <div
        style={{
          fontFamily: 'var(--skin-font-serif)',
          fontSize: 13,
          lineHeight: 1.35,
          color: '#2c1f0c',
        }}
      >
        {children}
      </div>
    </motion.div>
  </div>
);

export default HudHangingTag;
