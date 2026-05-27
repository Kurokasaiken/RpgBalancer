/**
 * SlotBehaviorPage
 * Debug / visual lab for SlottedMedal + SlotV12Renderer behavior states.
 *
 * Sections
 *   1. Slot State Showcase  — 5 state cards in a grid (auto-animated)
 *      Empty · Filled · Dragover · Rejected · Locked
 *   2. Interactive Lab       — resident dropdown, skin preset, live state badge,
 *      main trigger buttons (Drop/Reject/Lock/Reset) + extended triggers
 *
 * Import:  import { SlotBehaviorPage } from '@/ui/idleVillage/pages/debug'
 * Route:   register in App.tsx as needed, e.g.  /debug/slot-behavior
 *
 * Architecture notes
 * ──────────────────
 * • Showcase cells use <SlottedMedal ref={…}> so animation methods are driven
 *   by useEffect loops via the imperative ref handle.
 * • Interactive Lab uses useSlottedMedalBehavior() directly in the parent so
 *   `behavior.state` is reactive and the badge re-renders on every transition.
 *   Medal layers (Skin / HaloCanvas / ResistRing) are composed manually — this
 *   avoids the useDraggable hook that lives inside <SlottedMedal>.
 * • A single DndContext wraps the whole page (required by useDraggable inside
 *   the showcase <SlottedMedal> instances).
 */
import type { JSX } from 'react';
import React, { useState, useRef, useEffect, memo } from 'react';
import {
  DndContext,
  pointerWithin,
  useSensor,
  useSensors,
  PointerSensor,
} from '@dnd-kit/core';
import { motion } from 'framer-motion';
import SlottedMedal from '@/ui/idleVillage/components/SlottedMedal';
import { SlotV12Renderer } from '@/ui/idleVillage/components/SlotV12Renderer';
import SlottedMedalSkin from '@/ui/idleVillage/components/SlottedMedalSkin';
import SlottedMedalHaloCanvas from '@/ui/idleVillage/components/SlottedMedalHaloCanvas';
import SlottedMedalResistRing from '@/ui/idleVillage/components/SlottedMedalResistRing';
import { useSlottedMedalBehavior } from '@/ui/idleVillage/hooks/useSlottedMedalBehavior';
import type { MedalBehaviorControls, MedalState } from '@/ui/idleVillage/hooks/useSlottedMedalBehavior';
import { useVillageResidents } from '@/ui/idleVillage/hooks/useVillageResidents';

// ─── Types & constants ────────────────────────────────────────────────────────

const MEDAL_TYPES = ['bronze', 'silver', 'gold', 'platinum'] as const;
type MedalType = typeof MEDAL_TYPES[number];

const SKIN_PRESETS = ['minimal', 'enhanced', 'ceremonial'] as const;
type SkinPreset = typeof SKIN_PRESETS[number];

/** Tailwind class pairs per MedalState — used in the reactive state badge. */
const STATE_BADGE_CLS: Record<MedalState, string> = {
  empty:     'bg-slate-700 text-slate-300',
  landing:   'bg-blue-700  text-blue-100',
  idle:      'bg-slate-600 text-slate-200',
  active:    'bg-emerald-700 text-emerald-100',
  locked:    'bg-amber-600   text-amber-100',
  unlocking: 'bg-violet-700  text-violet-100',
  failed:    'bg-red-700     text-red-100',
};

/**
 * Fallback roster shown when the VillageResidentStore is empty.
 * Each entry maps to the same shape produced by the residents.map() branch.
 */
const MOCK_RESIDENTS = [
  { id: 'dbg-1', label: 'Elara Scout',      medalType: 'bronze'   as MedalType },
  { id: 'dbg-2', label: 'Ragnar Strongarm', medalType: 'silver'   as MedalType },
  { id: 'dbg-3', label: 'Lyra the Sage',    medalType: 'gold'     as MedalType },
  { id: 'dbg-4', label: 'Theron Merchant',  medalType: 'platinum' as MedalType },
];

const pause = (ms: number) => new Promise<void>(r => setTimeout(r, ms));

// ─── Showcase: shared card shell ─────────────────────────────────────────────

interface ShowcaseCardProps {
  title: string;
  note: string;
  borderCls: string;
  titleCls: string;
  children: React.ReactNode;
}

const ShowcaseCard = memo(({ title, note, borderCls, titleCls, children }: ShowcaseCardProps) => (
  <div className={`border-2 ${borderCls} rounded-lg p-5 bg-slate-900 flex flex-col`}>
    <h3 className={`text-sm font-bold mb-1 ${titleCls}`}>{title}</h3>
    <p className="text-[9px] text-slate-600 mb-5">{note}</p>
    <div className="flex items-center justify-center flex-1 min-h-[192px]">
      {children}
    </div>
  </div>
));
ShowcaseCard.displayName = 'ShowcaseCard';

