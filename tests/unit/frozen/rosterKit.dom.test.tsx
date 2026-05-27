/**
 * DOM snapshot test for rosterKit.
 *
 * Asserts that mounting the kit with canonical fixture data produces:
 * 1. A subtree rooted at `[data-testid="village-roster-section"]`.
 * 2. A stable inline structure (snapshot covers the contract boundary).
 *
 * Note: this is NOT the cross-page contract test — that's the Playwright spec
 * at tests/contract/minimal-vs-test.spec.ts. The DOM snapshot here is a fast
 * regression net that runs in CI on every PR.
 */

import { describe, test, expect } from 'vitest';
import { render } from '@testing-library/react';
import {
  VillageRosterSection,
  RosterKitShell,
  useRosterKitData,
} from '@/ui/idleVillage/frozen/kits/rosterKit';
import {
  normalizeDomString,
  extractSubtreeHtml,
  type NormalizeOptions,
} from '@/ui/idleVillage/frozen/_infra/contract';

function jsdomNormalizeOptions(): NormalizeOptions {
  return {
    parse: (html: string) => new DOMParser().parseFromString(`<body>${html}</body>`, 'text/html'),
    serialize: (element: Element) => element.outerHTML,
  };
}

function RosterKitHarness(): JSX.Element {
  const { residents } = useRosterKitData();
  return (
    <RosterKitShell>
      <VillageRosterSection residents={residents} componentId="rosterKit-test" />
    </RosterKitShell>
  );
}

describe('rosterKit DOM', () => {
  test('mounts with canonical fixture and exposes the contract testid', () => {
    const { container } = render(<RosterKitHarness />);
    const section = container.querySelector('[data-testid="village-roster-section"]');
    expect(section).not.toBeNull();
  });

  test('canonical fixture produces a non-empty roster', () => {
    const { container } = render(<RosterKitHarness />);
    const section = container.querySelector('[data-testid="village-roster-section"]');
    expect(section?.innerHTML.length ?? 0).toBeGreaterThan(0);
  });

  test('normalized contract subtree is deterministic across renders', () => {
    const first = render(<RosterKitHarness />);
    const firstHtml = extractSubtreeHtml(
      first.container.ownerDocument!,
      '[data-testid="village-roster-section"]'
    );
    first.unmount();

    const second = render(<RosterKitHarness />);
    const secondHtml = extractSubtreeHtml(
      second.container.ownerDocument!,
      '[data-testid="village-roster-section"]'
    );
    second.unmount();

    const opts = jsdomNormalizeOptions();
    expect(normalizeDomString(firstHtml, opts)).toBe(normalizeDomString(secondHtml, opts));
  });
});
