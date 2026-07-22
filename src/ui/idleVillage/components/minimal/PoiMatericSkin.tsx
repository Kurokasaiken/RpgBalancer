import type { JSX } from 'react';
import { GenericPoiSkin } from './GenericPoiSkin';
import { getPoiMatericSkinProps } from '@/ui/idleVillage/skins/poi/poiMatericSkinConfig';

export interface PoiMatericSkinProps {
  icon?: string;
  label?: string;
  progress?: number;
  size?: number;
}

/**
 * POI medallion V2 wrapper using the Materic stone/bronze palette.
 *
 * Wraps the canonical GenericPoiSkin with config-driven props so the
 * canonical component is not modified.
 */
export function PoiMatericSkin(props: PoiMatericSkinProps): JSX.Element {
  const { icon = '🗿', label, progress, size } = props;
  const matericProps = getPoiMatericSkinProps({
    icon,
    label,
    ...(progress !== undefined && { progress }),
    ...(size !== undefined && { size }),
  });

  return <GenericPoiSkin {...matericProps} />;
}
