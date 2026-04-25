import React, { useState } from 'react';
import { Entity } from '../../engine/core/entity';
import { createEmptyAttributes, calculateDerivedStats } from '../../engine/core/stats';
import type { Attributes, DerivedStats } from '../../engine/core/stats';
import { calculateModuleCost } from '../../engine/modules/definitions';
import type { WeaponModule, ArmorModule } from '../../engine/modules/definitions';
import { SuggestionEngine, type Suggestion } from '../../balancing/synergy/SuggestionEngine';
import { DEFAULT_STATS, type StatBlock } from '../../balancing/types';

interface EntityCreatorProps {
    onSave: (entity: Entity) => void;
    initialName?: string;
}

const SAMPLE_WEAPONS: WeaponModule[] = [
    { id: 'w1', name: 'Iron Sword', type: 'weapon', cost: 0, damage: 5, attackSpeed: 1.0, range: 1, description: 'Basic sword' },
    { id: 'w2', name: 'Great Axe', type: 'weapon', cost: 0, damage: 12, attackSpeed: 0.8, range: 1, description: 'Heavy hitter' },
    { id: 'w3', name: 'Dagger', type: 'weapon', cost: 0, damage: 3, attackSpeed: 1.5, range: 1, description: 'Fast attacks' },
];

const SAMPLE_ARMOR: ArmorModule[] = [
    { id: 'a1', name: 'Leather Armor', type: 'armor', cost: 0, defenseValue: 2, weight: 5, description: 'Light protection' },
    { id: 'a2', name: 'Plate Mail', type: 'armor', cost: 0, defenseValue: 8, weight: 20, description: 'Heavy protection' },
];

