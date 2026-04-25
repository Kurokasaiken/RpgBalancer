import React from 'react';
import { FantasyButton } from '../../atoms/FantasyButton';

export const ArcaneTechGlass: React.FC = () => {
    return (
        <div
            className="min-h-full bg-[#050816] text-white px-6 py-8 rounded-3xl shadow-[0_25px_80px_rgba(5,8,22,0.9)]"
            style={{ backgroundImage: 'radial-gradient(circle at top, rgba(78,255,247,0.25), transparent 55%)' }}
        >
            <header className="border border-[#39d0ff]/30 rounded-2xl p-6 backdrop-blur-3xl bg-white/5 shadow-[0_25px_80px_rgba(57,208,255,0.18)] flex flex-col md:flex-row gap-6 md:items-center md:justify-between">
                <div>
                    <p className="text-xs uppercase tracking-[0.5em] text-[#7ddcff]">Arcane Tech Glass</p>
                    <h1 className="text-4xl font-display text-white mt-2">Lattice Control Interface</h1>
                    <p className="text-base text-[#cfe9ff] mt-3 max-w-2xl">
                        UI glassmorphism che fonde magia e tecnologia. Card traslucide, glow controllati e tipografia futuristica.
                    </p>
                </div>
                <FantasyButton variant="gold" size="lg" rightIcon="⚡" className="bg-gradient-to-r from-[#39d0ff] to-[#8b5cff] border-transparent">
                    Avvia Matrice Arcana
                </FantasyButton>
            </header>

            <section className="grid md:grid-cols-3 gap-6 mt-8">
                {[63, 78, 42].map((value, index) => (
                    <div
                        key={index}
                        className="backdrop-blur-2xl bg-white/5 border border-white/10 rounded-2xl p-5 shadow-[0_20px_60px_rgba(0,0,0,0.45)]"
                    >
                        <p className="text-sm uppercase tracking-[0.3em] text-[#95eaff]">
                            {['Mana Flow', 'Vector Alignment', 'Chrono Stability'][index]}
                        </p>
                        <p className="text-4xl font-display mt-3 text-[#8fe7ff]">{value}%</p>
                        <div className="h-2 mt-4 bg-white/10 rounded-full overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-[#39d0ff] to-[#8b5cff]" style={{ width: `${value}%` }} />
                        </div>
                    </div>
                ))}
            </section>

            <section className="grid md:grid-cols-2 gap-6 mt-8">
                <div className="bg-white/5 rounded-2xl border border-white/10 p-6 backdrop-blur-2xl">
                    <div className="flex items-center justify-between">
                        <h2 className="text-2xl font-display">Matrix Channels</h2>
                        <span className="text-xs tracking-[0.4em] text-[#7ddcff]">SYNCH</span>
                    </div>
                    <div className="mt-6 space-y-4">
                        {['Aether', 'Pulse', 'Graviton', 'Fate'].map((label, idx) => (
                            <div key={label}>
                                <div className="flex justify-between text-xs text-[#a7c4ff]">
                                    <span>{label} Channel</span>
                                    <span>{[120, 98, 76, 64][idx]} units</span>
                                </div>
                                <div className="h-[3px] mt-2 bg-white/10 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-gradient-to-r from-[#39d0ff] via-[#5b9bff] to-[#a96bff]"
                                        style={{ width: `${[85, 72, 55, 43][idx]}%` }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="bg-white/5 rounded-2xl border border-white/15 p-6 backdrop-blur-3xl">
                    <h2 className="text-2xl font-display">Spectral Archetypes</h2>
                    <p className="text-sm text-[#abc6ff] mt-2">
                        Archetipi generati via `ArchetypeBuilder` in modalità neon. Ogni profilo eredita stat e formule dal balancing engine.
                    </p>
                    <div className="mt-6 space-y-4">
                        {[
                            { name: 'Cyber Seraph', desc: 'Support · Quantum barrier' },
                            { name: 'Void Ronin', desc: 'Assassin · Phase strike' },
                        ].map((item) => (
                            <div key={item.name} className="p-4 rounded-xl border border-white/10 bg-gradient-to-r from-white/5 to-transparent">
                                <div className="flex items-center justify-between">
                                    <p className="font-display text-xl">{item.name}</p>
                                    <span className="text-xs text-[#7ddcff]">registry</span>
                                </div>
                                <p className="text-sm text-[#cbe1ff] mt-1">{item.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>
        </div>
    );
};
