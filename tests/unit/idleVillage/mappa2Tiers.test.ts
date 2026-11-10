import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { detectTier, TIER_PROFILES, tierForQuality, type TierEnv } from '@/ui/idleVillage/config/mappa2Tiers';
import { getGameSettings, setGameSettings } from '@/ui/idleVillage/state/gameSettings';

// PLAN-115 F4 — device tiers (budgets signed 2026-11-10: Desktop ≤ 420 MB, Deck ≤ 320 MB, Mobile ≤ 160 MB). V3 of the contract.
const env = (o: Partial<TierEnv>): TierEnv => ({ coarsePointer: false, screenW: 1440, screenH: 900, userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', gpuRenderer: null, ...o });

describe('detectTier', () => {
  it('Mac / Windows desktop → desktop', () => {
    expect(detectTier(env({}))).toBe('desktop');
    expect(detectTier(env({ userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', screenW: 2560, screenH: 1440 }))).toBe('desktop');
  });
  it('Steam Deck: SteamOS UA, its GPU, or a Linux 1280x800 screen → deck', () => {
    expect(detectTier(env({ userAgent: 'Mozilla/5.0 (X11; Linux x86_64) SteamOS', screenW: 1280, screenH: 800 }))).toBe('deck');
    expect(detectTier(env({ userAgent: 'Mozilla/5.0 (X11; Linux x86_64)', gpuRenderer: 'AMD Custom GPU 0405 (vangogh, LLVM 15)' }))).toBe('deck');
    expect(detectTier(env({ userAgent: 'Mozilla/5.0 (X11; Linux x86_64)', screenW: 1280, screenH: 800 }))).toBe('deck');
    expect(detectTier(env({ userAgent: 'Mozilla/5.0 (X11; Linux x86_64) SteamOS', coarsePointer: true, screenW: 1280, screenH: 800 }))).toBe('deck'); // touch screen, still a Deck
  });
  it('phones and small tablets (coarse pointer, short side < 1100) → mobile', () => {
    expect(detectTier(env({ coarsePointer: true, screenW: 390, screenH: 844, userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X)' }))).toBe('mobile');
    expect(detectTier(env({ coarsePointer: true, screenW: 412, screenH: 915, userAgent: 'Mozilla/5.0 (Linux; Android 14; Pixel 7)' }))).toBe('mobile');
    expect(detectTier(env({ coarsePointer: true, screenW: 820, screenH: 1180 }))).toBe('mobile');
  });
});

describe('tier profiles', () => {
  it('mobile loads only half-size sheets, 2752 cut-outs, a small cell budget and no unreachable seabed', () => {
    const m = TIER_PROFILES.mobile;
    expect(m).toMatchObject({ canopySuffix: '.v2', seabed: false, gpuLight: { halfFoamMasks: true, halfSeaField: true, halfDistanceMasks: true, halfSeaTile: true } });
    expect(m.tiles).toMatchObject({ budgetCells: 16, minScale: 1.3 });
    expect(m.grade.multUrl).toMatch(/game-grade-mult\.half\.webp$/);
    for (const f of ['masks/foam_clean.half.webp', 'masks/foam_strokes.half.webp', 'masks/sea_zones.half.webp', 'fx/game-grade-mult.half.webp', 'fx/game-grade-add.half.webp']) {
      expect(existsSync(`public/assets/world/mappa2/base/${f}`)).toBe(true);
    }
  });
  it('desktop and Deck keep full sheets and hi-res cut-outs; Deck has the smaller cell budget', () => {
    expect(TIER_PROFILES.desktop).toMatchObject({ canopySuffix: '.v2hi', seabed: true, tiles: { budgetCells: 72 } });
    expect(TIER_PROFILES.deck).toMatchObject({ canopySuffix: '.v2hi', seabed: true, tiles: { budgetCells: 48 } });
  });
  it('/game takes its map options from the profile of the «Qualità grafica» setting and reboots the map on change', () => {
    const page = readFileSync('src/pages/game-mappa2.tsx', 'utf8');
    expect(page).toContain('const tier = tierForQuality(settings.mapQuality, DETECTED_TIER, TIER_Q);');
    expect(page).toContain('const map = useMemo(() => mapOptionsFor(TIER_PROFILES[tier]), [tier]);');
    expect(page).toMatch(/key=\{tier /);
    expect(page).toContain('canopySuffix: profile.canopySuffix');
    expect(page).toContain('...profile.tiles');
    expect(page).toContain('seabed: MAPPA2_APPROVED_MAP_PROPS.effects.seabed && profile.seabed');
  });
  // INV:pixi-world-map.INV-8 — the reveal-only sea is neither fetched nor loaded without a seabed
  it('a reveal-only sea is never fetched when the seabed is off (−21 MB on phones)', () => {
    const src = readFileSync('src/ui/idleVillage/pixiSpike/PixiWorldMap.tsx', 'utf8');
    expect(src).toContain('const texture = revealOnlySea && !seabedOn ? Texture.EMPTY');
    expect(src).toContain('if (fxOn.seabed && seabed && seabed.opacity > 0) wantAsset(layerUrl(manifest.world, hiLand.revealSeaFile));');
  });
});

describe('«Qualità grafica» (PLAN-115 D4, Director 2026-11-10 «Sì, nelle impostazioni»)', () => {
  it('auto follows the device; Alta/Media/Bassa force Desktop/Deck/Mobile; the dev override wins', () => {
    expect(tierForQuality('auto', 'deck')).toBe('deck');
    expect(tierForQuality('high', 'mobile')).toBe('desktop');
    expect(tierForQuality('medium', 'desktop')).toBe('deck');
    expect(tierForQuality('low', 'desktop')).toBe('mobile');
    expect(tierForQuality('low', 'desktop', 'desktop')).toBe('desktop');
    expect(tierForQuality('high', 'desktop', 'nonsense')).toBe('desktop');
  });

  it('is stored with the other settings, defaults to auto and rejects unknown values', () => {
    const io = { read: async () => null, write: async () => undefined };
    expect(getGameSettings().mapQuality).toBe('auto');
    setGameSettings({ mapQuality: 'low' }, io);
    expect(getGameSettings().mapQuality).toBe('low');
    setGameSettings({ mapQuality: 'ultra' as never }, io);
    expect(getGameSettings().mapQuality).toBe('low');
    setGameSettings({ mapQuality: 'auto' }, io);
  });

  it('has a row in the settings panel with the four choices, translated', () => {
    const panel = readFileSync('src/ui/idleVillage/components/gameFrame/menu/SettingsPanel.tsx', 'utf8');
    expect(panel).toContain("t('gameFrame.menu.settingsPanel.mapQuality')");
    expect(panel).toContain('onClick={() => setGameSettings({ mapQuality: id })}');
    for (const loc of ['en', 'it-IT']) {
      const sp = JSON.parse(readFileSync(`public/locales/${loc}/idleVillage.json`, 'utf8')).gameFrame.menu.settingsPanel;
      expect(Object.keys(sp.mapQualityOptions)).toEqual(['auto', 'high', 'medium', 'low']);
      expect(sp.mapQuality).toBeTruthy();
    }
  });
});
