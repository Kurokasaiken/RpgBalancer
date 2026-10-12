/**
 * Unit tests for the imprint→locale bridge (R-168):
 * `localizedScenarioById` + `applyImprintLocale` + the miniera IT overlay.
 *
 * The contract: a locale overlay is a PEER RENDER, not a different
 * scenario. The causal spine (ids, kinds, stats, risks, flags, vars,
 * verdict tables, routing, option ids, combat tuning) is untranslatable;
 * only presentation fields (title/body/transit/hints/verdictFlavor,
 * option label/detail, combat copy, intel/epilogue labels) move.
 *
 * These tests pin:
 * - coverage: every copy-bearing field in EN has an IT render;
 * - no orphans: the overlay never invents nodes, options, flags or intel;
 * - lockedFacts: the facts that make the quest mean what it means survive
 *   the render (the nine miners, the foreman, the register, the drag
 *   marks) — the offline-checkable half of narrate's facts-locking;
 * - structural identity: stripping presentation fields from EN and IT
 *   yields byte-identical graphs;
 * - the engine accepts the localized scenario and produces the same run.
 */

import { describe, expect, it } from 'vitest';
import {
  applyChoice,
  createRun,
  type QuestRunState,
} from '@/ui/idleVillage/questS1Lab/questRun';
import { createScenarioInstance as createInstance } from '@/ui/idleVillage/questS1Lab/questOffer';
import type { LabMember, QuestNode, QuestScenario, Verdict } from '@/ui/idleVillage/questS1Lab/questScenario';
import {
  localizedScenarioById,
  IMPR002_MINIERA_SCENARIO,
} from '@/balancing/config/idleVillage/quests/generation/catalog';
import { IMPR002_MINIERA_IT } from '@/balancing/config/idleVillage/quests/generation/impr002Miniera.it';

const EN = IMPR002_MINIERA_SCENARIO;
const OVERLAY = IMPR002_MINIERA_IT;
const IT = localizedScenarioById(EN.id, 'it')!;

const VERDICTS: Verdict[] = ['epicfail', 'fail', 'almost', 'win', 'bigwin'];

/* ---- structural projection: drop every field an overlay may touch --- */

function stripOption(o: NonNullable<QuestNode['options']>[number]) {
  const { label: _l, detail: _d, ...rest } = o;
  return rest;
}

function stripCombat(c: NonNullable<QuestNode['combat']>) {
  const {
    enemyName: _n,
    attackLines: _a,
    clearedText: _c,
    survivorsText: _s,
    holdingText: _h,
    ...rest
  } = c;
  return rest;
}

function stripNode(n: QuestNode) {
  const {
    title: _t,
    body: _b,
    transit: _tr,
    failHint: _f,
    previewHint: _p,
    verdictFlavor: _v,
    ...rest
  } = n;
  return {
    ...rest,
    ...(n.options && { options: n.options.map(stripOption) }),
    ...(n.combat && { combat: stripCombat(n.combat) }),
  };
}

function stripScenario(s: QuestScenario) {
  const {
    title: _t,
    flavour: _f,
    beats: _b,
    intelLabels: _i,
    epilogue: _e,
    ...rest
  } = s;
  return {
    ...rest,
    ...(s.offer && { offer: { ...s.offer, objective: undefined } }),
    nodes: Object.fromEntries(
      Object.entries(s.nodes).map(([id, n]) => [id, stripNode(n)]),
    ),
  };
}

