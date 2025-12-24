import React from 'react';
import { FantasyButton } from '../../atoms/FantasyButton';

export const MidnightMeridian: React.FC = () => {
    return (
        <div
            className="min-h-full rounded-3xl border border-[#2c303a] bg-[#05060a] text-[#f4f7fb] px-6 py-8 shadow-[0_35px_95px_rgba(0,0,0,0.9)]"
            style={{ backgroundImage: 'linear-gradient(135deg, rgba(37,55,78,0.55), rgba(5,6,10,0.2))' }}
        >
            <header className="rounded-2xl border border-[#3a3f4b] bg-[#0b1018]/80 backdrop-blur-2xl p-6 flex flex-col gap-6">
                <div>
                    <p className="text-xs uppercase tracking-[0.55em] text-[#93a2c5]">Midnight Meridian</p>
                    <h1 className="text-4xl font-display text-white mt-2">Meridian Control Board</h1>
                    <p className="text-base text-[#c4cee4] mt-3 max-w-3xl">
                        Dashboard fumosa blu notte, con vetro satinato e grafici lineari tipo mappe stellari. Look professionale,
                        senza neon, ma con indicatori chiari collegati ai dati di balancing.
                    </p>
                </div>
                <div className="flex flex-wrap gap-3">
                    <FantasyButton variant="gold" size="lg" rightIcon="✦">
                        Avvia Tracciato
                    </FantasyButton>
                    <FantasyButton variant="nature" size="lg" rightIcon="📈">
                        Analisi Orbitale
                    </FantasyButton>
                </div>
            </header>

            <section className="mt-8 grid md:grid-cols-3 gap-6">
                {[
                    { label: 'Meridian Budget', value: '63 pt' },
                    { label: 'Stability', value: '89%' },
                    { label: 'Tier', value: 'II Meridian' },
                ].map((card, idx) => (
                    <div key={card.label} className="rounded-2xl border border-[#3a404d] bg-[#0c111b]/80 p-5">
                        <p className="text-xs uppercase tracking-[0.4em] text-[#8494b6]">{card.label}</p>
                        <p className="text-3xl font-display mt-3 text-white">{card.value}</p>
                        <div className="mt-4 h-[3px] bg-[#121724] rounded-full">
                            <div
                                className="h-full rounded-full bg-gradient-to-r from-[#7c97c8] via-[#4d6489] to-[#d4b183]"
                                style={{ width: `${[75, 89, 58][idx]}%` }}
                            />
                        </div>
                        <p className="text-sm text-[#a8b4ce] mt-3">Valori prelevati dal registry.</p>
                    </div>
                ))}
            </section>

            <section className="mt-8 grid md:grid-cols-2 gap-6">
                <div className="rounded-2xl border border-[#3c414f] bg-[#0b111a]/80 p-6">
                    <h2 className="font-display text-2xl text-white">Vector Lines</h2>
                    <div className="mt-5 space-y-4">
                        {[
                            { label: 'North Vector', value: 68 },
                            { label: 'East Vector', value: 55 },
                            { label: 'Delta Drift', value: 44 },
                        ].map((stat) => (
                            <div key={stat.label}>
                                <div className="flex justify-between text-xs text-[#9daad0]">
                                    <span>{stat.label}</span>
                                    <span>{stat.value}%</span>
                                </div>
                                <div className="h-2 mt-2 bg-[#131927] rounded-full">
                                    <div
                                        className="h-full rounded-full bg-gradient-to-r from-[#8ea3c9] via-[#556687] to-[#d2af7e]"
                                        style={{ width: `${stat.value}%` }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="rounded-2xl border border-[#3f4452] bg-gradient-to-br from-[#0f1521] to-[#070a12] p-6">
                    <h2 className="font-display text-2xl text-white">Archetipi Meridian</h2>
                    <p className="text-sm text-[#bcc7e1] mt-2">
                        Profili generati dal builder ufficiale con riferimenti a StatBlock e Mitigation.
                    </p>
                    <div className="mt-6 space-y-4">
                        {[
                            { name: 'Polar Sentinel', desc: 'Tank · MitigationModule oriented' },
                            { name: 'Azimuth Runner', desc: 'Assassin · HitChanceModule tuning' },
                        ].map((item) => (
                            <div key={item.name} className="p-4 rounded-xl border border-[#4d5463] bg-[#0f1522]/70">
                                <div className="flex items-center justify-between">
                                    <p className="font-display text-xl text-white">{item.name}</p>
                                    <span className="text-xs text-[#94a3c7] tracking-[0.3em]">registry</span>
                                </div>
                                <p className="text-sm text-[#c1cae1] mt-1">{item.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>
        </div>
    );
};
