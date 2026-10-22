import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { HUD_PANELS } from '@/ui/idleVillage/components/gameFrame/hudPanelRegistry';
import { ENGRAVED_ICON_IDS } from '@/ui/idleVillage/components/gameFrame/engravedIcons';
import { BASE_SKIN_CSS_VARS } from '@/ui/idleVillage/skins/skinCssVariables';
import {
  GAME_SURFACE_FILES,
  GAME_SURFACE_LUCIDE_FILES,
  GAME_SURFACE_PANEL_BINDINGS,
  GAME_SURFACE_VIOLATION_BASELINE,
} from './gameSurfaceManifest';
import { discoverGameSurface, isStyleCheckedFile } from '../../../scripts/verification/discoverGameSurface';

/**
 * Guards for the rules in src/docs/docs/design/hud_component_guide.md that a machine can check:
 * every HUD token is defined, new HUD files carry no colour literals, no text under 12px.
 */
const ROOT = resolve(__dirname, '../../..');
const read = (path: string) => readFileSync(resolve(ROOT, path), 'utf8');
const stripComments = (source: string) => source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');

/**
 * Historical hand-maintained list (kept for provenance — the mechanical set
 * below now owns the contract). Files built on the HUD material from scratch.
 */
const LEGACY_STRICT_FILES = [
  'src/ui/idleVillage/skins/primitives/HudPlaque.tsx',
  'src/ui/idleVillage/components/gameFrame/ObjectiveCartouche.tsx',
  'src/ui/idleVillage/components/gameFrame/HudRecenterButton.tsx',
  'src/ui/idleVillage/components/gameFrame/HudPanelsMenu.tsx',
  'src/ui/idleVillage/components/gameFrame/HudGameMenu.tsx',
  'src/ui/idleVillage/components/gameFrame/WhenWhereCluster.tsx',
  'src/ui/idleVillage/components/gameFrame/HudEventLedger.tsx',
  'src/ui/idleVillage/components/gameFrame/ResourceReadout.tsx',
  'src/ui/idleVillage/components/gameFrame/resourceReadoutItems.tsx',
  'src/ui/idleVillage/components/gameFrame/GameFrameDragCursor.tsx',
  'src/ui/idleVillage/components/gameFrame/engravedIcons.tsx',
  'src/ui/idleVillage/components/gameFrame/HudEventLedger.tsx',
  'src/ui/idleVillage/components/gameFrame/MapQuestPoi.tsx',
  'src/ui/idleVillage/components/gameFrame/QuestRunWindow.tsx',
  // PLAN-053 T-005 — the world-map route uses the active skin's map-safe metals.
  'src/ui/idleVillage/components/gameFrame/QuestJourneyRoute.tsx',
  // PLAN-032 SP-1 — the hero sheet plaque.
  'src/ui/idleVillage/components/gameFrame/HeroSheetPanel.tsx',
  // PLAN-032 SP-2 — the village stash plaque and its reusable building POI marker.
  'src/ui/idleVillage/components/gameFrame/VillageStashPanel.tsx',
  'src/ui/idleVillage/components/gameFrame/MapBuildingPoi.tsx',
  'src/ui/idleVillage/components/gameFrame/villageStashItemIcons.tsx',
  // PLAN-032 SP-3 — the merchant mock storefront.
  'src/ui/idleVillage/components/gameFrame/MerchantPanel.tsx',
  'src/ui/idleVillage/components/gameFrame/MockBuyControl.tsx',
  'src/ui/idleVillage/components/gameFrame/merchantOfferIcons.tsx',
  // PLAN-032 SP-5 — the hero level-up decorative layer (rosterV2, same material).
  'src/ui/idleVillage/rosterV2/HeroLevelDecor.tsx',
  // R-196 — the quest shell's companion plaques and shared layout predicate.
  'src/ui/idleVillage/components/gameFrame/QuestBeltPlaque.tsx',
  'src/ui/idleVillage/components/gameFrame/QuestPartyRosterPanel.tsx',
  'src/ui/idleVillage/components/gameFrame/QuestLogPanel.tsx',
  'src/ui/idleVillage/components/gameFrame/questShellLayout.ts',
  'src/ui/idleVillage/components/gameFrame/useHudPanelDrag.ts',
  // PLAN-032 SP-4 — the packed-bag derivation shared by the quest window's
  // bag popover and consumable belt (BagStrip removed in PLAN-043 WS-5).
  'src/ui/idleVillage/components/gameFrame/questBag.ts',
  'src/ui/idleVillage/quests/QuestExpeditionDetail.tsx',
  // PLAN-024 — Quest S1 Lab HUD (full-page action screens, same material).
  'src/ui/idleVillage/questS1Lab/hud/atoms.tsx',
  'src/ui/idleVillage/questS1Lab/hud/ActionZone.tsx',
  'src/ui/idleVillage/questS1Lab/hud/AstroOverlay.tsx',
  'src/ui/idleVillage/questS1Lab/hud/ChronicleDrawer.tsx',
  'src/ui/idleVillage/questS1Lab/hud/ConsumableBelt.tsx',
  'src/ui/idleVillage/questS1Lab/hud/ContextStrip.tsx',
  'src/ui/idleVillage/questS1Lab/hud/DamageChannel.tsx',
  'src/ui/idleVillage/questS1Lab/hud/PresetScreen.tsx',
  'src/ui/idleVillage/questS1Lab/hud/QuestSelectScreen.tsx',
  'src/ui/idleVillage/questS1Lab/hud/StageBand.tsx',
  'src/ui/idleVillage/questS1Lab/hud/StashPicker.tsx',
  'src/ui/idleVillage/questS1Lab/hud/TransitView.tsx',
  'src/ui/idleVillage/questS1Lab/hud/VerdictCard.tsx',
  // PLAN-035 — the village view and its building pins/tooltip controls.
  'src/ui/idleVillage/components/gameFrame/VillageScreenView.tsx',
  'src/ui/idleVillage/components/gameFrame/MockUpgradeControl.tsx',
  'src/ui/idleVillage/components/gameFrame/villageBuildingIcons.tsx',
  // PLAN-038 — the painted-over slot overlay (ellipse rings, vignettes, pennants).
  'src/ui/idleVillage/components/gameFrame/VillageSlotOverlay.tsx',
  // PLAN-042 — the Settlement Registry drawer (catalog rows + drill-in card).
  'src/ui/idleVillage/components/gameFrame/VillageRegistry.tsx',
];
/**
 * PLAN-043 WS-5 (artifact-r002 §C): the guarded /game surface is the
 * mechanically discovered set D = A ∪ B ∪ C ∪ Dq — generated into
 * `gameSurfaceManifest.ts` by `discoverGameSurface.ts`. Style checks apply
 * to UI sources (`isStyleCheckedFile`); the anti-drift test below covers
 * every file in D, engine/config included. Pre-existing debt is recorded in
 * `GAME_SURFACE_VIOLATION_BASELINE` and burns down during implementation —
 * NEW violations fail the checks below.
 */
