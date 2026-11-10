import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { MAPPA2_APPROVED, MAPPA2_APPROVED_EFFECTS, MAPPA2_APPROVED_MAP_PROPS, MAPPA2_GAME_GPU_LIGHT, MAPPA2_GAME_GRADE, mixHex } from '@/ui/idleVillage/config/mappa2ApprovedLook';

/**
 * Pin of the mappa2 look the Director approved on 2026-11-10 («approvo quella che c'è adesso come mappa»).
 * `/game` renders from this snapshot: a failing line here means the game map changed — that needs a new ruling,
 * then update the pinned value together with the snapshot.
 */
describe('mappa2 approved look (Director ruling 2026-11-10)', () => {
  it('keeps the calibrated values of /mappa2-lab on that day', () => {
    expect(MAPPA2_APPROVED).toMatchObject({
      cloudOpacityScale: 1.4, cloudTintAmount: 0.61, seaTone: 0,
      seaLineColor: '#8bbac2', seaLineOpacity: 0.14, foamColor: '#eefcf6', foamStrength: 0.34,
      forestSway: 2.2, waterfallFlowSpeed: 130, waterfallRainbow: 0.7, swRiverFlowStrength: 0.24,
      landLifeOpacity: 0.55, landLifeLeaves: 0, ambIntensity: 0.6, ambRare: 0,
    });
  });

  it('keeps the approved effect set (no sea wonders, no waves/sea marks, hi-res off)', () => {
    expect(MAPPA2_APPROVED_EFFECTS).toEqual({
      seaPattern: true, coastFoam: true, waves: false, seaMarks: false, cloudShadows: true, birds: true,
      clouds: true, seabed: true, wonders: false, landLife: true, canopyDetail: false, hiRes: false,
    });
  });

  it('builds the PixiWorldMap props from the snapshot (white clouds lightly tinted, turquoise foam untouched)', () => {
    expect(MAPPA2_APPROVED_MAP_PROPS.manifestPath).toBe('/assets/world/mappa2/base/manifest.json');
    expect(MAPPA2_APPROVED_MAP_PROPS.cloudTint).toBe(mixHex('#ffffff', '#bfeff2', 0.61));
    expect(MAPPA2_APPROVED_MAP_PROPS.coastFoamConfig.strength).toBe(0.34);
    expect(MAPPA2_APPROVED_MAP_PROPS.seaPatternConfig).toMatchObject({ lineColor: '#8bbac2', lineOpacity: 0.14 });
    expect(MAPPA2_APPROVED_MAP_PROPS.seabed).toEqual({ opacity: 0.45, parallax: 0.82 });
    expect(MAPPA2_APPROVED_MAP_PROPS.waterfallConfig).toMatchObject({ enabled: true, paintedFlow: true, flipFps: 23 });
    expect(MAPPA2_APPROVED_MAP_PROPS.ambientDirectorConfig.rare.enabled).toBe(false);
  });
});

describe('/game combined grade (one mult + add pair instead of four sheets)', () => {
  it('ships both sheets, stored x1 (add reaches 0.92: x2 storage would clip the clarity highlights)', () => {
    expect(MAPPA2_GAME_GRADE).toMatchObject({ opacity: 1, addScale: 1 });
    for (const url of [MAPPA2_GAME_GRADE.multUrl, MAPPA2_GAME_GRADE.addUrl]) expect(existsSync(`public${url}`)).toBe(true);
  });

  it('/game draws the combined pair and loads neither mountain sheet outside the dev A/B seam', () => {
    const page = readFileSync('src/pages/game-mappa2.tsx', 'utf8');
    expect(page).toContain('seaGrade={SPLIT_GRADE ? seaGradeLive : map.grade}');
    expect(page).toContain('const grade = NO_CLARITY');
    expect(page).toContain('    : profile.grade;'); // tier profile: full combined pair on desktop/Deck, half-size copy on phones
    expect(page).toContain("const NO_CLARITY = DEV_Q.get('grade') === 'noclarity';");
    expect(page).toContain('mountainShade={SPLIT_GRADE ? mountainShadeLive : undefined}');
    expect(page).toContain('mountainClarity={SPLIT_GRADE ? mountainClarityLive : undefined}');
    expect(page).toContain("const SPLIT_GRADE = DEV_Q.get('grade') === 'split';");
    expect(page).toContain('const DEV_Q = import.meta.env.DEV ? new URLSearchParams(window.location.search) : new URLSearchParams();');
  });

  // INV:pixi-world-map.INV-9 — addScale default 2 keeps the lab grade; gpuLight only when passed
  it('PixiWorldMap honours addScale (default 2 keeps the lab sapphire sheet unchanged)', () => {
    const src = readFileSync('src/ui/idleVillage/pixiSpike/PixiWorldMap.tsx', 'utf8');
    expect(src).toContain('add.alpha = o / (seaGradeRef.current?.addScale ?? 2);');
  });
});

