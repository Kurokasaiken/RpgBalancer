/**
 * Sentinel oracles — shared types and the three-pass orchestrator
 * (PLAN-078 T-002).
 *
 * Pass separation contract:
 *  - Pass 1 (`TemporalPerf`): in-page rAF/perf sampling, ZERO pixel readback —
 *    installed before navigation, sampled during transitions;
 *  - Pass 1b (`TemporalPixel`): isolated replay of the same transition with
 *    pixel readback — never concurrent with Pass-1 sampling;
 *  - Pass 2 (`Geometry` + `DomainText` + `Runtime`): quiescence-gated
 *    at-rest audit, degraded mode when the gate times out.
 *
 * Repeat gate (PLAN-078 §2): a finding promotes to a confirmed defect only
 * when its EXACT `signature` matches across `repeatGate` runs.
 * `signature_family` is a classifier only: same family + divergent exact
 * signatures never auto-ingest — they become observation candidates for
 * Director adjudication (r004 disposition).
 */
import type { HarnessCtx } from '../gameSurfaceHarness';
import type { SentinelConfig, PerturbationKind } from '../sentinelConfig';
import { installTemporalPerfSampler, startTemporalSampling, stopTemporalSampling, evaluateTemporalPerf } from './temporalPerf';
import { captureTemporalSequence, analyzeFrames, evaluateTemporalPixel } from './temporalPixel';
import { auditGeometry } from './geometryOracle';
import { auditDomainText } from './domainTextOracle';
import { auditRuntime } from './runtimeOracle';

/** Perturbation axis an audit ran under (`baseline`/`replay` = unperturbed passes). */
export type AuditPerturbation = PerturbationKind | 'baseline' | 'replay';

export interface OracleFinding {
  /** Oracle that produced the finding (stable id, part of the fingerprint). */
  oracle_id: string;
  /** Exact-match key for the repeat gate. */
  signature: string;
  /** Classifier only — never an ingest key (r004). */
  signature_family?: string;
  title: string;
  /** `defect` = ingest-eligible after the gate; `observation` = digest-only. */
  severity: 'defect' | 'observation';
  state_node: string;
  perturbation_kind: AuditPerturbation;
  /** Semantic (normalized) selector of the element implicated, when known. */
  target?: string;
  /** Sweep cell label (`WxH@DPR/locale`) the finding was observed under. */
  cell?: string;
  /** Oracle-specific payload — numbers, boxes, frame traces. */
  evidence: Record<string, unknown>;
}

export interface StateAudit {
  stateNode: string;
  perturbation: AuditPerturbation;
  findings: OracleFinding[];
  quiesced: boolean;
  /** True when Pass-2 ran on a non-quiesced (degraded) last frame. */
  degraded: boolean;
}

/** Runs Pass-1 + Pass-2 against one state under one perturbation. */
export async function auditState(
  ctx: HarnessCtx,
  cfg: SentinelConfig,
  stateNode: string,
  perturbation: AuditPerturbation,
  { locale = 'en', postGestureAt }: { locale?: string; postGestureAt?: number } = {},
): Promise<StateAudit> {
  /* T-13: on a shared worktree an HMR reload can destroy the execution
   * context mid-audit — the sampler reinstalls on the fresh document via
   * addInitScript, so one retry is honest (the state being audited may be
   * gone, which the caller's own ready-signal will then detect). */
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      await installTemporalPerfSampler(ctx);
      await startTemporalSampling(ctx);
      /* rAF sampling needs a real window — start→stop back-to-back collects
       * ~0 frames and blinds the temporal oracles. */
      await ctx.page.waitForTimeout(cfg.temporalPerf.samplingWindowMs);
      const samples = await stopTemporalSampling(ctx);

      const findings: OracleFinding[] = [
        ...evaluateTemporalPerf(samples, cfg, stateNode, perturbation),
        ...(await auditGeometry(ctx, cfg, stateNode, perturbation, { postGestureAt })),
        ...(await auditDomainText(ctx, cfg, locale, stateNode, perturbation)),
        ...(await auditRuntime(ctx, cfg, stateNode, perturbation)),
      ];

      return {
        stateNode,
        perturbation,
        findings,
        quiesced: !findings.some((f) => f.oracle_id === 'geometry:never-quiesced'),
        degraded: findings.some((f) => f.oracle_id === 'geometry:never-quiesced'),
      };
    } catch (e) {
      if (attempt === 1 || !/execution context|destroyed/i.test(String(e))) throw e;
      await ctx.page.waitForTimeout(800);
    }
  }
  throw new Error('unreachable');
}

