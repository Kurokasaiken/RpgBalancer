import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
// GameFrame is a fresh, not-yet-kitted composition (this task) — the
// `no-restricted-imports` nudge toward `frozen/kits/*` does not apply to it.
// eslint-disable-next-line no-restricted-imports
import { GameFrame, type GameFrameNavItem } from '@/ui/idleVillage/components/gameFrame';
import { WorldSurfaceStandalone } from '@/ui/idleVillage/frozen/kits/worldSurfaceKit';
import { MatericRosterComponent } from '@/ui/idleVillage/roster';
import { QuestCardStandalone, useQuestCardKitData } from '@/ui/idleVillage/frozen/kits/questCardKit';
import { DayNightTimeEngineStrip } from '@/ui/idleVillage/frozen/kits/clockKit';
// No kit exists yet for WorldPresenceRail (born in R-071, still un-kitted) —
// flagged as a follow-up rather than hand-rolling a kit under this task.
// eslint-disable-next-line no-restricted-imports
import { WorldPresenceRail, type WorldPresenceRailItem } from '@/ui/idleVillage/components/WorldPresenceRail';
import { useMinimalGameplayWithIdleVillageConfig } from '@/store/useMinimalGameplay';
import { DEFAULT_GAME_FRAME_CONFIG } from '@/balancing/config/idleVillage/gameFrameConfig';

/**
 * `/game-frame` — GameFrame reference wiring (R-075).
 *
 * Demonstrates the shell with real data where it exists and clearly-labelled
 * fixtures where it does not yet (the goblin-invasion countdown has no real
 * presence system to read from — same caveat `WorldPresenceRail`'s own
 * docblock and the `/primitives` HUD tab already carry).
 *
 * Not wired into `/minimal-gameplay` yet: that page's roster/activity data
 * shapes predate this shell and need their own integration pass — see
 * RICHIESTE.md R-075.
 */
export default function GameFramePage() {
  const { t } = useTranslation('idleVillage');
  const gameplay = useMinimalGameplayWithIdleVillageConfig();

  const [activeNavId, setActiveNavId] = useState('map');
  // Fixture only: no real presence/countdown system exists yet (R-071).
  const [daysLeft] = useState(5);

  const navItems: GameFrameNavItem[] = useMemo(
    () =>
      DEFAULT_GAME_FRAME_CONFIG.navItems.map((item) => ({
        id: item.id,
        icon: item.icon,
        label: t(item.labelKey),
        locked: item.locked,
      })),
    [t],
  );

  const { state } = gameplay;
  const freeHeroes = state.residents.filter((r) => r.isHero && !r.isWorking).length;

  const presenceItems: WorldPresenceRailItem[] =
    daysLeft > 0
      ? [
          {
            id: 'goblin-invasion',
            title: String(t('world.goblinInvasion.invasion')),
            daysLeftValue: daysLeft,
          },
        ]
      : [];

  const questFixture = useQuestCardKitData();

  return (
    <div style={{ width: '100vw', height: '100vh', overflow: 'hidden', background: '#02060a' }}>
      <GameFrame
        title={t('gameFrame.title')}
        navItems={navItems}
        activeNavId={activeNavId}
        onNavSelect={setActiveNavId}
        resources={[
          { id: 'gold', icon: '🪙', label: t('gameFrame.resources.gold'), value: state.gold },
          {
            id: 'food',
            icon: '🍖',
            label: t('gameFrame.resources.food'),
            value: `${state.food}/${state.maxFood}`,
          },
          { id: 'wood', icon: '🪵', label: t('gameFrame.resources.wood'), value: state.wood },
        ]}
        clockSlot={<DayNightTimeEngineStrip compact />}
        rosterSlot={<MatericRosterComponent componentId="game-frame-roster" />}
        questSlot={
          <div style={{ padding: 10 }}>
            <QuestCardStandalone {...questFixture} />
          </div>
        }
        centerTitle={t('gameFrame.center.title')}
        centerSubtitle={t('gameFrame.center.subtitle', { day: state.currentDay })}
        presenceSlot={<WorldPresenceRail items={presenceItems} maxVisible={3} />}
        statusItems={[
          {
            id: 'village-level',
            icon: '🏘',
            content: <span>{t('gameFrame.status.villageLevel')} 1</span>,
          },
          {
            id: 'free-heroes',
            icon: '⚔',
            content: <span>{t('gameFrame.status.freeHeroes', { count: freeHeroes })}</span>,
          },
          {
            id: 'day',
            icon: '🕐',
            content: <span>{t('gameFrame.status.day', { day: state.currentDay })}</span>,
          },
          {
            id: 'next-event',
            content: <span>{t('gameFrame.status.nextEvent')}</span>,
            alignEnd: true,
          },
        ]}
      >
        <WorldSurfaceStandalone showAtmosphere />
      </GameFrame>
    </div>
  );
}
