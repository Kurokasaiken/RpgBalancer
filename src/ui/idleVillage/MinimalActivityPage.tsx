/**
 * MinimalActivityPage — Fase 5: ActivityDefinition + Timer
 *
 * Pagina di test per verificare l'intero loop di attività:
 * - Roster con token assegnabili
 * - SlotRack con timer countdown
 * - Token "congelato" durante attività (guard layer attivo)
 * - Transizione a "ready_to_complete" quando timer scade
 * - Outcome modal con ricompense al completamento
 * - Token ritorna al Roster con XP guadagnata
 *
 * Spec da: vertical_slice_implementation_plan.md § Fase 5
 * Doc: minimal_slice/05_activity_timer.md
 * Test: Activity.unit.test.ts (logica timer e outcome)
 */

import React, { useState, useEffect, useCallback } from 'react';

// ─── Tipi locali ──────────────────────────────────────────────────────────────

interface MockResident {
  id: string;
  name: string;
  level: number;
  isBusy: boolean;
  assignedSlot: string | null;
  xp: number;
}

type SlotStatus = 'empty' | 'occupied' | 'ready_to_complete';

interface ActivitySlot {
  id: string;
  label: string;
  activityName: string;
  durationMs: number;
  remainingMs: number;
  status: SlotStatus;
  assignedResidentId: string | null;
  rewards: { gold: number; xp: number };
}

interface OutcomeModal {
  visible: boolean;
  residentName: string;
  goldEarned: number;
  xpEarned: number;
  slotId: string;
}

// ─── Costanti ─────────────────────────────────────────────────────────────────

const ACTIVITY_DURATION_MS = 15_000; // 15 secondi per demo

const TICK_MS = 100;

const INITIAL_RESIDENTS: MockResident[] = [
  { id: 'res-1', name: 'Borin Stonefist', level: 2, isBusy: false, assignedSlot: null, xp: 0 },
  { id: 'res-2', name: 'Aelin Swiftblade', level: 1, isBusy: false, assignedSlot: null, xp: 0 },
  { id: 'res-3', name: 'Theron the Wise', level: 3, isBusy: false, assignedSlot: null, xp: 0 },
  { id: 'res-4', name: 'Lyra Blacksmith', level: 1, isBusy: false, assignedSlot: null, xp: 0 },
];

