/**
 * TestHub - Central navigation page for all Idle Village test pages
 */

interface TestPageLink {
  id: string;
  title: string;
  description: string;
  path: string;
  icon: string;
  status?: 'ok' | 'needs-refactor';
}

const TEST_PAGES: TestPageLink[] = [
  {
    id: 'pgcard',
    title: 'PgCard',
    description: 'Card personaggio con ritratto, HP, stamina, status',
    path: '/minimal-pgcard',
    icon: '👤',
    status: 'ok',
  },
  {
    id: 'roster',
    title: 'Roster',
    description: 'Lista eroi con sorting, filtering, drag & drop',
    path: '/minimal-roster',
    icon: '📋',
    status: 'ok',
  },
  {
    id: 'slotrack',
    title: 'SlotRack',
    description: 'Slot assegnazione residenti alle attivita',
    path: '/minimal-slotRack',
    icon: '🎰',
    status: 'ok',
  },
  {
    id: 'clock',
    title: 'Clock',
    description: 'Orologio giorno/notte con ciclo temporale',
    path: '/minimal-clock',
    icon: '🕐',
    status: 'ok',
  },
  {
    id: 'resourcehud',
    title: 'Resource HUD',
    description: 'Pannello risorse villaggio (gold, wood, food, iron)',
    path: '/minimal-resourcehud',
    icon: '📊',
    status: 'needs-refactor',
  },
  {
    id: 'jobcard',
    title: 'JobCard',
    description: 'Card attivita con ActionCardBase, progress, halo',
    path: '/minimal-jobcard',
    icon: '🪓',
    status: 'needs-refactor',
  },
  {
    id: 'questcard',
    title: 'QuestCard',
    description: 'Card quest con risk stripes, offer countdown, halo',
    path: '/minimal-questcard',
    icon: '🗡️',
    status: 'needs-refactor',
  },
  {
    id: 'skillcheck',
    title: 'Skill Check',
    description: 'Risoluzione skill check con dado d20 animato',
    path: '/minimal-skillcheck',
    icon: '🎲',
    status: 'needs-refactor',
  },
  {
    id: 'destiny-astrolabe',
    title: 'Destiny Astrolabe (NEW)',
    description: 'D100 skill check con fisica della palla, verdetti cinematici, reusable component',
    path: '/minimal-destiny-astrolabe',
    icon: '✨',
    status: 'ok',
  },
  {
    id: 'skillcheck-v6',
    title: 'Skill Check V6 Asterism (Legacy)',
    description: 'Versione HTML standalone (deprecata - usare Destiny Astrolabe)',
    path: '/minimal-skillcheck-v6',
    icon: '⭐',
    status: 'needs-refactor',
  },
  {
    id: 'outcome',
    title: 'Outcome Modal',
    description: 'Modale risultato dopo skill check',
    path: '/minimal-outcome',
    icon: '🏆',
    status: 'needs-refactor',
  },
  {
    id: 'market',
    title: 'Market',
    description: 'Card mercato per trading/acquisti',
    path: '/minimal-market',
    icon: '🏪',
    status: 'needs-refactor',
  },
  {
    id: 'integration-quest-flow',
    title: 'Quest Flow Integration',
    description: 'Flusso completo: QuestCard -> SkillCheck -> Outcome',
    path: '/minimal-integration-quest-flow',
    icon: '🔗',
    status: 'needs-refactor',
  },
  {
    id: 'integration-drag-job',
    title: 'Drag Job Integration',
    description: 'Integrazione drag & drop assegnazione job',
    path: '/minimal-integration-drag-job',
    icon: '🔗',
    status: 'needs-refactor',
  },
  {
    id: 'job-poi-roster',
    title: 'POI + Roster Integration',
    description: 'Integrazione POI job detail con roster drag & drop',
    path: '/minimal-job-poi-roster-integration',
    icon: '🗺️',
    status: 'needs-refactor',
  },
  {
    id: 'job-poi-roster-time',
    title: 'POI + Roster + Time Integration',
    description: 'Integrazione completa con time engine e reward',
    path: '/minimal-job-poi-roster-time-integration',
    icon: '⏱️',
    status: 'needs-refactor',
  },
  {
    id: 'quest-detail',
    title: 'Quest Chronicle',
    description: 'Dettaglio quest con fasi, progress bar, esito finale',
    path: '/minimal-quest-detail',
    icon: '📜',
    status: 'ok',
  },
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
