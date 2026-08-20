import React from 'react';
import { BezelMolding, WellBronzeBezel } from '@/ui/visualFidelityLab/plateVariants';

/**
 * Variants of the canonical materic frame.
 *
 * - `molding`: a complete plate with an NMM sculpted metal band, dark floor,
 *   and content area. Use this when the frame *is* the container.
 * - `bronze-bezel`: a frame-only overlay that sits on top of a well that
 *   already owns its background. Use this when you only need the border band.
 */
export type MatericFrameVariant = 'molding' | 'bronze-bezel';

export interface MatericFrameProps {
  /** Frame style. */
  variant?: MatericFrameVariant;
  /** Content when `variant="molding"`. Ignored for `bronze-bezel`. */
  children?: React.ReactNode;
  /** Additional CSS class. */
  className?: string;
  /** Inline styles. */
  style?: React.CSSProperties;
  /**
   * Bezel thickness in pixels.
   * For `bronze-bezel` this is the band width.
   * For `molding` the thickness is currently fixed by the original component.
   */
  band?: number;
  /** Corner radius for `bronze-bezel`. */
  rx?: number;
  /**
   * When `true`, the `bronze-bezel` band is flush with the container edge.
   * When `false`, it is inset by 1px.
   */
  flush?: boolean;
  /** When `false`, the `molding` variant draws the frame edge only (no inner floor). */
  floor?: boolean;
}

/**
 * Canonical materic frame primitive.
 *
 * Unifies the two frame primitives from the Visual Fidelity Lab under a single
 * API. `MatericFrame` is a gate candidate: it becomes canonical only after it
 * has been approved in `/visual-fidelity-lab` and adopted by at least one
 * production component.
 *
 * @example
 * ```tsx
 * <MatericFrame variant="molding">
 *   <p>Observatory content</p>
 * </MatericFrame>
 *
 * <div style={{ position: 'relative' }}>
 *   <MatericFrame variant="bronze-bezel" band={2} rx={19} flush />
 *   <div style={{ padding: 24 }}>Well content</div>
 * </div>
 * ```
 */
export const MatericFrame: React.FC<MatericFrameProps> = ({
  variant = 'molding',
  children,
  className,
  style,
  band = 1.75,
  rx = 8,
  flush = false,
  floor = true,
}) => {
  if (variant === 'bronze-bezel') {
    return <WellBronzeBezel band={band} rx={rx} flush={flush} />;
  }

  return (
    <BezelMolding className={className} style={style} floor={floor}>
      {children}
    </BezelMolding>
  );
};

export default MatericFrame;
