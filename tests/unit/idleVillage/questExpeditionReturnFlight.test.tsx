/**
 * questExpeditionReturnFlight.test.tsx — R-248 spring-back contract:
 * extracting a resident from a quest seat (press-hold → `onExtracted` →
 * `onSlotClear`, or the BoardSlot «Clear» affordance) must end with the
 * return flight slot→roster card — the same contract
 * `useQuestPoiSession.handleSlotClear` already honours. The session
 * previously wired `onSlotClear={controller.clearSlot}` straight through:
 * the seat emptied and the token simply vanished.
 *
 * The test drives the session's own E2E seam (`expedition.<poi>.clearSlot`)
 * — the same boundary the rack's clear path calls — and asserts the shared
 * `DragOutcomeFlight` mounts a `flight-proxy` and the resident stays locked
 * for the flight's duration.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { act, render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { DndContext } from '@dnd-kit/core';
import { DEFAULT_IDLE_VILLAGE_CONFIG } from '@/balancing/config/idleVillage/defaultConfig';
import { DEFAULT_MINIMAL_CONFIG } from '@/balancing/config/idleVillage/minimalConfig';
import type { QuestRunApi } from '@/ui/idleVillage/questS1Lab/useQuestRun';
import type { ResidentState } from '@/engine/game/idleVillage/TimeEngine';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'en' },
  }),
}));

vi.mock('@/balancing/config/idleVillage/transformations', () => ({
  transformIdleVillageToMinimalConfig: () => DEFAULT_MINIMAL_CONFIG,
}));

vi.mock('@/balancing/hooks/useIdleVillageConfig', () => ({
  useIdleVillageConfig: () => ({
    config: DEFAULT_IDLE_VILLAGE_CONFIG,
    history: [],
    initialized: true,
    isInitializing: false,
    initializeConfig: vi.fn(),
    saveConfig: vi.fn(),
    undo: vi.fn(),
    canUndo: false,
    exportConfig: vi.fn(),
    importConfig: vi.fn(),
    resetConfig: vi.fn(),
    resetToInitialConfig: vi.fn(),
    updateConfig: vi.fn(),
  }),
}));

vi.mock('@/analytics/telemetry/telemetryProvider', () => ({
  trackTelemetryEvent: vi.fn(),
  traceMinimalGameplay: vi.fn(),
}));

vi.mock('@/shared/persistence/PersistenceService', () => ({
  saveData: vi.fn(() => Promise.resolve()),
  loadData: vi.fn(<T,>(_key: string, fallback: T) => Promise.resolve(fallback)),
  clearData: vi.fn(() => Promise.resolve()),
}));

import { useQuestExpeditionSession, type QuestExpeditionSession } from '@/ui/idleVillage/quests/useQuestExpeditionSession';
import { ResidentSlotRack } from '@/ui/idleVillage/components/ResidentSlotRack';
import { useRosterKitData } from '@/ui/idleVillage/frozen/kits/rosterKit';
import { questPoiById } from '@/balancing/config/idleVillage/quests/questPois';

const questRunStub = (): QuestRunApi => ({
  run: null,
  phases: [],
  start: vi.fn(),
  choose: vi.fn(),
  armedFlags: new Set<string>(),
  toggleArmedFlag: vi.fn(),
  syncClock: vi.fn(),
  abandon: vi.fn(),
  useHealing: vi.fn(),
  drinkPotion: vi.fn(),
  clear: vi.fn(),
  beats: [],
  beatCursorRef: { current: 0 },
  applySettlement: vi.fn(),
  dismissOutcome: vi.fn(),
});

interface Probe {
  session: QuestExpeditionSession | null;
  residentsById: Record<string, ResidentState>;
}

const Harness: React.FC<{ probe: Probe; withRack?: boolean }> = ({ probe, withRack }) => {
  const session = useQuestExpeditionSession({
    poi: questPoiById('poi-goblin')!,
    questRun: questRunStub(),
    activeRuns: [],
    currentTick: 0,
    onOpenStash: () => {},
  });
  const { residentsById } = useRosterKitData();
  probe.session = session;
  probe.residentsById = residentsById;
  /* The page mounts the overlays inside its shared DndContext. */
  return (
    <DndContext>
      {withRack ? (
        <ResidentSlotRack
          slots={session.controller.slots}
          layout="detail"
          slotSize={64}
          slotVariant="hud64"
          suppressedResidentIds={session.suppressedResidentIds}
        />
      ) : null}
      {session.overlays}
    </DndContext>
  );
};

type ExpeditionHooks = {
  assignToSlot: (slotId: string, residentId: string) => boolean;
  clearSlot: (slotId: string) => void;
  checkEligibility: (slotId: string, residentId: string) => { eligible: boolean };
  getAssignments: () => Record<string, string | null>;
};

const expeditionHooks = (poiId = 'poi-goblin'): ExpeditionHooks =>
  ((window as unknown as { __idleVillageTestHooks: { expedition: Record<string, ExpeditionHooks> } })
    .__idleVillageTestHooks.expedition[poiId]);

/** First eligible (slot, resident) pair — same discovery the runtime probe does. */
const eligiblePair = (probe: Probe): { slotId: string; rid: string } => {
  const hooks = expeditionHooks();
  for (const slot of probe.session!.controller.slots) {
    for (const rid of Object.keys(probe.residentsById)) {
      if (hooks.checkEligibility(slot.id, rid).eligible) return { slotId: slot.id, rid };
    }
  }
  throw new Error('no eligible resident/slot pair — roster or POI config changed');
};

