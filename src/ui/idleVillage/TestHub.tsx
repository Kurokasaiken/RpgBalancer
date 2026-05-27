/**
 * TestHub - Central navigation page for all Idle Village test pages
 *
 * This page provides links to all individual test pages for visual verification
 * of each feature area (Phase 1-10).
 */

interface TestPageLink {
  id: string;
  title: string;
  description: string;
  path: string;
  phase: number;
  icon: string;
}

const TEST_PAGES: TestPageLink[] = [
  // Phase 1: PgToken (real components)
  {
    id: 'pgcard',
    title: 'PgCard (Real)',
    description: 'Componente PgCard reale del progetto',
    path: '/minimal-pgcard',
    phase: 1,
    icon: '👤',
  },
  {
    id: 'template-pgcard',
    title: 'PgCard Template',
    description: 'Template PgCard con drag & drop pre-configurato',
    path: '/template-pgcard',
    phase: 1,
    icon: '🎯',
  },
  {
    id: 'slottedmedal',
    title: 'SlottedMedal (Real)',
    description: 'Componente SlottedMedal reale del progetto',
    path: '/minimal-slottedmedal',
    phase: 1,
    icon: '🏅',
  },
  // Phase 2: Roster
  {
    id: 'roster',
    title: 'Roster (Real)',
    description: 'Componente Roster reale del progetto',
    path: '/minimal-roster',
    phase: 2,
    icon: '📋',
  },
  {
    id: 'template-roster',
    title: 'Roster Template',
    description: 'Template Roster con sorting/filtering/drag pre-configurato',
    path: '/template-roster',
    phase: 2,
    icon: '🎯',
  },
  // Phase 3-6: All real components are in TestRosterPage
  {
    id: 'full-integration',
    title: 'TestRosterPage (Full Integration)',
    description: 'Tutti i componenti reali del progetto (Roster, SlotRack, Clock, Activity, ecc.)',
    path: '/test',
    phase: 3,
    icon: '🔗',
  },
];

// Group by phase
const GROUPED_PAGES = TEST_PAGES.reduce<Record<number, TestPageLink[]>>((acc, page) => {
  if (!acc[page.phase]) {
    acc[page.phase] = [];
  }
  acc[page.phase].push(page);
  return acc;
}, {});

const PHASE_LABELS: Record<number, string> = {
  1: 'Phase 1: PgToken',
  2: 'Phase 2: Roster',
  3: 'Phase 3: SlotRack',
  4: 'Phase 4: Clock/Time',
  5: 'Phase 5: Activity + Timer',
  6: 'Phase 6: Integration',
};

export const TestHub: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-950 p-8">
      <div className="mx-auto max-w-6xl">
        <header className="mb-12 text-center">
          <h1 className="mb-4 text-4xl font-bold text-amber-200">
            Idle Village Test Hub
          </h1>
          <p className="text-lg text-slate-400">
            Pagina centrale per verifica visuale di tutti i componenti
          </p>
          <div className="mt-4 inline-flex items-center rounded-full bg-emerald-500/10 px-4 py-2 text-sm text-emerald-300">
            <span className="mr-2">✅</span>
            <span>589/589 Test Passanti (100%)</span>
          </div>
        </header>

        {Object.entries(GROUPED_PAGES)
          .sort(([a], [b]) => Number(a) - Number(b))
          .map(([phase, pages]) => (
            <div key={phase} className="mb-12">
              <h2 className="mb-6 text-2xl font-semibold text-amber-100">
                {PHASE_LABELS[Number(phase)] || `Phase ${phase}`}
              </h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {pages.map((page) => (
                  <a
                    key={page.id}
                    href={page.path}
                    className="group block rounded-2xl border border-white/10 bg-white/5 p-6 transition-all hover:border-amber-500/50 hover:bg-white/10"
                  >
                    <div className="mb-3 text-4xl">{page.icon}</div>
                    <h3 className="mb-2 text-lg font-semibold text-white group-hover:text-amber-200">
                      {page.title}
                    </h3>
                    <p className="text-sm text-slate-400">{page.description}</p>
                    <div className="mt-4 text-xs text-slate-500 group-hover:text-slate-400">
                      {page.path}
                    </div>
                  </a>
                ))}
              </div>
            </div>
          ))}

        <footer className="mt-12 border-t border-white/10 pt-8 text-center text-sm text-slate-500">
          <p>Test Hub · Idle Village Vertical Slice</p>
          <p className="mt-1">
            Apri ogni pagina per verificare visualmente il funzionamento del componente
          </p>
        </footer>
      </div>
    </div>
  );
};
