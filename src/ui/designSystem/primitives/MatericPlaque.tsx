import React from 'react';

export interface MatericPlaqueProps extends React.HTMLAttributes<HTMLSpanElement> {
  children: React.ReactNode;
}

/**
 * Canonical materic plaque — a small engraved badge (e.g. "Expedition").
 *
 * Uses the existing `--skin-plaque-*` token set. The visual rules mirror the
 * `.skin-plaque` reference in `fidelity-header.css`.
 */
export const MatericPlaque: React.FC<MatericPlaqueProps> = ({ children, style, ...rest }) => (
  <span
    data-skin="plaque"
    style={{
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 'var(--skin-plaque-padding)',
      border: 'var(--skin-plaque-border)',
      borderRadius: 'var(--skin-plaque-radius)',
      backgroundColor: 'var(--skin-plaque-bg)',
      backdropFilter: 'blur(8px)',
      WebkitBackdropFilter: 'blur(8px)',
      boxShadow: 'var(--skin-plaque-shadow)',
      fontFamily: "'Cinzel', 'Georgia', serif",
      fontSize: '0.62rem',
      fontWeight: 700,
      textTransform: 'uppercase',
      letterSpacing: 'var(--skin-plaque-tracking)',
      color: 'var(--skin-plaque-color)',
      textShadow: '0 0 8px rgba(201, 162, 39, 0.6), 0 1px 2px rgba(0, 0, 0, 0.7)',
      whiteSpace: 'nowrap',
      ...style,
    }}
    {...rest}
  >
    {children}
  </span>
);

export default MatericPlaque;
