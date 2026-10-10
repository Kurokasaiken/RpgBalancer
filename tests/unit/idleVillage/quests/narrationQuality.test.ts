/**
 * Unit tests for the PLAN-027 r001 quality gates — the deterministic
 * half of the converged pipeline.
 *
 *   - trait/stat/creature/internal-id leaks are mechanically decidable
 *     and rejected;
 *   - kit-level rules (label/title uniqueness, rival-in-flavour,
 *     prize-in-objective) catch what no single node can carry;
 *   - the recurrence counter FLAGS «allowed but lazy» for human review
 *     — a flag, never a rejection;
 *   - the arc contract (Pass 0) must cover every node exactly once;
 *   - locale parity: EN draft and IT re-render agree on the declared
 *     locale-invariant fields;
 *   - REGRESSION: the Director-rejected race-miniera kit fails the new
 *     gate — the class of defect it exhibited is now locked out.
 */

import { describe, expect, it } from 'vitest';
import { PASSO_MONTANO_KIT } from '@/balancing/config/idleVillage/quests/generation/kits';
import { generateRaceScenario } from '@/balancing/config/idleVillage/quests/generation/raceGimmick';
import { MINIERA_VOCAB } from '@/balancing/config/idleVillage/quests/generation/domainVocabs';
import { briefsForScenario } from '@/balancing/config/idleVillage/quests/generation/narrative/sceneBrief';
import {
  contractIssues,
  QuestArcContractSchema,
  contractRoleFor,
  type QuestArcContract,
} from '@/balancing/config/idleVillage/quests/generation/narrative/arcContract';
import {
  localeParityIssues,
  validateKitCopy,
  validateNodeCopy,
  type NarratedNodeCopy,
} from '@/balancing/config/idleVillage/quests/generation/narrative/validateCopy';
import { MINIERA_RACE_KIT as REJECTED_KIT } from '../../../fixtures/race-miniera-rejected.kit';

const SCENARIO = generateRaceScenario(PASSO_MONTANO_KIT);
const PREFIX = PASSO_MONTANO_KIT.prefix;
const BRIEFS = briefsForScenario(SCENARIO, MINIERA_VOCAB, PREFIX);

const brief = (key: string) => {
  const b = BRIEFS.find((x) => x.nodeKey === key);
  if (!b) throw new Error(`brief mancante per ${key}`);
  return b;
};

const VALID: NarratedNodeCopy = {
  title: 'La galleria si chiude',
  body: 'La campana del turno suona una volta sola. Sotto, il buio sale a incontrare chi scende.',
  failHint: 'il puntellamento cigola sotto il peso',
  option: { label: 'Scendi nella vena', detail: 'percezione — il buio racconta dove corre la galleria' },
  verdictFlavor: { win: 'La roccia tiene.', fail: 'Un puntello scricchiola.' },
};

/* ------------------------------------------------------------------ */
/* Node-level leaks — PLAN-027 gate upgrades                           */
/* ------------------------------------------------------------------ */

describe('validateNodeCopy — leak meccanici', () => {
  it('respinge un trait id usato come aggettivo narrativo («se sei avido»)', () => {
    const bad = { ...VALID, body: 'Scendi se sei avido, altrimenti resta.' };
    const v = validateNodeCopy(bad, brief('viaA'), MINIERA_VOCAB);
    expect(v.ok).toBe(false);
    if (!v.ok) expect(v.issues.some((i) => i.rule === 'trait-leak')).toBe(true);
  });

  it('respinge stat nominate in prosa, le ammette in option.detail (convenzione authored)', () => {
    const inBody = { ...VALID, body: 'Serve Forza e Agilità per passare.' };
    const v1 = validateNodeCopy(inBody, brief('viaA'), MINIERA_VOCAB);
    expect(v1.ok).toBe(false);
    if (!v1.ok) expect(v1.issues.some((i) => i.rule === 'stat-leak')).toBe(true);
    const inDetail = { ...VALID, option: { label: 'Forza', detail: 'Forza. Chiudete la corsa qui — o peggiorate il conto.' } };
    expect(validateNodeCopy(inDetail, brief('viaA'), MINIERA_VOCAB).ok).toBe(true);
  });

  it('respinge creature fuori whitelist («bestia di galleria» non è più ammessa)', () => {
    const bad = { ...VALID, body: 'Il ruggito di una bestia di galleria si avvicina.' };
    const v = validateNodeCopy(bad, brief('viaA'), MINIERA_VOCAB);
    expect(v.ok).toBe(false);
    if (!v.ok) expect(v.issues.some((i) => i.rule === 'creature')).toBe(true);
  });

  it('accetta la creatura whitelisted del dominio («cane da galleria cieco»)', () => {
    const ok = { ...VALID, body: 'Un cane da galleria cieco fiuta il vostro passo e si allontana.' };
    expect(validateNodeCopy(ok, brief('viaA'), MINIERA_VOCAB).ok).toBe(true);
  });
});

