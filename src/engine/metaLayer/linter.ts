/**
 * Meta-Layer graph linter (PLAN-030 / R-164, Gate A).
 *
 * Static analysis over the opportunity graph: treats offers as
 * transitions on the flat qualities space and computes a monotone
 * reachability fixpoint — which quality levels can EVER be reached
 * assuming the party can satisfy any capability/stat requirement
 * (party-side choices are always buildable; world-side qualities are
 * the graph under test).
 *
 * Checks (the 6 ratified invariants):
 *  a) no dead offer — every OfferDef's appearsWhen + quality-requires
 *     are satisfiable in some reachable state;
 *  b) every milestone reachable via ≥2 distinct approaches;
 *  c) no unlockable absolute gate — every `absolute` quality requirement
 *     is producible (a Locked card must name a real route);
 *  d) every offer carrying an absolute requirement declares
 *     `unlockRoute`;
 *  e) the three time concepts are actually exercised (window /
 *     acceptance≠completion / duration≠completion) — they must not
 *     collapse into one timestamp;
 *  f) vocabulary sanity — capability keys exist in the catalog;
 *     qualities written but never read are reported (terminal reward
 *     = fine, but made visible); qualities required but never produced
 *     nor initial are reported.
 *
 * Capability/stat requirements are assumed satisfiable in principle
 * (the party can be built) — the linter verifies the WORLD side.
 */

import type {
  MetaLayerConfig,
  QualityKey,
  RequirementRef,
} from '@/balancing/config/metaLayer';

/** A single lint finding. */
export interface LintIssue {
  check: string;
  severity: 'error' | 'warning';
  subject: string;
  message: string;
}

/** The linter report: errors block Gate A, warnings inform. */
export interface LintReport {
  ok: boolean;
  errors: LintIssue[];
  warnings: LintIssue[];
  stats: {
    offers: number;
    reachableOffers: number;
    milestones: number;
    reachableApproachesPerMilestone: Record<string, number>;
    maxReachableLevel: Record<string, number | 'unbounded'>;
  };
}

const UNBOUNDED = Number.MAX_SAFE_INTEGER;

interface Reachability {
  /** Estimated max reachable level per quality key. */
  maxLevel: Map<QualityKey, number>;
  /** defIds completable at the fixpoint. */
  reachableOffers: Set<string>;
}

function qualityReqSatisfied(
  req: RequirementRef,
  maxLevel: Map<QualityKey, number>,
): boolean {
  if (req.kind !== 'quality') return true; // party-side: assumed buildable
  return (maxLevel.get(req.key) ?? 0) >= (req.min ?? 1);
}

/**
 * Monotone fixpoint: repeatedly mark offers reachable when their
 * quality requirements are satisfied at the current maxLevel, and add
 * their positive provides to maxLevel. Repeatable offers contribute
 * unbounded level (they can be replayed); one-shot offers contribute
 * their deltas once. Clocks reach their `max` (or unbounded) by
 * definition — they tick regardless of offers.
 */
export function computeReachability(cfg: MetaLayerConfig): Reachability {
  const maxLevel = new Map<QualityKey, number>();

  for (const d of cfg.initialQualities) {
    maxLevel.set(d.key, (maxLevel.get(d.key) ?? 0) + Math.max(0, d.delta));
  }
  for (const c of cfg.clocks) {
    maxLevel.set(c.key, c.max ?? UNBOUNDED);
  }

  const reachableOffers = new Set<string>();
  const counted = new Set<string>();

  let changed = true;
  while (changed) {
    changed = false;
    for (const offer of cfg.offers) {
      if (reachableOffers.has(offer.id)) continue;
      const allReq = (offer.requires ?? []).every((r) =>
        qualityReqSatisfied(r, maxLevel),
      );
      const allAppear = (offer.appearsWhen ?? []).every((r) =>
        qualityReqSatisfied(r, maxLevel),
      );
      if (!allReq || !allAppear) continue;
      reachableOffers.add(offer.id);
      changed = true;
    }
    // Re-apply provides of reachable offers not yet counted.
    for (const offer of cfg.offers) {
      if (!reachableOffers.has(offer.id) || counted.has(offer.id)) continue;
      counted.add(offer.id);
      for (const d of [...offer.provides, ...(offer.providesOnAlmost ?? [])]) {
        if (d.delta <= 0) continue;
        if (offer.repeatable) {
          maxLevel.set(d.key, UNBOUNDED);
        } else {
          const cur = maxLevel.get(d.key) ?? 0;
          if (cur !== UNBOUNDED) {
            maxLevel.set(d.key, Math.min(UNBOUNDED, cur + d.delta));
          }
        }
      }
    }
  }
  return { maxLevel, reachableOffers };
}

