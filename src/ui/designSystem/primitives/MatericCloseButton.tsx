import React from 'react';
import {
  SkinCloseButton,
  type SkinCloseButtonProps,
} from '@/ui/idleVillage/skins/primitives/SkinCloseButton';

export interface MatericCloseButtonProps extends SkinCloseButtonProps {}

/**
 * Canonical materic close button (gold radial coin).
 */
export const MatericCloseButton: React.FC<MatericCloseButtonProps> = (props) => (
  <SkinCloseButton {...props} />
);

export default MatericCloseButton;