describe('imprint locale overlay — coverage (every EN copy field has an IT render)', () => {
  it('every scenario node has title + body in the overlay', () => {
    for (const [id] of Object.entries(EN.nodes)) {
      const o = OVERLAY.nodes[id];
      expect(o, `overlay missing node '${id}'`).toBeDefined();
      expect(o!.title, `'${id}' missing IT title`).toBeTruthy();
      expect(o!.body, `'${id}' missing IT body`).toBeTruthy();
    }
  });

  it('optional copy fields are rendered when EN has them', () => {
    for (const [id, node] of Object.entries(EN.nodes)) {
      const o = OVERLAY.nodes[id]!;
      if (node.transit) expect(o.transit, `'${id}' missing IT transit`).toBeTruthy();
      if (node.failHint) expect(o.failHint, `'${id}' missing IT failHint`).toBeTruthy();
      if (node.previewHint) expect(o.previewHint, `'${id}' missing IT previewHint`).toBeTruthy();
      if (node.verdictFlavor) {
        for (const band of VERDICTS) {
          if (node.verdictFlavor[band]) {
            expect(
              o.verdictFlavor?.[band],
              `'${id}' missing IT verdictFlavor.${band}`,
            ).toBeTruthy();
          }
        }
      }
    }
  });

  it('every option has IT label + detail, keyed by the SAME option id', () => {
    for (const [id, node] of Object.entries(EN.nodes)) {
      for (const opt of node.options ?? []) {
        const oo = OVERLAY.nodes[id]!.options?.[opt.id];
        expect(oo, `'${id}'.options['${opt.id}'] missing from overlay`).toBeDefined();
        expect(oo!.label, `'${id}'.'${opt.id}' missing IT label`).toBeTruthy();
        expect(oo!.detail, `'${id}'.'${opt.id}' missing IT detail`).toBeTruthy();
      }
    }
  });

  it('combat copy fields are rendered when EN carries them', () => {
    for (const [id, node] of Object.entries(EN.nodes)) {
      if (!node.combat) continue;
      const oc = OVERLAY.nodes[id]!.combat;
      if (node.combat.enemyName) expect(oc?.enemyName, `'${id}' missing IT enemyName`).toBeTruthy();
      for (const band of VERDICTS) {
        if (node.combat.attackLines?.[band]) {
          expect(oc?.attackLines?.[band], `'${id}' missing IT attackLines.${band}`).toBeTruthy();
        }
      }
      if (node.combat.clearedText) expect(oc?.clearedText, `'${id}' missing IT clearedText`).toBeTruthy();
      if (node.combat.survivorsText) expect(oc?.survivorsText, `'${id}' missing IT survivorsText`).toBeTruthy();
      if (node.combat.holdingText) expect(oc?.holdingText, `'${id}' missing IT holdingText`).toBeTruthy();
    }
  });

  it('scenario-level copy is rendered (title, flavour, objective, intel, epilogue)', () => {
    expect(OVERLAY.title).toBeTruthy();
    expect(OVERLAY.flavour).toBeTruthy();
    expect(OVERLAY.objective).toBeTruthy();
    for (const key of Object.keys(EN.intelLabels ?? {})) {
      expect(OVERLAY.intelLabels?.[key], `missing IT intelLabel '${key}'`).toBeTruthy();
    }
    for (const t of EN.epilogue?.titles ?? []) {
      const hit = OVERLAY.epilogue?.titles?.find((e) => e.flag === t.requiresFlag);
      expect(hit, `missing IT epilogue title for '${t.requiresFlag}'`).toBeTruthy();
    }
    for (const l of EN.epilogue?.lore ?? []) {
      const hit = OVERLAY.epilogue?.lore?.find((e) => e.flag === l.requiresFlag);
      expect(hit, `missing IT epilogue lore for '${l.requiresFlag}'`).toBeTruthy();
    }
  });
});

