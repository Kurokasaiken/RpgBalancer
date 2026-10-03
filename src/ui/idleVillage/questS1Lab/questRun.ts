/**
 * questRun — run engine for the S1 lab quest «La cassa delle sementi».
 *
 * Quest-specific state machine, deliberately NOT a general engine.
 * Implements the Director-approved risk model (desiderata rev.2):
 * verdict → per-slot wound/death risk, bodyguard interception,
 * 5% death save, wipe = lose everything, leader alive = reward.
 */

import { DEFAULT_QUEST_SKILL_CHECK_CONFIG } from '@/balancing/config/idleVillage/quests/questSkillCheckConfig';
import { PARTY_PRESETS, PRIMARY_STATS, SCENARIO_NODES, START_NODE } from './questScenario';
import type { LabMember, LabStat, QuestNode } from './questScenario';

/** Five-verdict scale, reusing the Astrolabe vocabulary. */
export type Verdict = 'epicfail' | 'fail' | 'almost' | 'win' | 'bigwin';

export type QuestOutcome = 'running' | 'reward' | 'survived' | 'fled' | 'wipe';

export interface RuntimeMember extends LabMember {
  hp: number;
  maxHp: number;
  wounded: boolean;
  dead: boolean;
}

export interface LogEntry {
  kind:
    | 'NODE'
    | 'CHOICE'
    | 'CHECK'
    | 'WOUND'
    | 'DEATH'
    | 'DEATH_SAVE'
    | 'INTERCEPT'
    | 'INFO'
    | 'LOOT'
    | 'HARM'
    | 'RETREAT'
    | 'QUEST_END';
  text: string;
}

export interface QuestRunState {
  seed: number;
  rngCalls: number;
  presetId: string;
  nodeId: string;
  party: RuntimeMember[];
  gold: number;
  loot: string[];
  info: string[];
  flags: string[];
  /** Escalating danger inside the camp: 0 quieto → 1 sospetto → 2 allarme → 3 risveglio. */
  noise: number;
  /** Derived: noise >= 2 applies the difficulty penalty to checks. */
  alarm: boolean;
  objectiveDone: boolean;
  ended: boolean;
  outcome: QuestOutcome;
  /** What the last resolution produced — shown to the player before the next node. */
  lastEvent: string;
  /** Last resolved check — drives the astrolabe cinematic overlay in the lab UI. */
  lastCheck?: ResolvedCheck;
  /** All checks resolved by the latest player action, in order — the UI plays
   *  each cinematic in sequence instead of showing only the last one. */
  checkQueue: ResolvedCheck[];
  log: LogEntry[];
}

/** A resolved check shown to the player as an astrolabe cinematic. */
export interface ResolvedCheck {
  title: string;
  verdict: Verdict;
  /** Success bound after clamps — the canonical `s` the roll is tested against. */
  score: number;
  /** The D100 result (1-100). */
  rollPct: number;
  /** Worst harm the check inflicted — the astrolabe paints it in the fail zones. */
  harm: 'none' | 'wound' | 'death';
  /** Node base risk, passed to the astrolabe so wound/death bands stay proportional. */
  woundPct: number;
  deathPct: number;
}

/* ------------------------------------------------------------------ */
/* Seeded RNG (mulberry32) — deterministic per seed + call count.      */
/* ------------------------------------------------------------------ */

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Draw the next uniform [0,1) value; mutates rngCalls so runs stay deterministic per seed. */
export function roll(state: QuestRunState): number {
  state.rngCalls += 1;
  return mulberry32(state.seed + state.rngCalls)();
}

/* ------------------------------------------------------------------ */
/* Tunables — mock values, all provisional and easy to tune.            */
/* ------------------------------------------------------------------ */

const TUNE = {
  deathSaveChance: 0.05,
  woundedRiskBonus: 5, // pp added to wound+death risk when already wounded
  winRiskMod: -5, // win/bigwin reduce wound & death risk
  incidentChance: 0.25,
  incidentWoundHpLoss: 2,
  woundHpLoss: 3,
  hp: 10,
  alarmDifficultyBonus: 10, // pp the party score loses while alarm is up
  bigwinBand: 5, // lowest N rolls of the D100 = triumph
  almostBand: 5, // N rolls just past the success bound = near-miss
};

