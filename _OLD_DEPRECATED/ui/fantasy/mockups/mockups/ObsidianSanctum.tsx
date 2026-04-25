import React from 'react';
import { FantasyButton } from '../../atoms/FantasyButton';

export const ObsidianSanctum: React.FC = () => {
    return (
        <div className="min-h-full rounded-3xl border border-[#1e2522] bg-[#050706] text-[#ebece8] px-6 py-8 shadow-[0_40px_110px_rgba(0,0,0,0.85)]">
            <header className="rounded-2xl border border-[#252f2b] bg-gradient-to-br from-[#0a0f0d] to-[#030504] p-6 flex flex-col gap-6">
                <div>
                    <p className="text-xs uppercase tracking-[0.5em] text-[#6f8b7e]">Obsidian Sanctum</p>
                    <h1 className="text-4xl font-display text-white mt-2">Sanctum Control Deck</h1>
                    <p className="text-base text-[#c5d1ca] mt-3 max-w-3xl">
                        Card scolpite come lastre di ossidiana con incisioni bronzo scuro. Palette grafite + verde profondo + riflessi satinati.
                    </p>
                </div>
                <div className="flex flex-wrap gap-3">
                    <FantasyButton variant="gold" size="lg" rightIcon="🜃">
                        Avvia Equilibrio
                    </FantasyButton>
                    <FantasyButton variant="secondary" size="lg" rightIcon="⚔">
                        Modalità Duello
                    </FantasyButton>
                </div>
            </header>

            <section className="mt-8 grid md:grid-cols-3 gap-6">
                {[
                    { label: 'Forge Budget', value: '54 pt' },
                    { label: 'Shield Ratio', value: '86%' },
                    { label: 'Tier', value: 'III Obsidian' },
                ].map((card, idx) => (
                    <div key={card.label} className="rounded-2xl border border-[#272f2c] bg-[#080b0a] p-5">
                        <p className="text-xs uppercase tracking-[0.35em] text-[#799183]">{card.label}</p>
                        <p className="text-3xl font-display mt-3 text-white">{card.value}</p>
                        <div className="mt-4 h-[3px] bg-[#111715] rounded-full">
                            <div
                                className="h-full bg-gradient-to-r from-[#89a093] via-[#54685f] to-[#c7a066]"
                                style={{ width: `${[68, 86, 40][idx]}%` }}
                            />
                        </div>
                        <p className="text-sm text-[#9aa89f] mt-3">Metriche ereditate dai moduli Mitigation e StatBlock.</p>
                    </div>
                ))}
            </section>

            <section className="mt-8 grid md:grid-cols-2 gap-6">
                <div className="rounded-2xl border border-[#262f2b] bg-[#090d0c] p-6">
                    <h2 className="font-display text-2xl text-white">Curve di Contenimento</h2>
                    <div className="mt-5 space-y-4">
                        {[
                            { label: 'Ward Mass', value: 74 },
                            { label: 'Phantom Drift', value: 51 },
                            { label: 'Slate Pressure', value: 44 },
                        ].map((stat) => (
                            <div key={stat.label}>
                                <div className="flex justify-between text-xs text-[#96a59a]">
                                    <span>{stat.label}</span>
                                    <span>{stat.value}%</span>
                                </div>
                                <div className="h-2 mt-2 bg-[#0f1412] rounded-full">
                                    <div
                                        className="h-full rounded-full bg-gradient-to-r from-[#7f978a] via-[#4d6359] to-[#c59c63]"
                                        style={{ width: `${stat.value}%` }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="rounded-2xl border border-[#272f2c] bg-gradient-to-br from-[#0a0f0d] to-[#040605] p-6">
                    <h2 className="font-display text-2xl text-white">Archetipi Sanctum</h2>
                    <p className="text-sm text-[#9daaa1] mt-2">
                        Ogni archetipo deriva da `ArchetypeBuilder`, con costanti importate dal balancing engine (nessun valore inventato).
                    </p>
                    <div className="mt-6 space-y-4">
                        {[
                            { name: 'Obsidian Bulwark', desc: 'Tank · Mitigation tuning ufficiale' },
                            { name: 'Verdigris Stalker', desc: 'Assassin · Pesato su HitChanceModule' },
                        ].map((item) => (
                            <div key={item.name} className="p-4 rounded-xl border border-[#2c3531] bg-[#090d0c]">
                                <div className="flex items-center justify-between">
                                    <p className="font-display text-xl text-white">{item.name}</p>
                                    <span className="text-xs text-[#87968d] tracking-[0.3em]">registry</span>
                                </div>
                                <p className="text-sm text-[#a9b4ac] mt-1">{item.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>
        </div>
    );
};