describe('imprint locale overlay — no orphans (the render invents nothing)', () => {
  it('overlay node ids are a subset of scenario node ids', () => {
    for (const id of Object.keys(OVERLAY.nodes)) {
      expect(EN.nodes[id], `overlay invents node '${id}'`).toBeDefined();
    }
  });

  it('overlay option ids exist on their node', () => {
    for (const [id, o] of Object.entries(OVERLAY.nodes)) {
      const valid = new Set((EN.nodes[id]?.options ?? []).map((x) => x.id));
      for (const optId of Object.keys(o.options ?? {})) {
        expect(valid.has(optId), `overlay invents option '${id}'.'${optId}'`).toBe(true);
      }
    }
  });

  it('overlay intel/epilogue keys exist in the scenario', () => {
    for (const key of Object.keys(OVERLAY.intelLabels ?? {})) {
      expect(EN.intelLabels?.[key], `overlay invents intel '${key}'`).toBeDefined();
    }
    const titleFlags = new Set((EN.epilogue?.titles ?? []).map((t) => t.requiresFlag));
    for (const e of OVERLAY.epilogue?.titles ?? []) {
      expect(titleFlags.has(e.flag), `overlay invents epilogue title '${e.flag}'`).toBe(true);
    }
    const loreFlags = new Set((EN.epilogue?.lore ?? []).map((l) => l.requiresFlag));
    for (const e of OVERLAY.epilogue?.lore ?? []) {
      expect(loreFlags.has(e.flag), `overlay invents epilogue lore '${e.flag}'`).toBe(true);
    }
  });
});

describe('imprint locale overlay — lockedFacts survive the render', () => {
  it('every locked fact term appears in the rendered node body', () => {
    for (const [nodeId, terms] of Object.entries(OVERLAY.lockedFacts)) {
      const body = (IT.nodes[nodeId]?.body ?? '').toLowerCase();
      for (const term of terms) {
        expect(
          body.includes(term.toLowerCase()),
          `'${nodeId}' IT body lost locked fact '${term}'`,
        ).toBe(true);
      }
    }
  });
});

describe('imprint locale overlay — structural identity (same spine, different words)', () => {
  it('stripping presentation fields yields byte-identical graphs', () => {
    expect(stripScenario(IT)).toEqual(stripScenario(EN));
  });

  it('option ids, verdict keys and flag vocabulary are identical', () => {
    for (const [id, node] of Object.entries(EN.nodes)) {
      const itNode = IT.nodes[id]!;
      expect(itNode.kind).toBe(node.kind);
      expect((itNode.options ?? []).map((o) => o.id)).toEqual(
        (node.options ?? []).map((o) => o.id),
      );
      expect(Object.keys(itNode.verdictTable ?? {}).sort()).toEqual(
        Object.keys(node.verdictTable ?? {}).sort(),
      );
    }
  });

  it('a scripted run in IT reaches the same flags as EN', () => {
    const party: LabMember[] = [
      { id: 'm1', name: 'm1', role: 'leader', stats: { perc: 85, int: 80, str: 60, con: 70, agi: 65, cha: 70 }, hp: 100 },
      { id: 'm2', name: 'm2', role: 'member', stats: { perc: 60, int: 60, str: 80, con: 80, agi: 60, cha: 55 }, hp: 100 },
      { id: 'm3', name: 'm3', role: 'member', stats: { perc: 70, int: 75, str: 55, con: 60, agi: 60, cha: 80 }, hp: 100 },
      { id: 'm4', name: 'm4', role: 'bodyguard', stats: { perc: 60, int: 55, str: 70, con: 85, agi: 50, cha: 50 }, hp: 100 },
    ];
    const mk = (s: QuestScenario): QuestRunState =>
      createRun({
        party,
        seed: 7,
        questId: 'gen',
        scenarioInstance: createInstance(s, { dangerScale: 1, rewardScale: 1 }, 'gen'),
      });
    const enRun = mk(EN);
    const itRun = mk(IT);
    // Same scripted opening: accept the foreman's crew.
    applyChoice(enRun, 'mi-accetta');
    applyChoice(itRun, 'mi-accetta');
    expect(itRun.nodeId).toBe(enRun.nodeId);
    expect(itRun.vars).toEqual(enRun.vars);
    expect([...itRun.flags].sort()).toEqual([...enRun.flags].sort());
  });
});

describe('localizedScenarioById — accessor semantics', () => {
  it('returns the canonical scenario for en and for unregistered pairs', () => {
    expect(localizedScenarioById(EN.id, 'en')).toBe(EN);
    // palude has no overlay yet — falls back, still playable.
    expect(localizedScenarioById('gen-impr002-palude', 'it')).toBeDefined();
  });
});