describe('validateNodeCopy — locale EN', () => {
  const EN_VALID: NarratedNodeCopy = {
    title: 'The gallery narrows',
    body: 'The shift bell rings once. Below, the dark rises to meet whoever descends.',
    failHint: 'the timber groans under the weight',
    option: { label: 'Take the low gallery', detail: 'Perception — the dark tells where the gallery runs' },
  };

  it('accetta copy EN valida', () => {
    expect(validateNodeCopy(EN_VALID, brief('viaA'), MINIERA_VOCAB, 'en').ok).toBe(true);
  });

  it('respinge vietati EN («sea» in miniera), creature EN fuori whitelist, stat EN in prosa', () => {
    const sea = { ...EN_VALID, body: 'A sound like a distant sea moves through the shaft.' };
    const v1 = validateNodeCopy(sea, brief('viaA'), MINIERA_VOCAB, 'en');
    expect(v1.ok).toBe(false);
    if (!v1.ok) expect(v1.issues.some((i) => i.rule === 'forbidden' && i.detail.includes('sea'))).toBe(true);

    const beast = { ...EN_VALID, body: 'A gallery beast howls in the dark.' };
    const v2 = validateNodeCopy(beast, brief('viaA'), MINIERA_VOCAB, 'en');
    expect(v2.ok).toBe(false);
    if (!v2.ok) expect(v2.issues.some((i) => i.rule === 'creature')).toBe(true);

    const stat = { ...EN_VALID, body: 'You will need Strength to pass.' };
    const v3 = validateNodeCopy(stat, brief('viaA'), MINIERA_VOCAB, 'en');
    expect(v3.ok).toBe(false);
    if (!v3.ok) expect(v3.issues.some((i) => i.rule === 'stat-leak')).toBe(true);
  });
});

/* ------------------------------------------------------------------ */
/* Kit-level gate — what no single node can carry                      */
/* ------------------------------------------------------------------ */

const RACE_META = {
  title: 'Corsa nella Galleria',
  flavour: 'Tu e Mordo il Picconiere correte per lo stesso premio: chi arriva secondo paga.',
  objective: 'Recupera la Chiave d’Acciaio e portala al fattore prima che Mordo la raggiunga.',
  intelId: 'segnale-tagliata',
  names: { place: 'Galleria Bassa', rival: 'Mordo il Picconiere', prize: 'Chiave d’Acciaio' },
};

const kitCopy = (overrides: Record<string, Partial<NarratedNodeCopy>> = {}) =>
  Object.fromEntries(
    BRIEFS.map((b) => [
      b.nodeKey,
      {
        title: `Scena ${b.nodeKey}`,
        body: `Corpo della scena ${b.nodeKey}.`,
        option: { label: `Via di ${b.nodeKey}`, detail: 'dettaglio' },
      },
    ]),
  ) as Record<string, NarratedNodeCopy>;

