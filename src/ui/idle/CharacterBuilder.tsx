// src/ui/idle/CharacterBuilder.tsx - Refactored to use StatBlock

import React, { useCallback, useMemo, useState } from 'react';
import { Entity } from '../../engine/core/entity';
import type { Spell } from '../../balancing/spellTypes';
import type { Combatant, AIBehavior } from '../../engine/idle/types';
import { loadSpells } from '../../balancing/spellStorage';
import type { SavedCharacter } from '../../engine/idle/characterStorage';
import type { StatBlock } from '../../balancing/types';
import { DEFAULT_STATS } from '../../balancing/types';
import { Tooltip } from '../components/Tooltip';
import { STAT_DESCRIPTIONS } from '../../data/tooltips';
import { CharacterPortraitPicker } from '../character/components/CharacterPortraitPicker';
import type { PortraitCropSettings } from '@/balancing/config/idleVillage/residentVisuals';
import { DEFAULT_PORTRAIT_CROP } from '@/balancing/config/idleVillage/residentVisuals';

const EMPTY_SPELL_SLOTS: (Spell | null)[] = [null, null, null, null];

const cloneStatBlock = (block?: StatBlock): StatBlock => ({
    ...DEFAULT_STATS,
    ...(block ?? {}),
});

function buildEquippedSpellSlots(availableSpells: Spell[], initialCharacter?: SavedCharacter | null): (Spell | null)[] {
    if (!initialCharacter) {
        return [...EMPTY_SPELL_SLOTS];
    }
    const slots = initialCharacter.equippedSpellIds.map(id => availableSpells.find((spell) => spell.id === id) || null);
    while (slots.length < 4) {
        slots.push(null);
    }
    return slots.slice(0, 4);
}

interface BuilderState {
    id: string;
    name: string;
    aiBehavior: AIBehavior;
    statBlock: StatBlock;
    equippedSpells: (Spell | null)[];
    visualProfileId?: string;
    portraitUrl?: string;
    fullFigureUrl?: string;
    portraitCrop: PortraitCropSettings;
}

export interface CharacterBuilderSavePayload {
    combatant: Combatant;
    visualProfileId?: string;
    portraitUrl?: string;
    fullFigureUrl?: string;
    portraitCrop?: PortraitCropSettings;
}

interface CharacterBuilderProps {
    onSave: (payload: CharacterBuilderSavePayload) => void;
    initialCharacter?: SavedCharacter | null;
}

export const CharacterBuilder: React.FC<CharacterBuilderProps> = ({
    onSave,
    initialCharacter = null
}) => {
    const availableSpells = useMemo(() => loadSpells(), []);
    const buildInitialState = useCallback(
        (character?: SavedCharacter | null): BuilderState => {
            if (character) {
                return {
                    id: character.id,
                    name: character.name,
                    aiBehavior: character.aiBehavior,
                    statBlock: cloneStatBlock(character.statBlock),
                    equippedSpells: buildEquippedSpellSlots(availableSpells, character),
                    visualProfileId: character.visualProfileId,
                    portraitUrl: character.portraitUrl,
                    fullFigureUrl: character.fullFigureUrl,
                    portraitCrop: character.portraitCrop ?? DEFAULT_PORTRAIT_CROP,
                };
            }
            return {
                id: crypto.randomUUID(),
                name: 'New Character',
                aiBehavior: 'dps',
                statBlock: cloneStatBlock(),
                equippedSpells: [...EMPTY_SPELL_SLOTS],
                visualProfileId: undefined,
                portraitUrl: undefined,
                fullFigureUrl: undefined,
                portraitCrop: DEFAULT_PORTRAIT_CROP,
            };
        },
        [availableSpells],
    );

    const [builderState, setBuilderState] = useState<BuilderState>(() => buildInitialState(initialCharacter));

    const {
        id,
        name,
        aiBehavior,
        statBlock,
        equippedSpells,
        visualProfileId,
        portraitUrl,
        fullFigureUrl,
        portraitCrop,
    } = builderState;

    const handleEquipSpell = (index: number, spellId: string) => {
        const spell = availableSpells.find(s => s.id === spellId) || null;
        setBuilderState(prev => {
            const next = [...prev.equippedSpells];
            next[index] = spell;
            return { ...prev, equippedSpells: next };
        });
    };

    const updateBuilderState = useCallback((fields: Partial<BuilderState>) => {
        setBuilderState(prev => ({ ...prev, ...fields }));
    }, []);

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

        onSave({
            combatant,
            visualProfileId,
            portraitUrl,
            fullFigureUrl,
            portraitCrop,
        });

        setBuilderState(buildInitialState());
    };

    const updateStat = (key: keyof StatBlock, value: number) => {
        setBuilderState(prev => ({ ...prev, statBlock: { ...prev.statBlock, [key]: value } }));
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
                    onChange={e => updateBuilderState({ name: e.target.value })}
                    className="w-full bg-gray-700 rounded px-3 py-2"
                    placeholder="Character name"
                />
            </div>

            <div className="mb-4">
                <CharacterPortraitPicker
                    visualProfileId={visualProfileId}
                    portraitUrl={portraitUrl}
                    fullFigureUrl={fullFigureUrl}
                    portraitCrop={portraitCrop}
                    onVisualProfileChange={value => updateBuilderState({ visualProfileId: value })}
                    onPortraitUrlChange={value => updateBuilderState({ portraitUrl: value })}
                    onFullFigureUrlChange={value => updateBuilderState({ fullFigureUrl: value })}
                    onPortraitCropChange={value => updateBuilderState({ portraitCrop: value })}
                />
            </div>

            <div className="mb-4">
                <label className="block font-bold mb-2">AI Behavior</label>
                <select
                    value={aiBehavior}
                    onChange={e => updateBuilderState({ aiBehavior: e.target.value as AIBehavior })}
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
