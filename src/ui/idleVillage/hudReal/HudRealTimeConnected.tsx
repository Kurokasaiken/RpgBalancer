/**
 * HudRealTimeConnected — binds HudRealTime to the real game state (PLAN-112 F4.1). Read-only on the store plus the SAME two actions the game
 * page uses (`setSpeedMultiplier`, `pauseGame`/`resumeGame` with source 'user'). Mechanics are not changed; no keys are bound here.
 * `locked` mirrors `timeInputLocked` of the game page (quest window and menus): the caller passes it, as the page does.
 */
import { useTranslation } from 'react-i18next';
import { useMinimalGameplayWithIdleVillageConfig } from '@/store/useMinimalGameplay';
import { HudRealTime } from './HudRealTime';

export function HudRealTimeConnected({ locked = false }: { locked?: boolean }) {
  const { t } = useTranslation('idleVillage');
  const gameplay = useMinimalGameplayWithIdleVillageConfig();
  const { state, config } = gameplay;
  const available = [1, 2, 4, 8].filter((s) => s <= config.loop.maxSpeedMultiplier);
  const onChange = (s: number) => { if (locked) return; gameplay.setSpeedMultiplier(s); if (state.isPaused) gameplay.resumeGame('user'); };
  const onTogglePause = () => { if (locked) return; if (state.isPaused) gameplay.resumeGame('user'); else gameplay.pauseGame('user'); };
  return (
    <HudRealTime
      dayLabel={`${t('gameFrame.status.dayLabel')} ${state.currentDay + 1}`}
      isDayPhase={state.isDayPhase}
      cycleProgress={state.cycleProgress}
      isPaused={state.isPaused}
      locked={locked}
      speed={{ multiplier: state.speedMultiplier, available, onChange, onTogglePause }}
      labels={{
        pause: t('gameFrame.speed.pause'), resume: t('gameFrame.speed.resume'), speedGroup: t('gameFrame.speed.ariaLabel'),
        speed: (s) => `${t('gameFrame.speed.ariaLabel')} ×${s}`, spaceKey: t('gameFrame.speed.spaceKey'), paused: t('gameFrame.speed.paused'),
      }}
    />
  );
}
