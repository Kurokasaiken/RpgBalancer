import React from 'react';
import type { Spell } from '../../../balancing/spellTypes';
import { GlassCard } from '../../atoms/GlassCard';
import { GlassInput } from '../../atoms/GlassInput';
import { GlassSelect } from '../../atoms/GlassSelect';

interface SpellIdentityCardProps {
    spell: Spell;
    updateField: (field: keyof Spell, value: any) => void;
    targetBudget: number;
    setTargetBudget: (value: number) => void;
}

export const SpellIdentityCard: React.FC<SpellIdentityCardProps> = ({
    spell,
    updateField,
    targetBudget,
    setTargetBudget
}) => {
    const spellTypes = [
        { value: 'damage', label: 'Damage' },
        { value: 'heal', label: 'Heal' },
        { value: 'shield', label: 'Shield' },
        { value: 'buff', label: 'Buff' },
        { value: 'debuff', label: 'Debuff' },
        { value: 'cc', label: 'Crowd Control' }
    ];

    return (
        <GlassCard className="h-full flex flex-col justify-center">
            <div className="grid grid-cols-2 gap-4">
                {/* Name */}
                <GlassInput
                    label="NAME"
                    value={spell.name}
                    onChange={e => updateField('name', e.target.value)}
                    placeholder="Spell Name"
                />

                {/* Type */}
                <GlassSelect
                    label="TYPE"
                    value={spell.type}
                    onChange={e => updateField('type', e.target.value)}
                    options={spellTypes}
                />

                {/* Target Budget */}
                <div className="col-span-2">
                    <GlassInput
                        label="TARGET COST"
                        type="number"
                        value={targetBudget}
                        onChange={e => setTargetBudget(Number(e.target.value))}
                        placeholder="0"
                        rightIcon={<span className="text-xs text-gray-500 font-mono">PTS</span>}
                    />
                </div>
            </div>
        </GlassCard>
    );
};