/**
 * Canonical clamps + epicfail tail (questSkillCheckConfig.backgroundResolution).
 * NOTE: the lab's bigwin/almost bands are FLAT (TUNE.*Band = 5 rolls each),
 * per the Director's 5-lowest / 5-past / 5-highest rule — the canonical spec
 * uses a bigwin fraction of the success band and a wider near-miss band.
 */
const CHECK_BANDS = DEFAULT_QUEST_SKILL_CHECK_CONFIG.backgroundResolution;

/** Per-slot extra risk (percentage points) on top of the node's base. */
const SLOT_RISK: Record<string, { wound: number; death: number }> = {
  bodyguard: { wound: 10, death: 5 }, // exposed role
  leader: { wound: -5, death: -1 }, // protected position
  member: { wound: 0, death: 0 },
};

/* ------------------------------------------------------------------ */
/* Check resolution                                                     */
/* ------------------------------------------------------------------ */

const STAT_LABELS: Record<LabStat, string> = {
  perc: 'Percezione',
  int: 'Intelligenza',
  str: 'Forza',
  con: 'Costituzione',
  agi: 'Agilità',
  cha: 'Carisma',
};

/**
 * Group check score: best living member per stat, averaged.
 * Composition matters because different approaches use different stats.
 */
function groupScore(state: QuestRunState, stats: LabStat[]): number {
  const alive = state.party.filter((m) => !m.dead);
  if (alive.length === 0 || stats.length === 0) return 0;
  const total = stats.reduce(
    (sum, s) => sum + Math.max(...alive.map((m) => m.stats[s])),
    0,
  );
  const score = total / stats.length;
  return state.alarm ? score - TUNE.alarmDifficultyBonus : score;
}

/**
 * Verdict from a D100 die against the success bound — the Director's flat
 * 5/5/5 rule: the 5 lowest rolls are bigwin, the 5 rolls just past the bound
 * are almost, the top tail (r ≥ epicFailThreshold = 96) is epicfail.
 * Epicfail is checked first, mirroring the canonical resolver.
 */
function verdictFromRoll(die: number, successBound: number): Verdict {
  if (die >= CHECK_BANDS.epicFailThreshold) return 'epicfail';
  if (die <= TUNE.bigwinBand) return 'bigwin';
  if (die <= successBound) return 'win';
  if (die <= successBound + TUNE.almostBand) return 'almost';
  return 'fail';
}

/** Success bound clamped to the canonical floor/ceiling. */
function clampSuccessBound(score: number): number {
  return Math.min(CHECK_BANDS.successCeiling, Math.max(CHECK_BANDS.successFloor, score));
}

interface HarmEvent {
  memberId: string;
  kind: 'wound' | 'death';
}

/**
 * Roll per-slot harm for a skill check.
 * Bodyguard rule (rev.2): while a living bodyguard exists, ALL harms rolled
 * on other members are redirected to the bodyguard — even several in one check.
 * Death save (5%) turns any death outcome into a wound.
 */
function applyHarm(
  state: QuestRunState,
  harms: HarmEvent[],
  interceptable: boolean,
): HarmEvent['kind'][] {
  const applied: HarmEvent['kind'][] = [];
  const bodyguard = state.party.find((m) => m.role === 'bodyguard' && !m.dead);
  for (const harm of harms) {
    let target = state.party.find((m) => m.id === harm.memberId);
    if (!target || target.dead) continue;
    if (interceptable && bodyguard && target.id !== bodyguard.id) {
      state.log.push({
        kind: 'INTERCEPT',
        text: `${bodyguard.name} si frappone e subisce il colpo destinato a ${target.name}.`,
      });
      target = bodyguard;
    }
    if (harm.kind === 'death') {
      // Death save — 5%: survives, wounded.
      if (roll(state) < TUNE.deathSaveChance) {
        target.wounded = true;
        state.log.push({
          kind: 'DEATH_SAVE',
          text: `${target.name} è a terra… e si rialza. Death save riuscito.`,
        });
        applied.push('wound');
        continue;
      }
      target.dead = true;
      state.log.push({ kind: 'DEATH', text: `${target.name} è morto.` });
      applied.push('death');
    } else {
      target.wounded = true;
      target.hp = Math.max(1, target.hp - TUNE.woundHpLoss);
      state.log.push({ kind: 'WOUND', text: `${target.name} è ferito.` });
      applied.push('wound');
    }
  }
  return applied;
}

