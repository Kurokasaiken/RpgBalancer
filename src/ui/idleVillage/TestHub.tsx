/**
 * TestHub - Central navigation page for all Idle Village test pages
 *
 * Kit-backed cards are GENERATED from KIT_REGISTRY (`hub` metadata), so hub,
 * contract sweep and kit surface can never diverge. Pages without a kit yet
 * live in EXTRA_PAGES and should migrate into the registry over time.
 */

import { KIT_REGISTRY } from './frozen/registry';

interface TestPageLink {
  id: string;
  title: string;
  description: string;
  path: string;
  icon: string;
  status?: 'ok' | 'needs-refactor';
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
  {
    id: 'slot',
    title: 'Slot',
    description: 'Test animazioni incastonamento ed estrazione PgCard',
    path: '/slot',
    icon: '🎰',
    status: 'ok',
  },
  {
    id: 'roster-slot-integration',
    title: 'Roster + Slot Rack',
    description: 'Integrazione Roster con SlotRack, drag & drop e assegnazione',
    path: '/minimal-roster-slot-integration',
    icon: '🎯',
    status: 'ok',
  },
  {
    id: 'job-poi-roster',
    title: 'POI + Roster Integration',
    description: 'Integrazione POI job detail con roster drag & drop',
    path: '/minimal-job-poi-roster-integration',
    icon: '🗺️',
    status: 'ok',
  },
  {
    id: 'job-poi-roster-time',
    title: 'POI + Roster + Time Integration',
    description: 'Integrazione completa con time engine e reward',
    path: '/minimal-job-poi-roster-time-integration',
    icon: '⏱️',
    status: 'ok',
  },
  {
    id: 'quest-detail-legacy',
    title: 'Quest Chronicle',
    description: 'Dettaglio quest con fasi, progress bar, esito finale',
    path: '/minimal-quest-detail',
    icon: '📜',
    status: 'ok',
  },
  {
    id: 'v8-skin-sandbox',
    title: 'V8 Skin Sandbox',
    description: 'Test Material Layer Engine e V8 Skin Architecture con preset procedurali',
    path: '/skin-sandbox',
    icon: '🎨',
    status: 'ok',
  },
  {
    id: 'v9-skin-sandbox',
    title: 'V9 Skin Sandbox',
    description: 'Wilderness & Oily Prismatic Bronze — Pietra Alpina base, Azure ambient, iridescenza oil-slick',
    path: '/v9-skin-sandbox',
    icon: '🏔️',
    status: 'ok',
  },
  {
    id: 'wanderlust-dna',
    title: 'Wanderlust DNA V2',
    description: 'Gettone 2.5D parallasse, slot con ghiera e flash anisotropico, pannello Lente con rifrazione WebGL',
    path: '/wanderlust-dna',
    icon: '🧿',
    status: 'ok',
  },
  {
    id: 'poi-detail',
    title: 'POI Detail',
    description: 'POI Detail con ActivityCapsuleDetailSkinAware, config-first e telemetry',
    path: '/poi-detail-verification',
    icon: '🗺️',
    status: 'ok',
  },
  {
    id: 'poi-detail-roster-integration',
    title: 'POI Detail + Roster Integration',
    description: 'POI reale con roster e slot rack interattivo da Idle Village config',
    path: '/poi-detail-roster-integration',
    icon: '🧩',
    status: 'ok',
  },
];

const TEST_PAGES: TestPageLink[] = [
  ...KIT_PAGES,
  // Skip extras whose route is already covered by a kit card.
  ...EXTRA_PAGES.filter((extra) => !KIT_PAGES.some((kit) => kit.path === extra.path)),
];

export const TestHub: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-950 p-8">
      <div className="mx-auto max-w-6xl">
        <header className="mb-8 text-center">
          <h1 className="mb-2 text-3xl font-bold text-amber-200">
            Idle Village Test Hub
          </h1>
          <p className="text-sm text-slate-400">
            Pagina centrale per verifica visuale di tutti i componenti
          </p>
        </header>

        <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {TEST_PAGES.map((page) => (
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
          <p>Test Hub · Idle Village Vertical Slice</p>
        </footer>
      </div>
    </div>
  );
};
