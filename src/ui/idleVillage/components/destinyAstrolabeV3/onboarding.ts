/**
 * onboarding.ts — onboarding contestuale (piano §5): micro-tooltip alle prime
 * N aperture, poi mai più. Persistito via PersistenceService.
 */
import { saveData, loadData } from '@/shared/persistence/PersistenceService';
import { astrolabeV3Config } from '@/balancing/config/idleVillage/destinyAstrolabeV3/astrolabeV3Config';

const KEY = 'destinyAstrolabeV3.onboardingViews';

export async function shouldShowOnboarding(): Promise<boolean> {
  try {
    const views = await loadData<number>(KEY, 0);
    return views < astrolabeV3Config.onboardingMaxViews;
  } catch {
    return false;
  }
}

export async function recordOnboardingView(): Promise<void> {
  try {
    const views = await loadData<number>(KEY, 0);
    await saveData(KEY, views + 1);
  } catch {
    /* la persistenza non deve mai bloccare il gioco */
  }
}
