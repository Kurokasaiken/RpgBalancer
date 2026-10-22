/**
 * domainTextOracle — Pass-2 domain/text/i18n audit (PLAN-078 T-002).
 *
 * Scans the visible DOM text of a quiesced (or degraded) state for:
 *  - forbidden technical jargon leaking into player-facing text:
 *    `slot-token:*`, `+Npp`, `TICKS`, `NaN`, `undefined`, `[object Object]`
 *    (R-258, T-A2);
 *  - numeric incoherence: `N/M` counters where N > M (T-A1 HP bounds);
 *  - untranslated English in the it-IT locale (T-A13): a text node counts
 *    as suspicious when it contains ≥2 English function words and none of
 *    the allowlisted proper nouns (`.mw/sentinel/domain-text-allow.json`);
 *    severity `observation` — language is fuzzy, the gate promotes only
 *    the deterministic forbidden patterns.
 *
 * `evaluateText` is a pure function — unit-testable without a browser.
 */
import fs from 'node:fs';
import type { HarnessCtx } from '../gameSurfaceHarness';
import type { SentinelConfig } from '../sentinelConfig';
import type { OracleFinding, AuditPerturbation } from './index';

export interface VisibleText {
  text: string;
  target: string;
}

const FORBIDDEN: { id: string; re: RegExp; title: string }[] = [
  { id: 'slot-token', re: /\bslot-token:/i, title: 'internal slot token in player text' },
  { id: 'pp-unit', re: /[+\-−]?\d+\s*pp\b/i, title: 'raw «pp» unit in player text' },
  { id: 'ticks', re: /\bTICKS\b/, title: 'internal TICKS unit in player text' },
  { id: 'nan', re: /\bNaN\b/, title: 'NaN rendered in player text' },
  { id: 'undefined', re: /\bundefined\b/, title: 'undefined rendered in player text' },
  { id: 'object-object', re: /\[object Object\]/, title: '[object Object] rendered in player text' },
];

const ENGLISH_FUNCTION_WORDS = new Set([
  'the', 'a', 'an', 'and', 'or', 'of', 'to', 'in', 'on', 'for', 'with', 'your', 'you',
  'is', 'are', 'was', 'were', 'be', 'been', 'has', 'have', 'had', 'will', 'would',
  'can', 'could', 'should', 'must', 'not', 'no', 'yes', 'ok', 'click', 'here',
  'send', 'close', 'open', 'save', 'load', 'settings', 'rewards', 'days',
]);

/** Reads the it-IT allowlist (proper nouns legitimately English). */
export function loadDomainAllowlist(path: string): string[] {
  try {
    const parsed = JSON.parse(fs.readFileSync(path, 'utf8')) as { allowed?: string[] };
    return parsed.allowed ?? [];
  } catch {
    return [];
  }
}

/** Collects visible leaf text nodes with a semantic selector each. */
export async function collectVisibleText(ctx: HarnessCtx): Promise<VisibleText[]> {
  return ctx.page.evaluate(() => {
    const vis = (e: Element) => {
      const r = e.getBoundingClientRect();
      const s = getComputedStyle(e);
      if (r.width < 1 || r.height < 1 || s.visibility === 'hidden' || s.display === 'none') return false;
      let op = 1;
      for (let a: Element | null = e; a && a !== document.documentElement; a = a.parentElement) {
        op *= Number(getComputedStyle(a).opacity);
        const acs = getComputedStyle(a);
        if (acs.visibility === 'hidden' || acs.display === 'none') op = 0;
      }
      return op > 0.15 && r.bottom > 0 && r.right > 0 && r.top < innerHeight && r.left < innerWidth;
    };
    const sel = (e: Element) =>
      e.getAttribute('data-testid') ||
      e.getAttribute('aria-label') ||
      e.closest('[data-testid]')?.getAttribute('data-testid') ||
      e.tagName.toLowerCase();
    const out: { text: string; target: string }[] = [];
    document.querySelectorAll('body *').forEach((e) => {
      if (!vis(e)) return;
      const own = [...e.childNodes]
        .filter((n) => n.nodeType === 3 && n.textContent?.trim())
        .map((n) => n.textContent!.trim())
        .join(' ');
      if (own) out.push({ text: own, target: sel(e) });
    });
    return out;
  });
}

/**
 * Pure evaluation over collected text. `locale` gates the untranslated-
 * English heuristic to `it-IT` (in `en` everything is expected English).
 */
export function evaluateText(
  texts: VisibleText[],
  opts: { locale: string; allowlist: string[] },
  stateNode: string,
  perturbation: AuditPerturbation,
): OracleFinding[] {
  const findings: OracleFinding[] = [];
  const allow = new Set(opts.allowlist.map((s) => s.toLowerCase()));

  for (const { text, target } of texts) {
    for (const { id, re, title } of FORBIDDEN) {
      if (re.test(text)) {
        findings.push({
          oracle_id: `domain-text:${id}`,
          signature: `${id}|${target}|${text.slice(0, 40)}`,
          signature_family: 'domain-text',
          title: `${title}: «${text.slice(0, 60)}»`,
          severity: 'defect',
          state_node: stateNode,
          perturbation_kind: perturbation,
          target,
          evidence: { text },
        });
      }
    }

    // numeric incoherence N/M where N > M (T-A1)
    const ratio = text.match(/\b(\d+)\s*\/\s*(\d+)\b/);
    if (ratio && Number(ratio[1]) > Number(ratio[2])) {
      findings.push({
        oracle_id: 'domain-text:over-capacity',
        signature: `overcap|${target}|${ratio[0]}`,
        signature_family: 'domain-text',
        title: `Counter «${ratio[0]}» exceeds its max`,
        severity: 'defect',
        state_node: stateNode,
        perturbation_kind: perturbation,
        target,
        evidence: { text },
      });
    }

    // untranslated-English heuristic (it-IT only) — observation severity
    if (opts.locale === 'it-IT') {
      const words = text.toLowerCase().match(/[a-z]{3,}/g) ?? [];
      const foreign = words.filter((w) => ENGLISH_FUNCTION_WORDS.has(w) && !allow.has(w));
      const allowHit = [...allow].some((a) => text.toLowerCase().includes(a));
      if (foreign.length >= 2 && !allowHit) {
        findings.push({
          oracle_id: 'domain-text:untranslated',
          signature: `untranslated|${target}|${text.slice(0, 40)}`,
          signature_family: 'untranslated',
          title: `Possible untranslated English in it-IT: «${text.slice(0, 60)}»`,
          severity: 'observation',
          state_node: stateNode,
          perturbation_kind: perturbation,
          target,
          evidence: { text, foreignWords: foreign },
        });
      }
    }
  }

  return findings;
}

/** Collect + evaluate in one call (post-quiescence or degraded). */
export async function auditDomainText(
  ctx: HarnessCtx,
  cfg: SentinelConfig,
  locale: string,
  stateNode: string,
  perturbation: AuditPerturbation,
): Promise<OracleFinding[]> {
  const texts = await collectVisibleText(ctx);
  return evaluateText(texts, { locale, allowlist: loadDomainAllowlist(cfg.domainTextAllowlistPath) }, stateNode, perturbation);
}
