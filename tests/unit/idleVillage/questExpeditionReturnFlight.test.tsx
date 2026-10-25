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

/** One painted commit, as the Director's eye would see it. */
interface CommitFrame {
  /** The seat still holds the resident — the seat would paint its medallion. */
  seatHasMedal: boolean;
  /** The seat copy is suppressed (empty cavity painted instead). */
  seatSuppressed: boolean;
  /** A flight proxy is in the DOM (the medallion is airborne). */
  proxyAirborne: boolean;
}

/**
 * Records every committed render after the fact — `useEffect` runs post-commit,
 * so the DOM query sees exactly what was painted on that frame.
 */
const CommitSpy: React.FC<{
  session: QuestExpeditionSession;
  target: { slotId: string | null; rid: string | null };
  frames: CommitFrame[];
}> = ({ session, target, frames }) => {
  React.useEffect(() => {
    if (!target.slotId || !target.rid) return;
    const seat = session.controller.slots.find((s) => s.id === target.slotId);
    frames.push({
      seatHasMedal: seat?.assignedResidentId === target.rid || seat?.assignedResident?.id === target.rid,
      seatSuppressed: session.suppressedResidentIds?.includes(target.rid) ?? false,
      proxyAirborne: Boolean(document.querySelector('[data-testid="flight-proxy"]')),
    });
  });
  return null;
};

