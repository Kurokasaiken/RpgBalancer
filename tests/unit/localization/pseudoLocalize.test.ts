import { describe, it, expect } from 'vitest';
import { pseudoLocalize } from '@/localization/pseudoLocalize';

describe('pseudoLocalize', () => {
  it('wraps the output with !!', () => {
    const result = pseudoLocalize('hello');
    expect(result.startsWith('!!')).toBe(true);
    expect(result.endsWith('!!')).toBe(true);
  });

  it('expands the string by at least 30%', () => {
    const input = 'hello world';
    const result = pseudoLocalize(input);
    const expansion = (result.length - input.length) / input.length;
    expect(expansion).toBeGreaterThanOrEqual(0.3);
  });

  it('preserves ICU placeholders and HTML-like tags', () => {
    const input = 'Hello {name}, see <0>this</0>';
    const result = pseudoLocalize(input);
    expect(result).toContain('{name}');
    expect(result).toContain('<0>');
    expect(result).toContain('</0>');
  });

  it('handles empty strings', () => {
    const result = pseudoLocalize('');
    expect(result).toBe('!!  !!');
  });
});
