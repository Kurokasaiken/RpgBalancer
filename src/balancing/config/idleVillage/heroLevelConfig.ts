/**
 * Hero level-up staging configuration (PLAN-032 SP-5, artifact r009).
 *
 * Presentation-only mock: `levels` is the number shown by the decorative
 * badge/ring/floater, `staging.targets` is the resident-id list the Director
 * "Level up" command applies to. There is no XP, no progression, no
 * persistence — PROGRESSION.md owns the real system when it lands.
 *
 * Two-layer validation with explicitly different timing:
 * - Zod at module load covers shape + constraints only. Dev throws (an
 *   authoring bug must surface loudly); prod never bricks the build —
 *   `parseHeroLevelConfig` runs a deterministic FIELD-LEVEL salvage where
 *   every malformed input has exactly one defined outcome.
 * - The roster cross-check (each target exists and `isHero`) runs at
 *   COMMAND time in `runHeroLevelUpStaging`, uniform in both builds.
 *
 * The parse result is a wrapper `{ config, configInvalid }`: the marker
 * lives OUTSIDE the config object so a filtered config can never masquerade
 * as a legitimately valid one.
 */

import { z } from 'zod';

/** Schema defaults — also the salvage values for absent-but-valid `fx` fields. */
export const HERO_LEVEL_FX_DEFAULTS = { ringMs: 1400, floaterMs: 1800 } as const;

/** Zod schema: shape + constraints only (absent `fx` fields take defaults and are NOT invalid). */
export const heroLevelConfigSchema = z
  .object({
    levels: z.record(z.string(), z.number().int().min(1)),
    fx: z
      .object({
        ringMs: z.number().positive().default(HERO_LEVEL_FX_DEFAULTS.ringMs),
        floaterMs: z.number().positive().default(HERO_LEVEL_FX_DEFAULTS.floaterMs),
      })
      .strict()
      .default({ ringMs: HERO_LEVEL_FX_DEFAULTS.ringMs, floaterMs: HERO_LEVEL_FX_DEFAULTS.floaterMs }),
    staging: z
      .object({
        targets: z.array(z.string().min(1)),
      })
      .strict(),
  })
  .strict();

export type HeroLevelConfig = z.infer<typeof heroLevelConfigSchema>;

/** Parse result — `configInvalid` is true whenever ANY entry was dropped/coerced OR `config === null`. */
export interface HeroLevelConfigParseResult {
  config: HeroLevelConfig | null;
  configInvalid: boolean;
}

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const report = (path: string, value: unknown): void => {
  console.error(`[heroLevelConfig] dropped invalid config entry "${path}":`, value);
};

/**
 * Deterministic field-level salvage (artifact r009). Total: every malformed
 * input has exactly one defined outcome.
 * - `levels` must be a plain object; entries that are not `int >= 1` are
 *   dropped per-key (no coercion). Not a plain object → unsalvageable →
 *   `config = null`.
 * - `staging` is a REQUIRED parent: absent/null → `{ targets: [] }` +
 *   invalid. Not an object → `{ targets: [] }` + invalid. `targets` not an
 *   array → `[]` + invalid; non-string/empty entries dropped per-index.
 * - `fx.ringMs`/`fx.floaterMs`: present-and-valid kept; present-but-invalid
 *   → default + invalid; absent → default, NOT invalid; `fx` not an object
 *   → both defaults + invalid.
 * - Unknown keys at any level → stripped + invalid.
 * - Every drop logs `console.error` with the rejected entries.
 */
