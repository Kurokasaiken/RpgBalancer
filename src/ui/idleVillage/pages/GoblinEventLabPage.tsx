/**
 * GoblinEventLabPage — isolated lab for the goblin-invasion modal.
 *
 * Displays all iterations V1–V6, V7A/B/C, V8, V9, V10, V11, V12, V13 and V14 side by side.
 */

import React from 'react';
import { GoblinEventModalV1 } from '@/ui/idleVillage/trailer/GoblinEventModalV1';
import { GoblinEventModalV2 } from '@/ui/idleVillage/trailer/GoblinEventModalV2';
import { GoblinEventModalV3 } from '@/ui/idleVillage/trailer/GoblinEventModalV3';
import { GoblinEventModalV4 } from '@/ui/idleVillage/trailer/GoblinEventModalV4';
import { GoblinEventModalV5 } from '@/ui/idleVillage/trailer/GoblinEventModalV5';
import { GoblinEventModalV6 } from '@/ui/idleVillage/trailer/GoblinEventModalV6';
import {
  GoblinEventModalV7A,
  GoblinEventModalV7B,
  GoblinEventModalV7C,
} from '@/ui/idleVillage/trailer/GoblinEventModalV7';
import { GoblinEventModalV8 } from '@/ui/idleVillage/trailer/GoblinEventModalV8';
import { GoblinEventModalV9 } from '@/ui/idleVillage/trailer/GoblinEventModalV9';
import { GoblinEventModalV10 } from '@/ui/idleVillage/trailer/GoblinEventModalV10';
import { GoblinEventModalV11 } from '@/ui/idleVillage/trailer/GoblinEventModalV11';
import { GoblinEventModalV12 } from '@/ui/idleVillage/trailer/GoblinEventModalV12';
import { GoblinEventModalV13 } from '@/ui/idleVillage/trailer/GoblinEventModalV13';
import { GoblinEventModalV14 } from '@/ui/idleVillage/trailer/GoblinEventModalV14';
import { GoblinEventModalV15 } from '@/ui/idleVillage/trailer/GoblinEventModalV15';
import { GoblinEventModalV16 } from '@/ui/idleVillage/trailer/GoblinEventModalV16';
import { GoblinEventModalV17 } from '@/ui/idleVillage/trailer/GoblinEventModalV17';

const DAY = 2;

