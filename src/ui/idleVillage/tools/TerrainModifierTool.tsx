/**
 * Idle Village Terrain Modifier Config Tool
 *
 * Provides grid-based editor with layered preview, modifier CRUD, import/export,
 * and config-first persistence.
 *
 * @module TerrainModifierTool
 * @since 2026-01-13
 */

import React, { useCallback, useMemo, useRef, useState } from 'react';
import { DEFAULT_IDLE_VILLAGE_CONFIG } from '@/balancing/config/idleVillage/defaultConfig';
import type { IdleVillageConfig, MapSlotDefinition } from '@/balancing/config/idleVillage/types';
import useTerrainModifiers from '@/ui/idleVillage/hooks/useTerrainModifiers';
import {
  TERRAIN_IMPACT_TYPES,
  TERRAIN_PATTERN_TYPES,
  type TerrainModifierDefinition,
} from '@/ui/idleVillage/config/terrainModifierConfig';

/**
 * Props for TerrainModifierTool.
 */
export interface TerrainModifierToolProps {
  config?: IdleVillageConfig;
}

/**
 * Simple option list derived from map slots.
 */
function useSlotOptions(mapSlots: Record<string, MapSlotDefinition>) {
  return useMemo(
    () =>
      Object.values(mapSlots).map((slot) => ({
        value: slot.id,
        label: slot.label ?? slot.id,
      })),
    [mapSlots],
  );
}

/**
 * Main tool component.
 */
