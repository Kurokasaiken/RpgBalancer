import React from 'react';
import {
  CarvedBar,
  type CarvedBarProps,
  type BarEnergy,
  BAR_ENERGY,
} from '@/ui/visualFidelityLab/CarvedBar';

export type { BarEnergy as MatericBarEnergy };
export { BAR_ENERGY as MATERIC_BAR_ENERGY };
export interface MatericCarvedBarProps extends CarvedBarProps {}

/**
 * Canonical materic carved bar (stepped energy channel).
 *
 * `MatericCarvedBar` is the gate-candidate re-export of `CarvedBar`. It renders
 * a carved channel with one of six semantic energy fills (hp, stamina, mana,
 * xp, danger, capacity).
 */
export const MatericCarvedBar: React.FC<MatericCarvedBarProps> = (props) => <CarvedBar {...props} />;

export default MatericCarvedBar;
