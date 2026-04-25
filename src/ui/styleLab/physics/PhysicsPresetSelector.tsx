/**
 * PhysicsPresetSelector.tsx
 *
 * Componente per selezionare i preset di fisica del drag nello Style Lab.
 * Mostra 5 bottoni per i preset disponibili e aggiorna il contesto globale.
 */

'use client';

import React from 'react';
import { useDragPhysics } from './useDragPhysicsHooks';
import { PRESET_LABELS, PRESET_DESCRIPTIONS } from './dragPhysicsPresets';

export function PhysicsPresetSelector() {
  const { presetKey, setPreset, availablePresets } = useDragPhysics();

  return (
    <div>
      <h4 className="font-semibold mb-3 text-purple-300">
        Drag Physics Presets
      </h4>
      <div className="grid grid-cols-2 gap-2">
        {availablePresets.map((key) => (
          <button
            key={key}
            onClick={() => setPreset(key)}
            className={`px-3 py-2 rounded text-left transition-all transform hover:scale-105 ${
              presetKey === key
                ? 'bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-lg shadow-purple-500/25'
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700 border border-gray-600'
            }`}
          >
            <div className="font-medium text-sm">
              {PRESET_LABELS[key]}
            </div>
            <div className="text-xs opacity-70 mt-1">
              {PRESET_DESCRIPTIONS[key]}
            </div>
          </button>
        ))}
      </div>
      
      <div className="mt-3 p-2 bg-gray-800/50 rounded text-xs text-gray-400">
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
          <span>Preset attivo: <strong>{PRESET_LABELS[presetKey]}</strong></span>
        </div>
        <div className="mt-1 text-gray-500">
          Trascina una card per testare la fisica
        </div>
      </div>
    </div>
  );
}