/**
 * Roll harm for every living member against a check's risk table — one
 * independent D100 per slot (death band, then wound band), matching the
 * canonical per-member risk model of mission_planner_math_spec §harm.
 * @returns the worst harm actually suffered, for the astrolabe cinematic.
 */
function rollCheckHarms(
  state: QuestRunState,
  node: QuestNode,
  verdict: Verdict,
): 'none' | 'wound' | 'death' {
  const base = node.risk ?? { wound: 0, death: 0 };
  const harms: HarmEvent[] = [];
  for (const m of state.party) {
    if (m.dead) continue;
    const slot = SLOT_RISK[m.role];
    let wound = base.wound + slot.wound;
    let death = base.death + slot.death;
    if (m.wounded) {
      wound += TUNE.woundedRiskBonus;
      death += TUNE.woundedRiskBonus;
    }
    if (verdict === 'win' || verdict === 'bigwin') {
      wound += TUNE.winRiskMod;
      death += TUNE.winRiskMod;
    }
    const r = roll(state) * 100;
    if (r < Math.max(0, death)) harms.push({ memberId: m.id, kind: 'death' });
    else if (r < Math.max(0, death) + Math.max(0, wound)) harms.push({ memberId: m.id, kind: 'wound' });
  }
  // bigwin: downgrade every death to wound. epicfail: upgrade wounds to deaths.
  const adjusted = harms.map((h) =>
    verdict === 'bigwin' && h.kind === 'death'
      ? { ...h, kind: 'wound' as const }
      : verdict === 'epicfail' && h.kind === 'wound'
        ? { ...h, kind: 'death' as const }
        : h,
  );
  const applied = applyHarm(state, adjusted, true);
  return applied.includes('death') ? 'death' : applied.includes('wound') ? 'wound' : 'none';
}

/* ------------------------------------------------------------------ */
/* Engine                                                               */
/* ------------------------------------------------------------------ */

/** Create a fresh run from a preset + seed. */
export function createRun(presetId: string, seed: number): QuestRunState {
  const preset = PARTY_PRESETS.find((p) => p.id === presetId) ?? PARTY_PRESETS[0];
  const party: RuntimeMember[] = preset.members.map((m) => ({
    ...m,
    hp: TUNE.hp,
    maxHp: TUNE.hp,
    wounded: false,
    dead: false,
  }));
  const state: QuestRunState = {
    seed,
    rngCalls: 0,
    presetId: preset.id,
    nodeId: START_NODE,
    party,
    gold: preset.gold,
    loot: [],
    info: [],
    flags: [],
    noise: 0,
    alarm: false,
    objectiveDone: false,
    ended: false,
    outcome: 'running',
    lastEvent: 'La spedizione parte per il Passo del Corvo.',
    checkQueue: [],
    log: [{ kind: 'NODE', text: 'Partenza — obiettivo: riportare la cassa delle sementi.' }],
  };
  return state;
}

function allDead(state: QuestRunState): boolean {
  return state.party.every((m) => m.dead);
}

function leader(state: QuestRunState): RuntimeMember | undefined {
  return state.party.find((m) => m.role === 'leader');
}

function endRun(state: QuestRunState, outcome: QuestOutcome, text: string): void {
  state.ended = true;
  state.outcome = outcome;
  if (outcome === 'wipe') {
    state.loot = [];
    state.info = [];
    state.log.push({ kind: 'QUEST_END', text: 'Nessuno torna. Si perde tutto.' });
  } else {
    state.log.push({ kind: 'QUEST_END', text });
  }
  state.lastEvent = text;
}

/** Player chooses to flee — quest failed, loot kept (wipe already handled). */
export function flee(state: QuestRunState): QuestRunState {
  if (state.ended) return state;
  state.log.push({ kind: 'RETREAT', text: 'La spedizione si ritira.' });
  endRun(state, 'fled', 'Fuggite verso il villaggio con quanto avete raccolto. La quest è fallita.');
  return state;
}