// ─── Showcase: 1 · Empty ─────────────────────────────────────────────────────

const DemoEmpty = memo(() => (
  <ShowcaseCard
    title="Empty"
    note="Slot idle, waiting for drop"
    borderCls="border-slate-700"
    titleCls="text-slate-300"
  >
    <div style={{ filter: 'drop-shadow(0 0 8px rgba(148,163,184,0.3))' }}>
      <SlotV12Renderer state="empty" letter="?" />
    </div>
  </ShowcaseCard>
));
DemoEmpty.displayName = 'DemoEmpty';

// ─── Showcase: 2 · Filled ────────────────────────────────────────────────────

const DemoFilled = memo(() => {
  const ref = useRef<MedalBehaviorControls | null>(null);

  useEffect(() => {
    const t = setTimeout(() => ref.current?.handleDrop('demo-filled'), 500);
    return () => clearTimeout(t);
  }, []);

  return (
    <ShowcaseCard
      title="Filled"
      note="Resident assigned · medal active"
      borderCls="border-amber-600"
      titleCls="text-amber-400"
    >
      <div className="relative">
        <SlotV12Renderer state="occupied" letter="A" />
        <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
          <SlottedMedal
            ref={ref}
            id="demo-filled"
            type="gold"
            residentId="demo-filled"
            isActive
          />
        </div>
      </div>
    </ShowcaseCard>
  );
});
DemoFilled.displayName = 'DemoFilled';

// ─── Showcase: 3 · Dragover ──────────────────────────────────────────────────
// No real drag — green glow simulated via CSS.

const DemoDragover = memo(() => (
  <ShowcaseCard
    title="Dragover"
    note="Drop target active · CSS glow"
    borderCls="border-green-500"
    titleCls="text-green-400"
  >
    <div
      className="rounded-full"
      style={{
        filter:        'drop-shadow(0 0 20px rgba(58,215,128,0.9))',
        outline:       '2px dashed rgba(58,215,128,0.85)',
        outlineOffset: 6,
      }}
    >
      <SlotV12Renderer state="empty" letter="+" />
    </div>
  </ShowcaseCard>
));
DemoDragover.displayName = 'DemoDragover';

// ─── Showcase: 4 · Rejected ──────────────────────────────────────────────────
// Loops: reset → drop → handleReject (shake) → pause → repeat.

const DemoRejected = memo(() => {
  const ref  = useRef<MedalBehaviorControls | null>(null);
  const live = useRef(true);

  useEffect(() => {
    live.current = true;
    const loop = async () => {
      if (!live.current) return;
      ref.current?.reset();
      await pause(300);
      if (!live.current) return;
      ref.current?.handleDrop('demo-rej');
      await pause(700);
      if (!live.current) return;
      ref.current?.handleReject();
      await pause(2400);
      if (live.current) loop();
    };
    const t = setTimeout(loop, 600);
    return () => { live.current = false; clearTimeout(t); };
  }, []);

  return (
    <ShowcaseCard
      title="Rejected"
      note="Invalid drop · shake animation"
      borderCls="border-red-600"
      titleCls="text-red-400"
    >
      <div className="relative">
        <SlotV12Renderer state="occupied" letter="✗" />
        <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
          <SlottedMedal
            ref={ref}
            id="demo-rejected"
            type="silver"
            residentId="demo-rej"
            isActive={false}
          />
        </div>
      </div>
    </ShowcaseCard>
  );
});
DemoRejected.displayName = 'DemoRejected';

// ─── Showcase: 5 · Locked ────────────────────────────────────────────────────
// Loops: reset → drop → resistStart (ring) → pause → repeat.

const DemoLocked = memo(() => {
  const ref  = useRef<MedalBehaviorControls | null>(null);
  const live = useRef(true);

  useEffect(() => {
    live.current = true;
    const loop = async () => {
      if (!live.current) return;
      ref.current?.reset();
      await pause(300);
      if (!live.current) return;
      ref.current?.handleDrop('demo-lock');
      await pause(900);
      if (!live.current) return;
      ref.current?.resistStart();
      await pause(2800);
      if (live.current) loop();
    };
    const t = setTimeout(loop, 600);
    return () => { live.current = false; clearTimeout(t); };
  }, []);

  return (
    <ShowcaseCard
      title="Locked"
      note="Resist ring · magnetic hold"
      borderCls="border-purple-600"
      titleCls="text-purple-400"
    >
      <div className="relative">
        <SlotV12Renderer state="occupied" letter="⊗" />
        <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
          <SlottedMedal
            ref={ref}
            id="demo-locked"
            type="platinum"
            residentId="demo-lock"
            isActive
            behaviorConfig={{ resistDurationMs: 1400 }}
          />
        </div>
      </div>
    </ShowcaseCard>
  );
});
DemoLocked.displayName = 'DemoLocked';

