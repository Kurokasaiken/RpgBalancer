/**
 * PLAN-085 / R-279 — Amanuense Page: schema + markup contract tests.
 * INV tags: amanuense-page (new component contract, Mode B-add).
 */
import { describe, it, expect } from 'vitest';
import { LongFormSchema, QuestNodeSchema } from '@/balancing/config/idleVillage/quests/questScenario.schema';
import {
  parseAmanuenseMarkup,
  isAmanuenseMarkupBalanced,
  amanuenseInitialLetter,
} from '@/ui/idleVillage/quests/amanuenseMarkup';
import { getAmanuenseSkinConfig } from '@/ui/idleVillage/skins/amanuenseSkinConfig';

const baseNode = {
  id: 'n1', kind: 'choice' as const, title: 'T', body: 'B',
  options: [{ id: 'o1', label: 'L', detail: 'Forza', next: 'n2' }],
};

describe('LongFormSchema', () => {
  const valid = {
    paragraphKeys: ['q.long.p1', 'q.long.p2'],
    incipitKey: 'q.long.incipit',
    bespokeInitialId: 'init-rovi-q',
    marginalia: [
      { afterParagraph: 0, kind: 'gloss' as const, lemma: 'bacche rosse', textKey: 'q.long.g1' },
      { afterParagraph: 1, kind: 'drollery' as const, drolleryId: 'snail' },
    ],
    colophon: { scribeKey: 'q.long.scribe', placeKey: 'q.long.place', complaintKey: 'q.long.ouch' },
    explicitKey: 'q.long.explicit',
  };

  // INV:amanuense-page.INV-1 — a valid long-form block is accepted on a node.
  it('accepts a valid longForm on a quest node', () => {
    const parsed = QuestNodeSchema.safeParse({ ...baseNode, longForm: valid });
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.longForm?.variant).toBe('scene');
      expect(parsed.data.longForm?.tier).toBe(2);
    }
  });

  // INV:amanuense-page.INV-2 — strict: unknown fields are rejected.
  it('rejects longForm with unknown fields or bad paragraphKeys', () => {
    expect(LongFormSchema.safeParse({ ...valid, bogus: 1 }).success).toBe(false);
    expect(LongFormSchema.safeParse({ ...valid, paragraphKeys: [] }).success).toBe(false);
    expect(LongFormSchema.safeParse({ ...valid, tier: 4 }).success).toBe(false);
  });

  // INV:amanuense-page.INV-3 — node without longForm stays valid (field optional).
  it('keeps nodes without longForm valid', () => {
    expect(QuestNodeSchema.safeParse(baseNode).success).toBe(true);
  });
});

describe('amanuenseMarkup tokenizer', () => {
  // INV:amanuense-page.INV-4 — {r|}/{g|}/{m|} produce the right segments.
  it('parses rubric, gilt and gloss tokens', () => {
    const segs = parseAmanuenseMarkup('Il {r|Capitano Orso} e le {g|frecce} del {m|bosco}.');
    expect(segs).toEqual([
      { kind: 'text', text: 'Il ' },
      { kind: 'rubric', text: 'Capitano Orso' },
      { kind: 'text', text: ' e le ' },
      { kind: 'gilt', text: 'frecce' },
      { kind: 'text', text: ' del ' },
      { kind: 'gloss', text: 'bosco' },
      { kind: 'text', text: '.' },
    ]);
  });

  // INV:amanuense-page.INV-5 — malformed markup returns null (raw fallback).
  it('rejects unbalanced, unknown or nested tokens', () => {
    expect(isAmanuenseMarkupBalanced('a {r|x} b')).toBe(true);
    expect(isAmanuenseMarkupBalanced('a {r|x b')).toBe(false);
    expect(isAmanuenseMarkupBalanced('a {x|y} b')).toBe(false);
    expect(parseAmanuenseMarkup('a {r|x b')).toBeNull();
    expect(parseAmanuenseMarkup('a {r|x {g|y} } b')).toBeNull();
    expect(parseAmanuenseMarkup('a } b')).toBeNull();
  });

  // INV:amanuense-page.INV-6 — initial letter derives from localized text.
  it('derives the drop-cap glyph from the first letter', () => {
    expect(amanuenseInitialLetter('Quando il bosco…')).toBe('Q');
    expect(amanuenseInitialLetter('  "Aldo"…')).toBe('A');
    expect(amanuenseInitialLetter('…')).toBe('?');
  });
});

describe('amanuense skin preset', () => {
  // INV:amanuense-page.INV-7 — the preset is config-driven, no standalone css.
  it('exposes the folio token contract', () => {
    const s = getAmanuenseSkinConfig();
    expect(s.coexistenceMinViewportPx).toBe(1480);
    expect(s.widths.minPx).toBe(320);
    expect(s.widths.maxPx).toBe(460);
    expect(s.readingRect.measureCh1920).toBe(48);
    expect(s.motion.ceremonyMsMax).toBe(1800);
    expect(s.palette.parchment).toMatch(/^#/);
  });
});
