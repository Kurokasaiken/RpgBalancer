/**
 * questEditor/validation — draft diagnostics (PLAN-102 T-8).
 * Continuous evaluation gates Approve/Export only, never typing (D6).
 */
import { parseQuestScenario, type QuestScenario } from '@/balancing/config/idleVillage/quests/questScenario.schema';
import { ENGINE_ROUTED_NODE_IDS } from './editorOps';

export interface ScenarioDiagnostics {
  schemaErrors: string[];
  dangling: { from: string; to: string }[];
  unreachable: string[];
  /** true when routing lives in the engine switch — unreachable is then
   *  a lower bound (engine can reach anywhere), not a defect. */
  legacyRouted: boolean;
  engineOwned: string[];
  valid: boolean;
}

/** Declared successors of a node: plain next, option.next (CHECK: ok),
 *  and verdictTable goto/branch targets (engine v2 routing). */
function declaredTargets(n: Record<string, unknown>, strip: (t: string) => string): string[] {
  const out: string[] = [];
  const push = (t?: string) => { if (t) out.push(strip(t)); };
  push((n as { next?: string }).next);
  (n.options as { next?: string }[] | undefined)?.forEach((o) => push(o.next));
  const vt = n.verdictTable as Record<string, unknown> | undefined;
  if (vt) for (const spec of Object.values(vt)) {
    const sp = spec as { goto?: string; branches?: { goto?: string }[] };
    push(sp?.goto);
    sp?.branches?.forEach((b) => push(b?.goto));
  }
  return out;
}

const stripCheck = (t: string) => (t.startsWith('CHECK:') ? t.slice(6) : t);

/** Full diagnostic pass over the (possibly invalid) derived scenario. */
export function validateDraft(sc: QuestScenario): ScenarioDiagnostics {
  const d: ScenarioDiagnostics = { schemaErrors: [], dangling: [], unreachable: [], legacyRouted: false, engineOwned: [], valid: true };
  try { parseQuestScenario(sc); } catch (e) {
    d.schemaErrors = String(e instanceof Error ? e.message : e).split('\n').slice(0, 8);
  }
  const ids = new Set(Object.keys(sc.nodes));
  for (const [id, n] of Object.entries(sc.nodes)) {
    if (ENGINE_ROUTED_NODE_IDS.has(id)) d.engineOwned.push(id);
    for (const t of declaredTargets(n as Record<string, unknown>, stripCheck))
      if (!ids.has(t)) d.dangling.push({ from: id, to: t });
  }
  d.legacyRouted = d.engineOwned.length > 0;
  // BFS from startNode over declared + verdictTable edges
  const seen = new Set<string>([sc.startNode]);
  const q = [sc.startNode];
  while (q.length) {
    const n = sc.nodes[q.shift()!] as unknown as Record<string, unknown> | undefined;
    if (!n) continue;
    for (const t of declaredTargets(n, stripCheck)) if (!seen.has(t) && ids.has(t)) { seen.add(t); q.push(t); }
  }
  for (const id of ids) if (!seen.has(id)) d.unreachable.push(id);
  d.valid = d.schemaErrors.length === 0 && d.dangling.length === 0;
  return d;
}

/** questId-owned behaviors lost on an authored fork (T-0(b) manifest).
 *  Approve is blocked until each is waived or migrated (W-04 gate). */
export const FORK_FIDELITY_MANIFEST: Record<string, { key: string; label: string }[]> = {
  goblin: [
    { key: 'stashFlags', label: 'stash-loadout flags (hasBonusForza, hasHealing) — resolved only for questId goblin' },
    { key: 'xpAward', label: 'goblin XP award on endRun (TUNE.goblinXp)' },
    { key: 'trofeoPerso', label: 'flag trofeoPerso → fork uses objectiveLost (gates break)' },
    { key: 'trophyGold', label: 'trophy → gold conversion on return' },
    { key: 'epilogue', label: 'quest-specific epilogue copy' },
  ],
  rovine: [
    { key: 'baseDays', label: 'rovineBaseDays initial days' },
    { key: 'tesoroPerso', label: 'flag tesoroPerso → objectiveLost + bottinoOro reset' },
    { key: 'epilogue', label: 'report-style epilogue (days, man-days)' },
  ],
};
