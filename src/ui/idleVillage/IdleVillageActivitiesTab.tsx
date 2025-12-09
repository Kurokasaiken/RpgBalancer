/**
 * Stub Activities section UI for Idle Village config.
 * Mirrors Buildings tab style, but edits ActivityDefinition entries
 * (tags, slotTags, resolutionEngineId, level, dangerRating).
 */

import { useState } from 'react';
import { useIdleVillageConfig } from '@/balancing/hooks/useIdleVillageConfig';
import type { ActivityDefinition } from '@/balancing/config/idleVillage/types';

type ActivityFormState = Partial<ActivityDefinition>;

export default function IdleVillageActivitiesTab() {
  const { config, updateConfig } = useIdleVillageConfig();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<ActivityFormState>({});

  const activities = Object.values(config.activities ?? {});
  const resources = Object.values(config.resources ?? {});

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
          <div key={activity.id} className="bg-slate/20 border border-slate rounded p-3">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="font-bold">{activity.label}</div>
                <div className="text-sm text-teal">ID: {activity.id}</div>
                <div className="text-xs text-teal">Tags: {activity.tags.join(', ') || 'none'}</div>
                <div className="text-xs text-teal">Slot Tags: {activity.slotTags.join(', ') || 'none'}</div>
                <div className="text-xs text-teal">Engine: {activity.resolutionEngineId}</div>
                {typeof activity.level === 'number' && (
                  <div className="text-xs text-teal">Level: {activity.level}</div>
                )}
                {typeof activity.dangerRating === 'number' && (
                  <div className="text-xs text-red-400">Danger: {activity.dangerRating}</div>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setEditingId(activity.id);
                    setFormData(activity);
                  }}
                  className="bg-teal text-obsidian px-2 py-1 rounded text-sm hover:bg-teal/80"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(activity.id)}
                  className="bg-red-600 text-ivory px-2 py-1 rounded text-sm hover:bg-red-700"
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
          <div className="bg-slate border border-gold rounded p-6 w-96 max-h-screen overflow-y-auto">
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