const STRICT_FILES = [...new Set([...LEGACY_STRICT_FILES, ...GAME_SURFACE_FILES.filter(isStyleCheckedFile)])];
const ROSTER_V2_FILES = [
  'src/ui/idleVillage/rosterV2/DragTestContainerV2.tsx',
  'src/ui/idleVillage/rosterV2/WanderlustRosterCardV2.tsx',
];
const TOKEN_FILES = [
  ...STRICT_FILES,
  'src/ui/idleVillage/components/gameFrame/GameFrame.tsx',
  'src/ui/idleVillage/components/gameFrame/DirectorPanel.tsx',
  'src/ui/idleVillage/skins/skinScope.css',
  // PLAN-058 — the Roster V2 is the reference the HUD tokens are measured on.
  ...ROSTER_V2_FILES,
];

describe('HUD guards', () => {
  // INV:skin-css-variables.INV-1
  it('defines every --skin-hud-* token that the HUD files read', () => {
    const missing: string[] = [];
    for (const file of TOKEN_FILES) {
      const baseline = GAME_SURFACE_VIOLATION_BASELINE[file]?.missingTokens ?? [];
      // `var(--x)` in CSS/inline styles, `p-(--x)` in Tailwind v4 classes.
      for (const match of read(file).matchAll(/(?:var\(|-\()(--skin-hud-[a-z0-9-]+)/g)) {
        if (!(match[1] in BASE_SKIN_CSS_VARS) && !baseline.includes(match[1])) missing.push(`${file}: ${match[1]}`);
      }
    }
    expect(missing).toEqual([]);
  });

  it('makes the Roster V2 and the HUD controls read every layout and type token measured on the Roster', () => {
    const sources = [...ROSTER_V2_FILES, 'src/ui/idleVillage/skins/skinScope.css'].map(read).join('\n');
    const measured = Object.keys(BASE_SKIN_CSS_VARS).filter((name) =>
      /^--skin-hud-(plaque-clearance|panel-|stack-|control-|inline-|row-|bar-|title-|name-|caps-|engrave)/.test(name),
    );
    expect(measured.length).toBeGreaterThan(0);
    expect(measured.filter((name) => !sources.includes(`(${name})`) && !sources.includes(`(${name},`))).toEqual([]);
  });

  it('keeps colour literals out of the HUD files built on the material', () => {
    const offenders: string[] = [];
    for (const file of STRICT_FILES) {
      if (file.endsWith('.css')) continue; /* css literals live in their own skin-scope guard below */
      const baseline = GAME_SURFACE_VIOLATION_BASELINE[file]?.colorLiterals ?? [];
      const code = stripComments(read(file));
      for (const literal of new Set(code.match(/#[0-9a-fA-F]{3,8}\b|\brgba?\(|\bhsla?\(/g) ?? [])) {
        if (!baseline.includes(literal)) offenders.push(`${file}: ${literal}`);
      }
    }
    expect(offenders).toEqual([]);
  });

  it('never sets text under 12px in the HUD files', () => {
    const offenders: string[] = [];
    const files = [...STRICT_FILES, 'src/ui/idleVillage/components/gameFrame/ResourceReadout.tsx'];
    for (const file of files) {
      if (file.endsWith('.css')) continue;
      const baseline = GAME_SURFACE_VIOLATION_BASELINE[file]?.smallFonts ?? [];
      const code = stripComments(read(file));
      for (const match of code.matchAll(/fontSize:\s*'?(\d+(?:\.\d+)?)(?:px)?'?(?![\d.]|em|rem|%)|font-size:\s*(\d+(?:\.\d+)?)px|text-\[(\d+(?:\.\d+)?)px\]/g)) {
        const size = Number(match[1] ?? match[2] ?? match[3]);
        if (size < 12 && !baseline.includes(match[0])) offenders.push(`${file}: ${match[0]}`);
      }
    }
    expect(offenders).toEqual([]);
  });

  it('keeps the HUD controls role in skinScope.css free of colour literals', () => {
    const css = stripComments(read('src/ui/idleVillage/skins/skinScope.css'));
    const start = css.indexOf('[data-hud-controls]');
    expect(start).toBeGreaterThan(-1);
    const block = css.slice(start, css.indexOf('.skin-scope :where([data-skin="cta"])', start));
    expect(block.match(/#[0-9a-fA-F]{3,8}\b|\brgba?\(|\bhsla?\(/g)).toBeNull();
  });

  it('keeps the Panels menu complete: every registered panel has a name in both locales and a unique shortcut', () => {
    const shortcuts = HUD_PANELS.map((panel) => panel.shortcut);
    expect(new Set(shortcuts).size).toBe(shortcuts.length);
    for (const locale of ['en', 'it-IT']) {
      const names = JSON.parse(read(`public/locales/${locale}/idleVillage.json`)).gameFrame.panels.names as Record<string, string>;
      const missing = HUD_PANELS.filter((panel) => !names[panel.id]).map((panel) => `${locale}: ${panel.id}`);
      expect(missing).toEqual([]);
    }
  });

  // PLAN-058 T3.2 — the engraved set (bible §11.6) replaces lucide-react and the stroke glyphs in the /game HUD.
  it('keeps lucide-react out of the HUD components of /game', () => {
    const dir = 'src/ui/idleVillage/components/gameFrame';
    const offenders = readdirSync(resolve(ROOT, dir))
      .filter((name) => /\.(tsx?|css)$/.test(name))
      .filter((name) => /from\s+['"]lucide-react['"]/.test(read(`${dir}/${name}`)))
      .map((name) => `${dir}/${name}`);
    expect(offenders).toEqual([]);
  });

  /* WS-5 B6.2 — the same rule over the whole discovered /game surface D:
   * GAME_SURFACE_LUCIDE_FILES records the residual migration debt (the
   * five shipped files that still import lucide — see component-inventory
   * for the engraved mapping). A NEW lucide import anywhere on /game fails
   * here; removing one makes this list stale → regenerate the manifest. */
  it('keeps lucide-react contained to the recorded /game migration debt', () => {
    const offenders = GAME_SURFACE_FILES.filter(
      (file) => !file.endsWith('.css') && /from\s+['"]lucide-react['"]/.test(read(file)),
    ).sort();
    const known = [...GAME_SURFACE_LUCIDE_FILES].sort();
    expect({ newImports: offenders.filter((f) => !known.includes(f)) }).toEqual({ newImports: [] });
    expect(known.filter((f) => !offenders.includes(f)), 'stale entries — regenerate the manifest').toEqual([]);
  });

  it('draws the Roster V2 icons from the engraved set, not from gameIcons', () => {
    for (const file of ROSTER_V2_FILES) expect(read(file), file).not.toContain('components/gameIcons');
  });

  it('draws the engraved icons solid: no stroke, no colour literal, only currentColor', () => {
    for (const file of ['engravedIcons.tsx', 'hudIcons.tsx']) {
      const code = stripComments(read(`src/ui/idleVillage/components/gameFrame/${file}`));
      expect(code, file).not.toMatch(/\bstroke(?:-?Width|-?Linecap|-?Linejoin)?\s*[=:]/);
    }
    expect(read('src/ui/idleVillage/components/gameFrame/engravedIcons.tsx')).toContain('fill="currentColor"');
  });

  it('has an engraved glyph for every incised entry of the icon registry', () => {
    const registry = read('src/docs/docs/art-direction/icons/registry.yaml');
    const incised = [...registry.matchAll(/\{id: ([a-z-]+), livello: incisa/g)].map((match) => match[1]);
    expect(incised.length).toBeGreaterThan(0);
    expect(incised.filter((id) => !(ENGRAVED_ICON_IDS as string[]).includes(id))).toEqual([]);
  });

  /* PLAN-043 WS-5 (artifact-r002 §C) — anti-drift: the guarded surface is
   * recomputed mechanically and must equal the generated manifest. A new
   * file reaching /game outside the manifest (or a manifest entry leaving
   * the surface) fails here: regenerate with
   * `npx tsx scripts/verification/discoverGameSurface.ts --emit-manifest
   *  tests/unit/idleVillage/gameSurfaceManifest.ts` after reviewing the
   * delta, or fix the drift. */
  it('keeps the guarded /game surface in sync with the generated manifest (anti-drift)', () => {
    const live = discoverGameSurface(ROOT);
    const manifestSet = [...GAME_SURFACE_FILES].sort();
    const liveSet = [...live.sets.D].sort();
    const added = liveSet.filter((f) => !manifestSet.includes(f));
    const missing = manifestSet.filter((f) => !liveSet.includes(f));
    expect({ added, missing }).toEqual({ added: [], missing: [] });
    /* Panel bindings drift too (a registry id losing/gaining its source). */
    for (const [id, files] of Object.entries(live.sets.A.panels)) {
      expect([...files].sort(), `panel ${id}`).toEqual([...(GAME_SURFACE_PANEL_BINDINGS[id] ?? [])].sort());
    }
    /* Structural findings (e.g. a panel with no source) fail the guard. */
    expect(live.findings).toEqual([]);
  }, 120_000);
});
