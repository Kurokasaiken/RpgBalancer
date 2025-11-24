import React, { useState } from 'react';
import type { Spell } from '../../balancing/spellTypes';
import { createEmptySpell } from '../../balancing/spellTypes';
import {
    calculateSpellBudget,
    getStatWeight,
    getStatRange,
    getStatDescription,
    isMalus,
    SPELL_CONFIG
} from '../../balancing/spellBalancingConfig';
import { upsertSpell } from '../../balancing/spellStorage';
import { Tooltip } from '../components/Tooltip';

export const SpellCreation: React.FC = () => {
    const [spell, setSpell] = useState<Spell>(createEmptySpell());
    const [customWeights, setCustomWeights] = useState<Record<string, number>>({});

    const cost = calculateSpellBudget(spell, Object.keys(customWeights).length > 0 ? customWeights : undefined);

    const updateField = (field: keyof Spell, value: any) => {
        setSpell(prev => ({ ...prev, [field]: value }));
    };

    const updateWeight = (field: string, value: number) => {
        setCustomWeights(prev => ({ ...prev, [field]: value }));
    };

    const getEffectiveWeight = (field: string): number => {
        return customWeights[field] !== undefined ? customWeights[field] : getStatWeight(field);
    };

    const handleSave = () => {
        const finalSpell = { ...spell, spellLevel: Math.round(cost) };
        upsertSpell(finalSpell);
        alert(`Spell "${finalSpell.name}" saved!`);
        setSpell(createEmptySpell());
        setCustomWeights({});
    };

    const handleReset = () => {
        setSpell(createEmptySpell());
        setCustomWeights({});
    };

    const coreStats = ['effect', 'cooldown', 'eco', 'aoe', 'dangerous', 'pierce'];
    const advancedStats = ['castTime', 'range', 'priority', 'scale', 'manaCost', 'duration'];
    const specialStats = ['charges', 'channel', 'reflection', 'maxStacks'];

    return (
        <div className="h-full overflow-y-auto bg-gray-900 p-4">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-6">
                    <h1 className="text-3xl font-bold text-white mb-2">🔮 Spell Creation</h1>
                    <p className="text-gray-400 text-sm">
                        Create balanced spells by adjusting stats until <strong>Cost = 0</strong>
                    </p>
                </div>

                {/* Cost Display */}
                <div className={`mb-6 p-4 rounded-xl border-2 flex items-center justify-between ${Math.abs(cost) < 0.5 ? 'bg-green-900/20 border-green-500' :
                    cost < 0 ? 'bg-red-900/20 border-red-500' :
                        'bg-yellow-900/20 border-yellow-500'
                    }`}>
                    <div>
                        <div className="text-sm text-gray-400">Total Cost</div>
                        <div className={`text-4xl font-bold ${Math.abs(cost) < 0.5 ? 'text-green-400' :
                            cost < 0 ? 'text-red-400' : 'text-yellow-400'
                            }`}>
                            {cost.toFixed(2)}
                        </div>
                    </div>
                    <div className="text-right">
                        <div className="text-2xl mb-1">
                            {Math.abs(cost) < 0.5 ? '✓' : cost < 0 ? '⚠️' : '⚠️'}
                        </div>
                        <div className="text-sm">
                            {Math.abs(cost) < 0.5 ? 'Balanced!' : cost < 0 ? 'Too Expensive' : 'Too Cheap'}
                        </div>
                    </div>
                </div>

                {/* Spell Info */}
                <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm text-gray-400 mb-1">Spell Name</label>
                        <input
                            type="text"
                            value={spell.name}
                            onChange={(e) => updateField('name', e.target.value)}
                            className="w-full bg-gray-800 text-white px-4 py-2 rounded border border-gray-700 focus:border-blue-500 outline-none"
                            placeholder="Enter spell name..."
                        />
                    </div>
                    <div>
                        <label className="block text-sm text-gray-400 mb-1">Type</label>
                        <select
                            value={spell.type}
                            onChange={(e) => updateField('type', e.target.value)}
                            className="w-full bg-gray-800 text-white px-4 py-2 rounded border border-gray-700 focus:border-blue-500 outline-none"
                        >
                            <option value="damage">Damage</option>
                            <option value="heal">Heal</option>
                            <option value="shield">Shield</option>
                            <option value="buff">Buff</option>
                            <option value="debuff">Debuff</option>
                            <option value="cc">Crowd Control</option>
                        </select>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 mb-6">
                    {/* Core Stats */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-bold text-blue-400 border-b border-gray-700 pb-2">Core Stats</h3>
                        {coreStats.map(field => (
                            <EnhancedStatSlider
                                key={field}
                                field={field}
                                value={(spell as any)[field] || 0}
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
                    <div className="space-y-4">
                        <h3 className="text-lg font-bold text-purple-400 border-b border-gray-700 pb-2">Advanced Stats</h3>
                        {advancedStats.map(field => (
                            <EnhancedStatSlider
                                key={field}
                                field={field}
                                value={(spell as any)[field] || 0}
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

                    {/* Special Stats */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-bold text-yellow-400 border-b border-gray-700 pb-2">Special Stats</h3>
                        {specialStats.map(field => (
                            <EnhancedStatSlider
                                key={field}
                                field={field}
                                value={(spell as any)[field] || 0}
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

                {/* Additional Fields */}
                <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* CC Effect (only for type cc) */}
                    {spell.type === 'cc' && (
                        <div>
                            <label className="block text-sm text-gray-400 mb-1">CC Effect</label>
                            <select
                                value={spell.ccEffect || ''}
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
                            value={spell.reflection ?? 0}
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
                            value={spell.manaCost ?? 0}
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
                            value={spell.duration ?? 0}
                            onChange={e => updateField('duration', Number(e.target.value) || undefined)}
                            className="w-full bg-gray-800 text-white px-4 py-2 rounded border border-gray-700 focus:border-blue-500 outline-none"
                        />
                    </div>
                    {/* Damage Type */}
                    <div>
                        <label className="block text-sm text-gray-400 mb-1">Damage Type</label>
                        <select
                            value={spell.damageType || ''}
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
                            checked={spell.legendary ?? false}
                            onChange={e => updateField('legendary', e.target.checked)}
                            className="mr-2"
                        />
                        <label className="text-sm text-gray-400">Legendary (ignore zero‑cost rule)</label>
                    </div>
                    {/* Double Spell */}
                    <div className="flex items-center">
                        <input
                            type="checkbox"
                            checked={spell.doubleSpell ?? false}
                            onChange={e => updateField('doubleSpell', e.target.checked)}
                            className="mr-2"
                        />
                        <label className="text-sm text-gray-400">Double Spell</label>
                    </div>
                    {/* Scaling Stat */}
                    <div>
                        <label className="block text-sm text-gray-400 mb-1">Scaling Stat</label>
                        <select
                            value={spell.scalingStat || ''}
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
                        <label className="block text-sm text-gray-400 mb-1">Tags (comma‑separated)</label>
                        <input
                            type="text"
                            value={(spell.tags || []).join(', ')}
                            onChange={e => updateField('tags', e.target.value.split(',').map(t => t.trim()).filter(t => t))}
                            className="w-full bg-gray-800 text-white px-4 py-2 rounded border border-gray-700 focus:border-blue-500 outline-none"
                        />
                    </div>
                    {/* Situational Modifiers (JSON textarea) */}
                    <div className="col-span-2">
                        <label className="block text-sm text-gray-400 mb-1">Situational Modifiers (JSON array)</label>
                        <textarea
                            rows={4}
                            value={JSON.stringify(spell.situationalModifiers || [], null, 2)}
                            onChange={e => {
                                try {
                                    const parsed = JSON.parse(e.target.value);
                                    updateField('situationalModifiers', parsed);
                                } catch {
                                    // ignore invalid JSON
                                }
                            }}
                            className="w-full bg-gray-800 text-white px-4 py-2 rounded border border-gray-700 focus:border-blue-500 outline-none"
                        />
                    </div>
                </div>
                {/* Actions */}
                <div className="flex justify-between items-center border-t border-gray-700 pt-4">
                    <button
                        onClick={handleReset}
                        className="px-6 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded transition"
                    >
                        Reset
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={Math.abs(cost) > 1}
                        className={`px-8 py-3 rounded font-bold text-lg transition ${Math.abs(cost) > 1
                            ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                            : 'bg-green-600 hover:bg-green-500 text-white shadow-lg'
                            }`}
                    >
                        {Math.abs(cost) > 1 ? 'Balance Required (Cost ≠ 0)' : 'Save Spell'}
                    </button>
                </div>
            </div>
        </div>
    );
};

// Enhanced Stat Slider with tick labels
interface EnhancedStatSliderProps {
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

const EnhancedStatSlider: React.FC<EnhancedStatSliderProps> = ({
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

    // Generate tick positions
    const ticks: number[] = [];
    for (let v = range.min; v <= range.max; v += range.step) {
        ticks.push(v);
    }

    // Limit ticks if too many
    const displayTicks = ticks.length > 20 ?
        ticks.filter((_, i) => i % Math.ceil(ticks.length / 10) === 0) :
        ticks;

    return (
        <div className="bg-gray-800/50 rounded-lg p-3 border border-gray-700">
            {/* Header */}
            <div className="flex justify-between items-center mb-2">
                <Tooltip content={description}>
                    <label className="text-sm font-medium text-gray-300 cursor-help">
                        {field.charAt(0).toUpperCase() + field.slice(1).replace(/([A-Z])/g, ' $1')}
                        {isMalus && <span className="text-yellow-400 ml-1">⚠️</span>}
                    </label>
                </Tooltip>
                <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-white">
                        {value.toFixed(range.step < 1 ? 1 : 0)}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded font-mono ${Math.abs(cost) < 0.01 ? 'bg-gray-700 text-gray-400' :
                        cost < 0 ? 'bg-green-900/70 text-green-300' : 'bg-red-900/70 text-red-300'
                        }`}>
                        {cost >= 0 ? '+' : ''}{cost.toFixed(1)}
                    </span>
                </div>
            </div>

            {/* Slider with tick labels */}
            <div className="relative">
                <input
                    type="range"
                    min={range.min}
                    max={range.max}
                    step={range.step}
                    value={value}
                    onChange={(e) => onValueChange(Number(e.target.value))}
                    className="w-full accent-blue-500"
                />

                {/* Tick Labels */}
                <div className="flex justify-between text-[9px] text-gray-500 mt-0.5 px-1">
                    {displayTicks.map((tick, i) => (
                        <span
                            key={i}
                            className={tick === baseline ? 'text-blue-400 font-bold' : ''}
                            title={tick === baseline ? 'Baseline' : undefined}
                        >
                            {tick.toFixed(range.step < 1 ? 1 : 0)}
                        </span>
                    ))}
                </div>
            </div>

            {/* Weight Control */}
            <div className="flex items-center gap-2 mt-2 text-xs">
                <span className="text-gray-500">Weight:</span>
                <input
                    type="number"
                    value={weight}
                    onChange={(e) => onWeightChange(Number(e.target.value))}
                    step={0.1}
                    className={`w-16 bg-gray-700 text-gray-300 px-2 py-1 rounded ${isCustomWeight ? 'border border-purple-400' : ''
                        }`}
                />
                {isCustomWeight && (
                    <button
                        onClick={() => onWeightChange(defaultWeight)}
                        className="text-purple-400 hover:text-purple-300"
                        title="Reset to default weight"
                    >
                        ↻
                    </button>
                )}
            </div>
        </div>
    );
};
