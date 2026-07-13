/**
 * Pseudo-localization helper for testing i18n UI layout.
 *
 * - Preserves ICU placeholders (curly braces) and HTML-like tags.
 * - Expands ASCII letters and digits by mapping each character to a pseudo
 *   two-character equivalent.
 * - Wraps every result with `!!` to visually identify pseudo strings.
 */

const charMap: Record<string, string> = {
  a: 'åå',
  b: 'ββ',
  c: 'çç',
  d: 'δδ',
  e: 'éé',
  f: 'ƒƒ',
  g: 'ğğ',
  h: 'ĥĥ',
  i: 'îî',
  j: 'ĵĵ',
  k: 'ķķ',
  l: 'łł',
  m: 'ṃṃ',
  n: 'ññ',
  o: 'öö',
  p: 'ṗṗ',
  q: 'qq',
  r: 'řř',
  s: 'šš',
  t: 'ţţ',
  u: 'üü',
  v: 'ṿṿ',
  w: 'ẅẅ',
  x: 'ẍẍ',
  y: 'ÿÿ',
  z: 'žž',
  A: 'ÅÅ',
  B: 'ββ',
  C: 'ÇÇ',
  D: 'ΔΔ',
  E: 'ÉÉ',
  F: 'ƑƑ',
  G: 'ĞĞ',
  H: 'ĤĤ',
  I: 'ÎÎ',
  J: 'ĴĴ',
  K: 'ĶĶ',
  L: 'ŁŁ',
  M: 'ṀṀ',
  N: 'ÑÑ',
  O: 'ÖÖ',
  P: 'ṖṖ',
  Q: 'QQ',
  R: 'ŘŘ',
  S: 'ŠŠ',
  T: 'ŢŢ',
  U: 'ÜÜ',
  V: 'ṾṾ',
  W: 'ẄẄ',
  X: 'ẌẌ',
  Y: 'ŸŸ',
  Z: 'ŽŽ',
  '0': '⓪⓪',
  '1': '①①',
  '2': '②②',
  '3': '③③',
  '4': '④④',
  '5': '⑤⑤',
  '6': '⑥⑥',
  '7': '⑦⑦',
  '8': '⑧⑧',
  '9': '⑨⑨',
};

function transformSegment(segment: string): string {
  let result = '';
  for (const char of segment) {
    result += charMap[char] ?? char;
  }
  return result;
}

/**
 * Splits the input into literal segments and protected blocks (curly-brace
 * placeholders and HTML-like tags). Only literal segments are pseudo-localized.
 */
function splitProtected(input: string): Array<{ type: 'literal' | 'protected'; value: string }> {
  const tokens: Array<{ type: 'literal' | 'protected'; value: string }> = [];
  let current = '';
  let i = 0;
  while (i < input.length) {
    const char = input[i];
    if (char === '{' || char === '<') {
      if (current) {
        tokens.push({ type: 'literal', value: current });
        current = '';
      }
      const closer = char === '{' ? '}' : '>';
      let depth = 1;
      let block = char;
      i += 1;
      while (i < input.length && depth > 0) {
        const next = input[i];
        block += next;
        if (next === char) {
          depth += 1;
        } else if (next === closer) {
          depth -= 1;
        }
        i += 1;
      }
      tokens.push({ type: 'protected', value: block });
    } else {
      current += char;
      i += 1;
    }
  }
  if (current) {
    tokens.push({ type: 'literal', value: current });
  }
  return tokens;
}

/**
 * Returns a pseudo-localized version of the input string.
 * The output is wrapped in `!!` and expanded by at least 30%.
 */
export function pseudoLocalize(input: string): string {
  const tokens = splitProtected(input);
  const transformed = tokens.map((token) =>
    token.type === 'protected' ? token.value : transformSegment(token.value)
  ).join('');
  return `!! ${transformed} !!`;
}

export default pseudoLocalize;
