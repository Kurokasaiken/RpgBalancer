/**
 * Unit tests for the offline narration pipeline (PLAN-026 T4 / P3).
 *
 * No provider calls — the deterministic half of the pipeline:
 *   - briefsForScenario distills mechanical facts from an emitted
 *     scenario, in node order, deterministically;
 *   - validateNodeCopy disposes of provider output: schema, banned
 *     domain imagery, digits (the UI owns numbers), required fields;
 *   - extractJson tolerates fenced/prose-wrapped replies;
 *   - a narrated kit — same skeleton, different copy — produces a
 *     scenario whose MECHANICS are bit-identical to the hand kit:
 *     the model can decorate, never alter the rules.
 */

import { describe, expect, it } from 'vitest';
import {
  MINIERA_FLOOD_KIT,
  FLOOD_MINIERA_SCENARIO,
} from '@/balancing/config/idleVillage/quests/generation/catalog';
import { generateFloodVault, type FloodDomainKit } from '@/balancing/config/idleVillage/quests/generation/floodVault';
import { DOMAIN_VOCABS, MINIERA_VOCAB, MARE_VOCAB } from '@/balancing/config/idleVillage/quests/generation/domainVocabs';
import { briefsForScenario } from '@/balancing/config/idleVillage/quests/generation/narrative/sceneBrief';
import { promptForNode } from '@/balancing/config/idleVillage/quests/generation/narrative/narrationPrompt';
import {
  extractJson,
  validateNodeCopy,
  NarratedNodeCopySchema,
} from '@/balancing/config/idleVillage/quests/generation/narrative/validateCopy';
import { parseQuestScenario } from '@/balancing/config/idleVillage/quests/questScenario.schema';

const SCENARIO = FLOOD_MINIERA_SCENARIO;
const VOCAB = MINIERA_VOCAB;
const PREFIX = MINIERA_FLOOD_KIT.prefix;
const BRIEFS = briefsForScenario(SCENARIO, VOCAB, PREFIX);

const brief = (key: string) => {
  const b = BRIEFS.find((x) => x.nodeKey === key);
  if (!b) throw new Error(`brief mancante per ${key}`);
  return b;
};

/* ------------------------------------------------------------------ */
/* SceneBrief compilation                                             */
/* ------------------------------------------------------------------ */

