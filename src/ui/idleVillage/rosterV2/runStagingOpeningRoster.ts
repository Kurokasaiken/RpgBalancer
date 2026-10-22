/**
 * runStagingOpeningRoster — the Director «Level up» never fails silently (PLAN-067 T-C1, R-234).
 *
 * The staging command rejects when no hero card is mounted (roster closed): that used to be a silent
 * no-op. Now a rejected first try opens the roster and retries on a short interval until a card mounts
 * (or the tries run out). `setInterval`, not rAF: rAF does not tick on a hidden pane.
 */
import type { HeroLevelUpStagingResult } from './runHeroLevelUpStaging';

export interface RunStagingOpeningRosterDeps {
  run: () => HeroLevelUpStagingResult;
  openRoster: () => void;
  intervalMs?: number;
  maxTries?: number;
}

export function runStagingOpeningRoster({ run, openRoster, intervalMs = 120, maxTries = 15 }: RunStagingOpeningRosterDeps): void {
  if (run().accepted) return;
  openRoster();
  let tries = 0;
  const id = setInterval(() => {
    tries += 1;
    if (run().accepted || tries >= maxTries) clearInterval(id);
  }, intervalMs);
}
