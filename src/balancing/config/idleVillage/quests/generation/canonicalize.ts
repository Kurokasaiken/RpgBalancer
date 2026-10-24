/**
 * canonicalize — strict canonical JSON serialization for receipt input
 * envelopes (PLAN-029 SP-1 T-3; contract: context/QUEST_GEN_LAB_CONTRACTS.md §9).
 *
 * Purpose: two writers (generation receipt, run receipt) must hash the
 * SAME canonical string for the same logical input. This module is the
 * normative serialization; hashing itself is SP-6.
 *
 * Deliberately NOT shared with the private `canonicalize` inside
 * `questScenario.schema.ts` (used by `computeScenarioVersion`): that one
 * is lenient — it drops PRESENTATION_KEYS and undefined and returns an
 * object; this one is strict — it throws on undefined and returns a
 * string. Different rules, different purposes; merging them silently
 * would break one contract or the other.
 *
 * Rules:
 * - object keys sorted by UTF-16 code-unit order (`.sort()`, NOT localeCompare);
 * - arrays preserve order; strings use JSON escaping, no Unicode normalization;
 * - numbers: JSON semantics; `-0` → `0`; NaN/±Infinity throw;
 * - throw on: undefined, function, symbol, bigint, cycles (with path),
 *   non-plain objects.
 *
 * `stripUndefinedDeep` exists because receipt input often comes from
 * `{...DEFAULT, ...partial}` spreads where an explicit undefined key
 * would override a default — receipt writers call
 * `canonicalize(stripUndefinedDeep(x))`; canonicalize alone stays strict.
 */

/** JSON-serializable value space the canonicalizer accepts. */
export type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue };

/**
 * Semantic version of the canonicalization rules. Bump when the rules
 * change — receipts record it so old hashes stay interpretable.
 */
export const canonicalizationVersion = 1;

/** Whether `v` is a plain object (Object or null prototype only). */
function isPlainObject(v: unknown): v is Record<string, unknown> {
  if (typeof v !== 'object' || v === null) return false;
  const proto = Object.getPrototypeOf(v);
  return proto === Object.prototype || proto === null;
}

function fail(path: string, what: string): never {
  throw new Error(`canonicalize: ${what} at '${path || '$'}'`);
}

/**
 * Serialize `value` to its canonical JSON string.
 * @param value JSON-serializable input (validated strictly — throws otherwise).
 * @returns deterministic canonical string.
 */
export function canonicalize(value: JsonValue): string {
  const seen = new Set<unknown>();
  const ser = (v: unknown, path: string): string => {
    if (v === undefined) fail(path, 'undefined');
    if (typeof v === 'string') return JSON.stringify(v);
    if (typeof v === 'boolean' || v === null) return String(v);
    if (typeof v === 'number') {
      if (!Number.isFinite(v)) fail(path, 'non-finite number');
      return String(v === 0 ? 0 : v); // -0 → 0
    }
    if (typeof v === 'bigint' || typeof v === 'symbol' || typeof v === 'function') {
      fail(path, `non-JSON type ${typeof v}`);
    }
    if (Array.isArray(v)) {
      if (seen.has(v)) fail(path, 'cycle');
      seen.add(v);
      const out = `[${v.map((item, i) => ser(item, `${path}[${i}]`)).join(',')}]`;
      seen.delete(v);
      return out;
    }
    if (isPlainObject(v)) {
      if (seen.has(v)) fail(path, 'cycle');
      seen.add(v);
      const body = Object.keys(v)
        .sort() // UTF-16 code-unit order — NOT localeCompare
        .map((k) => `${JSON.stringify(k)}:${ser(v[k], `${path}.${k}`)}`)
        .join(',');
      seen.delete(v);
      return `{${body}}`;
    }
    fail(path, 'non-plain object');
  };
  return ser(value, '$');
}

/**
 * Recursively strip `undefined`-valued own enumerable keys from plain
 * objects (and from plain objects nested inside arrays).
 * @param value input tree — undefined KEYS are removed; other non-JSON
 *   values throw (they are never "stripped").
 * @returns a JsonValue with no undefined-valued object keys.
 */
export function stripUndefinedDeep(value: unknown): JsonValue {
  const walk = (v: unknown, path: string): JsonValue => {
    if (v === undefined) fail(path, 'undefined');
    if (typeof v === 'symbol' || typeof v === 'function') {
      fail(path, `non-JSON type ${typeof v}`);
    }
    if (Array.isArray(v)) {
      const out: JsonValue[] = [];
      for (let i = 0; i < v.length; i++) {
        if (!(i in v)) fail(path, `array hole at index ${i}`);
        out.push(walk(v[i], `${path}[${i}]`));
      }
      return out;
    }
    if (isPlainObject(v)) {
      const out: Record<string, JsonValue> = {};
      for (const k of Object.keys(v)) {
        const item = v[k];
        if (item === undefined) continue; // strip — this is the point
        out[k] = walk(item, `${path}.${k}`);
      }
      return out;
    }
    if (typeof v === 'object' && v !== null) fail(path, 'non-plain object');
    return v as JsonValue;
  };
  return walk(value, '$');
}
