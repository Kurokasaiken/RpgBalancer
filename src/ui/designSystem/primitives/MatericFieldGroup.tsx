import React from 'react';
import {
  WanderlustFieldGroup,
  type WanderlustFieldGroupProps,
  type GroupLayout,
  type Density,
} from '@/ui/wanderlust-surface/layout/WanderlustLayout';

export type { GroupLayout as MatericGroupLayout, Density as MatericDensity };
export interface MatericFieldGroupProps extends WanderlustFieldGroupProps {}

/**
 * Canonical materic field group (columns/rows/grid of fields).
 */
export const MatericFieldGroup: React.FC<MatericFieldGroupProps> = (props) => (
  <WanderlustFieldGroup {...props} />
);

export default MatericFieldGroup;