/** Use a consumable from the merchant (mock inventory flags). */
export function drinkPotion(state: QuestRunState, flag: 'hasPozione'): QuestRunState {
  if (state.ended || !state.flags.includes(flag)) return state;
  state.flags = state.flags.filter((f) => f !== flag);
  const target = state.party.find((m) => !m.dead && (m.wounded || m.hp < m.maxHp));
  if (target) {
    target.wounded = false;
    target.hp = target.maxHp;
    state.log.push({ kind: 'INFO', text: `Pozione usata: ${target.name} è di nuovo in forze.` });
  } else {
    state.log.push({ kind: 'INFO', text: 'Pozione usata, ma nessuno ne aveva bisogno.' });
  }
  return state;
}

interface CheckResult {
  verdict: Verdict;
  score: number;
  rollPct: number;
}

/** Which owned consumable would boost this check, and by how much (preview + resolution share this). */
function consumableBonusFor(
  state: QuestRunState,
  node: QuestNode,
): { bonus: number; label: string; flag: string } | null {
  const stats = node.stats ?? [];
  if (state.flags.includes('hasFumogeno') && stats.includes('agi')) {
    return { bonus: 15, label: 'Fumogeno', flag: 'hasFumogeno' };
  }
  if (state.flags.includes('hasCorda') && (stats.includes('con') || stats.includes('str'))) {
    return { bonus: 15, label: 'Corda e rampino', flag: 'hasCorda' };
  }
  return null;
}

/**
 * Discovered intel that changes a check's numbers — the payoff of the
 * sighting phase. turni→sneak, pattuglia→side door, mappa→perquisizione.
 */
function intelBonusFor(state: QuestRunState, node: QuestNode): { bonus: number; label: string } | null {
  if (node.id === 'check-ingresso-agi' && state.info.includes('turni')) {
    return { bonus: 10, label: 'conoscete i turni di guardia' };
  }
  if (node.id === 'check-ingresso-laterale' && state.info.includes('pattuglia')) {
    return { bonus: 10, label: 'sapete quando passa la pattuglia' };
  }
  if (node.id === 'perquisizione' && state.info.includes('mappaAccampamento')) {
    return { bonus: 10, label: 'avete la mappa mentale del campo' };
  }
  return null;
}

/** Escalate the camp's alertness. alarm = noise>=2; noise 3 = the thing wakes. */
function raiseNoise(state: QuestRunState, ticks: number, reason: string): void {
  const before = state.noise;
  state.noise = Math.min(3, state.noise + ticks);
  state.alarm = state.noise >= 2;
  if (state.noise === before) return;
  if (state.noise >= 3) {
    state.log.push({ kind: 'INFO', text: `RUMORE ◉◉◉ — ${reason} Qualcosa si sta svegliando nella torre.` });
  } else if (state.noise === 2) {
    state.log.push({ kind: 'INFO', text: `RUMORE ◉◉○ — ${reason} Il campo è in allarme: i check saranno più difficili.` });
  } else {
    state.log.push({ kind: 'INFO', text: `RUMORE ◉○○ — ${reason} Il campo è sospettoso.` });
  }
}

/**
 * Resolve a check. `useConsumable=false` means the player saw the preview and
 * chose to keep the consumable in the bag — it is NOT consumed and adds no
 * bonus. Forced checks (risveglio, epicfail→scontro) auto-spend: the party is
 * desperate and there is no preview moment to decide in.
 */
