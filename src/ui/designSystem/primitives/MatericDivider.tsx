import React from 'react';
import {
  WanderlustDivider,
  type WanderlustDividerProps,
} from '@/ui/wanderlust-surface/layout/WanderlustLayout';

export interface MatericDividerProps extends WanderlustDividerProps {}

/**
 * Canonical materic horizontal divider.
 */
export const MatericDivider: React.FC<MatericDividerProps> = (props) => <WanderlustDivider {...props} />;

export default MatericDivider;