function issue(
  check: string,
  severity: 'error' | 'warning',
  subject: string,
  message: string,
): LintIssue {
  return { check, severity, subject, message };
}

/**
 * Run all Gate-A checks against a meta-layer config.
 * `ok` is true when there are no errors (warnings allowed).
 */
export function lintOpportunityGraph(cfg: MetaLayerConfig): LintReport {
  const errors: LintIssue[] = [];
  const warnings: LintIssue[] = [];
  const { maxLevel, reachableOffers } = computeReachability(cfg);

  /* (a) dead offers -------------------------------------------------------- */
  for (const offer of cfg.offers) {
    if (!reachableOffers.has(offer.id)) {
      const blockers = [...(offer.appearsWhen ?? []), ...offer.requires]
        .filter((r) => !qualityReqSatisfied(r, maxLevel))
        .map((r) => `${r.key}>=${r.min ?? 1}`);
      errors.push(
        issue(
          'dead-offer',
          'error',
          offer.id,
          `never generatable/completable; unsatisfiable at fixpoint: ${blockers.join(', ')}`,
        ),
      );
    }
  }

  /* (b) milestones reachable via ≥2 approaches ----------------------------- */
  const reachableApproachesPerMilestone: Record<string, number> = {};
  for (const ms of cfg.milestones) {
    let count = 0;
    ms.approaches.forEach((approach, i) => {
      if (approach.every((r) => qualityReqSatisfied(r, maxLevel))) count++;
      else if (approach.length === 0) {
        warnings.push(
          issue(
            'milestone-empty-approach',
            'warning',
            ms.id,
            `approach[${i}] is empty`,
          ),
        );
      }
    });
    reachableApproachesPerMilestone[ms.id] = count;
    if (count < 2) {
      errors.push(
        issue(
          'milestone-entries',
          'error',
          ms.id,
          `only ${count} reachable approach(es) — the multi-entry rule requires ≥2`,
        ),
      );
    }
  }

  /* (c)+(d) absolute gates -------------------------------------------------- */
  for (const offer of cfg.offers) {
    const absoluteReqs = offer.requires.filter(
      (r) => r.severity === 'absolute',
    );
    for (const req of absoluteReqs) {
      if (req.kind === 'quality' && !qualityReqSatisfied(req, maxLevel)) {
        errors.push(
          issue(
            'absolute-no-route',
            'error',
            offer.id,
            `absolute requirement ${req.key}>=${req.min ?? 1} is never producible — Locked forever`,
          ),
        );
      }
    }
    if (absoluteReqs.length > 0 && !offer.unlockRoute) {
      errors.push(
        issue(
          'locked-no-unlockroute',
          'error',
          offer.id,
          'carries absolute requirement(s) but no unlockRoute to show on the card',
        ),
      );
    }
  }

  /* (e) time concepts exercised -------------------------------------------- */
  const hasWindow = cfg.offers.some((o) => o.window !== undefined);
  const hasDistinctTimers = cfg.offers.some(
    (o) => o.acceptanceTicks !== o.completionTicks,
  );
  const hasDistinctDuration = cfg.offers.some(
    (o) => o.durationTicks !== o.completionTicks,
  );
  if (!hasWindow) {
    warnings.push(
      issue('time-window', 'warning', 'config', 'no offer uses a window — the concept is unexercised'),
    );
  }
  if (!hasDistinctTimers) {
    errors.push(
      issue(
        'time-collapse',
        'error',
        'config',
        'acceptanceTicks === completionTicks on every offer — the dual timer collapses',
      ),
    );
  }
  if (!hasDistinctDuration) {
    warnings.push(
      issue(
        'time-duration',
        'warning',
        'config',
        'durationTicks === completionTicks on every offer — duration never binds separately',
      ),
    );
  }
  for (const offer of cfg.offers) {
    if (offer.durationTicks > offer.completionTicks) {
      warnings.push(
        issue(
          'time-exceed',
          'warning',
          offer.id,
          `durationTicks ${offer.durationTicks} > completionTicks ${offer.completionTicks} — committing always wastes the leader`,
        ),
      );
    }
  }

  /* (f) vocabulary ---------------------------------------------------------- */
  const produced = new Set<QualityKey>();
  const consumed = new Set<QualityKey>();
  for (const o of cfg.offers) {
    for (const d of o.provides) if (d.delta > 0) produced.add(d.key);
    for (const d of o.providesOnAlmost ?? []) if (d.delta > 0) produced.add(d.key);
    for (const r of [...o.requires, ...(o.appearsWhen ?? [])]) {
      if (r.kind === 'quality') consumed.add(r.key);
    }
  }
  for (const ms of cfg.milestones) {
    for (const a of ms.approaches) {
      for (const r of a) if (r.kind === 'quality') consumed.add(r.key);
    }
  }
  const catalog = new Set(cfg.capabilityTags);
  for (const o of cfg.offers) {
    for (const r of o.requires) {
      if (r.kind === 'capability' && !catalog.has(r.key)) {
        errors.push(
          issue(
            'capability-unknown',
            'error',
            o.id,
            `requires capability '${r.key}' not in capabilityTags catalog`,
          ),
        );
      }
    }
  }
  for (const key of produced) {
    if (!consumed.has(key)) {
      warnings.push(
        issue(
          'quality-terminal',
          'warning',
          key,
          'quality is produced but never required — terminal reward (fine if intended)',
        ),
      );
    }
  }
  for (const key of consumed) {
    const isInitial = cfg.initialQualities.some((d) => d.key === key);
    const isClock = cfg.clocks.some((c) => c.key === key);
    if (!produced.has(key) && !isInitial && !isClock) {
      warnings.push(
        issue(
          'quality-never-produced',
          'warning',
          key,
          'quality is required but never produced, not initial, not a clock',
        ),
      );
    }
  }

  const maxReachableLevel: Record<string, number | 'unbounded'> = {};
  for (const [k, v] of maxLevel) {
    maxReachableLevel[k] = v === UNBOUNDED ? 'unbounded' : v;
  }

  return {
    ok: errors.length === 0,
    errors,
    warnings,
    stats: {
      offers: cfg.offers.length,
      reachableOffers: reachableOffers.size,
      milestones: cfg.milestones.length,
      reachableApproachesPerMilestone,
      maxReachableLevel,
    },
  };
}