function resolveCheck(state: QuestRunState, node: QuestNode, useConsumable = true): CheckResult {
  const stats = node.stats ?? [];
  const score = groupScore(state, stats);
  const die = 1 + Math.floor(roll(state) * 100);
  // consumables: fumogeno helps agi checks, corda helps the climb
  let bonus = 0;
  const consumable = consumableBonusFor(state, node);
  if (consumable && useConsumable) {
    bonus = consumable.bonus;
    state.flags = state.flags.filter((f) => f !== consumable.flag);
    if (consumable.flag === 'hasFumogeno') {
      state.log.push({ kind: 'INFO', text: 'Il fumogeno copre la vostra infiltrazione (+15).' });
    } else {
      state.log.push({ kind: 'INFO', text: 'Corda e rampino rendono la salita più sicura (+15).' });
    }
  } else if (consumable) {
    state.log.push({ kind: 'INFO', text: `Decidete di tenere ${consumable.label} nella sacca.` });
  }
  const intel = intelBonusFor(state, node);
  if (intel) {
    bonus += intel.bonus;
    state.log.push({ kind: 'INFO', text: `L’informazione paga: ${intel.label} (+${intel.bonus}).` });
  }
  const successBound = clampSuccessBound(score + bonus);
  const verdict = verdictFromRoll(die, successBound);
  const resolved: ResolvedCheck = {
    title: node.title,
    verdict,
    score: Math.round(successBound),
    rollPct: die,
    harm: 'none',
    woundPct: node.risk?.wound ?? 0,
    deathPct: node.risk?.death ?? 0,
  };
  state.lastCheck = resolved;
  state.checkQueue.push(resolved);
  state.log.push({
    kind: 'CHECK',
    text: `${node.title}: ${stats.map((s) => STAT_LABELS[s]).join(' + ')} → ${verdict.toUpperCase()} (${Math.round(successBound)} vs tiro ${die}).`,
  });
  // Surface the verdict→risk modifier: the player must FEEL the lucky escape.
  if (verdict === 'win' || verdict === 'bigwin') {
    state.log.push({
      kind: 'INFO',
      text: `Il ${verdict.toUpperCase()} ha risparmiato il party (−${-TUNE.winRiskMod}pp a ferita e morte).`,
    });
  }
  if (verdict === 'bigwin') {
    state.log.push({ kind: 'INFO', text: 'Bigwin: ogni esito di morte è degradato a ferita.' });
  }
  if (verdict === 'epicfail') {
    state.log.push({ kind: 'INFO', text: 'Epicfail: ogni ferita diventa morte.' });
  }
  resolved.harm = rollCheckHarms(state, node, verdict);
  return { verdict, score: successBound, rollPct: die };
}

/** What the UI can show before the player commits to a check option. */
export interface OptionPreview {
  checkTitle: string;
  /** Per-stat best living contributor — the party member who carries the roll. */
  contributors: { stat: LabStat; label: string; bestName: string; bestValue: number }[];
  /** Group score incl. alarm penalty + consumable/intel bonuses that would apply. */
  score: number;
  consumableLabel?: string;
  consumableBonus?: number;
  /** Inventory flag consumed if the player arms the consumable before the check. */
  consumableFlag?: string;
  intelLabel?: string;
  intelBonus?: number;
  /** ≈ P(verdict ≥ win): margin ≥ 0 ⇔ roll ≤ score. */
  successPct: number;
  /** Base per-slot risk on this check (worst case adds wounded/role modifiers). */
  woundPct: number;
  deathPct: number;
  /** Living bodyguard who will intercept every harm — risks shown are HIS. */
  interceptor?: { name: string; woundPct: number; deathPct: number };
  /** Effective per-member risk on this check — base + slot bonus/malus +
      wounded penalty. This is where the player SEES that some slots are
      exposed (bodyguard) or protected (leader). */
  perSlot: { id: string; name: string; role: string; woundPct: number; deathPct: number; wounded: boolean }[];
  /** Which of the quest's declared PRIMARY_STATS this check uses — options
      using them are the "via maestra". */
  primaryStatsUsed: string[];
}

/**
 * Preview of an option's mechanical weight: resolves `CHECK:<id>` targets to
 * the check node and projects score, success chance, harm risk and the
 * consumable that would be consumed — without rolling anything.
 */