describe('sceneBrief — compilazione dei fatti meccanici', () => {
  it('emette un brief per ogni nodo dello scenario, in ordine di beat', () => {
    const nodeIds = Object.keys(SCENARIO.nodes).sort();
    const briefIds = BRIEFS.map((b) => b.nodeId).sort();
    expect(briefIds).toEqual(nodeIds);
    const beats = BRIEFS.map((b) => b.beat);
    expect([...beats].sort((a, b) => a - b)).toEqual(beats);
  });

  it('è deterministico: stesso scenario → stessi brief', () => {
    expect(briefsForScenario(SCENARIO, VOCAB, PREFIX)).toEqual(BRIEFS);
  });

  it('riporta i fatti meccanici senza toccare la copy', () => {
    const gabbia = brief('gabbia');
    expect(gabbia.kind).toBe('check');
    expect(gabbia.facts.join(' ')).toMatch(/check su/);
    // i fatti citano i verdetti, mai il testo authored
    expect(gabbia.facts.join(' ')).toMatch(/verdetti:/);
    expect(gabbia.facts.join(' ')).not.toMatch(/cigola/);
  });

  it('hub node dichiara transit + gating delle opzioni', () => {
    const hub = brief('crocevia');
    expect(hub.outputShape).toContain('transit');
    expect(hub.facts.join(' ')).toMatch(/trait 'prudente'/);
    expect(hub.facts.join(' ')).toMatch(/flag 'cassa-madre'/);
    expect(hub.facts.join(' ')).toMatch(/info '/);
  });

  it('le opzioni condizionali non sono spoilerate: mustConvey lo esige', () => {
    const hub = brief('crocevia');
    expect(hub.mustConvey.join(' ')).toMatch(/spoiler|anticipate/i);
  });

  it('la whitelist mayInvent viene dal vocabolario dominio', () => {
    const m = brief('vena').mayInvent.join('\n');
    expect(m).toMatch(/vena/);
    expect(m).toMatch(/fattore|compagnia/);
    // e i banned sono quelli del dominio, non di un altro
    expect(brief('vena').forbidden).toEqual(VOCAB.vietati);
  });
});

/* ------------------------------------------------------------------ */
/* Prompt shape                                                       */
/* ------------------------------------------------------------------ */

describe('narrationPrompt — prompt compatto e autonomo', () => {
  const meta = { gimmick: 'gimmick di prova', mood: 'sobrio' };

  it('contiene fatti, vincoli, whitelist e vietati — nient\'altro', () => {
    const { prompt } = promptForNode(brief('vena'), VOCAB, meta);
    expect(prompt).toMatch(/FATTI MECCANICI/);
    expect(prompt).toMatch(/DEVE COMUNICARE/);
    expect(prompt).toMatch(/PUOI INVENTARE/);
    expect(prompt).toMatch(/VIETATO/);
    expect(prompt).toMatch(/JSON valido/);
    // compattezza per provider con cap payload (~40KB)
    expect(prompt.length).toBeLessThan(6000);
  });

  it('dichiara la output shape del nodo', () => {
    const check = promptForNode(brief('vena'), VOCAB, meta).prompt;
    expect(check).toMatch(/failHint/);
    expect(check).toMatch(/"option"/);
    const info = promptForNode(brief('crocevia'), VOCAB, meta).prompt;
    expect(info).toMatch(/"transit"/);
  });
});

/* ------------------------------------------------------------------ */
/* Validator — the deterministic gate                                 */
/* ------------------------------------------------------------------ */

const VALID_COPY = {
  title: 'La gabbia cigola',
  body: 'La gabbia scende nel buio e il buio sale a incontrarla.',
  failHint: 'le guide cigolano forte',
  option: { label: 'Scendi in gabbia', detail: 'perc — rischio caduta' },
  verdictFlavor: { win: 'Fondo liscio.', fail: 'La gabbia sbatte.' },
};

describe('validateNodeCopy — il gate deterministico', () => {
  it('accetta copy valida', () => {
    const v = validateNodeCopy(VALID_COPY, brief('gabbia'), VOCAB);
    expect(v).toEqual({ ok: true, copy: VALID_COPY });
  });

  it('respinge termini vietati del dominio (mare in miniera)', () => {
    const bad = { ...VALID_COPY, body: 'Il rumore di un’onda si sente nel pozzo.' };
    const v = validateNodeCopy(bad, brief('gabbia'), VOCAB);
    expect(v.ok).toBe(false);
    if (!v.ok) expect(v.issues.some((i) => i.rule === 'forbidden' && i.detail.includes('onda'))).toBe(true);
  });

  it('word boundary: «maestra» non triggera «mare»', () => {
    const ok = { ...VALID_COPY, body: 'La vecchia maestra dei turni aspetta in cima.' };
    expect(validateNodeCopy(ok, brief('gabbia'), VOCAB).ok).toBe(true);
  });

  it('respinge cifre nel testo — i numeri li mostra l\'UI', () => {
    const bad = { ...VALID_COPY, body: 'Rischio del 35% di caduta.' };
    const v = validateNodeCopy(bad, brief('gabbia'), VOCAB);
    expect(v.ok).toBe(false);
    if (!v.ok) expect(v.issues.some((i) => i.rule === 'digits')).toBe(true);
  });

  it('esige i campi dichiarati dall\'outputShape (failHint/option/transit)', () => {
    const missing = { title: 'x', body: 'y' };
    const v1 = validateNodeCopy(missing, brief('gabbia'), VOCAB);
    expect(v1.ok).toBe(false);
    if (!v1.ok) {
      expect(v1.issues.some((i) => i.detail.includes('failHint'))).toBe(true);
      expect(v1.issues.some((i) => i.detail.includes('option'))).toBe(true);
    }
    const v2 = validateNodeCopy(missing, brief('crocevia'), VOCAB);
    expect(v2.ok).toBe(false);
    if (!v2.ok) expect(v2.issues.some((i) => i.detail.includes('transit'))).toBe(true);
  });

  it('respinge payload malformati e campi extra', () => {
    expect(validateNodeCopy({ title: 42 }, brief('gabbia'), VOCAB).ok).toBe(false);
    const extra = { ...VALID_COPY, inventedRule: 'nuovo check su luck' };
    const v = validateNodeCopy(extra, brief('gabbia'), VOCAB);
    expect(v.ok).toBe(false);
  });

  it('il dominio cambia il gate: «galleria» è vietata a mare, lecita in miniera', () => {
    const copy = { ...VALID_COPY, body: 'La galleria bassa scende ancora.' };
    expect(validateNodeCopy(copy, brief('gabbia'), MINIERA_VOCAB).ok).toBe(true);
    const mareBrief = briefsForScenario(SCENARIO, MARE_VOCAB, PREFIX).find((b) => b.nodeKey === 'gabbia')!;
    expect(validateNodeCopy(copy, mareBrief, MARE_VOCAB).ok).toBe(false);
  });
});

/* ------------------------------------------------------------------ */
/* extractJson — tolleranza sulle risposte provider                    */
/* ------------------------------------------------------------------ */

describe('extractJson', () => {
  it('accetta JSON puro, fenced, e risposte con prosa intorno', () => {
    expect(extractJson('{"a":1}')).toEqual({ a: 1 });
    expect(extractJson('```json\n{"a":1}\n```')).toEqual({ a: 1 });
    expect(extractJson('Ecco il testo:\n{"a":1}\nFine.')).toEqual({ a: 1 });
  });
  it('lancia su risposte senza oggetto', () => {
    expect(() => extractJson('mi rifiuto di rispondere')).toThrow();
  });
});

/* ------------------------------------------------------------------ */
/* Mechanical immutability — the copy cannot alter the rules          */
/* ------------------------------------------------------------------ */

describe('immutabilità meccanica', () => {
  it('un kit narrato produce meccaniche identiche al kit a mano', () => {
    /* Sostituisci TUTTA la copy con stringhe diverse — la struttura
     * dello scenario emesso (grafo, stats, rischi, vars, goto, gating)
     * deve restare identica: il modello decora, non governa. */
    const copy = Object.fromEntries(
      Object.keys(MINIERA_FLOOD_KIT.copy).map((k) => [
        k,
        {
          title: `T-${k}`,
          body: `Corpo narrato per ${k}.`,
          transit: `transito ${k}`,
          failHint: `pericolo ${k}`,
          option: { label: `opzione ${k}`, detail: `dettaglio ${k}` },
          verdictFlavor: { win: `vinto ${k}`, fail: `perso ${k}` },
          outcomeLog: { win: `log ${k}` },
        },
      ]),
    ) as FloodDomainKit['copy'];
    const kit: FloodDomainKit = { ...MINIERA_FLOOD_KIT, title: 'Titolo diverso', copy };
    const narrated = generateFloodVault(kit);
    const manual = generateFloodVault(MINIERA_FLOOD_KIT);

    expect(parseQuestScenario(narrated)).toBeTruthy();
    // stessa versione scenario: la copy è esclusa dall'hash meccanico
    expect(narrated.scenarioVersion).toBe(manual.scenarioVersion);
    // stessa struttura di nodi e gating
    for (const [id, node] of Object.entries(manual.nodes)) {
      const n = narrated.nodes[id];
      expect(n.kind).toBe(node.kind);
      expect(n.stats).toEqual(node.stats);
      expect(n.risk).toEqual(node.risk);
      expect(n.options?.map((o) => [o.id, o.next, o.requiresTrait, o.requiresInfo, o.requiresFlag])).toEqual(
        node.options?.map((o) => [o.id, o.next, o.requiresTrait, o.requiresInfo, o.requiresFlag]),
      );
      const mech = (t: typeof node.verdictTable) =>
        JSON.stringify(t, (k, v) => (k === 'log' ? undefined : v));
      expect(mech(n.verdictTable)).toBe(mech(node.verdictTable));
    }
    expect(narrated.armRolls).toEqual(manual.armRolls);
    expect(narrated.initialVars).toEqual(manual.initialVars);
  });

  it('lo schema narrato accetta solo le chiavi del kit (niente meccaniche)', () => {
    expect(NarratedNodeCopySchema.safeParse(VALID_COPY).success).toBe(true);
    // un modello che prova a "modificare le regole" viene scartato
    expect(
      NarratedNodeCopySchema.safeParse({ ...VALID_COPY, stats: ['luck'], verdictTable: {} }).success,
    ).toBe(false);
  });

  it('tutti i domini noti hanno vocabolario completo', () => {
    for (const v of Object.values(DOMAIN_VOCABS)) {
      expect(v.vietati.length).toBeGreaterThan(3);
      expect(v.coerenza.length).toBeGreaterThan(2);
      expect(v.luoghi.length).toBeGreaterThan(2);
    }
  });
});