/** Render the report as a markdown evidence artifact. */
export function lintReportToMarkdown(report: LintReport): string {
  const lines: string[] = [
    '# Meta-Layer Graph Lint Report',
    '',
    `**Result:** ${report.ok ? 'PASS' : 'FAIL'} — ${report.errors.length} error(s), ${report.warnings.length} warning(s)`,
    '',
    '## Stats',
    '',
    `- offers: ${report.stats.offers} (reachable: ${report.stats.reachableOffers})`,
    `- milestones: ${report.stats.milestones}`,
    '',
    '### Approaches reachable per milestone',
    '',
  ];
  for (const [id, n] of Object.entries(
    report.stats.reachableApproachesPerMilestone,
  )) {
    lines.push(`- \`${id}\`: ${n}/≥2`);
  }
  lines.push('', '### Max reachable quality levels', '');
  for (const [k, v] of Object.entries(report.stats.maxReachableLevel)) {
    lines.push(`- \`${k}\`: ${v}`);
  }
  if (report.errors.length > 0) {
    lines.push('', '## Errors', '');
    for (const e of report.errors) {
      lines.push(`- **[${e.check}]** \`${e.subject}\`: ${e.message}`);
    }
  }
  if (report.warnings.length > 0) {
    lines.push('', '## Warnings', '');
    for (const w of report.warnings) {
      lines.push(`- **[${w.check}]** \`${w.subject}\`: ${w.message}`);
    }
  }
  return lines.join('\n');
}
