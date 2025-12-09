import React from 'react';

export const BalancerNewTest: React.FC = () => {
  return (
    <div className="observatory-page">
      <div className="observatory-bg-orbits">
        <div className="observatory-bg-orbit-left" />
        <div className="observatory-bg-orbit-right" />
      </div>

      <div className="observatory-shell space-y-3">
        <header className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex flex-col">
            <h1 className="flex items-center gap-2 text-2xl md:text-3xl font-semibold tracking-[0.22em] md:tracking-[0.3em] uppercase text-indigo-200 drop-shadow-[0_0_14px_rgba(129,140,248,0.9)]">
              <span>Gilded Observatory</span>
            </h1>
            <p className="mt-0.5 md:mt-1 text-[9px] md:text-[10px] text-slate-400 uppercase tracking-[0.2em] md:tracking-[0.26em]">
              Default tool layout
            </p>
          </div>
        </header>

        <div className="observatory-panel observatory-panel-ambient">
          <div className="mb-2 text-[10px] md:text-xs text-slate-300">
            Default Balancer-style cards (using the global `default-card` shell). Use this pattern for
            new tools.
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <div className="default-card flex flex-col gap-2">
              <div className="flex items-center justify-between border-b border-slate-700/60 pb-1.5">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-base text-indigo-200 drop-shadow-[0_0_10px_rgba(129,140,248,0.8)]" aria-hidden>
                    ⚙️
                  </span>
                  <p className="text-[11px] font-semibold tracking-[0.18em] uppercase text-slate-100 truncate">
                    Example Card
                  </p>
                </div>
              </div>
              <div className="space-y-1 text-[10px] text-slate-300">
                <p className="flex items-center justify-between">
                  <span className="uppercase tracking-[0.16em] text-slate-400">Label A</span>
                  <span className="font-mono text-cyan-300">42</span>
                </p>
                <p className="flex items-center justify-between">
                  <span className="uppercase tracking-[0.16em] text-slate-400">Label B</span>
                  <span className="font-mono text-emerald-300">+7%</span>
                </p>
              </div>
            </div>

            <div className="default-card flex flex-col gap-2">
              <div className="flex items-center justify-between border-b border-slate-700/60 pb-1.5">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-base text-indigo-200 drop-shadow-[0_0_10px_rgba(129,140,248,0.8)]" aria-hidden>
                    📊
                  </span>
                  <p className="text-[11px] font-semibold tracking-[0.18em] uppercase text-slate-100 truncate">
                    Metrics
                  </p>
                </div>
              </div>
              <div className="space-y-1 text-[10px] text-slate-300">
                <p className="flex items-center justify-between">
                  <span className="uppercase tracking-[0.16em] text-slate-400">Winrate</span>
                  <span className="font-mono text-emerald-300">51.3%</span>
                </p>
                <p className="flex items-center justify-between">
                  <span className="uppercase tracking-[0.16em] text-slate-400">Score</span>
                  <span className="font-mono text-amber-300">0.87</span>
                </p>
              </div>
            </div>

            <div className="default-card flex flex-col gap-2">
              <div className="flex items-center justify-between border-b border-slate-700/60 pb-1.5">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-base text-indigo-200 drop-shadow-[0_0_10px_rgba(129,140,248,0.8)]" aria-hidden>
                    🧪
                  </span>
                  <p className="text-[11px] font-semibold tracking-[0.18em] uppercase text-slate-100 truncate">
                    Prototype
                  </p>
                </div>
              </div>
              <div className="space-y-1 text-[10px] text-slate-300">
                <p className="text-slate-400">
                  Use `default-card` for any new analytic widget or tool card to match BalancerNew.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
