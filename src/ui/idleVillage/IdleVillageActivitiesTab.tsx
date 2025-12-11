/**
 * Stub Activities section UI for Idle Village config.
 * Mirrors Buildings tab style, but edits ActivityDefinition entries
 * (tags, slotTags, resolutionEngineId, level, dangerRating).
 */

import { useState, useMemo } from 'react';
import { useIdleVillageConfig } from '@/balancing/hooks/useIdleVillageConfig';
import type { ActivityDefinition } from '@/balancing/config/idleVillage/types';
import idleVillageMap from '@/assets/ui/idleVillage/idle-village-map.jpg';

type ActivityFormState = Partial<ActivityDefinition>;

export default function IdleVillageActivitiesTab() {
  const { config, updateConfig } = useIdleVillageConfig();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<ActivityFormState>({});

  const activities = Object.values(config.activities ?? {});
  const resources = Object.values(config.resources ?? {});
  const mapSlots = Object.values(config.mapSlots ?? {});

  const mapSlotLayout = useMemo(
    () => {
      if (mapSlots.length === 0) return [] as { slot: (typeof mapSlots)[number]; left: number; top: number }[];

      const xs = mapSlots.map((s) => s.x);
      const ys = mapSlots.map((s) => s.y);
      const minX = Math.min(...xs);
      const maxX = Math.max(...xs);
      const minY = Math.min(...ys);
      const maxY = Math.max(...ys);
      const spanX = maxX - minX || 1;
      const spanY = maxY - minY || 1;

      return mapSlots.map((slot) => {
        const normX = (slot.x - minX) / spanX;
        const normY = (slot.y - minY) / spanY;
        const left = 6 + normX * 88;
        const top = 12 + normY * 76;
        return { slot, left, top };
      });
    },
    [mapSlots],
  );

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
