/**
 * R-385 — regression coverage for the curated post-mappa2 `/hub`.
 * The hub must stay small and focused on the modern mappa2/HUD workstream,
 * instead of silently inheriting the legacy `/test-hub` catalog.
 */
import { createElement } from 'react';
import { renderToString } from 'react-dom/server';
import { I18nextProvider } from 'react-i18next';
import { describe, expect, it } from 'vitest';
import i18n from '@/localization/i18n';
import HubPage from '@/pages/hub';
import { TestHub } from '@/ui/idleVillage/TestHub';
import { LAB_PATHS_SET } from '@/deploy/labRouteData';
import { LAB_ROUTE_COMPONENTS } from '@/deploy/labRoutes';

/** Renders the hub through the real i18n provider for static markup assertions. */
function renderHub(): string {
  return renderToString(
    createElement(I18nextProvider, { i18n }, createElement(HubPage)),
  );
}

describe('post-mappa2 HubPage', () => {
  it('renders grouped navigation with the current decision surface first', () => {
    const html = renderHub();

    expect(html).toContain('Hub');
    expect(html).toContain('Decide now');
    expect(html).toContain('Canon and living map');
    expect(html).toContain('HUD workbench');
    expect(html).toContain('Reviews and comparisons');
    expect(html.indexOf('href="/hud-lab"')).toBeGreaterThan(-1);
    expect(html.indexOf('href="/hud-lab"')).toBeLessThan(html.indexOf('href="/game"'));
  });

  it('links the curated post-mappa2 surfaces', () => {
    const html = renderHub();

    for (const path of [
      '/hud-lab',
      '/game',
      '/mappa2-lab',
      '/hud-compose',
      '/hud-target',
      '/hud-layout',
      '/hud-real-roster',
      '/hud-zanara-roster',
      '/hud-library',
      '/icon-gallery',
      '/hud-charter-review',
      '/hud-compare',
      '/hud-panel-compare',
      '/hud-defects',
      '/mappa2-upscale-review',
    ]) {
      expect(html, path).toContain(`href="${path}"`);
    }
  });

  it('does not inherit legacy test-hub or pre-mappa2 lab links', () => {
    const html = renderHub();

    for (const path of [
      '/test-hub',
      '/world-surface',
      '/quest-generation-lab',
      '/minimal-roster',
      '/minimal-destiny-astrolabe',
      '/macro-gameplay',
    ]) {
      expect(html, path).not.toContain(`href="${path}"`);
    }
  });

  it('links only routes that resolve in the app or lab registry', () => {
    const html = renderHub();
    const hrefs = [...html.matchAll(/href="([^"]+)"/g)].map((match) => match[1]);
    const canonicalPaths = new Set(['/game', '/mappa2-lab']);

    expect(hrefs.length).toBeGreaterThan(0);
    for (const path of hrefs) {
      if (canonicalPaths.has(path)) continue;
      expect(LAB_ROUTE_COMPONENTS[path], path).toBeDefined();
    }
  });

  it('keeps the legacy flat TestHub rendering available', () => {
    const html = renderToString(
      createElement(TestHub, {
        pages: [{ id: 'legacy-one', path: '/legacy-one', icon: '•', title: 'Legacy one', description: 'Flat card' }],
      }),
    );

    expect(html).toContain('href="/legacy-one"');
    expect(html).not.toContain('<h2');
  });

  it('registers /hub in the full dev route registry', () => {
    expect(LAB_PATHS_SET.has('/hub')).toBe(true);
    expect(LAB_ROUTE_COMPONENTS['/hub']).toBeDefined();
  });
});
