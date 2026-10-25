/**
 * R-241 B5 (use-quest-poi-session.INV-1 + game-frame-pixi.INV-3) — during a
 * live quest the roster shows STATUS, never planner slot compatibility.
 *
 * Director (2026-10-21): «durante la quest se apro il roster dell aquest
 * dico "nessuno slot compatibile". Dovrebbe mostrare solo tipo feritgli
 * status». Root cause, two layers:
 * 1. `useQuestPoiSession.getResidentCompatibility` answers
 *    `{state:'invalid', reason:'Nessuno slot compatibile'}` for every
 *    resident — even while its own quest is running (the expedition
 *    sessions already abstain on `!isDetailOpen || run`).
 * 2. The `/game` composer chains `expeditionGoblin ?? expeditionRovine ??
 *    session` — the two expeditions correctly abstain during a run, but the
 *    POI fallback always answers, so during ANY live quest every card still
 *    gets `invalid`. The composer must abstain while ANY quest context is
 *    live (expedition run unsettled, POI quest running or uncollected).
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { DEFAULT_IDLE_VILLAGE_CONFIG } from '@/balancing/config/idleVillage/defaultConfig';
import { DEFAULT_MINIMAL_CONFIG } from '@/balancing/config/idleVillage/minimalConfig';
import type { MissionLaunchPayload } from '@/engine/game/idleVillage/missionPlannerDraft';

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

import { useQuestPoiSession } from '@/ui/idleVillage/quests/useQuestPoiSession';
import { useMinimalGameplayStore } from '@/store/useMinimalGameplay';

const PAYLOAD: MissionLaunchPayload = {
  questId: 'quest_city_rats',
  party: [
    { residentId: 'hero-sir-spaccaculi', slotId: 'quest_city_rats-slot-0', loadout: {} },
    { residentId: 'hero-giggiolillo', slotId: 'quest_city_rats-slot-1', loadout: {} },
  ],
  consumables: [],
};

/* A resident whose statTags match NO quest_city_rats slot — the planner
 * would stamp «Nessuno slot compatibile» on its card. */
const INCOMPATIBLE_RESIDENT = 'villager-lisetta';

function resetStore() {
  const base = useMinimalGameplayStore.getState();
  useMinimalGameplayStore.setState({
    ...base,
    config: DEFAULT_MINIMAL_CONFIG,
    state: {
      ...base.state,
      gold: 100,
      food: 50,
      maxFood: 50,
      wood: 0,
      xp: 0,
      currentDay: 0,
      currentTick: 0,
      isPaused: false,
      speedMultiplier: 1,
      residents: [],
      activeActivities: [],
      eventLog: [],
    },
  });
}

describe('useQuestPoiSession — compatibility abstains while the quest lives (R-241)', () => {
  beforeEach(() => {
    resetStore();
  });

  // INV:use-quest-poi-session.INV-1 — with no quest live the planner compat
  // still answers (reference-page medallion flow is preserved); once the
  // quest is running the session MUST abstain (undefined).
  it('answers while idle, abstains while the quest is running', () => {
    const { result } = renderHook(() => useQuestPoiSession({ exposeTestHooks: false }));

    const idle = result.current.getResidentCompatibility(INCOMPATIBLE_RESIDENT);
    expect(idle).toBeDefined();
    expect(idle?.state).toBe('invalid');

    act(() => {
      const started = result.current.startQuestWithPayload(PAYLOAD);
      expect(started).toBe(true);
    });
    expect(result.current.isQuestRunning).toBe(true);
    expect(result.current.getResidentCompatibility(INCOMPATIBLE_RESIDENT)).toBeUndefined();
  });
});

