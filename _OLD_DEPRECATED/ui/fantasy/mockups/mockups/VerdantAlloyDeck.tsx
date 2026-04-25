import React from 'react';
import { FantasyButton } from '../../atoms/FantasyButton';

export const VerdantAlloyDeck: React.FC = () => (
    <div className="min-h-full rounded-3xl border border-[#2c3b33] bg-[#050706] text-[#e8f2ea] px-6 py-8 shadow-[0_40px_110px_rgba(0,0,0,0.85)]">
        <header className="rounded-2xl border border-[#314136] bg-gradient-to-br from-[#0b120d] to-[#040605] p-6 flex flex-col gap-6">
            <div>
                <p className="text-xs uppercase tracking-[0.55em] text-[#8fb29c]">Verdant Alloy Deck</p>
                <h1 className="text-4xl font-display text-white mt-2">Eco-Industrial Console</h1>
                <p className="text-base text-[#bfd0c3] mt-3 max-w-3xl">
                    Palette verde sequoia + acciaio spazzolato + oro satinato. Perfetta per unire l'identità botanica con la solidità
                    degli strumenti industriali.
                </p>
            </div>
            <div className="flex flex-wrap gap-3">
                <FantasyButton variant="primary" size="lg" rightIcon="🌱">
                    Salva Blend
                </FantasyButton>
                <FantasyButton variant="gold" size="lg" rightIcon="⚙️">
                    Analisi Alloy
                </FantasyButton>
            </div>
        </header>

        <section className="mt-8 grid md:grid-cols-3 gap-6">
            {[
                { label: 'Alloy Budget', value: '65 pt' },
                { label: 'Stability', value: '90%' },
                { label: 'Tier', value: 'II Alloy' },
            ].map((card, idx) => (
                <div key={card.label} className="rounded-2xl border border-[#34443a] bg-[#0b120e] p-5">
                    <p className="text-xs uppercase tracking-[0.4em] text-[#8fb29d]">{card.label}</p>
                    <p className="text-3xl font-display mt-3 text-white">{card.value}</p>
                    <div className="mt-4 h-[3px] bg-[#131c17] rounded-full">
                        <div
                            className="h-full rounded-full bg-gradient-to-r from-[#9ad5b8] via-[#5f8c71] to-[#d2b07c]"
                            style={{ width: `${[78, 90, 60][idx]}%` }}
                        />
                    </div>
                    <p className="text-sm text-[#a6b6ad] mt-3">Valori derivati dal balancing engine.</p>
                </div>
            ))}
        </section>

        <section className="mt-8 grid md:grid-cols-2 gap-6">
            <div className="rounded-2xl border border-[#324238] bg-[#0a110c] p-6">
                <h2 className="font-display text-2xl text-white">Metriche Bio-Metal</h2>
                <div className="mt-5 space-y-4">
                    {[
                        { label: 'Canopy Shield', value: 72 },
                        { label: 'Alloy Flow', value: 57 },
                        { label: 'Root Conductivity', value: 45 },
                    ].map((stat) => (
                        <div key={stat.label}>
                            <div className="flex justify-between text-xs text-[#a9c0b1]">
                                <span>{stat.label}</span>
                                <span>{stat.value}%</span>
                            </div>
                            <div className="h-2 mt-2 bg-[#111a15] rounded-full">
                                <div
                                    className="h-full rounded-full bg-gradient-to-r from-[#a9dfc3] via-[#6c9a7b] to-[#caa66f]"
                                    style={{ width: `${stat.value}%` }}
                                />
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="rounded-2xl border border-[#324238] bg-gradient-to-br from-[#0f1711] to-[#050806] p-6">
                <h2 className="font-display text-2xl text-white">Archetipi Alloy</h2>
                <p className="text-sm text-[#b6c5ba] mt-2">
                    Profili costruiti con `WeightBasedCreator` e moduli ufficiali (StatBlock, Mitigation, Sustain).
                </p>
                <div className="mt-6 space-y-4">
                    {[
                        { name: 'Sequoia Bastion', desc: 'Tank · MitigationModule + StatBlock HP' },
                        { name: 'Forge Runner', desc: 'Hybrid · HitChance + Sustain mix' },
                    ].map((item) => (
                        <div key={item.name} className="p-4 rounded-xl border border-[#37473d] bg-[#0b120d]">
                            <div className="flex items-center justify-between">
                                <p className="font-display text-xl text-white">{item.name}</p>
                                <span className="text-xs text-[#94b0a0] tracking-[0.3em]">registry</span>
                            </div>
                            <p className="text-sm text-[#b4c3b8] mt-1">{item.desc}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    </div>
);
