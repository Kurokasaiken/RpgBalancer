// INV:use-quest-expedition-session.INV-8
/** R-359: click-assign must mount its flight without a timeout or deferred start. */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import React from 'react';
import { act, cleanup, render, screen } from '@testing-library/react';
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
import { useRosterKitData } from '@/ui/idleVillage/frozen/kits/rosterKit';
import { questPoiById } from '@/balancing/config/idleVillage/quests/questPois';

/** Idle quest run, matching the return-flight harness's planning state. */
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

/** Latest committed session and the real roster used to discover an eligible resident. */
interface Probe {
  session: QuestExpeditionSession | null;
  residentsById: Record<string, ResidentState>;
}

/** Mount the real session and its flight overlay in the page's shared DndContext. */
const Harness: React.FC<{
  onCommit: (session: QuestExpeditionSession, residentsById: Record<string, ResidentState>) => void;
}> = ({ onCommit }) => {
  const session = useQuestExpeditionSession({
    poi: questPoiById('poi-goblin')!,
    questRun: questRunStub(),
    activeRuns: [],
    currentTick: 0,
    onOpenStash: vi.fn(),
  });
  const { residentsById } = useRosterKitData();
  React.useLayoutEffect(() => {
    onCommit(session, residentsById);
  }, [onCommit, session, residentsById]);
  return <DndContext>{session.overlays}</DndContext>;
};

type ExpeditionHooks = {
  openDetail: () => void;
  checkEligibility: (slotId: string, residentId: string) => { eligible: boolean };
};

/** Read fresh closures after each commit, just like the return-flight harness. */
const expeditionHooks = (): ExpeditionHooks =>
  (window as unknown as { __idleVillageTestHooks: { expedition: Record<string, ExpeditionHooks> } })
    .__idleVillageTestHooks.expedition['poi-goblin'];

/** Find the first free eligible seat so click-assign will target this exact anchor. */
const eligiblePair = (probe: Probe): { slotId: string; rid: string } => {
  for (const slot of probe.session!.controller.slots) {
    if (slot.assignedResidentId) continue;
    for (const rid of Object.keys(probe.residentsById)) {
      if (expeditionHooks().checkEligibility(slot.id, rid).eligible) return { slotId: slot.id, rid };
    }
  }
  throw new Error('no free eligible resident/slot pair — roster or POI config changed');
};

describe('quest expedition — immediate click-assign flight (R-359)', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    delete (window as unknown as { __idleVillageTestHooks?: unknown }).__idleVillageTestHooks;
  });

  afterEach(() => {
    cleanup();
    vi.clearAllTimers();
    vi.useRealTimers();
    delete (window as unknown as { __idleVillageTestHooks?: unknown }).__idleVillageTestHooks;
  });

  it('returns true and mounts the flight proxy without advancing timers after selecting an eligible resident', () => {
    const probe: Probe = { session: null, residentsById: {} };
    render(
      <Harness onCommit={(session, residentsById) => {
        probe.session = session;
        probe.residentsById = residentsById;
      }} />,
    );
    act(() => {
      expeditionHooks().openDetail();
    });
    expect(probe.session!.isDetailOpen).toBe(true);
    expect(probe.session!.run).toBeNull();

    const { slotId, rid } = eligiblePair(probe);
    expect(probe.session!.controller.slots.find((slot) => slot.id === slotId)?.assignedResidentId).toBeFalsy();
    expect(expeditionHooks().checkEligibility(slotId, rid).eligible).toBe(true);

    // Mirror the return-flight fixtures: both elementCenter lookups must resolve.
    const seat = document.createElement('div');
    seat.dataset.testid = `slot-button-${slotId}`;
    const card = document.createElement('div');
    card.dataset.residentId = rid;
    document.body.append(seat, card);
    try {
      expect(document.querySelector(`[data-resident-id="${rid}"]`)).not.toBeNull();
      expect(document.querySelector(`[data-testid="slot-button-${slotId}"]`)).not.toBeNull();
      expect(screen.queryByTestId('flight-proxy')).toBeNull();
      const clickedAt = Date.now();
      act(() => {
        expect(probe.session!.handleResidentSelect(rid)).toBe(true);
      });

      // No waitFor or timer advance: the old 50ms callback cannot run here.
      expect(Date.now()).toBe(clickedAt);
      expect(screen.getByTestId('flight-proxy')).toBeInTheDocument();
      expect(probe.session!.flyingResidentId).toBe(rid);
    } finally {
      seat.remove();
      card.remove();
    }
  });
});
