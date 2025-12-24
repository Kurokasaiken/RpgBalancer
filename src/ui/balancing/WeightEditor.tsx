/**
 * Weight Editor - Modal for editing stat weights
 * 
 * Allows editing weights and saving as new preset
 */

import React, { useState } from 'react';
import { toast } from 'sonner';
import { createUserPreset, importPresetJSON, getDefaultWeights } from '../../balancing/presetStorage';
import type { BalancePreset } from '../../balancing/BalanceConfigManager';

/**
 * Props for the WeightEditor component.
 */
interface WeightEditorProps {
    currentPreset: BalancePreset;
    onSave: (newPresetId: string) => void;
    onClose: () => void;
}

// Stat groups for organization
const STAT_GROUPS = {
    core: { label: '⚡ Core', stats: ['hp', 'damage'] },
    offensive: { label: '⚔️ Offensive', stats: ['critChance', 'critMult', 'armorPen', 'penPercent'] },
    defensive: { label: '🛡️ Defensive', stats: ['armor', 'resistance', 'evasion', 'ward'] },
    sustain: { label: '💚 Sustain', stats: ['lifesteal', 'regen'] }
};

const STAT_LABELS: Record<string, string> = {
    hp: 'HP',
    damage: 'Damage',
    critChance: 'Crit Chance',
    critMult: 'Crit Multiplier',
    armorPen: 'Armor Pen',
    penPercent: 'Resistance Pen %',
    armor: 'Armor',
    resistance: 'Resistance',
    evasion: 'Evasion',
    ward: 'Ward',
    lifesteal: 'Lifesteal',
    regen: 'Regen'
};

