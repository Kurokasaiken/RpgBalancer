/**
 * PresetManager Component
 * 
 * UI for creating, loading, editing, and deleting custom presets.
 * Integrates with the PresetManager class for persistence.
 */

'use client';

import React, { useState, useEffect } from 'react';
import { PresetManager as PresetManagerStore, type PresetMetadata, type CustomPreset, type StyleLabPresetSnapshot } from '../config/presetManager';
import { useStyleLabTokens } from '../hooks/useStyleLabTokens';
import { usePhysicsConfig } from '../hooks/usePhysicsConfig';
import { useDemoConfig } from '../hooks/useDemoConfig';
import type { PresetId } from '../presets';
import { PRESET_PILLARS, isBuiltInPresetId } from '../presets/presetBridge';
import { DEFAULT_DEMO_CONFIG_META } from '../config/demoConfig';

interface PresetManagerProps {
  onPresetApply?: (preset: CustomPreset) => void;
  className?: string;
  activePresetId?: PresetId;
  styleOverride?: StyleLabPresetSnapshot;
}

export function PresetManager({ onPresetApply, className, activePresetId, styleOverride }: PresetManagerProps) {
  const resolvedPresetId = activePresetId ?? 'minimalFrontier';
  const tokens = useStyleLabTokens({ presetId: resolvedPresetId, presetOverride: styleOverride });
  const physicsConfig = usePhysicsConfig();
  const demoConfig = useDemoConfig();
  
  const [presets, setPresets] = useState<PresetMetadata[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({
    id: '',
    name: '',
    description: '',
    type: 'combined' as 'style' | 'physics' | 'combined',
  });

  // Load presets on mount
  useEffect(() => {
    loadPresets();
  }, []);

  const loadPresets = async () => {
    try {
      const metadata = await PresetManagerStore.getPresetMetadata();
      setPresets(metadata);
    } catch (error) {
      console.error('[PresetManager] Failed to load presets:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreatePreset = async () => {
    if (!formData.id || !formData.name) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      // Get current configuration
      const styleSnapshot = formData.type === 'physics' ? undefined : (styleOverride ?? tokens.preset);
      const currentPhysicsConfig = formData.type === 'style' ? undefined : physicsConfig.cfg;
      const currentDemoConfig = demoConfig.config;
      const currentMeta = currentDemoConfig.meta ?? DEFAULT_DEMO_CONFIG_META;
      const sourcePresetId = currentMeta.sourceId && isBuiltInPresetId(currentMeta.sourceId as PresetId)
        ? (currentMeta.sourceId as PresetId)
        : resolvedPresetId;
      const pillar = currentMeta.pillar ?? PRESET_PILLARS[sourcePresetId];

      const demoConfigWithMeta = {
        ...currentDemoConfig,
        meta: {
          ...currentMeta,
          presetId: formData.id,
          presetLabel: formData.name,
          pillar,
          sourceId: sourcePresetId,
          isCustom: true,
        },
      };

      await PresetManagerStore.createPreset(
        formData.id,
        formData.name,
        formData.description,
        formData.type,
        {
          styleConfig: styleSnapshot,
          physicsConfig: currentPhysicsConfig,
          demoConfig: demoConfigWithMeta,
          basePresetId: sourcePresetId,
          pillar,
        }
      );

      // Reset form and reload presets
      setFormData({ id: '', name: '', description: '', type: 'combined' });
      setShowCreateForm(false);
      loadPresets();
    } catch (error) {
      console.error('[PresetManager] Failed to create preset:', error);
      alert('Failed to create preset');
    }
  };

  const handleLoadPreset = async (presetId: string) => {
    try {
      const preset = await PresetManagerStore.loadPreset(presetId);
      if (preset && onPresetApply) {
        onPresetApply(preset);
        await PresetManagerStore.saveActivePreset(presetId);
      }
    } catch (error) {
      console.error('[PresetManager] Failed to load preset:', error);
      alert('Failed to load preset');
    }
  };

  const handleDeletePreset = async (presetId: string) => {
    if (!confirm('Are you sure you want to delete this preset?')) {
      return;
    }

    try {
      await PresetManagerStore.deletePreset(presetId);
      loadPresets();
    } catch (error) {
      console.error('[PresetManager] Failed to delete preset:', error);
      alert('Failed to delete preset');
    }
  };

  const handleExportPreset = async (presetId: string) => {
    try {
      const preset = await PresetManagerStore.loadPreset(presetId);
      if (preset) {
        const dataStr = JSON.stringify(preset, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${preset.name.replace(/\s+/g, '-').toLowerCase()}-preset.json`;
        link.click();
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('[PresetManager] Failed to export preset:', error);
      alert('Failed to export preset');
    }
  };

  const handleImportPreset = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        try {
          const text = await file.text();
          const preset = JSON.parse(text) as CustomPreset;
          
          // Generate unique ID if it conflicts
          const existingPresets = await PresetManagerStore.loadPresets();
          if (existingPresets.some(p => p.id === preset.id)) {
            preset.id = `${preset.id}-${Date.now()}`;
          }
          
          await PresetManagerStore.savePreset(preset);
          loadPresets();
        } catch (error) {
          console.error('[PresetManager] Failed to import preset:', error);
          alert('Failed to import preset - invalid file format');
        }
      }
    };
    input.click();
  };

  if (isLoading) {
    return (
      <div className={`p-4 ${className || ''}`} style={{ color: tokens.preset.surfaces.panel.color }}>
        Loading presets...
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className || ''}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h4 className="font-semibold" style={{ color: tokens.preset.surfaces.panel.color }}>
          Preset Manager
        </h4>
        <div className="flex space-x-2">
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="px-3 py-1 rounded text-xs font-medium transition-colors"
            style={{
              background: 'var(--iron-md, #181c24)',
              border: '1px solid var(--go3, #786000)',
              color: 'var(--t1, #c8b88a)',
            }}
          >
            {showCreateForm ? 'Cancel' : 'Create New'}
          </button>
          <button
            onClick={handleImportPreset}
            className="px-3 py-1 rounded text-xs font-medium transition-colors"
            style={{
              background: 'var(--iron-md, #181c24)',
              border: '1px solid var(--go3, #786000)',
              color: 'var(--t1, #c8b88a)',
            }}
          >
            Import
          </button>
        </div>
      </div>

      {/* Create Form */}
      {showCreateForm && (
        <div className="p-4 rounded-lg border" style={{
          background: 'var(--iron-dk, #0c0e12)',
          borderColor: 'var(--iron-rim, #242c38)',
        }}>
          <h5 className="font-medium mb-3" style={{ color: tokens.preset.surfaces.panel.color }}>
            Create New Preset
          </h5>
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: tokens.preset.surfaces.panel.color }}>
                ID *
              </label>
              <input
                type="text"
                value={formData.id}
                onChange={(e) => setFormData({ ...formData, id: e.target.value })}
                className="w-full px-2 py-1 rounded text-sm"
                style={{
                  background: 'var(--iron-md, #181c24)',
                  border: '1px solid var(--iron-rim, #242c38)',
                  color: 'var(--t1, #c8b88a)',
                }}
                placeholder="my-custom-preset"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: tokens.preset.surfaces.panel.color }}>
                Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-2 py-1 rounded text-sm"
                style={{
                  background: 'var(--iron-md, #181c24)',
                  border: '1px solid var(--iron-rim, #242c38)',
                  color: 'var(--t1, #c8b88a)',
                }}
                placeholder="My Custom Preset"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: tokens.preset.surfaces.panel.color }}>
                Description
              </label>
              <input
                type="text"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-2 py-1 rounded text-sm"
                style={{
                  background: 'var(--iron-md, #181c24)',
                  border: '1px solid var(--iron-rim, #242c38)',
                  color: 'var(--t1, #c8b88a)',
                }}
                placeholder="Custom preset description"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: tokens.preset.surfaces.panel.color }}>
                Type
              </label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as 'style' | 'physics' | 'combined' })}
                className="w-full px-2 py-1 rounded text-sm"
                style={{
                  background: 'var(--iron-md, #181c24)',
                  border: '1px solid var(--iron-rim, #242c38)',
                  color: 'var(--t1, #c8b88a)',
                }}
              >
                <option value="combined">Combined (Style + Physics)</option>
                <option value="style">Style Only</option>
                <option value="physics">Physics Only</option>
              </select>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={handleCreatePreset}
                className="px-3 py-1 rounded text-xs font-medium transition-colors"
                style={{
                  background: 'var(--go4, #a08020)',
                  border: '1px solid var(--go5, #c0a040)',
                  color: 'var(--abyss, #020304)',
                }}
              >
                Create
              </button>
              <button
                onClick={() => setShowCreateForm(false)}
                className="px-3 py-1 rounded text-xs font-medium transition-colors"
                style={{
                  background: 'var(--iron-md, #181c24)',
                  border: '1px solid var(--iron-rim, #242c38)',
                  color: 'var(--t1, #c8b88a)',
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Preset List */}
      <div className="space-y-2">
        {presets.map((preset) => (
          <div
            key={preset.id}
            className="p-3 rounded-lg border transition-colors"
            style={{
              background: 'var(--iron-dk, #0c0e12)',
              borderColor: 'var(--iron-rim, #242c38)',
            }}
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-2">
                  <span className="font-medium text-sm" style={{ color: tokens.preset.surfaces.panel.color }}>
                    {preset.name}
                  </span>
                  <span className="text-xs px-2 py-1 rounded" style={{
                    background: preset.type === 'style' ? 'var(--go3, #786000)' : 
                               preset.type === 'physics' ? 'var(--go4, #a08020)' : 
                               'var(--go5, #c0a040)',
                    color: 'var(--abyss, #020304)',
                  }}>
                    {preset.type}
                  </span>
                  {preset.pillar && (
                    <span className="text-xs px-2 py-1 rounded" style={{
                      background: 'var(--iron-rim, #242c38)',
                      color: 'var(--t2, #806858)',
                    }}>
                      {preset.pillar.toUpperCase()}
                    </span>
                  )}
                  {preset.basePresetId && (
                    <span className="text-[10px] px-2 py-1 rounded" style={{
                      background: 'var(--iron-md, #181c24)',
                      color: 'var(--t2, #806858)',
                      border: '1px solid var(--iron-rim, #242c38)'
                    }}>
                      Base: {preset.basePresetId}
                    </span>
                  )}
                  {preset.isBuiltIn && (
                    <span className="text-xs px-2 py-1 rounded" style={{
                      background: 'var(--iron-rim, #242c38)',
                      color: 'var(--t2, #806858)',
                    }}>
                      Built-in
                    </span>
                  )}
                </div>
                {preset.description && (
                  <p className="text-xs mt-1" style={{ color: 'var(--t2, #806858)' }}>
                    {preset.description}
                  </p>
                )}
                {!preset.isBuiltIn && (
                  <p className="text-xs mt-1" style={{ color: 'var(--t2, #806858)' }}>
                    Created: {new Date(preset.createdAt).toLocaleDateString()}
                  </p>
                )}
              </div>
              <div className="flex space-x-1">
                <button
                  onClick={() => handleLoadPreset(preset.id)}
                  className="px-2 py-1 rounded text-xs transition-colors"
                  style={{
                    background: 'var(--go4, #a08020)',
                    border: '1px solid var(--go5, #c0a040)',
                    color: 'var(--abyss, #020304)',
                  }}
                >
                  Load
                </button>
                <button
                  onClick={() => handleExportPreset(preset.id)}
                  className="px-2 py-1 rounded text-xs transition-colors"
                  style={{
                    background: 'var(--iron-md, #181c24)',
                    border: '1px solid var(--iron-rim, #242c38)',
                    color: 'var(--t1, #c8b88a)',
                  }}
                >
                  Export
                </button>
                {!preset.isBuiltIn && (
                  <button
                    onClick={() => handleDeletePreset(preset.id)}
                    className="px-2 py-1 rounded text-xs transition-colors"
                    style={{
                      background: 'var(--iron-rim, #242c38)',
                      border: '1px solid var(--iron-md, #181c24)',
                      color: 'var(--t2, #806858)',
                    }}
                  >
                    Delete
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
