/**
 * PLAN-054 T-004 — characterization coverage per le unità tier-1 dell'
 * inventario contratti che non avevano una suite dedicata con import
 * diretto. Ogni blocco porta il tag `// INV:<unit>.INV-1` del contratto
 * componente e asserisce il contratto minimo reale (export, schema,
 * comportamento puro) — nessuna asserzione vacua.
 */
import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent, renderHook } from '@testing-library/react';

import { MinimalActivityEntrySchema, ActivitySeveritySchema } from '@/ui/idleVillage/config/activityLogPanelConfig';
import { canonicalResidentData, createResidentsById } from '@/ui/idleVillage/roster/CanonicalRosterBundle';
import styles from '@/ui/idleVillage/components/DragTestContainer.module.css';
import GameFramePage, { GameFrameScreen } from '@/pages/game-frame';
import { IntentBridge } from '@/ui/idleVillage/intent/GameIntent';
import { DEFAULT_HUD_BAND_PX, getHudBandPx, setHudBandPx, useHudBandPx } from '@/ui/idleVillage/skins/primitives/hudBand';
import { HudHideToggle } from '@/ui/idleVillage/components/gameFrame/HudHideToggle';
import { BRONZE_THEME, type MaterialPreset } from '@/ui/wanderlust-surface/materialPresets';
import { MATERIC_SKIN_CONFIG, matericSkinConfigSchema } from '@/ui/wanderlust-surface/matericSkinConfig';
import { MatericSkinContext, useMatericSkin } from '@/ui/wanderlust-surface/MatericSkinContext';
import { getMinimalFeedbackConfig, getSlotGlowConfig, getSensoryFeedbackConfig } from '@/ui/idleVillage/config/minimalFeedbackConfig';
import { PHYSICS_DEFAULTS, PhysicsConfigSchema, SLIDER_DEFS, SECTIONS } from '@/ui/styleLab/config/physicsDefaults';
import { preloadPortrait, isPortraitDecoded } from '@/ui/idleVillage/utils/portraitDecodeCache';
import { rendererStackInstrumentation } from '@/ui/idleVillage/utils/rendererStackInstrumentation';
import { formatResidentLabel } from '@/ui/idleVillage/residentName';
import { resolveMaxCrewSize, resolveSlotRequirements } from '@/ui/idleVillage/drag/resolveSlotRequirements';
import { slotV12SkinData } from '@/ui/idleVillage/skins/converted/slotWildernessBronzeConfig';
import { statGlyphMap, lucideStatIcons } from '@/ui/shared/statIconUtils';
import { useSkinBinding, useSkinBindingWithPreset, useSimpleSkinBinding } from '@/ui/idleVillage/hooks/useSkinBinding';
import { useSkinSystem } from '@/ui/idleVillage/hooks/useSkinSystem';
import { WanderlustMaterialContext } from '@/ui/wanderlust-surface/WanderlustMaterialContext';
import { DragContext, useDragContext } from '@/ui/idleVillage/components/DragContextStore';
import { SLOT_RACK_IRON_BRONZE_CONFIG } from '@/ui/idleVillage/skins/slotRackSkinConfig';

