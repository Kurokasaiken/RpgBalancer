import React, { useEffect, useState } from 'react';
import type { Spell } from '../../balancing/spellTypes';
import { loadSpells, deleteSpell } from '../../balancing/spellStorage';
import { Tooltip } from '../components/Tooltip';
import { STAT_DESCRIPTIONS } from '../../data/tooltips';
import { SpellEditor } from './SpellEditor';
import { BASELINE_STATS } from '../../balancing/baseline';

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
        const damageBase = BASELINE_STATS.damage;
        const effectPercent = spell.effect / 100;
        const totalDamage = effectPercent * damageBase * spell.eco;
        return totalDamage.toFixed(1);
    };

    return (
        <div className="h-full overflow-y-auto bg-gradient-to-br from-indigo-950 via-purple-950 to-slate-950 p-4 relative">
            {/* Animated background particles */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute w-96 h-96 bg-purple-500/10 rounded-full blur-3xl top-10 -left-20 animate-pulse" />
                <div className="absolute w-96 h-96 bg-blue-500/10 rounded-full blur-3xl bottom-10 -right-20 animate-pulse" style={{ animationDelay: '1s' }} />
            </div>
            <div className="flex h-full gap-4 relative z-10">
                {/* Left: Spell List */}
                <div className="w-1/3 backdrop-blur-md bg-white/5 border border-white/10 rounded-xl overflow-hidden flex flex-col shadow-[0_4px_16px_rgba(0,0,0,0.3)]">
                    <div className="p-4 border-b border-white/10 bg-white/5">
                        <h2 className="text-2xl font-bold text-white drop-shadow-[0_0_8px_rgba(168,85,247,0.6)]">📚 Spell Library</h2>
                        <button
                            onClick={() => setIsEditing(true)}
                            className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:shadow-[0_0_16px_rgba(52,211,153,0.6)] text-white text-sm font-bold rounded mt-3 inline-block transition-all"
                        >
                            + New Spell
                        </button>
                    </div>
                    <div className="p-3 bg-white/5 text-xs text-gray-300 border-b border-white/10">
                        {spells.length} spells available
                    </div>
                    <div className="flex-1 overflow-y-auto p-2 space-y-2">
                        {spells.map(spell => (
                            <div
                                key={spell.id}
                                onClick={() => setSelectedSpell(spell)}
                                className={`p-3 rounded-lg cursor-pointer transition-all border hover:scale-[1.01] ${selectedSpell?.id === spell.id
                                    ? 'bg-blue-950/30 border-blue-400 shadow-[0_0_12px_rgba(96,165,250,0.4)]'
                                    : 'bg-white/5 border-white/10 hover:border-purple-400/30'
                                    }`}
                            >
                                <div className="flex justify-between items-center mb-1">
                                    <span className={`font-bold ${getTypeColor(spell.type)}`}>{spell.name}</span>
                                    <span className="text-xs text-gray-400 bg-white/10 px-2 py-0.5 rounded">Lvl {spell.spellLevel}</span>
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
                        <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-xl p-6 h-full overflow-y-auto shadow-[0_4px_16px_rgba(0,0,0,0.3)]">
                            <div className="flex justify-between items-start mb-8">
                                <div>
                                    <h1 className="text-3xl font-bold text-white mb-2 drop-shadow-[0_0_8px_rgba(96,165,250,0.6)]">{selectedSpell.name}</h1>
                                    <p className="text-gray-400 italic max-w-lg">{selectedSpell.description}</p>
                                </div>
                                <div className={`px-4 py-2 rounded-full text-sm font-bold border ${getTypeColor(selectedSpell.type)} bg-opacity-10`}>
                                    {selectedSpell.type.toUpperCase()}
                                </div>
                            </div>

                            {/* Key Stats Cards */}
                            <div className="grid grid-cols-3 gap-4 mb-6">
                                <div className="backdrop-blur-md bg-white/5 border border-white/10 p-4 rounded hover:scale-[1.02] transition-all">
                                    <div className="text-gray-400 text-sm mb-1">Level</div>
                                    <div className="text-2xl font-bold text-white">{selectedSpell.spellLevel}</div>
                                </div>
                                <div className="backdrop-blur-md bg-white/5 border border-white/10 p-4 rounded hover:scale-[1.02] transition-all">
                                    <div className="text-gray-400 text-sm mb-1">Base Effect</div>
                                    <div className="text-2xl font-bold text-white">{selectedSpell.effect}%</div>
                                </div>
                                <div className="backdrop-blur-md bg-white/5 border border-white/10 p-4 rounded hover:scale-[1.02] transition-all">
                                    <div className="text-gray-400 text-sm mb-1">Avg Damage (effect% × base × eco)</div>
                                    <div className="text-2xl font-bold text-green-400">{getAvgDamage(selectedSpell)}</div>
                                    <div className="text-xs text-gray-500">base = {BASELINE_STATS.damage}, eco = {selectedSpell.eco}</div>
                                </div>
                            </div>

                            {/* Detailed Stats */}
                            <div className="backdrop-blur-md bg-white/5 border border-white/10 p-4 rounded mb-6">
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
                                        <span className="text-white font-bold">{selectedSpell.precision}%</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-400">Pierce:</span>
                                        <span className="text-white font-bold">{selectedSpell.dangerous}%</span>
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
                                    className="flex-1 bg-gradient-to-r from-blue-500 to-cyan-500 hover:shadow-[0_0_16px_rgba(59,130,246,0.6)] text-white py-3 rounded-lg font-bold transition-all"
                                >
                                    Edit Spell
                                </button>
                                <button
                                    onClick={() => handleDelete(selectedSpell.id)}
                                    className="px-6 py-3 bg-white/10 border border-red-400/50 hover:bg-red-950/30 hover:shadow-[0_0_12px_rgba(248,113,113,0.4)] text-red-400 rounded-lg font-bold transition-all"
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
                        spellId={selectedSpell.id}
                        onClose={() => {
                            setIsEditing(false);
                            refresh();
                        }}
                    />
                )}
            </div>
        </div>
    );
};
