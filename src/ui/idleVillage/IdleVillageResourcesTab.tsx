/**
 * Resources section UI for Idle Village config.
 * Lets you add/remove generic resources (gold, xp, etc.) in a config-first way.
 */

import { useState } from 'react';
import { useIdleVillageConfig } from '@/balancing/hooks/useIdleVillageConfig';
import type { ResourceDefinition } from '@/balancing/config/idleVillage/types';

type ResourceFormState = Partial<ResourceDefinition>;

export default function IdleVillageResourcesTab() {
  const { config, updateConfig } = useIdleVillageConfig();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<ResourceFormState>({});

  const resources = Object.values(config.resources ?? {});

  const handleCreate = () => {
    const newId = `resource_${Date.now()}`;
    const newResource: ResourceDefinition = {
      id: newId,
      label: 'New Resource',
    };

    updateConfig({
      resources: {
        ...config.resources,
        [newId]: newResource,
      },
    });
  };

  const handleUpdate = (id: string, updates: ResourceFormState) => {
    const existing = config.resources[id];
    if (!existing) return;

    updateConfig({
      resources: {
        ...config.resources,
        [id]: { ...existing, ...updates },
      },
    });
  };

  const handleDelete = (id: string) => {
    const next = { ...config.resources };
    delete next[id];
    updateConfig({ resources: next });
  };

  return (
    <div className="space-y-4">
      <h2 className="text-lg sm:text-xl font-cinzel tracking-[0.18em] uppercase text-ivory/90">Resources</h2>
      <button
        onClick={handleCreate}
        className="mb-4 bg-gold text-obsidian px-4 py-2 rounded font-bold hover:bg-gold/80"
      >
        + New Resource
      </button>
      <div className="space-y-2">
        {resources.map((resource) => (
          <div key={resource.id} className="bg-slate/20 border border-slate rounded p-3">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="font-bold">{resource.label}</div>
                <div className="text-sm text-teal">ID: {resource.id}</div>
                {resource.description && (
                  <div className="text-xs text-slate-300">{resource.description}</div>
                )}
                {resource.colorClass && (
                  <div className="text-xs text-slate-400">Color: {resource.colorClass}</div>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setEditingId(resource.id);
                    setFormData(resource);
                  }}
                  className="bg-teal text-obsidian px-2 py-1 rounded text-sm hover:bg-teal/80"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(resource.id)}
                  className="bg-red-600 text-ivory px-2 py-1 rounded text-sm hover:bg-red-700"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Edit Modal */}
      {editingId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-slate border border-gold rounded p-6 w-96 max-h-screen overflow-y-auto">
            <h3 className="text-lg font-cinzel mb-4">Edit Resource</h3>
            <div className="space-y-3 text-sm">
              <div>
                <label className="block font-bold mb-1">ID (read-only)</label>
                <div className="px-2 py-1 bg-obsidian border border-slate rounded text-ivory text-xs font-mono">
                  {editingId}
                </div>
              </div>
              <div>
                <label className="block font-bold mb-1">Label</label>
                <input
                  type="text"
                  value={formData.label || ''}
                  onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                  className="w-full px-2 py-1 bg-obsidian border border-slate rounded text-ivory"
                />
              </div>
              <div>
                <label className="block font-bold mb-1">Description</label>
                <textarea
                  value={formData.description || ''}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full px-2 py-1 bg-obsidian border border-slate rounded text-ivory text-xs"
                />
              </div>
              <div>
                <label className="block font-bold mb-1">Color Class (Tailwind)</label>
                <input
                  type="text"
                  placeholder="es. text-amber-300"
                  value={formData.colorClass || ''}
                  onChange={(e) => setFormData({ ...formData, colorClass: e.target.value })}
                  className="w-full px-2 py-1 bg-obsidian border border-slate rounded text-ivory text-xs font-mono"
                />
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
