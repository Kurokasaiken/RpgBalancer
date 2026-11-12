/**
 * placeOrdering — anello interno/esterno del ventaglio di un Luogo
 * (PLAN-117 rev. 5, T0.2; decisione 2026-11-11 «due anelli, interno =
 * urgenza»).
 *
 * Contratto (OB-1):
 * - **inner** = attività urgenti: `expiring`/`expired` (offerta che scade) o
 *   `done` (sigillo da archiviare — il ventaglio le mostra prima di
 *   chiudere). Dentro l'anello l'ordine è per urgenza: `expired` →
 *   `expiring` per progress crescente (meno tempo rimasto prima) → `done`.
 * - **outer** = tutto il resto, nell'ordine di input; l'overflow dell'anello
 *   interno si riversa in coda all'esterno.
 * - Ordine stabile: a parità di classifica vince l'indice di input — stessa
 *   vista, stesso ordine, sempre.
 * - Capienza da config (`PLACES_CONFIG.fan`), mai letterale.
 */
import type { MapQuestPoiView } from './MapQuestPoi';
import { PLACES_CONFIG } from '@/balancing/config/idleVillage/placesConfig';

export interface PlaceOrderingInput {
  id: string;
}

export interface PlaceOrderingResult<T> {
  inner: T[];
  outer: T[];
}

/** Lower rank = closer to the place marker (inner ring start). */
function urgencyRank(view: MapQuestPoiView | undefined): number | null {
  if (!view) return null;
  if (view.state === 'expired') return 0;
  if (view.state === 'expiring' || view.deadlineWarn) return 1;
  if (view.done) return 2;
  return null;
}

export function orderPlaceActivities<T extends PlaceOrderingInput>(
  activities: readonly T[],
  views: Readonly<Record<string, MapQuestPoiView>>,
  options?: { innerCapacity?: number },
): PlaceOrderingResult<T> {
  const innerCapacity = options?.innerCapacity ?? PLACES_CONFIG.fan.innerRingCapacity;

  const urgent = activities
    .map((activity, index) => ({ activity, index, view: views[activity.id], rank: urgencyRank(views[activity.id]) }))
    .filter((e): e is typeof e & { rank: number } => e.rank !== null)
    .sort((a, b) => a.rank - b.rank || (a.view?.progress ?? 0) - (b.view?.progress ?? 0) || a.index - b.index);

  const urgentIds = new Set(urgent.map((e) => e.activity.id));
  const rest = activities.filter((a) => !urgentIds.has(a.id));

  return {
    inner: urgent.slice(0, innerCapacity).map((e) => e.activity),
    outer: [...rest, ...urgent.slice(innerCapacity).map((e) => e.activity)],
  };
}
