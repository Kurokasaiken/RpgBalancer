/**
 * GoblinEventLabPage — isolated lab for the goblin-invasion modal.
 *
 * Displays the tracked iteration (V17). Older V1–V16 mockup iterations are
 * intentionally gitignored and not part of the repo.
 */

import React from 'react';
import { GoblinEventModalV17 } from '@/ui/idleVillage/trailer/GoblinEventModalV17';

const DAY = 2;

export const GoblinEventLabPage: React.FC = () => (
  <div className="min-h-screen bg-slate-950 p-6 text-amber-100 md:p-10">
    <h1 className="mb-8 text-2xl font-bold text-amber-200">
      Goblin Event Modal — V17
    </h1>

    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
      <div>
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-amber-300">
          V17 — Decomposed CSS/React + Hero Asset
        </h2>
        <div className="relative flex h-[520px] w-full items-center justify-center overflow-hidden rounded-xl border border-slate-700/30 p-4">
          <GoblinEventModalV17 daysLeft={DAY} isOpen />
        </div>
      </div>
    </div>
  </div>
);

export default GoblinEventLabPage;
