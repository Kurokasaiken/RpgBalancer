/**
 * questContentLocale — localisation of AUTHORED quest prose (PLAN-067 T-A13, R-234).
 *
 * The scenarios (`scenarios/goblin.ts`, `rovine.ts`) hold English prose in the config itself:
 * node titles and bodies, verdict flavours, slot roles, intel. The UI used to show it as-is in
 * every language («in italiano la preview mescola le lingue», audit F5 §3).
 *
 * An overlay is a map `scenario path → [english source, translation]`. The engine copies node text
 * into its records (check titles, verdict flavour) straight from `nodesFor`, so the overlay is
 * applied THERE and on the scenario the UI reads (`scenarioForQuest`) — one rule, not one patch per
 * component. Three guarantees:
 *   - the base scenario is never mutated and never re-hashed (offers keep resolving on English);
 *   - an entry whose English source no longer matches the manuscript is IGNORED: English shows,
 *     a stale translation never reaches the player;
 *   - `untranslatedPaths` / `staleOverlayPaths` let a test name every string that needs work.
 *
 * The active locale is module state set by the app (`setQuestContentLocale`, wired to i18n):
 * workers and tests stay English unless they opt in.
 */

import type { QuestId } from '@/ui/idleVillage/questS1Lab/questRun';
import { GOBLIN_IT } from './scenarios/goblin.it-IT';
import { ROVINE_IT } from './scenarios/rovine.it-IT';

/** `scenario path → [english source, translation]`. */
export type ContentOverlay = Readonly<Record<string, readonly [string, string]>>;

const OVERLAYS: Readonly<Record<string, Partial<Record<QuestId, ContentOverlay>>>> = {
  'it-IT': { goblin: GOBLIN_IT, rovine: ROVINE_IT },
};

/** Locales that have a content overlay (for the completeness test). */
export const CONTENT_LOCALES = Object.keys(OVERLAYS);

/* ---- active locale ---------------------------------------------------- */

let activeLocale = 'en';

/** `it`, `it-IT`, `it_IT` → `it-IT`; anything without an overlay → `en`. */
export function resolveContentLocale(lang: string | undefined | null): string {
  const l = String(lang ?? '').toLowerCase().replace('_', '-');
  const hit = CONTENT_LOCALES.find((c) => c.toLowerCase() === l || c.toLowerCase().split('-')[0] === l.split('-')[0]);
  return hit ?? 'en';
}

export const setQuestContentLocale = (lang: string | undefined | null): void => {
  activeLocale = resolveContentLocale(lang);
};
export const getQuestContentLocale = (): string => activeLocale;

/* ---- the translatable strings ---------------------------------------- */

/** Keys whose string values are structure (ids, enums, routing), never prose. */
const STRUCTURAL_KEYS = new Set([
  'id', 'kind', 'next', 'anyOf', 'stats', 'statFocus', 'primaryStats', 'attackStats', 'primary', 'secondary',
  'requiresOutcome', 'tags', 'scenarioVersion', 'startNode', 'dangerBandRef', 'coverArt', 'sets', 'requiresFlag',
  'consumesFlag', 'grantsInfo', 'nextCleared', 'nextSurvivors', 'fase',
]);
/** Proper names stay as authored. */
const NAME_PATHS = /(^|\.)referenceParty\[/;
const ID_LIKE = /^[a-z0-9_:\-/.]+$/;

const join = (path: string, key: string) => (path ? `${path}.${key}` : key);

/** Every translatable string of a scenario (or node map), keyed by path. */
export function collectTranslatable(source: unknown): Record<string, string> {
  const out: Record<string, string> = {};
  const walk = (value: unknown, path: string, key: string): void => {
    if (typeof value === 'string') {
      if (STRUCTURAL_KEYS.has(key) || NAME_PATHS.test(path) || !value.trim() || ID_LIKE.test(value)) return;
      out[path] = value;
    } else if (Array.isArray(value)) {
      value.forEach((v, i) => walk(v, `${path}[${i}]`, key));
    } else if (value && typeof value === 'object') {
      for (const [k, v] of Object.entries(value)) walk(v, join(path, k), k);
    }
  };
  walk(source, '', '');
  return out;
}

/* ---- application ------------------------------------------------------ */

/** Deep copy of `value` with every string leaf whose path has a MATCHING overlay entry replaced. */
export function applyContentOverlay<T>(value: T, overlay: ContentOverlay | undefined, prefix = ''): T {
  if (!overlay) return value;
  const walk = (v: unknown, path: string): unknown => {
    if (typeof v === 'string') {
      const hit = overlay[path];
      return hit && hit[0] === v ? hit[1] : v;
    }
    if (Array.isArray(v)) return v.map((x, i) => walk(x, `${path}[${i}]`));
    if (v && typeof v === 'object') {
      return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, walk(x, join(path, k))]));
    }
    return v;
  };
  return walk(value, prefix) as T;
}

const overlayFor = (questId: QuestId, locale: string) => OVERLAYS[locale]?.[questId];

const cache = new WeakMap<object, Map<string, unknown>>();
const memo = <T extends object>(source: T, key: string, build: () => T): T => {
  let perSource = cache.get(source);
  if (!perSource) cache.set(source, (perSource = new Map()));
  if (!perSource.has(key)) perSource.set(key, build());
  return perSource.get(key) as T;
};

/** The scenario as the player should read it. English (or no overlay) returns the SAME object. */
export function localizeScenario<T extends object>(scenario: T, questId: QuestId, locale = activeLocale): T {
  const overlay = overlayFor(questId, locale);
  if (!overlay) return scenario;
  return memo(scenario, `${questId}:${locale}`, () => applyContentOverlay(scenario, overlay));
}

/** A node map (`nodes.*` paths) as the player should read it — what `nodesFor` hands the engine. */
export function localizeNodes<T extends object>(nodes: T, questId: QuestId, locale = activeLocale): T {
  const overlay = overlayFor(questId, locale);
  if (!overlay) return nodes;
  return memo(nodes, `${questId}:${locale}`, () => applyContentOverlay(nodes, overlay, 'nodes') as T);
}

/* ---- completeness (used by the test) --------------------------------- */

/** Translatable strings of the scenario with no overlay entry at all. */
export function untranslatedPaths(scenario: object, overlay: ContentOverlay): string[] {
  return Object.keys(collectTranslatable(scenario)).filter((p) => !(p in overlay));
}

/** Overlay entries whose path is gone or whose English source no longer matches the manuscript. */
export function staleOverlayPaths(scenario: object, overlay: ContentOverlay): string[] {
  const live = collectTranslatable(scenario);
  return Object.keys(overlay).filter((p) => live[p] !== overlay[p][0]);
}

export const CONTENT_OVERLAYS = OVERLAYS;
