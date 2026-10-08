/**
 * QuestS1LabPage — isolated lab for PLAN-019-S1 «La cassa delle sementi».
 *
 * Route: /quest-s1-lab (dev only). Not wired to village/POI persistence:
 * state lives in React useState and resets freely.
 * Visual language mirrors QuestDetailPanel; party members render through the
 * canonical WanderlustRosterCard; checks show the baptized skill-check
 * component DestinyAstrolabeV62 (route /minimal-destiny-astrolabe-v6-2) with
 * config.mode forced to the resolved verdict (the engine decides, the
 * astrolabe shows it).
 *
 * i18n split: all UI chrome goes through `useTranslation('idleVillage')` under
 * the `questS1Lab.*` keys. Authored narrative (node titles/bodies, option
 * labels, chronicle text in questScenario/questRun) stays in the scenario
 * file as content data — quest content belongs to the content pipeline (S2),
 * not to the i18n string tables.
 *
 * PLAN-024: the page is a thin assembly — every region lives in
 * `questS1Lab/hud/*` (strip, stage band, action zone, chronicle drawer,
 * screens). State, effects and handlers stay here; presentation stays there.
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { INTEL_LABELS, QUEST_BEATS } from '@/ui/idleVillage/questS1Lab/questScenario';
import { ROVINE_BEATS, ROVINE_INTEL_LABELS } from '@/ui/idleVillage/questS1Lab/questScenarioRovine';
import { GOBLIN_BEATS } from '@/ui/idleVillage/questS1Lab/questScenarioGoblin';
import {
  applyChoice,
  createRun,
  flee,
  drinkPotion,
  useHealing,
  nodesFor,
  currentExposure,
  nextCombatHits,
  QUESTS,
} from '@/ui/idleVillage/questS1Lab/questRun';

import type { HarmEvent, QuestId, QuestRunState, ResolvedCheck } from '@/ui/idleVillage/questS1Lab/questRun';
import { QuestSimulationPreview } from '@/ui/idleVillage/questS1Lab/QuestSimulationPreview';
import { usePresentationTimeline } from '@/ui/idleVillage/questS1Lab/presentationTimeline';
import type { PresentationPhase } from '@/ui/idleVillage/questS1Lab/presentationTimeline';
import { DestinyAstrolabeV62Standalone } from '@/ui/idleVillage/frozen/kits/destinyAstrolabeV62Kit';
import type { DestinyAstrolabeV62Handle } from '@/ui/idleVillage/components/destinyAstrolabeV62/DestinyAstrolabeV62';
import { PgCardKitShell } from '@/ui/idleVillage/frozen/kits/pgcardKit';
import { WanderlustAmbientField } from '@/ui/wanderlust-surface/layout';
import { HudPlaque } from '@/ui/idleVillage/skins/primitives';
import { SkinScope } from '@/ui/idleVillage/skins/primitives/SkinScope';
import { DEFAULT_QUEST_LAB_PACING } from '@/balancing/config/idleVillage/quests/questLabPacing';
import { DEFAULT_QUEST_LAB_PRESENTATION as PRES } from '@/balancing/config/idleVillage/quests/questLabPresentation';
import { QUEST_STASH } from '@/balancing/config/idleVillage/quests/questStash';
import { QuestSelectScreen } from '@/ui/idleVillage/questS1Lab/hud/QuestSelectScreen';
import { PresetScreen } from '@/ui/idleVillage/questS1Lab/hud/PresetScreen';
import { ContextStrip } from '@/ui/idleVillage/questS1Lab/hud/ContextStrip';
import { StageBand } from '@/ui/idleVillage/questS1Lab/hud/StageBand';
import { ActionZone } from '@/ui/idleVillage/questS1Lab/hud/ActionZone';
import { ChronicleDrawer } from '@/ui/idleVillage/questS1Lab/hud/ChronicleDrawer';
import { AstroOverlay } from '@/ui/idleVillage/questS1Lab/hud/AstroOverlay';

/* Painted Wanderlust assets (art_direction_plan.md — Wilderness pillar). */
const ART = {
  map: '/Map finale.jpg',
  mountains: '/assets/world/wanderlust/base/layers/Zona montana nord.webp',
  village: '/assets/world/wanderlust/base/layers/Villaggio.webp',
  goblinTotem: '/mockups/goblin-invasion-painted/goblin-invasion-hero.png',
  goblinMarch: '/goblin-march-trasparente.png',
} as const;

