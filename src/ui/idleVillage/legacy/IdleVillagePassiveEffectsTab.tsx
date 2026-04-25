import { useState } from 'react';
import { useIdleVillageConfig } from '@/balancing/hooks/useIdleVillageConfig';
import type { PassiveEffectDefinition, ResourceDeltaDefinition } from '@/balancing/config/idleVillage/types';

type PassiveFormState = PassiveEffectDefinition;

const EMPTY_PASSIVE: PassiveEffectDefinition = {
  id: '',
  label: '',
  description: '',
  icon: '',
  verbToneId: 'system',
  slotId: '',
  slotTags: [],
  timeUnitsBetweenTicks: 5,
  frequencyFormula: '',
  resourceDeltas: [],
  unlockConditionIds: [],
};

export default function IdleVillagePassiveEffectsTab() {
  const { config, updateConfig } = useIdleVillageConfig();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<PassiveFormState>(EMPTY_PASSIVE);

  const passives = Object.values(config.passiveEffects ?? {});
  const resources = Object.values(config.resources ?? {});
  const mapSlots = Object.values(config.mapSlots ?? {});

  const handleCreate = () => {
    const newId = `passive_${Date.now()}`;
    const newPassive: PassiveEffectDefinition = {
      ...EMPTY_PASSIVE,
      id: newId,
      label: 'New Passive Effect',
      verbToneId: 'system',
    };

    updateConfig({
      passiveEffects: {
        ...config.passiveEffects,
        [newId]: newPassive,
      },
    });
  };

  const handleUpdate = (id: string, updates: Partial<PassiveEffectDefinition>) => {
    updateConfig({
      passiveEffects: {
        ...config.passiveEffects,
        [id]: {
          ...config.passiveEffects[id],
          ...updates,
        },
      },
    });
  };

  const handleDelete = (id: string) => {
    const rest = { ...config.passiveEffects };
    delete rest[id];
    updateConfig({ passiveEffects: rest });
  };

  const openEditor = (passive: PassiveEffectDefinition) => {
    setEditingId(passive.id);
    setFormData({
      ...EMPTY_PASSIVE,
      ...passive,
      slotTags: passive.slotTags ?? [],
      resourceDeltas: passive.resourceDeltas ?? [],
      unlockConditionIds: passive.unlockConditionIds ?? [],
    });
  };

  const updateResourceDelta = (index: number, updates: Partial<ResourceDeltaDefinition>) => {
    const deltas = formData.resourceDeltas ?? [];
    const next = deltas.map((delta, i) => (i === index ? { ...delta, ...updates } : delta));
    setFormData({ ...formData, resourceDeltas: next });
  };

  const addResourceDelta = () => {
    if (resources.length === 0) return;
    const deltas = formData.resourceDeltas ?? [];
    setFormData({
      ...formData,
      resourceDeltas: [...deltas, { resourceId: resources[0].id, amountFormula: '0' }],
    });
  };

  const removeResourceDelta = (index: number) => {
    const deltas = formData.resourceDeltas ?? [];
    const next = deltas.filter((_, i) => i !== index);
    setFormData({ ...formData, resourceDeltas: next });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg sm:text-xl font-cinzel tracking-[0.18em] uppercase text-ivory/90">Passive Effects</h2>
        <button
          type="button"
          onClick={handleCreate}
          className="bg-gold text-obsidian px-4 py-2 rounded font-bold hover:bg-gold/80"
        >
          + New Passive
        </button>
      </div>

      <div className="space-y-2">
        {passives.length === 0 && (
          <p className="text-sm text-slate-400">
            No passive effects configured yet. Use &quot;+ New Passive&quot; to create one.
          </p>
        )}
        {passives.map((passive) => (
          <div key={passive.id} className="default-card flex flex-col gap-2">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-700/60 pb-2">
              <div className="flex items-center gap-3">
                <div className="text-2xl">{passive.icon || '☄'}</div>
                <div>
                  <div className="text-[11px] font-semibold tracking-[0.18em] uppercase text-slate-100">
                    {passive.label}
                  </div>
                  <div className="text-[10px] text-teal mt-0.5">ID: {passive.id}</div>
                  <div className="text-[10px] text-slate-400">
                    Slot:
                    {' '}
                    {passive.slotId || (passive.slotTags?.join(', ') || '—')}
                  </div>
                  <div className="text-[10px] text-slate-400">
                    Interval:
                    {' '}
                    {passive.timeUnitsBetweenTicks ?? '?'}
                    {' '}
                    units
                  </div>
                </div>
              </div>
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() => openEditor(passive)}
                  className="bg-teal text-obsidian px-2 py-1 rounded-full text-[10px] font-semibold tracking-[0.16em] uppercase hover:bg-teal/80"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(passive.id)}
                  className="bg-red-600 text-ivory px-2 py-1 rounded-full text-[10px] font-semibold tracking-[0.16em] uppercase hover:bg-red-700"
                >
                  Delete
                </button>
              </div>
            </div>

            {passive.description && (
              <p className="text-[11px] text-slate-300 whitespace-pre-line">{passive.description}</p>
            )}

            {(passive.resourceDeltas?.length ?? 0) > 0 && (
              <div className="text-[10px] text-slate-300">
                Resource Deltas:
                {' '}
                {passive.resourceDeltas?.map((delta) => `${delta.resourceId} (${delta.amountFormula})`).join(', ')}
              </div>
            )}
          </div>
        ))}
      </div>

      {editingId && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 px-4">
          <div className="default-card w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-cinzel">Edit Passive Effect</h3>
              <button
                type="button"
                className="text-[10px] px-2 py-1 rounded-full bg-slate-800 text-slate-200 hover:bg-slate-700"
                onClick={() => {
                  setEditingId(null);
                  setFormData(EMPTY_PASSIVE);
                }}
              >
                Close
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-[0.2em] text-slate-400 mb-1">ID</label>
                <div className="px-2 py-1 bg-obsidian border border-slate rounded text-ivory text-xs font-mono overflow-x-auto">
                  {editingId}
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-[0.2em] text-slate-400 mb-1">Label</label>
                <input
                  type="text"
                  value={formData.label}
                  onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                  className="w-full px-2 py-1 bg-obsidian border border-slate rounded text-ivory"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-[0.2em] text-slate-400 mb-1">Icon</label>
                <input
                  type="text"
                  maxLength={2}
                  value={formData.icon}
                  onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                  className="w-full px-2 py-1 bg-obsidian border border-slate rounded text-ivory"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-[0.2em] text-slate-400 mb-1">Verb Tone</label>
                <select
                  value={formData.verbToneId ?? ''}
                  onChange={(e) => setFormData({ ...formData, verbToneId: e.target.value })}
                  className="w-full px-2 py-1 bg-obsidian border border-slate rounded text-ivory"
                >
                  <option value="system">System</option>
                  <option value="job">Job</option>
                  <option value="quest">Quest</option>
                  <option value="danger">Danger</option>
                  <option value="neutral">Neutral</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-[0.2em] text-slate-400 mb-1">Slot</label>
                <select
                  value={formData.slotId ?? ''}
                  onChange={(e) => setFormData({ ...formData, slotId: e.target.value || undefined })}
                  className="w-full px-2 py-1 bg-obsidian border border-slate rounded text-ivory"
                >
                  <option value="">Any slot via tags</option>
                  {mapSlots.map((slot) => (
                    <option key={slot.id} value={slot.id}>
                      {slot.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-[0.2em] text-slate-400 mb-1">Slot Tags (comma)</label>
                <input
                  type="text"
                  value={(formData.slotTags ?? []).join(', ')}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      slotTags: e.target.value
                        .split(',')
                        .map((tag) => tag.trim())
                        .filter(Boolean),
                    })
                  }
                  className="w-full px-2 py-1 bg-obsidian border border-slate rounded text-ivory"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-[0.2em] text-slate-400 mb-1">Interval (time units)</label>
                <input
                  type="number"
                  min={1}
                  value={formData.timeUnitsBetweenTicks ?? 1}
                  onChange={(e) =>
                    setFormData({ ...formData, timeUnitsBetweenTicks: Number(e.target.value) || undefined })
                  }
                  className="w-full px-2 py-1 bg-obsidian border border-slate rounded text-ivory"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-[0.2em] text-slate-400 mb-1">Frequency Formula</label>
                <input
                  type="text"
                  value={formData.frequencyFormula ?? ''}
                  onChange={(e) => setFormData({ ...formData, frequencyFormula: e.target.value })}
                  className="w-full px-2 py-1 bg-obsidian border border-slate rounded text-ivory font-mono text-xs"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-[0.2em] text-slate-400 mb-1">Description</label>
              <textarea
                value={formData.description ?? ''}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className="w-full px-2 py-1 bg-obsidian border border-slate rounded text-ivory text-sm"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                  Resource Deltas
                </label>
                <button
                  type="button"
                  onClick={addResourceDelta}
                  disabled={resources.length === 0}
                  className="px-2 py-1 bg-slate text-ivory rounded text-[11px] hover:bg-slate/80 disabled:opacity-40"
                >
                  + Add Delta
                </button>
              </div>
              {resources.length === 0 && (
                <p className="text-xs text-slate-400">Define resources first in the Resources tab.</p>
              )}
              <div className="space-y-2">
                {(formData.resourceDeltas ?? []).map((delta, index) => (
                  <div key={`${delta.resourceId}-${index}`} className="flex flex-col sm:flex-row gap-2 items-start sm:items-center">
                    <select
                      value={delta.resourceId}
                      onChange={(e) => updateResourceDelta(index, { resourceId: e.target.value })}
                      className="px-2 py-1 bg-obsidian border border-slate rounded text-ivory text-xs"
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
                      value={delta.amountFormula}
                      onChange={(e) => updateResourceDelta(index, { amountFormula: e.target.value })}
                      className="flex-1 px-2 py-1 bg-obsidian border border-slate rounded text-ivory text-xs font-mono"
                      placeholder="amount formula (e.g. -2)"
                    />
                    <button
                      type="button"
                      onClick={() => removeResourceDelta(index)}
                      className="px-2 py-1 bg-red-600 text-ivory rounded text-[11px] hover:bg-red-700"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-[0.2em] text-slate-400 mb-1">
                Unlock Conditions (comma-separated IDs)
              </label>
              <input
                type="text"
                value={(formData.unlockConditionIds ?? []).join(', ')}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    unlockConditionIds: e.target.value
                      .split(',')
                      .map((id) => id.trim())
                      .filter(Boolean),
                  })
                }
                className="w-full px-2 py-1 bg-obsidian border border-slate rounded text-ivory text-sm"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                className="px-3 py-1.5 bg-slate text-ivory rounded text-[11px] hover:bg-slate/80"
                onClick={() => {
                  setEditingId(null);
                  setFormData(EMPTY_PASSIVE);
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                className="px-4 py-1.5 bg-gold text-obsidian rounded text-[11px] font-semibold tracking-[0.2em] uppercase hover:bg-gold/80"
                onClick={() => {
                  handleUpdate(editingId, formData);
                  setEditingId(null);
                  setFormData(EMPTY_PASSIVE);
                }}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
