import React from 'react';
import type { Spell } from '../../../balancing/spellTypes';

interface SpellIdentityCardProps {
    spell: Spell;
    updateField: (field: keyof Spell, value: Spell[keyof Spell]) => void;
    targetBudget: number;
    setTargetBudget: (value: number) => void;
    targetStatOptions?: string[]; // Optional list of stats
}

export const SpellIdentityCard: React.FC<SpellIdentityCardProps> = ({
    spell,
    updateField,
    targetBudget,
    setTargetBudget,
    targetStatOptions // New prop for dynamic stats
}) => {
    return (
        <div className="observatory-panel spell-panel-compact observatory-panel-ambient flex flex-col gap-2 h-full">
            <div className="spell-stat-header flex items-center justify-between px-2.5 py-1.5 mb-2 rounded-[0.7rem]">
                <div className="flex items-center gap-1.5 min-w-0">
                    <span className="text-xs" aria-hidden="true">🪄</span>
                    <span className="spell-stat-title text-[10px] font-semibold uppercase text-indigo-100/90 truncate">
                        Spell Identity
                    </span>
                </div>
                <span className="text-[9px] uppercase tracking-[0.18em] text-cyan-200/80 ml-2 truncate">
                    {spell.type}
                </span>
            </div>
            <div className="grid grid-cols-2 gap-3">
                {/* Name */}
                <div className="flex flex-col gap-1">
                    <label className="text-[10px] uppercase tracking-wider text-cyan-300/70 font-semibold">Name</label>
                    <input
                        type="text"
                        value={spell.name}
                        onChange={e => updateField('name', e.target.value)}
                        className="w-full bg-black/20 text-cyan-50 px-2 py-1 rounded border border-cyan-500/20 text-[10px] focus:border-cyan-400 focus:shadow-[0_0_8px_rgba(34,211,238,0.5)] outline-none transition-all placeholder-cyan-500/30"
                        placeholder="Spell Name"
                    />
                </div>

                {/* Type */}
                <div className="flex flex-col gap-1">
                    <label className="text-[10px] uppercase tracking-wider text-cyan-300/70 font-semibold">Type</label>
                    <select
                        value={spell.type}
                        onChange={e => updateField('type', e.target.value)}
                        className="w-full bg-black/20 text-cyan-50 px-2 py-1 rounded border border-cyan-500/20 text-[10px] focus:border-cyan-400 focus:shadow-[0_0_8px_rgba(34,211,238,0.5)] outline-none transition-all appearance-none"
                    >
                        <option value="damage">Damage</option>
                        <option value="heal">Heal</option>
                        <option value="shield">Shield</option>
                        <option value="buff">Buff</option>
                        <option value="debuff">Debuff</option>
                        <option value="cc">Crowd Control</option>
                    </select>
                </div>

                {/* Target Budget */}
                <div className="flex flex-col gap-1">
                    <label className="text-[10px] uppercase tracking-wider text-cyan-300/70 font-semibold">Target Cost</label>
                    <input
                        type="number"
                        value={targetBudget}
                        onChange={e => setTargetBudget(Number(e.target.value))}
                        className="w-full bg-black/20 text-cyan-50 px-2 py-1 rounded border border-cyan-500/20 text-[10px] font-mono text-right focus:border-cyan-400 focus:shadow-[0_0_8px_rgba(34,211,238,0.5)] outline-none transition-all"
                    />
                </div>

                {/* Target Stat (Buff/Debuff only) */}
                {(spell.type === 'buff' || spell.type === 'debuff') && (
                    <div className="flex flex-col gap-1">
                        <label className="text-[10px] uppercase tracking-wider text-cyan-300/70 font-semibold">Target Stat</label>
                        <select
                            value={spell.targetStat || 'damage'}
                            onChange={e => updateField('targetStat', e.target.value)}
                            className="w-full bg-black/20 text-cyan-50 px-2 py-1.5 rounded border border-cyan-500/20 text-[10px] focus:border-cyan-400 focus:shadow-[0_0_8px_rgba(34,211,238,0.5)] outline-none transition-all appearance-none"
                        >
                            {targetStatOptions?.map(stat => (
                                <option key={stat} value={stat}>
                                    {stat.charAt(0).toUpperCase() + stat.slice(1).replace(/([A-Z])/g, ' $1').trim()}
                                </option>
                            )) || <option value="damage">Damage</option>}
                        </select>
                    </div>
                )}
            </div>
        </div>
    );
};
