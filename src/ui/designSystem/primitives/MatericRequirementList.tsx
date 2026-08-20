import React from 'react';
import {
  WanderlustRequirementList,
  type WanderlustRequirementListProps,
  type WanderlustRequirement,
} from '@/ui/wanderlust-surface/layout/WanderlustLayout';

export type { WanderlustRequirement as MatericRequirement };
export interface MatericRequirementListProps extends WanderlustRequirementListProps {}

/**
 * Canonical materic requirement list (current vs required checks).
 */
export const MatericRequirementList: React.FC<MatericRequirementListProps> = (props) => (
  <WanderlustRequirementList {...props} />
);

export default MatericRequirementList;
