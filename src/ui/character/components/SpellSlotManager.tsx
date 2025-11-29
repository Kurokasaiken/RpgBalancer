/**
 * Spell Slot Manager
 * 
 * Component for managing equipped spells:
 * - Basic Attack always in slot 0 (non-removable)
 * - Add/remove spell slots
 * - Select spells from library
 */

import React from 'react';
import type { Spell } from '../../../balancing/spellTypes';
import { loadSpells } from '../../../balancing/spellStorage';
import { DEFAULT_SPELLS } from '../../../balancing/defaultSpells';

interface SpellSlotManagerProps {
    equippedSpells: Spell[];
    onSpellsChange: (spells: Spell[]) => void;
}

export const SpellSlotManager: React.FC<SpellSlotManagerProps> = ({
    equippedSpells,
    onSpellsChange
}) => {
    const availableSpells = [...DEFAULT_SPELLS, ...loadSpells()];

    // Ensure Basic Attack is always in slot 0
    React.useEffect(() => {
        if (equippedSpells.length === 0 || equippedSpells[0]?.name !== 'Basic Attack') {
            const basicAttack = DEFAULT_SPELLS.find(s => s.name === 'Basic Attack');
            if (basicAttack) {
                onSpellsChange([basicAttack, ...equippedSpells.filter(s => s.name !== 'Basic Attack')]);
            }
        }
    }, []);

    const handleAddSlot = () => {
        onSpellsChange([...equippedSpells, availableSpells[0]]);
    };

    const handleRemoveSlot = (index: number) => {
        if (index === 0) return; // Can't remove Basic Attack
        const newSpells = equippedSpells.filter((_, i) => i !== index);
        onSpellsChange(newSpells);
    };

    const handleSpellChange = (index: number, spellId: string) => {
        if (index === 0) return; // Can't change Basic Attack
        const spell = availableSpells.find(s => s.id === spellId);
        if (spell) {
            const newSpells = [...equippedSpells];
            newSpells[index] = spell;
            onSpellsChange(newSpells);
        }
    };

    return (
        <div className="fantasy-glass rounded-lg p-4 space-y-3">
            <div className="flex justify-between items-center border-b border-white/10 pb-2">
                <h3 className="text-lg font-bold text-white fantasy-glow-water">
                    🔮 Equipped Spells
                </h3>
                <button
                    onClick={handleAddSlot}
                    className="px-3 py-1 text-sm bg-cyan-600/30 hover:bg-cyan-600/50 border border-cyan-500/30 rounded transition-colors fantasy-hover-glow-water"
                    title="Add Spell Slot"
                >
                    + Add Slot
                </button>
            </div>

            <div className="space-y-2">
                {equippedSpells.map((spell, index) => (
                    <div
                        key={index}
                        className={`flex items-center gap-2 p-2 rounded ${index === 0
                                ? 'bg-yellow-900/20 border border-yellow-500/30'
                                : 'bg-white/5 border border-white/10'
                            }`}
                    >
                        {/* Slot number */}
                        <div className={`w-8 h-8 flex items-center justify-center rounded font-bold text-sm ${index === 0
                                ? 'bg-yellow-600/30 text-yellow-400'
                                : 'bg-white/10 text-gray-400'
                            }`}>
                            {index}
                        </div>

                        {/* Spell selector */}
                        {index === 0 ? (
                            // Basic Attack (locked)
                            <div className="flex-1 flex items-center gap-2">
                                <span className="text-yellow-400 font-semibold">
                                    {spell.name}
                                </span>
                                <span className="text-xs text-yellow-600/70 italic">
                                    (Always Equipped)
                                </span>
                            </div>
                        ) : (
                            // Other spells (selectable)
                            <select
                                value={spell.id}
                                onChange={(e) => handleSpellChange(index, e.target.value)}
                                className="flex-1 bg-white/5 border border-white/10 rounded px-2 py-1 text-sm text-white focus:outline-none focus:border-cyan-500/50"
                            >
                                {availableSpells.map(s => (
                                    <option key={s.id} value={s.id} className="bg-gray-800">
                                        {s.name} {s.spellLevel ? `(Lv${s.spellLevel})` : ''}
                                    </option>
                                ))}
                            </select>
                        )}

                        {/* Spell info */}
                        <div className="text-xs text-gray-400">
                            {spell.effect && (
                                <span className="mr-2">
                                    ⚡ {spell.effect}
                                </span>
                            )}
                            {spell.spellLevel && (
                                <span className="text-cyan-400">
                                    Lv{spell.spellLevel}
                                </span>
                            )}
                        </div>

                        {/* Remove button */}
                        {index > 0 && (
                            <button
                                onClick={() => handleRemoveSlot(index)}
                                className="w-8 h-8 flex items-center justify-center rounded bg-red-600/20 hover:bg-red-600/40 border border-red-500/30 text-red-400 transition-colors"
                                title="Remove Slot"
                            >
                                ×
                            </button>
                        )}
                    </div>
                ))}

                {equippedSpells.length === 0 && (
                    <div className="text-center text-gray-500 italic py-4">
                        No spells equipped. Click "+ Add Slot" to start.
                    </div>
                )}
            </div>

            {/* Summary */}
            <div className="pt-2 border-t border-white/10 text-xs text-gray-400">
                <span className="font-semibold">Total Slots:</span> {equippedSpells.length}
                {equippedSpells.length > 10 && (
                    <span className="ml-2 text-yellow-500">
                        ⚠ Warning: Many equipped spells may slow down combat
                    </span>
                )}
            </div>
        </div>
    );
};
