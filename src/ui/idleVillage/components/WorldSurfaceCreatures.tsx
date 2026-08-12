import { useMemo } from 'react';
import type { RuntimeObject } from '../../../engine/world/model/RuntimeObject';
import { getCreatureSVG } from '../../../engine/world/presentation/effects/seaCreatureVisuals';

export interface WorldSurfaceCreaturesProps {
  enabled?: boolean;
  zIndex: number;
  creatures: RuntimeObject[];
  zoom: number;
}

/**
 * Renders sea creatures from runtime objects as SVG silhouettes.
 *
 * Each creature is positioned in world coordinates and scaled to its configured
 * width/height. SVG is inlined and tinted via CSS currentColor.
 */
export function WorldSurfaceCreatures({
  enabled = true,
  zIndex,
  creatures,
  zoom,
}: WorldSurfaceCreaturesProps) {
  if (!enabled) return null;

  const seaCreatures = useMemo(
    () =>
      creatures.filter(
        (obj) =>
          obj.type === 'sea_creature' &&
          obj.visual?.renderMode === 'creature' &&
          (obj.visual as any).creatureType,
      ),
    [creatures],
  );

  if (seaCreatures.length === 0) return null;

  return (
    <div
      aria-hidden="true"
      style={{
        position: 'absolute',
        inset: 0,
        zIndex,
        overflow: 'hidden',
        pointerEvents: 'none',
      }}
    >
      {seaCreatures.map((creature) => (
        <CreatureMarker key={creature.id} creature={creature} zoom={zoom} />
      ))}
    </div>
  );
}

interface CreatureMarkerProps {
  creature: RuntimeObject;
  zoom: number;
}

const CreatureMarker = ({ creature, zoom }: CreatureMarkerProps) => {
  const { x, y } = creature.location.mode === 'dynamic'
    ? { x: creature.location.x, y: creature.location.y }
    : { x: 0, y: 0 };

  const width = (creature.data?.width as number) ?? 80;
  const height = (creature.data?.height as number) ?? 90;
  const opacity = (creature.data?.opacity as number) ?? 0.7;
  const tint = creature.visual?.tint ?? '#4a7c7e';
  const glow = creature.visual?.glow ?? true;
  const creatureType = (creature.visual as any)?.creatureType ?? 'octopus';

  const svg = getCreatureSVG(creatureType);

  const style: React.CSSProperties = {
    position: 'absolute',
    left: x,
    top: y,
    transform: `translate(-50%, -50%) scale(${1 / zoom})`,
    transformOrigin: 'center',
    width,
    height,
    opacity,
    color: tint,
    filter: glow ? `drop-shadow(0 0 ${6 / zoom}px ${tint})` : undefined,
    willChange: 'opacity',
  };

  return (
    <div
      style={style}
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
};

export default WorldSurfaceCreatures;
