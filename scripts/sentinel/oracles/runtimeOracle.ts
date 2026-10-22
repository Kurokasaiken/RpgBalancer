/**
 * runtimeOracle — Pass-2 runtime/GPU audit (PLAN-078 T-002).
 *
 * Always-on signals already collected by the harness (console errors,
 * pageerrors, failed/4xx requests) plus an explicit WebGL context-lost
 * probe and a React update-depth check.
 */
import type { HarnessCtx } from '../gameSurfaceHarness';
import type { SentinelConfig } from '../sentinelConfig';
import type { OracleFinding, AuditPerturbation } from './index';

/** Evaluates captured console/pageerror/network diagnostics into findings. */
export function evaluateRuntimeDiagnostics(
  consoleErrors: string[],
  networkFailures: string[],
  stateNode: string,
  perturbation: AuditPerturbation,
): OracleFinding[] {
  const findings: OracleFinding[] = [];

  for (const err of consoleErrors) {
    const isReactDepth = /maximum update depth/i.test(err);
    findings.push({
      oracle_id: isReactDepth ? 'runtime:react-update-depth' : 'runtime:console-error',
      signature: `${isReactDepth ? 'react-depth' : 'console'}|${err.slice(0, 80)}`,
      signature_family: 'runtime',
      title: `${isReactDepth ? 'React update-depth loop' : 'Console error'}: ${err.slice(0, 100)}`,
      severity: 'defect',
      state_node: stateNode,
      perturbation_kind: perturbation,
      evidence: { error: err },
    });
  }

  /* One finding per unique failure — a flaky CDN retrying the same asset
   * 40× is one defect with a count, not 40 findings. */
  const seen = new Map<string, number>();
  for (const fail of networkFailures) {
    seen.set(fail, (seen.get(fail) ?? 0) + 1);
  }
  for (const [fail, count] of seen) {
    findings.push({
      oracle_id: 'runtime:network-failure',
      signature: `net|${fail}`,
      signature_family: 'runtime',
      title: `Network failure${count > 1 ? ` ×${count}` : ''}: ${fail}`,
      severity: 'defect',
      state_node: stateNode,
      perturbation_kind: perturbation,
      evidence: { failure: fail, occurrences: count },
    });
  }

  return findings;
}

/** Probes WebGL context loss on every canvas on the page. */
export async function auditRuntime(ctx: HarnessCtx, cfg: SentinelConfig, stateNode: string, perturbation: AuditPerturbation): Promise<OracleFinding[]> {
  void cfg;
  const findings = evaluateRuntimeDiagnostics(ctx.consoleErrors, ctx.networkFailures, stateNode, perturbation);
  ctx.consoleErrors.length = 0;
  ctx.networkFailures.length = 0;

  const ctxLost = await ctx.page.evaluate(() => {
    const lost: string[] = [];
    document.querySelectorAll('canvas').forEach((c, i) => {
      const gl = (c.getContext('webgl2') ?? c.getContext('webgl')) as WebGLRenderingContext | null;
      if (gl?.isContextLost()) lost.push(`canvas[${i}]`);
    });
    return lost;
  });
  for (const c of ctxLost) {
    findings.push({
      oracle_id: 'runtime:webgl-context-lost',
      signature: `webgl-lost|${c}`,
      signature_family: 'runtime',
      title: `WebGL context lost on ${c}`,
      severity: 'defect',
      state_node: stateNode,
      perturbation_kind: perturbation,
      evidence: { canvas: c },
    });
  }

  return findings;
}