/** Scene art per quest node — the Passo, the goblin camp, the village. */
const NODE_ART: Record<string, { src: string; fit: 'contain' | 'cover' }> = {
  viaggio: { src: ART.mountains, fit: 'contain' },
  incidente: { src: ART.mountains, fit: 'contain' },
  avvistamento: { src: ART.mountains, fit: 'contain' },
  approccio: { src: ART.goblinTotem, fit: 'contain' },
  'check-ingresso-agi': { src: ART.goblinTotem, fit: 'contain' },
  'check-ingresso-cha': { src: ART.goblinTotem, fit: 'contain' },
  'check-ingresso-laterale': { src: ART.goblinTotem, fit: 'contain' },
  'check-ingresso-forza': { src: ART.goblinMarch, fit: 'contain' },
  perquisizione: { src: ART.goblinTotem, fit: 'contain' },
  torre: { src: ART.goblinTotem, fit: 'contain' },
  'check-gabbia': { src: ART.goblinTotem, fit: 'contain' },
  obiettivo: { src: ART.goblinMarch, fit: 'contain' },
  'rientra-o-rischi': { src: ART.goblinTotem, fit: 'contain' },
  'check-forziere': { src: ART.goblinTotem, fit: 'contain' },
  risveglio: { src: ART.goblinMarch, fit: 'contain' },
  ritorno: { src: ART.village, fit: 'contain' },
  /* ---- Le Rovine sotto il Fiume — downloaded scene art (public domain,
   *  one image per phase, per Director request 2026-10-04) --------------- */
  'rv-mercante': { src: '/assets/quest-robine/mercante.jpg', fit: 'cover' },
  'rv-check-osserva': { src: '/assets/quest-robine/mercante.jpg', fit: 'cover' },
  'rv-check-incalza': { src: '/assets/quest-robine/mercante.jpg', fit: 'cover' },
  'rv-fiume': { src: '/assets/quest-robine/fiume.jpg', fit: 'cover' },
  'rv-guardie': { src: '/assets/quest-robine/guardie.jpg', fit: 'cover' },
  'rv-check-sneak': { src: '/assets/quest-robine/guardie.jpg', fit: 'cover' },
  'rv-check-fight': { src: '/assets/quest-robine/guardie.jpg', fit: 'cover' },
  'rv-sala': { src: '/assets/quest-robine/tesoro.jpg', fit: 'cover' },
  'rv-check-trappola': { src: '/assets/quest-robine/tesoro.jpg', fit: 'cover' },
  'rv-tesoro-scelta': { src: '/assets/quest-robine/tesoro.jpg', fit: 'cover' },
  'rv-check-prendi': { src: '/assets/quest-robine/tesoro.jpg', fit: 'cover' },
  'rv-check-sicuro': { src: '/assets/quest-robine/tesoro.jpg', fit: 'cover' },
  'rv-checkpoint': { src: '/assets/quest-robine/rovine-hero.jpg', fit: 'cover' },
  'rv-attrito': { src: '/assets/quest-robine/crollo.jpg', fit: 'cover' },
  'rv-camera': { src: '/assets/quest-robine/camera.jpg', fit: 'cover' },
  'rv-ritorno-evento': { src: '/assets/quest-robine/strada.jpg', fit: 'cover' },
  'rv-fine': { src: ART.village, fit: 'contain' },
  /* ---- Sterminio dei goblin — one public-domain painting per phase
   *  (Director 2026-10-06; provenance in public/assets/quest-goblin/SOURCES.md) */
  'gob-inizio': { src: '/assets/quest-goblin/assegnazione.jpg', fit: 'cover' },
  'gob-esplora': { src: '/assets/quest-goblin/esplorazione.jpg', fit: 'cover' },
  'gob-tracce-per': { src: '/assets/quest-goblin/esplorazione.jpg', fit: 'cover' },
  'gob-tracce-perfor': { src: '/assets/quest-goblin/esplorazione.jpg', fit: 'cover' },
  'gob-bottino-scelta': { src: '/assets/quest-goblin/bottino.jpg', fit: 'cover' },
  'gob-bottino': { src: '/assets/quest-goblin/bottino.jpg', fit: 'cover' },
  'gob-accampamento': { src: '/assets/quest-goblin/accampamento.jpg', fit: 'cover' },
  'gob-stealth': { src: '/assets/quest-goblin/accampamento.jpg', fit: 'cover' },
  'gob-assalto': { src: '/assets/quest-goblin/accampamento.jpg', fit: 'cover' },
  'gob-combattimento': { src: '/assets/quest-goblin/combattimento.jpg', fit: 'cover' },
  'gob-incalzare': { src: '/assets/quest-goblin/incalzare.jpg', fit: 'cover' },
  'gob-incalza-check': { src: '/assets/quest-goblin/incalzare.jpg', fit: 'cover' },
  'gob-esplora-extra': { src: '/assets/quest-goblin/razzia.jpg', fit: 'cover' },
  'gob-cerca': { src: '/assets/quest-goblin/razzia.jpg', fit: 'cover' },
  'gob-ritorno': { src: '/assets/quest-goblin/ritorno.jpg', fit: 'cover' },
  'gob-agguato': { src: '/assets/quest-goblin/ritorno.jpg', fit: 'cover' },
  'gob-agguato-scelta': { src: '/assets/quest-goblin/ritorno.jpg', fit: 'cover' },
  'gob-ultimo-scontro': { src: '/assets/quest-goblin/ritorno.jpg', fit: 'cover' },
  'gob-fine': { src: ART.village, fit: 'contain' },
};

