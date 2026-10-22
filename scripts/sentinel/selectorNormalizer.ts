/**
 * selectorNormalizer — fingerprint-stable selector normalization (PLAN-078 T-001).
 *
 * Finding fingerprints are `sha256(oracle_id|component_id|state_node|
 * perturbation_kind|normalizeSelector(target))`. For dedup to work across runs,
 * the selector must strip everything positional or runtime-generated while
 * keeping semantic component identity (data-testid, data-hud-panel, role,
 * semantic class names).
 *
 * Stripped:
 *  - positional: `:nth-child(n)`, `:nth-of-type(n)`, `:nth-last-*`, `:eq(n)`,
 *    `[data-index="n"]`, `[data-row-index]`-style numeric attrs
 *  - CSS-module / build hashes: `.foo__a1b2c`, `.foo_a1b2c` (keep the base)
 *  - React internals: `data-reactroot`, `data-reactid`, `data-react-checksum`,
 *    `#react-*`, auto `aria-describedby`/`aria-labelledby` pointing at
 *    radix-/dnd-kit-/react-generated ids
 *  - dnd-kit runtime ids: `[data-dnd-kit-*]`, `#dnd-kit-*`, `[data-rfd-*]`
 *
 * Kept: `data-testid`, `data-hud-panel`, `data-stage-panel`, `data-skin`,
 * `data-building-pin`, `data-nav-id`, `data-registry-*`, `role`, `aria-label`,
 * tag names, semantic classes.
 */

/** Strip positional pseudo-classes and numeric-index attributes. */
function stripPositional(sel: string): string {
  return sel
    .replace(/:nth-(?:last-)?(?:child|of-type)\(\s*(?:\d+|odd|even|[^)]*)\s*\)/gi, '')
    .replace(/:(?:first|last|only)-(child|of-type)/gi, '')
    .replace(/:eq\(\s*\d+\s*\)/gi, '')
    .replace(/\[\s*data-(?:index|row-index|col-index|order)\s*=\s*"?-?\d+"?\s*\]/gi, '');
}

/** Strip CSS-module hash suffixes, keeping the semantic base class.
 *  The single-underscore form must contain a digit — a pure-alpha tail
 *  (`_window`, `_primary`) is a semantic suffix, not a hash. */
function stripModuleHashes(sel: string): string {
  return sel
    .replace(/\.([A-Za-z_][\w-]*?)__[A-Za-z0-9_-]{4,}(?=[.\s:#\[(]|$)/g, '.$1')
    .replace(/\.([A-Za-z_][\w-]*?)_(?=[A-Za-z0-9]*\d)[A-Za-z0-9]{5,}(?=[.\s:#\[(]|$)/g, '.$1');
}

/** Strip runtime-generated attributes and ids. */
function stripRuntimeIds(sel: string): string {
  return sel
    .replace(/\[\s*(?:data-reactid|data-reactroot|data-react-checksum)[^\]]*\]/gi, '')
    .replace(/\[\s*data-dnd-kit-[^\]]*\]/gi, '')
    .replace(/\[\s*data-rfd-[^\]]*\]/gi, '')
    .replace(/\[\s*(?:aria-describedby|aria-labelledby|for|id|name)\s*=\s*"[^"]*(?:radix|dnd-kit|rfd-|react-select)[^"]*"\s*\]/gi, '')
    .replace(/#(?:dnd-kit-|radix-|rfd-|react-select-|__next|root-\d)[\w-]*/gi, '');
}

/**
 * Normalizes a DOM selector or locator chain to a fingerprint-stable form.
 * Whitespace collapses; empty segments produced by stripping are removed.
 */
export function normalizeSelector(raw: string): string {
  if (!raw) return '';
  const normalized = stripRuntimeIds(stripModuleHashes(stripPositional(raw)))
    .replace(/\s*>\s*/g, '>')
    .replace(/\s+/g, ' ')
    .trim();
  // Drop combinator-leftover empty segments (e.g. "div > > span" after strips).
  return normalized
    .split('>')
    .map((seg) => seg.trim())
    .filter((seg) => seg.length > 0)
    .join(' > ');
}

/**
 * Best-effort semantic selector for a DOM element, used when a finding is
 * recorded from an in-page audit (the oracle reports `target` as a semantic
 * selector, not the raw nth-child path the DOM walker built internally).
 * Pure function on element metadata — safe to unit test.
 */
export function semanticSelectorOf(el: {
  tagName: string;
  testId?: string | null;
  hudPanel?: string | null;
  stagePanel?: string | null;
  skin?: string | null;
  ariaLabel?: string | null;
  role?: string | null;
}): string {
  if (el.testId) return `[data-testid="${el.testId}"]`;
  if (el.hudPanel) return `[data-hud-panel="${el.hudPanel}"]`;
  if (el.stagePanel) return `[data-stage-panel="${el.stagePanel}"]`;
  if (el.skin) return `[data-skin="${el.skin}"]`;
  const tag = el.tagName.toLowerCase();
  if (el.role) return `${tag}[role="${el.role}"]`;
  if (el.ariaLabel) return `${tag}[aria-label]`;
  return tag;
}