export const TerrainModifierTool: React.FC<TerrainModifierToolProps> = ({
  config = DEFAULT_IDLE_VILLAGE_CONFIG,
}) => {
  const [selectedModifierId, setSelectedModifierId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const mapSlots = config.mapSlots ?? {};
  const slotOptions = useSlotOptions(mapSlots);

  const {
    modifiers,
    layers,
    previews,
    loading,
    error,
    hasUnsavedChanges,
    addModifier,
    updateModifier,
    removeModifier,
    toggleModifierEnabled,
    duplicateModifier,
    toggleLayerVisibility,
    reorderLayer,
    resetToDefaults,
    saveChanges,
    exportConfig,
    importConfig,
  } = useTerrainModifiers({
    mapSlots,
    mapLayout: config.mapLayout,
  });

  const selectedModifier = modifiers.find((modifier) => modifier.id === selectedModifierId) ?? null;

  const handleSelectModifier = useCallback((modifierId: string) => {
    setSelectedModifierId(modifierId);
  }, []);

  const handleAddModifier = useCallback(() => {
    const created = addModifier();
    setSelectedModifierId(created.id);
  }, [addModifier]);

  const handleDeleteModifier = useCallback(() => {
    if (!selectedModifier) return;
    removeModifier(selectedModifier.id);
    setSelectedModifierId(null);
  }, [selectedModifier, removeModifier]);

  const handleDuplicateModifier = useCallback(() => {
    if (!selectedModifier) return;
    duplicateModifier(selectedModifier.id);
  }, [duplicateModifier, selectedModifier]);

  const handleImportClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleImportFile = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;
      const text = await file.text();
      await importConfig(text);
      setSelectedModifierId(null);
      event.target.value = '';
    },
    [importConfig],
  );

  const handleExport = useCallback(() => {
    const data = exportConfig();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'terrain-modifiers.json';
    anchor.click();
    URL.revokeObjectURL(url);
  }, [exportConfig]);

  const updateSelectedModifier = useCallback(
    (updates: Partial<TerrainModifierDefinition>) => {
      if (!selectedModifier) return;
      updateModifier({ ...selectedModifier, ...updates });
    },
    [selectedModifier, updateModifier],
  );

  const handleSlotToggle = useCallback(
    (slotId: string) => {
      if (!selectedModifier) return;
      const hasSlot = selectedModifier.slotIds.includes(slotId);
      const slotIds = hasSlot
        ? selectedModifier.slotIds.filter((id) => id !== slotId)
        : [...selectedModifier.slotIds, slotId];
      updateSelectedModifier({ slotIds });
    },
    [selectedModifier, updateSelectedModifier],
  );

  return (
    <div className="observatory-page space-y-4">
      <header className="flex items-center justify-between">
        <div>
          <p className="observatory-kicker">Idle Village – Tools</p>
          <h1 className="text-2xl font-semibold text-ivory">Terrain Modifier Configurator</h1>
          <p className="text-slate-300 text-sm">
            Config-first editor for terrain bonuses/maluses with layered preview.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            className="btn-secondary"
            onClick={resetToDefaults}
            disabled={loading}
            aria-label="Reset modifiers to defaults"
          >
            Reset
          </button>
          <button
            type="button"
            className="btn-secondary"
            onClick={handleExport}
            disabled={loading}
            aria-label="Export modifiers as JSON"
          >
            Export
          </button>
          <button
            type="button"
            className="btn-secondary"
            onClick={handleImportClick}
            disabled={loading}
            aria-label="Import modifiers from JSON"
          >
            Import
          </button>
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept="application/json"
            onChange={handleImportFile}
            data-testid="terrain-import-input"
          />
          <button
            type="button"
            className="btn-primary"
            onClick={saveChanges}
            disabled={loading || !hasUnsavedChanges}
            aria-label="Save modifiers"
            data-testid="terrain-save"
          >
            {hasUnsavedChanges ? 'Save Changes' : 'Saved'}
          </button>
        </div>
      </header>

      {error && (
        <div className="rounded border border-red-500/60 bg-red-500/10 px-4 py-2 text-sm text-red-200">
          {error}
        </div>
      )}

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-[350px_1fr]">
        <aside className="default-card flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-ivory">Modifiers ({modifiers.length})</h2>
            <button
              type="button"
              className="btn-ghost text-sm"
              onClick={handleAddModifier}
              disabled={loading}
              aria-label="Add modifier"
            >
              + Add
            </button>
          </div>
          <ul className="space-y-2 max-h-72 overflow-y-auto pr-1" data-testid="modifier-list">
            {modifiers.map((modifier) => (
              <li key={modifier.id}>
                <button
                  type="button"
                  className={`w-full rounded border px-3 py-2 text-left ${
                    modifier.id === selectedModifierId
                      ? 'border-teal-300 bg-teal-300/10'
                      : 'border-slate-600 hover:border-slate-400'
                  } ${modifier.isEnabled ? 'text-ivory' : 'text-slate-500'}`}
                  onClick={() => handleSelectModifier(modifier.id)}
                >
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{modifier.label}</span>
                    <span className="text-xs uppercase tracking-widest text-slate-400">
                      {modifier.effectType}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">
                    {modifier.slotIds.length} slot{modifier.slotIds.length === 1 ? '' : 's'}
                  </p>
                </button>
              </li>
            ))}
          </ul>

          <div className="border-t border-slate-700 pt-3">
            <h3 className="text-sm font-semibold text-ivory">Layers</h3>
            <div className="mt-2 space-y-2" data-testid="layer-panel">
              {layers.map((layer) => (
                <div
                  key={layer.id}
                  className="flex items-center justify-between rounded border border-slate-600 px-2 py-1 text-sm"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="h-3 w-3 rounded-full"
                      style={{ backgroundColor: layer.colorHint }}
                      aria-hidden
                    />
                    <span>{layer.name}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      className="text-xs text-slate-300"
                      onClick={() => toggleLayerVisibility(layer.id)}
                      aria-label={`Toggle ${layer.name} layer`}
                    >
                      {layer.visible ? 'Hide' : 'Show'}
                    </button>
                    <button
                      type="button"
                      className="text-xs text-slate-500"
                      onClick={() => reorderLayer(layer.id, 'up')}
                      aria-label={`Move ${layer.name} up`}
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      className="text-xs text-slate-500"
                      onClick={() => reorderLayer(layer.id, 'down')}
                      aria-label={`Move ${layer.name} down`}
                    >
                      ↓
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </aside>

        <div className="flex flex-col gap-4">
          <div className="default-card">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-ivory">Layered Preview</h2>
              <span className="text-xs uppercase tracking-[0.2em] text-slate-400">
                {previews.length} slots
              </span>
            </div>
            <div
              className="mt-3 relative min-h-[360px] rounded-lg border border-slate-700 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900"
              data-testid="terrain-preview"
            >
              {previews.map((preview) => (
                <div
                  key={preview.slotId}
                  className="absolute flex w-32 flex-col gap-1 rounded border border-slate-700 bg-slate-900/80 p-2 shadow-lg backdrop-blur"
                  style={{
                    left: `${preview.position.leftPercent}%`,
                    top: `${preview.position.topPercent}%`,
                    transform: 'translate(-50%, -50%)',
                  }}
                >
                  <div className="flex items-center justify-between text-xs font-semibold text-ivory">
                    <span>{preview.slotLabel}</span>
                    <span>
                      {Math.round(preview.effects.production * 100)}%
                    </span>
                  </div>
                  <div className="flex gap-1 text-[10px] text-slate-400">
                    {TERRAIN_IMPACT_TYPES.map((type) => (
                      <span key={type}>
                        {type.slice(0, 3).toUpperCase()}:{' '}
                        {Math.round(preview.effects[type] * 100)}%
                      </span>
                    ))}
                  </div>
                  <div className="space-y-1">
                    {preview.layers.map((layer) =>
                      layer.visible ? (
                        <div
                          key={layer.modifierId}
                          className="flex items-center justify-between rounded bg-slate-800 px-2 py-1 text-[10px] text-slate-200"
                        >
                          <span>{layer.label}</span>
                          <span>{layer.layerName}</span>
                        </div>
                      ) : null,
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="default-card">
            <ModifierEditor
              modifier={selectedModifier}
              slotOptions={slotOptions}
              onUpdate={updateSelectedModifier}
              onSlotToggle={handleSlotToggle}
              onDelete={handleDeleteModifier}
              onDuplicate={handleDuplicateModifier}
              onToggleEnabled={() =>
                selectedModifier && toggleModifierEnabled(selectedModifier.id)
              }
            />
          </div>
        </div>
      </section>

      {loading && (
        <div className="text-center text-sm text-slate-300" data-testid="terrain-loading">
          Loading terrain modifiers…
        </div>
      )}
    </div>
  );
};

/**
 * Editor panel for selected modifier.
 */
interface ModifierEditorProps {
  modifier: TerrainModifierDefinition | null;
  slotOptions: { value: string; label: string }[];
  onUpdate: (updates: Partial<TerrainModifierDefinition>) => void;
  onSlotToggle: (slotId: string) => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onToggleEnabled: () => void;
}

const ModifierEditor: React.FC<ModifierEditorProps> = ({
  modifier,
  slotOptions,
  onUpdate,
  onSlotToggle,
  onDelete,
  onDuplicate,
  onToggleEnabled,
}) => {
  if (!modifier) {
    return (
      <div className="text-center text-slate-400" data-testid="modifier-empty">
        Select a modifier to edit its properties.
      </div>
    );
  }

  return (
    <div className="space-y-4" data-testid="modifier-editor">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-ivory">{modifier.label}</h2>
          <p className="text-xs text-slate-400 font-mono">{modifier.id}</p>
        </div>
        <div className="flex gap-2">
          <button type="button" className="btn-ghost text-sm" onClick={onToggleEnabled}>
            {modifier.isEnabled ? 'Disable' : 'Enable'}
          </button>
          <button type="button" className="btn-ghost text-sm" onClick={onDuplicate}>
            Duplicate
          </button>
          <button
            type="button"
            className="btn-danger text-sm"
            onClick={onDelete}
            aria-label="Delete modifier"
          >
            Delete
          </button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <label className="flex flex-col gap-1 text-sm text-slate-300">
          Label
          <input
            type="text"
            value={modifier.label}
            onChange={(event) => onUpdate({ label: event.target.value })}
            className="input"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm text-slate-300">
          Description
          <input
            type="text"
            value={modifier.description ?? ''}
            onChange={(event) => onUpdate({ description: event.target.value })}
            className="input"
          />
        </label>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <label className="flex flex-col gap-1 text-sm text-slate-300">
          Effect Type
          <select
            value={modifier.effectType}
            onChange={(event) =>
              onUpdate({ effectType: event.target.value as TerrainModifierDefinition['effectType'] })
            }
            className="input"
          >
            {TERRAIN_IMPACT_TYPES.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm text-slate-300">
          Magnitude ({Math.round(modifier.magnitude * 100)}%)
          <input
            type="range"
            min={-100}
            max={100}
            step={5}
            value={modifier.magnitude * 100}
            onChange={(event) => onUpdate({ magnitude: Number(event.target.value) / 100 })}
          />
        </label>
        <label className="flex flex-col gap-1 text-sm text-slate-300">
          Icon
          <input
            type="text"
            maxLength={2}
            value={modifier.icon ?? ''}
            onChange={(event) => onUpdate({ icon: event.target.value })}
            className="input"
          />
        </label>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <label className="flex flex-col gap-1 text-sm text-slate-300">
          Color
          <input
            type="text"
            value={modifier.color}
            onChange={(event) => onUpdate({ color: event.target.value })}
            className="input font-mono"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm text-slate-300">
          Intensity ({Math.round(modifier.intensity * 100)}%)
          <input
            type="range"
            min={0}
            max={100}
            step={5}
            value={modifier.intensity * 100}
            onChange={(event) => onUpdate({ intensity: Number(event.target.value) / 100 })}
          />
        </label>
        <label className="flex flex-col gap-1 text-sm text-slate-300">
          Pattern
          <select
            value={modifier.pattern ?? ''}
            onChange={(event) =>
              onUpdate({
                pattern: event.target.value
                  ? (event.target.value as TerrainModifierDefinition['pattern'])
                  : undefined,
              })
            }
            className="input"
          >
            <option value="">solid</option>
            {TERRAIN_PATTERN_TYPES.map((pattern) => (
              <option key={pattern} value={pattern}>
                {pattern}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div>
        <p className="mb-2 text-sm font-semibold text-ivory">Target Slots</p>
        <div className="grid max-h-40 grid-cols-2 gap-2 overflow-y-auto pr-1 text-sm">
          {slotOptions.map((option) => {
            const isSelected = modifier.slotIds.includes(option.value);
            return (
              <label
                key={option.value}
                className={`flex items-center gap-2 rounded border px-2 py-1 ${
                  isSelected ? 'border-teal-400 bg-teal-400/10' : 'border-slate-600'
                }`}
              >
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => onSlotToggle(option.value)}
                />
                <span>{option.label}</span>
              </label>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default TerrainModifierTool;