// ─── Interactive Lab ─────────────────────────────────────────────────────────

const InteractiveLab = () => {
  const { residents } = useVillageResidents();

  // Prefer real residents; fall back to mock when store is empty.
  const roster = residents.length > 0
    ? residents.map((r, i) => ({
        id:        r.id,
        label:     r.displayName ?? r.name ?? r.id,
        medalType: MEDAL_TYPES[i % 4] as MedalType,
      }))
    : MOCK_RESIDENTS;

  const [selectedIdx, setSelectedIdx] = useState(0);
  const [skinPreset,  setSkinPreset]  = useState<SkinPreset>('minimal');

  const selected   = roster[selectedIdx] ?? roster[0]!;
  const medalType  = selected?.medalType ?? 'bronze';
  const residentId = selected?.id        ?? 'lab-res';

  // Behavior hook — state is reactive, badge re-renders on every transition.
  const b = useSlottedMedalBehavior({ resistDurationMs: 800 });

  // ── Main triggers ─────────────────────────────────────────────────────────

  const handleDrop = () => b.handleDrop(residentId);

  const handleReject = () => b.handleReject();

  const handleLock = () => {
    // resistStart() only works from 'active'. Auto-drop first if needed.
    if (b.state !== 'active') {
      b.handleDrop(residentId);
      setTimeout(() => b.resistStart(), 650);
    } else {
      b.resistStart();
    }
  };

  const handleReset = () => b.reset();

  // ── Extended triggers ─────────────────────────────────────────────────────

  type TriggerDef = { label: string; action: () => void; cls: string };
  const EXTENDED: TriggerDef[] = [
    { label: 'Detach',   action: () => b.triggerDetach(),                cls: 'bg-violet-800 hover:bg-violet-700' },
    { label: 'Complete', action: () => b.handleComplete(),               cls: 'bg-teal-800   hover:bg-teal-700'   },
    { label: 'Fail',     action: () => b.handleFailed('mission_failure'),cls: 'bg-red-900    hover:bg-red-800'    },
    { label: 'Clank',    action: () => b.triggerClank(),                 cls: 'bg-slate-600  hover:bg-slate-500'  },
    { label: 'Shake ✓',  action: () => b.triggerShake('assign'),         cls: 'bg-blue-800   hover:bg-blue-700'   },
    { label: 'Shake ✗',  action: () => b.triggerShake('reject'),         cls: 'bg-orange-800 hover:bg-orange-700' },
    { label: 'Spring',   action: () => b.springToCenter(),               cls: 'bg-cyan-800   hover:bg-cyan-700'   },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

      {/* ── Left: Controls panel ──────────────────────────────────────── */}
      <div className="bg-slate-900 border border-slate-700 rounded-lg p-6 space-y-6">
        <h3 className="text-lg font-bold text-amber-400">Controls</h3>

        {/* Resident dropdown */}
        <div>
          <label className="block text-sm font-bold mb-2 text-slate-300">Resident</label>
          <select
            value={selectedIdx}
            onChange={e => { setSelectedIdx(Number(e.target.value)); b.reset(); }}
            className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded text-slate-200 text-sm focus:outline-none focus:border-slate-400"
          >
            {roster.map((r, i) => (
              <option key={r.id} value={i}>{r.label}</option>
            ))}
          </select>
        </div>

        {/* Skin preset */}
        <div>
          <label className="block text-sm font-bold mb-2 text-slate-300">Skin Preset</label>
          <select
            value={skinPreset}
            onChange={e => setSkinPreset(e.target.value as SkinPreset)}
            className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded text-slate-200 text-sm focus:outline-none focus:border-slate-400"
          >
            {SKIN_PRESETS.map(p => (
              <option key={p} value={p}>
                {p.charAt(0).toUpperCase() + p.slice(1)}
              </option>
            ))}
          </select>
        </div>

        {/* Live state badge */}
        <div>
          <label className="block text-sm font-bold mb-2 text-slate-300">Current State</label>
          <div className={`inline-block rounded-full px-4 py-1.5 text-sm font-bold uppercase tracking-wider font-mono transition-colors duration-200 ${STATE_BADGE_CLS[b.state]}`}>
            {b.state}
          </div>
        </div>

        {/* Main trigger buttons */}
        <div className="space-y-3">
          <button
            type="button"
            onClick={handleDrop}
            className="w-full px-4 py-2.5 bg-emerald-700 hover:bg-emerald-600 rounded font-bold text-white transition-colors"
          >
            ▼ Drop
          </button>
          <button
            type="button"
            onClick={handleReject}
            className="w-full px-4 py-2.5 bg-red-700 hover:bg-red-600 rounded font-bold text-white transition-colors"
          >
            ✗ Reject
          </button>
          <button
            type="button"
            onClick={handleLock}
            className="w-full px-4 py-2.5 bg-purple-700 hover:bg-purple-600 rounded font-bold text-white transition-colors"
          >
            🔒 Lock
          </button>
          <button
            type="button"
            onClick={handleReset}
            className="w-full px-4 py-2.5 bg-slate-700 hover:bg-slate-600 rounded font-bold text-white transition-colors"
          >
            🔄 Reset
          </button>
        </div>

        {/* Extended triggers */}
        <div>
          <p className="text-[10px] text-slate-600 uppercase tracking-widest mb-2">Extended</p>
          <div className="grid grid-cols-2 gap-1.5">
            {EXTENDED.map(({ label, action, cls }) => (
              <button
                key={label}
                type="button"
                onClick={action}
                className={`rounded py-1.5 px-2 text-[10px] font-bold uppercase tracking-wider text-white transition-colors ${cls}`}
              >
                {label}
              </button>
            ))}
          </div>
          <p className="text-[9px] text-slate-700 mt-2">
            Lock auto-drops first if state ≠ active.
          </p>
        </div>
      </div>

      {/* ── Right: Live preview ──────────────────────────────────────────── */}
      <div className="bg-slate-900 border border-slate-700 rounded-lg p-6 flex flex-col">
        <h3 className="text-lg font-bold text-amber-400 mb-6">Live Preview</h3>

        {/* Preview area */}
        <div className="flex items-center justify-center flex-1 bg-slate-800 rounded-lg border border-slate-700 min-h-[256px]">
          <div className="relative">
            <SlotV12Renderer
              state={b.state === 'empty' ? 'empty' : 'occupied'}
              letter={medalType[0].toUpperCase()}
            />
            <div className="absolute inset-0 flex items-center justify-center z-10">
              {/* Render skin layers directly so behavior state stays reactive */}
              <motion.div
                animate={b.animationControls}
                initial={{ scale: 1, opacity: 1 }}
                className="relative"
              >
                <SlottedMedalSkin
                  id="lab-medal"
                  type={medalType}
                  isActive={b.state === 'active'}
                  skinPreset={skinPreset}
                />
                <SlottedMedalHaloCanvas
                  state={b.state}
                  medalType={medalType}
                  medalId="lab-medal"
                  sizePreset="medium"
                />
                <SlottedMedalResistRing
                  isResisting={b.state === 'locked'}
                  medalType={medalType}
                  resistanceProgress={b.state === 'locked' ? 0.7 : 0}
                  medalState={b.state}
                />
              </motion.div>
            </div>
          </div>
        </div>

        <p className="text-xs text-slate-500 mt-4 leading-relaxed">
          Resident: <span className="text-slate-300">{selected?.label ?? '—'}</span>
          {' · '}
          Medal: <span className="text-slate-300">{medalType}</span>
          {' · '}
          Skin: <span className="text-slate-300">{skinPreset}</span>
        </p>
      </div>

    </div>
  );
};