export const GoblinEventLabPage: React.FC = () => (
  <div className="min-h-screen bg-slate-950 p-6 text-amber-100 md:p-10">
    <h1 className="mb-8 text-2xl font-bold text-amber-200">
      Goblin Event Modal — V14 + history
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

      <div>
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-amber-300">
          V15 — AI Totem Texture Pilot
        </h2>
        <div
          className="relative flex h-[520px] w-full items-center justify-center overflow-hidden rounded-xl border border-slate-700/30 p-4"
          style={{
            backgroundImage: "url('/assets/trailer/muro-di-nuvole-naruto.png')",
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >
          <GoblinEventModalV15 daysLeft={DAY} isOpen />
        </div>
      </div>

      <div>
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-amber-300">
          V16 — IP-Adapter Panel
        </h2>
        <div className="relative flex h-[520px] w-full items-center justify-center overflow-hidden rounded-xl border border-slate-700/30 p-4">
          <GoblinEventModalV16 daysLeft={DAY} isOpen />
        </div>
      </div>

      <div>
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-amber-300">
          V14 — Tactile Map + Folio
        </h2>
        <div
          className="relative flex h-[420px] w-full items-center justify-center overflow-hidden rounded-xl border border-slate-700/30 p-4 md:col-span-2 xl:col-span-2"
          style={{
            backgroundImage: "url('/assets/trailer/muro-di-nuvole-naruto.png')",
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >
          <GoblinEventModalV14 daysLeft={DAY} isOpen />
        </div>
      </div>

      <div>
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-amber-300">
          V13 — Tactical Map + Folio
        </h2>
        <div
          className="relative flex h-[420px] w-full items-center justify-center overflow-hidden rounded-xl border border-slate-700/30 p-4 md:col-span-2 xl:col-span-2"
          style={{
            backgroundImage: "url('/assets/trailer/muro-di-nuvole-naruto.png')",
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >
          <GoblinEventModalV13 daysLeft={DAY} isOpen />
        </div>
      </div>

      <div>
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-amber-300">
          V12 — Parchment War Table Modal
        </h2>
        <div
          className="relative flex h-[600px] w-full items-center justify-center overflow-hidden rounded-xl border border-slate-700/30 p-4"
          style={{
            backgroundImage: "url('/assets/trailer/muro-di-nuvole-naruto.png')",
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >
          <GoblinEventModalV12 daysLeft={DAY} isOpen />
        </div>
      </div>

      <div>
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-amber-300">
          V11 — Dark Fantasy War Table
        </h2>
        <div className="flex h-[600px] w-full items-center justify-center rounded-xl border border-slate-700/30 p-4">
          <GoblinEventModalV11 daysLeft={DAY} />
        </div>
      </div>

      <div>
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-amber-300">
          V10 — Goblin Spilling / Cloud Floor
        </h2>
        <div className="flex h-[600px] w-full items-center justify-center rounded-xl border border-slate-700/30 p-4">
          <GoblinEventModalV10 daysLeft={DAY} />
        </div>
      </div>

      <div>
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-amber-300">
          V9 — Wanderlust Surface / Silver-Red
        </h2>
        <div className="flex h-[600px] w-full items-center justify-center rounded-xl border border-slate-700/30 p-4">
          <GoblinEventModalV9 daysLeft={DAY} />
        </div>
      </div>

      <div>
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-amber-300">
          V8 — Engraved Heraldry / Countdown Plaque
        </h2>
        <div className="flex h-[600px] w-full items-center justify-center rounded-xl border border-slate-700/30 p-4">
          <GoblinEventModalV8 daysLeft={DAY} />
        </div>
      </div>

      <div>
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-amber-300">
          V1 — Gold Baroque Baseline
        </h2>
        <div className="flex h-[520px] w-full items-center justify-center rounded-xl border border-slate-700/30 p-4">
          <GoblinEventModalV1 daysLeft={DAY} />
        </div>
      </div>

      <div>
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-amber-300">
          V2 — Centered Seal / Crimson CTA
        </h2>
        <div className="flex h-[520px] w-full items-center justify-center rounded-xl border border-slate-700/30 p-4">
          <GoblinEventModalV2 daysLeft={DAY} />
        </div>
      </div>

      <div>
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-amber-300">
          V3 — Dread / Cold Steel
        </h2>
        <div className="flex h-[520px] w-full items-center justify-center rounded-xl border border-slate-700/30 p-4">
          <GoblinEventModalV3 daysLeft={DAY} />
        </div>
      </div>

      <div>
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-amber-300">
          V4 — Dark Iron / Skull SVG
        </h2>
        <div className="flex h-[520px] w-full items-center justify-center rounded-xl border border-slate-700/30 p-4">
          <GoblinEventModalV4 daysLeft={DAY} />
        </div>
      </div>

      <div>
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-amber-300">
          V5 — Bronze / Goblin Medallion
        </h2>
        <div className="flex h-[520px] w-full items-center justify-center rounded-xl border border-slate-700/30 p-4">
          <GoblinEventModalV5 daysLeft={DAY} />
        </div>
      </div>

      <div>
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-amber-300">
          V6 — Iron Frame / Centered Sticker
        </h2>
        <div className="flex h-[520px] w-full items-center justify-center rounded-xl border border-slate-700/30 p-4">
          <GoblinEventModalV6 daysLeft={DAY} />
        </div>
      </div>

      <div>
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-amber-300">
          V7A — Diorama Integration
        </h2>
        <div className="flex h-[520px] w-full items-center justify-center rounded-xl border border-slate-700/30 p-4">
          <GoblinEventModalV7A daysLeft={DAY} />
        </div>
      </div>

      <div>
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-amber-300">
          V7B — Heraldry Shield
        </h2>
        <div className="flex h-[520px] w-full items-center justify-center rounded-xl border border-slate-700/30 p-4">
          <GoblinEventModalV7B daysLeft={DAY} />
        </div>
      </div>

      <div>
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-amber-300">
          V7C — Collectible Card
        </h2>
        <div className="flex h-[520px] w-full items-center justify-center rounded-xl border border-slate-700/30 p-4">
          <GoblinEventModalV7C daysLeft={DAY} />
        </div>
      </div>
    </div>
  </div>
);

export default GoblinEventLabPage;
