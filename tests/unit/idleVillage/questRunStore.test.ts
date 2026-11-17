/**
 * questRunStore — PLAN-040 run projection store: overlays subscribe to the
 * run published under their questId, and the reward ack is stamped per runId.
 */
import { describe, expect, it } from 'vitest';
import {
  markRewardShown,
  publishQuestRun,
  useQuestRunStore,
} from '@/ui/idleVillage/questS1Lab/questRunStore';

describe('questRunStore — published run projection', () => {
  // INV:quest-run-store.INV-1 — publishQuestRun writes the run under its
  // questId (clearing writes null) and markRewardShown stamps the runId whose
  // reward report painted.
  it('publishes the run under questId and stamps the reward ack per runId', () => {
    useQuestRunStore.setState({ runs: {}, bridges: {}, rewardAck: {} });
    const run = { ended: false } as never;
    publishQuestRun('goblin', run);
    expect(useQuestRunStore.getState().runs.goblin).toBe(run);
    markRewardShown('goblin', 'run-42');
    expect(useQuestRunStore.getState().rewardAck.goblin).toBe('run-42');
    publishQuestRun('goblin', null);
    expect(useQuestRunStore.getState().runs.goblin).toBeNull();
    publishQuestRun('goblin', run);
    publishQuestRun('goblin', run);
    expect(useQuestRunStore.getState().runs.goblin).toBe(run);
  });
});
