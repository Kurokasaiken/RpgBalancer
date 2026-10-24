/**
 * amanuenseMarkup — tokenizer for the authored inline markup allowed inside
 * `longForm` paragraph strings (PLAN-085, artifact-r003).
 *
 * Tokens:
 *   `{r|…}` → rubric (vermilion span)
 *   `{g|…}` → gilt underline (ink text + gold rule — gold is never text colour)
 *   `{m|…}` → gloss pointer (manicule ☞ flag in the margin apparatus)
 *
 * No nesting. `parseAmanuenseMarkup` returns `null` on malformed input so the
 * caller can render the raw string and emit `translation_missing`-style
 * telemetry instead of shipping a broken page (Zod refinement only guards
 * authored config, not i18n payloads edited by translators).
 */

export type AmanuenseSegmentKind = 'text' | 'rubric' | 'gilt' | 'gloss';

export interface AmanuenseSegment {
  kind: AmanuenseSegmentKind;
  text: string;
}

const TOKEN_RE = /\{([rgm])\|([^}]*)\}/g;
const BALANCE_RE = /\{([rgm])\|/g;

/** Whether the markup braces are balanced — every `{x|` must close with `}`. */
export function isAmanuenseMarkupBalanced(source: string): boolean {
  let depth = 0;
  let i = 0;
  while (i < source.length) {
    const c = source[i];
    if (c === '{') {
      const m = source.slice(i).match(/^\{[rgm]\|/);
      if (!m) return false;
      depth += 1;
      i += m[0].length;
      continue;
    }
    if (c === '}') {
      if (depth === 0) return false;
      depth -= 1;
    }
    i += 1;
  }
  return depth === 0;
}

/**
 * Splits `source` into styled segments. Returns `null` if any `{…}` sequence
 * is malformed (unbalanced, unknown sigil, or nested token).
 */
export function parseAmanuenseMarkup(source: string): AmanuenseSegment[] | null {
  if (!isAmanuenseMarkupBalanced(source)) return null;
  if (/\{[rgm]\|[^}]*\{[rgm]\|/.test(source)) return null; // no nesting
  const segments: AmanuenseSegment[] = [];
  let last = 0;
  for (const m of source.matchAll(TOKEN_RE)) {
    const idx = m.index ?? 0;
    if (idx > last) segments.push({ kind: 'text', text: source.slice(last, idx) });
    const kind: AmanuenseSegmentKind =
      m[1] === 'r' ? 'rubric' : m[1] === 'g' ? 'gilt' : 'gloss';
    segments.push({ kind, text: m[2] });
    last = idx + m[0].length;
  }
  /* Any '{' or '}' surviving outside tokens is malformed. */
  if (/[{}]/.test(source.slice(last))) return null;
  if (last < source.length) segments.push({ kind: 'text', text: source.slice(last) });
  return segments;
}

/** The drop-cap glyph for a localized paragraph — first alphanumeric char. */
export function amanuenseInitialLetter(paragraphText: string): string {
  const m = paragraphText.match(/[\p{L}\p{N}]/u);
  return m ? m[0].toUpperCase() : '?';
}
