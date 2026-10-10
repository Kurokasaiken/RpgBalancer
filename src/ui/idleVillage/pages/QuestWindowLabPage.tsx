/**
 * QuestWindowLabPage — `QuestRunWindow` isolated, without the /game map
 * (Director 2026-10-08). Same wiring as `game-frame-pixi`: `useQuestRun('goblin')`
 * plus the floating window. There is no game clock here, so the time bar follows
 * resolved phases instead of days.
 * Route: /quest-window-lab
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { TooltipProvider } from '@radix-ui/react-tooltip';
import { QuestRunWindow } from '@/ui/idleVillage/components/gameFrame/QuestRunWindow';
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
  const [armed, setArmed] = useState(questWindow.consumablesArmedByDefault);
  // `?seed=N` replays the same run: the deterministic surface for the playtest harness (PLAN-025 T-003).
  const seedParam = useMemo(() => {
    const raw = new URLSearchParams(window.location.search).get('seed');
    const n = raw ? Number(raw) : NaN;
    return Number.isFinite(n) ? n >>> 0 : undefined;
  }, []);
  // No game clock here: a local tick every second drives the v27 frontier —
  // a maturable node breathes for LAB_NODE_TICKS seconds before resolving.
  const LAB_NODE_TICKS = 3;
  const tickRef = useRef(0);
  useEffect(() => {
    const id = window.setInterval(() => {
      tickRef.current += 1;
      questRun.syncClock(tickRef.current);
    }, 1000);
    return () => window.clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [questRun.syncClock]);
  const time = useMemo(
    () => ({
      progress: questRun.run?.ended ? 1 : Math.min(1, questRun.phases.length / GOBLIN_SCENARIO.beats.length),
      label: questRun.run?.ended
        ? t(questRun.run.outcome === 'wipe' ? 'gameFrame.questWindow.noneReturned' : 'gameFrame.questWindow.returned')
        : t('gameFrame.questWindow.phaseOf', { n: Math.min(GOBLIN_SCENARIO.beats.length, questRun.phases.length + 1), total: GOBLIN_SCENARIO.beats.length }),
    }),
    [questRun.run?.ended, questRun.run?.outcome, questRun.phases.length, t],
  );
  return (
    <TooltipProvider>
      <div style={{ minHeight: '100vh', background: '#14100c', padding: 24 }}>
        {!questRun.run && (
        <button
          type="button"
          onClick={() => questRun.start(GOBLIN_PRESETS[0].id, { seed: seedParam, nodeTicks: LAB_NODE_TICKS, startTick: tickRef.current })}
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
          onChoose={(optionId) => questRun.choose(optionId, { useConsumable: armed })}
          armed={armed}
          onToggleArmed={() => setArmed((on) => !on)}
          onUseHealing={questRun.useHealing}
          onDrinkPotion={questRun.drinkPotion}
          onClose={questRun.clear}
          anchor={{ left: 60, top: 60 }}
            widthPx={questWindow.widthPx}
            theaterAspect={questWindow.theaterAspect}
            tooltipLines={questWindow.tooltipLines}
          />
        )}
      </div>
    </TooltipProvider>
  );
};

export default QuestWindowLabPage;
