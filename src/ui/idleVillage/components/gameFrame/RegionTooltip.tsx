import { HudPlaque } from '@/ui/idleVillage/skins/primitives';

export interface RegionTooltipProps {
  /** Already i18n-resolved territory name. */
  name: string;
  /** Where the territory's centre is on screen, px relative to the map; the plate sits centred on it. */
  x: number;
  y: number;
}

/**
 * Name plate laid on a territory like a cartographer's label: centred on the region (it follows pan and zoom),
 * fading in with the highlight. Never takes the pointer itself.
 */
export function RegionTooltip({ name, x, y }: RegionTooltipProps) {
  return (
    <HudPlaque
      shape="plinth"
      role="tooltip"
      style={{
        position: 'absolute',
        left: x,
        top: y,
        transform: 'translate(-50%, -50%)',
        padding: '8px 22px',
        animation: 'region-label-in 260ms ease-out',
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
      <style>{'@keyframes region-label-in { from { opacity: 0; transform: translate(-50%, -38%); } to { opacity: 1; transform: translate(-50%, -50%); } }'}</style>
      {name}
    </HudPlaque>
  );
}

export default RegionTooltip;
