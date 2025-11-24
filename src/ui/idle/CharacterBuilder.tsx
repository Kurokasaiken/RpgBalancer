// src/ui/idle/CharacterBuilder.tsx - Refactored to use StatBlock

import React, { useState, useEffect } from 'react';
import { Entity } from '../../engine/core/entity';
import type { Spell } from '../../balancing/spellTypes';
import type { Combatant, AIBehavior } from '../../engine/idle/types';
import { loadSpells } from '../../balancing/spellStorage';
import type { SavedCharacter } from '../../engine/idle/characterStorage';
import type { StatBlock } from '../../balancing/types';
import { DEFAULT_STATS } from '../../balancing/types';
import { Tooltip } from '../components/Tooltip';
import { STAT_DESCRIPTIONS } from '../../data/tooltips';

interface CharacterBuilderProps {
    onSave: (combatant: Combatant) => void;
    initialCharacter?: SavedCharacter | null;
}

export const CharacterBuilder: React.FC<CharacterBuilderProps> = ({
    onSave,
    initialCharacter = null
}) => {
    const [id, setId] = useState(initialCharacter?.id || crypto.randomUUID());
    const [name, setName] = useState(initialCharacter?.name || 'New Character');
    const [aiBehavior, setAiBehavior] = useState<AIBehavior>(initialCharacter?.aiBehavior || 'dps');
    const [statBlock, setStatBlock] = useState<StatBlock>(initialCharacter?.statBlock || DEFAULT_STATS);
    const [availableSpells, setAvailableSpells] = useState<Spell[]>([]);
    const [equippedSpells, setEquippedSpells] = useState<(Spell | null)[]>([null, null, null, null]);

    useEffect(() => {
        const spells = loadSpells();
        setAvailableSpells(spells);

        // Load equipped spells if editing
        if (initialCharacter) {
            const equipped = initialCharacter.equippedSpellIds.map(id =>
                spells.find(s => s.id === id) || null
            );
            while (equipped.length < 4) equipped.push(null);
            setEquippedSpells(equipped);
        }
    }, [initialCharacter]);

    // Reset when initialCharacter changes
    useEffect(() => {
        if (initialCharacter) {
            setId(initialCharacter.id);
            setName(initialCharacter.name);
            setAiBehavior(initialCharacter.aiBehavior);
            setStatBlock(initialCharacter.statBlock);
        } else {
            setId(crypto.randomUUID());
            setName('New Character');
            setAiBehavior('dps');
            setStatBlock(DEFAULT_STATS);
            setEquippedSpells([null, null, null, null]);
        }
    }, [initialCharacter]);

    const handleEquipSpell = (index: number, spellId: string) => {
        const spell = availableSpells.find(s => s.id === spellId) || null;
        const newEquipped = [...equippedSpells];
        newEquipped[index] = spell;
        setEquippedSpells(newEquipped);
    };

    const handleSave = () => {
        const entity = Entity.fromStatBlock(id, name, statBlock);

        // Team will be assigned in IdleArena, use 'hero' as placeholder
        const combatant: Combatant = {
            id: entity.id,
            name,
            entity,
            team: 'hero', // Placeholder, will be overridden in arena
            equippedSpells: equippedSpells.filter((s): s is Spell => s !== null),
            activeEffects: [],
            cooldowns: {},
            aiBehavior,
            isDead: false
        };

        onSave(combatant);

        // Reset form
        setId(crypto.randomUUID());
        setName('New Character');
        setAiBehavior('dps');
        setStatBlock(DEFAULT_STATS);
        setEquippedSpells([null, null, null, null]);
    };

    const updateStat = (key: keyof StatBlock, value: number) => {
        setStatBlock({ ...statBlock, [key]: value });
    };

    return (
        <div>
            <h2 className="text-xl font-bold mb-4">Create Combatant</h2>

            {/* Basic Info */}
            <div className="mb-4">
                <label className="block font-bold mb-2">Name</label>
                <input
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="w-full bg-gray-700 rounded px-3 py-2"
                    placeholder="Character name"
                />
            </div>

            <div className="mb-4">
                <label className="block font-bold mb-2">AI Behavior</label>
                <select
                    value={aiBehavior}
                    onChange={e => setAiBehavior(e.target.value as AIBehavior)}
                    className="w-full bg-gray-700 rounded px-2 py-1"
                >
                    <option value="tank">Tank</option>
                    <option value="dps">DPS</option>
                    <option value="support">Support</option>
                    <option value="random">Random</option>
                </select>
            </div>

            {/* StatBlock - Core Stats */}
            <div className="mb-4">
                <h3 className="font-bold mb-2">Stats (from Balancing Module)</h3>
                <div className="grid grid-cols-2 gap-2 bg-gray-800 p-3 rounded">
                    <div>
                        <label className="text-sm text-gray-400 cursor-help">
                            <Tooltip content={STAT_DESCRIPTIONS.hp}>HP</Tooltip>
                        </label>
                        <input
                            type="number"
                            value={statBlock.hp}
                            onChange={e => updateStat('hp', Number(e.target.value))}
                            className="w-full bg-gray-700 rounded px-2 py-1 text-right"
                        />
                    </div>
                    <div>
                        <label className="text-sm text-gray-400 cursor-help">
                            <Tooltip content={STAT_DESCRIPTIONS.damage}>Damage</Tooltip>
                        </label>
                        <input
                            type="number"
                            value={statBlock.damage}
                            onChange={e => updateStat('damage', Number(e.target.value))}
                            className="w-full bg-gray-700 rounded px-2 py-1 text-right"
                        />
                    </div>
                    <div>
                        <label className="text-sm text-gray-400 cursor-help">
                            <Tooltip content={STAT_DESCRIPTIONS.txc}>TxC (To-Hit)</Tooltip>
                        </label>
                        <input
                            type="number"
                            value={statBlock.txc}
                            onChange={e => updateStat('txc', Number(e.target.value))}
                            className="w-full bg-gray-700 rounded px-2 py-1 text-right"
                        />
                    </div>
                    <div>
                        <label className="text-sm text-gray-400 cursor-help">
                            <Tooltip content={STAT_DESCRIPTIONS.evasion}>Evasion</Tooltip>
                        </label>
                        <input
                            type="number"
                            value={statBlock.evasion}
                            onChange={e => updateStat('evasion', Number(e.target.value))}
                            className="w-full bg-gray-700 rounded px-2 py-1 text-right"
                        />
                    </div>
                    <div>
                        <label className="text-sm text-gray-400 cursor-help">
                            <Tooltip content={STAT_DESCRIPTIONS.armor}>Armor</Tooltip>
                        </label>
                        <input
                            type="number"
                            value={statBlock.armor}
                            onChange={e => updateStat('armor', Number(e.target.value))}
                            className="w-full bg-gray-700 rounded px-2 py-1 text-right"
                        />
                    </div>
                    <div>
                        <label className="text-sm text-gray-400 cursor-help">
                            <Tooltip content={STAT_DESCRIPTIONS.resistance}>Resistance %</Tooltip>
                        </label>
                        <input
                            type="number"
                            value={statBlock.resistance}
                            onChange={e => updateStat('resistance', Number(e.target.value))}
                            className="w-full bg-gray-700 rounded px-2 py-1 text-right"
                        />
                    </div>
                </div>
            </div>

            {/* Critical Stats */}
            <div className="mb-4">
                <h3 className="font-bold mb-2">Critical Stats</h3>
                <div className="grid grid-cols-2 gap-2 bg-gray-800 p-3 rounded">
                    <div>
                        <label className="text-sm text-gray-400 cursor-help">
                            <Tooltip content={STAT_DESCRIPTIONS.critChance}>Crit Chance %</Tooltip>
                        </label>
                        <input
                            type="number"
                            value={statBlock.critChance}
                            onChange={e => updateStat('critChance', Number(e.target.value))}
                            className="w-full bg-gray-700 rounded px-2 py-1 text-right"
                        />
                    </div>
                    <div>
                        <label className="text-sm text-gray-400 cursor-help">
                            <Tooltip content={STAT_DESCRIPTIONS.critMult}>Crit Multiplier</Tooltip>
                        </label>
                        <input
                            type="number"
                            step="0.1"
                            value={statBlock.critMult}
                            onChange={e => updateStat('critMult', Number(e.target.value))}
                            className="w-full bg-gray-700 rounded px-2 py-1 text-right"
                        />
                    </div>
                </div>
            </div>

            {/* Sustain Stats */}
            <div className="mb-4">
                <h3 className="font-bold mb-2">Sustain Stats</h3>
                <div className="grid grid-cols-2 gap-2 bg-gray-800 p-3 rounded">
                    <div>
                        <label className="text-sm text-gray-400 cursor-help">
                            <Tooltip content={STAT_DESCRIPTIONS.lifesteal}>Life Steal %</Tooltip>
                        </label>
                        <input
                            type="number"
                            value={statBlock.lifesteal || 0}
                            onChange={e => updateStat('lifesteal', Number(e.target.value))}
                            className="w-full bg-gray-700 rounded px-2 py-1 text-right"
                        />
                    </div>
                    <div>
                        <label className="text-sm text-gray-400 cursor-help">
                            <Tooltip content={STAT_DESCRIPTIONS.regen}>Regen (Flat)</Tooltip>
                        </label>
                        <input
                            type="number"
                            value={statBlock.regen || 0}
                            onChange={e => updateStat('regen', Number(e.target.value))}
                            className="w-full bg-gray-700 rounded px-2 py-1 text-right"
                        />
                    </div>
                    <div>
                        <label className="text-sm text-gray-400 cursor-help">
                            <Tooltip content={STAT_DESCRIPTIONS.ward}>Ward</Tooltip>
                        </label>
                        <input
                            type="number"
                            value={statBlock.ward || 0}
                            onChange={e => updateStat('ward', Number(e.target.value))}
                            className="w-full bg-gray-700 rounded px-2 py-1 text-right"
                        />
                    </div>
                    <div>
                        <label className="text-sm text-gray-400 cursor-help">
                            <Tooltip content={STAT_DESCRIPTIONS.block}>Block %</Tooltip>
                        </label>
                        <input
                            type="number"
                            value={statBlock.block || 0}
                            onChange={e => updateStat('block', Number(e.target.value))}
                            className="w-full bg-gray-700 rounded px-2 py-1 text-right"
                        />
                    </div>
                </div>
            </div>

            {/* Equipped Skills */}
            <div className="mb-4">
                <h3 className="font-bold mb-2">Equipped Skills (Max 4)</h3>
                <div className="space-y-2">
                    {equippedSpells.map((spell, idx) => (
                        <div key={idx} className="flex items-center space-x-2">
                            <span className="text-sm text-gray-400 w-16">Slot {idx + 1}:</span>
                            <select
                                value={spell?.id || ''}
                                onChange={e => handleEquipSpell(idx, e.target.value)}
                                className="flex-1 bg-gray-700 rounded px-2 py-1 text-sm"
                            >
                                <option value="">-- Empty --</option>
                                {availableSpells.map(s => (
                                    <option key={s.id} value={s.id}>{s.name}</option>
                                ))}
                            </select>
                        </div>
                    ))}
                </div>
            </div>

            <button
                onClick={handleSave}
                className="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-2 px-4 rounded"
            >
                Create & Add to Battle
            </button>
        </div>
    );
};
