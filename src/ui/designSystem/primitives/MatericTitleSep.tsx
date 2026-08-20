import React from 'react';

export interface MatericTitleSepProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Center ornament (default "✦"). */
  ornament?: React.ReactNode;
}

/**
 * Canonical materic title separator with a center diamond/ornament.
 *
 * Mirrors `.skin-titlesep` from `fidelity-header.css`.
 */
export const MatericTitleSep: React.FC<MatericTitleSepProps> = ({
  ornament = '✦',
  style,
  className,
  ...rest
}) => (
  <div
    data-skin="titlesep"
    className={className}
    style={{
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      margin: '8px 0 4px',
      ...style,
    }}
    {...rest}
  >
    <span
      style={{
        flex: 1,
        height: 1,
        background: 'var(--skin-titlesep-line)',
      }}
    />
    <span
      style={{
        fontSize: 12,
        lineHeight: 1,
        color: 'var(--skin-titlesep-diamond-color)',
        textShadow: 'var(--skin-titlesep-diamond-glow)',
      }}
    >
      {ornament}
    </span>
    <span
      style={{
        flex: 1,
        height: 1,
        background: 'var(--skin-titlesep-line)',
      }}
    />
  </div>
);

export default MatericTitleSep;