export function previewOption(
  state: QuestRunState,
  optionId: string,
  opts?: { useConsumable?: boolean },
): OptionPreview | null {
  if (state.ended) return null;
  const node = SCENARIO_NODES[state.nodeId];
  const option = node?.options?.find((o) => o.id === optionId);
  if (!option || !option.next.startsWith('CHECK:')) return null;
  const checkNode = SCENARIO_NODES[option.next.slice(6)];
  if (!checkNode || !checkNode.stats) return null;

  const alive = state.party.filter((m) => !m.dead);
  const contributors = checkNode.stats.map((s) => {
    const best = alive.reduce((a, b) => (b.stats[s] > a.stats[s] ? b : a));
    return { stat: s, label: STAT_LABELS[s], bestName: best.name, bestValue: best.stats[s] };
  });
  const consumable = consumableBonusFor(state, checkNode);
  const consumableApplied = consumable && opts?.useConsumable !== false ? consumable : null;
  const intel = intelBonusFor(state, checkNode);
  const score = groupScore(state, checkNode.stats) + (consumableApplied?.bonus ?? 0) + (intel?.bonus ?? 0);
  const bodyguard = state.party.find((m) => m.role === 'bodyguard' && !m.dead);
  const perSlot = alive.map((m) => ({
    id: m.id,
    name: m.name,
    role: m.role,
    wounded: m.wounded,
    ...memberRisk(m, checkNode),
  }));
  const primaryStatsUsed = checkNode.stats.filter((s) => PRIMARY_STATS.includes(s));
  return {
    checkTitle: checkNode.title,
    contributors,
    score,
    consumableLabel: consumable?.label,
    consumableBonus: consumable?.bonus,
    consumableFlag: consumable?.flag,
    intelLabel: intel?.label,
    intelBonus: intel?.bonus,
    successPct: Math.round(clampSuccessBound(score)),
    woundPct: checkNode.risk?.wound ?? 0,
    deathPct: checkNode.risk?.death ?? 0,
    interceptor: bodyguard
      ? { name: bodyguard.name, ...memberRisk(bodyguard, checkNode) }
      : undefined,
    perSlot,
    primaryStatsUsed,
  };
}

/** The check's harm risk for a specific member (slot modifier + wounded penalty). */
export function memberRisk(
  member: RuntimeMember,
  node: QuestNode,
): { woundPct: number; deathPct: number } {
  const slot = SLOT_RISK[member.role] ?? SLOT_RISK.member;
  const extra = member.wounded ? TUNE.woundedRiskBonus : 0;
  return {
    woundPct: Math.max(0, (node.risk?.wound ?? 0) + slot.wound + extra),
    deathPct: Math.max(0, (node.risk?.death ?? 0) + slot.death + extra),
  };
}

/**
 * Apply the consequences of a check verdict and pick the next node.
 * Node-specific, hardcoded — this quest's authored matrix, not a system.
 */
/**
 * Checks made while INSIDE the camp tick the noise meter on failure.
 * Noise is the quest's dramatic accumulator — the thing in the tower
 * pays off at 3.
 */
const INSIDE_CHECKS = new Set([
  'check-ingresso-agi',
  'check-ingresso-cha',
  'check-ingresso-laterale',
  'check-ingresso-forza',
  'perquisizione',
  'check-gabbia',
  'obiettivo',
  'check-forziere',
]);