/** Intel labels merged across quests — state.info keys are unique per quest. */
const ALL_INTEL_LABELS: Record<string, string> = { ...INTEL_LABELS, ...ROVINE_INTEL_LABELS };

/** Per-quest beats for the progress indicator. */
const QUEST_BEATS_BY_ID: Record<QuestId, readonly string[]> = {
  cassa: QUEST_BEATS,
  rovine: ROVINE_BEATS,
  goblin: GOBLIN_BEATS,
};

/** Quest cards on the lab's entry screen. Only the authored S1 goblin quest
 *  stays here (Director 2026-10-06: «le altre quest devono essere eliminate
 *  da questo lab»); copy keys live under questS1Lab.quests.*. */
const QUEST_CARDS: { id: QuestId; art: string; riskKey: string }[] = [
  { id: 'goblin', art: '/assets/quest-goblin/quest-card.jpg', riskKey: 'high' },
];

/** Random seed for a new run — lab only, called from event handlers. */
const rollSeed = () => Math.floor(Math.random() * 100000);

/** Phases gated on the astrolabe/player: checks wait on resolve + verdict
 *  ack; ambient harm beats flow on their own timers. Module constants so the
 *  hook's effect deps stay stable across renders. */
const GATE_WHEN_CHECK: PresentationPhase[] = ['cinematic', 'verdict'];
const GATE_NONE: PresentationPhase[] = [];

