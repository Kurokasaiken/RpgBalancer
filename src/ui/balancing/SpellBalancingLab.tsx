import React, { useState } from 'react';
import { DEFAULT_STATS } from '../../balancing/types';
import { loadSpells } from '../../balancing/spellStorage';
import type { Spell } from '../../balancing/spellTypes';

export const SpellBalancingLab: React.FC = () => {
    const spells = loadSpells();
    const [spellAId, setSpellAId] = useState<string>(spells[0]?.id || '');
    const [spellBId, setSpellBId] = useState<string>(spells[1]?.id || spells[0]?.id || '');
    const [result, setResult] = useState<{ winA: number, winB: number, sims: number, log: string[] } | null>(null);
    const [isRunning, setIsRunning] = useState(false);

    const runDuel = async () => {
        setIsRunning(true);
        const spellA = spells.find(s => s.id === spellAId);
        const spellB = spells.find(s => s.id === spellBId);

        if (!spellA || !spellB) {
            alert("Select two spells!");
            setIsRunning(false);
            return;
        }

        let winsA = 0;
        const sims = 1000;
        let lastLog: string[] = [];

        for (let i = 0; i < sims; i++) {
            let hpA = 1000;
            let hpB = 1000;
            let manaA = 100;
            let manaB = 100;
            let cdA = 0;
            let cdB = 0;
            let turn = 0;

            const isLastSim = i === sims - 1;
            if (isLastSim) lastLog.push(`Duel Start: ${spellA.name} vs ${spellB.name}`);

            // Random start
            let turnA = i % 2 === 0;

            while (hpA > 0 && hpB > 0 && turn < 100) {
                // Cooldowns tick down at start of turn (simplified)
                if (turnA) cdA = Math.max(0, cdA - 1);
                else cdB = Math.max(0, cdB - 1);

                if (turnA) {
                    // A acts
                    if (cdA === 0 && manaA >= (spellA.manaCost || 0)) {
                        // Cast Spell A
                        const dmg = (spellA.effect / 100) * 25 * (1 + spellA.scale); // Base Atk 25
                        hpB -= dmg;
                        cdA = Math.ceil(spellA.cooldown); // Assume CD is in turns/seconds
                        manaA -= (spellA.manaCost || 0);
                        if (isLastSim) lastLog.push(`A casts ${spellA.name} for ${dmg.toFixed(0)} dmg. Mana: ${manaA}`);
                    } else {
                        // Basic Attack (10 dmg) + Regen
                        hpB -= 10;
                        manaA = Math.min(100, manaA + 5);
                        if (isLastSim) lastLog.push(`A attacks for 10 dmg. Mana: ${manaA}`);
                    }
                } else {
                    // B acts
                    if (cdB === 0 && manaB >= (spellB.manaCost || 0)) {
                        // Cast Spell B
                        const dmg = (spellB.effect / 100) * 25 * (1 + spellB.scale);
                        hpA -= dmg;
                        cdB = Math.ceil(spellB.cooldown);
                        manaB -= (spellB.manaCost || 0);
                        if (isLastSim) lastLog.push(`B casts ${spellB.name} for ${dmg.toFixed(0)} dmg. Mana: ${manaB}`);
                    } else {
                        // Basic Attack
                        hpA -= 10;
                        manaB = Math.min(100, manaB + 5);
                        if (isLastSim) lastLog.push(`B attacks for 10 dmg. Mana: ${manaB}`);
                    }
                }
                turnA = !turnA;
                turn++;
            }

            if (hpA > 0 && hpB <= 0) winsA++;

            if (isLastSim) {
                lastLog.push(`Duel End. Winner: ${hpA > 0 ? 'A' : 'B'}. HP A: ${hpA.toFixed(0)}, HP B: ${hpB.toFixed(0)}`);
            }
        }

        setResult({
            winA: winsA,
            winB: sims - winsA,
            sims,
            log: lastLog
        });
        setIsRunning(false);
    };

    return (
        <div className="text-center">
            <div className="text-6xl mb-4">✨</div>
            <h3 className="text-2xl font-bold text-white mb-2">Spell Duel Lab</h3>
            <p className="text-gray-400 max-w-lg mx-auto mb-8">
                Simulate 1v1 duels where entities only use a specific spell (plus basic attacks on cooldown).
                <br /><span className="text-xs text-gray-500">Base HP: 1000, Base Atk: 25, Base Mana: 100 (+5/turn regen)</span>
            </p>

            <div className="flex justify-center gap-8 mb-8 items-center">
                <div className="text-left">
                    <label className="block text-sm text-blue-400 font-bold mb-1">Mage A</label>
                    <select
                        value={spellAId}
                        onChange={e => setSpellAId(e.target.value)}
                        className="bg-gray-800 text-white p-2 rounded border border-blue-500 w-64"
                    >
                        {spells.map(s => <option key={s.id} value={s.id}>{s.name} (CD: {s.cooldown}, Mana: {s.manaCost})</option>)}
                    </select>
                </div>

                <div className="text-2xl font-bold text-gray-600">VS</div>

                <div className="text-left">
                    <label className="block text-sm text-red-400 font-bold mb-1">Mage B</label>
                    <select
                        value={spellBId}
                        onChange={e => setSpellBId(e.target.value)}
                        className="bg-gray-800 text-white p-2 rounded border border-red-500 w-64"
                    >
                        {spells.map(s => <option key={s.id} value={s.id}>{s.name} (CD: {s.cooldown}, Mana: {s.manaCost})</option>)}
                    </select>
                </div>
            </div>

            <button
                onClick={runDuel}
                disabled={isRunning}
                className="px-8 py-3 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-lg shadow-lg mb-8"
            >
                {isRunning ? 'Dueling...' : 'FIGHT!'}
            </button>

            {result && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto text-left">
                    <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
                        <h4 className="text-xl font-bold text-white mb-4">Duel Results ({result.sims} sims)</h4>
                        <div className="flex justify-between items-center">
                            <div className="text-center">
                                <div className="text-3xl font-bold text-blue-400">{((result.winA / result.sims) * 100).toFixed(1)}%</div>
                                <div className="text-xs text-gray-400">Mage A Wins</div>
                            </div>
                            <div className="text-gray-600 font-bold">Win Rate</div>
                            <div className="text-center">
                                <div className="text-3xl font-bold text-red-400">{((result.winB / result.sims) * 100).toFixed(1)}%</div>
                                <div className="text-xs text-gray-400">Mage B Wins</div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-gray-900 p-4 rounded-xl border border-gray-800 h-64 overflow-y-auto font-mono text-xs text-gray-400">
                        <h4 className="text-sm font-bold text-white mb-2 sticky top-0 bg-gray-900 pb-2">Combat Log (Last Sim)</h4>
                        {result.log.map((line, i) => (
                            <div key={i} className="mb-1">{line}</div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};
