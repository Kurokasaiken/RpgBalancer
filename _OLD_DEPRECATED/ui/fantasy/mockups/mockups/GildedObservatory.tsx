import React from 'react';
import { FantasyButton } from '../../atoms/FantasyButton';

export const GildedObservatory: React.FC = () => (
    <div className="min-h-full bg-gradient-to-br from-[#050509] via-[#0f1a1d] to-[#132427] text-[#f0efe4] px-6 py-8 rounded-3xl border border-[#2c3737] shadow-[0_35px_90px_rgba(0,0,0,0.85)]">
        <header className="rounded-2xl border border-[#3b4b4d] bg-[#0c1517]/80 p-6 flex flex-col gap-6 shadow-[0_20px_60px_rgba(0,0,0,0.7)]">
            <div>
                <p className="text-xs uppercase tracking-[0.6em] text-[#8db3a5]">Gilded Observatory</p>
                <h1 className="text-4xl font-display text-[#f6f3e4] mt-2">Astrolabe Balance Deck</h1>
                <p className="text-base text-[#cfdfd8] mt-3 max-w-3xl">
                    Dark academia che unisce strumenti astronomici e UI luxury. Card marmorizzate, cerchi concentrici e slider ispirati agli
                    astrolabi, tutti collegati al balancing engine.
                </p>
            </div>
            <div className="flex flex-wrap gap-3">
                <FantasyButton variant="gold" size="lg" rightIcon="🜚">
                    Avvia Orbita
                </FantasyButton>
                <FantasyButton variant="secondary" size="lg" rightIcon="⚙️" className="border-[#475758]">
                    Configura Moduli
                </FantasyButton>
            </div>
        </header>

        <section className="mt-8 grid md:grid-cols-3 gap-6">
            {['Orbital Budget', 'Ecliptic Harmony', 'Constellation Tier'].map((label, idx) => (
                <div key={label} className="rounded-2xl border border-[#384444] bg-gradient-to-br from-[#101e22] to-[#0b1315] p-6 shadow-[0_15px_45px_rgba(0,0,0,0.6)]">
                    <div className="flex items-center justify-between">
                        <p className="text-xs uppercase tracking-[0.3em] text-[#6da8a0]">{label}</p>
                        <span className="text-[#c7b996] text-sm">registry</span>
                    </div>
                    <p className="text-3xl font-display mt-3 text-[#f5f0dc]">{[48, '87%', 'Tier II'][idx]}</p>
                    <div className="mt-4 h-[1px] bg-gradient-to-r from-transparent via-[#c9a227] to-transparent" />
                    <p className="text-sm text-[#aeb8b4] mt-3">Metriche ereditate dai moduli StatBlock e Mitigation.</p>
                </div>
            ))}
        </section>

        <section className="mt-8 grid md:grid-cols-2 gap-6">
            <div className="rounded-2xl border border-[#3b4a4a] bg-[#0c181b]/80 p-6">
                <h2 className="font-display text-2xl text-[#f5f0dc]">Celestial Stat Curves</h2>
                <p className="text-sm text-[#9fb3af] mt-2">Dati provenienti da StatBlock e MitigationModule visualizzati come orbite concentriche.</p>
                <div className="mt-6 space-y-5">
                    {[
                        { label: 'Solar Mass', value: 72 },
                        { label: 'Lunar Flux', value: 58 },
                        { label: 'Starfall Drift', value: 41 },
                    ].map((stat) => (
                        <div key={stat.label}>
                            <div className="flex justify-between text-xs text-[#96aaa6]">
                                <span>{stat.label}</span>
                                <span>{stat.value}%</span>
                            </div>
                            <div className="h-2 mt-2 bg-[#1b282b] rounded-full">
                                <div
                                    className="h-full rounded-full bg-gradient-to-r from-[#f1d69c] via-[#d9bf7d] to-[#a7894f]"
                                    style={{ width: `${stat.value}%` }}
                                />
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="rounded-2xl border border-[#3e4d4d] bg-gradient-to-br from-[#0d1c1e] to-[#071012] p-6">
                <h2 className="font-display text-2xl text-[#f5f0dc]">Archetipi Celesti</h2>
                <div className="mt-5 space-y-4">
                    {[
                        { name: 'Aureate Navigator', desc: 'Support · Pathfinding dai moduli grid' },
                        { name: 'Obsidian Zephyr', desc: 'Assassin · StatBlock high-mobility' },
                    ].map((item) => (
                        <div key={item.name} className="p-4 rounded-xl border border-[#404f51] bg-[#111c1e]/80">
                            <div className="flex items-center justify-between">
                                <p className="font-display text-xl text-[#f3eddb]">{item.name}</p>
                                <span className="text-xs text-[#b3c8c4] tracking-[0.2em]">registry</span>
                            </div>
                            <p className="text-sm text-[#b5c1bd]">{item.desc}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    </div>
);
