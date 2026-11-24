/**
 * HudRealCassettoHost — the production wiring for `HudRealCassetto` on the lab page.
 * Mounts the SAME `useQuestExpeditionSession` the /game planner uses (real slot
 * controller, real eligibility/drop rules, real forecast, real launch) on a real
 * authored POI, plus the REAL village stash ledger (`useVillageStashStore` — the
 * per-POI draft bag, PLAN-073). The cassetto itself is presentation-only: every
 * byte of state it shows comes from the session or the ledger.
 */
import React, { useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuestRun } from '@/ui/idleVillage/questS1Lab/useQuestRun';
import { useQuestExpeditionSession } from '@/ui/idleVillage/quests/useQuestExpeditionSession';
import { questPoiById, DANGER_BANDS } from '@/balancing/config/idleVillage/quests/questPois';
import { useVillageStashStore } from '@/ui/idleVillage/store/useVillageStashStore';
import { villageStashViewModel } from '@/ui/idleVillage/components/gameFrame/villageStashViewModel';
import { VILLAGE_STASH_CONFIG } from '@/balancing/config/idleVillage/villageStashConfig';
import { QUEST_STASH } from '@/balancing/config/idleVillage/quests/questStash';
import { journeyFasiOf } from '@/ui/idleVillage/quests/questJourney';
import { scenarioForQuest } from '@/ui/idleVillage/questS1Lab/questOffer';
import { DndContext } from '@dnd-kit/core';
import { selectResourceOutlook, useMinimalGameplayWithIdleVillageConfig } from '@/store/useMinimalGameplay';
import { buildResourceReadoutItems } from '@/ui/idleVillage/components/gameFrame';
import { ExpeditionDrawer } from '@/ui/idleVillage/components/gameFrame/ExpeditionDrawer';
import type { CassettoQuest, CassettoLoadout } from './HudRealCassetto';

/* Lab-only POI picker (Director 2026-11-20): `?poi=poi-rovine` swaps the
 *  bound quest so the witness can compare per-quest vignette/bagSlots. */
const POI_ID = new URLSearchParams(window.location.search).get('poi') ?? 'poi-goblin';
/** Stable empty bag — inline `?? []` inside the store selector mints a new array
 *  per snapshot and trips getSnapshot's infinite-loop guard. */
const EMPTY_BAG: readonly (string | null)[] = [];

