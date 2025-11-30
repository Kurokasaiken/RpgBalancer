import React from 'react';
import type { Spell } from '../../../balancing/spellTypes';

interface SpellIdentityCardProps {
    spell: Spell;
    updateField: (field: keyof Spell, value: any) => void;
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
        <div className="flex flex-col gap-4 backdrop-blur-md bg-cyan-900/20 border border-cyan-500/30 rounded-lg p-4 shadow-[0_4px_16px_rgba(6,182,212,0.15)] h-full">
            <div className="grid grid-cols-2 gap-4">
                {/* Name */}
                <div className="flex flex-col gap-1">
                    <label className="text-xs uppercase tracking-wider text-cyan-300/70 font-semibold">Name</label>
                    <input
                        type="text"
                        value={spell.name}
                        onChange={e => updateField('name', e.target.value)}
                        className="w-full bg-black/20 text-cyan-50 px-3 py-2 rounded border border-cyan-500/20 text-sm focus:border-cyan-400 focus:shadow-[0_0_8px_rgba(34,211,238,0.5)] outline-none transition-all placeholder-cyan-500/30"
                        placeholder="Spell Name"
                    />
                </div>

                {/* Type */}
                <div className="flex flex-col gap-1">
                    <label className="text-xs uppercase tracking-wider text-cyan-300/70 font-semibold">Type</label>
                    <select
                        value={spell.type}
                        onChange={e => updateField('type', e.target.value)}
                        className="w-full bg-black/20 text-cyan-50 px-3 py-2 rounded border border-cyan-500/20 text-sm focus:border-cyan-400 focus:shadow-[0_0_8px_rgba(34,211,238,0.5)] outline-none transition-all appearance-none"
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
                    <label className="text-xs uppercase tracking-wider text-cyan-300/70 font-semibold">Target Cost</label>
                    <input
                        type="number"
                        value={targetBudget}
                        onChange={e => setTargetBudget(Number(e.target.value))}
                        className="w-full bg-black/20 text-cyan-50 px-3 py-2 rounded border border-cyan-500/20 text-sm font-mono text-right focus:border-cyan-400 focus:shadow-[0_0_8px_rgba(34,211,238,0.5)] outline-none transition-all"
                    />
                </div>

                {/* Target Stat (Buff/Debuff only) */}
                {(spell.type === 'buff' || spell.type === 'debuff') && (
                    <div className="flex flex-col gap-1">
                        <label className="text-xs uppercase tracking-wider text-cyan-300/70 font-semibold">Target Stat</label>
                        <select
                            value={spell.targetStat || 'damage'}
                            onChange={e => updateField('targetStat', e.target.value)}
                            className="w-full bg-black/20 text-cyan-50 px-3 py-2 rounded border border-cyan-500/20 text-sm focus:border-cyan-400 focus:shadow-[0_0_8px_rgba(34,211,238,0.5)] outline-none transition-all appearance-none"
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
