/**
 * R-259 (quest-run-window): the outcome popup anchors on the RIGHT.
 *
 * Director (2026-10-22): «il msg popup deve essere identico all'esito d
 * quello dello skill check. Quello automatico è fatto meglio, ma deve
 * apparire a destra cm se fosse "nato dallo skill check"». The toast keeps
 * the full check payload (verdict chip + title + flavor + harm lines +
 * authored text — identical to the resolved check) and anchors on the
 * right edge, sliding in from that side like it was born from the
 * skill-check column.
 */
import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { QuestOutcomeToastHost } from '@/ui/idleVillage/components/gameFrame/QuestOutcomeToast';
import { publishQuestRun, useQuestRunStore } from '@/ui/idleVillage/questS1Lab/questRunStore';
import { DEFAULT_GAME_FRAME_CONFIG } from '@/balancing/config/idleVillage/gameFrameConfig';
import { applyChoice, availableOptions, checkHistory, createRun } from '@/ui/idleVillage/questS1Lab/questRun';
import { GOBLIN_PRESETS } from '@/ui/idleVillage/questS1Lab/questLabPresets';
import type { QuestRunState, ResolvedCheck } from '@/ui/idleVillage/questS1Lab/questRun';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (_ns: string, key: string) => key }),
}));

const QUEST_ID = 'goblin';
const PRESET = GOBLIN_PRESETS[0].id;
const CFG = DEFAULT_GAME_FRAME_CONFIG.questWindow.outcomeToast;

const drivenRun = (): QuestRunState => {
  const run = createRun(PRESET, 42, QUEST_ID);
  for (let i = 0; i < 80 && !run.ended; i += 1) {
    const options = availableOptions(run).filter((o) => !o.disabled);
    if (!options.length) break;
    applyChoice(run, options[0].id);
  }
  run.ended = null;
  return run;
};

const publishCheck = (): void => {
  const run = drivenRun();
  const seq = (run.checkSeq ?? 0) + 1;
  const c: ResolvedCheck = {
    ...(checkHistory(run)[0] as ResolvedCheck),
    checkSeq: seq,
    visitSeq: run.cursorVisitSeq - 1,
    beatIndex: 1,
  };
  run.checkSeq = seq;
  run.checkQueue = [...run.checkQueue, c];
  publishQuestRun(QUEST_ID, run);
};

describe('QuestOutcomeToast — right anchor (R-259)', () => {
  beforeEach(() => {
    useQuestRunStore.setState({ runs: {}, bridges: {}, rewardAck: {} });
  });

  // INV:R-259-toast-right — the config anchors the toast on the right
  // edge («nato dallo skill check», which lives in the right wing).
  it('the configured anchor is right', () => {
    expect(CFG.anchor).toBe('right');
  });

  // INV:R-259-toast-right — the painted plaque is pinned to the right
  // edge (never centred) and slides in from that side.
  it('paints pinned to the right edge with a right-edge entrance', () => {
    publishCheck();
    render(<QuestOutcomeToastHost questId={QUEST_ID} />);
    const el = screen.getByTestId('quest-outcome-toast');
    expect(el.style.right).toBe(`${CFG.offsetXPx}px`);
    expect(el.style.left).toBe('');
    expect(el.style.transform).not.toContain('translateX(-50%)');
    expect(el.style.animation).toContain('questToastInRight');
    /* identical to the resolved check: title + flavor + harm lines */
    const run = useQuestRunStore.getState().runs[QUEST_ID]!;
    const latest = checkHistory(run).at(-1)!;
    expect(el.textContent).toContain(latest.title);
    expect(el.textContent).toContain(latest.flavor);
  });
});
