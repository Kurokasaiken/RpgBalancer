/**
 * Unit tests for the contract testing utilities.
 *
 * Validates that normalization, attribute sorting, debug-node stripping, and
 * volatile-attribute scrubbing behave as documented.
 */

import { describe, test, expect } from 'vitest';
import {
  normalizeDomString,
  compareContractHtml,
  extractSubtreeHtml,
  DEFAULT_DEBUG_SUFFIXES,
  DEFAULT_VOLATILE_ATTRIBUTES,
  type NormalizeOptions,
} from '@/ui/idleVillage/frozen/_infra/contract';

/** jsdom-backed normalize options helper. */
function jsdomNormalizeOptions(overrides: Partial<NormalizeOptions> = {}): NormalizeOptions {
  return {
    parse: (html: string) => {
      const parser = new DOMParser();
      return parser.parseFromString(`<body>${html}</body>`, 'text/html');
    },
    serialize: (element: Element) => element.outerHTML,
    ...overrides,
  };
}

describe('normalizeDomString', () => {
  test('produces deterministic output regardless of source attribute order', () => {
    const a = '<div b="2" a="1" data-testid="root">hi</div>';
    const b = '<div a="1" data-testid="root" b="2">hi</div>';
    const opts = jsdomNormalizeOptions();
    expect(normalizeDomString(a, opts)).toBe(normalizeDomString(b, opts));
  });

  test('strips elements whose data-testid ends with a debug suffix', () => {
    const html =
      '<div data-testid="root">' +
      '<span data-testid="village-debug">noise</span>' +
      '<span data-testid="title-toolbar">noise</span>' +
      '<span data-testid="status-banner">noise</span>' +
      '<span data-testid="real-content">keep me</span>' +
      '</div>';
    const out = normalizeDomString(html, jsdomNormalizeOptions());
    expect(out).not.toContain('data-testid="village-debug"');
    expect(out).not.toContain('data-testid="title-toolbar"');
    expect(out).not.toContain('data-testid="status-banner"');
    expect(out).toContain('data-testid="real-content"');
    expect(out).toContain('keep me');
  });

  test('removes volatile attributes (data-render-ts, etc.)', () => {
    const html = '<div data-testid="root" data-render-ts="999" data-frame-id="abc">x</div>';
    const out = normalizeDomString(html, jsdomNormalizeOptions());
    expect(out).not.toContain('data-render-ts');
    expect(out).not.toContain('data-frame-id');
    expect(out).toContain('data-testid="root"');
  });

  test('honors custom debug suffixes when provided', () => {
    const html =
      '<div data-testid="root">' +
      '<span data-testid="foo-experimental">noise</span>' +
      '<span data-testid="real">keep me</span>' +
      '</div>';
    const out = normalizeDomString(html, {
      ...jsdomNormalizeOptions(),
      debugSuffixes: ['experimental'],
    });
    expect(out).not.toContain('data-testid="foo-experimental"');
    expect(out).toContain('keep me');
  });

  test('returns empty string for empty input', () => {
    const out = normalizeDomString('', jsdomNormalizeOptions());
    expect(out).toBe('');
  });
});

describe('compareContractHtml', () => {
  test('reports equal=true for identical normalized strings', () => {
    const result = compareContractHtml('<div></div>', '<div></div>');
    expect(result.equal).toBe(true);
    expect(result.diff).toBeUndefined();
  });

  test('reports equal=false and produces a diff sample', () => {
    const result = compareContractHtml('<div>a</div>', '<div>b</div>');
    expect(result.equal).toBe(false);
    expect(result.diff).toBeTruthy();
    expect(result.diff).toContain('First divergence');
  });
});

describe('extractSubtreeHtml', () => {
  test('returns outer HTML of the matched element', () => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(
      '<body><div data-testid="root"><span data-testid="inner">hello</span></div></body>',
      'text/html'
    );
    const subtree = extractSubtreeHtml(doc, '[data-testid="inner"]');
    expect(subtree).toContain('data-testid="inner"');
    expect(subtree).toContain('hello');
  });

  test('returns empty string for unmatched selector', () => {
    const parser = new DOMParser();
    const doc = parser.parseFromString('<body><div></div></body>', 'text/html');
    expect(extractSubtreeHtml(doc, '[data-testid="missing"]')).toBe('');
  });
});

describe('defaults', () => {
  test('DEFAULT_DEBUG_SUFFIXES includes debug, toolbar, banner', () => {
    expect(DEFAULT_DEBUG_SUFFIXES).toContain('debug');
    expect(DEFAULT_DEBUG_SUFFIXES).toContain('toolbar');
    expect(DEFAULT_DEBUG_SUFFIXES).toContain('banner');
  });

  test('DEFAULT_VOLATILE_ATTRIBUTES includes data-render-ts', () => {
    expect(DEFAULT_VOLATILE_ATTRIBUTES).toContain('data-render-ts');
  });
});
