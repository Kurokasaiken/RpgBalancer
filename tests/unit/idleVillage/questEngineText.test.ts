/**
 * PLAN-067 T-A13b (R-234) — the texts the quest ENGINE writes itself, in it-IT.
 *
 *   1. STATIC — every player-facing literal in `questRun.ts` (read with the TypeScript parser) has a
 *      catalogue entry: a new engine line cannot ship untranslated.
 *   2. BEHAVIOUR — templates with parameters, composed sentences and nested pieces translate; English
 *      is left byte-identical.
 *   3. DYNAMIC — full simulated runs under it-IT leave no English line in the log, the last event or
 *      the ending text (authored prose included: it goes through `questContentLocale`).
 */
import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';
import { afterEach, describe, expect, it } from 'vitest';
import { ENGINE_TEXT_IT, engineText } from '@/ui/idleVillage/questS1Lab/questEngineText';
import { setQuestContentLocale } from '@/balancing/config/idleVillage/quests/questContentLocale';
import { applyChoice, availableOptions, createRun, type QuestRunState } from '@/ui/idleVillage/questS1Lab/questRun';
import { GOBLIN_PRESETS, ROVINE_PRESETS } from '@/ui/idleVillage/questS1Lab/questLabPresets';

afterEach(() => setQuestContentLocale('en'));

/** Player-facing multi-word literals of the engine, templates normalised to `{0}`, `{1}`… */
function engineLiterals(): string[] {
  const file = path.resolve(__dirname, '../../../src/ui/idleVillage/questS1Lab/questRun.ts');
  const sf = ts.createSourceFile(file, fs.readFileSync(file, 'utf8'), ts.ScriptTarget.Latest, true);
  const out = new Set<string>();
  const render = (n: ts.Node): string | null => {
    if (ts.isStringLiteral(n) || ts.isNoSubstitutionTemplateLiteral(n)) return n.text;
    if (ts.isTemplateExpression(n)) {
      let s = n.head.text;
      n.templateSpans.forEach((sp, i) => { s += `{${i}}${sp.literal.text}`; });
      return s;
    }
    return null;
  };
  const insideThrow = (n: ts.Node) => { for (let p = n.parent; p; p = p.parent) if (ts.isThrowStatement(p)) return true; return false; };
  const visit = (n: ts.Node) => {
    const t = render(n);
    if (t !== null && t.includes(' ') && /[A-Za-z’']{2,}.*[A-Za-z’']{2,}/.test(t) && !insideThrow(n)) out.add(t);
    ts.forEachChild(n, visit);
  };
  visit(sf);
  return [...out];
}

/** Literals that are not prose shown to the player (type annotations, comparison keys…). */
const NOT_PLAYER_FACING = new Set<string>([]);

describe('engine texts — catalogue completeness (static)', () => {
  it('every player-facing literal of questRun.ts has an it-IT entry', () => {
    // `{N:A|B}` is a regex constraint of the catalogue, not part of the engine's literal.
    const known = new Set(ENGINE_TEXT_IT.map(([en]) => en.replace(/\{(\d+):[^}]*\}/g, '{$1}')));
    const missing = engineLiterals().filter((t) => !known.has(t) && !NOT_PLAYER_FACING.has(t));
    expect({ missing }).toEqual({ missing: [] });
  });
});

describe('engine texts — behaviour', () => {
  it('English is returned untouched', () => {
    setQuestContentLocale('en');
    expect(engineText('Potion used, but no one needed it.')).toBe('Potion used, but no one needed it.');
  });

  // INV:R-234-engine-text-translated — under it-IT the engine's own lines (wounds, checks, loot, endings,
  // composed endings) are Italian; parameters, nested pieces and several sentences all translate.
  it('translates templates, nested pieces and composed sentences', () => {
    setQuestContentLocale('it-IT');
    expect(engineText('Potion used, but no one needed it.')).toBe('Pozione usata, ma a nessuno serviva.');
    expect(engineText('Mara is wounded.')).toBe('Mara è ferito.');
    expect(engineText('Examine the ground: Perception + Strength → WIN (62 vs roll 40).')).toBe(
      'Examine the ground: Percezione + Forza → VITTORIA (62 contro tiro 40).',
    );
    expect(engineText('+2 days — the current drags you half a mile downstream.')).toBe('+2 giorni — la corrente ti trascina mezzo miglio a valle.');
    expect(engineText('+1 day — the choice made.')).toBe('+1 giorno — la scelta fatta.');
    expect(engineText('goblin chest: lost in the run.')).toBe('forziere goblin: perso nella corsa.');
    expect(engineText('Goblins down: 2. 4 remain.')).toBe('Goblin abbattuti: 2. Ne restano 4.');
    expect(engineText('Mara dies — at «Iron and ash».')).toBe('Mara muore — presso «Iron and ash».');
    expect(engineText('The goblin trophy stayed in the ditch. You bring home: war loot. Experience: +30 XP.')).toBe(
      'Il trofeo goblin è rimasto nel fosso. Porti a casa: bottino di guerra. Esperienza: +30 PE.',
    );
  });
});

/** English function words: a line with two of them is English. */
const looksEnglish = (s: string) => (s.match(/\b(the|you|your|and|with|from|is|are|they|them|his|her)\b/gi) ?? []).length >= 2;

/** Everything the player reads along a run: log, last event, check cards, option buttons. */
function playThrough(questId: 'goblin' | 'rovine', seed: number): { run: QuestRunState; seen: string[] } {
  const presets = questId === 'goblin' ? GOBLIN_PRESETS : ROVINE_PRESETS;
  const run = createRun(presets[0].id, seed, questId);
  const seen: string[] = [];
  const read = () => {
    seen.push(run.lastEvent);
    for (const e of run.log) seen.push(e.text);
    for (const c of run.checkQueue) seen.push(c.title, c.flavor ?? '', c.authoredText ?? '', c.outcomeText ?? '');
    for (const o of availableOptions(run)) seen.push(o.label, o.detail);
  };
  for (let step = 0; step < 120 && !run.ended; step += 1) {
    const options = availableOptions(run).filter((o) => !o.disabled);
    if (!options.length) break;
    applyChoice(run, options[Math.abs(seed + step) % options.length].id);
    read();
  }
  return { run, seen };
}

describe('engine texts — simulated runs in Italian (dynamic)', () => {
  it.each([['goblin'], ['rovine']] as const)('%s: no English text in the log, cards, last event or option buttons', (questId) => {
    setQuestContentLocale('it-IT');
    const english: string[] = [];
    for (const seed of [1, 2, 3, 5, 8, 13, 21, 34]) {
      for (const text of playThrough(questId, seed).seen) {
        if (looksEnglish(text) || /\b(Turn \d|turn \d|remain\b|HP\b|Continue|Fight —)/.test(text)) english.push(text);
      }
    }
    expect({ english: [...new Set(english)] }).toEqual({ english: [] });
  });
});
