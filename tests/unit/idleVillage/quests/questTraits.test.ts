/**
 * Unit tests for the quest trait registry (PLAN-026 T5 — «twist del
 * party»). Traits are a CLOSED id set: scenario data referencing an
 * unregistered id is a data error, not a silently dead gate. The
 * registry carries player-facing copy + doc notes; mechanics live in
 * the scenario data that gates on the ids.
 */

import { describe, expect, it } from 'vitest';
import {
  QUEST_TRAITS,
  QuestTraitSchema,
  isQuestTrait,
} from '@/balancing/config/idleVillage/quests/questTraits';
import { parseQuestScenario } from '@/balancing/config/idleVillage/quests/questScenario.schema';
import { GENERATED_CATALOG } from '@/balancing/config/idleVillage/quests/generation/catalog';
import { PARTY_PRESETS } from '@/ui/idleVillage/questS1Lab/questScenario';

/** Minimal valid scenario skeleton for trait-validation probes. */
const base = () =>
  JSON.parse(
    JSON.stringify(Object.values(GENERATED_CATALOG)[0]),
  ) as Parameters<typeof parseQuestScenario>[0];

describe('QUEST_TRAITS — registry', () => {
  it('contiene i 3 tratti del prototipo, tutti validi e kebab-case', () => {
    expect(Object.keys(QUEST_TRAITS).sort()).toEqual(['avido', 'prudente', 'scavezzacollo']);
    for (const [id, t] of Object.entries(QUEST_TRAITS)) {
      expect(t.id).toBe(id);
      expect(QuestTraitSchema.safeParse(t).success).toBe(true);
    }
    expect(isQuestTrait('avido')).toBe(true);
    expect(isQuestTrait('inesistente')).toBe(false);
  });
});

describe('schema — il registro è chiuso', () => {
  it('rifiuta requiresTrait sconosciuto su un\'opzione', () => {
    const s = base();
    const nodeId = Object.keys(s.nodes).find(
      (id) => s.nodes[id].options?.some((o: { requiresTrait?: string }) => o.requiresTrait),
    );
    const node = s.nodes[nodeId!];
    const opt = node.options!.find((o: { requiresTrait?: string }) => o.requiresTrait)!;
    opt.requiresTrait = 'fantasma';
    expect(() => parseQuestScenario(s)).toThrow(/fantasma.*non registrato/);
  });

  it('rifiuta requiresTrait sconosciuto su un armRoll', () => {
    const s = base();
    expect(s.armRolls?.length).toBeGreaterThan(0);
    s.armRolls![0]!.requiresTrait = 'ombra';
    expect(() => parseQuestScenario(s)).toThrow(/ombra.*non registrato/);
  });

  it('accetta i tratti registrati (catalogo intero valido)', () => {
    for (const s of Object.values(GENERATED_CATALOG)) {
      expect(() => parseQuestScenario(s)).not.toThrow();
    }
  });
});

describe('copertura — ogni gate del catalogo punta a un tratto reale', () => {
  it('tutti i requiresTrait/hiddenIfTrait/armRoll usati sono nel registro', () => {
    const used = new Set<string>();
    for (const s of Object.values(GENERATED_CATALOG)) {
      for (const roll of s.armRolls ?? []) if (roll.requiresTrait) used.add(roll.requiresTrait);
      for (const n of Object.values(s.nodes)) {
        for (const o of n.options ?? []) {
          if (o.requiresTrait) used.add(o.requiresTrait);
          if (o.hiddenIfTrait) used.add(o.hiddenIfTrait);
        }
      }
    }
    expect(used.size).toBeGreaterThan(0);
    for (const t of used) expect(isQuestTrait(t), `trait '${t}' non registrato`).toBe(true);
    // E ogni trait del registro è usato da qualche parte — niente tratti morti.
    for (const t of Object.keys(QUEST_TRAITS)) {
      expect(used.has(t), `trait '${t}' definito ma mai usato nel catalogo`).toBe(true);
    }
  });
});

describe('preset lab — i tratti sono assegnati e registrati', () => {
  it('ogni trait sui preset è nel registro', () => {
    const carriers = PARTY_PRESETS.flatMap((p) => p.members).filter((m) => m.traits?.length);
    expect(carriers.length).toBeGreaterThan(0);
    for (const m of carriers) {
      for (const t of m.traits!) expect(isQuestTrait(t), `${m.name}: '${t}'`).toBe(true);
    }
  });
});
