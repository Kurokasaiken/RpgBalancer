import { Container, Sprite, Texture } from 'pixi.js';
import { villageManifestSchema, towerLevelAllowed, type VillageManifestV2 } from '@/balancing/config/idleVillage/villageZoneManifest';

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

/* The zone is a fixed stage for the upgrade teaser: it must stay legible, so it
 * renders above the drifting cloud bands (CLOUD_BAND_Z = 10 in PixiWorldMap) —
 * cloud cover used to hide half the ring/towers («non visibili»). Only the
 * night wash (20) stays on top. */
export const VILLAGE_ZONE_Z = 11;

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
  /**
   * R-313 prototype: 'elements' draws only the growth base plate and stacks the
   * defence ring + every element (`elements/elements.json`) at runtime, sorted
   * by foot y — no per-combination plate.
   */
  mode: 'plates' as 'plates' | 'elements',
  /** Free elements placed in elements mode (zone px, foot position). */
  elements: [] as { kind: string; x: number; y: number }[],
  /** Zone rect (world px), set at mount — lets map click handlers convert world → zone px. */
  zone: null as { x: number; y: number; w: number; h: number } | null,
  /** Live element count drawn in elements mode (witness probe). */
  drawnElements: 0,
};

/** `fx/village/elements/elements.json` — exported by compose-village-towers.py. */
interface VillageElementsSpec {
  slots: Record<string, [number, number]>;
  rings: Record<string, string>;
  kinds: Record<string, { src: string; foot: [number, number]; shadow: { src: string; foot: [number, number] } | null }>;
}

