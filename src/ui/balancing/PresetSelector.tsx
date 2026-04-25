/**
 * Preset Selector - Dropdown for choosing active preset
 * 
 * Allows switching between built-in and user-created presets
 */

import React from 'react';
import { BalanceConfigManager } from '../../balancing/BalanceConfigManager';
import { deleteUserPreset } from '../../balancing/presetStorage';
import { toast } from 'sonner';

/**
 * Props for the PresetSelector component.
 */
interface PresetSelectorProps {
    activePresetId: string;
    onPresetChange: (id: string) => void;
    onEditMode?: () => void;
}

export const PresetSelector: React.FC<PresetSelectorProps> = ({
    activePresetId,
    onPresetChange,
    onEditMode
}) => {
    const allPresets = BalanceConfigManager.getAllPresets();

    // Group presets by type
    const builtInPresets = Object.values(allPresets).filter(p => !p.id.startsWith('user_'));
    const userPresets = Object.values(allPresets).filter(p => p.id.startsWith('user_'));

    const handleDelete = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();

        if (!confirm('Are you sure you want to delete this preset?')) {
            return;
        }

        try {
            deleteUserPreset(id);
            toast.success('Preset deleted');

            // Switch to standard if deleted
            if (activePresetId === id) {
                onPresetChange('standard');
            }
        } catch (error) {
            toast.error('Failed to delete preset', {
                description: (error as Error).message
            });
        }
    };

    return (
        <div className="flex items-center gap-2">
            <label className="text-sm text-gray-400 font-semibold">Preset:</label>

            <select
                value={activePresetId}
                onChange={(e) => onPresetChange(e.target.value)}
                className="bg-white/5 border border-white/10 rounded px-3 py-1.5 text-white text-sm focus:outline-none focus:border-purple-500/50 min-w-[200px]"
            >
                {/* Built-in Presets */}
                <optgroup label="Built-in Presets" className="bg-gray-800">
                    {builtInPresets.map(preset => (
                        <option key={preset.id} value={preset.id} className="bg-gray-800">
                            {preset.name}
                        </option>
                    ))}
                </optgroup>

                {/* User Presets */}
                {userPresets.length > 0 && (
                    <optgroup label="My Presets" className="bg-gray-800">
                        {userPresets.map(preset => (
                            <option key={preset.id} value={preset.id} className="bg-gray-800">
                                {preset.name}
                            </option>
                        ))}
                    </optgroup>
                )}
            </select>

            {/* Delete button for user presets */}
            {activePresetId.startsWith('user_') && (
                <button
                    onClick={(e) => handleDelete(activePresetId, e)}
                    className="px-2 py-1.5 text-xs bg-red-600/20 hover:bg-red-600/40 border border-red-500/30 text-red-400 rounded transition-colors"
                    title="Delete this preset"
                >
                    🗑️
                </button>
            )}

            {/* Edit/Create button */}
            {onEditMode && (
                <button
                    onClick={onEditMode}
                    className="px-3 py-1.5 text-xs bg-purple-600/30 hover:bg-purple-600/50 border border-purple-500/30 text-white rounded transition-colors fantasy-hover-glow-arcane"
                    title="Edit weights or create new preset"
                >
                    ⚙️ Edit Weights
                </button>
            )}
        </div>
    );
};
