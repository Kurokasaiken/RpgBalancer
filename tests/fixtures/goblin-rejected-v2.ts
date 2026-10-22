/**
 * goblin-rejected-v2 — the r008 regression fixture: a deliberately
 * broken kit where each node exhibits a specific defect class that the
 * deterministic gate must hard-reject.
 *
 * Fixture contract (r008 §A.4): `expected` maps nodeKey → the hard
 * rules validateNodeCopyR8 MUST report. The test runs the real
 * validator — never a claim made before the run.
 *
 * Covered defect classes:
 *   - pre-reveal-leak        (reveal term in a framing field)
 *   - banned-setting         (revoked setting term anywhere)
 *   - invented-proper-noun   (capitalized mid-sentence name off-list)
 *   - option-mechanical-leak (stat/bonus in an action-only label)
 *   - ui-telemetry-leak      (kill tally prose / HP vocabulary)
 *   - epicfail-missing-somatic (paid epicfail without injury anchor)
 *   - closer-shape           (tally-shaped closing line)
 *   - direct-loot-gate       (option on a recovery:'direct' node)
 *   - unsupported-outcome-event (foreign-band binding + assertion
 *     mismatch; the third case — a dropped sidecar assertion — is
 *     owned by the blocking outcome-entailment Critic, not the
 *     deterministic gate)
 *   - title-lock             (free title where the contract locks one)
 */

import type { ValidationIssue } from '@/balancing/config/idleVillage/quests/generation/narrative/validateCopy';

export const GOBLIN_REJECTED_V2: Record<string, unknown> = {
  'esplora': {
    title: 'La torre di Acropole',
    body: 'Il sentiero scende verso il guado, poi costeggia la strada dei carri. Più avanti, un masso copre il varco.',
    transit: 'Gli alberi chiudono la luce alle vostre spalle.',
    /* → banned-setting (guado, strada, carri, masso) + invented-proper-noun (Acropole) */
  },
  'tracce-per': {
    title: 'Esamina il terreno',
    body: 'Vi piegate sul suolo e trovate subito un filo di campanelli teso a mezza gamba — la trappola è già scoperta.',
    option: { label: 'Esamina il terreno' },
    verdictFlavor: { win: 'Le impronte disegnano una traccia obliqua.' },
    /* → pre-reveal-leak ('campanell*' nel body: il filo è payload del verdetto) */
  },
  'tracce-perfor': {
    title: 'Esamina dall’alto',
    body: 'Salite la quercia fino alla chioma.',
    option: { label: 'Esamina dall’alto' },
    verdictFlavor: {
      win: {
        text: 'Dall’alto scorgete il fumo del campo.',
        effectBindings: [
          /* foreign-band binding: 'fumo-sulla-radura' è un effetto BIGWIN */
          { assertion: 'scorgete il fumo del campo', effectId: 'fumo-sulla-radura' },
          /* assertion mismatch: 'il ramo cede' non è nel testo */
          { assertion: 'il ramo cede sotto il peso', effectId: 'fumo-tra-i-rami' },
        ],
      },
    },
    /* → unsupported-outcome-event ×2 */
  },
  'bottino': {
    title: 'Il bottino segreto',
    body: 'Trovate il fagotto e lo recuperate.',
    option: { label: 'Prendi il bottino (bonus gratis)' },
    /* → title-lock («Ciò che era nascosto» atteso) + direct-loot-gate
     *   (option su recovery:'direct') + option-mechanical-leak (bonus) */
  },
  'stealth': {
    title: 'Muoviti nell’ombra',
    body: 'Avanzate piegati nella penombra.',
    option: { label: 'Carica con Forza per il bonus alto' },
    /* → option-mechanical-leak ('forza' + 'bonus' nella label) */
  },
  'combattimento': {
    title: 'Ferro e cenere',
    body: 'Il ferro canta nella notte.',
    attackLines: {
      bigwin: 'Due goblin crollano insieme sotto il fendente.',
      win: 'Il colpo arriva su legno e scudi.',
      almost: 'Il taglio morde di striscio.',
      fail: 'Il colpo muore sul cuoio.',
      epicfail: 'La cenere tradisce il tallone.',
    },
    /* → ui-telemetry-leak ('due goblin crollano' = conteggio da UI) */
  },
  'incalza-check': {
    title: 'Incalza i fuggiaschi',
    body: 'Correte sotto le fronde basse.',
    option: { label: 'Incalza i fuggiaschi' },
    verdictFlavor: {
      epicfail: 'La luce della radura si spegne dietro di voi e un senso di sconfitta vi riempie il petto.',
    },
    /* → epicfail-missing-somatic (nessuna ancora: scivol*|batt*|roccia|sangu*|fiato) */
  },
  'agguato': {
    title: 'L’imboscata',
    body: 'I superstiti vi aspettavano al guado per riaprire la strada ai carri dei mercanti.',
    /* → banned-setting (guado, strada, carri, mercanti) */
  },
  'fine': {
    title: 'Cenere fredda',
    body: 'La notte è passata.',
    closingLine: 'Così la spedizione è finita: contate il bottino e i morti, una lezione per il villaggio.',
    /* → closer-shape (':' + 'così' opener + 'conta'/'lezion*'/'villaggio') */
  },
};

/** The hard rules each node MUST produce — asserted in the test. */
export const GOBLIN_REJECTED_V2_EXPECTED: Record<string, ValidationIssue['rule'][]> = {
  'esplora': ['banned-setting', 'invented-proper-noun'],
  'tracce-per': ['pre-reveal-leak'],
  'tracce-perfor': ['unsupported-outcome-event'],
  'bottino': ['title-lock', 'direct-loot-gate', 'option-mechanical-leak'],
  'stealth': ['option-mechanical-leak'],
  'combattimento': ['ui-telemetry-leak'],
  'incalza-check': ['epicfail-missing-somatic'],
  'agguato': ['banned-setting'],
  'fine': ['closer-shape'],
};
