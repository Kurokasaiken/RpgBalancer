import React from 'react';

// Static mockup for the new config-driven Spell Creator
// Uses the Arcane Tech Glass visual language (glass cards, neon glows, tech grid)
export const SpellCreatorNewMockup: React.FC = () => {
  return (
    <div className="min-h-full px-6 py-4 bg-[radial-gradient(circle_at_top,_#1f2937_0,_#020617_55%,_#000000_100%)] text-slate-100">
      <div className="max-w-6xl mx-auto space-y-4">
        {/* Header */}
        <header className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-3xl font-semibold tracking-[0.25em] uppercase text-indigo-200 drop-shadow-[0_0_12px_rgba(129,140,248,0.8)]">
              Spell Creator
            </h1>
            <p className="mt-1 text-xs text-slate-400 uppercase tracking-[0.25em]">
              Arcane Tech Glass · Config-Driven
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <button
              type="button"
              className="px-3 py-1.5 rounded-full border border-indigo-400/60 bg-indigo-500/10 text-indigo-200 hover:bg-indigo-500/20 hover:shadow-[0_0_15px_rgba(129,140,248,0.45)] transition-all tracking-[0.25em] uppercase"
            >
              ＋ New Spell
            </button>
            <button
              type="button"
              className="px-3 py-1.5 rounded-full border border-cyan-400/60 bg-cyan-500/5 text-cyan-200 hover:bg-cyan-500/15 hover:shadow-[0_0_12px_rgba(34,211,238,0.45)] transition-all tracking-[0.25em] uppercase"
            >
              Import
            </button>
            <button
              type="button"
              className="px-3 py-1.5 rounded-full border border-emerald-400/60 bg-emerald-500/5 text-emerald-200 hover:bg-emerald-500/15 hover:shadow-[0_0_12px_rgba(16,185,129,0.45)] transition-all tracking-[0.25em] uppercase"
            >
              Export
            </button>
          </div>
        </header>

        {/* Tech grid background for content */}
        <div className="relative rounded-3xl border border-indigo-500/30 bg-slate-900/40 shadow-[0_0_40px_rgba(15,23,42,0.8)] overflow-hidden">
          <div className="absolute inset-0 bg-[linear-gradient(rgba(148,163,184,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.05)_1px,transparent_1px)] bg-[size:22px_22px] opacity-60 pointer-events-none" />

          <div className="relative p-4 md:p-6 grid gap-4 md:grid-cols-[2fr,3fr]">
            {/* Left: spell list */}
            <section className="space-y-3">
              <h2 className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-300 flex items-center gap-2">
                <span className="h-px flex-1 bg-gradient-to-r from-indigo-400/60 to-transparent" />
                Spells
              </h2>

              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {["Fireball", "Magic Missile", "Shield", "Cure Wounds"].map((name, idx) => (
                  <button
                    key={name}
                    type="button"
                    className={`w-full text-left px-3 py-2 rounded-2xl border text-xs flex items-center justify-between gap-2 transition-all bg-slate-900/60 hover:bg-slate-900/90 ${
                      idx === 0
                        ? 'border-indigo-400/70 shadow-[0_0_20px_rgba(129,140,248,0.45)]'
                        : 'border-slate-700/70 hover:border-indigo-400/60'
                    }`}
                  >
                    <span className="flex items-center gap-2 min-w-0">
                      <span className="text-sm" aria-hidden>
                        {idx === 0 ? '🔥' : idx === 1 ? '✨' : idx === 2 ? '🛡️' : '💊'}
                      </span>
                      <span className="truncate text-slate-100 text-[11px] tracking-[0.12em] uppercase">
                        {name}
                      </span>
                    </span>
                    <span className="text-[10px] text-indigo-300/80">
                      Lv.{idx === 0 ? 3 : 1}
                    </span>
                  </button>
                ))}
              </div>
            </section>

            {/* Right: selected spell preview */}
            <section className="space-y-3">
              <h2 className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-300 flex items-center gap-2">
                Fireball · Preview
                <span className="ml-auto px-2 py-0.5 rounded-full bg-indigo-500/20 text-[10px] text-indigo-200 border border-indigo-400/60">
                  Evocation · Lv.3
                </span>
              </h2>

              <div className="grid gap-3 md:grid-cols-2">
                {/* Glass card: core info */}
                <div className="rounded-2xl border border-indigo-500/40 bg-slate-900/50 backdrop-blur-md p-3 shadow-[0_0_25px_rgba(129,140,248,0.35)]">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-lg" aria-hidden>🔥</span>
                      <span className="truncate text-sm font-semibold text-slate-50 tracking-[0.15em] uppercase">
                        Fireball
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-400">8d6 Fire</span>
                  </div>
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    A bright streak flashes from your pointing finger to a point you choose, then blossoms into a
                    low roar flame, dealing massive fire damage in an area.
                  </p>
                </div>

                {/* Glass card: numeric stats */}
                <div className="rounded-2xl border border-cyan-500/40 bg-slate-900/40 backdrop-blur-md p-3 shadow-[0_0_25px_rgba(34,211,238,0.35)] text-[11px]">
                  <dl className="grid grid-cols-2 gap-2 text-slate-200">
                    <div>
                      <dt className="text-[9px] uppercase tracking-[0.25em] text-slate-400">Base Damage</dt>
                      <dd className="mt-0.5 text-sm text-cyan-200">8d6</dd>
                    </div>
                    <div>
                      <dt className="text-[9px] uppercase tracking-[0.25em] text-slate-400">Scaling</dt>
                      <dd className="mt-0.5 text-sm text-cyan-200">+1d6 / slot</dd>
                    </div>
                    <div>
                      <dt className="text-[9px] uppercase tracking-[0.25em] text-slate-400">Area</dt>
                      <dd className="mt-0.5 text-sm text-cyan-200">20 ft radius</dd>
                    </div>
                    <div>
                      <dt className="text-[9px] uppercase tracking-[0.25em] text-slate-400">Save DC</dt>
                      <dd className="mt-0.5 text-sm text-cyan-200">Dex · 15</dd>
                    </div>
                  </dl>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SpellCreatorNewMockup;
