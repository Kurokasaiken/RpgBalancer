import { useEffect, useMemo, useRef, useState } from 'react';
import type { RuntimeObject } from '../../../engine/world/model/RuntimeObject';
import { getCreatureSVG } from '../../../engine/world/presentation/effects/seaCreatureVisuals';
import { wonderSpawnDefaults } from '../config/seaWonders';
import type { SeaWonderEntrance } from '../config/seaWonders';

export interface WorldSurfaceCreaturesProps {
  enabled?: boolean;
  zIndex: number;
  creatures: RuntimeObject[];
  zoom: number;
}

/**
 * Renders sea creatures and rare wonders from runtime objects.
 *
 * - `sea_creature` objects are drawn as SVG silhouettes.
 * - `wonder` objects are rendered from the artist's PNG assets and can carry
 *   an intro animation such as the kraken rising from below.
 */
export function WorldSurfaceCreatures({
  enabled = true,
  zIndex,
  creatures,
  zoom,
}: WorldSurfaceCreaturesProps) {
  // Both early returns come after the hook: bailing out above it changes the hook
  // count between renders, and React throws the moment `enabled` is toggled.
  const seaCreatures = useMemo(
    () =>
      creatures.filter(
        (obj) =>
          obj.type === 'wonder' ||
          (obj.type === 'sea_creature' &&
            obj.visual?.renderMode === 'creature' &&
            (obj.visual as any).creatureType),
      ),
    [creatures],
  );

  const [displayed, setDisplayed] = useState<
    Record<string, { creature: RuntimeObject; exiting: boolean }>
  >({});
  const exitTimersRef = useRef<Record<string, ReturnType<typeof window.setTimeout>>>({});

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    setDisplayed((prev) => {
      const next: Record<string, { creature: RuntimeObject; exiting: boolean }> = {};
      for (const creature of seaCreatures) {
        next[creature.id] = { creature, exiting: false };
      }
      for (const id of Object.keys(prev)) {
        if (!next[id]) {
          next[id] = { ...prev[id], exiting: true };
        }
      }
      return next;
    });
  }, [seaCreatures]);
  /* eslint-enable react-hooks/set-state-in-effect */

  useEffect(() => {
    const currentIds = new Set(Object.keys(displayed));
    for (const [id, item] of Object.entries(displayed)) {
      if (item.exiting) {
        if (!exitTimersRef.current[id]) {
          exitTimersRef.current[id] = window.setTimeout(() => {
            setDisplayed((prev) => {
              const copy = { ...prev };
              delete copy[id];
              return copy;
            });
            delete exitTimersRef.current[id];
          }, wonderSpawnDefaults.riseDurationMs);
        }
      } else if (exitTimersRef.current[id]) {
        window.clearTimeout(exitTimersRef.current[id]);
        delete exitTimersRef.current[id];
      }
    }
    for (const id of Object.keys(exitTimersRef.current)) {
      if (!currentIds.has(id)) {
        window.clearTimeout(exitTimersRef.current[id]);
        delete exitTimersRef.current[id];
      }
    }
  }, [displayed]);

  useEffect(() => {
    return () => {
      for (const id of Object.keys(exitTimersRef.current)) {
        window.clearTimeout(exitTimersRef.current[id]);
      }
    };
  }, []);

  if (!enabled) return null;
  const displayList = Object.values(displayed);
  if (displayList.length === 0) return null;

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
      <style>{`
        /*
         * Rise/surface effect: the creature is inside a masked window whose bottom
         * edge is the invisible waterline.  The <img> starts at translateY(100%)
         * (entirely below the waterline) and slides up until its bottom rests on the
         * line.  Only the part that crosses above the line is visible, giving the
         * illusion of emerging from the sea.
         *
         * Exit plays a dedicated keyframe in the same direction:
         * - Rise: from translateY(0) back to translateY(100%) — it sinks again.
         * - Sail: from the anchor to the forward offset, as if the ship keeps sailing.
         */
        @keyframes wsWonderRise {
          0% { transform: translateY(100%); }
          100% { transform: translateY(0); }
        }
        @keyframes wsWonderRiseExit {
          0% { transform: translateY(0); }
          100% { transform: translateY(100%); }
        }
        @keyframes wsWonderFade {
          0% { opacity: 0; }
          100% { opacity: var(--ws-wonder-opacity); }
        }
        @keyframes wsWonderSail {
          0% {
            opacity: 0;
            transform: translate(calc(-50% + var(--ws-wonder-sail-dx)), calc(-50% + var(--ws-wonder-sail-dy))) scale(var(--ws-wonder-scale));
          }
          100% {
            opacity: var(--ws-wonder-opacity);
            transform: translate(-50%, -50%) scale(var(--ws-wonder-scale));
          }
        }
        @keyframes wsWonderSailExit {
          0% {
            opacity: var(--ws-wonder-opacity);
            transform: translate(-50%, -50%) scale(var(--ws-wonder-scale));
          }
          80% {
            opacity: var(--ws-wonder-opacity);
            transform: translate(calc(-50% + var(--ws-wonder-sail-exit-dx)), calc(-50% + var(--ws-wonder-sail-exit-dy))) scale(var(--ws-wonder-scale));
          }
          100% {
            opacity: 0;
            transform: translate(calc(-50% + var(--ws-wonder-sail-exit-dx)), calc(-50% + var(--ws-wonder-sail-exit-dy))) scale(calc(var(--ws-wonder-scale) * 0.92));
          }
        }
        @keyframes wsWonderExit {
          0% {
            opacity: var(--ws-wonder-opacity);
            transform: translate(-50%, -50%) scale(var(--ws-wonder-scale));
          }
          100% {
            opacity: 0;
            transform: translate(-50%, calc(-50% + 10%)) scale(calc(var(--ws-wonder-scale) * 0.85));
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .ws-wonder,
          .ws-wonder-exiting,
          .ws-wonder__img {
            animation: none !important;
          }
        }
      `}</style>

      {displayList.map(({ creature, exiting }) => (
        <CreatureMarker key={creature.id} creature={creature} zoom={zoom} exiting={exiting} />
      ))}
    </div>
  );
}

