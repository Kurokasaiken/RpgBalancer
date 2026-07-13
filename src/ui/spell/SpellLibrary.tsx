import React, { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from 'react';
import { useTranslation } from '@/localization/useTranslation';
import type { Spell } from '@/balancing/spellTypes';
import { deleteSpell, loadSpellsAsync, saveSpells } from '@/balancing/spellStorage';
import { BASELINE_STATS } from '@/balancing/baseline';
import { SPELL_LIBRARY_PRESETS } from '@/balancing/config/spells/presets';
import { calculateAverageDamage, getSpellTypeColor, sortSpellsByName } from '@/balancing/spellCreator/SpellLibraryHelpers';
import { Tooltip } from '@/ui/components/Tooltip';
import { STAT_DESCRIPTIONS } from '@/data/tooltips';
import { SpellEditor } from './SpellEditor';
import {
    getSpellLibrarySnapshot,
    setSpellLibrarySnapshot,
    subscribeSpellLibrary,
} from './spellLibraryStore';

/** Enhanced Spell Library with detailed cards */
export const SpellLibrary: React.FC = () => {
    const { t } = useTranslation('spell');
    const spells = useSyncExternalStore(subscribeSpellLibrary, getSpellLibrarySnapshot, getSpellLibrarySnapshot);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [isEditing, setIsEditing] = useState(false);

    const seedFromPreset = useCallback(async (): Promise<Spell[]> => {
        const preset = SPELL_LIBRARY_PRESETS[0];
        if (!preset) {
            return [];
        }
        await saveSpells(preset.spells);
        return preset.spells;
    }, []);

    const refresh = useCallback(async () => {
        const hydrated = await loadSpellsAsync();
        const normalized = hydrated.length > 0 ? hydrated : await seedFromPreset();
        setSpellLibrarySnapshot(normalized);
    }, [seedFromPreset]);

    useEffect(() => {
        let mounted = true;
        (async () => {
            const hydrated = await loadSpellsAsync();
            if (!mounted) return;
            const normalized = hydrated.length > 0 ? hydrated : await seedFromPreset();
            setSpellLibrarySnapshot(normalized);
        })();
        return () => {
            mounted = false;
        };
    }, [seedFromPreset]);

    const handleDelete = useCallback(async (id: string) => {
        await deleteSpell(id);
        await refresh();
        setSelectedId((prev) => (prev === id ? null : prev));
    }, [refresh]);

    const orderedSpells = useMemo(() => sortSpellsByName(spells), [spells]);
    const selectedSpell = useMemo<Spell | null>(() => {
        if (orderedSpells.length === 0) {
            return null;
        }
        if (!selectedId) {
            return orderedSpells[0];
        }
        return orderedSpells.find((spell) => spell.id === selectedId) ?? orderedSpells[0];
    }, [orderedSpells, selectedId]);

    const openEditor = useCallback(() => {
        if (!selectedSpell && orderedSpells.length > 0) {
            setSelectedId(orderedSpells[0].id);
        }
        setIsEditing(true);
    }, [orderedSpells, selectedSpell]);

    const closeEditor = useCallback(async () => {
        setIsEditing(false);
        await refresh();
    }, [refresh]);

    return (
        <div className="h-full overflow-y-auto bg-linear-to-br from-indigo-950 via-purple-950 to-slate-950 p-4 relative">
            {/* Animated background particles */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute w-96 h-96 bg-purple-500/10 rounded-full blur-3xl top-10 -left-20 animate-pulse" />
                <div className="absolute w-96 h-96 bg-blue-500/10 rounded-full blur-3xl bottom-10 -right-20 animate-pulse" style={{ animationDelay: '1s' }} />
            </div>
            <div className="flex h-full gap-4 relative z-10">
                {/* Left: Spell List */}
                <div className="w-1/3 backdrop-blur-md bg-white/5 border border-white/10 rounded-xl overflow-hidden flex flex-col shadow-[0_4px_16px_rgba(0,0,0,0.3)]">
                    <div className="p-4 border-b border-white/10 bg-white/5">
                        <h2 className="text-2xl font-bold text-white drop-shadow-[0_0_8px_rgba(168,85,247,0.6)]">📚 {t('spell:library.title')}</h2>
                        <button
                            onClick={openEditor}
                            className="px-4 py-2 bg-linear-to-r from-emerald-500 to-teal-500 hover:shadow-[0_0_16px_rgba(52,211,153,0.6)] text-white text-sm font-bold rounded mt-3 inline-block transition-all"
                        >
                            + {t('spell:library.newSpell')}
                        </button>
                    </div>
                    <div className="p-3 bg-white/5 text-xs text-gray-300 border-b border-white/10">
                        {t('spell:library.availableCount', { count: orderedSpells.length })}
                    </div>
                    <div className="flex-1 overflow-y-auto p-2 space-y-2">
                        {orderedSpells.map(spell => (
                            <div
                                key={spell.id}
                                onClick={() => setSelectedId(spell.id)}
                                className={`p-3 rounded-lg cursor-pointer transition-all border hover:scale-[1.01] ${selectedSpell?.id === spell.id
                                    ? 'bg-blue-950/30 border-blue-400 shadow-[0_0_12px_rgba(96,165,250,0.4)]'
                                    : 'bg-white/5 border-white/10 hover:border-purple-400/30'
                                    }`}
                            >
                                <div className="flex justify-between items-center mb-1">
                                    <span className={`font-bold ${getSpellTypeColor(spell.type)}`}>{spell.name}</span>
                                </div>
                                <div className="flex justify-between text-xs text-gray-400">
                                    <span>{spell.type}</span>
                                    <span>{t('spell:library.cooldown', { value: spell.cooldown })}</span>
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
                                <div
                                    className={`px-4 py-2 rounded-full text-sm font-bold border ${getSpellTypeColor(selectedSpell.type)} bg-opacity-10`}
                                >
                                    {selectedSpell.type.toUpperCase()}
                                </div>
                            </div>

                            {/* Key Stats Cards */}
                            <div className="grid grid-cols-2 gap-4 mb-6">
                                <div className="backdrop-blur-md bg-white/5 border border-white/10 p-4 rounded hover:scale-[1.02] transition-all">
                                    <div className="text-gray-400 text-sm mb-1">{t('spell:library.baseEffect')}</div>
                                    <div className="text-2xl font-bold text-white">{selectedSpell.effect}%</div>
                                </div>
                                <div className="backdrop-blur-md bg-white/5 border border-white/10 p-4 rounded hover:scale-[1.02] transition-all">
                                    <div className="text-gray-400 text-sm mb-1">{t('spell:library.avgDamage')}</div>
                                    <div className="text-2xl font-bold text-green-400">{calculateAverageDamage(selectedSpell, BASELINE_STATS.damage).toFixed(1)}</div>
                                    <div className="text-xs text-gray-500">{t('spell:library.avgDamageFormula', { base: BASELINE_STATS.damage, eco: selectedSpell.eco })}</div>
                                </div>
                            </div>

                            {/* Detailed Stats */}
                            <div className="backdrop-blur-md bg-white/5 border border-white/10 p-4 rounded mb-6">
                                <h3 className="text-xl font-bold text-white mb-4">{t('spell:library.statistics')}</h3>
                                <div className="grid grid-cols-2 gap-3 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-gray-400 cursor-help">
                                            <Tooltip content={STAT_DESCRIPTIONS.scale}>{t('spell:stats.scale')}:</Tooltip>
                                        </span>
                                        <span className="text-white font-bold">{selectedSpell.scale > 0 ? '+' : ''}{selectedSpell.scale}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-400 cursor-help">
                                            <Tooltip content={STAT_DESCRIPTIONS.cooldown}>{t('spell:stats.cooldown')}:</Tooltip>
                                        </span>
                                        <span className="text-white font-bold">{selectedSpell.cooldown}s</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-400 cursor-help">
                                            <Tooltip content={STAT_DESCRIPTIONS.manaCost}>{t('spell:stats.manaCost')}:</Tooltip>
                                        </span>
                                        <span className="text-white font-bold">{selectedSpell.manaCost}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-400 cursor-help">
                                            <Tooltip content={STAT_DESCRIPTIONS.dangerous}>{t('spell:stats.dangerous')}:</Tooltip>
                                        </span>
                                        <span className="text-white font-bold">{selectedSpell.precision}%</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-400">{t('spell:stats.pierce')}:</span>
                                        <span className="text-white font-bold">{selectedSpell.dangerous}%</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-400 cursor-help">
                                            <Tooltip content={STAT_DESCRIPTIONS.aoe}>{t('spell:stats.aoe')}:</Tooltip>
                                        </span>
                                        <span className="text-white font-bold">{selectedSpell.aoe}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-400 cursor-help">
                                            <Tooltip content={STAT_DESCRIPTIONS.duration}>{t('spell:stats.duration')}:</Tooltip>
                                        </span>
                                        <span className="text-white font-bold">{selectedSpell.eco} turns</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-400">{t('spell:stats.tags')}:</span>
                                        <span className="text-white font-bold">{selectedSpell.tags?.join(', ') || '-'}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex gap-4 mt-auto">
                                <button
                                    onClick={openEditor}
                                    className="flex-1 bg-linear-to-r from-blue-500 to-cyan-500 hover:shadow-[0_0_16px_rgba(59,130,246,0.6)] text-white py-3 rounded-lg font-bold transition-all"
                                >
                                    {t('spell:library.editSpell')}
                                </button>
                                <button
                                    onClick={() => handleDelete(selectedSpell.id)}
                                    className="px-6 py-3 bg-white/10 border border-red-400/50 hover:bg-red-950/30 hover:shadow-[0_0_12px_rgba(248,113,113,0.4)] text-red-400 rounded-lg font-bold transition-all"
                                >
                                    {t('spell:library.delete')}
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-center justify-center h-full text-gray-500">
                            {t('spell:library.selectPrompt')}
                        </div>
                    )}
                </div>

                {isEditing && selectedSpell && (
                    <SpellEditor
                        spellId={selectedSpell.id}
                        onClose={() => { void closeEditor(); }}
                    />
                )}
            </div>
        </div>
    );
};
