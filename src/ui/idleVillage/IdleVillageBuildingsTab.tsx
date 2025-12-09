/**
 * Stub Buildings section UI for Idle Village config.
 * This mirrors the Balancer Config UI patterns but for BuildingDefinition.
 */

import { useState } from 'react';
import { useIdleVillageConfig } from '@/balancing/hooks/useIdleVillageConfig';
import type { BuildingDefinition } from '@/balancing/config/idleVillage/buildings';

export default function IdleVillageBuildingsTab() {
  const { config, updateConfig } = useIdleVillageConfig();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<BuildingDefinition>>({});

  const buildings = Object.values(config.buildings ?? {});

  const handleCreate = () => {
    const newId = `building_${Date.now()}`;
    const newBuilding: BuildingDefinition = {
      id: newId,
      label: 'New Building',
      tags: [],
      isInitiallyBuilt: false,
    };
    updateConfig({
      buildings: {
        ...config.buildings,
        [newId]: newBuilding,
      },
    });
  };

  const handleUpdate = (id: string, updates: Partial<BuildingDefinition>) => {
    updateConfig({
      buildings: {
        ...config.buildings,
        [id]: { ...config.buildings[id], ...updates },
      },
    });
  };

  const handleDelete = (id: string) => {
    const rest = { ...config.buildings };
    delete rest[id];
    updateConfig({ buildings: rest });
  };

  return (
    <div className="space-y-4">
      <h2 className="text-lg sm:text-xl font-cinzel tracking-[0.18em] uppercase text-ivory/90">Buildings Configuration</h2>
      <button
        onClick={handleCreate}
        className="mb-4 bg-gold text-obsidian px-4 py-2 rounded font-bold hover:bg-gold/80"
      >
        + New Building
      </button>
      <div className="space-y-2">
        {buildings.map((building) => (
          <div key={building.id} className="bg-slate/20 border border-slate rounded p-3">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="font-bold">{building.label}</div>
                <div className="text-sm text-teal">ID: {building.id}</div>
                <div className="text-xs text-teal">
                  Tags: {building.tags.join(', ') || 'none'}
                </div>
                <div className="text-xs text-teal">
                  Initially Built: {building.isInitiallyBuilt ? 'Yes' : 'No'}
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setEditingId(building.id);
                    setFormData(building);
                  }}
                  className="bg-teal text-obsidian px-2 py-1 rounded text-sm hover:bg-teal/80"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(building.id)}
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
            <h3 className="text-lg font-cinzel mb-4">Edit Building</h3>
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
                <label className="flex items-center text-sm font-bold">
                  <input
                    type="checkbox"
                    checked={formData.isInitiallyBuilt ?? false}
                    onChange={(e) => setFormData({ ...formData, isInitiallyBuilt: e.target.checked })}
                    className="mr-2"
                  />
                  Initially Built
                </label>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={() => {
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
