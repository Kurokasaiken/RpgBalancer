// src/ui/idle/CharacterManager.tsx - Using StatBlock

import React, { useState, useEffect } from 'react';
import { CharacterBuilder } from './CharacterBuilder';
import type { Combatant } from '../../engine/idle/types';
import { saveCharacter, loadCharacters, deleteCharacter, type SavedCharacter } from '../../engine/idle/characterStorage';

export const CharacterManager: React.FC = () => {
    const [characters, setCharacters] = useState<SavedCharacter[]>([]);
    const [selectedCharacter, setSelectedCharacter] = useState<SavedCharacter | null>(null);

    useEffect(() => {
        setCharacters(loadCharacters());
    }, []);

    const handleSaveCharacter = (combatant: Combatant) => {
        const savedChar: SavedCharacter = {
            id: combatant.id,
            name: combatant.name,
            aiBehavior: combatant.aiBehavior,
            statBlock: combatant.entity.statBlock!,
            equippedSpellIds: combatant.equippedSpells.map(s => s.id)
        };

        saveCharacter(savedChar);
        setCharacters(loadCharacters());
        setSelectedCharacter(null);
    };

    const handleDelete = (id: string) => {
        deleteCharacter(id);
        setCharacters(loadCharacters());
        if (selectedCharacter?.id === id) {
            setSelectedCharacter(null);
        }
    };

    const handleEdit = (char: SavedCharacter) => {
        setSelectedCharacter(char);
    };

    const handleCancelEdit = () => {
        setSelectedCharacter(null);
    };

    return (
        <div className="flex flex-col h-full p-4 space-y-4">
            <div className="bg-gray-800 p-4 rounded">
                <h1 className="text-2xl font-bold text-white mb-4">Character Manager</h1>
                <p className="text-gray-300 text-sm">
                    Crea e gestisci i tuoi personaggi usando le stats del modulo di bilanciamento.
                </p>
            </div>

            <div className="flex flex-1 space-x-4 overflow-hidden">
                {/* Left: Character Builder */}
                <div className="w-1/2 overflow-y-auto bg-gray-900 p-4 rounded">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-bold text-white">
                            {selectedCharacter ? `Modifica: ${selectedCharacter.name}` : 'Nuovo Personaggio'}
                        </h2>
                        {selectedCharacter && (
                            <button
                                onClick={handleCancelEdit}
                                className="px-3 py-1 bg-gray-600 hover:bg-gray-500 text-white rounded text-sm"
                            >
                                Annulla
                            </button>
                        )}
                    </div>
                    <CharacterBuilder
                        onSave={handleSaveCharacter}
                        initialCharacter={selectedCharacter}
                    />
                </div>

                {/* Right: Saved Characters List */}
                <div className="w-1/2 overflow-y-auto bg-gray-900 p-4 rounded">
                    <h2 className="text-xl font-bold text-white mb-4">
                        Personaggi Salvati ({characters.length})
                    </h2>

                    {characters.length === 0 ? (
                        <div className="text-gray-400 text-center py-8">
                            Nessun personaggio salvato. Creane uno!
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {characters.map(char => {
                                // Safety check for old data without statBlock
                                if (!char.statBlock) {
                                    return (
                                        <div key={char.id} className="bg-red-900 p-4 rounded border-2 border-red-700">
                                            <div className="text-white font-bold">{char.name}</div>
                                            <div className="text-red-300 text-sm">Vecchio format - rimuovere e ricreare</div>
                                            <button
                                                onClick={() => handleDelete(char.id)}
                                                className="mt-2 px-3 py-1 bg-red-600 hover:bg-red-500 text-white rounded text-sm"
                                            >
                                                Elimina
                                            </button>
                                        </div>
                                    );
                                }

                                return (
                                    <div
                                        key={char.id}
                                        className={`bg-gray-800 p-4 rounded border-2 transition-colors ${selectedCharacter?.id === char.id
                                            ? 'border-blue-500'
                                            : 'border-gray-700 hover:border-gray-600'
                                            }`}
                                    >
                                        <div className="flex justify-between items-start mb-2">
                                            <div>
                                                <h3 className="text-lg font-bold text-white">{char.name}</h3>
                                                <div className="text-sm text-gray-400">
                                                    <span className="capitalize">{char.aiBehavior}</span>
                                                </div>
                                            </div>
                                            <div className="flex space-x-2">
                                                <button
                                                    onClick={() => handleEdit(char)}
                                                    className="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded text-sm"
                                                >
                                                    Modifica
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(char.id)}
                                                    className="px-3 py-1 bg-red-600 hover:bg-red-500 text-white rounded text-sm"
                                                >
                                                    Elimina
                                                </button>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-3 gap-2 text-xs text-gray-300 mt-3">
                                            <div>
                                                <div className="text-gray-500">HP</div>
                                                <div className="font-bold">{char.statBlock.hp}</div>
                                            </div>
                                            <div>
                                                <div className="text-gray-500">DMG</div>
                                                <div className="font-bold">{char.statBlock.damage}</div>
                                            </div>
                                            <div>
                                                <div className="text-gray-500">TxC</div>
                                                <div className="font-bold">{char.statBlock.txc}</div>
                                            </div>
                                            <div>
                                                <div className="text-gray-500">Evasion</div>
                                                <div className="font-bold">{char.statBlock.evasion}</div>
                                            </div>
                                            <div>
                                                <div className="text-gray-500">Armor</div>
                                                <div className="font-bold">{char.statBlock.armor}</div>
                                            </div>
                                            <div>
                                                <div className="text-gray-500">Crit%</div>
                                                <div className="font-bold">{char.statBlock.critChance}%</div>
                                            </div>
                                        </div>

                                        <div className="mt-2 text-xs text-gray-400">
                                            Skills: {char.equippedSpellIds.length}/4
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
