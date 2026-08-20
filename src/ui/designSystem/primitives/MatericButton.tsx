import React from 'react';
import {
  SkinButton,
  type SkinButtonProps,
  type SkinButtonVariant,
} from '@/ui/idleVillage/skins/primitives/SkinButton';

export type { SkinButtonVariant as MatericButtonVariant };
export interface MatericButtonProps extends SkinButtonProps {}

/**
 * Canonical materic button (utility, secondary, cta).
 */
export const MatericButton: React.FC<MatericButtonProps> = (props) => <SkinButton {...props} />;

export default MatericButton;
