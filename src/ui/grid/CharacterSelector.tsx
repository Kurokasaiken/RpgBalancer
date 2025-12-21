import React, { useState, useEffect } from 'react';
import { loadCharacters, type SavedCharacter } from '../../engine/idle/characterStorage';
import { loadSpells } from '../../balancing/spellStorage';
import type { Spell } from '../../balancing/spellTypes';

interface CharacterSelectorProps {
    onCharactersSelected: (char1: SavedCharacter, char2: SavedCharacter) => void;
}

export const CharacterSelector: React.FC<CharacterSelectorProps> = ({ onCharactersSelected }) => {
    const [characters, setCharacters] = useState<SavedCharacter[]>([]);
    const [spells, setSpells] = useState<Spell[]>([]);
    const [selectedChar1, setSelectedChar1] = useState<SavedCharacter | null>(null);
    const [selectedChar2, setSelectedChar2] = useState<SavedCharacter | null>(null);
    const [viewingChar, setViewingChar] = useState<SavedCharacter | null>(null);

    useEffect(() => {
        const loadedChars = loadCharacters();
        const loadedSpells = loadSpells();

        setCharacters(loadedChars);
        setSpells(loadedSpells);

        // Auto-select first two if available
        if (loadedChars.length >= 2) {
            setSelectedChar1(loadedChars[0]);
            setSelectedChar2(loadedChars[1]);
        }
    }, []);

    const handleStartBattle = () => {
        if (selectedChar1 && selectedChar2) {
            onCharactersSelected(selectedChar1, selectedChar2);
        }
    };

    const getCharacterSpells = (char: SavedCharacter): Spell[] => {
        return char.equippedSpellIds
            .map(id => spells.find(s => s.id === id))
            .filter((s): s is Spell => s !== undefined);
    };

    // Emoji mapping for AI behaviors
    const getBehaviorEmoji = (behavior: SavedCharacter['aiBehavior']): string => {
        switch (behavior) {
            case 'tank': return '🛡️';
            case 'dps': return '⚔️';
            case 'support': return '💚';
            case 'random': return '🎲';
        }
    };

    if (characters.length === 0) {
        return (
            <div className="w-full h-full flex items-center justify-center p-4" data-testid="character-selector-empty">
                <div className="max-w-2xl bg-gray-800/90 rounded-xl border-2 border-gray-700 p-8 text-center">
                    <h1 className="text-3xl font-bold text-white mb-4">⚠️ No Characters Found</h1>
                    <p className="text-gray-400 mb-6">
                        You need to create characters in the <strong>Idle Arena</strong> first.
                    </p>
                    <p className="text-gray-500 text-sm">
                        Go to Idle Arena → create characters with stats and spells → then come back here to fight!
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full h-full flex flex-col items-center justify-center p-4 bg-gradient-to-b from-gray-900 to-gray-800 overflow-y-auto">
            <div className="max-w-6xl w-full bg-gray-800/90 rounded-xl border-2 border-gray-700 p-4 md:p-6 shadow-2xl">
                <h1 className="text-2xl md:text-4xl font-bold text-white mb-4 md:mb-6 text-center">
                    ⚔️ Select Fighters
                </h1>

                <div className="grid md:grid-cols-2 gap-4 md:gap-6 mb-4 md:mb-6">
                    {/* Team 1 Selection */}
                    <div>
                        <h2 className="text-lg md:text-xl font-bold text-blue-400 mb-3">Team 1 (Player)</h2>
                        <div className="space-y-2 max-h-96 overflow-y-auto">
                            {characters.map((char) => (
                                <CharacterCard
                                    key={char.id}
                                    character={char}
                                    isSelected={selectedChar1?.id === char.id}
                                    onClick={() => setSelectedChar1(char)}
                                    onView={() => setViewingChar(char)}
                                    teamColor="blue"
                                    behaviorEmoji={getBehaviorEmoji(char.aiBehavior)}
                                />
                            ))}
                        </div>
                    </div>

                    {/* Team 2 Selection */}
                    <div>
                        <h2 className="text-lg md:text-xl font-bold text-red-400 mb-3">Team 2 (Enemy)</h2>
                        <div className="space-y-2 max-h-96 overflow-y-auto">
                            {characters.map((char) => (
                                <CharacterCard
                                    key={char.id}
                                    character={char}
                                    isSelected={selectedChar2?.id === char.id}
                                    onClick={() => setSelectedChar2(char)}
                                    onView={() => setViewingChar(char)}
                                    teamColor="red"
                                    behaviorEmoji={getBehaviorEmoji(char.aiBehavior)}
                                />
                            ))}
                        </div>
                    </div>
                </div>

                {/* Start Battle Button */}
                <div className="flex justify-center">
                    <button
                        onClick={handleStartBattle}
                        disabled={!selectedChar1 || !selectedChar2 || selectedChar1.id === selectedChar2.id}
                        className={`
              px-6 md:px-8 py-3 md:py-4 rounded-lg font-bold text-base md:text-lg transition-all
              ${selectedChar1 && selectedChar2 && selectedChar1.id !== selectedChar2.id
                                ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl transform hover:scale-105'
                                : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                            }
            `}
                    >
                        {selectedChar1?.id === selectedChar2?.id
                            ? '⚠️ Select Different Fighters'
                            : selectedChar1 && selectedChar2
                                ? '⚔️ Start Battle!'
                                : 'Select Both Fighters'}
                    </button>
                </div>

                {/* Info */}
                <p className="text-gray-400 text-xs md:text-sm text-center mt-4">
                    💡 Characters loaded from Idle Arena. {characters.length} available.
                </p>
            </div>

            {/* Character Sheet Modal */}
            {viewingChar && (
                <CharacterSheet
                    character={viewingChar}
                    spells={getCharacterSpells(viewingChar)}
                    onClose={() => setViewingChar(null)}
                />
            )}
        </div>
    );
};

// Character card component
interface CharacterCardProps {
    character: SavedCharacter;
    isSelected: boolean;
    onClick: () => void;
    onView: () => void;
    teamColor: 'blue' | 'red';
    behaviorEmoji: string;
}

const CharacterCard: React.FC<CharacterCardProps> = ({
    character,
    isSelected,
    onClick,
    onView,
    teamColor,
    behaviorEmoji
}) => {
    const borderColor = teamColor === 'blue' ? 'border-blue-500' : 'border-red-500';
    const bgColor = teamColor === 'blue' ? 'bg-blue-900/20' : 'bg-red-900/20';

    return (
        <div
            className={`
        p-3 md:p-4 rounded-lg border-2 cursor-pointer transition-all
        ${isSelected ? `${borderColor} ${bgColor} shadow-lg scale-105` : 'border-gray-600 hover:border-gray-500'}
        hover:shadow-md
      `}
        >
            <div className="flex items-center gap-2 md:gap-3" onClick={onClick}>
                {/* Icon */}
                <div className={`w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center text-xl md:text-2xl ${teamColor === 'blue' ? 'bg-blue-600' : 'bg-red-600'
                    }`}>
                    {behaviorEmoji}
                </div>

                {/* Stats */}
                <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-white text-sm md:text-base truncate">{character.name}</h3>
                    <div className="text-xs text-gray-400">
                        <div>HP: {character.statBlock.hp} | DMG: {character.statBlock.damage}</div>
                        <div>Spells: {character.equippedSpellIds.length}</div>
                    </div>
                </div>

                {/* Selection indicator & View button */}
                <div className="flex items-center gap-2">
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onView();
                        }}
                        className="px-2 py-1 bg-gray-700 hover:bg-gray-600 text-white text-xs rounded"
                    >
                        📋
                    </button>
                    {isSelected && (
                        <div className="text-xl md:text-2xl">✓</div>
                    )}
                </div>
            </div>
        </div>
    );
};

