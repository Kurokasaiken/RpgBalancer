/**
 * MockupToComponentPage — visual comparison lab for mockup → component iterations.
 *
 * Displays the original mockup side by side with the derived React component.
 * The user can cycle through iterations (V17.1, V17.2, ...) using prev/next controls.
 * Defaults to the latest iteration.
 */

import React, { useState, useMemo } from 'react';
import { GoblinEventModalV17 } from '@/ui/idleVillage/trailer/GoblinEventModalV17';

const REFERENCE = '/mockups/external/goblin-event-lab/goblin-invasion-mockup.png';

const ITERATIONS = [
  { id: 'goblin-event-modal-v17-001', version: 1, label: 'V17.1 — skeleton + overlay' },
  { id: 'goblin-event-modal-v17-002', version: 2, label: 'V17.2 — refined frame + tokens' },
  { id: 'goblin-event-modal-v17-003', version: 3, label: 'V17.3 — 10-layer CSS/SVG' },
  { id: 'goblin-event-modal-v17-004', version: 4, label: 'V17.4 — paintover base + i18n overlay' },
  { id: 'goblin-event-modal-v17-005', version: 5, label: 'V17.5 — split assets' },
  { id: 'goblin-event-modal-v17-006', version: 6, label: 'V17.6 — split assets + real buttons' },
  { id: 'goblin-event-modal-v17-007', version: 7, label: 'V17.7 — cleaned panel/banner/buttons' },
];

export const MockupToComponentPage: React.FC = () => {
  const [index, setIndex] = useState(ITERATIONS.length - 1);
  const iteration = ITERATIONS[index];

  const { width, height } = useMemo(() => ({ width: 1086, height: 1448 }), []);

  const prev = () => setIndex((i) => Math.max(0, i - 1));
  const next = () => setIndex((i) => Math.min(ITERATIONS.length - 1, i + 1));

  return (
    <div className="min-h-screen bg-slate-950 p-6 text-amber-100 md:p-10">
      <header className="mb-6 flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-2xl font-bold text-amber-200">Mockup → Component</h1>
          <p className="text-sm text-slate-400">
            Original reference on the left, derived component on the right.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={prev}
            disabled={index === 0}
            className="rounded-md border border-white/10 bg-white/5 px-3 py-1 text-sm text-slate-300 transition hover:border-amber-500/50 hover:text-amber-200 disabled:opacity-30"
          >
            ← Prev
          </button>
          <span className="min-w-[220px] rounded-md border border-white/10 bg-white/5 px-3 py-1 text-center text-sm text-amber-100">
            {iteration.label}
          </span>
          <button
            type="button"
            onClick={next}
            disabled={index === ITERATIONS.length - 1}
            className="rounded-md border border-white/10 bg-white/5 px-3 py-1 text-sm text-slate-300 transition hover:border-amber-500/50 hover:text-amber-200 disabled:opacity-30"
          >
            Next →
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Original mockup */}
        <div className="rounded-xl border border-slate-700/30 bg-black/20 p-4">
          <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
            Original mockup
          </h2>
          <div
            className="mx-auto overflow-hidden rounded-sm border border-slate-700/30"
            style={{
              width: 'min(100%, 420px)',
              aspectRatio: `${width} / ${height}`,
            }}
          >
            <img
              src={REFERENCE}
              alt="Goblin Invasion mockup reference"
              className="h-full w-full object-cover"
            />
          </div>
        </div>

        {/* Derived component */}
        <div className="rounded-xl border border-slate-700/30 bg-black/20 p-4">
          <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
            Derived component — {iteration.label}
          </h2>
          <div
            className="mx-auto overflow-hidden rounded-sm border border-slate-700/30"
            style={{
              width: 'min(100%, 420px)',
              aspectRatio: `${width} / ${height}`,
            }}
          >
            <GoblinEventModalV17
              daysLeft={2}
              isOpen
              version={iteration.version}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default MockupToComponentPage;
