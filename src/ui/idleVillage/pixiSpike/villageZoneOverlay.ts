import { Container, Sprite, Texture } from 'pixi.js';

/**
 * PLAN-089 T-012 pilot: the village-cradle zone as its own layer on `/mappa2-lab`.
 * Self-contained mount (same contract as `regionalWeatherOverlay`): fetches
 * `village.json` from the pack, loads the stage textures, places one sprite
 * pair over the zone rect (z above terrain/canopy) and cross-fades between
 * stages. Sprite-only — Canvas-safe by construction.
 *
 * Live state is read per-tick from `villageZoneLive` so the lab sliders take
 * effect without remounting. No shaders, no meshes, no masks.
 */

export const VILLAGE_ZONE_Z = 4;

interface VillageManifest {
  zone: { x: number; y: number; w: number; h: number };
  stages: string[];
  stageNames: string[];
}

/** Mutable knobs the lab writes and the overlay reads each tick. */
export const villageZoneLive = {
  visible: true,
  /** 0..stages-1 continuous: fractional values cross-fade neighbouring stages. */
  stage: 1,
};

export interface VillageZoneMountDeps {
  pack: { packRoot: string };
  world: Container;
  load: (url: string) => Promise<Texture>;
  fetchJson: <T>(url: string) => Promise<T>;
  ticks: { push: (fn: (t: number) => void) => void };
  packAssetUrl: (root: string, file: string) => string;
  disposed: () => boolean;
}

export interface VillageZoneRuntime {
  box: Container;
}

/** Mounts the overlay; no-op unless the pack ships `fx/village/village.json`. */
export async function mountVillageZone(deps: VillageZoneMountDeps): Promise<VillageZoneRuntime | null> {
  const { pack, world, load, fetchJson, ticks, packAssetUrl, disposed } = deps;
  const raw = await fetchJson<VillageManifest>(packAssetUrl(pack.packRoot, 'fx/village/village.json')).catch(() => null);
  if (!raw || disposed()) return null;

  const textures = await Promise.all(
    raw.stages.map((f) => load(packAssetUrl(pack.packRoot, `fx/village/${f}`)).catch(() => null)),
  );
  const usable = textures.filter((t): t is Texture => !!t);
  if (!usable.length || disposed()) return null;

  const box = new Container();
  box.label = 'village-zone';
  box.zIndex = VILLAGE_ZONE_Z;
  box.position.set(raw.zone.x, raw.zone.y);
  world.addChild(box);

  const lower = new Sprite(usable[0]);
  const upper = new Sprite(usable[Math.min(1, usable.length - 1)]);
  for (const sp of [lower, upper]) {
    sp.width = raw.zone.w;
    sp.height = raw.zone.h;
    box.addChild(sp);
  }

  const texAt = (i: number): Texture => usable[Math.max(0, Math.min(usable.length - 1, i))];

  ticks.push(() => {
    box.visible = villageZoneLive.visible;
    if (!box.visible) return;
    const t = Math.max(0, Math.min(usable.length - 1.0001, villageZoneLive.stage));
    const i0 = Math.floor(t);
    const f = t - i0;
    lower.texture = texAt(i0);
    upper.texture = texAt(i0 + 1);
    upper.alpha = f;
  });

  return { box };
}
