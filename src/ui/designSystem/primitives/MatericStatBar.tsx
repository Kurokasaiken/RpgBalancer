import React from 'react';
import {
  WanderlustStatBar,
  type WanderlustStatBarProps,
  type StatBarVariant,
  type StatBarSize,
} from '@/ui/wanderlust-surface/layout/WanderlustStatBar';

export type { StatBarVariant as MatericStatBarVariant, StatBarSize as MatericStatBarSize };
export interface MatericStatBarProps extends WanderlustStatBarProps {}

/**
 * Canonical materic stat bar (HP, stamina, fatigue).
 *
 * `MatericStatBar` is the gate-candidate re-export of `WanderlustStatBar`.
 * It renders a carved channel with skin-token-driven fill, label and value.
 */
export const MatericStatBar: React.FC<MatericStatBarProps> = (props) => <WanderlustStatBar {...props} />;

export default MatericStatBar;