const QuestS1LabPage: React.FC = () => {
  const [seed, setSeed] = useState<number>(rollSeed);
  const [questId, setQuestId] = useState<QuestId | null>(null);
  const [run, setRun] = useState<QuestRunState | null>(null);
  // R-102 loadout: the bag packed on the preset screen, shared across presets.
  const [loadout, setLoadout] = useState<string[]>([...QUEST_STASH.defaultLoadout]);
  // Every check resolved by the last action gets its own astrolabe beat —
  // the queue preserves the order so chained checks all get the cinematic.
  // Burst entries remember whether their check resolved on a combat node —
  // combat cinematics dock into the stage band, narrative ones go full-screen.
  const [checkQueue, setCheckQueue] = useState<{ id: string; check: ResolvedCheck; combat: boolean }[]>([]);
  const [checkIdx, setCheckIdx] = useState(0);
  // Burst counter: every action's queue gets unique ids so the astrolabe
  // remounts per check instead of reusing the previous burst's mount.
  const burstRef = useRef(0);
  const astroRef = useRef<DestinyAstrolabeV62Handle>(null);
  // Consumable belt (Director D1 + artifact §7b): armed before the check —
  // every option tooltip shows the live delta. Engine picks the matching flag.
  const [armConsumable, setArmConsumable] = useState(true);
  // Pace chosen BEFORE the check (Director D1): full cinematic or fast beats.
  const [paceFast, setPaceFast] = useState(false);
  // Chronicle is a drawer, not a column (artifact §2).
  const [logOpen, setLogOpen] = useState(false);
  // Quest X-ray forecast (R-082): a pill in the strip, panel over the stage.
  const [forecastOpen, setForecastOpen] = useState(false);
  // Durable harm chips survive the settle beat until the next action's harms.
  const [pinnedHarms, setPinnedHarms] = useState<HarmEvent[]>([]);
  // Phase timing: beats resolve one at a time with real time between (v4 pattern).
  const [shownNodeId, setShownNodeId] = useState<string | null>(null);
  const transitionTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const activeEntry = checkQueue[checkIdx];
  const activeCheck = activeEntry?.check ?? null;
  const speed = paceFast ? PRES.timeline.fastSpeed : 1;
  const committedHp = useMemo(
    () => (run ? Object.fromEntries(run.party.map((m) => [m.id, m.hp])) : {}),
    [run],
  );

  /* The ONE presentation pipeline (artifact §3): the engine commits, this
     replays — skip/flush/unmount all funnel through the same reducer. */
  const gatePhases = useMemo(
    () => (activeCheck ? GATE_WHEN_CHECK : GATE_NONE),
    [!!activeCheck], // eslint-disable-line react-hooks/exhaustive-deps
  );
  const timeline = usePresentationTimeline({
    resolution: activeCheck,
    committedHp,
    ambientHarms: run?.recentHarms,
    speed,
    enabled: !!run,
    gatePhases,
  });
  const presenting = timeline.state.key !== 'idle' && timeline.state.phase !== 'settled';

  /* On settle, the burst advances — the astrolabe remounts on the next id. */
  useEffect(() => {
    if (!activeEntry) return;
    if (timeline.state.key !== activeEntry.check.id || timeline.state.phase !== 'settled') return;
    const id = setTimeout(() => {
      if (checkIdx + 1 >= checkQueue.length) {
        setCheckQueue([]);
        setCheckIdx(0);
      } else {
        setCheckIdx((i) => i + 1);
      }
    }, PRES.input.inputGuardMs);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeline.state.phase, timeline.state.key, activeEntry?.check.id]);

  /* Durable chip lifecycle: a new presentation clears the pins; on settle the
     final shown set is pinned on the formation slots until the next action. */
  useEffect(() => {
    setPinnedHarms([]);
  }, [timeline.state.key]);
  useEffect(() => {
    if (timeline.state.phase === 'settled' && timeline.shownHarms.length) {
      setPinnedHarms(timeline.shownHarms);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeline.state.phase]);

  useEffect(() => {
    if (!run) {
      setShownNodeId(null);
      return;
    }
    if (shownNodeId === run.nodeId || shownNodeId === null) {
      setShownNodeId(run.nodeId);
      return;
    }
    if (transitionTimer.current) clearTimeout(transitionTimer.current);
    // A node with a transit line holds the beat long enough to be read —
    // scaled to its word count (reading speed is a pacing config value);
    // in the real game this window is the movement animation's duration.
    const destTransit = nodesFor(run)[run.nodeId]?.transit;
    const hold = destTransit
      ? Math.min(
          DEFAULT_QUEST_LAB_PACING.transitMaxMs,
          Math.max(
            DEFAULT_QUEST_LAB_PACING.transitMinMs,
            Math.round(
              (destTransit.split(/\s+/).filter(Boolean).length /
                DEFAULT_QUEST_LAB_PACING.transitWordsPerSecond) *
                1000,
            ),
          ),
        )
      : DEFAULT_QUEST_LAB_PACING.transitionMs;
    transitionTimer.current = setTimeout(() => setShownNodeId(run.nodeId), hold);
    return () => {
      if (transitionTimer.current) clearTimeout(transitionTimer.current);
    };
  }, [run, shownNodeId]);

  /** Click on the transit line = "I've read it" — skip the remaining hold. */
  const skipTransit = () => {
    if (transitionTimer.current) {
      clearTimeout(transitionTimer.current);
      transitionTimer.current = null;
    }
    if (run) setShownNodeId(run.nodeId);
  };

  const startRun = (id: string) => {
    const s = rollSeed();
    setSeed(s);
    setCheckQueue([]);
    setRun(createRun(id, s, questId ?? 'cassa', loadout));
  };

  const toggleStashItem = (flag: string) => {
    setLoadout((cur) =>
      cur.includes(flag)
        ? cur.filter((f) => f !== flag)
        : cur.length < QUEST_STASH.bagSlots
          ? [...cur, flag]
          : cur,
    );
  };

  const reset = () => {
    setRun(null);
    setCheckQueue([]);
  };

  const choose = (optionId: string) => {
    // The engine mutates run state in place; call it outside the updater so
    // React StrictMode's double-invoked updaters can't double-apply effects.
    if (!run) return;
    const wasCombat = nodesFor(run)[run.nodeId]?.kind === 'combat';
    const next = applyChoice(run, optionId, { useConsumable: armConsumable });
    if (next.checkQueue.length > 0) {
      burstRef.current += 1;
      const burst = burstRef.current;
      setCheckQueue(
        next.checkQueue.map((check, i) => ({ id: `b${burst}-${i}`, check, combat: wasCombat })),
      );
      setCheckIdx(0);
    }
    setArmConsumable(true);
    setRun({ ...next });
  };

  const currentNode = useMemo(
    () => (run ? nodesFor(run)[shownNodeId ?? run.nodeId] : null),
    [run, shownNodeId],
  );

  /* The engine already resolved verdict AND harm; the astrolabe only paints it.
   * A fail that actually hurt someone lands the ball in the wound/death zones;
   * the wound/dead band widths are the check's real per-slot risk. */
  const activeMode =
    activeCheck?.verdict === 'fail' && activeCheck.harm === 'death'
      ? 'fail_dead'
      : activeCheck?.verdict === 'fail' && activeCheck.harm === 'wound'
        ? 'fail_wound'
        : activeCheck?.verdict;

  /* ---------------- Quest selection ---------------- */
  if (!questId) {
    return <QuestSelectScreen mapArt={ART.map} cards={QUEST_CARDS} onPick={setQuestId} />;
  }

  /* ---------------- Preset selection ---------------- */
  const activeQuest = QUESTS[questId];
  const activePrimary = activeQuest.primaryStats;
  if (!run) {
    return (
      <PresetScreen
        mapArt={ART.map}
        questId={questId}
        presets={activeQuest.presets}
        primaryStats={activePrimary}
        loadout={loadout}
        onToggleStash={toggleStashItem}
        onBack={() => setQuestId(null)}
        onStart={startRun}
      />
    );
  }

  const sceneArt = run ? NODE_ART[shownNodeId ?? run.nodeId] : undefined;
  /* Transit also plays on the final hop: the closing line lands BEFORE the
   *  outcome card, so the epilogue arrives after the world, not instead of it. */
  const inTransition = shownNodeId !== null && shownNodeId !== run.nodeId;
  const currentBeat = currentNode?.beat ?? 0;
  const inCombat = !!currentNode && currentNode.kind === 'combat' && !run.ended;
  /* Engine-provided snapshots — the UI NEVER recomputes positionalWeights. */
  const exposure = currentExposure(run);
  const intentHits = nextCombatHits(run);
  /* Horde count stays pre-kills until the kills beat plays (presented vs
   *  committed — the tokens shatter on stage, not in the data). */
  const kills = activeCheck?.kills ?? 0;
  const hordeShown = run.goblinLeft + (!timeline.state.killsShown ? kills : 0);
  const hordeTotal = currentNode?.combat?.enemies ?? Math.max(run.goblinLeft, hordeShown);
  /* Harm channel: during the beat the shown set grows event by event; after
   *  settle the pinned set keeps the delta chips alive until the next action. */
  const visibleHarms =
    timeline.state.phase === 'settled' && timeline.state.key !== 'idle'
      ? pinnedHarms
      : timeline.shownHarms;
  const deltaByMember = visibleHarms.reduce<Record<string, number>>((acc, h) => {
    acc[h.memberId] = (acc[h.memberId] ?? 0) + h.amount;
    return acc;
  }, {});
  const spentIds = new Set(visibleHarms.map((h) => h.memberId));
  const presentedHpOf = (m: QuestRunState['party'][number]) =>
    timeline.state.key === 'idle' ? m.hp : (timeline.state.hp[m.id] ?? m.hp);
  /* The astrolabe has two homes (artifact §6): docked in the stage gap on
   *  combat turns, full-screen overlay on narrative checks. Either way it
   *  exists only while the cinematic beat plays. */
  const astroDocked = !!activeCheck && timeline.state.phase === 'cinematic' && !!activeEntry?.combat;
  const astroOverlay = !!activeCheck && timeline.state.phase === 'cinematic' && !activeEntry?.combat;

  /** Progressive skip — the ONLY fast-forward affordance (artifact §8):
   *  during the cinematic it settles the astrolabe; afterwards it flushes
   *  the remaining consequence beats. Same reducer path as every fast-forward. */
  const handleSkip = () => {
    if (timeline.state.phase === 'cinematic') {
      if (activeCheck) astroRef.current?.skipToResult();
      else timeline.advance();
    } else {
      timeline.flush();
    }
  };

  /** The configured astrolabe element — one instance, two homes (docked in
   *  the stage band during combat turns, full-screen overlay otherwise). */
  const astroNode = activeEntry ? (
    <DestinyAstrolabeV62Standalone
      ref={astroRef}
      key={activeEntry.id}
      skills={[{ name: activeCheck?.title ?? '', stat: activeCheck?.score ?? 50, difficulty: 50 }]}
      config={{
        mode: activeMode,
        wound: activeCheck?.woundPct ?? 0,
        dead: activeCheck?.deathPct ?? 0,
        harm: activeCheck?.harm ?? 'none',
      }}
      onResolve={() => timeline.advance()}
      autoStart
      removeSounds
      speed={speed}
    />
  ) : null;

  /* ---------------- Run view — Lacquer Atlas cockpit, zero scroll ------- */
  return (
    <WanderlustAmbientField className="h-screen text-ivory" fireflyCount={4}>
      <SkinScope
        className="h-screen"
        style={{ background: 'var(--skin-surface-base)' }}
      >
      <div
        className="relative mx-auto flex h-screen w-full flex-col overflow-hidden"
        style={{ maxWidth: PRES.layout.maxWidthPx }}
      >
        {/* CONTEXT STRIP — a `hang` plaque, same construction as /game's
            objective cartouche (hud_component_guide §2). */}
        <HudPlaque
          shape="hang"
          as="header"
          style={{ margin: '0 auto', width: 'min(1120px, 96vw)', padding: '8px 36px 14px', zIndex: 3 }}
        >
          <ContextStrip
            questId={questId}
            seed={seed}
            beats={QUEST_BEATS_BY_ID[questId]}
            currentBeat={currentBeat}
            ended={run.ended}
            gold={run.gold}
            flags={run.flags}
            inCombat={inCombat}
            combatTurn={run.combatTurn}
            turnsTotal={currentNode?.combat?.turns ?? 0}
            presenting={presenting}
            paceFast={paceFast}
            onPaceChange={setPaceFast}
            onSkip={handleSkip}
            logOpen={logOpen}
            onToggleLog={() => setLogOpen((v) => !v)}
            forecastOpen={forecastOpen}
            onToggleForecast={() => setForecastOpen((v) => !v)}
            onRetreat={() => setRun({ ...flee(run) })}
            onReset={reset}
          />
        </HudPlaque>

        <StageBand
          party={run.party}
          presentedHp={(id) => {
            const m = run.party.find((x) => x.id === id);
            return m ? presentedHpOf(m) : 0;
          }}
          exposure={exposure}
          inCombat={inCombat}
          activeHarm={timeline.activeHarm}
          deltaByMember={deltaByMember}
          spentIds={spentIds}
          astroNode={astroNode}
          astroDocked={astroDocked}
          sceneArt={sceneArt}
          hordeShown={hordeShown}
          hordeTotal={hordeTotal}
          hordeDying={timeline.state.killsShown ? 0 : kills}
          intentHits={intentHits}
        />

        {/* Quest X-ray — Monte Carlo forecast (R-082): the trigger is the
            strip pill; the panel floats over the stage, not a banner. */}
        {!run.ended && forecastOpen && (
          <div className="absolute inset-x-4 top-20 z-40 mx-auto max-w-4xl">
            <QuestSimulationPreview run={run} open onOpenChange={setForecastOpen} />
          </div>
        )}

        {/* ACTION ZONE — a `plinth` plaque rising from the bottom (D2), the
            same construction as /game's nav bar. */}
        <HudPlaque
          shape="plinth"
          as="section"
          style={{
            margin: '0 auto',
            width: 'min(1120px, 96vw)',
            height: `${PRES.layout.actionZoneVh}vh`,
            padding: '26px 30px 8px',
            zIndex: 3,
          }}
        >
        <ActionZone
          run={run}
          currentNode={currentNode}
          inTransition={inTransition}
          transitText={nodesFor(run)[run.nodeId]?.transit}
          transitArt={NODE_ART[run.nodeId]}
          onTransitSkip={skipTransit}
          presenting={presenting}
          activeCheck={activeCheck}
          phase={timeline.state.phase}
          onAck={timeline.advance}
          burstCurrent={checkIdx + 1}
          burstTotal={checkQueue.length}
          queuePending={checkQueue.length > 0}
          armConsumable={armConsumable}
          onChoose={choose}
          onToggleArmed={() => setArmConsumable((v) => !v)}
          onDrinkPotion={() => setRun({ ...drinkPotion(run, 'hasPozione') })}
          onUseHealing={() => setRun({ ...useHealing(run) })}
          intelLabels={ALL_INTEL_LABELS}
        />
        </HudPlaque>

        {/* LOG DRAWER — overlay, never a column */}
        {logOpen && <ChronicleDrawer log={run.log} onClose={() => setLogOpen(false)} />}
      </div>

      {astroOverlay && activeEntry && (
        <AstroOverlay
          entryId={activeEntry.id}
          transit={activeCheck?.transit}
          burstCurrent={checkIdx + 1}
          burstTotal={checkQueue.length}
          astroNode={astroNode}
          onSkip={handleSkip}
        />
      )}
      </SkinScope>
    </WanderlustAmbientField>
  );
};


const WrappedQuestS1LabPage: React.FC = () => (
  <PgCardKitShell>
    <QuestS1LabPage />
  </PgCardKitShell>
);

export default WrappedQuestS1LabPage;
