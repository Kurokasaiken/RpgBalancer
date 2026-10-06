/**
 * Theatre fixtures — canonical, lab-independent scenario data (PLAN-021 T-002).
 *
 * These fixtures describe ONLY what the theatre needs to render: a sequence of
 * nodes, a party, log lines. They are not a quest format — they exist to prove
 * the read-model can be populated without the theatre synthesising fields.
 */

import type { TheatreNodeView, TheatrePartyMemberView } from './theatreContract';

/** A fixture scenario: the ordered node list plus the static run context. */
export interface TheatreFixture {
  id: string;
  title: string;
  objective?: string;
  party: TheatrePartyMemberView[];
  nodes: Omit<TheatreNodeView, 'state'>[];
}

/** Demo party — four slots, mixed states to exercise the strip. */
const DEMO_PARTY: TheatrePartyMemberView[] = [
  { id: 'pg-eroe', name: 'Eroe', role: 'Leader', state: 'alive' },
  { id: 'pg-vedetta', name: 'Vedetta', role: 'Scout', state: 'injured' },
  { id: 'pg-maga', name: 'Maga', role: 'Support', state: 'alive' },
  { id: 'pg-bruto', name: 'Bruto', role: 'Vanguard', state: 'dead' },
];

/**
 * Main demo scenario — travel, one bifurcation, a check, a checkpoint and a
 * reward. Every narrative beat that PLAN-021's stage renderer must show.
 */
export const theatreDemoFixture: TheatreFixture = {
  id: 'theatre-demo-rovine',
  title: 'La cripta delle rondini',
  objective: 'Recupera la prova del patto antico',
  party: DEMO_PARTY,
  nodes: [
    {
      nodeId: 'n-departure',
      kind: 'timed',
      title: 'Partenza',
      text: 'La compagnia lascia il villaggio alle prime luci.',
      resolvedSummary: 'Partenza all’alba',
    },
    {
      nodeId: 'n-river',
      kind: 'timed',
      title: 'Il guado',
      text: 'Un guado gonfio di pioggia rallenta la marcia.',
      resolvedSummary: 'Guado superato a fatica',
    },
    {
      nodeId: 'n-approach',
      kind: 'choice',
      title: 'Le sentinelle',
      text: 'Le rovine sono sorvegliate da sentinelle corvine appollaiate sulle mura.',
      options: [
        {
          id: 'sneak',
          label: 'Infiltrarsi oltre le sentinelle',
          preview: 'Richiede furtività — la via più lenta ma la più sicura.',
        },
        {
          id: 'force',
          label: 'Forzare l’ingresso',
          preview: 'Veloce, ma ogni corvo nel nido saprà che siete qui.',
        },
      ],
      retreatPreview: 'Rinunciate: tornate al villaggio con le mani vuote.',
    },
    {
      nodeId: 'n-sneak-check',
      kind: 'check',
      title: 'Check: infiltrazione',
      text: 'Muoversi tra le macerie senza svegliare lo stormo.',
      checkPreview: { probabilityPct: 62, note: 'La vedetta ferita zoppica — il gruppo è più lento.' },
      retreatPreview: 'Rinunciate ora: niente prova, nessun rischio ulteriore.',
    },
    {
      nodeId: 'n-hall',
      kind: 'consequence',
      title: 'Il salone',
      text: 'Dentro. Il salone è un labirinto di ragnatele e ossa antiche.',
      resolvedSummary: 'Superato il salone delle ragnatele',
    },
    {
      nodeId: 'n-checkpoint',
      kind: 'checkpoint',
      title: 'Checkpoint',
      text: 'Finora nessun ferito nuovo. Davanti si sente un respiro profondo.',
      options: [
        { id: 'continue', label: 'Proseguire', preview: 'La cripta è vicina — o così sembra.' },
      ],
      retreatPreview: 'Ritiro con quanto avete: la quest fallisce ma il bottino raccolto resta vostro.',
    },
    {
      nodeId: 'n-vault',
      kind: 'timed',
      title: 'La cripta',
      text: 'La cripta si apre su un bagliore verdastro.',
      resolvedSummary: 'Raggiunta la cripta',
    },
    {
      nodeId: 'n-reward',
      kind: 'reward',
      title: 'La prova',
      text: 'La prova del patto antico è nelle vostre mani.',
    },
  ],
};

/**
 * Adversarial fixture — the world moved while the run was suspended: the
 * current decision node is blocked by a runtime-provided reason (D-open-6).
 */
export const theatreBlockedFixture: TheatreFixture = {
  id: 'theatre-demo-blocked',
  title: 'Il ponte crollato',
  objective: 'Attraversa la gola',
  party: DEMO_PARTY,
  nodes: [
    {
      nodeId: 'b-approach',
      kind: 'timed',
      title: 'Verso la gola',
      text: 'Il sentiero scende verso il ponte di corda.',
      resolvedSummary: 'Arrivati alla gola',
    },
    {
      nodeId: 'b-choice',
      kind: 'choice',
      title: 'Il ponte non c’è più',
      text: 'Le corde pendono mozzate. L’altro lato è irraggiungibile.',
      options: [{ id: 'wait', label: 'Attendere la riparazione', preview: 'Potrebbe volerci un giorno intero.' }],
      retreatPreview: 'Tornate indietro per la via lunga.',
    },
  ],
};

/**
 * Unsupported fixture — a node kind the renderer does not know, to prove the
 * explicit `unsupported` state instead of a silent fallback.
 */
export const theatreUnsupportedFixture: TheatreFixture = {
  id: 'theatre-demo-arcane',
  title: 'Il rituale incompreso',
  objective: 'Capire cosa sta succedendo',
  party: DEMO_PARTY,
  nodes: [
    {
      nodeId: 'u-ritual',
      kind: 'arcaneRitual',
      title: 'Il cerchio',
      text: 'Un cerchio di pietre levigate che il gruppo non sa leggere.',
    },
  ],
};