/** Elements wanted this tick: slot towers from the live selection + free placements. */
export function villageElementList(spec: Pick<VillageElementsSpec, 'slots'>,
  live: Pick<typeof villageZoneLive, 'tower1' | 'tower2' | 'elements'> = villageZoneLive,
  defence = villageZoneLive.defence, upgrades?: VillageManifestV2['upgrades']) {
  const out: { kind: string; x: number; y: number }[] = [];
  ([['1', live.tower1], ['2', live.tower2]] as const).forEach(([slot, mat]) => {
    const foot = spec.slots[slot];
    if (!towerLevelAllowed(upgrades, mat, defence)) return;
    if (mat !== 'none' && foot) out.push({ kind: mat === 'stone' ? `bastion-s${slot}` : `tower-${mat}`, x: foot[0], y: foot[1] });
  });
  return out.concat(live.elements);
}

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
      // ?v=bake stamp: baked plates keep the same URL between iterations — the
      // manifest's `bake` field (rewritten by compose-village-towers.py) forces a
      // fresh fetch after each re-bake (stale-webp bug reports).
      load(packAssetUrl(pack.packRoot, `fx/village/${p.src}?v=${(raw as { bake?: string }).bake ?? manifest.version}`)).then((tex) => [p.key, tex] as const).catch(() => null)),
  );
  const failed = shipped.filter((_, i) => !entries[i]).map((p) => p.key);
  if (failed.length) console.warn('[village-zone] plate textures failed to load (fallback will show)', failed);
  const textures = new Map<string, Texture>(entries.filter((e): e is readonly [string, Texture] => !!e));
  if (!textures.size || disposed()) return null;

  villageZoneLive.zone = { x: zone.x, y: zone.y, w: zone.w, h: zone.h };
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
  // GPU warm-up: textures upload lazily on first render — cycling them through
  // the upper sprite at near-zero alpha uploads them all up front, so the
  // teaser timeline's first display of each plate doesn't hitch/flash.
  const warmup = [...textures.values()];
  let warmupIdx = 0;

  /* ── R-313 elements layer (prototype): rings + y-sorted elements over the base plate ── */
  const elemRoot = 'fx/village/elements/';
  const spec = await fetchJson<VillageElementsSpec>(packAssetUrl(pack.packRoot, `${elemRoot}elements.json`)).catch(() => null);
  const elemTex = new Map<string, Texture>();
  if (spec) {
    const files = [...Object.values(spec.rings), ...Object.values(spec.kinds).flatMap((k) => (k.shadow ? [k.src, k.shadow.src] : [k.src]))];
    await Promise.all(files.map((f) => load(packAssetUrl(pack.packRoot, `${elemRoot}${f}`))
      .then((t) => { elemTex.set(f, t); })
      .catch(() => console.warn('[village-zone] element texture failed', f))));
  }
  const elemBox = new Container();
  elemBox.label = 'village-elements';
  box.addChild(elemBox);
  const ringSprites = new Map<string, Sprite>();
  for (const [d, f] of Object.entries(spec?.rings ?? {})) {
    const t = elemTex.get(f);
    if (!t) continue;
    const sp = new Sprite(t);
    sp.width = zone.w;
    sp.height = zone.h;
    sp.alpha = 0;
    elemBox.addChild(sp);
    ringSprites.set(d, sp);
  }
  const elemLayer = new Container();
  elemLayer.sortableChildren = true;
  elemBox.addChild(elemLayer);
  const live = new Map<string, { node: Container; target: number }>();
  /** One element = shadow + sprite, positioned so both feet land on (x,y). */
  const makeElement = (kind: string, x: number, y: number): Container | null => {
    const k = spec?.kinds[kind];
    const tex = k && elemTex.get(k.src);
    if (!k || !tex) return null;
    const node = new Container();
    node.position.set(x, y);
    node.zIndex = y;
    const shTex = k.shadow ? elemTex.get(k.shadow.src) : null;
    if (shTex && k.shadow) {
      const sh = new Sprite(shTex);
      sh.position.set(-k.shadow.foot[0], -k.shadow.foot[1]);
      node.addChild(sh);
    }
    const sp = new Sprite(tex);
    sp.position.set(-k.foot[0], -k.foot[1]);
    node.addChild(sp);
    node.alpha = 0;
    elemLayer.addChild(node);
    return node;
  };

  let currentKey = first;
  let fadeKey = first;
  let fade = 0; // 0 = settled on lower; >0 = blending toward upper
  let lastT = -1;

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
      // warm-up pass: one new texture per frame at invisible alpha
      if (warmupIdx < warmup.length) {
        upper.texture = warmup[warmupIdx++];
        upper.alpha = 0.001;
        lastT = t;
        return;
      }
      if (warmupIdx === warmup.length) { upper.alpha = 0; warmupIdx++; }
      const dt = lastT < 0 ? 0.016 : Math.max(0, t - lastT);
      lastT = t;
      const elementsMode = villageZoneLive.mode === 'elements' && !!spec;
      elemBox.visible = elementsMode;
      if (elementsMode) {
        // ring cross-fade toward the live defence
        const k = Math.min(1, dt / 0.25);
        for (const [d, sp] of ringSprites) sp.alpha += ((villageZoneLive.defence === d ? 1 : 0) - sp.alpha) * k;
        // element diff: new ones fade in, removed ones fade out — nothing else moves
        const want = new Set<string>();
        for (const e of villageElementList(spec, villageZoneLive, villageZoneLive.defence, manifest.upgrades)) {
          const key = `${e.kind}@${e.x},${e.y}`;
          want.add(key);
          if (!live.has(key)) {
            const node = makeElement(e.kind, e.x, e.y);
            if (node) live.set(key, { node, target: 1 });
          } else live.get(key)!.target = 1;
        }
        for (const [key, el] of live) {
          if (!want.has(key)) el.target = 0;
          el.node.alpha += Math.sign(el.target - el.node.alpha) * Math.min(Math.abs(el.target - el.node.alpha), dt / 0.25);
          // replace animation: the element grows out of / sinks into its foot while it fades
          el.node.scale.set(0.94 + 0.06 * el.node.alpha);
          if (el.target === 0 && el.node.alpha <= 0) { el.node.destroy({ children: true }); live.delete(key); }
        }
        villageZoneLive.drawnElements = live.size;
      }
      let target = elementsMode ? `${villageZoneLive.growth}|none|none+none` : villageStateKey(manifest);
      if (!textures.has(target)) {
        // nearest shipped fallback: same growth, none defence/towers
        target = textures.has(`${villageZoneLive.growth}|none|none+none`)
          ? `${villageZoneLive.growth}|none|none+none`
          : first;
      }
      if (target !== currentKey && fade === 0) {
        upper.texture = textures.get(target) as Texture;
        upper.alpha = 0;
        fadeKey = target;
        fade = 0.0001;
      }
      if (fade > 0) {
        // real frame-delta: ~0.15 s snap-dissolve regardless of fps (t is elapsed, not delta)
        fade = Math.min(1, fade + dt / 0.15);
        upper.alpha = fade;
        if (fade >= 1) {
          lower.texture = upper.texture;
          upper.alpha = 0;
          currentKey = fadeKey;
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
