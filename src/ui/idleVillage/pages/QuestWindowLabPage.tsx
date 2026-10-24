/**
 * QuestWindowLabPage — `QuestRunWindow` isolated, without the /game map
 * (Director 2026-10-08). Same wiring as `game-frame-pixi`: `useQuestRun('goblin')`
 * plus the floating window. There is no game clock here, so the time bar follows
 * resolved phases instead of days.
 * Route: /quest-window-lab
 */

import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { TooltipProvider } from '@radix-ui/react-tooltip';
import { QuestRunWindow } from '@/ui/idleVillage/components/gameFrame/QuestRunWindow';
import { QuestRewardPopup } from '@/ui/idleVillage/components/gameFrame/QuestRewardPopup';
import { QuestOverlays } from '@/ui/idleVillage/components/gameFrame/questOverlays';
import { useQuestRun } from '@/ui/idleVillage/questS1Lab/useQuestRun';
import { GOBLIN_PRESETS } from '@/ui/idleVillage/questS1Lab/questLabPresets';
import { GOBLIN_SCENARIO } from '@/balancing/config/idleVillage/quests/scenarios/goblin';
import { NODE_ART } from '@/ui/idleVillage/questS1Lab/questArt';
import { DEFAULT_GAME_FRAME_CONFIG } from '@/balancing/config/idleVillage/gameFrameConfig';
import { TONE } from '@/ui/idleVillage/questS1Lab/hud/atoms';

export const QuestWindowLabPage: React.FC = () => {
  const { t } = useTranslation('idleVillage');
  const { questWindow } = DEFAULT_GAME_FRAME_CONFIG;
  const questRun = useQuestRun('goblin');
  // `?seed=N` replays the same run: the deterministic surface for the playtest harness (PLAN-025 T-003).
  const seedParam = useMemo(() => {
    const raw = new URLSearchParams(window.location.search).get('seed');
    const n = raw ? Number(raw) : NaN;
    return Number.isFinite(n) ? n >>> 0 : undefined;
  }, []);
  /* PLAN-040 T-000: `?reward=1` mounts the page-level report plaque so the
   * playtest harness can witness the reward phase without /game. */
  const rewardParam = useMemo(() => new URLSearchParams(window.location.search).get('reward') === '1', []);
  /* R-244: `?loadout=flag,flag` packs the bag for the visual check of the
   * belt rows (e.g. `?loadout=hasBonusPerc,hasHealing,hasGuardianBanner`). */
  const loadoutParam = useMemo(() => {
    const raw = new URLSearchParams(window.location.search).get('loadout');
    return raw ? raw.split(',').map((s) => s.trim()).filter(Boolean) : undefined;
  }, []);
  const [rewardDismissed, setRewardDismissed] = useState(false);
  // No game clock here: a local tick every second drives the v27 frontier —
  // a maturable node breathes for LAB_NODE_TICKS seconds before resolving.
  // PLAN-040 T-000: the tick lives in STATE, not a ref — `nowTick` must reach
  // the window on every second or a 'waiting' frontier stays visually locked
  // forever (syncClock alone does not re-render when nothing matures).
  const LAB_NODE_TICKS = 3;
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const id = window.setInterval(() => {
      setTick((t) => {
        const next = t + 1;
        questRun.syncClock(next);
        return next;
      });
    }, 1000);
    return () => window.clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [questRun.syncClock]);
  const time = useMemo(
    () => ({
      progress: questRun.run?.ended ? 1 : Math.min(1, questRun.phases.length / GOBLIN_SCENARIO.beats.length),
      label: questRun.run?.ended
        ? t(questRun.run.outcome === 'wipe' ? 'gameFrame.questWindow.noneReturned' : 'gameFrame.questWindow.returned')
        : t('gameFrame.questWindow.ticks', { elapsed: Math.max(0, tick - (questRun.run?.launchedAtTick ?? tick)), total: GOBLIN_SCENARIO.beats.length * LAB_NODE_TICKS }),
    }),
    [questRun.run?.ended, questRun.run?.outcome, questRun.run?.launchedAtTick, questRun.phases.length, tick, t],
  );
  return (
    <TooltipProvider>
      <div style={{ minHeight: '100vh', background: '#14100c', padding: 24 }}>
        {!questRun.run && (
        <button
          type="button"
          onClick={() => questRun.start(GOBLIN_PRESETS[0].id, { loadout: loadoutParam, seed: seedParam, nodeTicks: LAB_NODE_TICKS, startTick: tick })}
          style={{ fontFamily: 'var(--skin-font-display, serif)', fontSize: 15, color: TONE.text, border: `1px solid ${TONE.muted}`, borderRadius: 6, padding: '8px 16px', background: 'transparent', cursor: 'pointer' }}
        >
          {t('gameFrame.director.questRun')}
        </button>
      )}
      {questRun.run && (
        <QuestRunWindow
          run={questRun.run}
          phases={questRun.phases}
          beats={GOBLIN_SCENARIO.beats}
          queuedBeats={questRun.beats}
          beatTiming={questWindow.beats}
          title={GOBLIN_SCENARIO.title}
          flavour={GOBLIN_SCENARIO.flavour}
          scenario={GOBLIN_SCENARIO}
          artFor={(nodeId) => NODE_ART[nodeId]?.src}
          time={time}
          onChoose={(optionId) => questRun.choose(optionId)}
          nowTick={tick}
          onAbandon={questRun.abandon}
          armedFlags={questRun.armedFlags}
          onToggleArmedFlag={questRun.toggleArmedFlag}
          onRevealFlag={questRun.revealFlag}
          onClose={questRun.clear}
          anchor={{ left: 320, top: 60 }}
            widthPx={questWindow.widthPx}
            theaterAspect={questWindow.theaterAspect}
            tooltipLines={questWindow.tooltipLines}
            companions={{ widthPx: questWindow.sidePanelWidthPx, gapPx: questWindow.sidePanelGapPx, minWidthPx: questWindow.minSidePanelWidthPx, edgeInsetPx: questWindow.edgeInsetPx }}
          />
        )}
        {/* PLAN-040 T-003a: the same overlay host /game mounts — the skill
            check paints in `#game-modal-root` in the lab exactly as in
            production (debate r007: shared surface, shared behaviour). */}
        <QuestOverlays questId="goblin" onDismissOutcome={questRun.dismissOutcome} />
        {rewardParam && questRun.run?.ended && !rewardDismissed && (
          <QuestRewardPopup
            run={questRun.run}
            scenario={GOBLIN_SCENARIO}
            widthPx={questWindow.rewardPopup.widthPx}
            stageMs={questWindow.rewardPopup.stageMs}
            onClose={() => setRewardDismissed(true)}
          />
        )}
      </div>
    </TooltipProvider>
  );
};

export default QuestWindowLabPage;
