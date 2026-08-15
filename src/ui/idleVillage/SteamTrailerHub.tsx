import { TestHub, type TestPageLink } from './TestHub';

/**
 * SteamTrailerHub - Grouped navigation page for all Steam teaser trailer scenes.
 *
 * Mirrors TestHub in layout and styling but only lists the trailer-related
 * test pages so they can be launched from a single hub nested under /test-hub.
 */

const TRAILER_PAGES: TestPageLink[] = [
  {
    id: 'trailer-threat-iter',
    title: 'Trailer: Threat Iter',
    description: 'Scene 1 iteration — Goblin Invasion with VFL teal/obsidian theme and POI kit',
    path: '/trailer-threat-iter',
    icon: '⚔️',
    status: 'ok',
  },
  {
    id: 'trailer-threat',
    title: 'Trailer: Threat',
    description: 'Scene 1 — Goblin Invasion with V9 Explorer Journal theme',
    path: '/trailer-threat',
    icon: '⚔️',
    status: 'ok',
  },
  {
    id: 'trailer-choice',
    title: 'Trailer: Choice',
    description: 'Scene 2 — Branching Choice with V9 Explorer Journal theme',
    path: '/trailer-choice',
    icon: '🔀',
    status: 'ok',
  },
  {
    id: 'trailer-preparation',
    title: 'Trailer: Preparation',
    description: 'Scene 3 — Hero Preparation with V9 Explorer Journal theme',
    path: '/trailer-preparation',
    icon: '🛡️',
    status: 'ok',
  },
  {
    id: 'trailer-risk',
    title: 'Trailer: Risk',
    description: 'Scene 4 — Astrolabe Risk with V9 Explorer Journal theme',
    path: '/trailer-risk',
    icon: '☸️',
    status: 'ok',
  },
  {
    id: 'trailer-consequence',
    title: 'Trailer: Consequence',
    description: 'Scene 5 — Consequence with V9 Explorer Journal theme',
    path: '/trailer-consequence',
    icon: '⚖️',
    status: 'ok',
  },
  {
    id: 'trailer-legacy',
    title: 'Trailer: Legacy',
    description: 'Scene 6 — Legacy with V9 Explorer Journal theme',
    path: '/trailer-legacy',
    icon: '🏛️',
    status: 'ok',
  },
  {
    id: 'trailer-outro',
    title: 'Trailer: Outro',
    description: 'Scene 7 — Outro CTA with V9 Explorer Journal theme',
    path: '/trailer-outro',
    icon: '🎬',
    status: 'ok',
  },
];

export const SteamTrailerHub: React.FC = () => (
  <TestHub
    title="Steam Trailer Hub"
    subtitle="All Steam teaser trailer scenes in one place"
    pages={TRAILER_PAGES}
    backTo={{ path: '/test-hub', label: '← Back to Test Hub' }}
  />
);

export default SteamTrailerHub;
