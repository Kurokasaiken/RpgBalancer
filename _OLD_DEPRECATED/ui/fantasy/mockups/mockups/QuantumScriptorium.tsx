import React from 'react';
import { FantasyButton } from '../../atoms/FantasyButton';

export const QuantumScriptorium: React.FC = () => (
    <div className="min-h-full rounded-3xl border border-[#d8cfbe] bg-[#faf6ee] text-[#201b16] px-6 py-8 shadow-[0_30px_80px_rgba(68,52,40,0.25)]">
        <header className="grid gap-6 md:grid-cols-2">
            <div className="rounded-2xl border border-[#eadfce] bg-white p-6">
                <p className="text-xs uppercase tracking-[0.65em] text-[#9a7e63]">Quantum Scriptorium</p>
                <h1 className="text-4xl font-display text-[#1c1812] mt-2">Scriptorium Quantico</h1>
                <p className="text-base text-[#4b3b2d] mt-3">
                    Bilanciamento stile manoscritto moderno: carta avorio, inchiostro nerastro e accenti neon smorzati.
                </p>
            </div>
            <div className="rounded-2xl border border-[#e6dbc8] bg-gradient-to-br from-[#fffaf1] to-[#f0e2ce] p-6">
                <h2 className="font-display text-2xl">Azioni</h2>
                <div className="mt-4 flex flex-wrap gap-3">
                    <FantasyButton variant="gold" size="md" rightIcon="✒">
                        Trascrivi Stat
                    </FantasyButton>
                    <FantasyButton variant="secondary" size="md" rightIcon="⚖" className="border-[#7d614c]">
                        Verifica Costi
                    </FantasyButton>
                </div>
            </div>
        </header>

        <section className="mt-8 grid md:grid-cols-3 gap-6">
            {[
                { label: 'Script Budget', value: '57 pt' },
                { label: 'Ink Accuracy', value: '91%' },
                { label: 'Tier', value: 'II Manus' },
            ].map((card, idx) => (
                <div key={card.label} className="rounded-2xl border border-[#e6dccc] bg-white p-5">
                    <p className="text-xs uppercase tracking-[0.45em] text-[#8d755c]">{card.label}</p>
                    <p className="text-3xl font-display mt-3">{card.value}</p>
                    <div className="mt-4 h-[3px] bg-[#f4ebde] rounded-full">
                        <div
                            className="h-full rounded-full bg-gradient-to-r from-[#f0cf95] via-[#b8845d] to-[#42413f]"
                            style={{ width: `${[70, 91, 55][idx]}%` }}
                        />
                    </div>
                    <p className="text-sm text-[#4f4031] mt-3">Valori prelevati dal registry e dai moduli di balancing.</p>
                </div>
            ))}
        </section>

        <section className="mt-8 grid md:grid-cols-2 gap-6">
            <div className="rounded-2xl border border-[#e4d9c9] bg-white p-6">
                <h2 className="font-display text-2xl flex items-center gap-2">
                    <span className="text-[#c39a6e]">✷</span> Tavole Statutarie
                </h2>
                <div className="mt-5 space-y-4">
                    {[
                        { label: 'Scribe Flow', value: 64 },
                        { label: 'Glyph Drift', value: 52 },
                        { label: 'Ink Saturation', value: 45 },
                    ].map((stat) => (
                        <div key={stat.label}>
                            <div className="flex justify-between text-sm text-[#4a3c2f]">
                                <span>{stat.label}</span>
                                <span>{stat.value}%</span>
                            </div>
                            <div className="h-2 mt-1 bg-[#f6eee0] rounded-full">
                                <div
                                    className="h-full rounded-full bg-gradient-to-r from-[#f0d59c] via-[#b8845d] to-[#5c4b3b]"
                                    style={{ width: `${stat.value}%` }}
                                />
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="rounded-2xl border border-[#e4d9c9] bg-white p-6">
                <h2 className="font-display text-2xl">Archetipi Scriptum</h2>
                <p className="text-sm text-[#4f3f2f] mt-2">
                    Archetipi derivati da `ArchetypeBuilder` + `StatBlock`, nessuna logica duplicata.
                </p>
                <div className="mt-5 space-y-4">
                    {[
                        { name: 'Lumina Scribe', desc: 'Support · SustainModule documentato' },
                        { name: 'Inkblade Cipher', desc: 'Assassin · HitChanceModule' },
                    ].map((item) => (
                        <div key={item.name} className="p-4 rounded-xl border border-[#f0e4d1] bg-gradient-to-r from-white to-[#faf3e6]">
                            <div className="flex items-center justify-between">
                                <p className="font-display text-xl">{item.name}</p>
                                <span className="text-xs text-[#a27d5c] tracking-[0.3em]">registry</span>
                            </div>
                            <p className="text-sm text-[#4d3d2f] mt-1">{item.desc}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    </div>
);
