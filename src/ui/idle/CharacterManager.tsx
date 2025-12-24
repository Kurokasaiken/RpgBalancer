// src/ui/idle/CharacterManager.tsx - Using StatBlock

import React, { useState, useEffect, useCallback } from 'react';
import { CharacterBuilder } from './CharacterBuilder';
import type { Combatant } from '../../engine/idle/types';
import {
    saveCharacter,
    loadCharacters,
    deleteCharacter,
    type SavedCharacter,
} from '../../engine/idle/characterStorage';
import {
    readCharacterSnapshot,
    writeCharacterSnapshot,
    getCharacterStorageEventName,
} from '../../engine/idle/characterPersistence';

export const CharacterManager: React.FC = () => {
    const [characters, setCharacters] = useState<SavedCharacter[]>([]);
    const [selectedCharacter, setSelectedCharacter] = useState<SavedCharacter | null>(null);
    const [snapshotText, setSnapshotText] = useState<string>('[]');
    const [snapshotStatus, setSnapshotStatus] = useState<string | null>(null);
    const [snapshotError, setSnapshotError] = useState<string | null>(null);
    const [isSnapshotLoading, setSnapshotLoading] = useState<boolean>(false);

    useEffect(() => {
        setCharacters(loadCharacters());
    }, []);

    useEffect(() => {
        if (typeof window === 'undefined') return;
        const eventName = getCharacterStorageEventName();
        const handleUpdate = () => setCharacters(loadCharacters());
        window.addEventListener(eventName, handleUpdate);
        return () => window.removeEventListener(eventName, handleUpdate);
    }, []);

    /**
     * Refreshes the JSON snapshot stored via PersistenceService.
     */
    const refreshSnapshot = useCallback(async () => {
        setSnapshotLoading(true);
        setSnapshotStatus(null);
        setSnapshotError(null);
        try {
            const json = await readCharacterSnapshot();
            setSnapshotText(json ?? '[]');
            setSnapshotStatus('Snapshot aggiornata.');
        } catch (error) {
            console.error('Impossibile leggere il roster:', error);
            setSnapshotError('Errore nella lettura del roster salvato.');
        } finally {
            setSnapshotLoading(false);
        }
    }, []);

    /**
     * Imports the snapshot currently in the editor textarea.
     */
    const handleSnapshotImport = useCallback(async () => {
        setSnapshotStatus(null);
        setSnapshotError(null);
        try {
            const payload = snapshotText?.trim() || '[]';
            JSON.parse(payload);
            await writeCharacterSnapshot(payload);
            setCharacters(loadCharacters());
            setSnapshotStatus('Roster importato correttamente.');
        } catch (error) {
            console.error('Errore durante l\'import del roster:', error);
            setSnapshotError('JSON non valido o impossibile salvare il roster.');
        }
    }, [snapshotText]);

    /**
     * Copies the current snapshot JSON to the clipboard.
     */
    const handleSnapshotCopy = useCallback(async () => {
        setSnapshotStatus(null);
        setSnapshotError(null);
        try {
            await navigator.clipboard.writeText(snapshotText);
            setSnapshotStatus('Snapshot copiata negli appunti.');
        } catch (error) {
            console.error('Impossibile copiare negli appunti:', error);
            setSnapshotError('Non riesco a copiare negli appunti.');
        }
    }, [snapshotText]);

    useEffect(() => {
        void refreshSnapshot();
    }, [refreshSnapshot]);

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
        <div className="h-full overflow-y-auto bg-gradient-to-br from-indigo-950 via-purple-950 to-slate-950 p-4 relative">
            {/* Animated background particles */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute w-96 h-96 bg-purple-500/10 rounded-full blur-3xl top-10 -left-20 animate-pulse" />
                <div className="absolute w-96 h-96 bg-blue-500/10 rounded-full blur-3xl bottom-10 -right-20 animate-pulse" style={{ animationDelay: '1s' }} />
            </div>
            <div className="flex flex-col h-full space-y-4 relative z-10">
                <div className="backdrop-blur-md bg-white/5 border border-white/10 p-6 rounded-xl shadow-[0_4px_16px_rgba(0,0,0,0.3)]">
                    <h1 className="text-3xl font-bold text-white mb-3 drop-shadow-[0_0_8px_rgba(96,165,250,0.6)]">👤 Character Manager</h1>
                    <p className="text-gray-300 text-sm">
                        Crea e gestisci i tuoi personaggi usando le stats del modulo di bilanciamento.
                    </p>
                </div>

                {/* Visual separator */}
                <div className="h-px bg-gradient-to-r from-transparent via-white/20 to-transparent my-4" />

                <div className="flex flex-1 space-x-4 overflow-hidden">
                    {/* Left: Character Builder */}
                    <div className="w-1/2 overflow-y-auto backdrop-blur-md bg-white/5 border border-white/10 p-4 rounded-xl shadow-[0_4px_16px_rgba(0,0,0,0.3)]">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold text-white drop-shadow-[0_0_6px_rgba(168,85,247,0.6)]">
                                {selectedCharacter ? `✏️ Modifica: ${selectedCharacter.name}` : '➕ Nuovo Personaggio'}
                            </h2>
                            {selectedCharacter && (
                                <button
                                    onClick={handleCancelEdit}
                                    className="px-4 py-2 bg-white/10 border border-white/20 hover:bg-white/15 hover:shadow-[0_0_12px_rgba(255,255,255,0.3)] text-white rounded transition-all"
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
                    <div className="w-1/2 overflow-y-auto backdrop-blur-md bg-white/5 border border-white/10 p-4 rounded-xl shadow-[0_4px_16px_rgba(0,0,0,0.3)]">
                        <h2 className="text-xl font-bold text-white mb-4 drop-shadow-[0_0_6px_rgba(168,85,247,0.6)]">
                            📋 Personaggi Salvati ({characters.length})
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
                                            className={`bg-white/5 backdrop-blur-md p-4 rounded-lg border-2 transition-all hover:scale-[1.01] ${selectedCharacter?.id === char.id
                                                ? 'border-blue-400 shadow-[0_0_12px_rgba(96,165,250,0.4)]'
                                                : 'border-white/10 hover:border-purple-400/30'
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
                                                        className="px-3 py-1 bg-gradient-to-r from-blue-500 to-cyan-500 hover:shadow-[0_0_12px_rgba(59,130,246,0.6)] text-white rounded text-sm transition-all"
                                                    >
                                                        Modifica
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(char.id)}
                                                        className="px-3 py-1 bg-white/10 border border-red-400/50 hover:bg-red-950/30 hover:shadow-[0_0_12px_rgba(248,113,113,0.4)] text-red-400 rounded text-sm transition-all"
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

                        <div className="mt-6 border-t border-white/10 pt-4">
                            <div className="flex items-center justify-between mb-3">
                                <h3 className="text-lg font-semibold text-white">📦 Snapshot Roster</h3>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => void refreshSnapshot()}
                                        className="px-3 py-1 bg-white/10 border border-white/20 text-white rounded text-sm hover:bg-white/15 transition"
                                        disabled={isSnapshotLoading}
                                    >
                                        {isSnapshotLoading ? 'Aggiornamento…' : 'Ricarica JSON'}
                                    </button>
                                    <button
                                        onClick={() => void handleSnapshotCopy()}
                                        className="px-3 py-1 bg-white/10 border border-white/20 text-white rounded text-sm hover:bg-white/15 transition"
                                    >
                                        Copia
                                    </button>
                                    <button
                                        onClick={() => void handleSnapshotImport()}
                                        className="px-3 py-1 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded text-sm hover:shadow-[0_0_12px_rgba(16,185,129,0.5)] transition"
                                    >
                                        Importa
                                    </button>
                                </div>
                            </div>
                            <p className="text-xs text-gray-400 mb-2">
                                Modifica il JSON per aggiornare HP / Fatigue dei personaggi o sostituire il roster. Le modifiche sono validate
                                prima dell&apos;import.
                            </p>
                            <textarea
                                className="w-full h-48 bg-black/20 border border-white/10 rounded p-3 text-xs font-mono text-white focus:outline-none focus:border-purple-400/60"
                                value={snapshotText}
                                onChange={(event) => setSnapshotText(event.target.value)}
                            />
                            {snapshotStatus && (
                                <div className="mt-2 text-xs text-emerald-300">{snapshotStatus}</div>
                            )}
                            {snapshotError && (
                                <div className="mt-2 text-xs text-red-300">{snapshotError}</div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
