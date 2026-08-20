import React from 'react';
import {
  WanderlustSurface,
  type WanderlustSurfaceProps,
  type WanderlustShape,
  type MaterialLayerConfig,
} from '@/ui/wanderlust-surface/WanderlustSurface';

export type { WanderlustShape as MatericShape, MaterialLayerConfig as MatericLayerConfig };

export interface MatericSurfaceProps extends WanderlustSurfaceProps {}

/**
 * Canonical materic surface primitive.
 *
 * `MatericSurface` is the gate-candidate re-export of `WanderlustSurface`. It
 * provides the root shaped panel with bronze border, material preset, and
 * optional material layer composition. Use it as the outermost container for
 * any materic UI block.
 *
 * @example
 * ```tsx
 * <MatericSurface shape="panel" material="bronze" interactive>
 *   <h2>Panel content</h2>
 * </MatericSurface>
 * ```
 */
export const MatericSurface: React.FC<MatericSurfaceProps> = (props) => <WanderlustSurface {...props} />;

export default MatericSurface;
