import React from 'react';
import {
  WanderlustAmbientField,
  type WanderlustAmbientFieldProps,
} from '@/ui/wanderlust-surface/layout/WanderlustAmbientField';

export interface MatericAmbientFieldProps extends WanderlustAmbientFieldProps {}

/**
 * Canonical materic ambient field.
 *
 * `MatericAmbientField` is the gate-candidate re-export of `WanderlustAmbientField`.
 * It renders the atmospheric background (nebula, vignette, light leak, fireflies)
 * behind content, inside a `MatericSurface` or a well.
 */
export const MatericAmbientField: React.FC<MatericAmbientFieldProps> = (props) => (
  <WanderlustAmbientField {...props} />
);

export default MatericAmbientField;
