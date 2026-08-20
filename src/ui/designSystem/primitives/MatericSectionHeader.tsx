import React from 'react';
import {
  WanderlustSectionHeader,
  type WanderlustSectionHeaderProps,
} from '@/ui/wanderlust-surface/layout/WanderlustLayout';

export interface MatericSectionHeaderProps extends WanderlustSectionHeaderProps {}

/**
 * Canonical materic section header (primary or tertiary).
 */
export const MatericSectionHeader: React.FC<MatericSectionHeaderProps> = (props) => (
  <WanderlustSectionHeader {...props} />
);

export default MatericSectionHeader;
