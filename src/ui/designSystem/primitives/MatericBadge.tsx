import React from 'react';
import { SkinBadge, type SkinBadgeProps } from '@/ui/idleVillage/skins/primitives/SkinBadge';

export interface MatericBadgeProps extends SkinBadgeProps {}

/**
 * Canonical materic badge (azure status pill).
 */
export const MatericBadge: React.FC<MatericBadgeProps> = (props) => <SkinBadge {...props} />;

export default MatericBadge;