function applyCheckOutcome(state: QuestRunState, node: QuestNode, verdict: Verdict): string {
  const success = verdict === 'win' || verdict === 'bigwin' || verdict === 'almost';
  const bad = verdict === 'fail' || verdict === 'epicfail';
  if (INSIDE_CHECKS.has(node.id) && bad) {
    raiseNoise(state, verdict === 'epicfail' ? 2 : 1, node.title + '.');
  }
  // The thing in the tower wakes: Chekhov's gun fires.
  if (state.noise >= 3 && node.id !== 'risveglio') {
    return 'risveglio';
  }
  switch (node.id) {
    case 'avvistamento':
      if (verdict === 'bigwin') {
        state.info.push('gabbia', 'sideDoor', 'turni', 'pattuglia', 'qualcosaDiGrosso', 'mappaAccampamento');
        state.log.push({
          kind: 'INFO',
          text: 'Vedete tutto: la gabbia col prigioniero, la porta laterale, i turni, la pattuglia — e qualcosa di grosso che dorme nella torre.',
        });
      } else if (verdict === 'win') {
        state.info.push('gabbia', 'sideDoor', 'qualcosaDiGrosso');
        state.log.push({
          kind: 'INFO',
          text: 'Scorgete una gabbia con un prigioniero, una porta laterale… e qualcosa di grosso nella torre.',
        });
      } else if (verdict === 'almost') {
        state.info.push('turni');
        state.log.push({ kind: 'INFO', text: 'Riuscite solo a contare i turni di guardia.' });
      } else {
        state.log.push({ kind: 'INFO', text: 'Nient’altro: entrerete alla cieca.' });
      }
      return 'approccio';
    case 'check-ingresso-forza':
      raiseNoise(state, 1, 'lo scontro si sente in tutto il campo.');
      if (state.noise >= 3) return 'risveglio';
      return 'perquisizione';
    case 'check-ingresso-agi':
    case 'check-ingresso-cha':
    case 'check-ingresso-laterale':
      if (verdict === 'epicfail') return 'check-ingresso-forza'; // everything goes loud
      return 'perquisizione';
    case 'perquisizione':
      if (success) {
        state.loot.push('segnale della cassa');
        state.log.push({ kind: 'INFO', text: 'Trovate la cassa delle sementi, ancora intatta. In cima alla torre.' });
        state.flags.push('knowsCassa');
      } else {
        state.log.push({ kind: 'INFO', text: 'La ricerca fa rumore e non trovate niente di preciso — tirate a indovinare verso la torre.' });
      }
      return 'torre';
    case 'check-gabbia':
      if (success) {
        state.flags.push('prigionieroLibero');
        state.log.push({ kind: 'LOOT', text: 'Il prigioniero vi segue in silenzio. Al villaggio potrebbe restare.' });
      }
      return 'obiettivo';
    case 'obiettivo':
      if (success) {
        state.objectiveDone = true;
        state.loot.push('cassa delle sementi');
        state.log.push({ kind: 'LOOT', text: 'Cassa delle sementi recuperata.' });
      } else {
        state.log.push({ kind: 'INFO', text: 'La cassa vi sfugge di mano — dovrete tornare a mani vuote.' });
      }
      return 'rientra-o-rischi';
    case 'check-forziere':
      raiseNoise(state, 1, 'il forziere cigola.');
      if (success) {
        state.gold += 15;
        state.loot.push('forziere goblin');
        state.log.push({ kind: 'LOOT', text: 'Forziere goblin: +15 gold.' });
      }
      if (state.noise >= 3) return 'risveglio';
      return 'ritorno';
    case 'risveglio':
      if (success) {
        state.log.push({ kind: 'INFO', text: 'Correte nella notte. Dietro di voi la torre si sgretola — eravate a un soffio.' });
      } else {
        state.log.push({ kind: 'INFO', text: 'La fuga è un massacro disperato.' });
      }
      return 'ritorno';
    default:
      return 'ritorno';
  }
}

/** Advance from an info node, computing its dynamic text. */
function enterNode(state: QuestRunState, nodeId: string): void {
  const node = SCENARIO_NODES[nodeId];
  if (!node) return;
  state.nodeId = nodeId;
  state.log.push({ kind: 'NODE', text: node.title });

  // Check nodes resolve as soon as they are reached: the choice that led here
  // already committed the party; resolution is the consequence.
  if (node.kind === 'check') {
    const result = resolveCheck(state, node);
    state.lastEvent = `${node.title} — ${result.verdict.toUpperCase()}.`;
    if (allDead(state)) {
      endRun(state, 'wipe', 'La spedizione è stata spazzata via.');
      return;
    }
    enterNode(state, applyCheckOutcome(state, node, result.verdict));
    return;
  }

  // Info nodes are narrative beats, not decisions: they set lastEvent and
  // auto-advance so the player clicks only on real choices.
  if (node.kind === 'info') {
    state.log.push({ kind: 'INFO', text: node.body });
    state.lastEvent = node.body;
    enterNode(state, node.next ?? 'ritorno');
    return;
  }

  if (node.kind === 'harm') {
    // Travel incident: direct, non-check harm — the bodyguard cannot intercept.
    if (roll(state) < TUNE.incidentChance) {
      const candidates = state.party.filter((m) => !m.dead);
      const victim = candidates[Math.floor(roll(state) * candidates.length)];
      if (victim) {
        victim.wounded = true;
        victim.hp = Math.max(1, victim.hp - TUNE.incidentWoundHpLoss);
        state.log.push({ kind: 'HARM', text: `La frana colpisce ${victim.name}: ferito.` });
        state.lastEvent = `La frana coglie ${victim.name}. Il resto della strada lo farà con una ferita.`;
      }
    } else {
      state.lastEvent = 'La frana passa a pochi metri: spavento, ma nessun danno.';
    }
    if (allDead(state)) {
      endRun(state, 'wipe', 'La spedizione è stata spazzata via.');
      return;
    }
    enterNode(state, node.next ?? 'ritorno');
    return;
  }

  if (nodeId === 'ritorno') {
    const lead = leader(state);
    if (allDead(state)) {
      endRun(state, 'wipe', 'La spedizione è stata spazzata via.');
    } else if (state.objectiveDone && lead && !lead.dead) {
      endRun(state, 'reward', 'Cassa delle sementi riportata al villaggio. La quest è completa — reward ottenuta.');
    } else if (state.objectiveDone && (!lead || lead.dead)) {
      endRun(state, 'survived', 'La cassa torna al villaggio, ma il leader non c’è più. La reward della quest va persa.');
    } else {
      endRun(state, 'survived', 'Tornate al villaggio senza la cassa. La quest è fallita, ma siete vivi.');
    }
  }
}