describe('validateKitCopy — regole che nessun nodo singolo può portare', () => {
  it('accetta un kit coerente', () => {
    const { issues } = validateKitCopy(RACE_META, kitCopy(), MINIERA_VOCAB, { gimmick: 'race' });
    expect(issues).toEqual([]);
  });

  it('respinge label opzioni duplicate («Scorciatoia pericolosa» ×4)', () => {
    const copy = kitCopy();
    copy.viaA = { ...copy.viaA, option: { label: 'Scorciatoia pericolosa', detail: 'x' } };
    copy.taglio = { ...copy.taglio, option: { label: 'Scorciatoia pericolosa', detail: 'y' } };
    const { issues } = validateKitCopy(RACE_META, copy, MINIERA_VOCAB, { gimmick: 'race' });
    expect(issues.some((i) => i.rule === 'duplicate' && i.nodeKey === 'taglio')).toBe(true);
  });

  it('respinge titoli duplicati', () => {
    const copy = kitCopy();
    copy.passo = { ...copy.passo, title: copy.partenza.title };
    const { issues } = validateKitCopy(RACE_META, copy, MINIERA_VOCAB, { gimmick: 'race' });
    expect(issues.some((i) => i.rule === 'duplicate' && i.nodeKey === 'passo')).toBe(true);
  });

  it('respinge un flavour che non nomina il rivale — la gara deve leggersi gara', () => {
    const meta = { ...RACE_META, flavour: 'Devi scendere e risalire prima che il soffitto ceda.' };
    const { issues } = validateKitCopy(meta, kitCopy(), MINIERA_VOCAB, { gimmick: 'race' });
    expect(issues.some((i) => i.rule === 'meta' && i.detail.includes('Mordo'))).toBe(true);
  });

  it('respinge premio e obiettivo incoerenti', () => {
    const meta = { ...RACE_META, objective: 'Porta il registro dei turni al fattore.' };
    const { issues } = validateKitCopy(meta, kitCopy(), MINIERA_VOCAB, { gimmick: 'race' });
    expect(issues.some((i) => i.rule === 'meta' && i.detail.includes('Chiave'))).toBe(true);
  });

  it('ricorrenza vocab >3: FLAG per review umana, non reject', () => {
    const copy = kitCopy();
    for (const k of ['viaA', 'viaB', 'sprint', 'taglio']) {
      copy[k] = { ...copy[k], body: `${copy[k].body} La campana del turno suona.` };
    }
    const { issues, flags } = validateKitCopy(RACE_META, copy, MINIERA_VOCAB, { gimmick: 'race' });
    expect(issues).toEqual([]);
    expect(flags.some((f) => f.term === 'campana del turno' && f.count >= 4)).toBe(true);
  });
});

/* ------------------------------------------------------------------ */
/* Arc contract — Pass 0                                               */
/* ------------------------------------------------------------------ */

const CONTRACT: QuestArcContract = {
  arcSummary: 'A race through a failing mine gallery against a rival digger for the same prize.',
  competition: 'The player and the rival run the same route; first at the goal takes the prize.',
  opposition: { name: 'Mordo', role: 'the rival digger — always one gallery ahead or behind' },
  phases: [
    { nodes: ['partenza', 'viaA', 'viaB'], role: 'the start: choose the route and feel the rival close' },
    { nodes: ['tappa', 'sprint', 'passo', 'taglio', 'balzo'], role: 'the middle leg: gain or lose ground' },
    { nodes: ['imboscata'], role: 'the twist: something armed hunts the runners' },
    { nodes: ['vetta', 'sicuro', 'varco'], role: 'the summit: prize taken, now carry it out' },
    { nodes: ['fine', 'sconfitta'], role: 'the tally: cost and haul, not a moral' },
  ],
  propGlossary: [
    { term: 'registro dei turni', meaning: 'the company ledger of shifts — proves where each miner was' },
  ],
  endingFacts: {
    win: ['you reached the prize first', 'the rival arrived second'],
    lose: ['the rival reached the prize first'],
  },
  lockedFacts: ['the prize is the Chiave d’Acciaio', 'Mordo is the rival'],
};

