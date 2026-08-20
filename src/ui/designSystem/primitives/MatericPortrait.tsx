import React from 'react';
import {
  WanderlustPortrait,
  type WanderlustPortraitProps,
} from '@/ui/wanderlust-surface/layout/WanderlustPortrait';

export interface MatericPortraitProps extends WanderlustPortraitProps {}

/**
 * Canonical materic circular portrait (image or initials, gold frame).
 */
export const MatericPortrait: React.FC<MatericPortraitProps> = (props) => (
  <WanderlustPortrait {...props} />
);

export default MatericPortrait;
