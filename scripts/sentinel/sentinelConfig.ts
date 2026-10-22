/**
 * sentinelConfig — Zod-validated configuration for the Quality Sentinel (PLAN-078 T-001).
 *
 * All Sentinel behavior is config-first: thresholds, viewports, locale sweeps,
 * repeat-gate counts, and ingest guards live here (or in `.mw/sentinel/*.json`),
 * never as magic numbers inside oracle code.
 */
import { z } from 'zod';
import fs from 'node:fs';

/** A browser viewport spec for the VP_SWEEP perturbation. */
const viewportSchema = z.object({
  width: z.number().int().positive(),
  height: z.number().int().positive(),
});

/** Perturbation operators the navigator may apply to a state node. */
export const PERTURBATION_KINDS = [
  'VP_SWEEP',
  'LOCALE_SWEEP',
  'LIFECYCLE_INTERRUPT',
  'SOAK_CYCLE',
] as const;
export type PerturbationKind = (typeof PERTURBATION_KINDS)[number];

/** Schema `sentinel-config/1` — the complete Sentinel configuration object. */
export const SentinelConfigSchema = z.object({
  schema: z.literal('sentinel-config/1'),
  /** Quest POI id used for expedition-state navigation. */
  poi: z.string().min(1).default('poi-goblin'),
  /** Dedicated dev-server URL — own port (5198), never 5173/5191 (T-13). */
  baseURL: z.string().default('http://localhost:5198'),
  /** Viewport matrix for VP_SWEEP. Includes ultrawide 3440×1440 (R-225). */
  viewports: z
    .array(viewportSchema)
    .min(1)
    .default([
      { width: 1280, height: 720 },
      { width: 1280, height: 800 },
      { width: 1440, height: 900 },
      { width: 1920, height: 1080 },
      { width: 3440, height: 1440 },
    ]),
  /** Device-pixel-ratio sweep for VP_SWEEP. */
  dpis: z.array(z.number().positive()).default([1, 2]),
  /** Locale sweep for LOCALE_SWEEP — it-IT is the domain-text oracle target. */
  locales: z.array(z.string().min(2)).default(['en', 'it-IT']),
  /** Which perturbation operators are enabled for a run. */
  perturbations: z.array(z.enum(PERTURBATION_KINDS)).default([...PERTURBATION_KINDS]),
  /** SOAK_CYCLE repetitions of WebGL mount/unmount (T-000 texture-pool leak). */
  soakIterations: z.number().int().positive().default(5),

  /** Repeat-gate counts before a finding may be promoted. */
  repeatGate: z
    .object({
      /** Temporal/pixel oracles: N replay runs, need ≥K exact-signature matches. */
      temporalPixelRuns: z.number().int().min(3).default(5),
      temporalPixelMinExactMatches: z.number().int().min(2).default(3),
      /** Structural (DOM/console/geometry) oracles: exact signature in all runs. */
      structuralRuns: z.number().int().min(2).default(2),
      /** Findings below the gate that still get a Playwright trace as candidates. */
      flakeCandidatesKept: z.number().int().min(1).default(5),
      /** Repeats of a divergent observation candidate before escalation (advisory §4). */
      divergentEscalationRuns: z.number().int().min(2).default(3),
    })
    .prefault({}),

  /** Quiescence gate for Pass-2 geometry/domain/runtime audits. */
  quiescence: z
    .object({
      rectDeltaPx: z.number().positive().default(0.5),
      consecutiveTicks: z.number().int().min(2).default(2),
      postGestureDebounceMs: z.number().int().min(0).default(150),
      timeoutMs: z.number().int().positive().default(2000),
    })
    .prefault({}),

  /** Pass-1 TemporalPerf thresholds (zero pixel readback). */
  temporalPerf: z
    .object({
      sampleIntervalMs: z.number().positive().default(16),
      /** Duration of one Pass-1 sampling window — rAF ticks need real time. */
      samplingWindowMs: z.number().int().positive().default(1200),
      longTaskThresholdMs: z.number().positive().default(100),
      minLongTasksFlagged: z.number().int().min(1).default(3),
      frameP95Ms: z.number().positive().default(33),
      titleArtDesyncFrames: z.number().int().min(1).default(2),
      ghostFramePostDragMs: z.number().positive().default(500),
    })
    .prefault({}),

  /** Pass-1b TemporalPixel thresholds (isolated replay, pixel readback allowed). */
  temporalPixel: z
    .object({
      sampleIntervalMs: z.number().positive().default(33),
      blackFrameThresholdMs: z.number().positive().default(300),
      ghostFrameThresholdMs: z.number().positive().default(300),
      darkFraction: z.number().min(0).max(1).default(0.9),
      /** Analysis cell size in px for the frame-diff grid. */
      gridSize: z.number().int().min(4).default(16),
      /** Fraction of a sampled frame treated as the title/heading strip. */
      titleStripFraction: z.number().min(0.05).max(0.5).default(0.18),
    })
    .prefault({}),

  /** Pass-2 geometry thresholds (WCAG AA + plaque-clearance rule). */
  geometry: z
    .object({
      minInteractivePx: z.number().positive().default(32),
      contrastMin: z.number().positive().default(3),
      contrastTextMin: z.number().positive().default(4.5),
      plaqueClearancePx: z.number().positive().default(22),
    })
    .prefault({}),

  /** Ledger-bridge guards. */
  ingest: z
    .object({
      maxPerRun: z.number().int().positive().default(10),
      dryRun: z.boolean().default(true),
      ledgerDir: z.string().default('.mw/ledger'),
      surfaceMapPath: z.string().default('.mw/surface-map.json'),
      contractsDir: z.string().default('.mw/contracts/components'),
      ingestLockFile: z.string().default('.mw/ledger/.ingest.lock'),
      ingestLockStaleMs: z.number().int().positive().default(10 * 60 * 1000),
    })
    .prefault({}),

  /** Night-run lifecycle bounds. */
  nightrun: z
    .object({
      /** 1-min load average above which the viewport matrix shrinks. */
      loadavgMax: z.number().positive().default(12),
      maxDurationMs: z.number().int().positive().default(45 * 60 * 1000),
      heartbeatIntervalMs: z.number().int().positive().default(30_000),
      runIdPrefix: z.string().default('sentinel'),
      registryPath: z.string().default(`${process.env.HOME ?? ''}/.rpg-shutdown/session-registry.json`),
    })
    .prefault({}),

  /** Path of the domain-text allowlist JSON (it-IT legitimate English tokens). */
  domainTextAllowlistPath: z.string().default('.mw/sentinel/domain-text-allow.json'),
});

export type SentinelConfig = z.infer<typeof SentinelConfigSchema>;

/** The default configuration — `SentinelConfigSchema.parse({schema})`. */
export const DEFAULT_SENTINEL_CONFIG: SentinelConfig = SentinelConfigSchema.parse({
  schema: 'sentinel-config/1',
});

/**
 * Loads and validates a Sentinel config from disk, or returns the defaults.
 * Throws with the Zod error when the file exists but fails validation —
 * a misconfigured Sentinel must fail loudly, not silently fall back.
 */
export function loadSentinelConfig(path?: string): SentinelConfig {
  if (!path || !fs.existsSync(path)) return DEFAULT_SENTINEL_CONFIG;
  return SentinelConfigSchema.parse(JSON.parse(fs.readFileSync(path, 'utf8')));
}