interface CreatureMarkerProps {
  creature: RuntimeObject;
  zoom: number;
  exiting?: boolean;
}

const CreatureMarker = ({ creature, zoom, exiting = false }: CreatureMarkerProps) => {
  const { x, y } =
    creature.location.mode === 'dynamic'
      ? { x: creature.location.x, y: creature.location.y }
      : { x: 0, y: 0 };

  const width = (creature.data?.width as number) ?? 80;
  const height = (creature.data?.height as number) ?? 90;
  const opacity = (creature.data?.opacity as number) ?? 0.7;
  const animation = (creature.data?.animation as 'rise' | 'fade' | undefined) ?? undefined;
  const entrance = (creature.data?.entrance as SeaWonderEntrance | undefined) ?? undefined;
  const tint = creature.visual?.tint ?? '#4a7c7e';
  const glow = creature.visual?.glow ?? true;

  if (creature.type === 'wonder') {
    const dataSrc = (creature.data?.src as string) ?? '';
    const src = dataSrc.startsWith('/') ? dataSrc : `/assets/atmosphere/${dataSrc}`;

    let outerAnimationName: string | undefined;
    let outerDurationMs = wonderSpawnDefaults.fadeDurationMs;
    let outerTimingFunction = 'ease-out';
    let imgAnimationName: string | undefined;
    let imgDurationMs = wonderSpawnDefaults.riseDurationMs;
    let imgTimingFunction = 'cubic-bezier(.45,.05,.55,.95)';
    const extraVars: Record<string, string | number> = {};

    if (exiting) {
      if (entrance?.type === 'sail') {
        outerAnimationName = 'wsWonderSailExit';
        outerDurationMs = wonderSpawnDefaults.riseDurationMs;
        outerTimingFunction = 'ease-in';
      } else if (entrance?.type === 'rise' || (!entrance && animation === 'rise')) {
        imgAnimationName = 'wsWonderRiseExit';
        imgDurationMs = wonderSpawnDefaults.riseDurationMs;
        imgTimingFunction = 'ease-in';
      } else {
        outerAnimationName = 'wsWonderExit';
        outerDurationMs = wonderSpawnDefaults.fadeDurationMs;
        outerTimingFunction = 'ease-in';
      }
    } else if (entrance?.type === 'rise' || (!entrance && animation === 'rise')) {
      imgAnimationName = 'wsWonderRise';
      imgDurationMs = wonderSpawnDefaults.riseDurationMs;
      imgTimingFunction = 'cubic-bezier(.45,.05,.55,.95)';
    } else if (entrance?.type === 'sail') {
      outerAnimationName = 'wsWonderSail';
      outerDurationMs = wonderSpawnDefaults.riseDurationMs;
      outerTimingFunction = 'cubic-bezier(.22,.61,.36,1)';
    } else if (entrance?.type === 'fade' || animation === 'fade') {
      outerAnimationName = 'wsWonderFade';
      outerDurationMs = wonderSpawnDefaults.fadeDurationMs;
      outerTimingFunction = 'ease-out';
    }

    if (entrance?.type === 'sail') {
      const angle = (entrance.sailAngle ?? 0) * (Math.PI / 180);
      const distance = entrance.sailDistance ?? 60;
      const dx = -Math.cos(angle) * distance;
      const dy = -Math.sin(angle) * distance;
      const exitDistance = distance * 2;
      const exitDx = Math.cos(angle) * exitDistance;
      const exitDy = Math.sin(angle) * exitDistance;
      extraVars['--ws-wonder-sail-dx'] = `${dx.toFixed(2)}%`;
      extraVars['--ws-wonder-sail-dy'] = `${dy.toFixed(2)}%`;
      extraVars['--ws-wonder-sail-exit-dx'] = `${exitDx.toFixed(2)}%`;
      extraVars['--ws-wonder-sail-exit-dy'] = `${exitDy.toFixed(2)}%`;
    }

    const outerStyle: React.CSSProperties = {
      position: 'absolute',
      left: x,
      top: y,
      transform: `translate(-50%, -50%) scale(var(--ws-wonder-scale))`,
      transformOrigin: 'center',
      width,
      height,
      overflow: 'hidden',
      opacity,
      willChange: outerAnimationName || exiting ? 'transform, opacity' : 'opacity',
      ['--ws-wonder-opacity' as string]: opacity,
      ['--ws-wonder-scale' as string]: `${1 / zoom}`,
      ...extraVars,
      animationName: outerAnimationName,
      animationDuration: outerAnimationName ? `${outerDurationMs}ms` : undefined,
      animationTimingFunction: outerAnimationName ? outerTimingFunction : undefined,
      animationFillMode: outerAnimationName ? 'both' : undefined,
      filter: glow && !exiting ? `drop-shadow(0 0 ${8 / zoom}px ${tint})` : undefined,
    };

    const imgStyle: React.CSSProperties = {
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      objectFit: 'contain',
      pointerEvents: 'none',
    };

    if (imgAnimationName) {
      imgStyle.animationName = imgAnimationName;
      imgStyle.animationDuration = `${imgDurationMs}ms`;
      imgStyle.animationTimingFunction = imgTimingFunction;
      imgStyle.animationFillMode = 'both';
      imgStyle.willChange = 'transform';
    }

    return (
      <div className={exiting ? 'ws-wonder-exiting' : 'ws-wonder'} style={outerStyle}>
        <img
          src={src}
          alt=""
          className="ws-wonder__img"
          style={imgStyle}
        />
      </div>
    );
  }

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