describe('mappa2 GPU budget (2026-11-10)', () => {
  const src = readFileSync('src/ui/idleVillage/pixiSpike/PixiWorldMap.tsx', 'utf8');

  it('ships sea_zones.webp and the manifest points at it (sea mask + surf zones in one opaque texture)', () => {
    const manifest = JSON.parse(readFileSync('public/assets/world/mappa2/base/manifest.json', 'utf8'));
    expect(manifest.pack.maskFiles.seaZones).toBe('masks/sea_zones.webp');
    expect(existsSync('public/assets/world/mappa2/base/masks/sea_zones.webp')).toBe(true);
    expect(readFileSync('scripts/build-mappa2-assets.py', 'utf8')).toContain('"seaZones": "masks/sea_zones.webp"');
  });

  // INV:pixi-world-map.INV-6 — packed sea field: channel selector everywhere, legacy packs keep the alpha
  it('every shader reading the packed masks goes through a channel selector (legacy packs keep .a)', () => {
    expect(src).toContain('dot(texture(uSeaMask, maskUV), uSeaSel)');
    expect(src).toContain('dot(textureLod(uSeaMask, uv, 0.0), uSeaSel)');
    expect(src).toContain('dot(texture(uZones, vUV), uZoneSel)');
    expect(src).toContain("const seaSel = new Float32Array(seaZonesUrl ? [1, 0, 0, 0] : [0, 0, 0, 1]);");
    expect(src).toContain('data.data[i + seaFieldByte]');
    expect(src).not.toMatch(/texture\(uSeaMask, [^)]*\)\.a/);
  });

  it('/game turns the light options on; the half-size sources exist; caustics keep their world size', () => {
    expect(MAPPA2_GAME_GPU_LIGHT).toEqual({ halfDistanceMasks: true, halfSeaTile: true, foamBaseFromDisplayed: true });
    expect(readFileSync('src/pages/game-mappa2.tsx', 'utf8')).toContain('gpuLight={map.gpuLight}');
    for (const f of ['masks/coast_distance.half.webp', 'masks/land_distance.half.webp', 'fx/sea_pattern_tile.half.png']) {
      expect(existsSync(`public/assets/world/mappa2/base/${f}`)).toBe(true);
    }
    expect(src).toContain('caustics.tileScale.set(halfSeaTile ? 3.2 : 1.6)');
  });
});

describe('PLAN-115 F1 hi-res land preview (dev seams only)', () => {
  const src = readFileSync('src/ui/idleVillage/pixiSpike/PixiWorldMap.tsx', 'utf8');
  const page = readFileSync('src/pages/game-mappa2.tsx', 'utf8');

  it('look v2 is the /game default (ruling 2026-11-10); previews and the v1 look stay behind dev-only seams', () => {
    expect(page).toContain("const LAND = DEV_Q.get('land');");
    expect(page).toContain("const LOOK_V1 = DEV_Q.get('look') === 'v1';");
    expect(page).toContain('hiLand={map.hiLand}');
    expect(src).toContain("swapBase ? (hiLand ? hiLand.baseFile : layer.file.replace('.webp', '.nocanopy.webp'))");
    expect(src).toContain("hiLand?.fullBaseFile && layer.id === 'base_flat' ? hiLand.fullBaseFile : layer.file");
  });

  // INV:pixi-world-map.INV-8 — hiLand swaps base + cut-outs only; 2x cut-outs sway like 1x and fall back
  it('hi-res cut-outs sway like the 2752 ones (grid density in world px) and fall back when missing', () => {
    expect(src).toContain('Math.round(((r.width / r.sourceWidth) * canvas.width) / 28)');
    expect(src).toContain('`${stem}.canopy${hiLand.canopySuffix}.webp`)).catch(() => null)');
  });

  it('ships the preview sets (approved+detail, clean, raw, raw-sea)', () => {
    for (const f of ['base_flat.nocanopy.hi.webp', 'base_flat.nocanopy.hiclean.webp', 'base_flat.nocanopy.hiraw.webp', 'base_flat.nocanopy.hi.seahi.webp', 'forest_canopy_01.canopy.hiclean.webp']) {
      expect(existsSync(`public/assets/world/mappa2/base/layers/${f}`)).toBe(true);
    }
  });
});
