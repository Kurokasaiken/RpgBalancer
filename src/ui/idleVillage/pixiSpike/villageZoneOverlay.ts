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
  /** Stage patch files; `null` = the bare map (no buildings). */
  stages: (string | null)[];
  stageNames: string[];
  /** Free-placeable part sprites (palisade/wall segments, gates, towers). */
  parts?: Record<string, { file: string; scale: number }>;
  /** Named defence elements: an RGBA sprite placed in zone coordinates. */
  elements?: Record<string, { file: string; x: number; y: number; scale: number; scaleY?: number; ax?: number; ay?: number }>;
}

export interface VillagePlacedPart {
  part: string;
  x: number;
  y: number;
}

/** Mutable knobs the lab writes and the overlay reads each tick. */
export const villageZoneLive = {
  visible: true,
  /** 0..stages-1 continuous: fractional values cross-fade neighbouring stages. */
  stage: 2,
  /** Parts placed on the map by the director (world coords). */
  parts: [] as VillagePlacedPart[],
  /** Element ids (manifest presets) currently toggled on. */
  elements: [] as string[],
  /** Part id armed for the next map click; null = no placement mode. */
  armed: null as string | null,
  /** Last hover world position — drives the armed-part ghost. */
  hoverX: 0,
  hoverY: 0,
  /** Show/hide the placed-parts layer. */
  partsVisible: true,
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
    raw.stages.map((f) => (f ? load(packAssetUrl(pack.packRoot, `fx/village/${f}`)).catch(() => Texture.EMPTY) : Promise.resolve(Texture.EMPTY))),
  );
  const usable = textures;
  if (!usable.length || disposed()) return null;

  const box = new Container();
  box.label = 'village-zone';
  box.zIndex = VILLAGE_ZONE_Z;
  box.position.set(raw.zone.x, raw.zone.y);
  world.addChild(box);

  const lower = new Sprite(usable[0]);
  const upper = new Sprite(usable[Math.min(1, usable.length - 1)]);
  upper.alpha = 0;
  for (const sp of [lower, upper]) {
    sp.width = raw.zone.w;
    sp.height = raw.zone.h;
    box.addChild(sp);
  }

  const texAt = (i: number): Texture => usable[Math.max(0, Math.min(usable.length - 1, i))];

  /* ── free parts layer: placed pieces + armed ghost ── */
  const partTex = new Map<string, { tex: Texture; scale: number }>();
  if (raw.parts) {
    for (const [id, def] of Object.entries(raw.parts)) {
      const t = await load(packAssetUrl(pack.packRoot, `fx/village/parts/${def.file}`)).catch(() => null);
      if (t) partTex.set(id, { tex: t, scale: def.scale });
    }
  }
  /* ── element layer: ring / wall / towers as RGBA sprites in zone coordinates ── */
  const elementSprites = new Map<string, Sprite>();
  if (raw.elements) {
    for (const [id, def] of Object.entries(raw.elements)) {
      const t = await load(packAssetUrl(pack.packRoot, `fx/village/parts/${def.file}`)).catch(() => null);
      if (!t) continue;
      const sp = new Sprite(t);
      sp.anchor.set(def.ax ?? 0.5, def.ay ?? 0.5);
      sp.scale.set(def.scale, def.scaleY ?? def.scale);
      sp.position.set(def.x, def.y);
      sp.visible = false;
      box.addChild(sp);
      elementSprites.set(id, sp);
    }
  }

  const partsBox = new Container();
  partsBox.zIndex = VILLAGE_ZONE_Z + 1;
  world.addChild(partsBox);
  const ghost = new Sprite(Texture.EMPTY);
  ghost.alpha = 0.55;
  ghost.anchor.set(0.5, 1);
  partsBox.addChild(ghost);
  let partsSync = '';
  const placedSprites = new Map<number, Sprite>();

  ticks.push(() => {
    box.visible = villageZoneLive.visible;
    if (box.visible) {
      const t = Math.max(0, Math.min(usable.length - 1, villageZoneLive.stage));
      const i0 = Math.min(Math.floor(t), Math.max(0, usable.length - 2));
      const f = usable.length > 1 ? t - i0 : 0;
      lower.texture = texAt(i0);
      upper.texture = texAt(i0 + 1);
      upper.alpha = f;
    }
    partsBox.visible = villageZoneLive.partsVisible;
    // elements = zone-sized patches toggled by id (zone-aligned by construction)
    for (const [id, sp] of elementSprites) sp.visible = villageZoneLive.elements.includes(id);
    // sync manually-placed parts (rebuild only when the list changes)
    const sig = villageZoneLive.parts.map((p) => `${p.part}@${p.x},${p.y}`).join('|');
    if (sig !== partsSync) {
      partsSync = sig;
      const used = new Set<number>();
      villageZoneLive.parts.forEach((p, idx) => {
        const def = partTex.get(p.part);
        if (!def) return;
        used.add(idx);
        let sp = placedSprites.get(idx);
        if (!sp) { sp = new Sprite(def.tex); sp.anchor.set(0.5, 1); partsBox.addChild(sp); placedSprites.set(idx, sp); }
        sp.texture = def.tex;
        sp.scale.set(def.scale);
        sp.position.set(p.x, p.y);
      });
      for (const [idx, sp] of placedSprites) if (!used.has(idx)) { partsBox.removeChild(sp); sp.destroy(); placedSprites.delete(idx); }
    }
    // ghost for the armed part
    const gdef = villageZoneLive.armed ? partTex.get(villageZoneLive.armed) : null;
    ghost.visible = !!gdef;
    if (gdef) { ghost.texture = gdef.tex; ghost.scale.set(gdef.scale); ghost.position.set(villageZoneLive.hoverX, villageZoneLive.hoverY); }
  });

  return { box };
}