/**
 * Pass-1b: replays a state transition in isolation and evaluates pixel
 * findings. Called only when Pass-1 produced a temporal finding worth
 * confirming visually — never concurrent with rAF sampling.
 */
export async function replayPixelPass(
  ctx: HarnessCtx,
  cfg: SentinelConfig,
  stateNode: string,
  { durationMs = 1500, locale = 'en' }: { durationMs?: number; locale?: string } = {},
): Promise<OracleFinding[]> {
  void locale;
  const frames = await captureTemporalSequence(ctx, {
    durationMs,
    intervalMs: cfg.temporalPixel.sampleIntervalMs,
  });
  return evaluateTemporalPixel(analyzeFrames(frames, cfg.temporalPixel), cfg, stateNode, 'replay');
}

/* ---------------------------- repeat gate ---------------------------- */

export interface GatedFinding extends OracleFinding {
  /** Number of runs where the exact signature matched. */
  exactMatches: number;
  /** Runs where only the family matched (divergent exact signatures). */
  familyMatches: number;
  /** Disposition after the gate. */
  gate: 'confirmed' | 'flaky' | 'divergent-observation' | 'rejected';
  /** All distinct exact signatures observed under this family. */
  observedSignatures?: string[];
}

/**
 * Applies the repeat gate to findings collected across N runs of the same
 * (state, perturbation, viewport, locale) cell.
 *
 * Rules:
 *  - exact signature in every run                        → `confirmed`
 *  - exact signature in ≥minExactMatches but not all     → `flaky`
 *    (temporal/pixel), or `rejected` (structural < all runs)
 *  - same family but divergent exact signatures          →
 *    `divergent-observation` (never ingested — Director adjudicates)
 *  - `severity === 'observation'`                        → always digest-only
 */
export function applyRepeatGate(
  runFindings: OracleFinding[][],
  cfg: SentinelConfig['repeatGate'],
): GatedFinding[] {
  const total = runFindings.length;
  const bySig = new Map<string, OracleFinding[]>();
  const byFamily = new Map<string, Set<string>>();

  for (const run of runFindings) {
    for (const f of run) {
      const sig = f.signature;
      bySig.set(sig, [...(bySig.get(sig) ?? []), f]);
      if (f.signature_family) {
        const fam = byFamily.get(f.signature_family) ?? new Set();
        fam.add(f.signature);
        byFamily.set(f.signature_family, fam);
      }
    }
  }

  const gated: GatedFinding[] = [];
  const seen = new Set<string>();

  for (const [sig, instances] of bySig) {
    if (seen.has(sig)) continue;
    seen.add(sig);
    const f = instances[0];
    const isTemporal = Boolean(f.signature_family && f.oracle_id.startsWith('temporal'));
    const isObservation = f.severity === 'observation';

    // r004: family divergence is checked FIRST — if the same family produced
    // ≥2 distinct exact signatures across runs, NOTHING in it auto-ingests,
    // even when one signature alone met the match count.
    const fam = f.signature_family;
    const siblings = fam ? byFamily.get(fam)! : new Set([sig]);
    const familyDivergent = siblings.size > 1;

    let gate: GatedFinding['gate'];
    if (isObservation) {
      gate = 'divergent-observation';
    } else if (familyDivergent) {
      gate = 'divergent-observation';
    } else if (isTemporal) {
      // temporal/pixel: ≥3-of-5 exact matches promote to confirmed
      gate = instances.length >= cfg.temporalPixelMinExactMatches ? 'confirmed' : 'flaky';
    } else {
      // structural: must reproduce in every run
      gate = instances.length >= cfg.structuralRuns ? 'confirmed' : 'rejected';
    }

    gated.push({
      ...f,
      exactMatches: instances.length,
      familyMatches: siblings.size,
      gate,
      observedSignatures: gate === 'divergent-observation' ? [...siblings] : undefined,
    });
  }

  return gated;
}
