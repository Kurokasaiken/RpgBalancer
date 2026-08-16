/**
 * TestHub - Central navigation page for all Idle Village test pages
 *
 * Kit-backed cards are GENERATED from KIT_REGISTRY (`hub` metadata), so hub,
 * contract sweep and kit surface can never diverge. Pages without a kit yet
 * live in EXTRA_PAGES and should migrate into the registry over time.
 */

import { KIT_REGISTRY } from './frozen/registry';

export interface TestPageLink {
  id: string;
  title: string;
  description: string;
  path: string;
  icon: string;
  status?: 'ok' | 'needs-refactor';
}

export interface TestHubProps {
  /** Optional page title. Defaults to "Idle Village Test Hub". */
  title?: string;
  /** Optional subtitle below the title. */
  subtitle?: string;
  /** Optional list of pages to show. Defaults to the full generated + extra page list. */
  pages?: TestPageLink[];
  /** Optional back link shown above the grid. */
  backTo?: { path: string; label: string };
}

const KIT_PAGES: TestPageLink[] = KIT_REGISTRY.filter((entry) => entry.hub).map((entry) => ({
  id: entry.kitId,
  title: entry.hub!.title,
  description: entry.hub!.description,
  path: entry.hub!.path,
  icon: entry.hub!.icon,
  status: entry.status === 'certified' ? 'ok' : 'needs-refactor',
}));

/** Test pages not (yet) backed by a frozen kit. */
const EXTRA_PAGES: TestPageLink[] = [
  // Non-kit page: visual sandbox for v9 skin, not a component kit.
  {
    id: 'v9-skin-sandbox',
    title: 'V9 Skin Sandbox',
    description: 'Wilderness & Oily Prismatic Bronze — Pietra Alpina base, Azure ambient, iridescenza oil-slick',
    path: '/v9-skin-sandbox',
    icon: '🏔️',
    status: 'ok',
  },
  // Non-kit page: verification harness for POI detail, not a production kit.
  {
    id: 'poi-detail',
    title: 'POI Detail',
    description: 'POI Detail con ActivityCapsuleDetailSkinAware, config-first e telemetry',
    path: '/poi-detail-verification',
    icon: '🗺️',
    status: 'ok',
  },
  // Non-kit page: integration page for POI quest + roster; TBD future merge/deprecation.
  {
    id: 'poi-quest-detail-roster-integration',
    title: 'Quest POI Detail + Roster Integration',
    description: 'POI quest reale con roster e slot rack interattivo da Idle Village config',
    path: '/poi-quest-detail-roster-integration',
    icon: '🧩',
    status: 'ok',
  },
  // Non-kit page: integration page for POI job + roster; TBD future merge/deprecation.
  {
    id: 'poi-job-detail-roster-integration',
    title: 'Job POI Detail + Roster Integration',
    description: 'POI job reale con roster e slot rack interattivo da Idle Village config',
    path: '/poi-job-detail-roster-integration',
    icon: '🪵',
    status: 'ok',
  },
  // Non-kit page: Spell Creator test page with default skin system.
  {
    id: 'spell-creator',
    title: 'Spell Creator (Default Skin)',
    description: 'Modern Spell Creator with default skin system, i18n, and async persistence',
    path: '/spell-creator',
    icon: '🪄',
    status: 'ok',
  },
  // Non-kit page: Design System reference page.
  {
    id: 'design-system',
    title: 'Design System',
    description: 'Component library, tokens, panels, and integration patterns',
    path: '/design-system',
    icon: '🎨',
    status: 'ok',
  },
  // Non-kit page: Steam Trailer Hub — grouped trailer scenes.
  {
    id: 'steam-trailer-hub',
    title: 'Steam Trailer Hub',
    description: 'All Steam teaser trailer scenes in one hub',
    path: '/test-hub/steam-trailer-hub',
    icon: '🎬',
    status: 'ok',
  },
  // Non-kit page: Harmonization Gallery — canonical components vs material tokens.
  {
    id: 'harmonization-gallery',
    title: 'Harmonization Gallery',
    description: 'Canonical components mounted with material token scopes',
    path: '/harmonization-gallery',
    icon: '🖼️',
    status: 'ok',
  },
  // Non-kit page: Visual Fidelity Lab - blind protocol for visual grammar validation.
  {
    id: 'visual-fidelity-lab',
    title: 'Visual Fidelity Lab',
    description: 'Blind protocol: rebuild vs reference validation for visual grammar consistency',
    path: '/visual-fidelity-lab',
    icon: '🔬',
    status: 'ok',
  },
  // Non-kit page: Missing Hub — catalog of missing, mocked and draft components.
  {
    id: 'missing-hub',
    title: 'Missing Hub',
    description: 'Placeholder catalog for missing, mocked and draft Idle Village components',
    path: '/missing-hub',
    icon: '🕳️',
    status: 'ok',
  },
  // Non-kit page: Mockup to Component - visual handoff workflow lab.
  {
    id: 'mockup-to-component',
    title: 'Mockup → Component',
    description: 'Side-by-side mockup reference and derived React component iterations',
    path: '/mockup-to-component',
    icon: '🎨',
    status: 'ok',
  },
  // Non-kit page: World Surface - the living painted map. Pan, zoom, 21 layers, debug panel.
  {
    id: 'world-surface',
    title: 'World Surface',
    description: 'Mappa dipinta multi-layer: pan, zoom, autofit, editor layer e pannello debug',
    path: '/world-surface',
    icon: '🗺️',
    status: 'ok',
  },
  // Non-kit page: World Presentation Director - deterministic presentation runtime sandbox.
  {
    id: 'world-presentation-director',
    title: 'World Presentation Director',
    description: 'Deterministic WorldState → PresentationOutput runtime sandbox with scenario selector and playback controls',
    path: '/world-presentation-director',
    icon: '🎬',
    status: 'ok',
  },
  // Non-kit page: Use Client — client-only ThreatStatusIndicator showcase.
  {
    id: 'use-client',
    title: 'Use Client',
    description: "Client-only ThreatStatusIndicator with 'use client' directive, i18n and config-first urgency tokens",
    path: '/use-client',
    icon: '⚠️',
    status: 'ok',
  },
];

