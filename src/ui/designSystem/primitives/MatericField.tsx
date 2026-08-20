import React from 'react';
import {
  WanderlustField,
  type WanderlustFieldProps,
  type FieldOrientation,
  type Tier,
} from '@/ui/wanderlust-surface/layout/WanderlustLayout';

export type { FieldOrientation as MatericFieldOrientation, Tier as MatericFieldTier };
export interface MatericFieldProps extends WanderlustFieldProps {}

/**
 * Canonical materic field (label/value pair).
 */
export const MatericField: React.FC<MatericFieldProps> = (props) => <WanderlustField {...props} />;

export default MatericField;