// ─── Page export ──────────────────────────────────────────────────────────────

/**
 * SlotBehaviorPage — standalone debug visual lab.
 *
 * Provides its own {@link DndContext} (with PointerSensor, distance 8px) so
 * it renders correctly without an outer drag provider.
 *
 * @example
 * // App.tsx lazy route
 * const SlotBehaviorPage = lazy(() =>
 *   import('@/ui/idleVillage/pages/debug').then(m => ({ default: m.SlotBehaviorPage }))
 * );
 */
export function SlotBehaviorPage(): JSX.Element {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  );

  return (
    <DndContext sensors={sensors} collisionDetection={pointerWithin}>
      <div className="min-h-screen bg-slate-950 text-white p-8 space-y-12">

        {/* ── Header ────────────────────────────────────────────────────────── */}
        <div className="border-b border-slate-800 pb-6">
          <h1 className="text-4xl font-bold text-amber-400 mb-2">
            Slot Behavior Showcase
          </h1>
          <p className="text-slate-400 text-sm">
            Debug page · SlottedMedal + SlotV12Renderer · all behavior states
          </p>
        </div>

        {/* ── Section 1: State showcase ──────────────────────────────────────── */}
        <section>
          <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-6">
            Section 1 — Slot State Showcase
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 xl:grid-cols-5 gap-4">
            <DemoEmpty    />
            <DemoFilled   />
            <DemoDragover />
            <DemoRejected />
            <DemoLocked   />
          </div>
        </section>

        {/* ── Section 2: Interactive lab ─────────────────────────────────────── */}
        <section>
          <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-6">
            Section 2 — Interactive Lab
          </h2>
          <InteractiveLab />
        </section>

      </div>
    </DndContext>
  );
}
