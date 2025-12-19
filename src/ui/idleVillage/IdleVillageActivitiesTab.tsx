/**
 * Stub Activities section UI for Idle Village config.
 * Mirrors Buildings tab style, but edits ActivityDefinition entries
 * (tags, slotTags, resolutionEngineId, level, dangerRating).
 */

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useIdleVillageConfig } from '@/balancing/hooks/useIdleVillageConfig';
import type { ActivityDefinition, MapLayoutDefinition, MapSlotDefinition } from '@/balancing/config/idleVillage/types';
import idleVillageMap from '@/assets/ui/idleVillage/idle-village-map.jpg';
import { computeSlotPercentPosition, relativeCoordsToPixels, resolveMapLayout } from '@/ui/idleVillage/mapLayoutUtils';

type ActivityFormState = Partial<ActivityDefinition>;
const MIN_MAP_DIMENSION = 200;
const MAX_MAP_DIMENSION = 4096;
const SLOT_OVERLAP_THRESHOLD_PX = 48;

const mapSlotIconLibrary = [
  '🂠', '⚔️', '🛡️', '✨', '🔥', '❄️', '🌊', '🌿', '💀', '🐉', '🦊', '🪽', '🧠', '⚙️', '🜂', '🜄', '🜃', '🜁', '🜚', '🔮',
  '🪄', '🎲', '🏹', '⚒️', '⚗️', '📜', '🏰', '🪙', '💎', '🌀', '🌙', '⭐', '🪬', '🩸', '🦂', '🐺', '👁️', '🪐', '⚡', '🌑',
];