describe('arc contract — Pass 0', () => {
  it('valida lo schema e il ruolo per nodo', () => {
    expect(QuestArcContractSchema.parse(CONTRACT)).toBeTruthy();
    expect(contractRoleFor(CONTRACT, 'sicuro')).toMatch(/summit/);
    expect(contractRoleFor(CONTRACT, 'assente')).toBeUndefined();
  });

  it('copre ogni nodo esattamente una volta — scoperture e doppie coperture sono errori', () => {
    expect(contractIssues(CONTRACT, BRIEFS)).toEqual([]);
    const uncovered = { ...CONTRACT, phases: CONTRACT.phases.map((p) => ({ ...p, nodes: p.nodes.filter((n) => n !== 'fine') })) };
    expect(contractIssues(uncovered, BRIEFS).some((i) => i.includes('fine'))).toBe(true);
    const doubled = { ...CONTRACT, phases: [...CONTRACT.phases, { nodes: ['fine'], role: 'extra' }] };
    expect(contractIssues(doubled, BRIEFS).some((i) => i.includes('fine'))).toBe(true);
    const ghost = { ...CONTRACT, phases: [{ nodes: ['fantasma'], role: 'x' }] };
    expect(contractIssues(ghost, BRIEFS).some((i) => i.includes('fantasma'))).toBe(true);
  });
});

/* ------------------------------------------------------------------ */
/* Locale parity — EN draft vs IT re-render                            */
/* ------------------------------------------------------------------ */

describe('localeParityIssues — campi locale-invarianti', () => {
  const kit = (over: Partial<Record<string, unknown>> = {}) => ({
    id: 'miniera', prefix: 'rn', intelId: 'segnale-tagliata',
    names: { place: 'Galleria', rival: 'Mordo', prize: 'Chiave' },
    copy: { a: {}, b: {} },
    ...over,
  });
  it('parità pulita su kit gemelli', () => {
    expect(localeParityIssues(kit() as never, kit() as never)).toEqual([]);
  });
  it('segnala nomi/prefix/id divergenti e chiavi copy divergenti', () => {
    const issues = localeParityIssues(
      kit() as never,
      kit({ names: { place: 'Galleria', rival: 'Bordo', prize: 'Chiave' }, copy: { a: {} } }) as never,
    );
    expect(issues.some((i) => i.includes('names.rival'))).toBe(true);
    expect(issues.some((i) => i.includes('copy keys'))).toBe(true);
  });
});

/* ------------------------------------------------------------------ */
/* REGRESSION — the Director-rejected kit fails the new gate           */
/* ------------------------------------------------------------------ */

describe('regressione — il kit bocciato dal Director fallisce il nuovo gate', () => {
  it('ogni difetto del vecchio artefatto è ora un issue deterministico o un flag', () => {
    const nodeIssues = [];
    for (const [key, copy] of Object.entries(REJECTED_KIT.copy)) {
      const b = brief(key);
      const v = validateNodeCopy(copy, b, MINIERA_VOCAB, 'it');
      if (!v.ok) nodeIssues.push(...v.issues);
    }
    const rules = new Set(nodeIssues.map((i) => i.rule));
    /* «bestia di galleria» — non più whitelisted: creature rule. */
    expect(rules.has('creature')).toBe(true);
    /* «se sei avido» — trait leak. */
    expect(rules.has('trait-leak')).toBe(true);
    /* Le stat nel kit bocciato vivevano solo in option.detail — dove la
     * convenzione authored le ammette: il gate non le conta come leak. */
    expect(rules.has('stat-leak')).toBe(false);

    const kit = validateKitCopy(
      { title: REJECTED_KIT.title, flavour: REJECTED_KIT.flavour, objective: REJECTED_KIT.objective, intelId: REJECTED_KIT.intelId, names: REJECTED_KIT.names },
      REJECTED_KIT.copy as unknown as Record<string, NarratedNodeCopy>,
      MINIERA_VOCAB,
      { gimmick: 'race' },
    );
    /* Label monocorde e premio-vs-obiettivo incoerenti. */
    expect(kit.issues.some((i) => i.rule === 'duplicate')).toBe(true);
    expect(kit.issues.some((i) => i.rule === 'meta')).toBe(true);
    /* «bestia di galleria» ×7 e «registro dei turni»: flaggati per review. */
    expect(kit.flags.length).toBeGreaterThan(0);
  });
});