// Character Sheet Modal
interface CharacterSheetProps {
    character: SavedCharacter;
    spells: Spell[];
    onClose: () => void;
}

const CharacterSheet: React.FC<CharacterSheetProps> = ({ character, spells, onClose }) => {
    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div
                className="bg-gray-800 rounded-xl border-2 border-gray-700 p-4 md:p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex justify-between items-start mb-4">
                    <h2 className="text-xl md:text-2xl font-bold text-white">{character.name}</h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-white text-2xl leading-none"
                    >
                        ×
                    </button>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 md:gap-3 mb-4">
                    <StatDisplay label="HP" value={character.statBlock.hp} />
                    <StatDisplay label="Damage" value={character.statBlock.damage} />
                    <StatDisplay label="Armor" value={character.statBlock.armor} />
                    <StatDisplay label="Crit Chance" value={`${character.statBlock.critChance}%`} />
                    <StatDisplay label="Crit Mult" value={`${character.statBlock.critMult}x`} />
                </div>

                {/* Equipped Spells */}
                <div className="mt-4">
                    <h3 className="text-lg font-bold text-white mb-2">Equipped Spells ({spells.length})</h3>
                    <div className="space-y-2">
                        {spells.map((spell) => (
                            <div key={spell.id} className="bg-gray-700/50 rounded p-2 md:p-3">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <div className="font-bold text-white text-sm md:text-base">{spell.name}</div>
                                        <div className="text-xs text-gray-400">{spell.type}</div>
                                    </div>
                                    <div className="text-right text-xs text-gray-300">
                                        {spell.effect > 0 && <div>{spell.effect}% effect</div>}
                                    </div>
                                </div>
                            </div>
                        ))}
                        {spells.length === 0 && (
                            <div className="text-gray-500 text-sm text-center py-4">No spells equipped</div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

const StatDisplay: React.FC<{ label: string; value: string | number }> = ({ label, value }) => (
    <div className="bg-gray-700/50 rounded p-2">
        <div className="text-xs text-gray-400">{label}</div>
        <div className="text-sm md:text-base font-bold text-white">{value}</div>
    </div>
);
