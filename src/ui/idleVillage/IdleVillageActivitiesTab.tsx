/**
 * Stub Activities section UI for Idle Village config.
 * Mirrors Buildings tab style, but edits ActivityDefinition entries
 * (tags, slotTags, resolutionEngineId, level, dangerRating).
 */

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useIdleVillageConfig } from '@/balancing/hooks/useIdleVillageConfig';
import type { ActivityDefinition, MapSlotDefinition } from '@/balancing/config/idleVillage/types';
import idleVillageMap from '@/assets/ui/idleVillage/idle-village-map.jpg';

type ActivityFormState = Partial<ActivityDefinition>;

const mapSlotIconLibrary = [
  '🂠', '⚔️', '🛡️', '✨', '🔥', '❄️', '🌊', '🌿', '💀', '🐉', '🦊', '🪽', '🧠', '⚙️', '🜂', '🜄', '🜃', '🜁', '🜚', '🔮',
  '🪄', '🎲', '🏹', '⚒️', '⚗️', '📜', '🏰', '🪙', '💎', '🌀', '🌙', '⭐', '🪬', '🩸', '🦂', '🐺', '👁️', '🪐', '⚡', '🌑',
];

export default function IdleVillageActivitiesTab() {
  const { config, updateConfig } = useIdleVillageConfig();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<ActivityFormState>({});

  const [selectedMapSlotId, setSelectedMapSlotId] = useState<string | null>(null);
  const [showMapSlotIconPicker, setShowMapSlotIconPicker] = useState(false);
  const mapContainerRef = useRef<HTMLDivElement | null>(null);

  const activities = Object.values(config.activities ?? {});
  const resources = Object.values(config.resources ?? {});
  const mapSlots = Object.values(config.mapSlots ?? {});

  useEffect(() => {
    if (!selectedMapSlotId && mapSlots.length > 0) {
      setSelectedMapSlotId(mapSlots[0].id);
    }
  }, [mapSlots, selectedMapSlotId]);

  const mapSlotLayout = useMemo(
    () => {
      if (mapSlots.length === 0) return [] as { slot: (typeof mapSlots)[number]; left: number; top: number }[];
      return mapSlots.map((slot) => {
        const normX = slot.x / 10;
        const normY = slot.y / 10;
        const left = 8 + normX * 80;
        const top = 12 + normY * 55;
        return { slot, left, top };
      });
    },
    [mapSlots],
  );

  const selectedMapSlot: MapSlotDefinition | null = useMemo(() => {
    if (mapSlots.length === 0) return null;
    if (!selectedMapSlotId) return (mapSlots[0] as MapSlotDefinition) ?? null;
    return (mapSlots.find((s) => s.id === selectedMapSlotId) as MapSlotDefinition | undefined) ?? null;
  }, [mapSlots, selectedMapSlotId]);

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

  const handleMapBackgroundClick: React.MouseEventHandler<HTMLDivElement> = (event) => {
    if (!selectedMapSlot) return;
    if (!mapContainerRef.current) return;

    const rect = mapContainerRef.current.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;

    const relX = (event.clientX - rect.left) / rect.width;
    const relY = (event.clientY - rect.top) / rect.height;
    if (!Number.isFinite(relX) || !Number.isFinite(relY)) return;

    const clampedX = Math.max(0, Math.min(1, relX));
    const clampedY = Math.max(0, Math.min(1, relY));

    const logicalX = clampedX * 10;
    const logicalY = clampedY * 10;

    handleUpdateMapSlot(selectedMapSlot.id, { x: logicalX, y: logicalY });
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
                      className={`w-7 h-7 rounded-sm border shadow-md flex items-center justify-center text-[12px] bg-black/80 ${
                        isVillage
                          ? 'border-emerald-200'
                          : isWorld
                            ? 'border-indigo-200'
                            : 'border-slate-200'
                      }`}
                    >
                      <span aria-hidden className="text-base">
                        {slot.icon || slot.label.slice(0, 2).toUpperCase()}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {selectedMapSlot && (
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
              <p className="text-[10px] text-slate-400">
                Click on the map above to change this slot&apos;s position.
              </p>
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
