import React from 'react';

interface CardSocketProps {
  className?: string;
  style?: React.CSSProperties;
  /** Must match the PgCard variant to preserve identical box dimensions */
  horizontal?: boolean;
}

/**
 * CardSocket — empty placeholder that occupies the EXACT same space as PgCard.
 *
 * CRITICAL: width, height, padding, border-radius and margin MUST mirror PgCard
 * so that swapping card ↔ socket never triggers a layout recalculation.
 */
export function CardSocket({ className = '', style, horizontal = true }: CardSocketProps) {
  return (
    <div 
      className={`
        relative rounded-2xl border border-stone-700/40
        bg-black/20
        ${className}
      `}
      style={{
        ...style,
        // Match PgCard height: horizontal ~72px content + padding, vertical ~130px
        minHeight: horizontal ? 72 : 130,
        boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.3)',
      }}
      data-card-socket="true"
    />
  );
}