const SmartAssist: React.FC<{ derivedStats: DerivedStats }> = ({ derivedStats }) => {
    const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
    const [loading, setLoading] = useState(false);

    const getSuggestions = async () => {
        setLoading(true);
        const engine = new SuggestionEngine();

        // Convert DerivedStats to StatBlock
        const currentStats: StatBlock = {
            ...DEFAULT_STATS,
            hp: derivedStats.maxHp,
            damage: derivedStats.attackPower,
            armor: derivedStats.defense,
            critChance: derivedStats.critChance * 100,
            // Map other stats if possible, otherwise use defaults
            evasion: derivedStats.speed, // Rough mapping
        };

        const results = await engine.getSuggestions(currentStats);
        setSuggestions(results);
        setLoading(false);
    };

    return (
        <div className="bg-gray-700 p-4 rounded-lg mt-6 border border-purple-500/30">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-purple-300 flex items-center gap-2">
                    <span>🤖</span> Smart Assist
                </h3>
                <button
                    onClick={getSuggestions}
                    disabled={loading}
                    className="text-xs bg-purple-600 hover:bg-purple-500 px-3 py-1 rounded transition-colors"
                >
                    {loading ? 'Analyzing...' : 'Analyze Build'}
                </button>
            </div>

            {suggestions.length > 0 ? (
                <div className="space-y-3">
                    {suggestions.map((s, i) => (
                        <div key={i} className="bg-gray-800 p-3 rounded text-sm border-l-2 border-purple-500">
                            <div className="flex justify-between font-bold text-white">
                                <span className="capitalize">Increase {s.stat}</span>
                                <span className="text-purple-400">+{s.score.toFixed(1)} HP Val</span>
                            </div>
                            <div className="text-gray-400 text-xs mt-1">{s.reason}</div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-gray-400 text-sm italic text-center py-2">
                    Click analyze to get AI recommendations based on synergy.
                </div>
            )}
        </div>
    );
};

export const EntityCreator: React.FC<EntityCreatorProps> = ({ onSave, initialName = 'New Entity' }) => {
    const [name, setName] = useState(initialName);
    const [attributes, setAttributes] = useState<Attributes>(createEmptyAttributes());
    const [selectedWeapon, setSelectedWeapon] = useState<WeaponModule | undefined>();
    const [selectedArmor, setSelectedArmor] = useState<ArmorModule | undefined>();

    const derivedStats = calculateDerivedStats(attributes);

    // Apply item stats to derived stats for preview
    const finalStats = { ...derivedStats };
    if (selectedWeapon) {
        finalStats.attackPower += selectedWeapon.damage;
        // Attack Speed not in DerivedStats directly but affects DPS
    }
    if (selectedArmor) {
        finalStats.defense += selectedArmor.defenseValue;
    }

    // Calculate total point cost
    const attributeCost = Object.values(attributes).reduce((acc, val) => acc + val * 10, 0);
    const weaponCost = selectedWeapon ? calculateModuleCost(selectedWeapon) : 0;
    const armorCost = selectedArmor ? calculateModuleCost(selectedArmor) : 0;
    const totalCost = attributeCost + weaponCost + armorCost;

    const handleAttributeChange = (key: keyof Attributes, value: number) => {
        setAttributes(prev => ({ ...prev, [key]: Math.max(0, value) }));
    };

    const handleSave = () => {
        const entity = new Entity(crypto.randomUUID(), name, attributes);
        if (selectedWeapon) entity.equipWeapon(selectedWeapon);
        if (selectedArmor) entity.equipArmor(selectedArmor);
        onSave(entity);
    };

    return (
        <div className="bg-gray-800 p-6 rounded-lg shadow-lg text-white">
            <h2 className="text-2xl font-bold mb-4">Entity Creator</h2>

            <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Name</label>
                <input
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 grid grid-cols-2 gap-6">
                    <div>
                        <h3 className="text-xl font-semibold mb-2">Attributes</h3>
                        {Object.keys(attributes).map((key) => (
                            <div key={key} className="flex items-center justify-between mb-2">
                                <span className="capitalize w-24">{key}</span>
                                <div className="flex items-center">
                                    <button
                                        onClick={() => handleAttributeChange(key as keyof Attributes, attributes[key as keyof Attributes] - 1)}
                                        className="bg-red-600 hover:bg-red-700 px-2 py-1 rounded text-xs"
                                    >-</button>
                                    <span className="mx-3 w-6 text-center">{attributes[key as keyof Attributes]}</span>
                                    <button
                                        onClick={() => handleAttributeChange(key as keyof Attributes, attributes[key as keyof Attributes] + 1)}
                                        className="bg-green-600 hover:bg-green-700 px-2 py-1 rounded text-xs"
                                    >+</button>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div>
                        <h3 className="text-xl font-semibold mb-2">Preview Stats</h3>
                        <div className="space-y-1 text-sm text-gray-300">
                            <p>HP: {finalStats.maxHp}</p>
                            <p>Mana: {finalStats.maxMana}</p>
                            <p>Attack: {finalStats.attackPower}</p>
                            <p>Defense: {finalStats.defense}</p>
                            <p>Speed: {finalStats.speed}</p>
                            <p>Crit: {(finalStats.critChance * 100).toFixed(1)}%</p>
                        </div>

                        {/* Smart Assist Integration */}
                        <SmartAssist derivedStats={finalStats} />
                    </div>
                </div>

                <div>
                    <h3 className="text-lg font-semibold mb-2">Equipment</h3>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm text-gray-400 mb-1">Weapon</label>
                            <select
                                className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2"
                                onChange={(e) => setSelectedWeapon(SAMPLE_WEAPONS.find(w => w.id === e.target.value))}
                                value={selectedWeapon?.id || ''}
                            >
                                <option value="">None</option>
                                {SAMPLE_WEAPONS.map(w => (
                                    <option key={w.id} value={w.id}>{w.name} (Dmg: {w.damage})</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm text-gray-400 mb-1">Armor</label>
                            <select
                                className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2"
                                onChange={(e) => setSelectedArmor(SAMPLE_ARMOR.find(a => a.id === e.target.value))}
                                value={selectedArmor?.id || ''}
                            >
                                <option value="">None</option>
                                {SAMPLE_ARMOR.map(a => (
                                    <option key={a.id} value={a.id}>{a.name} (Def: {a.defenseValue})</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>
            </div>

            <div className="mt-6 pt-4 border-t border-gray-700 flex justify-between items-center">
                <div className="text-xl font-bold text-yellow-400">
                    Total Cost: {totalCost} pts
                </div>
                <button
                    onClick={handleSave}
                    className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 px-6 rounded"
                >
                    Create Entity
                </button>
            </div>
        </div>
    );
};
