import React, { useEffect, useState } from 'react';
import type { Spell } from '../../balancing/spellTypes';
import { loadSpells, deleteSpell, upsertSpell } from '../../balancing/spellStorage';
import { Tooltip } from '../components/Tooltip';
import { STAT_DESCRIPTIONS } from '../../data/tooltips';
import { SpellEditor } from './SpellEditor';

/** Enhanced Spell Library with detailed cards */
export const SpellLibrary: React.FC = () => {
    const [spells, setSpells] = useState<Spell[]>([]);
    const [selectedSpell, setSelectedSpell] = useState<Spell | null>(null);
    const [isEditing, setIsEditing] = useState(false);

    const refresh = () => {
        setSpells(loadSpells());
    };

    useEffect(() => {
        refresh();
    }, []);

    useEffect(() => {
        if (spells.length > 0 && !selectedSpell) {
            setSelectedSpell(spells[0]);
        }
    }, [spells, selectedSpell]);

    const handleDelete = (id: string) => {
        deleteSpell(id);
        refresh();
        if (selectedSpell?.id === id) {
            setSelectedSpell(null);
        }
    };

    const getTypeColor = (type: string) => {
        switch (type) {
            case 'damage': return 'text-red-400';
            case 'heal': return 'text-green-400';
            case 'shield': return 'text-blue-400';
            case 'buff': return 'text-yellow-400';
            case 'debuff': return 'text-purple-400';
            case 'cc': return 'text-orange-400';
            default: return 'text-gray-400';
        }
    };

    const getAvgDamage = (spell: Spell): string => {
        // Simplified calculation assuming base attack of 100
        const baseAttack = 100;
        const baseDamage = (spell.effect / 100) * baseAttack;
        const scaledDamage = baseDamage * (1 + spell.scale);
        const totalDamage = scaledDamage * spell.eco;
        const withSuccess = totalDamage * (spell.dangerous / 100);

        return withSuccess.toFixed(1);
    };

    return (
        <div className="flex h-full gap-6">
            {/* Left: Spell List */}
            <div className="w-1/3 bg-gray-900 rounded-xl border border-gray-800 overflow-hidden flex flex-col">
                <div className="p-4 border-b border-gray-800 bg-gray-800/50">
                    <h2 className="text-xl font-bold text-white">Spell Library</h2>
                    <button
                        onClick={() => setIsEditing(true)}
                        className="px-3 py-1 bg-green-600 hover:bg-green-500 text-white text-xs font-bold rounded mt-2 inline-block"
                    >
                        + New Spell
                    </button>
                </div>
                <div className="p-2 bg-gray-800/50 text-xs text-gray-400 border-b border-gray-800">
                    {spells.length} spells available
                </div>
                <div className="flex-1 overflow-y-auto p-2 space-y-2">
                    {spells.map(spell => (
                        <div
                            key={spell.id}
                            onClick={() => setSelectedSpell(spell)}
                            className={`p-3 rounded-lg cursor-pointer transition-all border ${selectedSpell?.id === spell.id
                                ? 'bg-blue-900/30 border-blue-500 shadow-lg shadow-blue-900/20'
                                : 'bg-gray-800 border-gray-700 hover:border-gray-500'
                                }`}
                        >
                            <div className="flex justify-between items-center mb-1">
                                <span className={`font-bold ${getTypeColor(spell.type)}`}>{spell.name}</span>
                                <span className="text-xs text-gray-500 bg-gray-900 px-2 py-0.5 rounded">Lvl {spell.spellLevel}</span>
                            </div>
                            <div className="flex justify-between text-xs text-gray-400">
                                <span>{spell.type}</span>
                                <span>CD: {spell.cooldown} turns</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Right: Spell Details */}
            <div className="w-2/3">
                {selectedSpell ? (
                    <div className="bg-gray-900 rounded-xl border border-gray-800 p-8 h-full overflow-y-auto">
                        <div className="flex justify-between items-start mb-8">
                            <div>
                                <h1 className="text-4xl font-bold text-white mb-2">{selectedSpell.name}</h1>
                                <p className="text-gray-400 italic max-w-lg">{selectedSpell.description}</p>
                            </div>
                            <div className={`px-4 py-2 rounded-full text-sm font-bold border ${getTypeColor(selectedSpell.type)} bg-opacity-10`}>
                                {selectedSpell.type.toUpperCase()}
                            </div>
                        </div>

                        {/* Key Stats Cards */}
                        <div className="grid grid-cols-3 gap-4 mb-6">
                            <div className="bg-gray-800 p-4 rounded">
                                <div className="text-gray-400 text-sm mb-1">Level</div>
                                <div className="text-2xl font-bold text-white">{selectedSpell.spellLevel}</div>
                            </div>
                            <div className="bg-gray-800 p-4 rounded">
                                <div className="text-gray-400 text-sm mb-1">Base Effect</div>
                                <div className="text-2xl font-bold text-white">{selectedSpell.effect}%</div>
                            </div>
                            <div className="bg-gray-800 p-4 rounded">
                                <div className="text-gray-400 text-sm mb-1">Avg Damage*</div>
                                <div className="text-2xl font-bold text-green-400">{getAvgDamage(selectedSpell)}</div>
                                <div className="text-xs text-gray-500">*base atk 100</div>
                            </div>
                        </div>

                        {/* Detailed Stats */}
                        <div className="bg-gray-800 p-4 rounded mb-6">
                            <h3 className="text-xl font-bold text-white mb-4">Statistics</h3>
                            <div className="grid grid-cols-2 gap-3 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-gray-400 cursor-help">
                                        <Tooltip content={STAT_DESCRIPTIONS.scale}>Scale:</Tooltip>
                                    </span>
                                    <span className="text-white font-bold">{selectedSpell.scale > 0 ? '+' : ''}{selectedSpell.scale}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-400 cursor-help">
                                        <Tooltip content={STAT_DESCRIPTIONS.cooldown}>Cooldown:</Tooltip>
                                    </span>
                                    <span className="text-white font-bold">{selectedSpell.cooldown}s</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-400 cursor-help">
                                        <Tooltip content={STAT_DESCRIPTIONS.manaCost}>Mana Cost:</Tooltip>
                                    </span>
                                    <span className="text-white font-bold">{selectedSpell.manaCost}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-400 cursor-help">
                                        <Tooltip content={STAT_DESCRIPTIONS.dangerous}>Dangerous:</Tooltip>
                                    </span>
                                    <span className="text-white font-bold">{selectedSpell.dangerous}%</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-400">Pierce:</span>
                                    <span className="text-white font-bold">{selectedSpell.pierce}%</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-400 cursor-help">
                                        <Tooltip content={STAT_DESCRIPTIONS.aoe}>AoE Targets:</Tooltip>
                                    </span>
                                    <span className="text-white font-bold">{selectedSpell.aoe}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-400 cursor-help">
                                        <Tooltip content={STAT_DESCRIPTIONS.duration}>Duration:</Tooltip>
                                    </span>
                                    <span className="text-white font-bold">{selectedSpell.eco} turns</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-400">Tags:</span>
                                    <span className="text-white font-bold">{selectedSpell.tags?.join(', ') || '-'}</span>
                                </div>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-4 mt-auto">
                            <button
                                onClick={() => setIsEditing(true)}
                                className="flex-1 bg-blue-600 hover:bg-blue-500 text-white py-3 rounded-lg font-bold transition-colors shadow-lg"
                            >
                                Edit Spell
                            </button>
                            <button
                                onClick={() => handleDelete(selectedSpell.id)}
                                className="px-6 py-3 bg-red-900/50 hover:bg-red-900 text-red-200 rounded-lg font-bold transition-colors border border-red-800"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="flex items-center justify-center h-full text-gray-500">
                        Select a spell to view details
                    </div>
                )}
            </div>

            {isEditing && selectedSpell && (
                <SpellEditor
                    spell={selectedSpell}
                    onCancel={() => setIsEditing(false)}
                    onSave={(updated) => {
                        upsertSpell(updated);
                        setSpells(loadSpells());
                        setSelectedSpell(updated);
                        setIsEditing(false);
                    }}
                />
            )}
        </div>
    );
};