export const HudRealCassettoHost: React.FC = () => {
  const { t } = useTranslation('idleVillage');
  /* The same live readout the page's resources slot shows — the cassetto owns
   *  it as its top-interior band (Director ruling: resources incorporated
   *  inside the cassetto's space, not as a separate overlay). */
  const { state: gpState, config: gpConfig } = useMinimalGameplayWithIdleVillageConfig();
  const resourceItems = useMemo(
    () => buildResourceReadoutItems(selectResourceOutlook(gpState, gpConfig), t),
    [gpState, gpConfig, t],
  );
  const poi = useMemo(() => questPoiById(POI_ID), []);
  const questRun = useQuestRun(poi?.questId ?? 'goblin');
  const activeRuns = useMemo(() => [questRun.run].filter((r): r is NonNullable<typeof r> => Boolean(r)), [questRun.run]);

  /* The real stash ledger — hydrate once, then the bag is authoritative. */
  useEffect(() => { void useVillageStashStore.getState().hydrate(); }, []);
  const bag = useVillageStashStore((s) => s.bags[POI_ID] ?? EMPTY_BAG);
  const stashState = useVillageStashStore.getState();

  const session = useQuestExpeditionSession({
    poi: poi!,
    questRun,
    activeRuns,
    currentTick: 0,
    onOpenRun: (questId) => console.info('[cassetto-host] open run', questId),
    onOpenStash: () => console.info('[cassetto-host] open stash'),
    /* The session mounts its own QuestExpeditionDetail when open — keep the
     *  state live but paint nothing: the cassetto IS the detail surface. */
    wrapDetail: () => null,
  });

  /* The session's assignment/eligibility/forecast chain is gated on the
   *  detail being open — the cassetto IS the detail, so it stays open for
   *  the whole lab session (same gate QuestExpeditionDetail opens with). */
  useEffect(() => {
    session.setIsDetailOpen(true);
    return () => session.setIsDetailOpen(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);



  const scenario = useMemo(() => scenarioForQuest(poi?.questId ?? 'goblin'), [poi?.questId]);

  /* Lab-only witness hook: `?pcts=96,4` paints the % readouts without a full party (this host is the /hud-compose lab, not /game). */
  const witnessPcts = useMemo(() => {
    const m = /[?&]pcts=(\d+),(\d+)/.exec(typeof window !== 'undefined' ? window.location.search : '');
    return m ? ([Number(m[1]), Number(m[2])] as const) : null;
  }, []);
  const witnessRisk = useMemo(() => {
    const m = /[?&]risk=(\d)/.exec(typeof window !== 'undefined' ? window.location.search : '');
    return m ? Number(m[1]) : null;
  }, []);
  const witnessReward = useMemo(() => {
    const m = /[?&]reward=(\d)/.exec(typeof window !== 'undefined' ? window.location.search : '');
    return m ? Number(m[1]) : null;
  }, []);
  /* Lab-only witness hook: `?cansend=1` forces the plaque lit so the R-378
   *  jewel pulse can be witnessed without a full party. */
  const witnessCanSend = useMemo(() => /[?&]cansend=1/.test(typeof window !== 'undefined' ? window.location.search : ''), []);
  const quest: CassettoQuest = useMemo(() => {
    const fasi = poi ? journeyFasiOf(poi) : null;
    const label = session.poiView?.activity?.label ?? scenario?.title ?? 'Spedizione';
    const estimate = session.estimate?.value ?? null;
    const danger =
      estimate && estimate !== 'incomplete' && 'bands' in estimate
        ? estimate.bands.danger
        : undefined;
    /* Same sim-derived fields as the /game adapter (R-357 + Director
     *  2026-11-20): pending muted risk, % morte, % riuscita. */
    const sim =
      estimate && estimate !== 'incomplete' && 'sim' in estimate
        ? estimate.sim
        : undefined;
    const legs = [
      { label: t('gameFrame.cassetto.leg.outbound', 'Outbound'), days: fasi?.travelDays ?? 0 },
      { label: t('gameFrame.cassetto.leg.site', 'At site'), days: '—' as const },
      { label: t('gameFrame.cassetto.leg.return', 'Return'), days: fasi?.travelDays ?? 0 },
    ];
    return {
      title: label,
      briefing: scenario?.offer.dispatch ?? scenario?.offer.objective ?? '',
      legs,
      totalDays: legs.reduce((sum, leg) => sum + (typeof leg.days === 'number' ? leg.days : 0), 0),
      riskLabel: danger ?? (witnessRisk ? DANGER_BANDS[witnessRisk - 1]?.id ?? '—' : '—'),
      riskLevel: witnessRisk ?? (danger ? DANGER_BANDS.findIndex((b) => b.id === danger) + 1 || undefined : undefined),
      riskLevelMax: DANGER_BANDS.length,
      riskPending: witnessRisk ? undefined : estimate === null ? 'computing' : sim ? undefined : 'incomplete',
      deathPct: witnessPcts?.[0] ?? sim?.anyDeathPct,
      rewards: [
        { icon: 'gold', qty: String(scenario?.rewardBase ?? 60) },
      ],
      successPct: witnessPcts?.[1] ?? sim?.outcomePct.reward,
      /* OB-7 app-5 (Director 2026-11-21): the chest scale mirrors the skull scale — level from the POI's
       *  authored offer tier (main=5/5 lit, normal=3/5), pending → dim. `?reward=N` overrides for witnesses. */
      rewardLevel: witnessReward ?? (poi?.tier === 'main' ? 5 : poi?.tier === 'normal' ? 3 : undefined),
      rewardLevelMax: 5,
      /* Director 2026-11-20: the quest's own cover art as the cassetto
       *  vignette — same `offer.coverArt` source the /game adapter uses. */
      vignette: scenario?.offer.coverArt,
    };
  }, [poi, scenario, session.poiView, session.estimate, t, witnessPcts, witnessRisk, witnessReward]);

  const slots = session.controller.slots as unknown as import('@/ui/idleVillage/slots/types').ResidentSlotViewModel[];

  /* Quest bag as SLOT FRAMES (R-337): the sparse ledger bag, not a catalogue
   *  list — empty slots open the (bound) stash affordance, packed slots release. */
  const loadout: CassettoLoadout = useMemo(() => {
    const rows = villageStashViewModel(VILLAGE_STASH_CONFIG).rows;
    return {
      slots: Array.from({ length: poi?.bagSlots ?? QUEST_STASH.bagSlots }, (_, i) => {
        const id = bag[i] ?? null;
        if (!id) return null;
        const row = rows.find((r) => r.itemId === id);
        return row ? { id, icon: row.icon, label: t(row.nameKey.replace(/^idleVillage\./, '')), qty: row.qty } : null;
      }),
      onReleaseItem: (itemId: string) => {
        const idx = bag.findIndex((id) => id === itemId);
        if (idx >= 0) stashState.release(POI_ID, idx);
      },
      /* Lab has no magazzino panel — binding keeps the ledger contract real. */
      onOpenStash: () => { stashState.bindStash(POI_ID); console.info('[cassetto-host] open stash'); },
    };
  }, [bag, stashState, t]);

  return (
    <DndContext
      sensors={session.sensors}
      onDragStart={session.handleDragStart}
      onDragEnd={session.handleDragEnd}
    >
      {/* R-374 rev2 (Director): witnesses/tests must show the cassetto WITHOUT the roster — the lab's docked
       *  roster panel (option-A composition for medal flights / click-to-assign) is removed. Resident
       *  assignment is exercised through the roster tests, not this host. */}
      {/* R-339/PLAN-119 T2: same mount as /game — the ExpeditionDrawer
       *  primitive owns the column + the collapse chip. */}
      <ExpeditionDrawer
        quest={quest}
        slots={slots}
        resourceItems={resourceItems}
        onSlotClear={(slotId) => session.handleSlotClear(slotId)}
        suppressedResidentIds={session.suppressedResidentIds}
        loadout={loadout}
        canSend={witnessCanSend || session.canSend}
        /* R-339/PLAN-119: same reason rule as the /game adapter — the lab
         *  shows the muted plaque's inline reason too. */
        disabledReason={
          witnessCanSend || session.canSend
            ? null
            : t(session.requiredFilled ? 'gameFrame.cassetto.confirmReason.unavailable' : 'gameFrame.cassetto.confirmReason.partyIncomplete')
        }
        onConfirm={() => session.send()}
        /* Same discard semantics as the /game adapter (Director 2026-11-20
         *  «× chiudi e perdi tutto»): seats clear via the real path, the bag
         *  releases to the pool, then the detail closes. */
        onClose={() => {
          slots.forEach((s) => { if (s.assignedResidentId) session.handleSlotClear(s.id); });
          stashState.releaseAll(POI_ID);
          session.closeDetail();
        }}
      />
      {/* The session's flight/extraction overlays — without them the medal
          flight never lands and the assignment never commits (the same layer
          /game mounts beside every expedition session). */}
      {session.overlays}
    </DndContext>
  );
};

export default HudRealCassettoHost;