const TEST_PAGES: TestPageLink[] = [
  ...KIT_PAGES,
  // Skip extras whose route is already covered by a kit card.
  ...EXTRA_PAGES.filter((extra) => !KIT_PAGES.some((kit) => kit.path === extra.path)),
];

export const TestHub: React.FC<TestHubProps> = ({
  title = 'Idle Village Test Hub',
  subtitle = 'Pagina centrale per verifica visuale di tutti i componenti',
  pages = TEST_PAGES,
  backTo,
}) => {
  return (
    <div className="min-h-screen bg-slate-950 p-8">
      <div className="mx-auto max-w-6xl">
        {backTo && (
          <div className="mb-4">
            <a
              href={backTo.path}
              className="inline-flex items-center gap-2 rounded-md border border-white/10 bg-white/5 px-3 py-2 text-xs text-slate-300 transition-colors hover:border-amber-500/50 hover:text-amber-200"
            >
              {backTo.label}
            </a>
          </div>
        )}
        <header className="mb-8 text-center">
          <h1 className="mb-2 text-3xl font-bold text-amber-200">
            {title}
          </h1>
          <p className="text-sm text-slate-400">
            {subtitle}
          </p>
        </header>

        <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {pages.map((page) => (
            <a
              key={page.id}
              href={page.path}
              className={`group block rounded-xl border p-4 transition-all hover:bg-white/10 ${
                page.status === 'needs-refactor'
                  ? 'border-red-500/50 bg-red-500/5 hover:border-red-500'
                  : 'border-white/10 bg-white/5 hover:border-amber-500/50'
              }`}
            >
              <div className="mb-2 text-2xl">{page.icon}</div>
              <h3 className="mb-1 text-sm font-semibold text-white group-hover:text-amber-200">
                {page.title}
              </h3>
              <p className="text-xs text-slate-400 line-clamp-2">{page.description}</p>
              {page.status === 'needs-refactor' && (
                <div className="mt-2 text-[10px] uppercase tracking-wider text-red-400 font-semibold">
                  ⚠️ DA RIFARE
                </div>
              )}
            </a>
          ))}
        </div>

        <footer className="mt-8 border-t border-white/10 pt-6 text-center text-xs text-slate-500">
          <p>{title} · Idle Village Vertical Slice</p>
        </footer>
      </div>
    </div>
  );
};
