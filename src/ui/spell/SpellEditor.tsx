import React, { useState, useEffect } from 'react';
import type { Spell } from '../../balancing/spellTypes';
import { upsertSpell, loadSpells } from '../../balancing/spellStorage';
import { Tooltip } from '../components/Tooltip';
import { SpellCostModule } from '../../balancing/modules/spellcost';
import { SPELL_CONFIG, getStatWeight, getStatRange, getStatDescription, isMalus } from '../../balancing/spellBalancingConfig';

interface SpellEditorProps {
    spellId: string;
    onClose: () => void;
}

export const SpellEditor: React.FC<SpellEditorProps> = ({ spellId, onClose }) => {
    const [editedSpell, setEditedSpell] = useState<Spell | null>(null);
    const [customWeights, setCustomWeights] = useState<Record<string, number>>({});

    // Calculate spell power and recommended mana cost
    const powerBreakdown = editedSpell ? SpellCostModule.calculateSpellPower(editedSpell) : null;
    const recommendedMana = editedSpell ? SpellCostModule.calculateManaCost(editedSpell) : 0;
    const isBalanced = editedSpell ? SpellCostModule.isBalanced(editedSpell) : false;
    const budget = powerBreakdown ? powerBreakdown.totalPower - (editedSpell?.manaCost || 0) * 2.0 : 0;

    useEffect(() => {
        // Load spell based on spellId
        const loadedSpells = loadSpells();
        const foundSpell = loadedSpells.find(s => s.id === spellId);
        if (foundSpell) {
            setEditedSpell(foundSpell);
        } else {
            onClose();
        }
    }, [spellId, onClose]);


    const updateField = (field: keyof Spell, value: any) => {
        setEditedSpell(prev => prev ? ({ ...prev, [field]: value }) : null);
    };

    const updateWeight = (field: string, value: number) => {
        setCustomWeights(prev => ({ ...prev, [field]: value }));
    };

    const resetWeights = () => {
        setCustomWeights({});
    };

    const handleSave = () => {
        if (!editedSpell) return;
        const finalSpell = { ...editedSpell, spellLevel: Math.round(budget) };
        upsertSpell(finalSpell);
        onClose();
    };

    const handleReset = () => {
        // Reload original spell
        const loadedSpells = loadSpells();
        const foundSpell = loadedSpells.find(s => s.id === spellId);
        if (foundSpell) {
            setEditedSpell(foundSpell);
        }
        setCustomWeights({});
    };

    const getEffectiveWeight = (field: string): number => {
        return customWeights[field] !== undefined ? customWeights[field] : getStatWeight(field);
    };

    if (!editedSpell) return null;

    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div
                className="bg-gray-900 rounded-xl border border-gray-700 w-full max-w-6xl max-h-[90vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="p-4 border-b border-gray-800 flex justify-between items-center bg-gray-800 sticky top-0 z-10">
                    <div className="flex-1">
                        <h2 className="text-xl font-bold text-white mb-2">Edit Spell</h2>
                        <input
                            type="text"
                            value={editedSpell.name}
                            onChange={(e) => updateField('name', e.target.value)}
                            className="text-xl font-bold text-white bg-transparent border-b border-gray-600 focus:border-blue-500 outline-none max-w-md"
                            placeholder="Spell Name"
                        />
                        <div className="text-xs text-gray-400 mt-1">
                            Type:
                            <select
                                value={editedSpell.type}
                                onChange={(e) => updateField('type', e.target.value)}
                                className="ml-2 bg-gray-700 text-white px-2 py-0.5 rounded text-xs"
                            >
                                <option value="damage">Damage</option>
                                <option value="heal">Heal</option>
                                <option value="shield">Shield</option>
                                <option value="buff">Buff</option>
                                <option value="debuff">Debuff</option>
                                <option value="cc">CC</option>
                            </select>
                        </div>
                    </div>

                    {/* Power Display */}
                    <div className="flex gap-4">
                        {/* HP-Equivalent Power */}
                        <div className="text-center">
                            <div className="text-xs text-gray-400 mb-1">Spell Power</div>
                            <div className="text-2xl font-bold text-cyan-400">
                                {powerBreakdown?.totalPower.toFixed(1)}
                            </div>
                            <div className="text-[10px] text-gray-500">HP-equivalent</div>
                        </div>

                        {/* Recommended Mana */}
                        <div className="text-center">
                            <div className="text-xs text-gray-400 mb-1">Recommended</div>
                            <div className={`text-2xl font-bold ${editedSpell.manaCost === recommendedMana ? 'text-green-400' :
                                    Math.abs((editedSpell.manaCost || 0) - recommendedMana) <= 2 ? 'text-yellow-400' :
                                        'text-red-400'
                                }`}>
                                {recommendedMana}
                            </div>
                            <div className="text-[10px] text-gray-500">mana</div>
                        </div>

                        {/* Balance Status */}
                        <div className={`px-4 py-2 rounded font-bold text-lg ${isBalanced ? 'bg-green-900 text-green-200' :
                                budget < 0 ? 'bg-red-900 text-red-200' :
                                    'bg-yellow-900 text-yellow-200'
                            }`}>
                            {isBalanced ? '✓ Balanced' : budget < 0 ? 'Overpriced' : 'Underpriced'}
                            <div className="text-xs font-normal">
                                Budget: {budget.toFixed(1)}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="p-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {/* Core Stats */}
                    <div className="space-y-3">
                        <h3 className="text-lg font-bold text-blue-400 border-b border-gray-700 pb-2">Core Stats</h3>
                        {['effect', 'cooldown', 'eco', 'aoe', 'dangerous', 'pierce'].map(field => (
                            <StatSlider
                                key={field}
                                field={field}
                                value={(editedSpell as any)[field] || 0}
                                baseline={(SPELL_CONFIG.baseline as any)[field] || 0}
                                range={getStatRange(field)}
                                weight={getEffectiveWeight(field)}
                                defaultWeight={getStatWeight(field)}
                                description={getStatDescription(field)}
                                isMalus={isMalus(field)}
                                onValueChange={(v) => updateField(field as keyof Spell, v)}
                                onWeightChange={(w) => updateWeight(field, w)}
                            />
                        ))}
                    </div>

                    {/* Advanced Stats */}
                    <div className="space-y-3">
                        <h3 className="text-lg font-bold text-purple-400 border-b border-gray-700 pb-2">Advanced Stats</h3>
                        {['castTime', 'range', 'priority'].map(field => (
                            <StatSlider
                                key={field}
                                field={field}
                                value={(editedSpell as any)[field] || 0}
                                baseline={(SPELL_CONFIG.baseline as any)[field] || 0}
                                range={getStatRange(field)}
                                weight={getEffectiveWeight(field)}
                                defaultWeight={getStatWeight(field)}
                                description={getStatDescription(field)}
                                isMalus={isMalus(field)}
                                onValueChange={(v) => updateField(field as keyof Spell, v)}
                                onWeightChange={(w) => updateWeight(field, w)}
                            />
                        ))}
                    </div>
                </div>

                {/* Additional Options */}
                <div className="px-4 pb-4 space-y-2">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                        <label className="flex items-center gap-2 text-gray-300">
                            <input
                                type="checkbox"
                                checked={editedSpell.isPassive || false}
                                onChange={(e) => updateField('isPassive', e.target.checked)}
                                className="accent-blue-500"
                            />
                            Passive
                        </label>
                    </div>

                    <textarea
                        value={editedSpell.description || ''}
                        onChange={(e) => updateField('description', e.target.value)}
                        placeholder="Spell description..."
                        className="w-full bg-gray-800 text-white px-3 py-2 rounded border border-gray-700 text-sm"
                        rows={2}
                    />
                </div>

                {/* Weight Controls */}
                <div className="px-4 pb-4 flex justify-end">
                    {Object.keys(customWeights).length > 0 && (
                        <button
                            onClick={resetWeights}
                            className="px-3 py-2 bg-purple-700 hover:bg-purple-600 text-white rounded transition text-sm"
                        >
                            Reset Weights
                        </button>
                    )}
                </div>

                {/* Additional Fields */}
                <div className="mb-6 px-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* CC Effect (only for type cc) */}
                    {editedSpell.type === 'cc' && (
                        <div>
                            <label className="block text-sm text-gray-400 mb-1">CC Effect</label>
                            <select
                                value={editedSpell.ccEffect || ''}
                                onChange={e => updateField('ccEffect', e.target.value || undefined)}
                                className="w-full bg-gray-800 text-white px-4 py-2 rounded border border-gray-700 focus:border-blue-500 outline-none"
                            >
                                <option value="">None</option>
                                <option value="stun">Stun</option>
                                <option value="slow">Slow</option>
                                <option value="knockback">Knockback</option>
                                <option value="silence">Silence</option>
                            </select>
                        </div>
                    )}
                    {/* Reflection */}
                    <div>
                        <label className="block text-sm text-gray-400 mb-1">Reflection %</label>
                        <input
                            type="number"
                            min={0}
                            max={100}
                            value={editedSpell.reflection ?? 0}
                            onChange={e => updateField('reflection', Number(e.target.value) || undefined)}
                            className="w-full bg-gray-800 text-white px-4 py-2 rounded border border-gray-700 focus:border-blue-500 outline-none"
                        />
                    </div>
                    {/* Mana Cost */}
                    <div>
                        <label className="block text-sm text-gray-400 mb-1">Mana Cost</label>
                        <input
                            type="number"
                            min={0}
                            max={200}
                            value={editedSpell.manaCost ?? 0}
                            onChange={e => updateField('manaCost', Number(e.target.value) || undefined)}
                            className="w-full bg-gray-800 text-white px-4 py-2 rounded border border-gray-700 focus:border-blue-500 outline-none"
                        />
                    </div>
                    {/* Duration */}
                    <div>
                        <label className="block text-sm text-gray-400 mb-1">Duration (s)</label>
                        <input
                            type="number"
                            min={0}
                            value={editedSpell.duration ?? 0}
                            onChange={e => updateField('duration', Number(e.target.value) || undefined)}
                            className="w-full bg-gray-800 text-white px-4 py-2 rounded border border-gray-700 focus:border-blue-500 outline-none"
                        />
                    </div>
                    {/* Damage Type */}
                    <div>
                        <label className="block text-sm text-gray-400 mb-1">Damage Type</label>
                        <select
                            value={editedSpell.damageType || ''}
                            onChange={e => updateField('damageType', e.target.value || undefined)}
                            className="w-full bg-gray-800 text-white px-4 py-2 rounded border border-gray-700 focus:border-blue-500 outline-none"
                        >
                            <option value="">None</option>
                            <option value="physical">Physical</option>
                            <option value="magical">Magical</option>
                            <option value="true">True</option>
                        </select>
                    </div>
                    {/* Legendary */}
                    <div className="flex items-center">
                        <input
                            type="checkbox"
                            checked={editedSpell.legendary ?? false}
                            onChange={e => updateField('legendary', e.target.checked)}
                            className="mr-2"
                        />
                        <label className="text-sm text-gray-400">Legendary (ignore zero-cost rule)</label>
                    </div>
                    {/* Double Spell */}
                    <div className="flex items-center">
                        <input
                            type="checkbox"
                            checked={editedSpell.doubleSpell ?? false}
                            onChange={e => updateField('doubleSpell', e.target.checked)}
                            className="mr-2"
                        />
                        <label className="text-sm text-gray-400">Double Spell</label>
                    </div>
                    {/* Scaling Stat */}
                    <div>
                        <label className="block text-sm text-gray-400 mb-1">Scaling Stat</label>
                        <select
                            value={editedSpell.scalingStat || ''}
                            onChange={e => updateField('scalingStat', e.target.value || undefined)}
                            className="w-full bg-gray-800 text-white px-4 py-2 rounded border border-gray-700 focus:border-blue-500 outline-none"
                        >
                            <option value="">None</option>
                            <option value="attack">Attack</option>
                            <option value="magic">Magic</option>
                            <option value="health">Health</option>
                            <option value="mana">Mana</option>
                            <option value="defense">Defense</option>
                        </select>
                    </div>
                    {/* Tags */}
                    <div>
                        <label className="block text-sm text-gray-400 mb-1">Tags (comma-separated)</label>
                        <input
                            type="text"
                            value={(editedSpell.tags || []).join(', ')}
                            onChange={e => updateField('tags', e.target.value.split(',').map(t => t.trim()).filter(t => t))}
                            className="w-full bg-gray-800 text-white px-4 py-2 rounded border border-gray-700 focus:border-blue-500 outline-none"
                        />
                    </div>
                    {/* Situational Modifiers */}
                    <div className="col-span-2">
                        <label className="block text-sm text-gray-400 mb-1">Situational Modifiers (JSON array)</label>
                        <textarea
                            rows={4}
                            value={JSON.stringify(editedSpell.situationalModifiers || [], null, 2)}
                            onChange={e => {
                                try {
                                    const parsed = JSON.parse(e.target.value);
                                    updateField('situationalModifiers', parsed);
                                } catch { }
                            }}
                            className="w-full bg-gray-800 text-white px-4 py-2 rounded border border-gray-700 focus:border-blue-500 outline-none"
                        />
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-gray-800 flex justify-between items-center bg-gray-800/50 sticky bottom-0">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded transition text-sm"
                    >
                        Cancel
                    </button>
                    <div className="flex gap-2">
                        <button
                            onClick={handleReset}
                            className="px-3 py-2 bg-yellow-700 hover:bg-yellow-600 text-white rounded transition text-sm"
                        >
                            Reset to Base
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={Math.abs(budget) > 1 && !editedSpell.legendary}
                            className={`px-6 py-2 rounded font-bold transition text-sm ${Math.abs(budget) > 1 && !editedSpell.legendary
                                ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                                : 'bg-green-600 hover:bg-green-500 text-white'
                                }`}
                        >
                            {Math.abs(budget) > 1 && !editedSpell.legendary ? 'Balance Required (Cost ≠ 0)' : 'Save Spell'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

// Stat Slider Component
interface StatSliderProps {
    field: string;
    value: number;
    baseline: number;
    range: { min: number; max: number; step: number };
    weight: number;
    defaultWeight: number;
    description: string;
    isMalus: boolean;
    onValueChange: (value: number) => void;
    onWeightChange: (weight: number) => void;
}

const StatSlider: React.FC<StatSliderProps> = ({
    field,
    value,
    baseline,
    range,
    weight,
    defaultWeight,
    description,
    isMalus,
    onValueChange,
    onWeightChange
}) => {
    const delta = value - baseline;
    const cost = delta * weight;
    const isCustomWeight = weight !== defaultWeight;

    return (
        <div className="bg-gray-800/50 rounded-lg p-2 border border-gray-700">
            <div className="flex justify-between items-center mb-1">
                <label className="text-xs text-gray-300 font-medium" title={description}>
                    {field.charAt(0).toUpperCase() + field.slice(1)}
                    {isMalus && <span className="text-yellow-400 ml-1 text-xs">⚠️</span>}
                </label>
                <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white">
                        {value.toFixed(2)}
                    </span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded ${Math.abs(cost) < 0.01 ? 'bg-gray-700 text-gray-400' :
                        cost < 0 ? 'bg-green-900/50 text-green-300' : 'bg-red-900/50 text-red-300'
                        }`}>
                        {cost > 0 ? '+' : ''}{cost.toFixed(1)}
                    </span>
                </div>
            </div>

            {/* Value Slider */}
            <input
                type="range"
                min={range.min}
                max={range.max}
                step={range.step}
                value={value}
                onChange={(e) => onValueChange(Number(e.target.value))}
                className="w-full accent-blue-500 h-1"
            />

            {/* Weight Control */}
            <div className="flex items-center gap-1 mt-1">
                <span className="text-[10px] text-gray-500">W:</span>
                <input
                    type="number"
                    value={weight}
                    onChange={(e) => onWeightChange(Number(e.target.value))}
                    step={0.1}
                    className={`w-12 bg-gray-700 text-gray-300 px-1 py-0.5 rounded text-[10px] ${isCustomWeight ? 'border border-purple-500' : ''
                        }`}
                />
                {isCustomWeight && (
                    <button
                        onClick={() => onWeightChange(defaultWeight)}
                        className="text-[10px] text-purple-400 hover:text-purple-300"
                        title="Reset weight"
                    >
                        ↻
                    </button>
                )}
            </div>
        </div>
    );
};
