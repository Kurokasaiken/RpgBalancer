import { HudPlaque } from '@/ui/idleVillage/skins/primitives';

export interface RegionTooltipProps {
  /** Already i18n-resolved territory name. */
  name: string;
  /** Pointer position in px relative to the map. */
  x: number;
  y: number;
}

/** Name plate that follows the pointer over a territory of the map. Never takes the pointer itself. */
export function RegionTooltip({ name, x, y }: RegionTooltipProps) {
  return (
    <HudPlaque
      shape="panel"
      role="tooltip"
      style={{
        position: 'absolute',
        left: x + 16,
        top: y + 18,
        padding: '6px 14px',
        pointerEvents: 'none',
        whiteSpace: 'nowrap',
        fontFamily: 'var(--skin-font-display)',
        fontSize: 13,
        fontWeight: 600,
        letterSpacing: '0.12em',
        textTransform: 'uppercase',
        color: 'var(--skin-label-primary)',
      }}
    >
      {name}
    </HudPlaque>
  );
}

export default RegionTooltip;
