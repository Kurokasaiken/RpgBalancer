/**
 * Contract testing infrastructure for frozen component kits.
 *
 * The contract test ensures that a `minimal-*` page renders the same subtree as
 * the canonical reference page (typically `/test` or `/minimal-gameplay`), so
 * that drift between the two surfaces is caught immediately by CI.
 *
 * Per the audit (src/docs/docs/freeze/AUDIT_TESTROSTERPAGE_SUBTREE.md):
 * - Some kits compare against `/test` (TestRosterPage subtree).
 * - Others compare against `/minimal-gameplay` (MinimalGameplayPage subtree).
 * - The framework is therefore per-kit configurable via `ContractConfig`.
 *
 * This module exposes:
 *   - `ContractConfig` — the per-kit description.
 *   - `normalizeDomString(html)` — strips volatile attributes & debug nodes.
 *   - `extractSubtreeHtml(root, selector)` — JSDOM/DOM-side subtree extraction.
 *   - `assertContractParity(refHtml, minHtml)` — diff helper for unit-level tests.
 *
 * Playwright-based E2E contract tests use these primitives — see
 * `tests/contract/minimal-vs-test.spec.ts` (created in Day 5).
 *
 * Part of the Component Freezing & Certification system (see
 * src/docs/docs/plans/component_freezing_certification_plan_v2.md).
 */

/**
 * Provider identifiers used to drive contract testing inside JSDOM.
 * The actual provider components live in src/ui/idleVillage/...
 */
export type ProviderId =
  | 'SkinSystemProvider'
  | 'SandboxTimingProvider'
  | 'DragProvider'
  | 'DndContext';

export interface ContractConfig {
  /** Unique kit identifier (e.g. "rosterKit"). */
  kitId: string;
  /** Route that mounts the canonical reference (e.g. "/test"). */
  referenceRoute: string;
  /** Route that mounts the isolated minimal-* page (e.g. "/minimal-roster"). */
  minimalRoute: string;
  /**
   * CSS-like Playwright locator (chainable with ">>") used to extract the
   * contract subtree from BOTH pages. The same selector must resolve a single
   * element on each page (or both must produce identical multi-element output).
   */
  subtreeSelector: string;
  /**
   * Provider chain required when mounting the kit in a JSDOM test. Order
   * matters: outermost first. Optional — when omitted, the kit is mounted bare.
   */
  providerChain?: ProviderId[];
  /**
   * Optional list of `data-testid` suffixes (without the leading hyphen) that
   * mark non-canonical nodes which must be stripped before diffing.
   * Defaults to ["debug", "toolbar", "banner"].
   */
  debugSuffixes?: string[];
  /**
   * Optional list of attribute name prefixes that are treated as volatile and
   * removed during normalization. Defaults to ["data-render-ts", "data-frame-id"].
   */
  volatileAttributes?: string[];
}

export const DEFAULT_DEBUG_SUFFIXES = ['debug', 'toolbar', 'banner'] as const;
export const DEFAULT_VOLATILE_ATTRIBUTES = [
  'data-render-ts',
  'data-frame-id',
  'data-react-key',
  'aria-busy', // volatile during suspense transitions
] as const;

/**
 * Strips volatile attributes and debug-only nodes from an HTML string.
 *
 * Algorithm:
 * 1. Parse `html` via DOMParser (browser) or jsdom (node-side test runtime).
 * 2. Remove every element whose `data-testid` ends with a suffix in `debugSuffixes`.
 * 3. Strip volatile attributes from all remaining elements.
 * 4. Sort attributes alphabetically to produce a deterministic serialization.
 * 5. Return the normalized outer HTML.
 *
 * The function is intentionally environment-agnostic: it accepts a `Document`
 * factory so it can be used both in JSDOM (vitest) and in the browser
 * (playwright `page.evaluate`).
 */
export interface NormalizeOptions {
  debugSuffixes?: readonly string[];
  volatileAttributes?: readonly string[];
  /** Factory that parses an HTML string into a `Document`. */
  parse: (html: string) => Document;
  /** Factory that serializes an `Element` back to its outer HTML. */
  serialize: (element: Element) => string;
}

