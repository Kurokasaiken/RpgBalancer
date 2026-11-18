/**
 * HudRealCassettoDetail — drop-in replacement of `QuestExpeditionDetail` that
 * renders the signed cassetto drawer (R-333/R-334). Fed by the SAME production
 * props the expedition session hands the stock detail — read off the wrapped
 * node by the page's `wrapDetail`, so every byte shown (slots, estimate, bag,
 * canSend, send, clear) IS the real session state, never a lab fabrication.
 * `resourceItems` is an extra prop the page injects (the REAL village resource
 * readout) — the signed frame paints its own header well for it.
 */
import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import type { QuestExpeditionDetailProps } from '@/ui/idleVillage/quests/QuestExpeditionDetail';
import { journeyFasiOf } from '@/ui/idleVillage/quests/questJourney';
import { expeditionTotalDays } from '@/ui/idleVillage/quests/questExpedition';
import { DEFAULT_IDLE_VILLAGE_CONFIG } from '@/balancing/config/idleVillage/defaultConfig';
import { DANGER_BANDS } from '@/balancing/config/idleVillage/quests/questPois';
import type { ResourceReadoutItem } from '@/ui/idleVillage/components/gameFrame/ResourceReadout';
import { ExpeditionDrawer } from '@/ui/idleVillage/components/gameFrame/ExpeditionDrawer';
import { expeditionFoodCost } from '@/ui/idleVillage/components/gameFrame/expeditionBagAssign';
import { emptyStashBag, useVillageStashStore } from '@/ui/idleVillage/store/useVillageStashStore';
import type { CassettoLoadout, CassettoQuest } from './HudRealCassetto';

/** `labelKey`/`i18nKey` may carry the `idleVillage.` prefix — stripped before `t`. */
const stripNs = (k: string) => k.replace(/^idleVillage\./, '');

export type HudRealCassettoDetailProps = QuestExpeditionDetailProps & {
  /** REAL village resource readout for the frame's header well (R-339). */
  resourceItems?: ResourceReadoutItem[];
  /** R-339/PLAN-119 AC4: tapping a party seat opens the roster panel. */
  onOpenRoster?: () => void;
};

export const HudRealCassettoDetail: React.FC<HudRealCassettoDetailProps> = (p) => {
  const { t } = useTranslation('idleVillage');

  const quest = useMemo<CassettoQuest>(() => {
    const fasi = journeyFasiOf(p.poi);
    const estimate = p.estimate;
    const bandId =
      estimate !== 'computing' && estimate !== 'incomplete' && 'bands' in estimate
        ? estimate.bands.danger
        : undefined;
    /* Localized danger band — same `bandById` + i18nKey path the stock detail
     *  uses (was: the raw band id leaked through). */
    const dangerBand = bandId ? DANGER_BANDS.find((b) => b.id === bandId) : undefined;
    /* Middle leg + explicit total = the REAL expedition estimate (same
     *  `expeditionTotalDays` the stock detail uses), never placeholders. */
    const { site: siteDays, total: totalDays } = expeditionTotalDays(
      p.expeditionDuration.estimatedTicks,
      fasi?.travelDays ?? 0,
      DEFAULT_IDLE_VILLAGE_CONFIG.globalRules.dayLengthInTimeUnits,
    );
    /* T3-S2 consequence preview (artifact-r004 "reserved cost slot"): food
     *  the departing members consume over the whole journey — party seats
     *  filled × total days × the engine's per-resident daily rate
     *  (`globalRules.foodConsumptionPerResidentPerDay`). `insufficient`
     *  marks the value when the live food readout cannot cover it. */
    const partySize = p.slots.filter((s) => s.assignedResidentId).length;
    const costFood = expeditionFoodCost(
      partySize,
      totalDays,
      DEFAULT_IDLE_VILLAGE_CONFIG.globalRules.foodConsumptionPerResidentPerDay,
    );
    const foodItem = p.resourceItems?.find((item) => item.id === 'food');
    const foodStock = foodItem !== undefined ? Number(foodItem.value) : NaN;
    return {
      title: p.scenario?.title ?? '',
      subtitle: t('gameFrame.cassetto.demo.subtitle', 'Pianifica la spedizione'),
      briefing: p.scenario?.offer.dispatch ?? p.scenario?.offer.objective ?? '',
      legs: [
        { label: t('gameFrame.cassetto.leg.outbound', 'Outbound'), days: fasi?.travelDays ?? 0 },
        { label: t('gameFrame.cassetto.leg.site', 'At site'), days: siteDays },
        { label: t('gameFrame.cassetto.leg.return', 'Return'), days: fasi?.travelDays ?? 0 },
      ],
      totalDays,
      riskLabel: dangerBand ? t(stripNs(dangerBand.i18nKey)) : '—',
      rewards: [{ icon: 'gold', qty: String(p.scenario?.rewardBase ?? 60) }],
      costPreview: {
        icon: 'food',
        qty: String(costFood),
        insufficient: Number.isFinite(foodStock) && costFood > foodStock,
      },
    };
  }, [p.poi, p.scenario, p.estimate, p.expeditionDuration, p.slots, p.resourceItems, t]);

  /* Quest bag as SLOT FRAMES (R-337 contract): the ledger's sparse
   * `bags[poi.id]` is the authoritative slot layout — positions stay put,
   * a release leaves a hole in place, an assign lands in the first free
   * well. An empty pouch opens the bound magazzino (`onOpenStash` — the
   * session binds the stash owner to THIS poi first); a packed tile
   * releases its item back to the shared pool via the real `toggleItem`. */
  const stashBag = useVillageStashStore((s) => s.bags[p.poi.id]);
  const loadout = useMemo<CassettoLoadout>(() => {
    const bag = stashBag ?? emptyStashBag();
    return {
      slots: emptyStashBag().map((_, i) => {
        const id = bag[i] ?? null;
        if (!id) return null;
        const entry = p.items.find((e) => e.item.id === id);
        if (!entry) return null;
        return {
          id: entry.item.id,
          icon: entry.item.icon,
          label: t(stripNs(entry.item.labelKey)),
          qty: entry.qty,
        };
      }),
      onReleaseItem: p.onToggleItem,
      onOpenStash: p.onOpenStash,
    };
  }, [stashBag, p.items, p.onToggleItem, p.onOpenStash, t]);

  /* R-339/PLAN-119 T2: the mount is the `ExpeditionDrawer` primitive — the
   *  signed column plus its fold contract (collapse chip ⇄ right-edge chip).
   *  The same props flow through untouched. */
  return (
    <ExpeditionDrawer
      quest={quest}
      slots={p.slots}
      resourceItems={p.resourceItems}
      onSlotClick={p.onOpenRoster ? () => p.onOpenRoster!() : undefined}
      onSlotClear={p.onSlotClear}
      suppressedResidentIds={p.suppressedResidentIds}
      onSlotPhaseChange={p.onSlotPhaseChange}
      loadout={loadout}
      canSend={p.canSend}
      disabledReason={p.canSend ? null : t('questExpedition.forecast.incomplete')}
      onConfirm={p.onSend}
    />
  );
};

export default HudRealCassettoDetail;