export function parseHeroLevelConfig(raw: unknown): HeroLevelConfigParseResult {
  const strict = heroLevelConfigSchema.safeParse(raw);
  if (strict.success) {
    return { config: strict.data, configInvalid: false };
  }

  let invalid = false;
  const root = isPlainObject(raw) ? raw : {};

  for (const key of Object.keys(root)) {
    if (key !== 'levels' && key !== 'fx' && key !== 'staging') {
      invalid = true;
      report(key, root[key]);
    }
  }

  const levels: Record<string, number> = {};
  if (isPlainObject(root.levels)) {
    for (const [residentId, level] of Object.entries(root.levels)) {
      if (typeof level === 'number' && Number.isInteger(level) && level >= 1) {
        levels[residentId] = level;
      } else {
        invalid = true;
        report(`levels.${residentId}`, level);
      }
    }
  } else {
    // `levels` itself not a plain object → unsalvageable → config = null.
    report('levels', root.levels);
    return { config: null, configInvalid: true };
  }

  const fx = { ringMs: HERO_LEVEL_FX_DEFAULTS.ringMs, floaterMs: HERO_LEVEL_FX_DEFAULTS.floaterMs };
  if (root.fx !== undefined) {
    if (!isPlainObject(root.fx)) {
      invalid = true;
      report('fx', root.fx);
    } else {
      for (const key of Object.keys(root.fx)) {
        if (key !== 'ringMs' && key !== 'floaterMs') {
          invalid = true;
          report(`fx.${key}`, root.fx[key]);
        }
      }
      const ringMs = root.fx.ringMs;
      if (ringMs !== undefined) {
        if (typeof ringMs === 'number' && ringMs > 0) fx.ringMs = ringMs;
        else {
          invalid = true;
          report('fx.ringMs', ringMs);
        }
      }
      const floaterMs = root.fx.floaterMs;
      if (floaterMs !== undefined) {
        if (typeof floaterMs === 'number' && floaterMs > 0) fx.floaterMs = floaterMs;
        else {
          invalid = true;
          report('fx.floaterMs', floaterMs);
        }
      }
    }
  }

  const targets: string[] = [];
  const stagingRaw = root.staging;
  if (stagingRaw === undefined || stagingRaw === null || !isPlainObject(stagingRaw)) {
    invalid = true;
    if (stagingRaw !== undefined && stagingRaw !== null) report('staging', stagingRaw);
  } else {
    for (const key of Object.keys(stagingRaw)) {
      if (key !== 'targets') {
        invalid = true;
        report(`staging.${key}`, stagingRaw[key]);
      }
    }
    const targetsRaw = stagingRaw.targets;
    if (Array.isArray(targetsRaw)) {
      targetsRaw.forEach((entry, index) => {
        if (typeof entry === 'string' && entry.length > 0) {
          targets.push(entry);
        } else {
          invalid = true;
          report(`staging.targets[${index}]`, entry);
        }
      });
    } else {
      invalid = true;
      if (targetsRaw !== undefined) report('staging.targets', targetsRaw);
    }
  }

  return { config: { levels, fx, staging: { targets } }, configInvalid: invalid };
}

/**
 * Authored teaser values. `staging.targets` lists the three seeded heroes;
 * `levels` is the mock number shown on badge/ring/floater — presentation
 * only, unrelated to any ResidentState field.
 */
const RAW_HERO_LEVEL_CONFIG = {
  levels: {
    'hero-sir-spaccaculi': 3,
    'hero-salvatrice': 5,
    'hero-giggiolillo': 4,
  },
  fx: { ringMs: 1400, floaterMs: 1800 },
  staging: {
    targets: ['hero-sir-spaccaculi', 'hero-salvatrice', 'hero-giggiolillo'],
  },
};

/**
 * Module-load validation. Dev throws on a malformed shape (authoring bug);
 * prod runs the defined salvage so a bad config can never brick the build
 * at import time — it only ever marks the staging command as rejected.
 */
/* `import.meta.env` is absent outside Vite (tsx, bare node): the strict throw
 * is the safe default — only a real production bundle takes the salvage path. */
const viteEnv = (import.meta as { env?: { PROD?: boolean } }).env;
const loaded: HeroLevelConfigParseResult = viteEnv?.PROD === true
  ? parseHeroLevelConfig(RAW_HERO_LEVEL_CONFIG)
  : { config: heroLevelConfigSchema.parse(RAW_HERO_LEVEL_CONFIG), configInvalid: false };

/** Salvaged (prod) or strictly parsed (dev) config; `null` only when `levels` was unsalvageable. */
export const HERO_LEVEL_CONFIG = loaded.config;

/** True when the prod salvage dropped/coerced anything — the staging command must reject. */
export const HERO_LEVEL_CONFIG_INVALID = loaded.configInvalid;
