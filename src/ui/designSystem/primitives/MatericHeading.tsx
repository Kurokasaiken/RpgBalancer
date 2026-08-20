import React from 'react';
import {
  WanderlustHeading,
  type WanderlustHeadingProps,
} from '@/ui/wanderlust-surface/layout/WanderlustLayout';

export interface MatericHeadingProps extends WanderlustHeadingProps {}

/**
 * Canonical materic heading (title + optional subtitle + description).
 */
export const MatericHeading: React.FC<MatericHeadingProps> = (props) => <WanderlustHeading {...props} />;

export default MatericHeading;