export function normalizeDomString(html: string, options: NormalizeOptions): string {
  if (!html.trim()) return '';
  const debugSuffixes = options.debugSuffixes ?? DEFAULT_DEBUG_SUFFIXES;
  const volatileAttributes = options.volatileAttributes ?? DEFAULT_VOLATILE_ATTRIBUTES;
  const doc = options.parse(html);
  const root = doc.body?.firstElementChild ?? doc.documentElement;
  if (!root) return '';

  // 2. Remove debug nodes.
  const debugSelectors = debugSuffixes.map((s) => `[data-testid$="-${s}"]`).join(', ');
  if (debugSelectors) {
    root.querySelectorAll(debugSelectors).forEach((el) => el.remove());
  }

  // 3 & 4. Walk the tree, strip volatile attrs, sort remaining attrs.
  const walk = (el: Element): void => {
    const toRemove: string[] = [];
    for (const attr of Array.from(el.attributes)) {
      const isVolatile = volatileAttributes.some((prefix) => attr.name.startsWith(prefix));
      if (isVolatile) toRemove.push(attr.name);
    }
    toRemove.forEach((name) => el.removeAttribute(name));

    // Sort attributes alphabetically by re-applying them.
    const attrs = Array.from(el.attributes)
      .map((a) => ({ name: a.name, value: a.value }))
      .sort((a, b) => a.name.localeCompare(b.name));
    while (el.attributes.length > 0) el.removeAttribute(el.attributes[0]!.name);
    attrs.forEach((a) => el.setAttribute(a.name, a.value));

    for (const child of Array.from(el.children)) walk(child);
  };
  walk(root);

  return options.serialize(root);
}

/**
 * Extracts the outer HTML of the subtree matched by `selector` within `root`.
 * Returns the empty string if the selector does not match.
 */
export function extractSubtreeHtml(root: Document | Element, selector: string): string {
  const el = root.querySelector(selector);
  return el ? el.outerHTML : '';
}

/**
 * Diff result returned by `assertContractParity`.
 * `equal` is true when the two normalized HTML strings are byte-identical.
 */
export interface ContractDiffResult {
  equal: boolean;
  /** Length in chars of the reference HTML after normalization. */
  referenceLength: number;
  /** Length in chars of the minimal HTML after normalization. */
  minimalLength: number;
  /** Lazy: a unified diff string. Populated only when `equal` is false. */
  diff?: string;
}

/**
 * Diffs two normalized subtree HTML strings and returns a structured result.
 * Caller decides whether to throw on `equal === false`.
 */
export function compareContractHtml(
  referenceHtml: string,
  minimalHtml: string
): ContractDiffResult {
  const equal = referenceHtml === minimalHtml;
  if (equal) {
    return { equal, referenceLength: referenceHtml.length, minimalLength: minimalHtml.length };
  }
  return {
    equal,
    referenceLength: referenceHtml.length,
    minimalLength: minimalHtml.length,
    diff: buildSimpleDiff(referenceHtml, minimalHtml),
  };
}

/**
 * Produces a coarse character-level diff. Good enough for human triage in CI
 * output; full diffing libraries are deliberately not pulled in to keep the
 * infra lean (per the project's "no extra deps unless needed" preference).
 */
function buildSimpleDiff(a: string, b: string): string {
  const maxLen = Math.max(a.length, b.length);
  const sample = 240;
  let firstDiffAt = -1;
  for (let i = 0; i < maxLen; i++) {
    if (a[i] !== b[i]) {
      firstDiffAt = i;
      break;
    }
  }
  if (firstDiffAt === -1) {
    return `(strings differ in length: reference=${a.length}, minimal=${b.length})`;
  }
  const start = Math.max(0, firstDiffAt - 40);
  const refSlice = a.slice(start, start + sample);
  const minSlice = b.slice(start, start + sample);
  return [
    `First divergence at char ${firstDiffAt}:`,
    `  reference: …${refSlice}…`,
    `  minimal:   …${minSlice}…`,
  ].join('\n');
}

// ---------------------------------------------------------------------------
// Browser-side helpers (used inside playwright `page.evaluate`)
// ---------------------------------------------------------------------------

/**
 * Builds a `NormalizeOptions` value backed by the browser's native DOMParser.
 * Intended for use inside `page.evaluate` blocks where DOMParser is available.
 */
export function browserNormalizeOptions(): NormalizeOptions {
  return {
    parse: (html: string) => {
      const parser = new DOMParser();
      const doc = parser.parseFromString(`<body>${html}</body>`, 'text/html');
      return doc;
    },
    serialize: (element: Element) => element.outerHTML,
  };
}
