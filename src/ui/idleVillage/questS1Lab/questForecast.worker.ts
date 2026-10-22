/**
 * questForecast.worker — off-thread Monte Carlo forecast (R-265).
 *
 * The planning surface recomputes the forecast on every party edit. 400 runs
 * ≈ ~5 s of CPU measured on the goblin scenario — chunked or not, that work
 * on the main thread is what made click-assign stutter (every sim slice
 * competed with the flight animation and click handling). Running the SAME
 * `simulateQuest` in a dedicated worker keeps inputs→outputs bit-identical
 * (same seeds, same accumulation order) while costing the page 0 ms.
 *
 * Two pieces of module state must ride along because a worker boots with a
 * fresh module graph: the ScenarioInstance registry (`nodesFor` falls back to
 * the authored map without it — a WRONG quest on /game) and the authored-prose
 * content locale (declared seam of `questContentLocale`: workers stay English
 * unless they opt in).
 */
import { registerScenarioInstance, type QuestRunState, type ScenarioInstance } from './questRun';
import { simulateQuest, type QuestSimResult, type SimStrategy } from './questSimulation';
import { setQuestContentLocale } from '@/balancing/config/idleVillage/quests/questContentLocale';

export interface QuestForecastWorkerRequest {
  state: QuestRunState;
  strategy: SimStrategy;
  runs: number;
  seed?: number;
  /** The run's ScenarioInstance — registered here so `nodesFor(state)`
   *  resolves the same node map the main thread would. */
  instance?: ScenarioInstance;
  /** Active authored-prose locale on the main thread (en | it-IT …). */
  locale?: string;
}

export interface QuestForecastWorkerResponse {
  sim: QuestSimResult;
  /** Wall-clock ms the Monte Carlo took on the worker thread. */
  workMs: number;
}

const ctx = self as unknown as {
  onmessage: ((event: MessageEvent<QuestForecastWorkerRequest>) => void) | null;
  postMessage: (message: QuestForecastWorkerResponse) => void;
};

ctx.onmessage = (event) => {
  const { state, strategy, runs, seed, instance, locale } = event.data;
  if (locale) setQuestContentLocale(locale);
  if (instance) registerScenarioInstance(instance);
  const startedAt = performance.now();
  const sim = simulateQuest(state, strategy, { runs, seed });
  ctx.postMessage({ sim, workMs: performance.now() - startedAt });
};
