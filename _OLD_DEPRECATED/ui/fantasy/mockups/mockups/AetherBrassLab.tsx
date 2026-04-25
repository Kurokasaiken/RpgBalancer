import React from 'react';
import { FantasyButton } from '../../atoms/FantasyButton';

export const AetherBrassLab: React.FC = () => {
    return (
        <div className="min-h-full rounded-3xl border border-[#263236] bg-[#070a0c] text-[#f1f6f4] px-6 py-8 shadow-[0_35px_90px_rgba(0,0,0,0.85)]">
            <header className="rounded-2xl border border-[#314043] bg-gradient-to-br from-[#0f1518] to-[#050708] p-6 flex flex-col gap-6">
                <div>
                    <p className="text-xs uppercase tracking-[0.55em] text-[#91b3b5]">Aether Brass Lab</p>
                    <h1 className="text-4xl font-display text-white mt-2">Laboratorio Alchemico</h1>
                    <p className="text-base text-[#c8d8d6] mt-3 max-w-3xl">
                        Card metalliche con bordi ottone satinato e accenti teal smorzati. Pensato come console di laboratorio
                        alchemico hi-tech collegato al balancing engine.
                    </p>
                </div>
                <div className="flex flex-wrap gap-3">
                    <FantasyButton variant="gold" size="lg" rightIcon="☌">
                        Avvia Esperimento
                    </FantasyButton>
                    <FantasyButton variant="secondary" size="lg" rightIcon="⚙">
                        Configura Moduli
                    </FantasyButton>
                </div>
            </header>

            <section className="mt-8 grid md:grid-cols-3 gap-6">
                {[
                    { label: 'Catalyst Budget', value: '59 pt' },
                    { label: 'Stability Index', value: '88%' },
                    { label: 'Tier', value: 'II Brass' },
                ].map((card, idx) => (
                    <div key={card.label} className="rounded-2xl border border-[#344043] bg-[#0a1012] p-5">
                        <p className="text-xs uppercase tracking-[0.4em] text-[#7ea3a5]">{card.label}</p>
                        <p className="text-3xl font-display mt-3 text-white">{card.value}</p>
                        <div className="mt-4 h-[3px] bg-[#141b1e] rounded-full">
                            <div
                                className="h-full rounded-full bg-gradient-to-r from-[#89c2c5] via-[#4f6c74] to-[#cfa86f]"
                                style={{ width: `${[74, 88, 55][idx]}%` }}
                            />
                        </div>
                        <p className="text-sm text-[#aab8b6] mt-3">Dati ottenuti da StatBlock e MitigationModule.</p>
                    </div>
                ))}
            </section>

            <section className="mt-8 grid md:grid-cols-2 gap-6">
                <div className="rounded-2xl border border-[#323f42] bg-[#0b1113] p-6">
                    <h2 className="font-display text-2xl text-white">Pesi di Laboratorio</h2>
                    <div className="mt-5 space-y-4">
                        {[
                            { label: 'Ether Mass', value: 71 },
                            { label: 'Steam Pressure', value: 54 },
                            { label: 'Vivarium Shield', value: 46 },
                        ].map((stat) => (
                            <div key={stat.label}>
                                <div className="flex justify-between text-xs text-[#a4b6b3]">
                                    <span>{stat.label}</span>
                                    <span>{stat.value}%</span>
                                </div>
                                <div className="h-2 mt-2 bg-[#10171a] rounded-full">
                                    <div
                                        className="h-full rounded-full bg-gradient-to-r from-[#92bcbc] via-[#54747b] to-[#d0a96f]"
                                        style={{ width: `${stat.value}%` }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="rounded-2xl border border-[#354244] bg-gradient-to-br from-[#101619] to-[#050708] p-6">
                    <h2 className="font-display text-2xl text-white">Archetipi Aether</h2>
                    <p className="text-sm text-[#b7c7c4] mt-2">
                        Profili generati con `ArchetypeBuilder`, nessun hardcode: tutti i valori provengono dal balancing engine.
                    </p>
                    <div className="mt-6 space-y-4">
                        {[
                            { name: 'Brass Warden', desc: 'Tank · Pesato su MitigationModule' },
                            { name: 'Reactant Savant', desc: 'Support · SustainModule + SpellCost' },
                        ].map((item) => (
                            <div key={item.name} className="p-4 rounded-xl border border-[#3b4a4c] bg-[#0a1012]">
                                <div className="flex items-center justify-between">
                                    <p className="font-display text-xl text-white">{item.name}</p>
                                    <span className="text-xs text-[#8fa8a6] tracking-[0.3em]">registry</span>
                                </div>
                                <p className="text-sm text-[#b5c2c0] mt-1">{item.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>
        </div>
    );
};