const Harness: React.FC<{
  probe: Probe;
  withRack?: boolean;
  spy?: { target: { slotId: string | null; rid: string | null }; frames: CommitFrame[] };
}> = ({ probe, withRack, spy }) => {
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
      {spy ? <CommitSpy session={session} target={spy.target} frames={spy.frames} /> : null}
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
  checkEligibility: (slotId: string, residentId: string) => { eligible: boolean; reason?: string };
  getAssignments: () => Record<string, string | null>;
  openDetail: () => void;
  dropResidentOnSlot: (residentId: string, slotId: string) => unknown;
  completeRosterFlight: (residentId: string, slotId: string) => unknown;
  blockReasonFor: (fromSlotId: string, toSlotId: string) => string | null;
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
    /* jsdom lacks `window.matchMedia` — opening the detail mounts
     * QuestExpeditionDetail, which reads it via useMobileFit. */
    if (!window.matchMedia) {
      window.matchMedia = ((q: string) => ({
        matches: false,
        media: q,
        addEventListener() {},
        removeEventListener() {},
        addListener() {},
        removeListener() {},
        onchange: null,
        dispatchEvent: () => false,
      })) as unknown as typeof window.matchMedia;
    }
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

  // INV:use-quest-expedition-session.INV-4 — R-269: the medallion must be on
  // exactly one carrier on EVERY painted frame. The clear, the seat
  // suppression and the return flight are one transition → they land in the
  // same commit, so a frame where the seat still holds the resident but its
  // medallion is already hidden while no proxy is airborne (the «sparisce e
  // riappare» the Director saw) can never paint.
  it('never paints a frame where the seat medallion is suppressed before the proxy is airborne', async () => {
    const target = { slotId: null as string | null, rid: null as string | null };
    const frames: CommitFrame[] = [];
    render(<Harness probe={probe} withRack spy={{ target, frames }} />);
    const { slotId, rid } = eligiblePair(probe);
    target.slotId = slotId;
    target.rid = rid;
    act(() => {
      expect(expeditionHooks().assignToSlot(slotId, rid)).toBe(true);
    });

    const unmountAnchors = mountAnchors(slotId, rid);
    try {
      /* Outside `act`: the click must schedule with real React lanes — the
       * bug only exists in the gap between the urgent suppression commit
       * and the deferred flight commit, and `act` may merge them. */
      expeditionHooks().clearSlot(slotId);
      await waitFor(
        () => expect(screen.queryByTestId('flight-proxy')).not.toBeNull(),
        { timeout: 2000 },
      );

      /* The illegal frame: seat still assigned (its medallion would render)
       * + suppressed (it doesn't) + no proxy airborne (nothing else carries
       * it) → the medallion is invisible on that painted frame. */
      const blinked = frames.filter((f) => f.seatHasMedal && f.seatSuppressed && !f.proxyAirborne);
      expect(blinked).toEqual([]);

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

  // INV:use-quest-expedition-session.INV-5 — R-281: a roster medallion
  // dropped on an occupied seat takes it; the displaced occupant returns to
  // the roster on the extraction's return flight — assign + suppression +
  // proxy in one commit, so the displaced medallion always has a carrier.
  it('a roster drop on an occupied seat seats the newcomer and flies the displaced back to the roster', async () => {
    render(<Harness probe={probe} />);
    act(() => {
      expeditionHooks().openDetail();
    });
    const { slotId, rid } = eligiblePair(probe);
    const incoming = Object.keys(probe.residentsById).find(
      (id) => id !== rid && expeditionHooks().checkEligibility(slotId, id).eligible,
    );
    if (!incoming) throw new Error('need a second eligible resident — roster or POI config changed');

    act(() => {
      expect(expeditionHooks().assignToSlot(slotId, rid)).toBe(true);
    });
    expect(expeditionHooks().getAssignments()[slotId]).toBe(rid);

    const unmountAnchors = mountAnchors(slotId, rid);
    try {
      /* The drag-end gate accepts the drop: the verdict carries the flight
       *  to the occupied seat instead of refusing it. */
      let verdict: unknown;
      act(() => {
        verdict = expeditionHooks().dropResidentOnSlot(incoming, slotId);
      });
      expect(verdict).toMatchObject({ flightToSlot: { slotId } });

      /* At landing: the newcomer seats, the displaced leaves every seat and
       *  is airborne toward its roster card on the same commit. */
      act(() => {
        expeditionHooks().completeRosterFlight(incoming, slotId);
      });
      const after = expeditionHooks().getAssignments();
      expect(after[slotId]).toBe(incoming);
      expect(Object.values(after)).not.toContain(rid);
      expect(screen.getByTestId('flight-proxy')).toBeInTheDocument();
      expect(probe.session!.lockedResidentIds).toContain(rid);

      await waitFor(
        () => {
          expect(screen.queryByTestId('flight-proxy')).toBeNull();
          expect(probe.session!.lockedResidentIds).not.toContain(rid);
        },
        /* Two flights land in this test (incoming card + displaced return) —
         *  4s headroom for the shared worktree's CPU contention; the
         *  assertions themselves are unchanged. */
        { timeout: 4000 },
      );
    } finally {
      unmountAnchors();
    }
  });

  // INV:use-quest-expedition-session.INV-5 — R-281: the refusal is honest —
  // an ineligible drop on an occupied seat returns `false` and nothing moves.
  it('refuses the replace when the dragged resident is not eligible for the seat', () => {
    render(<Harness probe={probe} />);
    act(() => {
      expeditionHooks().openDetail();
    });
    const { slotId, rid } = eligiblePair(probe);
    const ineligible = Object.keys(probe.residentsById).find(
      (id) => id !== rid && !expeditionHooks().checkEligibility(slotId, id).eligible,
    );
    act(() => {
      expect(expeditionHooks().assignToSlot(slotId, rid)).toBe(true);
    });
    const before = expeditionHooks().getAssignments();
    let verdict: unknown;
    act(() => {
      verdict = ineligible
        ? expeditionHooks().dropResidentOnSlot(ineligible, slotId)
        : expeditionHooks().dropResidentOnSlot(rid, 'no-such-slot');
    });
    expect(verdict).toBeFalsy();
    expect(expeditionHooks().getAssignments()).toEqual(before);
    expect(screen.queryByTestId('flight-proxy')).toBeNull();
  });

  // INV:use-quest-expedition-session.INV-6 — R-283: a never-assigned resident
  // whose compatible seats are all OCCUPIED must stay 'valid' — PgCard
  // disables the draggable on 'invalid', so an all-invalid roster made the
  // INV-5 replace unreachable exactly when the rack is full (Director: «li
  // devo poter prendere per fare lo swap con 1 slot già occupato»).
  it('keeps an unassigned resident compatible when its seats are all occupied', () => {
    render(<Harness probe={probe} />);
    act(() => {
      expeditionHooks().openDetail();
    });

    const slotId = (suffix: string) => {
      const s = probe.session!.controller.slots.find((sl) => sl.id.endsWith(suffix));
      if (!s) throw new Error(`no slot id ending with ${suffix} — POI config changed`);
      return s.id;
    };
    /* Fill every seat. Chosen so each resident lands on a seat it is
     * eligible for (goblin gates: leader edge|fortitude, member-1
     * edge|fortitude|warden, member-2 precision|clarity, bodyguard
     * warden|fortitude). */
    const pairs: Array<[string, string]> = [
      [slotId('leader'), 'hero-giggiolillo'],
      [slotId('member-1'), 'hero-sir-spaccaculi'],
      [slotId('member-2'), 'hero-salvatrice'],
      [slotId('bodyguard'), 'villager-baldassarre'],
    ];
    for (const [sid, rid] of pairs) {
      act(() => {
        expect(expeditionHooks().assignToSlot(sid, rid)).toBe(true);
      });
    }
    expect(Object.values(expeditionHooks().getAssignments()).filter(Boolean)).toHaveLength(
      probe.session!.controller.slots.length,
    );

    /* Never assigned, fits only OCCUPIED seats → still draggable. */
    expect(probe.session!.getResidentCompatibility('villager-mastro-beppe')?.state).toBe('valid');
    expect(probe.session!.getResidentCompatibility('villager-lisetta')?.state).toBe('valid');
  });

  // INV:use-quest-expedition-session.INV-7 — R-282: the announced reason
  // follows the commit's leg order — dragged → target first, displaced →
  // source second; a legal swap reports null. (The icon half lands after
  // the visual-fork ruling.)
  it('reports the first failing leg as the swap block reason', () => {
    render(<Harness probe={probe} />);
    act(() => {
      expeditionHooks().openDetail();
    });
    const slots = probe.session!.controller.slots.map((s) => s.id);
    const rids = Object.keys(probe.residentsById);
    const elig = (sid: string, rid: string) => expeditionHooks().checkEligibility(sid, rid).eligible;

    /* Legal swap: both directions eligible → null. */
    let assertedLegal = false;
    outer: for (const a of slots) {
      for (const b of slots) {
        if (a === b) continue;
        const ra = rids.find((r) => elig(a, r) && elig(b, r));
        const rb = rids.find((r) => r !== ra && elig(a, r) && elig(b, r));
        if (ra && rb) {
          act(() => {
            expect(expeditionHooks().assignToSlot(a, ra)).toBe(true);
            expect(expeditionHooks().assignToSlot(b, rb)).toBe(true);
          });
          expect(expeditionHooks().blockReasonFor(a, b)).toBeNull();
          assertedLegal = true;
          break outer;
        }
      }
    }
    if (!assertedLegal) throw new Error('no legal swap pair — roster or POI config changed');

    /* Refused swap: dragged fits the target, displaced does NOT fit the
     * source → the reason is the displaced leg's eligibility reason. */
    let assertedBlocked = false;
    outer: for (const a of slots) {
      for (const b of slots) {
        if (a === b) continue;
        const ra = rids.find((r) => elig(a, r) && elig(b, r));
        const rb = rids.find((r) => r !== ra && elig(b, r) && !elig(a, r));
        if (ra && rb) {
          act(() => {
            expect(expeditionHooks().assignToSlot(a, ra)).toBe(true);
            expect(expeditionHooks().assignToSlot(b, rb)).toBe(true);
          });
          const expected = expeditionHooks().checkEligibility(a, rb).reason;
          expect(expeditionHooks().blockReasonFor(a, b)).toBe(expected ?? 'ineligible');
          assertedBlocked = true;
          break outer;
        }
      }
    }
    if (!assertedBlocked) throw new Error('no refused swap pair — roster or POI config changed');
  });
});