/**
 * Apply a player choice on a 'choice' node.
 * `CHECK:<id>` resolves the check immediately, applies harms and branches.
 */
export function applyChoice(
  state: QuestRunState,
  optionId: string,
  opts?: { useConsumable?: boolean },
): QuestRunState {
  if (state.ended) return state;
  const node = SCENARIO_NODES[state.nodeId];
  if (!node) return state;
  // A new player action starts a new burst of checks.
  state.checkQueue = [];
  // info nodes expose a single synthetic «continue» action
  if (node.kind === 'info') {
    if (optionId !== 'advance') return state;
    enterNode(state, node.next ?? 'ritorno');
    return state;
  }
  if (node.kind !== 'choice') return state;
  const option = node.options?.find((o) => o.id === optionId);
  if (!option) return state;
  if (option.requiresInfo && !state.info.includes(option.requiresInfo)) return state;
  if (option.hiddenIfFlag && state.flags.includes(option.hiddenIfFlag)) return state;
  if (option.costGold && state.gold < option.costGold) return state;

  if (option.costGold) {
    state.gold -= option.costGold;
    // buying anything earns the merchant's tip once
    if (!state.info.includes('simbolo')) {
      state.info.push('simbolo');
      state.log.push({ kind: 'INFO', text: 'Il mercante: «non sono goblin qualunque… portano un simbolo».' });
    }
  }
  if (option.sets) state.flags.push(option.sets);
  state.log.push({ kind: 'CHOICE', text: option.label });

  const next = option.next;
  if (next.startsWith('CHECK:')) {
    const checkNode = SCENARIO_NODES[next.slice(6)];
    state.nodeId = checkNode.id;
    const result = resolveCheck(state, checkNode, opts?.useConsumable !== false);
    const hurt = state.log
      .filter((e) => e.kind === 'WOUND' || e.kind === 'DEATH' || e.kind === 'DEATH_SAVE' || e.kind === 'INTERCEPT')
      .slice(-4)
      .map((e) => e.text)
      .join(' ');
    state.lastEvent = `${checkNode.title} — ${result.verdict.toUpperCase()}. ${hurt || 'Nessuna conseguenza fisica.'}`;
    if (allDead(state)) {
      endRun(state, 'wipe', 'La spedizione è stata spazzata via.');
      return state;
    }
    enterNode(state, applyCheckOutcome(state, checkNode, result.verdict));
  } else {
    enterNode(state, next);
  }
  return state;
}

/** Options visible at the current node (filters info-gated options). */
export function availableOptions(state: QuestRunState): { id: string; label: string; detail: string; costGold?: number; disabled: boolean }[] {
  const node = SCENARIO_NODES[state.nodeId];
  if (!node || state.ended) return [];
  if (node.kind === 'info') {
    return [{ id: 'advance', label: 'Continua', detail: 'Prosegui.', disabled: false }];
  }
  if (node.kind !== 'choice') return [];
  return (node.options ?? [])
    .filter((o) => (!o.requiresInfo || state.info.includes(o.requiresInfo)) && (!o.hiddenIfFlag || !state.flags.includes(o.hiddenIfFlag)))
    .map((o) => ({
      id: o.id,
      label: o.label,
      detail: o.detail,
      costGold: o.costGold,
      disabled: !!o.costGold && state.gold < o.costGold,
    }));
}

export { SCENARIO_NODES };
