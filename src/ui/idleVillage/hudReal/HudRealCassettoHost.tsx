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
import { questPoiById } from '@/balancing/config/idleVillage/quests/questPois';
import { useVillageStashStore } from '@/ui/idleVillage/store/useVillageStashStore';
import { villageStashViewModel } from '@/ui/idleVillage/components/gameFrame/villageStashViewModel';
import { VILLAGE_STASH_CONFIG } from '@/balancing/config/idleVillage/villageStashConfig';
import { QUEST_STASH } from '@/balancing/config/idleVillage/quests/questStash';
import { journeyFasiOf } from '@/ui/idleVillage/quests/questJourney';
import { scenarioForQuest } from '@/ui/idleVillage/questS1Lab/questOffer';
import { DndContext } from '@dnd-kit/core';
import { MatericRosterComponentV2 } from '@/ui/idleVillage/rosterV2';
import { SkinScope } from '@/ui/idleVillage/skins/primitives';
import { HudRealCassetto, type CassettoQuest, type LoadoutRow } from './HudRealCassetto';

const POI_ID = 'poi-goblin';
/** Stable empty bag — inline `?? []` inside the store selector mints a new array
 *  per snapshot and trips getSnapshot's infinite-loop guard. */
const EMPTY_BAG: readonly (string | null)[] = [];

export const HudRealCassettoHost: React.FC = () => {
  const { t } = useTranslation('idleVillage');
  const poi = useMemo(() => questPoiById(POI_ID), []);
  const questRun = useQuestRun('goblin');
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



  const scenario = useMemo(() => scenarioForQuest('goblin'), []);

  const quest: CassettoQuest = useMemo(() => {
    const fasi = poi ? journeyFasiOf(poi) : null;
    const label = session.poiView?.activity?.label ?? scenario?.title ?? 'Spedizione';
    const estimate = session.estimate;
    const danger =
      estimate && estimate !== 'incomplete' && 'bands' in estimate
        ? estimate.bands.danger
        : undefined;
    return {
      title: label,
      subtitle: t('gameFrame.cassetto.demo.subtitle', 'Pianifica la spedizione'),
      briefing: scenario?.offer.dispatch ?? scenario?.offer.objective ?? '',
      legs: [
        { label: t('gameFrame.cassetto.leg.outbound', 'Outbound'), days: fasi?.travelDays ?? 0 },
        { label: t('gameFrame.cassetto.leg.site', 'At site'), days: '—' },
        { label: t('gameFrame.cassetto.leg.return', 'Return'), days: fasi?.travelDays ?? 0 },
      ],
      riskLabel: danger ?? '—',
      rewards: [
        { icon: 'gold', qty: String(scenario?.rewardBase ?? 60) },
      ],
    };
  }, [poi, scenario, session.poiView, session.estimate, t]);

  /* Loadout rows: the REAL ledger bag — click packs (assign) / unpacks (release). */
  const loadoutRows: LoadoutRow[] = useMemo(() => {
    const bagItemIds = bag.filter((id): id is string => Boolean(id));
    return villageStashViewModel(VILLAGE_STASH_CONFIG).rows.slice(0, 5).map((row) => {
      const packed = bagItemIds.includes(row.itemId);
      const full = !packed && bagItemIds.length >= QUEST_STASH.bagSlots;
      return {
        id: row.itemId,
        icon: row.icon,
        label: row.label ?? row.itemId,
        qty: row.qty,
        packed,
        disabled: full,
        onToggle: () => {
          if (packed) {
            const idx = bag.findIndex((id) => id === row.itemId);
            if (idx >= 0) stashState.release(POI_ID, idx);
          } else if (!full) {
            stashState.assign(POI_ID, row.itemId);
          }
        },
      };
    });
  }, [bag, stashState]);

  const slots = session.controller.slots as unknown as import('@/ui/idleVillage/slots/types').ResidentSlotViewModel[];

  return (
    <DndContext
      sensors={session.sensors}
      onDragStart={session.handleDragStart}
      onDragEnd={session.handleDragEnd}
    >
      {/* The REAL roster — the resident cards carry `data-resident-id` so the
          session's medal flight lands; onResidentSelect is the production
          click-to-assign path (first free matching slot). Docked left of the
          drawer — the signed planner composition (option A). */}
      <div data-detail-open={String(session.isDetailOpen)} data-can-send={String(session.canSend)} data-assigned={Object.values(session.assignments).filter(Boolean).length} style={{ position: 'absolute', right: 400, top: 0, bottom: 0, width: 300, zIndex: 6 }}>
        {/* LAB DEBUG — bypass the roster wiring: fire the session's real
            handleResidentSelect for each kit resident and log the verdict. */}
        <button
          type="button" data-cassetto-debug="select-first"
          onClick={() => {
            const ids = Array.from(document.querySelectorAll('[data-resident-id]'), (el) => el.getAttribute('data-resident-id')).filter(Boolean) as string[];
            console.info('[cassetto-host] cards in dom:', ids.length);
            for (const rid of ids.slice(0, 4)) {
              const ok = session.handleResidentSelect(rid);
              const compat = session.getResidentCompatibility(rid);
              console.info('[cassetto-host]', rid, 'compat:', JSON.stringify(compat), 'select→', ok);
              if (ok) break;
            }
          }}
          style={{ position: 'absolute', top: -34, left: 0, fontSize: 10, padding: '2px 8px', opacity: .5 }}
        >dbg</button>
        <SkinScope style={{ height: '100%' }}>
          <MatericRosterComponentV2
            componentId="cassetto-host-roster"
            density="compact"
            onResidentSelect={(rid) => {
              const ok = session.handleResidentSelect(rid);
              console.info('[cassetto-host] select', rid, '→', ok, '| detailOpen:', session.isDetailOpen);
            }}
            lockedResidentIds={session.lockedResidentIds}
            getResidentCompatibility={session.getResidentCompatibility}
          />
        </SkinScope>
      </div>
      <HudRealCassetto
        quest={quest}
        slots={slots}
        onSlotClear={(slotId) => session.handleSlotClear(slotId)}
        suppressedResidentIds={session.suppressedResidentIds}
        loadoutRows={loadoutRows}
        canSend={session.canSend}
        onConfirm={() => session.send()}
      />
      {/* The session's flight/extraction overlays — without them the medal
          flight never lands and the assignment never commits (the same layer
          /game mounts beside every expedition session). */}
      {session.overlays}
    </DndContext>
  );
};

export default HudRealCassettoHost;
