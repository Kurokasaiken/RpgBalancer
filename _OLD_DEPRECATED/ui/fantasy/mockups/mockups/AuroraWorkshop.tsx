import React from 'react';
import { FantasyButton } from '../../atoms/FantasyButton';

export const AuroraWorkshop: React.FC = () => {
    return (
        <div
            className="min-h-full rounded-3xl border border-[#3c3f4a] bg-[#0c0e16] text-white px-6 py-8 shadow-[0_40px_100px_rgba(0,0,0,0.85)]"
            style={{ backgroundImage: 'linear-gradient(130deg, rgba(156,138,208,0.25), transparent 60%)' }}
        >
            <header className="rounded-2xl border border-[#4a4f5f] bg-[#131624]/80 backdrop-blur-xl p-6 flex flex-col gap-6">
                <div>
                    <p className="text-xs uppercase tracking-[0.55em] text-[#b5b8d3]">Aurora Workshop</p>
                    <h1 className="text-4xl font-display text-white mt-2">Glass Studio Console</h1>
                    <p className="text-base text-[#d6d8ec] mt-3 max-w-3xl">
                        Glassmorphism minimalista con toni polvere (viola/argento) e glow controllato. Carta satinata e tipografia
                        neo-grotesk per un feeling professionale.
                    </p>
                </div>
                <div className="flex flex-wrap gap-3">
                    <FantasyButton variant="gold" size="lg" rightIcon="✺">
                        Avvia Sessione
                    </FantasyButton>
                    <FantasyButton variant="nature" size="lg" rightIcon="⟳">
                        Aggiorna Metriche
                    </FantasyButton>
                </div>
            </header>

            <section className="mt-8 grid md:grid-cols-3 gap-6">
                {["Budget","Stability","Tier"].map((label, idx) => (
                    <div
                        key={label}
                        className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-2xl p-5 shadow-[0_25px_70px_rgba(0,0,0,0.4)]"
                    >
                        <p className="text-xs uppercase tracking-[0.4em] text-[#b9c0e2]">{label}</p>
                        <p className="text-3xl font-display mt-3 text-white">{['61 pt', '90%', 'II Aurora'][idx]}</p>
                        <div className="mt-4 h-[3px] bg-white/10 rounded-full">
                            <div
                                className="h-full bg-gradient-to-r from-[#d0c4ff] via-[#a894e9] to-[#e9cca7]"
                                style={{ width: `${[72, 90, 55][idx]}%` }}
                            />
                        </div>
                    </div>
                ))}
            </section>

            <section className="mt-8 grid md:grid-cols-2 gap-6">
                <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-3xl p-6">
                    <h2 className="font-display text-2xl text-white">Layer Metrics</h2>
                    <div className="mt-5 space-y-4">
                        {[
                            { label: 'Glass Flux', value: 68 },
                            { label: 'Prism Drift', value: 52 },
                            { label: 'Ion Bloom', value: 41 },
                        ].map((stat) => (
                            <div key={stat.label}>
                                <div className="flex justify-between text-xs text-[#cbd5ff]">
                                    <span>{stat.label}</span>
                                    <span>{stat.value}%</span>
                                </div>
                                <div className="h-2 mt-2 bg-white/10 rounded-full">
                                    <div
                                        className="h-full rounded-full bg-gradient-to-r from-[#d8d2ff] via-[#ad9fe8] to-[#f4cfa9]"
                                        style={{ width: `${stat.value}%` }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-white/10 to-transparent backdrop-blur-3xl p-6">
                    <h2 className="font-display text-2xl text-white">Archetipi Aurora</h2>
                    <p className="text-sm text-[#c2c8e6] mt-2">
                        Profili generati con `ArchetypeBuilder`, con validazione budget e versioni storiche registrate.
                    </p>
                    <div className="mt-6 space-y-4">
                        {[
                            { name: 'Spectral Architect', desc: 'Support · Basato su sustain e regen modulare' },
                            { name: 'Raycaster Verge', desc: 'DPS · HitChance + Critical dal modulo ufficiale' },
                        ].map((item) => (
                            <div key={item.name} className="p-4 rounded-xl border border-white/10 bg-white/5">
                                <div className="flex items-center justify-between">
                                    <p className="font-display text-xl text-white">{item.name}</p>
                                    <span className="text-xs text-[#c6cbed] tracking-[0.3em]">registry</span>
                                </div>
                                <p className="text-sm text-[#d5d8f1] mt-1">{item.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>
        </div>
    );
};
