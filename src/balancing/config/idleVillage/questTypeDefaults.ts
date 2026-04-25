import type { QuestTypeDefinition } from './types';

/**
 * Default quest taxonomy used by Idle Village when the config does not override questTypes.
 * Keeps analytics config-first by expressing all heuristics as matcher rules.
 */
export const DEFAULT_QUEST_TYPES: Record<string, QuestTypeDefinition> = {
  combat: {
    id: 'combat',
    label: 'Operazioni d’Assalto',
    description: 'Missioni a rischio elevato che richiedono scontri diretti.',
    icon: '⚔️',
    colorClass: 'bg-rose-500',
    priority: 10,
    matchers: [
      { includes: ['combat'] },
      { includes: ['fight'] },
      { prefixes: ['quest_city', 'quest_corridor', 'quest_caccia'] },
    ],
  },
  stealth: {
    id: 'stealth',
    label: 'Incursioni d’Ombra',
    description: 'Operazioni silenziose basate su infiltrazione o furti.',
    icon: '🕯️',
    colorClass: 'bg-purple-500',
    priority: 20,
    matchers: [
      { includes: ['stealth'] },
      { includes: ['ombra'] },
      { prefixes: ['quest_ombra', 'quest_stealth'] },
    ],
  },
  exploration: {
    id: 'exploration',
    label: 'Ricognizioni',
    description: 'Spedizioni lungo i confini o in territori ignoti.',
    icon: '🗺️',
    colorClass: 'bg-sky-500',
    priority: 30,
    matchers: [
      { includes: ['explore'] },
      { includes: ['exploration'] },
      { prefixes: ['quest_frontier', 'quest_explore'] },
    ],
  },
  narrative: {
    id: 'narrative',
    label: 'Trame e Diplomazia',
    description: 'Quest basate su dialogo, negoziazione o rituali.',
    icon: '📜',
    colorClass: 'bg-amber-500',
    priority: 40,
    matchers: [
      { includes: ['dialogue'] },
      { includes: ['rituale'] },
      { prefixes: ['quest_rituale'] },
    ],
  },
  arcane: {
    id: 'arcane',
    label: 'Operazioni Arcane',
    description: 'Missioni focalizzate su nodi magici o anomalie.',
    icon: '✨',
    colorClass: 'bg-cyan-500',
    priority: 50,
    matchers: [
      { includes: ['arcane'] },
      { prefixes: ['quest_nodo', 'quest_fornaci'] },
    ],
  },
  mixed: {
    id: 'mixed',
    label: 'Missioni Ibride',
    description: 'Fallback per quest non classificate.',
    icon: '∞',
    colorClass: 'bg-slate-500',
    priority: Number.MAX_SAFE_INTEGER,
    isFallback: true,
    matchers: [],
  },
};
