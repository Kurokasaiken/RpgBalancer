import React from 'react';

export interface MatericSlotProps {
  /** Is the slot occupied? */
  filled?: boolean;
  /** Initial/letter shown inside the coin. */
  initial?: string;
  /** Label shown under the coin. */
  label?: string;
  /** Coin size in px (default 40). */
  size?: number;
}

/**
 * Canonical materic slot (circular coin with optional label).
 *
 * This is a gate-candidate primitive extracted from the slot grid in
 * `NewObservatory`. The gradient values are intentionally explicit here because
 * the semantic slot-token contract is still being defined; the next iteration
 * should bind these to `--skin-slot-*` tokens.
 */
export const MatericSlot: React.FC<MatericSlotProps> = ({
  filled = false,
  initial = '—',
  label = '',
  size = 40,
}) => {
  const coinStyle: React.CSSProperties = {
    width: size,
    height: size,
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: 'var(--skin-font-display)',
    fontSize: 17,
    fontWeight: 800,
    color: filled ? '#3a2a0f' : 'rgba(150,125,70,0.45)',
    border: filled ? '1px solid rgba(120,84,26,0.9)' : '1px solid rgba(120,100,60,0.3)',
    background: filled
      ? 'radial-gradient(circle at 37% 27%, #f4d27e 0%, #cf9a3a 42%, #8a5e1e 78%, #5c3d12 100%)'
      : 'radial-gradient(circle at 40% 30%, rgba(50,42,24,0.55), rgba(8,12,18,0.5))',
    boxShadow: filled
      ? 'inset 0 2px 2px rgba(255,231,158,0.5), inset 0 -3px 4px rgba(60,38,10,0.8), 0 2px 3px rgba(30,18,12,0.5)'
      : 'inset 0 2px 4px rgba(8,12,18,0.6)',
    textShadow: filled ? '0 1px 0 rgba(255,236,178,0.55)' : 'none',
  };

  return (
    <div
      data-skin="slot"
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 6,
      }}
    >
      <div style={coinStyle}>{initial}</div>
      {label && (
        <span
          style={{
            fontFamily: 'var(--skin-font-display)',
            fontSize: 9,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: filled ? 'var(--skin-subtitle-color)' : 'rgba(160,140,90,0.5)',
          }}
        >
          {label}
        </span>
      )}
    </div>
  );
};

export default MatericSlot;