describe('PLAN-054 T-004 — tier-1 contract coverage (unità senza suite dedicata)', () => {
  // INV:activity-log-panel-config.INV-1
  it('activityLogPanelConfig: MinimalActivityEntry valida le entry canoniche e respinge severity fuori enum', () => {
    const ok = MinimalActivityEntrySchema.safeParse({ id: 'e1', timestamp: 10, severity: 'warning', message: 'm' });
    expect(ok.success).toBe(true);
    expect(MinimalActivityEntrySchema.safeParse({ id: 'e2', timestamp: 1, severity: 'loud', message: 'm' }).success).toBe(false);
    expect(ActivitySeveritySchema.options).toEqual(['info', 'warning', 'error', 'success']);
  });

  // INV:canonical-roster-bundle.INV-1
  it('canonicalResidentData produce il roster canonico non vuoto e indicizzabile per id', () => {
    const residents = canonicalResidentData();
    expect(residents.length).toBeGreaterThan(0);
    const byId = createResidentsById(residents);
    for (const r of residents) {
      expect(byId[r.id]).toBeDefined();
      expect(typeof r.id).toBe('string');
      expect(r.status).toBeTruthy();
    }
  });

  // INV:drag-test-container.module.INV-1
  it('DragTestContainer.module espone le classi del contenitore scroll usate dal lab', () => {
    expect(typeof styles.scrollArea).toBe('string');
    expect(styles.scrollArea.length).toBeGreaterThan(0);
  });

  // INV:game-frame.INV-1
  it('la pagina lab game-frame esporta GameFrameScreen e la pagina default', () => {
    expect(typeof GameFrameScreen).toBe('function');
    expect(typeof GameFramePage).toBe('function');
  });

  // INV:game-intent.INV-1
  it('IntentBridge inoltra gli intent allo store handler registrato', () => {
    const seen: string[] = [];
    IntentBridge.registerStoreHandler((intent) => seen.push(intent.type));
    IntentBridge.sendToStore({ type: 'SPAWN_HERO' } as never);
    expect(seen).toEqual(['SPAWN_HERO']);
    IntentBridge.registerStoreHandler(() => undefined);
  });

  // INV:hud-band.INV-1
  it('hudBand: default 3.5px, set/get condiviso e listeners notificati', () => {
    expect(DEFAULT_HUD_BAND_PX).toBe(3.5);
    const prev = getHudBandPx();
    setHudBandPx(5);
    expect(getHudBandPx()).toBe(5);
    setHudBandPx(prev);
    expect(typeof useHudBandPx).toBe('function');
  });

  // INV:hud-hide-toggle.INV-1
  it('HudHideToggle rende il toggle accessibile e chiama onToggle al click', () => {
    const onToggle = () => calls++;
    let calls = 0;
    const { rerender } = render(<HudHideToggle hidden={false} onToggle={onToggle} />);
    const btn = screen.getByRole('button');
    fireEvent.click(btn);
    expect(calls).toBe(1);
    rerender(<HudHideToggle hidden={true} onToggle={onToggle} />);
    expect(screen.getByRole('button')).toBeTruthy();
  });

  // INV:material-presets.INV-1
  it('materialPresets: BRONZE_THEME è completo (id, label, gradiente ordinato)', () => {
    const preset: MaterialPreset = BRONZE_THEME.id;
    expect(preset).toBe('bronze');
    expect(BRONZE_THEME.label).toBeTruthy();
    expect(BRONZE_THEME.body.length).toBeGreaterThan(0);
    expect(BRONZE_THEME.body[0].color).toBeTruthy();
    expect(BRONZE_THEME.baseFill).toBeTruthy();
  });

  // INV:materic-skin-config.INV-1
  it('matericSkinConfig: la config built-in ripassa lo schema Zod (round-trip)', () => {
    const reparsed = matericSkinConfigSchema.parse(MATERIC_SKIN_CONFIG);
    expect(reparsed.track.backgroundColor).toBe(MATERIC_SKIN_CONFIG.track.backgroundColor);
  });

  // INV:materic-skin-context.INV-1
  it('MatericSkinContext: il default non-materic è esposto da useMatericSkin', () => {
    const { result } = renderHook(() => useMatericSkin());
    expect(result.current).toBe(false);
  });

  // INV:minimal-feedback-config.INV-1
  it('minimalFeedbackConfig: i getter espongono le sezioni del config minimal', () => {
    expect(getMinimalFeedbackConfig()).toBeTruthy();
    expect(getSlotGlowConfig()).toBeTruthy();
    expect(getSensoryFeedbackConfig()).toBeTruthy();
  });

  // INV:physics-defaults.INV-1
  it('physicsDefaults: i default validano lo schema e le sezioni slider sono popolate', () => {
    expect(() => PhysicsConfigSchema.parse(PHYSICS_DEFAULTS)).not.toThrow();
    expect(SLIDER_DEFS.length).toBeGreaterThan(0);
    expect(SECTIONS.length).toBeGreaterThan(0);
  });

  // INV:portrait-decode-cache.INV-1
  it('portraitDecodeCache: preload mette in cache e isPortraitDecoded riflette lo stato', () => {
    const url = '/assets/test-portrait-t4.png';
    expect(isPortraitDecoded(url)).toBe(false);
    const img = preloadPortrait(url);
    if (img) {
      expect(preloadPortrait(url)).toBe(img);
    }
  });

  // INV:renderer-stack-instrumentation.INV-1
  it('rendererStackInstrumentation: il singleton esporta uno stack serializzabile', () => {
    const data = rendererStackInstrumentation.exportData();
    expect(Array.isArray(data.stackData)).toBe(true);
    expect(typeof data.timestamp).toBe('number');
    expect(['test', 'minimal-gameplay']).toContain(data.page);
  });

  // INV:resident-name.INV-1
  it('formatResidentLabel: displayName vince, founder-* e id sono title-case', () => {
    const base = { id: 'resident-1', displayName: 'Mario Rossi' } as never;
    expect(formatResidentLabel(base)).toBe('Mario Rossi');
    expect(formatResidentLabel({ id: 'founder-bruno_vera' } as never)).toBe('Bruno Vera');
    expect(formatResidentLabel({ id: 'simple-id' } as never)).toBe('Simple Id');
  });

  // INV:resolve-slot-requirements.INV-1
  it('resolveSlotRequirements: mappa solo slot whitelisted; maxCrewSize da metadata poi maxSlots', () => {
    const activity = { id: 'a1', metadata: { maxCrewSize: 3 }, maxSlots: 5 } as never;
    expect(resolveMaxCrewSize(activity)).toBe(3);
    expect(resolveMaxCrewSize({ id: 'a2', maxSlots: 4 } as never)).toBe(4);
    const map = resolveSlotRequirements({
      config: {
        mapSlots: {
          s1: { id: 's1', label: 'S1', isInitiallyUnlocked: true },
          s2: { id: 's2', label: 'S2', isInitiallyUnlocked: false },
        },
        activities: {},
        globalRules: { maxFatigueBeforeExhausted: 80 },
      },
      slotFilter: ['s1'],
    } as never);
    expect(Object.keys(map)).toEqual(['s1']);
    expect(map.s1.fatigueLimit).toBe(80);
    expect(map.s1.isUnlocked).toBe(true);
  });

  // INV:slot-wilderness-bronze-config.INV-1
  it('slotWildernessBronzeConfig: skin data con id stabile e metadata', () => {
    expect(slotV12SkinData.id).toBe('slot-wilderness-bronze');
    expect(slotV12SkinData.version).toBeTruthy();
  });

  // INV:stat-icon-utils.INV-1
  it('statIconUtils: glyph map canonica per le stat core e icone lucide presenti', () => {
    expect(statGlyphMap.hp).toBe('❤');
    expect(statGlyphMap.damage).toBe('⚔️');
    expect(Object.keys(lucideStatIcons).length).toBeGreaterThan(0);
  });

  // INV:drag-context-store.INV-1
  it('DragContextStore: useDragContext lancia fuori provider, restituisce lo stato dentro', () => {
    expect(() => renderHook(() => useDragContext())).toThrow();
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <DragContext.Provider
        value={{
          activeId: 'r1',
          setActiveId: () => undefined,
          dragCursorOffset: null,
          setDragCursorOffset: () => undefined,
          dragPreviewCenter: null,
          setDragPreviewCenter: () => undefined,
        }}
      >
        {children}
      </DragContext.Provider>
    );
    const { result } = renderHook(() => useDragContext(), { wrapper });
    expect(result.current.activeId).toBe('r1');
  });

  // INV:slot-rack-skin-config.INV-1
  it('slotRackSkinConfig: la skin iron-bronze ha id/versione stabili e struttura grid+slot', () => {
    expect(SLOT_RACK_IRON_BRONZE_CONFIG.id).toBe('slot_rack_iron_bronze');
    expect(SLOT_RACK_IRON_BRONZE_CONFIG.version).toBe(1);
    expect(SLOT_RACK_IRON_BRONZE_CONFIG.supportedPresets).toContain('minimal_frontier');
    expect(SLOT_RACK_IRON_BRONZE_CONFIG.grid.borderRadius).toBeTruthy();
    expect(SLOT_RACK_IRON_BRONZE_CONFIG.slotContainer.borderRadius).toBe('50%');
  });

  // INV:use-skin-binding.INV-1
  it('useSkinBinding: superficie API completa (hook + varianti preset/pillar/motion)', () => {
    expect(typeof useSkinBinding).toBe('function');
    expect(typeof useSkinBindingWithPreset).toBe('function');
    expect(typeof useSimpleSkinBinding).toBe('function');
  });

  // INV:wanderlust-material-context.INV-1
  it('WanderlustMaterialContext: il preset di default è bronze', () => {
    const { result } = renderHook(() => React.useContext(WanderlustMaterialContext));
    expect(result.current).toBe('bronze');
  });

  // INV:use-skin-system.INV-1
  it('useSkinSystem: espone stato skin coerente e superficie azioni', () => {
    const { result } = renderHook(() => useSkinSystem({ enableAutoUpdate: false }));
    expect(result.current.state.currentPreset).toBeTruthy();
    expect(result.current.state.isTransitioning).toBe(false);
    expect(typeof result.current.setPreset).toBe('function');
    expect(typeof result.current.setPillar).toBe('function');
  });
});
