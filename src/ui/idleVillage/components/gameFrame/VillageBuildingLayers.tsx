import { useEffect, useState } from 'react';

/**
 * Village page layers (2026-11-09): the painting with NO buildings is the base;
 * every building is its own lossless layer placed at its box in the original
 * painting's pixel space. `base + all layers` == the original painting.
 */
export interface VillageLayer {
  id: string;
  file: string;
  /** x, y, w, h in painting px. */
  box: [number, number, number, number];
}

export interface VillageLayersManifest {
  size: [number, number];
  base: string;
  layers: VillageLayer[];
}

const LAYERS_DIR = '/assets/village/layers/';

/** Loads `layers.json` once; the page renders the empty base until it arrives. */
export function useVillageLayers(): VillageLayersManifest | null {
  const [manifest, setManifest] = useState<VillageLayersManifest | null>(null);
  useEffect(() => {
    let dead = false;
    fetch(`${LAYERS_DIR}layers.json`)
      .then((r) => (r.ok ? (r.json() as Promise<VillageLayersManifest>) : null))
      .then((m) => { if (!dead && m) setManifest(m); })
      .catch(() => undefined);
    return () => { dead = true; };
  }, []);
  return manifest;
}

export const villageLayersBaseUrl = (m: VillageLayersManifest | null) => (m ? `${LAYERS_DIR}${m.base}` : null);

/** Absolutely positioned building images, shown only for ids in `visible`. */
export function VillageBuildingLayers({ manifest, visible }: { manifest: VillageLayersManifest | null; visible: ReadonlySet<string> }) {
  if (!manifest) return null;
  const [W, H] = manifest.size;
  return (
    <>
      {manifest.layers.map((ly) => {
        const [x, y, w, h] = ly.box;
        const on = visible.has(ly.id);
        return (
          <img
            key={ly.id}
            src={`${LAYERS_DIR}${ly.file}`}
            alt=""
            draggable={false}
            data-village-layer={ly.id}
            data-visible={on ? 'true' : 'false'}
            style={{
              position: 'absolute',
              left: `${(x / W) * 100}%`,
              top: `${(y / H) * 100}%`,
              width: `${(w / W) * 100}%`,
              height: `${(h / H) * 100}%`,
              opacity: on ? 1 : 0,
              transition: 'opacity 260ms ease-out',
              pointerEvents: 'none',
              userSelect: 'none',
            }}
          />
        );
      })}
    </>
  );
}

/** Row of toggles: one per building, shown or hidden in place. */
export function VillageLayerToggles({
  manifest,
  visible,
  onToggle,
}: {
  manifest: VillageLayersManifest | null;
  visible: ReadonlySet<string>;
  onToggle: (id: string) => void;
}) {
  if (!manifest) return null;
  return (
    <div
      data-testid="village-layer-toggles"
      style={{ position: 'absolute', left: 8, bottom: 8, display: 'flex', gap: 6, flexWrap: 'wrap', zIndex: 2 }}
    >
      {manifest.layers.map((ly) => {
        const on = visible.has(ly.id);
        return (
          <button
            key={ly.id}
            type="button"
            aria-pressed={on}
            data-village-toggle={ly.id}
            onClick={() => onToggle(ly.id)}
            style={{
              padding: '4px 8px',
              fontSize: 12,
              borderRadius: 4,
              border: '1px solid rgba(255,255,255,0.35)',
              background: on ? 'rgba(224,169,78,0.9)' : 'rgba(10,25,35,0.75)',
              color: on ? '#0d1f2d' : '#e8f1f5',
              cursor: 'pointer',
            }}
          >
            {ly.id}
          </button>
        );
      })}
    </div>
  );
}