export default function IdleVillageActivitiesTab() {
  const { config, updateConfig } = useIdleVillageConfig();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<ActivityFormState>({});

  const [selectedMapSlotId, setSelectedMapSlotId] = useState<string | null>(null);
  const [slotPositionDraft, setSlotPositionDraft] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [showMapSlotIconPicker, setShowMapSlotIconPicker] = useState(false);
  const mapContainerRef = useRef<HTMLDivElement | null>(null);

  const activities = Object.values(config.activities ?? {});
  const resources = Object.values(config.resources ?? {});
  const mapSlots = Object.values(config.mapSlots ?? {});
  const mapLayout = resolveMapLayout(config.mapLayout);
  const [layoutDraft, setLayoutDraft] = useState<MapLayoutDefinition>(mapLayout);

  useEffect(() => {
    if (!selectedMapSlotId && mapSlots.length > 0) {
      setSelectedMapSlotId(mapSlots[0].id);
    }
  }, [mapSlots, selectedMapSlotId]);

  useEffect(() => {
    setLayoutDraft(mapLayout);
  }, [mapLayout.pixelWidth, mapLayout.pixelHeight]);

  useEffect(() => {
    if (selectedMapSlot) {
      setSlotPositionDraft({ x: Math.round(selectedMapSlot.x), y: Math.round(selectedMapSlot.y) });
    }
  }, [selectedMapSlot]);

  const clampDimension = (value: number) => {
    if (!Number.isFinite(value)) return MIN_MAP_DIMENSION;
    return Math.max(MIN_MAP_DIMENSION, Math.min(MAX_MAP_DIMENSION, Math.round(value)));
  };

  const clampCoordinate = (value: number, max: number) => {
    if (!Number.isFinite(value)) return 0;
    return Math.max(0, Math.min(max, Math.round(value)));
  };

  const slotDiagnostics = useMemo(() => {
    const diagnostics: Record<
      string,
      { outOfBounds: boolean; overlaps: string[] }
    > = {};
    mapSlots.forEach((slot) => {
      const outOfBounds =
        slot.x < 0 ||
        slot.y < 0 ||
        slot.x > mapLayout.pixelWidth ||
        slot.y > mapLayout.pixelHeight;
      diagnostics[slot.id] = {
        outOfBounds,
        overlaps: [],
      };
    });
    for (let i = 0; i < mapSlots.length; i += 1) {
      for (let j = i + 1; j < mapSlots.length; j += 1) {
        const slotA = mapSlots[i];
        const slotB = mapSlots[j];
        const dx = slotA.x - slotB.x;
        const dy = slotA.y - slotB.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < SLOT_OVERLAP_THRESHOLD_PX) {
          diagnostics[slotA.id]?.overlaps.push(slotB.id);
          diagnostics[slotB.id]?.overlaps.push(slotA.id);
        }
      }
    }
    return diagnostics;
  }, [mapSlots, mapLayout.pixelWidth, mapLayout.pixelHeight]);

  const mapSlotLayout = useMemo(() => {
    if (mapSlots.length === 0) {
      return [] as { slot: (typeof mapSlots)[number]; left: number; top: number }[];
    }
    return mapSlots.map((slot) => {
      const { leftPercent, topPercent } = computeSlotPercentPosition(slot, mapLayout);
      return { slot, left: leftPercent, top: topPercent };
    });
  }, [mapSlots, mapLayout]);

  const selectedMapSlot: MapSlotDefinition | null = useMemo(() => {
    if (mapSlots.length === 0) return null;
    if (!selectedMapSlotId) return (mapSlots[0] as MapSlotDefinition) ?? null;
    return (mapSlots.find((s) => s.id === selectedMapSlotId) as MapSlotDefinition | undefined) ?? null;
  }, [mapSlots, selectedMapSlotId]);

  const handleUpdateMapLayout = (updates: Partial<MapLayoutDefinition>) => {
    const nextLayout: MapLayoutDefinition = {
      pixelWidth: clampDimension(updates.pixelWidth ?? layoutDraft.pixelWidth ?? mapLayout.pixelWidth),
      pixelHeight: clampDimension(updates.pixelHeight ?? layoutDraft.pixelHeight ?? mapLayout.pixelHeight),
    };
    setLayoutDraft(nextLayout);
    updateConfig({
      mapLayout: nextLayout,
    });
  };

  const handleUpdateMapSlot = (id: string, updates: Partial<MapSlotDefinition>) => {
    const existing = (config.mapSlots ?? {})[id];
    if (!existing) return;

    updateConfig({
      mapSlots: {
        ...config.mapSlots,
        [id]: { ...existing, ...updates },
      },
    });
  };

  const compatibleActivities = useMemo(() => {
    if (!selectedMapSlot) return [];
    return activities
      .map((activity) => {
        const meta = (activity.metadata ?? {}) as { mapSlotId?: string } | undefined;
        const directMatch = meta?.mapSlotId === selectedMapSlot.id;
        const tagOverlap =
          activity.slotTags?.some((tag) => selectedMapSlot.slotTags?.includes(tag)) ?? false;
        if (!directMatch && !tagOverlap) return null;
        return {
          id: activity.id,
          label: activity.label ?? activity.id,
          reason: directMatch ? 'Assigned via mapSlotId' : 'Matches slotTags',
        };
      })
      .filter(Boolean) as { id: string; label: string; reason: string }[];
  }, [activities, selectedMapSlot]);

  const handleMapBackgroundClick: React.MouseEventHandler<HTMLDivElement> = (event) => {
    if (!selectedMapSlot) return;
    if (!mapContainerRef.current) return;

    const rect = mapContainerRef.current.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;

    const relX = (event.clientX - rect.left) / rect.width;
    const relY = (event.clientY - rect.top) / rect.height;
    if (!Number.isFinite(relX) || !Number.isFinite(relY)) return;

    const { x, y } = relativeCoordsToPixels(relX, relY, mapLayout);
    handleUpdateMapSlot(selectedMapSlot.id, { x, y });
  };

  const handleCreate = () => {
    const newId = `activity_${Date.now()}`;
    const newActivity: ActivityDefinition = {
      id: newId,
      label: 'New Activity',
      tags: [],
      slotTags: [],
      resolutionEngineId: 'job',
    };

    updateConfig({
      activities: {
        ...config.activities,
        [newId]: newActivity,
      },
    });
  };

  const handleUpdate = (id: string, updates: ActivityFormState) => {
    const existing = config.activities[id];
    if (!existing) return;

    updateConfig({
      activities: {
        ...config.activities,
        [id]: { ...existing, ...updates },
      },
    });
  };

  const handleDelete = (id: string) => {
    const nextActivities = { ...config.activities };
    delete nextActivities[id];
    updateConfig({ activities: nextActivities });
  };

  return (
    <div className="space-y-4">
      <h2 className="text-lg sm:text-xl font-cinzel tracking-[0.18em] uppercase text-ivory/90">Activities Configuration</h2>
      <button
        onClick={handleCreate}
        className="mb-4 bg-gold text-obsidian px-4 py-2 rounded font-bold hover:bg-gold/80"
      >
        + New Activity
      </button>
      <div className="default-card p-4 flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <div className="text-[11px] font-semibold tracking-[0.2em] uppercase text-slate-100">Map Layout</div>
            <p className="text-[10px] text-slate-300">Questi valori definiscono la texture base della mappa e normalizzano tutte le coordinate dei VerbCard.</p>
          </div>
          <div className="text-[10px] text-slate-400">
            Range consentito: {MIN_MAP_DIMENSION}px – {MAX_MAP_DIMENSION}px
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <label className="flex flex-col gap-1 text-[10px] uppercase tracking-[0.28em] text-slate-300">
            Larghezza (px)
            <input
              type="number"
              min={MIN_MAP_DIMENSION}
              max={MAX_MAP_DIMENSION}
              value={layoutDraft.pixelWidth}
              onChange={(e) => {
                const value = clampDimension(Number(e.target.value));
                setLayoutDraft((prev) => ({ ...prev, pixelWidth: value }));
              }}
              onBlur={() => handleUpdateMapLayout({ pixelWidth: layoutDraft.pixelWidth })}
              className="rounded border border-slate-700 bg-slate-900/60 px-2 py-1 text-ivory text-sm focus:outline-none focus:border-gold"
            />
          </label>
          <label className="flex flex-col gap-1 text-[10px] uppercase tracking-[0.28em] text-slate-300">
            Altezza (px)
            <input
              type="number"
              min={MIN_MAP_DIMENSION}
              max={MAX_MAP_DIMENSION}
              value={layoutDraft.pixelHeight}
              onChange={(e) => {
                const value = clampDimension(Number(e.target.value));
                setLayoutDraft((prev) => ({ ...prev, pixelHeight: value }));
              }}
              onBlur={() => handleUpdateMapLayout({ pixelHeight: layoutDraft.pixelHeight })}
              className="rounded border border-slate-700 bg-slate-900/60 px-2 py-1 text-ivory text-sm focus:outline-none focus:border-gold"
            />
          </label>
        </div>
      </div>
      {mapSlots.length > 0 && (
        <div className="default-card flex flex-col gap-3 p-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <div className="text-[11px] font-semibold tracking-[0.18em] uppercase text-slate-100">
                Map Slots Layout
              </div>
              <p className="text-[10px] text-slate-300 mt-0.5">
                Click on the map to move the selected marker. Use the icon picker to change its glyph.
              </p>
            </div>
            {selectedMapSlot && (
              <div className="text-[10px] text-slate-300 text-right">
                <div className="truncate">
                  Selected: <span className="font-semibold text-ivory">{selectedMapSlot.label}</span>
                </div>
              </div>
            )}
          </div>

          <div
            ref={mapContainerRef}
            onClick={handleMapBackgroundClick}
            className="relative w-full rounded-lg overflow-hidden border border-slate-700 bg-black/60 aspect-video cursor-crosshair"
          >
            <div
              className="absolute inset-0"
              style={{
                backgroundImage: `url(${idleVillageMap})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
              }}
            />
            <div className="absolute inset-0 bg-black/45" aria-hidden="true" />
            <div className="absolute inset-0">
              {mapSlotLayout.map(({ slot, left, top }) => {
                const isSelected = selectedMapSlot?.id === slot.id;
                const isVillage = slot.slotTags?.includes('village');
                const isWorld = slot.slotTags?.includes('world');
                const diag = slotDiagnostics[slot.id];

                return (
                  <button
                    key={slot.id}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedMapSlotId(slot.id);
                    }}
                    className={`group absolute -translate-x-1/2 -translate-y-full flex flex-col items-center gap-0.5 focus:outline-none ${
                      isSelected
                        ? 'scale-105 drop-shadow-[0_0_10px_rgba(250,250,210,0.9)]'
                        : 'opacity-90 hover:opacity-100'
                    }`}
                    style={{ left: `${left}%`, top: `${top}%` }}
                  >
                    <div
                      className={`relative w-7 h-7 rounded-sm border shadow-md flex items-center justify-center text-[12px] bg-black/80 ${
                        diag?.outOfBounds
                          ? 'border-red-400'
                          : diag && diag.overlaps.length > 0
                            ? 'border-amber-300'
                            : isVillage
                              ? 'border-emerald-200'
                              : isWorld
                                ? 'border-indigo-200'
                                : 'border-slate-200'
                      }`}
                    >
                      <span aria-hidden className="text-base">
                        {slot.icon || slot.label.slice(0, 2).toUpperCase()}
                      </span>
                      {(diag?.outOfBounds || (diag?.overlaps?.length ?? 0) > 0) && (
                        <span
                          className={`absolute -top-2 -right-2 w-4 h-4 rounded-full text-[10px] font-semibold flex items-center justify-center ${
                            diag?.outOfBounds ? 'bg-red-500 text-white' : 'bg-amber-400 text-obsidian'
                          }`}
                        >
                          !
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {selectedMapSlot && (
            <div className="flex flex-col gap-3 border-t border-slate-700/60 pt-3">
              {(() => {
                const diag = slotDiagnostics[selectedMapSlot.id];
                if (!diag) return null;
                if (!diag.outOfBounds && diag.overlaps.length === 0) return null;
                return (
                  <div className="rounded border border-red-400/70 bg-red-500/10 px-3 py-2 text-[10px] text-red-200 flex flex-col gap-1">
                    {diag.outOfBounds && (
                      <div>
                        ⚠ Coordinate fuori dal layout ({selectedMapSlot.x}px, {selectedMapSlot.y}px). Il marker verrà
                        tagliato: portalo entro {layoutDraft.pixelWidth}×{layoutDraft.pixelHeight}px.
                      </div>
                    )}
                    {diag.overlaps.length > 0 && (
                      <div>
                        ⚠ Vicino ad altri slot:{' '}
                        {diag.overlaps
                          .map((id) => mapSlots.find((slot) => slot.id === id)?.label ?? id)
                          .join(', ')}{' '}
                        ({SLOT_OVERLAP_THRESHOLD_PX}px threshold).
                      </div>
                    )}
                  </div>
                );
              })()}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-[11px] text-slate-200">
                <label className="flex flex-col gap-1 uppercase tracking-[0.18em] text-slate-400">
                  Posizione X (px)
                  <input
                    type="number"
                    min={0}
                    max={layoutDraft.pixelWidth}
                    value={slotPositionDraft.x}
                    onChange={(e) => {
                      const value = clampCoordinate(Number(e.target.value), layoutDraft.pixelWidth);
                      setSlotPositionDraft((prev) => ({ ...prev, x: value }));
                    }}
                    onBlur={() =>
                      handleUpdateMapSlot(selectedMapSlot.id, {
                        x: clampCoordinate(slotPositionDraft.x, layoutDraft.pixelWidth),
                      })
                    }
                    className="rounded border border-slate-700 bg-slate-900/60 px-2 py-1 text-ivory text-sm focus:outline-none focus:border-gold"
                  />
                </label>
                <label className="flex flex-col gap-1 uppercase tracking-[0.18em] text-slate-400">
                  Posizione Y (px)
                  <input
                    type="number"
                    min={0}
                    max={layoutDraft.pixelHeight}
                    value={slotPositionDraft.y}
                    onChange={(e) => {
                      const value = clampCoordinate(Number(e.target.value), layoutDraft.pixelHeight);
                      setSlotPositionDraft((prev) => ({ ...prev, y: value }));
                    }}
                    onBlur={() =>
                      handleUpdateMapSlot(selectedMapSlot.id, {
                        y: clampCoordinate(slotPositionDraft.y, layoutDraft.pixelHeight),
                      })
                    }
                    className="rounded border border-slate-700 bg-slate-900/60 px-2 py-1 text-ivory text-sm focus:outline-none focus:border-gold"
                  />
                </label>
                <label className="flex flex-col gap-1 uppercase tracking-[0.18em] text-slate-400">
                  Sbloccato all&apos;inizio
                  <button
                    type="button"
                    onClick={() =>
                      handleUpdateMapSlot(selectedMapSlot.id, {
                        isInitiallyUnlocked: !selectedMapSlot.isInitiallyUnlocked,
                      })
                    }
                    className={`rounded border px-2 py-1 text-sm ${
                      selectedMapSlot.isInitiallyUnlocked
                        ? 'border-emerald-400 text-emerald-200 bg-emerald-500/10'
                        : 'border-slate-600 text-slate-300 bg-slate-900/60'
                    }`}
                  >
                    {selectedMapSlot.isInitiallyUnlocked ? 'Sì' : 'No'}
                  </button>
                </label>
              </div>
              <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-200">
                <div className="flex items-center gap-2">
                  <span className="uppercase tracking-[0.18em] text-slate-400">Icon</span>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setShowMapSlotIconPicker((prev) => !prev)}
                      className="flex items-center justify-center rounded border border-slate-600 px-2 py-1 bg-slate-950/90 hover:bg-slate-900 text-slate-100 text-sm"
                      title="Scegli icona"
                    >
                      <span className="text-lg" aria-hidden>{selectedMapSlot.icon || '⚑'}</span>
                    </button>
                    {showMapSlotIconPicker && (
                      <div className="absolute z-20 mt-2 w-56 rounded-lg border border-slate-600 bg-slate-950/95 p-3 shadow-[0_20px_45px_rgba(0,0,0,0.65)]">
                        <p className="text-[10px] uppercase tracking-[0.3em] text-slate-300 mb-1">Seleziona icona</p>
                        <div className="grid grid-cols-6 gap-1 max-h-40 overflow-y-auto">
                          <button
                            type="button"
                            onClick={() => {
                              handleUpdateMapSlot(selectedMapSlot.id, { icon: undefined });
                              setShowMapSlotIconPicker(false);
                            }}
                            className={`h-8 w-8 flex items-center justify-center rounded border text-xs ${
                              !selectedMapSlot.icon
                                ? 'border-amber-400 bg-amber-500/20 text-amber-100'
                                : 'border-slate-600 bg-slate-900 text-slate-300 hover:border-amber-400/60'
                            }`}
                          >
                            ∅
                          </button>
                          {mapSlotIconLibrary.map((symbol) => (
                            <button
                              key={symbol}
                              type="button"
                              onClick={() => {
                                handleUpdateMapSlot(selectedMapSlot.id, { icon: symbol });
                                setShowMapSlotIconPicker(false);
                              }}
                              className={`h-8 w-8 flex items-center justify-center rounded border text-base ${
                                selectedMapSlot.icon === symbol
                                  ? 'border-amber-400 bg-amber-500/20 text-amber-100'
                                  : 'border-slate-600 bg-slate-900 text-slate-100 hover:border-amber-400/60'
                              }`}
                            >
                              {symbol}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-1 text-[10px] text-slate-400">
                  <span className="uppercase tracking-[0.2em] text-slate-500">Slot tags:</span>
                  {selectedMapSlot.slotTags?.length ? (
                    selectedMapSlot.slotTags.map((tag) => (
                      <span key={tag} className="px-2 py-0.5 rounded-full border border-slate-600 text-[10px] text-slate-200">
                        {tag}
                      </span>
                    ))
                  ) : (
                    <span className="text-slate-500">none</span>
                  )}
                </div>
              </div>
              <div className="rounded-lg border border-slate-700 bg-slate-900/50 p-3 text-[11px] text-slate-200">
                <div className="flex items-center justify-between mb-2">
                  <div className="uppercase tracking-[0.2em] text-slate-400">Attività compatibili</div>
                  <div className="text-[10px] text-slate-400">
                    {compatibleActivities.length} match
                  </div>
                </div>
                {compatibleActivities.length === 0 ? (
                  <div className="text-[10px] text-slate-500">
                    Nessuna activity punta a questo slot (aggiungi `metadata.mapSlotId` o slotTags compatibili).
                  </div>
                ) : (
                  <ul className="space-y-1 max-h-32 overflow-y-auto pr-1">
                    {compatibleActivities.map((entry) => (
                      <li key={entry.id} className="flex flex-col border-b border-slate-800/60 pb-1 last:border-b-0">
                        <div className="text-ivory">{entry.label}</div>
                        <div className="text-[10px] text-slate-400">{entry.reason}</div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}
        </div>
      )}
      <div className="space-y-2">
        {activities.map((activity) => (
          <div key={activity.id} className="default-card flex flex-col gap-2">
            <div className="flex justify-between items-start border-b border-slate-700/60 pb-1.5">
              <div className="flex-1 min-w-0">
                <div className="text-[11px] font-semibold tracking-[0.18em] uppercase text-slate-100 truncate">
                  {activity.label}
                </div>
                <div className="text-[10px] text-teal mt-0.5">ID: {activity.id}</div>
                <div className="text-[10px] text-teal">Tags: {activity.tags.join(', ') || 'none'}</div>
                <div className="text-[10px] text-teal">Slot Tags: {activity.slotTags.join(', ') || 'none'}</div>
                <div className="text-[10px] text-teal">Engine: {activity.resolutionEngineId}</div>
                {typeof activity.level === 'number' && (
                  <div className="text-[10px] text-teal">Level: {activity.level}</div>
                )}
                {typeof activity.dangerRating === 'number' && (
                  <div className="text-[10px] text-red-400">Danger: {activity.dangerRating}</div>
                )}
              </div>
              <div className="flex gap-1">
                <button
                  onClick={() => {
                    setEditingId(activity.id);
                    setFormData(activity);
                  }}
                  className="bg-teal text-obsidian px-2 py-1 rounded-full text-[10px] font-semibold tracking-[0.16em] uppercase hover:bg-teal/80"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(activity.id)}
                  className="bg-red-600 text-ivory px-2 py-1 rounded-full text-[10px] font-semibold tracking-[0.16em] uppercase hover:bg-red-700"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Simple Edit Modal */}
      {editingId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="default-card w-96 max-h-screen overflow-y-auto p-6">
            <h3 className="text-lg font-cinzel mb-4">Edit Activity</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-bold mb-1">Label</label>
                <input
                  type="text"
                  value={formData.label || ''}
                  onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                  className="w-full px-2 py-1 bg-obsidian border border-slate rounded text-ivory"
                />
              </div>
              <div>
                <label className="block text-sm font-bold mb-1">Resolution Engine ID</label>
                <input
                  type="text"
                  value={formData.resolutionEngineId || ''}
                  onChange={(e) => setFormData({ ...formData, resolutionEngineId: e.target.value })}
                  className="w-full px-2 py-1 bg-obsidian border border-slate rounded text-ivory"
                />
              </div>
              <div>
                <label className="block text-sm font-bold mb-1">Tags (comma-separated)</label>
                <input
                  type="text"
                  value={formData.tags?.join(', ') || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      tags: e.target.value.split(',').map((s) => s.trim()).filter(Boolean),
                    })
                  }
                  className="w-full px-2 py-1 bg-obsidian border border-slate rounded text-ivory"
                />
              </div>
              <div>
                <label className="block text-sm font-bold mb-1">Slot Tags (comma-separated)</label>
                <input
                  type="text"
                  value={formData.slotTags?.join(', ') || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      slotTags: e.target.value.split(',').map((s) => s.trim()).filter(Boolean),
                    })
                  }
                  className="w-full px-2 py-1 bg-obsidian border border-slate rounded text-ivory"
                />
              </div>
              <div>
                <label className="block text-sm font-bold mb-1">Level (optional)</label>
                <input
                  type="number"
                  value={formData.level ?? ''}
                  onChange={(e) => {
                    const value = e.target.value;
                    setFormData({
                      ...formData,
                      level: value === '' ? undefined : Number(value),
                    });
                  }}
                  className="w-full px-2 py-1 bg-obsidian border border-slate rounded text-ivory"
                />
              </div>
              <div>
                <label className="block text-sm font-bold mb-1">Danger Rating (0+)</label>
                <input
                  type="number"
                  min={0}
                  value={formData.dangerRating ?? ''}
                  onChange={(e) => {
                    const value = e.target.value;
                    setFormData({
                      ...formData,
                      dangerRating: value === '' ? undefined : Number(value),
                    });
                  }}
                  className="w-full px-2 py-1 bg-obsidian border border-slate rounded text-ivory"
                />
              </div>
              {(() => {
                const currentMeta = (formData.metadata ?? {}) as {
                  injuryChanceDisplay?: number;
                  deathChanceDisplay?: number;
                };

                const handleMetaNumberChange = (
                  key: 'injuryChanceDisplay' | 'deathChanceDisplay',
                  minValue: number,
                ) =>
                  (raw: string) => {
                    const baseMeta = (formData.metadata ?? {}) as Record<string, unknown>;
                    const nextMeta = { ...baseMeta } as {
                      injuryChanceDisplay?: number;
                      deathChanceDisplay?: number;
                    } & Record<string, unknown>;

                    if (raw === '') {
                      delete nextMeta[key];
                    } else {
                      const parsed = Number(raw);
                      if (Number.isFinite(parsed) && parsed >= minValue) {
                        nextMeta[key] = parsed;
                      }
                    }

                    const finalMeta = Object.keys(nextMeta).length > 0 ? nextMeta : undefined;
                    setFormData({
                      ...formData,
                      metadata: finalMeta,
                    });
                  };

                return (
                  <div className="grid grid-cols-2 gap-2 text-[11px] mt-1">
                    <div>
                      <label className="block font-semibold mb-0.5">
                        Injury Chance % (UI)
                      </label>
                      <input
                        type="number"
                        min={0}
                        max={100}
                        value={
                          typeof currentMeta.injuryChanceDisplay === 'number'
                            ? currentMeta.injuryChanceDisplay
                            : ''
                        }
                        onChange={(e) => handleMetaNumberChange('injuryChanceDisplay', 0)(e.target.value)}
                        className="w-full px-2 py-1 bg-obsidian border border-slate rounded text-ivory"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold mb-0.5">
                        Death Chance % (UI)
                      </label>
                      <input
                        type="number"
                        min={0}
                        max={100}
                        value={
                          typeof currentMeta.deathChanceDisplay === 'number'
                            ? currentMeta.deathChanceDisplay
                            : ''
                        }
                        onChange={(e) => handleMetaNumberChange('deathChanceDisplay', 0)(e.target.value)}
                        className="w-full px-2 py-1 bg-obsidian border border-slate rounded text-ivory"
                      />
                    </div>
                  </div>
                );
              })()}
              {Array.isArray(formData.tags) && formData.tags.includes('quest') && (
                <div className="mt-2 pt-2 border-t border-slate-700/70 space-y-2">
                  {(() => {
                    const currentMeta = (formData.metadata ?? {}) as {
                      questSpawnEnabled?: boolean;
                      questSpawnWeight?: number;
                      questMinDay?: number;
                      questMaxDay?: number;
                      questMaxConcurrent?: number;
                      questAllowedSlotTags?: string[];
                    };

                    const rawSlotTags = Array.isArray(currentMeta.questAllowedSlotTags)
                      ? currentMeta.questAllowedSlotTags
                      : [];
                    const slotTagsValue = rawSlotTags.join(', ');

                    return (
                      <>
                        <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-300">
                          Quest Spawning
                        </div>
                        <label className="flex items-center gap-2 text-[11px] text-slate-200">
                          <input
                            type="checkbox"
                            checked={currentMeta.questSpawnEnabled === true}
                            onChange={(e) => {
                              const baseMeta = (formData.metadata ?? {}) as Record<string, unknown>;
                              const nextMeta = { ...baseMeta } as {
                                questSpawnEnabled?: boolean;
                              } & Record<string, unknown>;
                              if (e.target.checked) {
                                nextMeta.questSpawnEnabled = true;
                              } else {
                                delete nextMeta.questSpawnEnabled;
                              }
                              const finalMeta = Object.keys(nextMeta).length > 0 ? nextMeta : undefined;
                              setFormData({
                                ...formData,
                                metadata: finalMeta,
                              });
                            }}
                          />
                          <span>Enable quest spawning for this activity</span>
                        </label>
                        <div className="grid grid-cols-2 gap-2 text-[11px]">
                          <div>
                            <label className="block font-semibold mb-0.5">Spawn Weight</label>
                            <input
                              type="number"
                              min={1}
                              value={
                                typeof currentMeta.questSpawnWeight === 'number'
                                  ? currentMeta.questSpawnWeight
                                  : ''
                              }
                              onChange={(e) => {
                                const value = e.target.value;
                                const baseMeta = (formData.metadata ?? {}) as Record<string, unknown>;
                                const nextMeta = { ...baseMeta } as {
                                  questSpawnWeight?: number;
                                } & Record<string, unknown>;
                                if (value === '') {
                                  delete nextMeta.questSpawnWeight;
                                } else {
                                  const parsed = Number(value);
                                  if (Number.isFinite(parsed) && parsed > 0) {
                                    nextMeta.questSpawnWeight = parsed;
                                  }
                                }
                                const finalMeta = Object.keys(nextMeta).length > 0 ? nextMeta : undefined;
                                setFormData({
                                  ...formData,
                                  metadata: finalMeta,
                                });
                              }}
                              className="w-full px-2 py-1 bg-obsidian border border-slate rounded text-ivory"
                            />
                          </div>
                          <div>
                            <label className="block font-semibold mb-0.5">Max Concurrent Offers</label>
                            <input
                              type="number"
                              min={0}
                              value={
                                typeof currentMeta.questMaxConcurrent === 'number'
                                  ? currentMeta.questMaxConcurrent
                                  : ''
                              }
                              onChange={(e) => {
                                const value = e.target.value;
                                const baseMeta = (formData.metadata ?? {}) as Record<string, unknown>;
                                const nextMeta = { ...baseMeta } as {
                                  questMaxConcurrent?: number;
                                } & Record<string, unknown>;
                                if (value === '') {
                                  delete nextMeta.questMaxConcurrent;
                                } else {
                                  const parsed = Number(value);
                                  if (Number.isFinite(parsed) && parsed >= 0) {
                                    nextMeta.questMaxConcurrent = parsed;
                                  }
                                }
                                const finalMeta = Object.keys(nextMeta).length > 0 ? nextMeta : undefined;
                                setFormData({
                                  ...formData,
                                  metadata: finalMeta,
                                });
                              }}
                              className="w-full px-2 py-1 bg-obsidian border border-slate rounded text-ivory"
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-[11px]">
                          <div>
                            <label className="block font-semibold mb-0.5">Min Day</label>
                            <input
                              type="number"
                              min={1}
                              value={
                                typeof currentMeta.questMinDay === 'number'
                                  ? currentMeta.questMinDay
                                  : ''
                              }
                              onChange={(e) => {
                                const value = e.target.value;
                                const baseMeta = (formData.metadata ?? {}) as Record<string, unknown>;
                                const nextMeta = { ...baseMeta } as {
                                  questMinDay?: number;
                                } & Record<string, unknown>;
                                if (value === '') {
                                  delete nextMeta.questMinDay;
                                } else {
                                  const parsed = Number(value);
                                  if (Number.isFinite(parsed) && parsed >= 1) {
                                    nextMeta.questMinDay = parsed;
                                  }
                                }
                                const finalMeta = Object.keys(nextMeta).length > 0 ? nextMeta : undefined;
                                setFormData({
                                  ...formData,
                                  metadata: finalMeta,
                                });
                              }}
                              className="w-full px-2 py-1 bg-obsidian border border-slate rounded text-ivory"
                            />
                          </div>
                          <div>
                            <label className="block font-semibold mb-0.5">Max Day</label>
                            <input
                              type="number"
                              min={1}
                              value={
                                typeof currentMeta.questMaxDay === 'number'
                                  ? currentMeta.questMaxDay
                                  : ''
                              }
                              onChange={(e) => {
                                const value = e.target.value;
                                const baseMeta = (formData.metadata ?? {}) as Record<string, unknown>;
                                const nextMeta = { ...baseMeta } as {
                                  questMaxDay?: number;
                                } & Record<string, unknown>;
                                if (value === '') {
                                  delete nextMeta.questMaxDay;
                                } else {
                                  const parsed = Number(value);
                                  if (Number.isFinite(parsed) && parsed >= 1) {
                                    nextMeta.questMaxDay = parsed;
                                  }
                                }
                                const finalMeta = Object.keys(nextMeta).length > 0 ? nextMeta : undefined;
                                setFormData({
                                  ...formData,
                                  metadata: finalMeta,
                                });
                              }}
                              className="w-full px-2 py-1 bg-obsidian border border-slate rounded text-ivory"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block font-semibold mb-0.5 text-[11px]">Allowed Slot Tags Override</label>
                          <input
                            type="text"
                            placeholder="comma-separated (optional)"
                            value={slotTagsValue}
                            onChange={(e) => {
                              const raw = e.target.value;
                              const baseMeta = (formData.metadata ?? {}) as Record<string, unknown>;
                              const nextMeta = { ...baseMeta } as {
                                questAllowedSlotTags?: string[];
                              } & Record<string, unknown>;
                              const parts = raw
                                .split(',')
                                .map((s) => s.trim())
                                .filter((s) => s.length > 0);
                              if (parts.length === 0) {
                                delete nextMeta.questAllowedSlotTags;
                              } else {
                                nextMeta.questAllowedSlotTags = parts;
                              }
                              const finalMeta = Object.keys(nextMeta).length > 0 ? nextMeta : undefined;
                              setFormData({
                                ...formData,
                                metadata: finalMeta,
                              });
                            }}
                            className="w-full px-2 py-1 bg-obsidian border border-slate rounded text-ivory text-[11px]"
                          />
                          <p className="mt-0.5 text-[10px] text-slate-400">
                            If empty, the activity's own slot tags are used.
                          </p>
                        </div>
                      </>
                    );
                  })()}
                </div>
              )}
              <div>
                <label className="block text-sm font-bold mb-1">Verb Tone (UI, optional)</label>
                {(() => {
                  const currentMeta = (formData.metadata ?? {}) as { verbToneId?: string } | undefined;
                  const currentTone = currentMeta?.verbToneId ?? '';
                  return (
                    <select
                      className="w-full px-2 py-1 bg-obsidian border border-slate rounded text-ivory text-xs"
                      value={currentTone}
                      onChange={(e) => {
                        const value = e.target.value;
                        const baseMeta = (formData.metadata ?? {}) as Record<string, unknown>;
                        const nextMeta = { ...baseMeta } as { verbToneId?: string } & Record<string, unknown>;
                        if (!value) {
                          delete nextMeta.verbToneId;
                        } else {
                          nextMeta.verbToneId = value;
                        }
                        const finalMeta = Object.keys(nextMeta).length > 0 ? nextMeta : undefined;
                        setFormData({
                          ...formData,
                          metadata: finalMeta,
                        });
                      }}
                    >
                      <option value="">Auto (from tags)</option>
                      <option value="job">Job (work / income)</option>
                      <option value="quest">Quest (opportunities)</option>
                      <option value="danger">Danger (injury / threats)</option>
                      <option value="system">System (time / hunger / market)</option>
                      <option value="neutral">Neutral (misc)</option>
                    </select>
                  );
                })()}
              </div>
              {mapSlots.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <label className="block text-sm font-bold">Map placement (optional)</label>
                    <button
                      type="button"
                      onClick={() => {
                        const currentMeta = (formData.metadata ?? {}) as Record<string, unknown>;
                        const rest = { ...currentMeta } as { mapSlotId?: string } & Record<string, unknown>;
                        delete rest.mapSlotId;
                        const nextMeta = Object.keys(rest).length > 0 ? rest : undefined;
                        setFormData({
                          ...formData,
                          metadata: nextMeta,
                        });
                      }}
                      className="px-2 py-0.5 rounded-full bg-slate text-ivory text-[11px] hover:bg-slate/80"
                    >
                      Clear
                    </button>
                  </div>
                  <div className="relative w-full rounded-lg overflow-hidden border border-slate-700 bg-black/60 aspect-video">
                    <div
                      className="absolute inset-0"
                      style={{
                        backgroundImage: `url(${idleVillageMap})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        backgroundRepeat: 'no-repeat',
                      }}
                    />
                    <div className="absolute inset-0 bg-black/45" aria-hidden="true" />
                    <div className="absolute inset-0">
                      {mapSlotLayout.map(({ slot, left, top }) => {
                        const currentMeta = (formData.metadata ?? {}) as { mapSlotId?: string } | undefined;
                        const currentMapSlotId = currentMeta?.mapSlotId;
                        const isSelected = currentMapSlotId === slot.id;
                        const isVillage = slot.slotTags?.includes('village');
                        const isWorld = slot.slotTags?.includes('world');

                        return (
                          <button
                            key={slot.id}
                            type="button"
                            onClick={() => {
                              const baseMeta = (formData.metadata ?? {}) as Record<string, unknown>;
                              const nextMeta = {
                                ...baseMeta,
                                mapSlotId: slot.id,
                              };
                              setFormData({
                                ...formData,
                                metadata: nextMeta,
                              });
                            }}
                            className={`absolute -translate-x-1/2 -translate-y-full flex flex-col items-center gap-0.5 focus:outline-none ${
                              isSelected ? 'scale-105 drop-shadow-[0_0_10px_rgba(250,250,210,0.9)]' : 'opacity-90 hover:opacity-100'
                            }`}
                            style={{ left: `${left}%`, top: `${top}%` }}
                          >
                            <div
                              className={`w-7 h-7 rounded-full border shadow-md flex items-center justify-center text-[11px] ${
                                isVillage
                                  ? 'bg-emerald-500/70 border-emerald-300'
                                  : isWorld
                                    ? 'bg-indigo-500/70 border-indigo-300'
                                    : 'bg-slate-700/80 border-slate-300'
                              }`}
                            >
                              {slot.label.slice(0, 2).toUpperCase()}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-300">
                    Click a marker to pin this activity to a specific map slot. If none is selected, slotTags-only rules apply.
                  </p>
                </div>
              )}
              <div>
                <label className="block text-sm font-bold mb-1">Rewards</label>
                {resources.length === 0 && (
                  <p className="text-xs text-slate-400 mb-1">
                    Define resources (e.g. gold, xp) in the Resources tab first.
                  </p>
                )}
                <div className="space-y-2">
                  {(formData.rewards ?? []).map((reward, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <select
                        className="px-2 py-1 bg-obsidian border border-slate rounded text-ivory text-xs"
                        value={reward.resourceId}
                        onChange={(e) => {
                          const rewards = formData.rewards ?? [];
                          const next = rewards.map((r, i) =>
                            i === index ? { ...r, resourceId: e.target.value } : r,
                          );
                          setFormData({ ...formData, rewards: next });
                        }}
                      >
                        <option value="">Select resource</option>
                        {resources.map((res) => (
                          <option key={res.id} value={res.id}>
                            {res.label}
                          </option>
                        ))}
                      </select>
                      <input
                        type="text"
                        placeholder="amount formula (e.g. 10)"
                        className="flex-1 px-2 py-1 bg-obsidian border border-slate rounded text-ivory text-xs font-mono"
                        value={reward.amountFormula || ''}
                        onChange={(e) => {
                          const rewards = formData.rewards ?? [];
                          const next = rewards.map((r, i) =>
                            i === index ? { ...r, amountFormula: e.target.value } : r,
                          );
                          setFormData({ ...formData, rewards: next });
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const rewards = formData.rewards ?? [];
                          const next = rewards.filter((_, i) => i !== index);
                          setFormData({ ...formData, rewards: next.length ? next : undefined });
                        }}
                        className="px-2 py-1 bg-red-600 text-ivory rounded text-xs hover:bg-red-700"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    disabled={resources.length === 0}
                    onClick={() => {
                      if (resources.length === 0) return;
                      const base = formData.rewards ?? [];
                      const next = [
                        ...base,
                        { resourceId: resources[0].id, amountFormula: '10' },
                      ];
                      setFormData({ ...formData, rewards: next });
                    }}
                    className="mt-1 px-2 py-1 bg-slate text-ivory rounded text-xs hover:bg-slate/80 disabled:opacity-50"
                  >
                    + Add Reward
                  </button>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={() => {
                  if (!editingId) return;
                  handleUpdate(editingId, formData);
                  setEditingId(null);
                  setFormData({});
                }}
                className="bg-gold text-obsidian px-4 py-2 rounded font-bold hover:bg-gold/80"
              >
                Save
              </button>
              <button
                onClick={() => {
                  setEditingId(null);
                  setFormData({});
                }}
                className="bg-slate text-ivory px-4 py-2 rounded font-bold hover:bg-slate/80"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