const mountAnchors = (slotId: string, rid: string) => {
  const seat = document.createElement('div');
  seat.dataset.testid = `slot-button-${slotId}`;
  const card = document.createElement('div');
  card.dataset.residentId = rid;
  document.body.append(seat, card);
  return () => {
    seat.remove();
    card.remove();
  };
};

describe('quest expedition — extraction return flight (R-248)', () => {
  const probe: Probe = { session: null, residentsById: {} };

  beforeEach(() => {
    delete (window as unknown as { __idleVillageTestHooks?: unknown }).__idleVillageTestHooks;
    /* jsdom lacks `HTMLImageElement.decode` — the medal overlay gates its
     * portrait reveal on it; a resolved stub is enough for the proxy. */
    (HTMLImageElement.prototype as unknown as { decode: () => Promise<void> }).decode = () => Promise.resolve();
  });

  // INV:use-quest-expedition-session.INV-1 — clearing a slotted seat must
  // launch the return flight (isInset:false) toward the resident's roster
  // card, not just drop the assignment.
  it('clearing a slotted seat launches a flight proxy back to the roster card', async () => {
    render(<Harness probe={probe} />);
    const { slotId, rid } = eligiblePair(probe);

    /* The hook seam re-registers fresh closures on every render — re-read
     * it after each act, a stale entry would see the pre-mutation state. */
    act(() => {
      expect(expeditionHooks().assignToSlot(slotId, rid)).toBe(true);
    });
    expect(expeditionHooks().getAssignments()[slotId]).toBe(rid);

    const unmountAnchors = mountAnchors(slotId, rid);
    try {
      act(() => {
        expeditionHooks().clearSlot(slotId);
      });
      /* The seat is cleared AND the token is in the air — the spring-back
       * the reference session performs on every extraction. */
      expect(expeditionHooks().getAssignments()[slotId] ?? null).toBeNull();
      expect(screen.getByTestId('flight-proxy')).toBeInTheDocument();
      expect(probe.session!.lockedResidentIds).toContain(rid);

      /* On landing the flight settles: proxy unmounts, lock released. */
      await waitFor(
        () => {
          expect(screen.queryByTestId('flight-proxy')).toBeNull();
          expect(probe.session!.lockedResidentIds).not.toContain(rid);
        },
        { timeout: 2000 },
      );
    } finally {
      unmountAnchors();
    }
  });

  it('clearing an empty seat is a plain clear — no flight', () => {
    render(<Harness probe={probe} />);
    const slotId = probe.session!.controller.slots[0]!.id;
    act(() => {
      expeditionHooks().clearSlot(slotId);
    });
    expect(screen.queryByTestId('flight-proxy')).toBeNull();
  });

  // INV:use-quest-expedition-session.INV-2 — R-257: under the 'available'
  // roster filter the slotted card is filtered
  // OUT of the DOM — `document.querySelector('[data-resident-id]')` resolves
  // to null and the clear previously skipped the return flight entirely.
  // The flight must still run, landing on the roster list itself.
  it('the return flight still fires when the roster card is filtered out of the DOM', async () => {
    render(<Harness probe={probe} />);
    const { slotId, rid } = eligiblePair(probe);
    act(() => {
      expect(expeditionHooks().assignToSlot(slotId, rid)).toBe(true);
    });

    const seat = document.createElement('div');
    seat.dataset.testid = `slot-button-${slotId}`;
    /* The roster scroll list carries the count attribute — the slotted card
     * itself is deliberately absent, like the 'available' filter leaves it. */
    const list = document.createElement('div');
    list.dataset.residentCount = '5';
    document.body.append(seat, list);
    try {
      act(() => {
        expeditionHooks().clearSlot(slotId);
      });
      expect(screen.getByTestId('flight-proxy')).toBeInTheDocument();

      await waitFor(
        () => {
          expect(screen.queryByTestId('flight-proxy')).toBeNull();
          expect(probe.session!.lockedResidentIds).not.toContain(rid);
        },
        { timeout: 2000 },
      );
    } finally {
      seat.remove();
      list.remove();
    }
  });

  // INV:use-quest-expedition-session.INV-2 — R-257: the rack suppresses the
  // seat copy while the resident's flight is
  // airborne — the suppression signal is the session's `flyingResidentId`,
  // which must reach consumers for the «never two medallions» invariant.
  // (The render-level handoff itself is covered by the rack test: act()
  // flushes urgent + transition work into one commit, so a DOM assertion
  // here can't observe the overlap window the Director saw.)
  it('exposes flyingResidentId while the return flight is airborne', async () => {
    render(<Harness probe={probe} withRack />);
    const { slotId, rid } = eligiblePair(probe);
    act(() => {
      expect(expeditionHooks().assignToSlot(slotId, rid)).toBe(true);
    });

    const unmountAnchors = mountAnchors(slotId, rid);
    try {
      act(() => {
        expeditionHooks().clearSlot(slotId);
      });
      expect(screen.getByTestId('flight-proxy')).toBeInTheDocument();
      expect(probe.session!.flyingResidentId).toBe(rid);

      await waitFor(
        () => {
          expect(screen.queryByTestId('flight-proxy')).toBeNull();
          expect(probe.session!.flyingResidentId).toBeNull();
        },
        { timeout: 2000 },
      );
    } finally {
      unmountAnchors();
    }
  });
});
