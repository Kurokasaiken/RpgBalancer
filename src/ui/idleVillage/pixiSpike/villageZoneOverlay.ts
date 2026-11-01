import { Container, Sprite, Texture } from 'pixi.js';
import { villageManifestSchema, type VillageManifestV2 } from '@/balancing/config/idleVillage/villageZoneManifest';

/**
 * PLAN-106: the village-cradle zone as full-zone painted plates on `/mappa2-lab`.
 * Self-contained mount (same contract as `regionalWeatherOverlay`): fetches
 * `village.json` (manifest v2, Zod-validated), loads every `shipped` plate
 * texture, places one sprite pair at the zone origin (z above terrain/canopy)
 * and cross-fades between plate states.
 *
 * A "state" is one opaque plate keyed `growth|defence|slot1+slot2` — no
 * runtime compositing of defence/tower elements (that was the ghost-village
 * bug). Sprite-only, Canvas-safe, no shaders/meshes/masks.
 *
 * Live state is read per-tick from `villageZoneLive` so lab controls take
 * effect without remounting.
 */

export const VILLAGE_ZONE_Z = 4;

export type VillageTowerValue = 'none' | 'wood' | 'stone';

/** Mutable knobs the lab writes and the overlay reads each tick. */
export const villageZoneLive = {
  visible: true,
  /** Growth stage id (manifest.growth). */
  growth: 'stone',
  /** Defence id (manifest.axes.defence.values). */
  defence: 'none',
  /** Tower slot 1 / slot 2 (manifest.axes.towers.each). */
  tower1: 'none' as VillageTowerValue,
  tower2: 'none' as VillageTowerValue,
  /** Parts placed on the map by the director (world coords). */
  parts: [] as { part: string; x: number; y: number }[],
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
  /** The validated manifest — the lab derives its pickers from this. */
  manifest: VillageManifestV2;
}

/** Builds the plate key for the live selection (towers zeroed when required). */
export function villageStateKey(m: VillageManifestV2, growth = villageZoneLive.growth,
  defence = villageZoneLive.defence, t1 = villageZoneLive.tower1, t2 = villageZoneLive.tower2): string {
  const noTowers = m.uiRules.towersRequireDefence && defence === 'none';
  return `${growth}|${defence}|${noTowers ? 'none' : t1}+${noTowers ? 'none' : t2}`;
}

/** Mounts the overlay; no-op unless the pack ships a valid v2 `village.json`. */
export async function mountVillageZone(deps: VillageZoneMountDeps): Promise<VillageZoneRuntime | null> {
  const { pack, world, load, fetchJson, ticks, packAssetUrl, disposed } = deps;
  const raw = await fetchJson<unknown>(packAssetUrl(pack.packRoot, 'fx/village/village.json')).catch(() => null);
  if (!raw || disposed()) return null;
  const parsed = villageManifestSchema.safeParse(raw);
  if (!parsed.success) {
    console.warn('[village-zone] manifest v2 invalid, overlay skipped', parsed.error.issues.slice(0, 3));
    return null;
  }
  const manifest = parsed.data;
  const { zone } = manifest;

  const shipped = manifest.plates.filter((p) => p.shipped);
  const entries = await Promise.all(
    shipped.map((p) =>
      load(packAssetUrl(pack.packRoot, `fx/village/${p.src}`)).then((tex) => [p.key, tex] as const).catch(() => null)),
  );
  const textures = new Map<string, Texture>(entries.filter((e): e is readonly [string, Texture] => !!e));
  if (!textures.size || disposed()) return null;

  const box = new Container();
  box.label = 'village-zone';
  box.zIndex = VILLAGE_ZONE_Z;
  box.position.set(zone.x, zone.y);
  world.addChild(box);

  const first = textures.keys().next().value as string;
  const lower = new Sprite(textures.get(first));
  const upper = new Sprite(textures.get(first));
  upper.alpha = 0;
  for (const sp of [lower, upper]) {
    sp.width = zone.w;
    sp.height = zone.h;
    box.addChild(sp);
  }

  let currentKey = first;
  let fade = 0; // 0 = settled on lower; >0 = blending toward upper

  /* ── free parts layer (lab PIAZZA toy — unchanged contract) ── */
  const parts = (manifest as { parts?: Record<string, { file: string; scale: number }> }).parts;
  const partTex = new Map<string, { tex: Texture; scale: number }>();
  if (parts) {
    for (const [id, def] of Object.entries(parts)) {
      const t = await load(packAssetUrl(pack.packRoot, `fx/village/parts/${def.file}`)).catch(() => null);
      if (t) partTex.set(id, { tex: t, scale: def.scale });
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

  ticks.push((t) => {
    box.visible = villageZoneLive.visible;
    if (box.visible) {
      let target = villageStateKey(manifest);
      if (!textures.has(target)) {
        // nearest shipped fallback: same growth, none defence/towers
        target = textures.has(`${villageZoneLive.growth}|none|none+none`)
          ? `${villageZoneLive.growth}|none|none+none`
          : first;
      }
      if (target !== currentKey && fade === 0) {
        upper.texture = textures.get(target) as Texture;
        upper.alpha = 0;
        fade = 0.0001;
      }
      if (fade > 0) {
        fade = Math.min(1, fade + t * 0.05);
        upper.alpha = fade;
        if (fade >= 1) {
          lower.texture = upper.texture;
          upper.alpha = 0;
          currentKey = target;
          fade = 0;
        }
      }
    }
    partsBox.visible = villageZoneLive.partsVisible;
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
    const gdef = villageZoneLive.armed ? partTex.get(villageZoneLive.armed) : null;
    ghost.visible = !!gdef;
    if (gdef) { ghost.texture = gdef.tex; ghost.scale.set(gdef.scale); ghost.position.set(villageZoneLive.hoverX, villageZoneLive.hoverY); }
  });

  return { box, manifest };
}