describe('useQuestPoiSession — roster stays pickable for the occupied-seat swap (R-283)', () => {
  beforeEach(() => {
    resetStore();
  });

  const poiHooks = () =>
    (window as unknown as {
      __idleVillageTestHooks: {
        assignResident: (residentId: string) => string | null;
        getSlotAssignments: () => Array<{ id: string; assignedResidentId: string | null }>;
        openPoiDetail: () => void;
        getPageFlight: () => { mode: string };
      };
    }).__idleVillageTestHooks;

  // INV:use-quest-poi-session.INV-2 — R-283: a never-assigned resident whose
  // only compatible seat is OCCUPIED must stay 'valid' — PgCard disables the
  // draggable on 'invalid', so an all-invalid roster made the R-281/QoL-5
  // roster→occupied-seat swap unreachable exactly when the rack is full.
  it('marks an unassigned resident compatible when only occupied seats accept it', () => {
    const { result } = renderHook(() => useQuestPoiSession({ exposeTestHooks: true }));

    /* Fill every quest_city_rats seat — one act per assign so the test-hook
     *  closures re-register on the fresh assignments. */
    act(() => { poiHooks().assignResident('hero-sir-spaccaculi'); });  // → slot-0
    act(() => { poiHooks().assignResident('hero-giggiolillo'); });   // → slot-1
    act(() => { poiHooks().assignResident('hero-salvatrice'); });    // → slot-2 (ward/clarity)
    /* The three authored seats are full; the 'infinite' virtual placeholder
     *  stays free but wants edge+discipline|moth — nobody in the roster can
     *  fill it, which is exactly the all-invalid rack the Director saw. */
    const slots = poiHooks().getSlotAssignments();
    for (const id of ['quest_city_rats-slot-0', 'quest_city_rats-slot-1', 'quest_city_rats-slot-2']) {
      expect(slots.find((s) => s.id === id)?.assignedResidentId).toBeTruthy();
    }

    /* 'fortitude' fits only the now-OCCUPIED combatant seats — the replace
     *  gate must keep the card draggable, not stamp «Nessuno slot compatibile». */
    expect(result.current.getResidentCompatibility('villager-mastro-beppe')?.state).toBe('valid');
    expect(result.current.getResidentCompatibility('villager-baldassarre')?.state).toBe('valid');

    /* 'precision' matches NO seat at all — the refusal stays honest. */
    expect(result.current.getResidentCompatibility(INCOMPATIBLE_RESIDENT)?.state).toBe('invalid');
  });

  // INV:use-quest-poi-session.INV-2 — R-283: if the seat anchor is missing
  // when the deferred flight read runs, the flying lock must release — a
  // stuck `flyingResidentId` killed every later click-assign and left the
  // card locked 'away' forever (the expedition session already releases it).
  it('releases the flying lock when the seat anchor is missing', async () => {
    const { result } = renderHook(() => useQuestPoiSession({ exposeTestHooks: true }));
    act(() => { poiHooks().openPoiDetail(); });

    /* The roster card exists (the click needs a `from` anchor), but NO seat
     *  element is mounted — the deferred `to` read resolves null. */
    const card = document.createElement('div');
    card.dataset.residentId = 'hero-sir-spaccaculi';
    document.body.append(card);
    try {
      act(() => {
        result.current.handleResidentSelect('hero-sir-spaccaculi');
      });
      await act(async () => { await new Promise((r) => setTimeout(r, 80)); });

      /* The lock must be released — otherwise every later click-assign dies
       *  on `flyingResidentRef.current` and the card stays 'away' forever. */
      expect(result.current.lockedResidentIds).not.toContain('hero-sir-spaccaculi');

      /* And a later click-assign is not dead: with the seat anchor mounted
       *  the flight arms. */
      const seat = document.createElement('div');
      seat.dataset.testid = 'slot-button-quest_city_rats-slot-0';
      document.body.append(seat);
      try {
        act(() => {
          result.current.handleResidentSelect('hero-sir-spaccaculi');
        });
        await act(async () => { await new Promise((r) => setTimeout(r, 80)); });
        expect(poiHooks().getPageFlight().mode).toBe('flight');
      } finally {
        seat.remove();
      }
    } finally {
      card.remove();
    }
  });
});

describe('roster composer — no compat while any quest context is live (R-241)', () => {
  // INV:game-frame-pixi.INV-3 — the composed roster resolver returns
  // undefined as soon as ONE session reports a live quest context, so the
  // POI fallback can no longer stamp «Nessuno slot compatibile» on the cards
  // during an expedition run either.
  it('abstains when a session flags its quest context live, otherwise first non-undefined wins', async () => {
    const { composeRosterCompatibility } = await import('@/ui/idleVillage/quests/rosterCompatibility');
    const goblinAnswer = { state: 'valid' as const, slotId: 'g0', slotLabel: 'Combattente' };
    const poiAnswer = { state: 'invalid' as const, reason: 'Nessuno slot compatibile' };
    const goblin = { contextActive: true, getResidentCompatibility: () => undefined };
    const rovine = { contextActive: false, getResidentCompatibility: () => undefined };
    const poi = { contextActive: false, getResidentCompatibility: () => poiAnswer };
    expect(composeRosterCompatibility([goblin, rovine, poi])('r1')).toBeUndefined();

    const quietGoblin = { contextActive: false, getResidentCompatibility: () => undefined };
    expect(composeRosterCompatibility([quietGoblin, rovine, poi])('r1')).toEqual(poiAnswer);

    const goblinAnswerer = { contextActive: false, getResidentCompatibility: () => goblinAnswer };
    expect(composeRosterCompatibility([goblinAnswerer, rovine, poi])('r1')).toEqual(goblinAnswer);
  });
});
