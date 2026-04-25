/**
 * Style Laboratory Demo Page
 *
 * Advanced component showcase for Style Lab.
 * Left side renders the live component, right side exposes config sliders.
 */

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useStyleLabTokens } from './hooks/useStyleLabTokens';
import { DraggableCard } from './components/DraggableCard';
import { SunkenSlot } from './components/SunkenSlot';
import { PhysicalButton } from './components/PhysicalButton';
import { SliderDemo } from './components/SliderDemo';
import { ToggleDemo } from './components/ToggleDemo';
import { ProgressRingDemo } from './components/ProgressRingDemo';
import { TextFieldDemo } from './components/TextFieldDemo';
import { ToastDemo } from './components/ToastDemo';
import { HoverCardDemo } from './components/HoverCardDemo';
import { PhysicsSlider } from './components/PhysicsSlider';
import { PhysicsPresetSelector } from './physics/PhysicsPresetSelector';
import { PresetManager } from './components/PresetManager';
import { DragPhysicsProvider } from './physics/DragPhysicsContext';
import { DemoConfigContext } from './contexts/DemoConfigContext';
import { usePhysicsConfig } from './hooks/usePhysicsConfig';
import { PHYSICS_DEFAULTS, SLIDER_DEFS, SECTIONS, type PhysicsConfig } from './config/physicsDefaults';
import { defaultDemoConfig, DemoConfigSchema, type DemoComponent, type DemoConfig, type StyleLabPillar, DEFAULT_DEMO_CONFIG_META } from './config/demoConfig';
import type { CustomPreset } from './config/presetManager';
import { PresetManager as PresetManagerClass } from './config/presetManager';
import { presetMetadata } from './presets';
import { PRESET_PILLARS, resolveDemoPreset, isBuiltInPresetId } from './presets/presetBridge';
import { saveData, loadData } from '../../shared/persistence/PersistenceService';

type DemoComponent =
  | 'slider'
  | 'toggle'
  | 'progress'
  | 'textfield'
  | 'toast'
  | 'hovercard'
  | 'dragdrop'
  | 'button'
  | 'presets'
  | 'actionCard'
  | 'halo';

interface StyleLabDemoProps {
  className?: string;
}

type PresetSource = 'builtin' | 'custom';

interface StyleLabBridgeSnapshot {
  presetKind: PresetSource;
  presetId: string;
  basePresetId: PresetId;
  pillar: StyleLabPillar;
  demoConfig: DemoConfig;
  physicsConfig: PhysicsConfig;
  styleOverride?: StyleLabPresetSnapshot | null;
}

interface StyleLabDemoPersistedState extends StyleLabBridgeSnapshot {
  updatedAt: number;
}

export const DEMO_STATE_STORAGE_KEY = 'style-lab-demo-state';
export const LEGACY_DEMO_CONFIG_KEY = 'style-lab-demo-config';

const FALLBACK_BRIDGE_SNAPSHOT: StyleLabBridgeSnapshot = {
  presetKind: 'builtin',
  presetId: 'minimalFrontier',
  basePresetId: 'minimalFrontier',
  pillar: 'frontier',
  demoConfig: defaultDemoConfig,
  physicsConfig: PHYSICS_DEFAULTS,
  styleOverride: null,
};

const validateSnapshot = (snapshot: StyleLabBridgeSnapshot | null): StyleLabBridgeSnapshot | null => {
  if (!snapshot) return null;
  const parsedConfig = DemoConfigSchema.safeParse(snapshot.demoConfig);
  if (!parsedConfig.success) {
    console.warn('[StyleLabDemo] Invalid demoConfig payload, discarding snapshot', parsedConfig.error.flatten());
    return null;
  }
  return {
    ...snapshot,
    demoConfig: parsedConfig.data,
    physicsConfig: {
      ...PHYSICS_DEFAULTS,
      ...snapshot.physicsConfig,
    },
    styleOverride: snapshot.styleOverride ?? null,
  };
};

const createSnapshotFromPreset = (presetId: PresetId): StyleLabBridgeSnapshot => {
  const resolved = resolveDemoPreset(presetId);
  return {
    presetKind: 'builtin',
    presetId,
    basePresetId: presetId,
    pillar: resolved.pillar,
    demoConfig: resolved.demoConfig,
    physicsConfig: resolved.physicsConfig,
    styleOverride: null,
  };
};

const createSnapshotFromCustomPreset = (preset: CustomPreset, fallbackPresetId: PresetId): StyleLabBridgeSnapshot => {
  const basePresetId = preset.basePresetId && isBuiltInPresetId(preset.basePresetId)
    ? preset.basePresetId
    : fallbackPresetId;
  const pillar = preset.pillar ?? PRESET_PILLARS[basePresetId];
  const demoConfig = DemoConfigSchema.safeParse({
    ...preset.demoConfig,
    meta: {
      ...(preset.demoConfig?.meta ?? DEFAULT_DEMO_CONFIG_META),
      presetId: preset.id,
      presetLabel: preset.name,
      pillar,
      sourceId: basePresetId,
      isCustom: true,
    },
  });

  return {
    presetKind: 'custom',
    presetId: preset.id,
    basePresetId,
    pillar,
    demoConfig: demoConfig.success ? demoConfig.data : defaultDemoConfig,
    physicsConfig: {
      ...PHYSICS_DEFAULTS,
      ...(preset.physicsConfig ?? {}),
    },
    styleOverride: preset.styleConfig ?? null,
  };
};

const COMPONENT_LABEL: Record<DemoComponent, string> = {
  slider: 'Slider',
  toggle: 'Toggle Switch',
  progress: 'Progress Ring',
  textfield: 'Text Field',
  toast: 'Notification Toast',
  hovercard: 'Hover Card',
  dragdrop: 'Drag & Drop',
  button: 'Button',
  presets: 'Preset Manager',
  actionCard: 'Action Card',
  halo: 'Map Halo',
};

