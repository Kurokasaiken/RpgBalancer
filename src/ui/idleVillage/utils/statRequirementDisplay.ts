/**
 * statRequirementDisplay — turns an activity `StatRequirement` (from the Idle
 * Village *activities* config) into a variable list of display rows, resolving
 * each stat's **name, icon and color from the Balancer stat catalog**.
 *
 * Source of truth:
 * - WHICH stats / how many        → the activity's `statRequirement`
 *   (`allOf` / `anyOf` / `noneOf`), authored in the Idle Village config.
 * - Name / icon / color per stat  → the Balancer page stat catalog
 *   (`StatDefinition`), persisted in the browser under `rpg_balancer_config`
 *   (falls back to the bundled `balancer-default-config.json`).
 *
 * When a requirement references a stat that isn't in the catalog (e.g. a fresh
 * environment without a saved Balancer config), the id is prettified as a label
 * and neutral icon/color are used, so the panel always renders something sane.
 */
import BALANCER_DEFAULT_JSON from '@/balancing/config/balancer-default-config.json';
import type { StatRequirement } from '@/balancing/config/idleVillage/types';

/** Storage key used by the Balancer config (PersistenceService → localStorage on web). */
const BALANCER_STORAGE_KEY = 'rpg_balancer_config';

/** Subset of the Balancer `StatDefinition` we need for display. */
interface BalancerStatDef {
  id?: string;
  label?: string;
  icon?: string;
  bgColor?: string;
}

/** How a stat relates to the requirement. */
export type StatRequirementRelation = 'all' | 'any' | 'none';

/** One rendered requirement row. */
export interface StatRequirementRow {
  /** Stable react key. */
  key: string;
  /** Raw stat id from the requirement. */
  statId: string;
  /** Display name (from the Balancer catalog, or prettified id). */
  label: string;
  /** Icon token from the Balancer catalog (lucide id or emoji), if any. */
  icon?: string;
  /** Color token from the Balancer catalog (`bgColor`: tailwind class or hex), if any. */
  bgColor?: string;
  /** all = mandatory · any = one-of group · none = forbidden. */
  relation: StatRequirementRelation;
  /** Numeric threshold, when the requirement is a `{ stat, operator, value }`. */
  numeric?: { operator: string; value: number };
}

let cachedCatalog: Record<string, BalancerStatDef> | null = null;

/** Reads the Balancer stat catalog synchronously (localStorage → bundled default). */
function readCatalog(): Record<string, BalancerStatDef> {
  if (cachedCatalog) return cachedCatalog;
  let stats: Record<string, BalancerStatDef> = {};
  try {
    if (typeof localStorage !== 'undefined') {
      const raw = localStorage.getItem(BALANCER_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as { stats?: Record<string, BalancerStatDef> };
        if (parsed?.stats) stats = parsed.stats;
      }
    }
  } catch {
    // ignore malformed storage — fall back to the bundled default below
  }
  if (Object.keys(stats).length === 0) {
    stats = (BALANCER_DEFAULT_JSON as { stats?: Record<string, BalancerStatDef> }).stats ?? {};
  }
  cachedCatalog = stats;
  return stats;
}

/** Force a re-read of the catalog (call after the Balancer page saves changes). */
export function invalidateBalancerStatCatalog(): void {
  cachedCatalog = null;
}

/** "elite_hunter" / "elite-hunter" → "Elite Hunter". */
const prettify = (id: string): string =>
  id.replace(/[_-]+/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

function resolveStat(statId: string): Pick<StatRequirementRow, 'label' | 'icon' | 'bgColor'> {
  const def = readCatalog()[statId];
  return {
    label: def?.label ?? prettify(statId),
    icon: def?.icon,
    bgColor: def?.bgColor,
  };
}

/**
 * Builds the ordered, variable-length list of requirement rows for a
 * `StatRequirement`. `allOf` first (mandatory), then `anyOf` (one-of), then
 * `noneOf` (forbidden). Numeric thresholds keep their operator/value.
 */
export function buildStatRequirementRows(requirement?: StatRequirement): StatRequirementRow[] {
  if (!requirement) return [];
  const rows: StatRequirementRow[] = [];

  const push = (
    statId: string,
    relation: StatRequirementRelation,
    numeric?: { operator: string; value: number },
  ) => {
    const resolved = resolveStat(statId);
    rows.push({
      key: `${relation}:${statId}:${numeric?.value ?? ''}`,
      statId,
      relation,
      numeric,
      ...resolved,
    });
  };

  (requirement.allOf ?? []).forEach((item) => {
    if (typeof item === 'string') push(item, 'all');
    else push(item.stat, 'all', { operator: item.operator, value: item.value });
  });
  (requirement.anyOf ?? []).forEach((tag) => push(tag, 'any'));
  (requirement.noneOf ?? []).forEach((tag) => push(tag, 'none'));

  return rows;
}
