/**
 * Contract sweep: every kit in KIT_REGISTRY must render an identical subtree
 * on its `referenceRoute` and on its `minimalRoute`, after normalization.
 *
 * This is the keystone test of the Component Freezing & Certification system.
 * A failure here means a `minimal-*` page has drifted from the canonical
 * reference and must be fixed (or the certification version-bumped) before
 * merge.
 *
 * See Plan v2 §S5 and src/docs/docs/freeze/AUDIT_TESTROSTERPAGE_SUBTREE.md.
 */

import { test, expect, type Page } from '@playwright/test';
import { getContractEnforcedKits } from '@/ui/idleVillage/frozen/registry';
import {
  normalizeDomString,
  compareContractHtml,
  browserNormalizeOptions,
  extractSubtreeHtml,
  type ContractConfig,
} from '@/ui/idleVillage/frozen/_infra/contract';

/**
 * Reads the contract subtree HTML from a given route, after normalization.
 * Runs inside the browser via `page.evaluate` so DOMParser is available.
 */
async function readNormalizedSubtree(
  page: Page,
  route: string,
  contract: ContractConfig
): Promise<string> {
  await page.goto(route, { waitUntil: 'networkidle' });
  // Wait for the contract subtree to be present.
  await page.locator(contract.subtreeSelector).first().waitFor({ state: 'attached', timeout: 15_000 });

  return page.evaluate(
    (selector) => {
      // Re-implement extract + normalize inside the browser. Kept inline because
      // page.evaluate runs in a separate realm without module imports.
      const root = document.querySelector(selector);
      if (!root) return '';

      const debugSuffixes = ['debug', 'toolbar', 'banner'];
      const volatileAttributes = ['data-render-ts', 'data-frame-id', 'data-react-key', 'aria-busy'];

      // Strip debug subtrees.
      const debugSelectors = debugSuffixes.map((s) => `[data-testid$="-${s}"]`).join(', ');
      root.querySelectorAll(debugSelectors).forEach((el) => el.remove());

      // Walk and clean attributes.
      const walk = (el: Element): void => {
        const toRemove: string[] = [];
        for (const attr of Array.from(el.attributes)) {
          if (volatileAttributes.some((p) => attr.name.startsWith(p))) toRemove.push(attr.name);
        }
        toRemove.forEach((name) => el.removeAttribute(name));
        const attrs = Array.from(el.attributes)
          .map((a) => ({ name: a.name, value: a.value }))
          .sort((a, b) => a.name.localeCompare(b.name));
        while (el.attributes.length > 0) el.removeAttribute(el.attributes[0]!.name);
        attrs.forEach((a) => el.setAttribute(a.name, a.value));
        for (const child of Array.from(el.children)) walk(child);
      };
      walk(root);
      return root.outerHTML;
    },
    contract.subtreeSelector
  );
}

for (const entry of getContractEnforcedKits()) {
  test.describe(`contract: ${entry.kitId}`, () => {
    test(`reference ${entry.contract.referenceRoute} and minimal ${entry.contract.minimalRoute} render an identical subtree`, async ({
      page,
    }) => {
      const ref = await readNormalizedSubtree(page, entry.contract.referenceRoute, entry.contract);
      const min = await readNormalizedSubtree(page, entry.contract.minimalRoute, entry.contract);

      const diff = compareContractHtml(ref, min);

      // Surface a useful diff on failure so triage doesn't require running the
      // test locally.
      if (!diff.equal) {
        console.log(`[contract:${entry.kitId}] reference length=${diff.referenceLength}, minimal length=${diff.minimalLength}`);
        console.log(diff.diff);
      }

      expect(
        diff.equal,
        `Subtree mismatch between ${entry.contract.referenceRoute} and ${entry.contract.minimalRoute} for kit "${entry.kitId}". See diff in test output.`
      ).toBe(true);
    });
  });
}

// Re-export utilities so this file is "alive" to tsc when no kits are registered.
export { readNormalizedSubtree };
