import React from 'react';
import { FantasyButton } from '../../atoms/FantasyButton';

export const SeraphimArchive: React.FC = () => (
    <div className="min-h-full rounded-3xl border border-[#d6cfd0] bg-[#f6f2f0] text-[#1f1715] px-6 py-8 shadow-[0_30px_80px_rgba(59,48,45,0.25)]">
        <header className="grid gap-6 md:grid-cols-2">
            <div className="rounded-2xl border border-[#e5dbd6] bg-white p-6">
                <p className="text-xs uppercase tracking-[0.6em] text-[#ac8f7b]">Seraphim Archive</p>
                <h1 className="text-4xl font-display text-[#211715] mt-2">Archivio Serafico</h1>
                <p className="text-base text-[#4d3933] mt-3">
                    Marmo chiaro venato, accenti prugna e bronzo. Vibe archivio ecclesiastico tech: ideale per presentare dati di balancing
                    con autorevolezza.
                </p>
            </div>
            <div className="rounded-2xl border border-[#e0d4cf] bg-gradient-to-br from-[#fffaf7] to-[#f1e3df] p-6">
                <h2 className="font-display text-2xl">Azioni</h2>
                <div className="mt-4 flex flex-wrap gap-3">
                    <FantasyButton variant="gold" size="md" rightIcon="✠">
                        Convalida Stat
                    </FantasyButton>
                    <FantasyButton variant="secondary" size="md" rightIcon="⟟" className="border-[#8a7262]">
                        Esporta Registro
                    </FantasyButton>
                </div>
            </div>
        </header>

        <section className="mt-8 grid md:grid-cols-3 gap-6">
            {[
                { label: 'Archivio Budget', value: '60 pt' },
                { label: 'Concordia', value: '92%' },
                { label: 'Tier', value: 'III Sanctum' },
            ].map((card, idx) => (
                <div key={card.label} className="rounded-2xl border border-[#e4d7d0] bg-white p-5">
                    <p className="text-xs uppercase tracking-[0.4em] text-[#9c7c6a]">{card.label}</p>
                    <p className="text-3xl font-display mt-3">{card.value}</p>
                    <div className="mt-4 h-[3px] bg-[#f4e7df] rounded-full">
                        <div
                            className="h-full rounded-full bg-gradient-to-r from-[#d6b18e] via-[#ad7a6c] to-[#4e3a35]"
                            style={{ width: `${[74, 92, 50][idx]}%` }}
                        />
                    </div>
                    <p className="text-sm text-[#4f3c35] mt-3">Valori ottenuti dal balancing registry.</p>
                </div>
            ))}
        </section>

        <section className="mt-8 grid md:grid-cols-2 gap-6">
            <div className="rounded-2xl border border-[#e2d7d1] bg-white p-6">
                <h2 className="font-display text-2xl flex items-center gap-2">
                    <span className="text-[#b88d77]">✶</span> Tavole Celesti
                </h2>
                <div className="mt-5 space-y-4">
                    {[
                        { label: 'Gloria Shield', value: 69 },
                        { label: 'Cantus Flux', value: 53 },
                        { label: 'Reliquia Drift', value: 41 },
                    ].map((stat) => (
                        <div key={stat.label}>
                            <div className="flex justify-between text-sm text-[#4d3a33]">
                                <span>{stat.label}</span>
                                <span>{stat.value}%</span>
                            </div>
                            <div className="h-2 mt-1 bg-[#f6ebe4] rounded-full">
                                <div
                                    className="h-full rounded-full bg-gradient-to-r from-[#d8b193] via-[#a57274] to-[#503838]"
                                    style={{ width: `${stat.value}%` }}
                                />
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="rounded-2xl border border-[#e2d7d1] bg-white p-6">
                <h2 className="font-display text-2xl">Archetipi Serafici</h2>
                <p className="text-sm text-[#4a3933] mt-2">
                    Archetipi generati da `ArchetypeBuilder`, calibrati con StatBlock e Mitigation.
                </p>
                <div className="mt-5 space-y-4">
                    {[
                        { name: 'Cantor Aegis', desc: 'Support · SustainModule validato' },
                        { name: 'Libram Sentinel', desc: 'Tank · StatBlock high-defense' },
                    ].map((item) => (
                        <div key={item.name} className="p-4 rounded-xl border border-[#edded6] bg-gradient-to-r from-white to-[#fbf4ef]">
                            <div className="flex items-center justify-between">
                                <p className="font-display text-xl">{item.name}</p>
                                <span className="text-xs text-[#a5816f] tracking-[0.3em]">registry</span>
                            </div>
                            <p className="text-sm text-[#4d3a33] mt-1">{item.desc}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    </div>
);