export const WeightEditor: React.FC<WeightEditorProps> = ({
    currentPreset,
    onSave,
    onClose
}) => {
    const [weights, setWeights] = useState<Record<string, number>>(
        { ...currentPreset.weights }
    );
    const [presetName, setPresetName] = useState('');
    const [presetDescription, setPresetDescription] = useState('');

    const defaultWeights = getDefaultWeights();

    const handleWeightChange = (stat: string, value: number) => {
        setWeights(prev => ({
            ...prev,
            [stat]: Math.max(0.01, value)
        }));
    };

    const handleResetStat = (stat: string) => {
        if (defaultWeights[stat] !== undefined) {
            handleWeightChange(stat, defaultWeights[stat]);
        }
    };

    const handleResetAll = () => {
        if (confirm('Reset all weights to default values?')) {
            setWeights({ ...defaultWeights });
        }
    };

    const handleSaveAsNew = () => {
        if (!presetName.trim()) {
            toast.error('Please enter a preset name');
            return;
        }

        try {
            const newPreset = createUserPreset(
                presetName,
                presetDescription || `Custom weights based on ${currentPreset.name}`,
                weights
            );

            toast.success('Preset created!', {
                description: `"${newPreset.name}" saved successfully`
            });

            onSave(newPreset.id);
            onClose();
        } catch (error) {
            toast.error('Failed to create preset', {
                description: (error as Error).message
            });
        }
    };

    const handleExport = () => {
        try {
            const exportData = {
                name: presetName || 'Custom Preset',
                description: presetDescription,
                weights
            };

            const json = JSON.stringify(exportData, null, 2);
            const blob = new Blob([json], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `preset_${Date.now()}.json`;
            a.click();
            URL.revokeObjectURL(url);

            toast.success('Preset exported!');
        } catch (error) {
            toast.error('Export failed');
        }
    };

    const handleImport = () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.onchange = (e) => {
            const file = (e.target as HTMLInputElement).files?.[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = (event) => {
                try {
                    const json = event.target?.result as string;
                    const imported = importPresetJSON(json);

                    toast.success('Preset imported!');
                    onSave(imported.id);
                    onClose();
                } catch (error) {
                    toast.error('Import failed', {
                        description: (error as Error).message
                    });
                }
            };
            reader.readAsText(file);
        };
        input.click();
    };

    // Calculate changes from current preset
    const hasChanges = Object.keys(weights).some(
        key => weights[key] !== currentPreset.weights[key]
    );

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="bg-linear-to-br from-indigo-950 via-purple-950 to-slate-950 border border-white/20 rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
                {/* Header */}
                <div className="flex justify-between items-center p-4 border-b border-white/10">
                    <div>
                        <h2 className="text-2xl font-bold text-white fantasy-glow-arcane">⚙️ Weight Editor</h2>
                        <p className="text-sm text-gray-400 mt-1">
                            Editing: <span className="text-purple-400">{currentPreset.name}</span>
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-white hover:text-gray-300 text-2xl"
                    >
                        ×
                    </button>
                </div>

                {/* Content */}
                <div className="p-4 overflow-y-auto max-h-[calc(90vh-200px)]">
                    {/* Stat Groups */}
                    <div className="space-y-4">
                        {Object.entries(STAT_GROUPS).map(([groupKey, group]) => (
                            <div key={groupKey} className="fantasy-glass rounded-lg p-4">
                                <h3 className="text-lg font-bold text-white mb-3">{group.label}</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {group.stats.map(stat => {
                                        const current = weights[stat] || 1;
                                        const defaultVal = defaultWeights[stat] || 1;
                                        const changed = current !== currentPreset.weights[stat];
                                        const isDefault = current === defaultVal;

                                        return (
                                            <div key={stat} className={`p-3 rounded border ${changed ? 'bg-yellow-900/20 border-yellow-500/30' : 'bg-white/5 border-white/10'
                                                }`}>
                                                <div className="flex justify-between items-center mb-2">
                                                    <label className="text-sm text-gray-300 font-semibold">
                                                        {STAT_LABELS[stat] || stat}
                                                    </label>
                                                    {!isDefault && (
                                                        <button
                                                            onClick={() => handleResetStat(stat)}
                                                            className="text-xs text-yellow-400 hover:text-yellow-300"
                                                            title={`Reset to default (${defaultVal})`}
                                                        >
                                                            ↺ Default
                                                        </button>
                                                    )}
                                                </div>
                                                <div className="flex gap-2 items-center">
                                                    <input
                                                        type="number"
                                                        value={current}
                                                        onChange={(e) => handleWeightChange(stat, Number(e.target.value))}
                                                        min="0.01"
                                                        step="0.1"
                                                        className="flex-1 bg-white/10 border border-white/20 rounded px-2 py-1 text-white text-sm font-mono focus:outline-none focus:border-purple-500/50"
                                                    />
                                                    {changed && (
                                                        <span className="text-xs text-yellow-400">
                                                            (was {currentPreset.weights[stat]?.toFixed(2) || '?'})
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Save Section */}
                    <div className="fantasy-glass rounded-lg p-4 mt-4">
                        <h3 className="text-lg font-bold text-white mb-3">💾 Save as New Preset</h3>
                        <div className="space-y-3">
                            <div>
                                <label className="block text-sm text-gray-400 mb-1">Preset Name</label>
                                <input
                                    type="text"
                                    value={presetName}
                                    onChange={(e) => setPresetName(e.target.value)}
                                    placeholder="My Custom Preset"
                                    className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-white focus:outline-none focus:border-purple-500/50"
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-gray-400 mb-1">Description (optional)</label>
                                <textarea
                                    value={presetDescription}
                                    onChange={(e) => setPresetDescription(e.target.value)}
                                    placeholder="Describe your weight changes..."
                                    rows={2}
                                    className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-white focus:outline-none focus:border-purple-500/50"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-white/10 flex flex-wrap gap-2 justify-between">
                    <div className="flex gap-2">
                        <button
                            onClick={handleResetAll}
                            className="px-4 py-2 bg-white/10 hover:bg-white/15 border border-white/20 text-white rounded transition-colors"
                        >
                            ↺ Reset All
                        </button>
                        <button
                            onClick={handleImport}
                            className="px-4 py-2 bg-cyan-600/30 hover:bg-cyan-600/50 border border-cyan-500/30 text-white rounded transition-colors"
                        >
                            📥 Import
                        </button>
                        <button
                            onClick={handleExport}
                            className="px-4 py-2 bg-cyan-600/30 hover:bg-cyan-600/50 border border-cyan-500/30 text-white rounded transition-colors"
                        >
                            📤 Export
                        </button>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 bg-white/10 hover:bg-white/15 border border-white/20 text-white rounded transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSaveAsNew}
                            disabled={!hasChanges || !presetName.trim()}
                            className="px-4 py-2 bg-linear-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded transition-all"
                        >
                            💾 Save as New Preset
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