const INITIAL_SLOTS: ActivitySlot[] = [
  {
    id: 'slot-woodcutting-0',
    label: 'Slot 1',
    activityName: 'Taglio Legna',
    durationMs: ACTIVITY_DURATION_MS,
    remainingMs: ACTIVITY_DURATION_MS,
    status: 'empty',
    assignedResidentId: null,
    rewards: { gold: 15, xp: 25 },
  },
  {
    id: 'slot-quest-0',
    label: 'Slot 2',
    activityName: 'Missione: Caccia',
    durationMs: ACTIVITY_DURATION_MS * 2,
    remainingMs: ACTIVITY_DURATION_MS * 2,
    status: 'empty',
    assignedResidentId: null,
    rewards: { gold: 40, xp: 60 },
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatMs(ms: number): string {
  const s = Math.ceil(ms / 1000);
  const m = Math.floor(s / 60);
  const sec = s % 60;
  if (m > 0) return `${m}:${sec.toString().padStart(2, '0')}`;
  return `${sec}s`;
}

function progressPercent(remaining: number, total: number): number {
  return Math.round(((total - remaining) / total) * 100);
}

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * MinimalActivityPage
 *
 * Layout:
 * ┌─────────────────────────────────────────────┐
 * │ Title: Fase 5 - Activity + Timer            │
 * ├────────────────┬────────────────────────────┤
 * │   ROSTER       │   SLOT RACK                │
 * │  [Res 1]       │  [Slot 1: timer]           │
 * │  [Res 2]       │  [Slot 2: timer]           │
 * │  ...           │                            │
 * ├────────────────┴────────────────────────────┤
 * │ Risorse: Gold: 100  XP Pool: 0              │
 * └─────────────────────────────────────────────┘
 */
export default function MinimalActivityPage(): React.ReactNode {
  const [residents, setResidents] = useState<MockResident[]>(INITIAL_RESIDENTS);
  const [slots, setSlots] = useState<ActivitySlot[]>(INITIAL_SLOTS);
  const [gold, setGold] = useState(100);
  const [outcome, setOutcome] = useState<OutcomeModal>({
    visible: false,
    residentName: '',
    goldEarned: 0,
    xpEarned: 0,
    slotId: '',
  });

  // Timer tick — aggiorna ogni TICK_MS
  useEffect(() => {
    const interval = setInterval(() => {
      setSlots((prev) =>
        prev.map((slot) => {
          if (slot.status !== 'occupied') return slot;
          const remaining = Math.max(0, slot.remainingMs - TICK_MS);
          return {
            ...slot,
            remainingMs: remaining,
            status: remaining === 0 ? 'ready_to_complete' : 'occupied',
          };
        }),
      );
    }, TICK_MS);
    return () => clearInterval(interval);
  }, []);

  const handleAssign = useCallback(
    (residentId: string, slotId: string) => {
      const resident = residents.find((r) => r.id === residentId);
      const slot = slots.find((s) => s.id === slotId);
      if (!resident || !slot) return;
      if (resident.isBusy || slot.status !== 'empty') return;

      setResidents((prev) =>
        prev.map((r) =>
          r.id === residentId ? { ...r, isBusy: true, assignedSlot: slotId } : r,
        ),
      );
      setSlots((prev) =>
        prev.map((s) =>
          s.id === slotId
            ? { ...s, assignedResidentId: residentId, status: 'occupied', remainingMs: s.durationMs }
            : s,
        ),
      );
    },
    [residents, slots],
  );

  const handleComplete = useCallback(
    (slotId: string) => {
      const slot = slots.find((s) => s.id === slotId);
      if (!slot || slot.status !== 'ready_to_complete') return;
      const resident = residents.find((r) => r.id === slot.assignedResidentId);
      if (!resident) return;

      // Applica ricompense
      setGold((prev) => prev + slot.rewards.gold);
      setResidents((prev) =>
        prev.map((r) =>
          r.id === resident.id
            ? { ...r, isBusy: false, assignedSlot: null, xp: r.xp + slot.rewards.xp }
            : r,
        ),
      );
      setSlots((prev) =>
        prev.map((s) =>
          s.id === slotId
            ? { ...s, assignedResidentId: null, status: 'empty', remainingMs: s.durationMs }
            : s,
        ),
      );
      setOutcome({
        visible: true,
        residentName: resident.name,
        goldEarned: slot.rewards.gold,
        xpEarned: slot.rewards.xp,
        slotId,
      });
    },
    [residents, slots],
  );

  const closeOutcome = useCallback(() => {
    setOutcome((prev) => ({ ...prev, visible: false }));
  }, []);

  const availableResidents = residents.filter((r) => !r.isBusy);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 p-6 text-white">
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-1">Fase 5: Activity + Timer</h1>
          <p className="text-gray-400 text-sm">
            Assegna un residente a uno slot per avviare l'attività. Il token è congelato durante il timer.
          </p>
        </div>

        {/* HUD Risorse */}
        <div
          className="bg-gray-800 rounded-lg p-4 mb-8 flex gap-8"
          data-testid="activity-hud"
        >
          <div>
            <span className="text-xs text-gray-400 uppercase tracking-wide">Gold</span>
            <p className="text-2xl font-bold text-yellow-400" data-testid="hud-gold">{gold}</p>
          </div>
          <div>
            <span className="text-xs text-gray-400 uppercase tracking-wide">Residenti liberi</span>
            <p className="text-2xl font-bold text-green-400" data-testid="hud-available">
              {availableResidents.length} / {residents.length}
            </p>
          </div>
          <div>
            <span className="text-xs text-gray-400 uppercase tracking-wide">Slot occupati</span>
            <p className="text-2xl font-bold text-blue-400" data-testid="hud-occupied-slots">
              {slots.filter((s) => s.status !== 'empty').length} / {slots.length}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

          {/* Roster */}
          <div>
            <h2 className="text-lg font-semibold mb-4 text-gray-300">Roster</h2>
            <div className="space-y-3" data-testid="activity-roster">
              {residents.map((resident) => (
                <div
                  key={resident.id}
                  className={`rounded-lg p-4 border transition-all ${
                    resident.isBusy
                      ? 'bg-gray-700/50 border-gray-600 opacity-50'
                      : 'bg-gray-700 border-gray-500 hover:border-blue-400'
                  }`}
                  data-testid={`resident-${resident.id}`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="font-semibold">{resident.name}</p>
                      <p className="text-xs text-gray-400">Lv.{resident.level} · XP: {resident.xp}</p>
                    </div>
                    {resident.isBusy && (
                      <span
                        className="text-xs bg-orange-600 px-2 py-0.5 rounded-full"
                        data-testid={`resident-busy-badge-${resident.id}`}
                      >
                        In attività
                      </span>
                    )}
                  </div>

                  {!resident.isBusy && (
                    <div className="flex gap-2 flex-wrap">
                      {slots
                        .filter((s) => s.status === 'empty')
                        .map((slot) => (
                          <button
                            key={slot.id}
                            onClick={() => handleAssign(resident.id, slot.id)}
                            className="text-xs bg-blue-600 hover:bg-blue-500 px-3 py-1 rounded transition-colors"
                            data-testid={`assign-btn-${resident.id}-${slot.id}`}
                          >
                            → {slot.label}
                          </button>
                        ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* SlotRack con timer */}
          <div>
            <h2 className="text-lg font-semibold mb-4 text-gray-300">Slot Attività</h2>
            <div className="space-y-4" data-testid="activity-slot-rack">
              {slots.map((slot) => {
                const resident = residents.find((r) => r.id === slot.assignedResidentId);
                const progress = progressPercent(slot.remainingMs, slot.durationMs);
                return (
                  <div
                    key={slot.id}
                    className={`rounded-lg p-5 border-2 transition-all ${
                      slot.status === 'empty'
                        ? 'bg-gray-700/40 border-dashed border-gray-600'
                        : slot.status === 'ready_to_complete'
                          ? 'bg-green-900/30 border-green-500 shadow-green-500/20 shadow-lg'
                          : 'bg-gray-700 border-blue-500'
                    }`}
                    data-testid={`slot-${slot.id}`}
                    data-slot-status={slot.status}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <p className="font-semibold">{slot.activityName}</p>
                        <p className="text-xs text-gray-400">
                          Ricompensa: {slot.rewards.gold} gold · {slot.rewards.xp} XP
                        </p>
                      </div>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full ${
                          slot.status === 'empty'
                            ? 'bg-gray-600 text-gray-300'
                            : slot.status === 'ready_to_complete'
                              ? 'bg-green-600 text-white'
                              : 'bg-blue-600 text-white'
                        }`}
                        data-testid={`slot-status-badge-${slot.id}`}
                      >
                        {slot.status === 'empty'
                          ? 'Vuoto'
                          : slot.status === 'ready_to_complete'
                            ? 'PRONTO'
                            : 'In corso'}
                      </span>
                    </div>

                    {slot.status !== 'empty' && (
                      <>
                        {resident && (
                          <p className="text-sm text-blue-300 mb-2">
                            👤 {resident.name}
                          </p>
                        )}
                        {/* Timer */}
                        <div className="mb-3">
                          <div className="flex justify-between text-xs text-gray-400 mb-1">
                            <span data-testid={`slot-timer-${slot.id}`}>
                              {slot.status === 'ready_to_complete' ? 'Completato!' : formatMs(slot.remainingMs)}
                            </span>
                            <span>{progress}%</span>
                          </div>
                          <div className="w-full bg-gray-600 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full transition-all ${
                                slot.status === 'ready_to_complete' ? 'bg-green-500' : 'bg-blue-500'
                              }`}
                              style={{ width: `${progress}%` }}
                              data-testid={`slot-progress-${slot.id}`}
                            />
                          </div>
                        </div>

                        {slot.status === 'ready_to_complete' && (
                          <button
                            onClick={() => handleComplete(slot.id)}
                            className="w-full bg-green-600 hover:bg-green-500 text-white font-semibold py-2 rounded-lg transition-colors"
                            data-testid={`complete-btn-${slot.id}`}
                          >
                            ✓ Completa Attività
                          </button>
                        )}
                      </>
                    )}

                    {slot.status === 'empty' && (
                      <p className="text-sm text-gray-500 mt-1">
                        Assegna un residente dal Roster →
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Spec Info */}
        <div className="mt-8 bg-gray-800/50 rounded-lg p-4 border border-gray-700">
          <h3 className="text-sm font-semibold text-gray-400 mb-2">
            📋 Spec Fase 5 (vertical_slice_implementation_plan.md)
          </h3>
          <ul className="text-xs text-gray-500 space-y-1">
            <li>✓ Token "congelato" durante attività (badge "In attività", nessun assign button)</li>
            <li>✓ Timer countdown visibile (ms → secondi formattati)</li>
            <li>✓ Transizione occupied → ready_to_complete quando timer = 0</li>
            <li>✓ Pulsante "Completa" compare solo quando ready</li>
            <li>✓ Outcome: gold+xp applicati, token ritorna al Roster</li>
          </ul>
        </div>

        <div className="mt-4 text-center text-xs text-gray-600">
          Fase 5 di 6 — Implementazione Incrementale Vertical Slice
        </div>
      </div>

      {/* Outcome Modal */}
      {outcome.visible && (
        <div
          className="fixed inset-0 bg-black/70 flex items-center justify-center z-50"
          data-testid="outcome-modal"
        >
          <div className="bg-gray-800 rounded-xl p-8 shadow-2xl border border-green-500 max-w-sm w-full mx-4">
            <h2 className="text-2xl font-bold text-green-400 mb-2">Attività Completata!</h2>
            <p className="text-gray-300 mb-6">{outcome.residentName} ha completato il lavoro.</p>
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-gray-700 rounded-lg p-3 text-center">
                <p className="text-xs text-gray-400 mb-1">Gold</p>
                <p className="text-2xl font-bold text-yellow-400" data-testid="outcome-gold">
                  +{outcome.goldEarned}
                </p>
              </div>
              <div className="bg-gray-700 rounded-lg p-3 text-center">
                <p className="text-xs text-gray-400 mb-1">XP</p>
                <p className="text-2xl font-bold text-blue-400" data-testid="outcome-xp">
                  +{outcome.xpEarned}
                </p>
              </div>
            </div>
            <button
              onClick={closeOutcome}
              className="w-full bg-green-600 hover:bg-green-500 text-white font-semibold py-3 rounded-lg transition-colors"
              data-testid="outcome-close-btn"
            >
              Continua
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