const readSnapshotFromStorage = (): StyleLabBridgeSnapshot | null => {
  try {
    const storages: Storage[] = [];
    if (typeof sessionStorage !== 'undefined') storages.push(sessionStorage);
    if (typeof localStorage !== 'undefined') storages.push(localStorage);
    for (const storage of storages) {
      const raw = storage.getItem(DEMO_STATE_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        const validated = validateSnapshot(parsed);
        if (validated) return validated;
      }
    }
  } catch { /* ignore — fall through to null */ }
  return null;
};

export function StyleLabDemo({ className }: StyleLabDemoProps) {
  const syncSnapshotRef = useRef<StyleLabBridgeSnapshot | null>(null);
  const [bridgeSnapshot, setBridgeSnapshot] = useState<StyleLabBridgeSnapshot>(() => {
    const fromStorage = readSnapshotFromStorage();
    if (fromStorage) {
      syncSnapshotRef.current = fromStorage;
      return fromStorage;
    }
    return FALLBACK_BRIDGE_SNAPSHOT;
  });
  const [isPersistenceReady, setIsPersistenceReady] = useState(!!syncSnapshotRef.current);
  const [activeComponent, setActiveComponent] = useState<DemoComponent>('slider');
  const [isControlsVisible, setIsControlsVisible] = useState(true);
  const physicsConfig = usePhysicsConfig();
  const physicsSetCfg = physicsConfig.setCfg;
  const activePreset = bridgeSnapshot.basePresetId;
  const styleOverride = bridgeSnapshot.styleOverride ?? undefined;
  const config = bridgeSnapshot.demoConfig;
  const tokens = useStyleLabTokens({ presetId: activePreset, presetOverride: styleOverride });
  const [isOverSlot, setIsOverSlot] = useState(false);
  const [droppedIcon, setDroppedIcon] = useState<string | undefined>();
  const slotRef = useRef<HTMLDivElement>(null);
  const hydrationAbortRef = useRef(false);
  const hasHydratedRef = useRef(false);

  const recordSnapshotAdoption = useCallback((reason: string, snapshot: StyleLabBridgeSnapshot) => {
    if (typeof window === 'undefined') return;
    const globalWindow = window as typeof window & { __STYLE_LAB_ADOPT_LOG__?: Array<{ reason: string; presetId: string; pillar: StyleLabPillar; timestamp: number }> };
    const entry = { reason, presetId: snapshot.basePresetId, pillar: snapshot.pillar, timestamp: Date.now() };
    const log = globalWindow.__STYLE_LAB_ADOPT_LOG__ ?? [];
    log.push(entry);
    if (log.length > 20) {
      log.splice(0, log.length - 20);
    }
    globalWindow.__STYLE_LAB_ADOPT_LOG__ = log;
  }, []);

  const adoptSnapshot = useCallback((snapshot: StyleLabBridgeSnapshot, reason: string) => {
    const validated = validateSnapshot(snapshot) ?? FALLBACK_BRIDGE_SNAPSHOT;
    recordSnapshotAdoption(reason, validated);
    setBridgeSnapshot(validated);
    physicsSetCfg(validated.physicsConfig);
    return validated;
  }, [physicsSetCfg, recordSnapshotAdoption]);

  const updateDemoConfig = useCallback((updater: DemoConfig | ((prev: DemoConfig) => DemoConfig)) => {
    setBridgeSnapshot((prev) => {
      const nextDemoConfig = typeof updater === 'function'
        ? (updater as (value: DemoConfig) => DemoConfig)(prev.demoConfig)
        : updater;

      return {
        ...prev,
        demoConfig: nextDemoConfig,
      };
    });
  }, []);

  const persistSnapshot = useCallback(async (snapshot: StyleLabBridgeSnapshot) => {
    try {
      const payload: StyleLabDemoPersistedState = {
        ...snapshot,
        styleOverride: snapshot.styleOverride ?? null,
        updatedAt: Date.now(),
      };
      await saveData(DEMO_STATE_STORAGE_KEY, payload);
    } catch (error) {
      console.warn('Failed to persist Style Lab demo state', error);
    }
  }, []);

  const applyPresetInternal = useCallback((presetId: PresetId, options?: { persist?: boolean }) => {
    const snapshot = createSnapshotFromPreset(presetId);
    adoptSnapshot(snapshot, `applyPreset:${presetId}`);
    if (typeof window !== 'undefined') {
      (window as typeof window & { __STYLE_LAB_LAST_PRESET__?: string }).__STYLE_LAB_LAST_PRESET__ = presetId;
    }
    if (options?.persist) {
      void persistSnapshot(snapshot);
    }
    PresetManagerClass.saveActivePreset(presetId).catch((error) => {
      console.warn('[StyleLabDemo] Failed to save active preset', error);
    });
  }, [adoptSnapshot, persistSnapshot]);

  const markPersistenceReady = useCallback(() => {
    setIsPersistenceReady((ready) => (ready ? ready : true));
  }, []);

  const applyPreset = useCallback((presetId: PresetId) => {
    hydrationAbortRef.current = true;
    try {
      applyPresetInternal(presetId, { persist: true });
      markPersistenceReady();
    } finally {
      hydrationAbortRef.current = false;
    }
  }, [applyPresetInternal, markPersistenceReady]);

  const applyCustomPresetInternal = useCallback(async (preset: CustomPreset, options?: { persist?: boolean }) => {
    const snapshot = createSnapshotFromCustomPreset(preset, activePreset);
    adoptSnapshot(snapshot, `applyCustomPreset:${preset.id}`);
    if (options?.persist) {
      await persistSnapshot(snapshot);
    }
    await PresetManagerClass.saveActivePreset(preset.id);
  }, [adoptSnapshot, activePreset, persistSnapshot]);

  const applyCustomPreset = useCallback(async (preset: CustomPreset) => {
    hydrationAbortRef.current = true;
    try {
      await applyCustomPresetInternal(preset, { persist: true });
      markPersistenceReady();
    } catch (error) {
      console.error('[StyleLabDemo] Failed to apply custom preset:', error);
    } finally {
      hydrationAbortRef.current = false;
    }
  }, [applyCustomPresetInternal, markPersistenceReady]);

  // Hydrate persisted state on mount.
  // Fast path: if sync read from storage succeeded (syncSnapshotRef), just sync physics.
  // Slow path: async load via PersistenceService (Tauri FS, etc.).
  useEffect(() => {
    if (hasHydratedRef.current) return;
    hasHydratedRef.current = true;

    // Fast path — snapshot was read synchronously in useState initializer
    if (syncSnapshotRef.current) {
      const snap = syncSnapshotRef.current;
      physicsSetCfg(snap.physicsConfig);
      recordSnapshotAdoption('hydrate:sync-storage', snap);
      return;
    }

    // Slow path — async load (Tauri FS or when storage was empty)
    let isMounted = true;

    const directAdopt = (snapshot: StyleLabBridgeSnapshot, reason: string) => {
      if (!isMounted || hydrationAbortRef.current) return;
      const validated = validateSnapshot(snapshot) ?? FALLBACK_BRIDGE_SNAPSHOT;
      recordSnapshotAdoption(reason, validated);
      setBridgeSnapshot(validated);
      physicsSetCfg(validated.physicsConfig);
    };

    (async () => {
      try {
        const savedState = await loadData<StyleLabDemoPersistedState | null>(DEMO_STATE_STORAGE_KEY, null);
        if (hydrationAbortRef.current || !isMounted) return;
        if (savedState) {
          const snapshot = validateSnapshot(savedState);
          if (snapshot) {
            directAdopt(snapshot, 'hydrate:saved-state');
            if (isMounted) setIsPersistenceReady(true);
            return;
          }
        }

        const legacyConfig = await loadData<DemoConfig | null>(LEGACY_DEMO_CONFIG_KEY, null);
        if (hydrationAbortRef.current || !isMounted) return;
        if (legacyConfig) {
          const parsedLegacy = DemoConfigSchema.safeParse({
            ...legacyConfig,
            meta: {
              ...(legacyConfig.meta ?? DEFAULT_DEMO_CONFIG_META),
              presetId: 'legacy-demo-config',
              presetLabel: 'Legacy Demo',
              pillar: DEFAULT_DEMO_CONFIG_META.pillar,
              sourceId: 'minimalFrontier',
              isCustom: true,
            },
          });

          const legacySnapshot: StyleLabBridgeSnapshot = {
            ...createSnapshotFromPreset('minimalFrontier'),
            presetKind: 'custom',
            presetId: 'legacy-demo-config',
            demoConfig: parsedLegacy.success ? parsedLegacy.data : defaultDemoConfig,
          };
          directAdopt(legacySnapshot, 'hydrate:legacy-config');
          if (isMounted) setIsPersistenceReady(true);
          return;
        }

        const savedPresetId = await PresetManagerClass.loadActivePreset();
        if (!isMounted || hydrationAbortRef.current) return;

        if (savedPresetId && isBuiltInPresetId(savedPresetId)) {
          const snapshot = createSnapshotFromPreset(savedPresetId as PresetId);
          directAdopt(snapshot, `hydrate:active-preset:${savedPresetId}`);
          if (isMounted) setIsPersistenceReady(true);
          return;
        }

        if (savedPresetId) {
          const preset = await PresetManagerClass.loadPreset(savedPresetId);
          if (preset && isMounted && !hydrationAbortRef.current) {
            const snapshot = createSnapshotFromCustomPreset(preset, 'minimalFrontier');
            directAdopt(snapshot, `hydrate:custom-preset:${savedPresetId}`);
            if (isMounted) setIsPersistenceReady(true);
            return;
          }
        }

        if (!hydrationAbortRef.current && isMounted) {
          directAdopt(createSnapshotFromPreset('minimalFrontier'), 'hydrate:default');
        }
      } catch (error) {
        console.warn('Failed to hydrate Style Lab state', error);
        if (isMounted && !hydrationAbortRef.current) {
          directAdopt(createSnapshotFromPreset('minimalFrontier'), 'hydrate:error-fallback');
        }
      }
    })();

    return () => {
      isMounted = false;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Persist demo state whenever snapshot changes
  useEffect(() => {
    if (!isPersistenceReady) return;
    void persistSnapshot(bridgeSnapshot);
  }, [bridgeSnapshot, isPersistenceReady, persistSnapshot]);

  const setConfigSection = useCallback(<K extends keyof DemoConfig>(key: K, patch: Partial<DemoConfig[K]>) => {
    updateDemoConfig((prev) => ({
      ...prev,
      [key]: {
        ...prev[key],
        ...patch,
      },
    }));
  }, [updateDemoConfig]);

  const _availableComponents = useMemo(
    () => [
      'slider',
      'toggle',
      'progress',
      'textfield',
      'toast',
      'hovercard',
      'dragdrop',
      'button',
      'presets',
      'actionCard',
      'halo',
    ] as DemoComponent[]
  , []);

  const renderActiveComponent = () => {
    const active = config.animation.enabled;
    switch (activeComponent) {
      case 'slider':
        return <SliderDemo config={config.slider} isActive={active} />;
      case 'toggle':
        return <ToggleDemo config={config.toggle} isActive={active} />;
      case 'progress':
        return <ProgressRingDemo config={config.progressRing} isActive={active} />;
      case 'textfield':
        return <TextFieldDemo config={config.textField} isActive={active} />;
      case 'toast':
        return <ToastDemo config={config.toast} isActive={active} />;
      case 'hovercard':
        return <HoverCardDemo config={config.hoverCard} isActive={active} />;
      case 'dragdrop':
        return (
          <div className="flex items-center justify-center gap-8" style={{ minHeight: '300px' }}>
            <DraggableCard
              cfg={physicsConfig.cfg}
              onDragOverSlot={setIsOverSlot}
              onDrop={(success) => {
                if (success) {
                  setDroppedIcon('⚔️');
                  setTimeout(() => setDroppedIcon(undefined), 2000);
                }
              }}
              slotRef={slotRef}
            />
            <SunkenSlot
              cfg={physicsConfig.cfg}
              isOver={isOverSlot}
              droppedIcon={droppedIcon}
              ref={slotRef}
            />
          </div>
        );
      case 'button':
        return (
          <div className="flex items-center justify-center gap-4">
            <PhysicalButton
              cfg={physicsConfig.cfg}
              label="Primary"
              onClick={() => console.log('Primary clicked')}
            />
            <PhysicalButton
              cfg={physicsConfig.cfg}
              label="Ghost"
              variant="ghost"
              onClick={() => console.log('Ghost clicked')}
            />
            <PhysicalButton
              cfg={physicsConfig.cfg}
              label="Disabled"
              variant="disabled"
            />
          </div>
        );
      case 'presets':
        return (
          <div className="flex items-center justify-center">
            <PresetManager
              onPresetApply={applyCustomPreset}
              activePresetId={activePreset}
              styleOverride={styleOverride}
            />
          </div>
        );
      case 'actionCard':
        return (
          <div className="flex items-center justify-center p-8">
            <div
              style={{
                backgroundColor: config.actionCardFeel.visual.backgroundColor,
                border: `2px solid ${config.actionCardFeel.visual.frameColor}`,
                borderRadius: config.actionCardFeel.visual.borderRadius,
                padding: config.actionCardFeel.visual.padding,
                boxShadow: `0 ${config.actionCardFeel.visual.shadowDepth}px ${config.actionCardFeel.visual.shadowDepth * 2}px rgba(0,0,0,0.3)`,
                transition: `transform ${config.actionCardFeel.interaction.transitionMs}ms ease`,
                transform: `scale(${config.actionCardFeel.interaction.hoverScale})`,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = `scale(${config.actionCardFeel.interaction.hoverScale})`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
              }}
              onMouseDown={(e) => {
                e.currentTarget.style.transform = `scale(${config.actionCardFeel.interaction.activeScale})`;
              }}
              onMouseUp={(e) => {
                e.currentTarget.style.transform = `scale(${config.actionCardFeel.interaction.hoverScale})`;
              }}
            >
              <div style={{ color: tokens.preset.text.primary, textAlign: 'center' }}>
                <h3 style={{ margin: '0 0 8px 0' }}>Action Card Demo</h3>
                <p style={{ margin: 0, fontSize: '14px' }}>Pillar: {activePreset}</p>
                <p style={{ margin: '4px 0 0 0', fontSize: '12px', opacity: 0.7 }}>
                  Frame: {config.actionCardFeel.visual.frameColor}
                </p>
              </div>
            </div>
          </div>
        );
      case 'halo':
        return (
          <div className="flex items-center justify-center p-8">
            <div
              style={{
                position: 'relative',
                width: `${config.mapHaloFeel.visual.ringRadius * 2}px`,
                height: `${config.mapHaloFeel.visual.ringRadius * 2}px`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {/* Halo ring */}
              <div
                style={{
                  position: 'absolute',
                  width: '100%',
                  height: '100%',
                  border: `${config.mapHaloFeel.visual.ringWidth}px solid ${config.mapHaloFeel.visual.haloColor}`,
                  borderRadius: '50%',
                  boxShadow: `0 0 ${config.mapHaloFeel.visual.shadowBlur}px ${config.mapHaloFeel.visual.haloGlow}`,
                  animation: `pulse ${config.mapHaloFeel.visual.pulseSpeed}s ease-in-out infinite`,
                  opacity: config.mapHaloFeel.visual.pulseIntensity,
                }}
              />
              {/* Icon */}
              <div
                style={{
                  width: `${config.mapHaloFeel.visual.iconSize}px`,
                  height: `${config.mapHaloFeel.visual.iconSize}px`,
                  backgroundColor: config.mapHaloFeel.visual.haloColor,
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontSize: `${config.mapHaloFeel.visual.iconSize * 0.6}px`,
                  fontWeight: 'bold',
                  zIndex: 1,
                }}
              >
                POI
              </div>
            </div>
            <div style={{ marginLeft: '20px', color: tokens.preset.text.primary }}>
              <h4 style={{ margin: '0 0 4px 0' }}>Map Halo Demo</h4>
              <p style={{ margin: 0, fontSize: '12px' }}>Pillar: {activePreset}</p>
              <p style={{ margin: '4px 0 0 0', fontSize: '11px', opacity: 0.7 }}>
                Color: {config.mapHaloFeel.visual.haloColor}
              </p>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  const renderComponentControls = () => {
    const slider = (
      label: string,
      value: number,
      min: number,
      max: number,
      step: number,
      updater: (val: number) => void,
    ) => (
      <div>
        <label className="text-sm block mb-1" style={{ color: tokens.preset.surfaces.panel.color }}>
          {label}: {value}
        </label>
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => updater(parseFloat(e.target.value))}
          className="w-full"
        />
      </div>
    );

    switch (activeComponent) {
      case 'slider':
        return (
          <div className="space-y-3">
            {slider('Move Speed', config.slider.moveSpeed, 0.5, 5, 0.1, (val) => setConfigSection('slider', { moveSpeed: val }))}
            {slider('Track Height', config.slider.trackHeight, 4, 12, 1, (val) => setConfigSection('slider', { trackHeight: val }))}
            <div className="flex items-center">
              <input
                type="checkbox"
                id="slider-auto"
                checked={config.slider.autoMove}
                onChange={(e) => setConfigSection('slider', { autoMove: e.target.checked })}
                className="mr-2"
              />
              <label htmlFor="slider-auto" className="text-sm" style={{ color: tokens.preset.surfaces.panel.color }}>
                Auto Move
              </label>
            </div>
          </div>
        );
      case 'toggle':
        return (
          <div className="space-y-3">
            {slider('Toggle Interval (ms)', config.toggle.toggleInterval, 1000, 6000, 250, (val) => setConfigSection('toggle', { toggleInterval: val }))}
            <div className="flex items-center">
              <input
                type="checkbox"
                id="toggle-auto"
                checked={config.toggle.autoToggle}
                onChange={(e) => setConfigSection('toggle', { autoToggle: e.target.checked })}
                className="mr-2"
              />
              <label htmlFor="toggle-auto" className="text-sm" style={{ color: tokens.preset.surfaces.panel.color }}>
                Auto Toggle
              </label>
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                id="toggle-label"
                checked={config.toggle.showLabel}
                onChange={(e) => setConfigSection('toggle', { showLabel: e.target.checked })}
                className="mr-2"
              />
              <label htmlFor="toggle-label" className="text-sm" style={{ color: tokens.preset.surfaces.panel.color }}>
                Show Label
              </label>
            </div>
          </div>
        );
      case 'progress':
        return (
          <div className="space-y-3">
            {slider('Fill Speed', config.progressRing.fillSpeed, 0.5, 5, 0.1, (val) => setConfigSection('progressRing', { fillSpeed: val }))}
            {slider('Ring Size', config.progressRing.ringSize, 80, 220, 10, (val) => setConfigSection('progressRing', { ringSize: val }))}
            {slider('Stroke Width', config.progressRing.strokeWidth, 2, 8, 0.5, (val) => setConfigSection('progressRing', { strokeWidth: val }))}
            <div className="flex items-center">
              <input
                type="checkbox"
                id="progress-auto"
                checked={config.progressRing.autoFill}
                onChange={(e) => setConfigSection('progressRing', { autoFill: e.target.checked })}
                className="mr-2"
              />
              <label htmlFor="progress-auto" className="text-sm" style={{ color: tokens.preset.surfaces.panel.color }}>
                Auto Fill
              </label>
            </div>
          </div>
        );
      case 'textfield':
        return (
          <div className="space-y-3">
            {slider('Focus Interval (ms)', config.textField.focusInterval, 2000, 8000, 250, (val) => setConfigSection('textField', { focusInterval: val }))}
            {slider('Max Length', config.textField.maxLength, 10, 100, 5, (val) => setConfigSection('textField', { maxLength: val }))}
            <div className="flex items-center">
              <input
                type="checkbox"
                id="textfield-auto"
                checked={config.textField.autoFocus}
                onChange={(e) => setConfigSection('textField', { autoFocus: e.target.checked })}
                className="mr-2"
              />
              <label htmlFor="textfield-auto" className="text-sm" style={{ color: tokens.preset.surfaces.panel.color }}>
                Auto Focus
              </label>
            </div>
          </div>
        );
      case 'toast':
        return (
          <div className="space-y-3">
            {slider('Show Interval (ms)', config.toast.showInterval, 3000, 10000, 500, (val) => setConfigSection('toast', { showInterval: val }))}
            {slider('Duration (ms)', config.toast.duration, 1000, 8000, 500, (val) => setConfigSection('toast', { duration: val }))}
            <div className="flex items-center">
              <input
                type="checkbox"
                id="toast-auto"
                checked={config.toast.autoShow}
                onChange={(e) => setConfigSection('toast', { autoShow: e.target.checked })}
                className="mr-2"
              />
              <label htmlFor="toast-auto" className="text-sm" style={{ color: tokens.preset.surfaces.panel.color }}>
                Auto Show
              </label>
            </div>
          </div>
        );
      case 'hovercard':
        return (
          <div className="space-y-3">
            {slider('Card Width', config.hoverCard.cardWidth, 200, 500, 10, (val) => setConfigSection('hoverCard', { cardWidth: val }))}
            {slider('Card Height', config.hoverCard.cardHeight, 100, 300, 10, (val) => setConfigSection('hoverCard', { cardHeight: val }))}
            {slider('Rotation Speed', config.hoverCard.rotationSpeed, 1, 10, 1, (val) => setConfigSection('hoverCard', { rotationSpeed: val }))}
            <div className="flex items-center">
              <input
                type="checkbox"
                id="hovercard-auto"
                checked={config.hoverCard.autoHover}
                onChange={(e) => setConfigSection('hoverCard', { autoHover: e.target.checked })}
                className="mr-2"
              />
              <label htmlFor="hovercard-auto" className="text-sm" style={{ color: tokens.preset.surfaces.panel.color }}>
                Auto Hover
              </label>
            </div>
          </div>
        );
      case 'dragdrop':
        return (
          <div className="space-y-3">
            <PhysicsPresetSelector />
            {slider('Spring Stiffness', config.dragDrop.springStiffness, 100, 500, 50, (val) => setConfigSection('dragDrop', { springStiffness: val }))}
            {slider('Glow Intensity', config.dragDrop.glowIntensity, 0.1, 1.0, 0.1, (val) => setConfigSection('dragDrop', { glowIntensity: val }))}
            {slider('Loop Timing (ms)', config.dragDrop.loopTiming, 1000, 5000, 500, (val) => setConfigSection('dragDrop', { loopTiming: val }))}
            <div className="flex items-center">
              <input
                type="checkbox"
                id="dragdrop-auto"
                checked={config.dragDrop.autoLoop}
                onChange={(e) => setConfigSection('dragDrop', { autoLoop: e.target.checked })}
                className="mr-2"
              />
              <label htmlFor="dragdrop-auto" className="text-sm" style={{ color: tokens.preset.surfaces.panel.color }}>
                Auto Loop
              </label>
            </div>
          </div>
        );
      case 'button':
        return (
          <div className="space-y-3">
            {slider('Squash Factor', config.button.squashFactor, 0.8, 0.95, 0.01, (val) => setConfigSection('button', { squashFactor: val }))}
            {slider('Hold Duration (ms)', config.button.holdDuration, 500, 3000, 250, (val) => setConfigSection('button', { holdDuration: val }))}
            {slider('Click Timing (ms)', config.button.clickTiming, 1000, 5000, 500, (val) => setConfigSection('button', { clickTiming: val }))}
            <div className="flex items-center">
              <input
                type="checkbox"
                id="button-auto"
                checked={config.button.autoLoop}
                onChange={(e) => setConfigSection('button', { autoLoop: e.target.checked })}
                className="mr-2"
              />
              <label htmlFor="button-auto" className="text-sm" style={{ color: tokens.preset.surfaces.panel.color }}>
                Auto Loop
              </label>
            </div>
          </div>
        );
      case 'presets':
        return (
          <div className="space-y-3">
            <PresetManager onPresetApply={applyCustomPreset} />
          </div>
        );
      case 'actionCard':
        return (
          <div className="space-y-3">
            <h5 className="text-xs font-medium mb-2 uppercase tracking-wider opacity-70" style={{ color: 'var(--t2, #806858)' }}>
              Visual
            </h5>
            {slider('Shadow Depth', config.actionCardFeel.visual.shadowDepth, 4, 32, 1, (val) => setConfigSection('actionCardFeel', { visual: { ...config.actionCardFeel.visual, shadowDepth: val } }))}
            {slider('Rim Light Intensity', config.actionCardFeel.visual.rimLightIntensity, 0, 1, 0.05, (val) => setConfigSection('actionCardFeel', { visual: { ...config.actionCardFeel.visual, rimLightIntensity: val } }))}
            <h5 className="text-xs font-medium mb-2 uppercase tracking-wider opacity-70" style={{ color: 'var(--t2, #806858)' }}>
              Interaction
            </h5>
            {slider('Hover Scale', config.actionCardFeel.interaction.hoverScale, 0.95, 1.05, 0.01, (val) => setConfigSection('actionCardFeel', { interaction: { ...config.actionCardFeel.interaction, hoverScale: val } }))}
            {slider('Active Scale', config.actionCardFeel.interaction.activeScale, 0.9, 1.0, 0.01, (val) => setConfigSection('actionCardFeel', { interaction: { ...config.actionCardFeel.interaction, activeScale: val } }))}
            {slider('Transition (ms)', config.actionCardFeel.interaction.transitionMs, 100, 800, 50, (val) => setConfigSection('actionCardFeel', { interaction: { ...config.actionCardFeel.interaction, transitionMs: val } }))}
          </div>
        );
      case 'halo':
        return (
          <div className="space-y-3">
            <h5 className="text-xs font-medium mb-2 uppercase tracking-wider opacity-70" style={{ color: 'var(--t2, #806858)' }}>
              Visual
            </h5>
            {slider('Ring Width', config.mapHaloFeel.visual.ringWidth, 2, 8, 1, (val) => setConfigSection('mapHaloFeel', { visual: { ...config.mapHaloFeel.visual, ringWidth: val } }))}
            {slider('Ring Radius', config.mapHaloFeel.visual.ringRadius, 20, 60, 2, (val) => setConfigSection('mapHaloFeel', { visual: { ...config.mapHaloFeel.visual, ringRadius: val } }))}
            {slider('Icon Size', config.mapHaloFeel.visual.iconSize, 12, 32, 2, (val) => setConfigSection('mapHaloFeel', { visual: { ...config.mapHaloFeel.visual, iconSize: val } }))}
            {slider('Shadow Blur', config.mapHaloFeel.visual.shadowBlur, 4, 20, 2, (val) => setConfigSection('mapHaloFeel', { visual: { ...config.mapHaloFeel.visual, shadowBlur: val } }))}
            {slider('Pulse Intensity', config.mapHaloFeel.visual.pulseIntensity, 0, 1, 0.05, (val) => setConfigSection('mapHaloFeel', { visual: { ...config.mapHaloFeel.visual, pulseIntensity: val } }))}
            {slider('Pulse Speed', config.mapHaloFeel.visual.pulseSpeed, 0.5, 3, 0.1, (val) => setConfigSection('mapHaloFeel', { visual: { ...config.mapHaloFeel.visual, pulseSpeed: val } }))}
            <h5 className="text-xs font-medium mb-2 uppercase tracking-wider opacity-70" style={{ color: 'var(--t2, #806858)' }}>
              Interaction
            </h5>
            {slider('Hover Scale', config.mapHaloFeel.interaction.hoverScale, 1.0, 1.3, 0.05, (val) => setConfigSection('mapHaloFeel', { interaction: { ...config.mapHaloFeel.interaction, hoverScale: val } }))}
            {slider('Active Scale', config.mapHaloFeel.interaction.activeScale, 0.9, 1.1, 0.05, (val) => setConfigSection('mapHaloFeel', { interaction: { ...config.mapHaloFeel.interaction, activeScale: val } }))}
            {slider('Transition (ms)', config.mapHaloFeel.interaction.transitionMs, 100, 600, 50, (val) => setConfigSection('mapHaloFeel', { interaction: { ...config.mapHaloFeel.interaction, transitionMs: val } }))}
          </div>
        );
      default:
        return null;
    }
  };

  const renderControls = () => {
    return (
      <div className="space-y-6 p-6" style={{
        background: tokens.preset.surfaces.panel.background,
        borderColor: tokens.preset.surfaces.panel.borderColor,
        borderWidth: '1px',
        borderStyle: 'solid',
        borderRadius: '8px'
      }}>
        {/* Preset Switcher */}
        <div>
          <h4 className={`font-semibold mb-3`} style={{ color: tokens.preset.surfaces.panel.color }}>
            Style Preset
          </h4>
          <div className="space-y-2">
            {Object.entries(presetMetadata).map(([presetId, metadata]) => (
              <button
                key={presetId}
                onClick={() => applyPreset(presetId as PresetId)}
                className={`w-full px-3 py-2 rounded text-left transition-colors flex items-center space-x-2 ${
                  activePreset === presetId
                    ? 'bg-purple-500 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
                data-testid={`style-lab-preset-button-${presetId}`}
              >
                <span className="text-lg">{(metadata as { icon: string }).icon}</span>
                <div>
                  <div className="font-medium">{(metadata as { label: string }).label}</div>
                  <div className="text-xs opacity-70">{(metadata as { description: string }).description}</div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Component Controls */}
        {renderComponentControls()}

        {/* Physics Controls - Only show for dragdrop or button */}
        {(activeComponent === 'dragdrop' || activeComponent === 'button') && (
          <div>
            <h4 className={`font-semibold mb-3`} style={{ color: tokens.preset.surfaces.panel.color }}>
              Physics
            </h4>
            <div className="space-y-3">
              {SECTIONS.map((section) => (
                <div key={section.id}>
                  <h5 
                    className="text-xs font-medium mb-2 uppercase tracking-wider opacity-70"
                    style={{ color: 'var(--t2, #806858)' }}
                  >
                    {section.label}
                  </h5>
                  {SLIDER_DEFS
                    .filter((def) => def.section === section.id)
                    .map((def) => (
                      <PhysicsSlider
                        key={def.key}
                        def={def}
                        value={physicsConfig.cfg[def.key]}
                        onChange={(key, value) => physicsConfig.setCfg({ [key]: value })}
                      />
                    ))}
                </div>
              ))}
              
              {/* Physics Reset */}
              <button
                onClick={physicsConfig.reset}
                className="w-full px-3 py-2 rounded text-xs font-medium transition-colors mt-4"
                style={{
                  background: 'var(--iron-md, #181c24)',
                  border: '1px solid var(--go3, #786000)',
                  color: 'var(--t1, #c8b88a)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'var(--iron-rim, #242c38)';
                  e.currentTarget.style.borderColor = 'var(--go4, #a08020)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'var(--iron-md, #181c24)';
                  e.currentTarget.style.borderColor = 'var(--go3, #786000)';
                }}
              >
                Reset Physics
              </button>
            </div>
          </div>
        )}

        {/* Game Feel Controls */}
        <div>
          <h4 className={`font-semibold mb-3`} style={{ color: tokens.preset.surfaces.panel.color }}>
            Game Feel
          </h4>
          <div className="space-y-3">
            {/* Animation Physics */}
            <div>
              <label className={`text-sm block mb-1`} style={{ color: tokens.preset.surfaces.panel.color }}>
                Spring Stiffness: {config.gameFeel.springStiffness}
              </label>
              <input
                type="range"
                min="100"
                max="500"
                value={config.gameFeel.springStiffness}
                onChange={(e) => setConfigSection('gameFeel', { springStiffness: parseInt(e.target.value) })}
                className="w-full"
              />
            </div>
            <div>
              <label className={`text-sm block mb-1`} style={{ color: tokens.preset.surfaces.panel.color }}>
                Damping Ratio: {config.gameFeel.dampingRatio.toFixed(2)}
              </label>
              <input
                type="range"
                min="0.1"
                max="1.0"
                step="0.1"
                value={config.gameFeel.dampingRatio}
                onChange={(e) => setConfigSection('gameFeel', { dampingRatio: parseFloat(e.target.value) })}
                className="w-full"
              />
            </div>
            <div>
              <label className={`text-sm block mb-1`} style={{ color: tokens.preset.surfaces.panel.color }}>
                Overshoot: {config.gameFeel.overshootAmount}%
              </label>
              <input
                type="range"
                min="0"
                max="50"
                value={config.gameFeel.overshootAmount}
                onChange={(e) => setConfigSection('gameFeel', { overshootAmount: parseInt(e.target.value) })}
                className="w-full"
              />
            </div>
            
            {/* Visual Effects */}
            <div>
              <label className={`text-sm block mb-1`} style={{ color: tokens.preset.surfaces.panel.color }}>
                Glow Intensity: {config.gameFeel.glowIntensity}%
              </label>
              <input
                type="range"
                min="0"
                max="100"
                value={config.gameFeel.glowIntensity}
                onChange={(e) => setConfigSection('gameFeel', { glowIntensity: parseInt(e.target.value) })}
                className="w-full"
              />
            </div>
            <div>
              <label className={`text-sm block mb-1`} style={{ color: tokens.preset.surfaces.panel.color }}>
                Shadow Depth: {config.gameFeel.shadowDepth}px
              </label>
              <input
                type="range"
                min="0"
                max="20"
                value={config.gameFeel.shadowDepth}
                onChange={(e) => setConfigSection('gameFeel', { shadowDepth: parseInt(e.target.value) })}
                className="w-full"
              />
            </div>
            
            {/* Response Timing */}
            <div>
              <label className={`text-sm block mb-1`} style={{ color: tokens.preset.surfaces.panel.color }}>
                Impact Response: {config.gameFeel.impactResponseMs}ms
              </label>
              <input
                type="range"
                min="100"
                max="300"
                step="50"
                value={config.gameFeel.impactResponseMs}
                onChange={(e) => setConfigSection('gameFeel', { impactResponseMs: parseInt(e.target.value) })}
                className="w-full"
              />
            </div>
          </div>
        </div>

        {/* Animation Controls */}
        <div>
          <h4 className={`font-semibold mb-3`} style={{ color: tokens.preset.surfaces.panel.color }}>
            Animation
          </h4>
          <div className="space-y-3">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="animation-enabled"
                checked={config.animation.enabled}
                onChange={(e) => setConfigSection('animation', { enabled: e.target.checked })}
                className="mr-2"
              />
              <label htmlFor="animation-enabled" className={`text-sm`} style={{ color: tokens.preset.surfaces.panel.color }}>
                Enabled
              </label>
            </div>
            <div>
              <label className={`text-sm block mb-1`} style={{ color: tokens.preset.surfaces.panel.color }}>
                Speed: {config.animation.speed}x
              </label>
              <input
                type="range"
                min="0.5"
                max="2.0"
                step="0.1"
                value={config.animation.speed}
                onChange={(e) => setConfigSection('animation', { speed: parseFloat(e.target.value) })}
                className="w-full"
              />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-2">
          <button
            onClick={() => updateDemoConfig(defaultDemoConfig)}
            className="w-full px-3 py-2 rounded text-xs font-medium transition-colors font-cinzel uppercase tracking-wider"
            style={{
              background: 'var(--iron-md, #181c24)',
              border: '1px solid var(--go3, #786000)',
              color: 'var(--t1, #c8b88a)',
            }}
            data-testid="style-lab-reset-button"
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'var(--iron-rim, #242c38)';
              e.currentTarget.style.borderColor = 'var(--go4, #a08020)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'var(--iron-md, #181c24)';
              e.currentTarget.style.borderColor = 'var(--go3, #786000)';
            }}
          >
            Reset
          </button>
          <button
            onClick={() => {
              const dataStr = JSON.stringify(config, null, 2);
              const dataBlob = new Blob([dataStr], { type: 'application/json' });
              const url = URL.createObjectURL(dataBlob);
              const link = document.createElement('a');
              link.href = url;
              link.download = 'style-lab-demo-config.json';
              link.click();
              URL.revokeObjectURL(url);
            }}
            className="w-full px-3 py-2 rounded text-xs font-medium transition-colors font-cinzel uppercase tracking-wider"
            style={{
              background: 'var(--iron-md, #181c24)',
              border: '1px solid var(--go3, #786000)',
              color: 'var(--t1, #c8b88a)',
            }}
            data-testid="style-lab-export-button"
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'var(--iron-rim, #242c38)';
              e.currentTarget.style.borderColor = 'var(--go4, #a08020)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'var(--iron-md, #181c24)';
              e.currentTarget.style.borderColor = 'var(--go3, #786000)';
            }}
          >
            Export Config
          </button>
        </div>
      </div>
    );
  };

  return (
    <DragPhysicsProvider>
      <DemoConfigContext.Provider
        value={{
          config,
          updateConfig: (updates) => updateDemoConfig((prev) => ({ ...prev, ...updates })),
        }}
      >
        <div
          data-testid="style-lab-demo-root"
          data-active-preset={activePreset}
          data-active-pillar={bridgeSnapshot.pillar}
          data-preset-kind={bridgeSnapshot.presetKind}
          data-snapshot-preset-id={bridgeSnapshot.presetId}
          className={`preset-${activePreset} w-full h-screen flex flex-col ${className || ''}`}
          style={{ 
            background: 'var(--abyss, #020304)',
            color: 'var(--t1, #c8b88a)'
          }}
        >
      {/* Component Tabs - Top */}
      <div className="shrink-0 p-4 border-b" style={{
        background: 'var(--iron-gradient)',
        borderColor: 'var(--go3, #786000)',
        boxShadow: 'var(--shadow-inset-medium)'
      }}>
        <div className="flex space-x-2">
          {_availableComponents.map((component) => (
            <button
              key={component}
              onClick={() => setActiveComponent(component)}
              className={`px-4 py-2 rounded-t-lg transition-colors font-cinzel text-xs uppercase tracking-wider ${
                activeComponent === component
                  ? ''
                  : ''
              }`}
              style={{
                background: activeComponent === component 
                  ? 'var(--iron-md, #181c24)' 
                  : 'var(--iron-dk, #0c0e12)',
                color: activeComponent === component
                  ? 'var(--go6, #e0bc50)'
                  : 'var(--t2, #806858)',
                border: `1px solid ${activeComponent === component ? 'var(--go4, #a08020)' : 'var(--iron-rim, #242c38)'}`,
                borderBottom: activeComponent === component ? '1px solid var(--abyss, #020304)' : 'none',
                textShadow: activeComponent === component ? '0 0 8px var(--acc-glow, rgba(200,160,48,.38))' : 'none'
              }}
              onMouseEnter={(e) => {
                if (activeComponent !== component) {
                  e.currentTarget.style.background = 'var(--iron-rim, #242c38)';
                  e.currentTarget.style.borderColor = 'var(--go3, #786000)';
                  e.currentTarget.style.color = 'var(--t1, #c8b88a)';
                }
              }}
              onMouseLeave={(e) => {
                if (activeComponent !== component) {
                  e.currentTarget.style.background = 'var(--iron-dk, #0c0e12)';
                  e.currentTarget.style.borderColor = 'var(--iron-rim, #242c38)';
                  e.currentTarget.style.color = 'var(--t2, #806858)';
                }
              }}
            >
              {COMPONENT_LABEL[component]}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Live Components - Left Side */}
        <motion.div
          className="flex-1 relative overflow-hidden"
          style={{
            width: `${config.layout.splitRatio * 100}%`,
          }}
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
        >
          {renderActiveComponent()}
        </motion.div>

        {/* Controls Panel - Right Side */}
        <motion.div
          className="relative overflow-y-auto"
          style={{
            width: `${(1 - config.layout.splitRatio) * 100}%`,
            minWidth: '200px',
            maxWidth: '400px',
            background: 'rgba(3,4,10,.78)',
            backdropFilter: 'var(--blur-medium)',
            border: '1px solid rgba(100,80,0,.14)',
          }}
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          {/* Toggle Controls Button */}
          <button
            onClick={() => setIsControlsVisible(!isControlsVisible)}
            className="absolute top-4 right-4 z-10 p-2 rounded-full transition-colors"
            style={{ 
              minWidth: '40px', 
              minHeight: '40px',
              background: 'var(--iron-md, #181c24)',
              border: '1px solid var(--go3, #786000)',
              color: 'var(--go6, #e0bc50)',
              fontSize: '16px'
            }}
            aria-label={isControlsVisible ? 'Collapse controls panel' : 'Expand controls panel'}
            data-testid="style-lab-controls-toggle"
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'var(--iron-rim, #242c38)';
              e.currentTarget.style.borderColor = 'var(--go4, #a08020)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'var(--iron-md, #181c24)';
              e.currentTarget.style.borderColor = 'var(--go3, #786000)';
            }}
          >
            {isControlsVisible ? '📊' : '📈'}
          </button>

          {/* Controls Content */}
          <motion.div
            initial={{ opacity: 1, height: 'auto' }}
            animate={{ 
              opacity: isControlsVisible ? 1 : 0,
              height: isControlsVisible ? 'auto' : 0
            }}
            transition={{ duration: 0.3 }}
            style={{ overflow: 'hidden' }}
            data-testid="style-lab-controls-panel"
            data-visible={isControlsVisible}
          >
            {isControlsVisible && renderControls()}
          </motion.div>
        </motion.div>
      </div>
    </div>
      </DemoConfigContext.Provider>
    </DragPhysicsProvider>
  );
}
