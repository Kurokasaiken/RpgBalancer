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
import { QUEST_STASH } from '@/balancing/config/idleVillage/quests/questStash';
import { DEFAULT_IDLE_VILLAGE_CONFIG } from '@/balancing/config/idleVillage/defaultConfig';
import { DANGER_BANDS } from '@/balancing/config/idleVillage/quests/questPois';
import type { ResourceReadoutItem } from '@/ui/idleVillage/components/gameFrame/ResourceReadout';
import { HudRealCassetto, type CassettoLoadout, type CassettoQuest } from './HudRealCassetto';

/** `labelKey`/`i18nKey` may carry the `idleVillage.` prefix — stripped before `t`. */
const stripNs = (k: string) => k.replace(/^idleVillage\./, '');

export type HudRealCassettoDetailProps = QuestExpeditionDetailProps & {
  /** REAL village resource readout for the frame's header well (R-339). */
  resourceItems?: ResourceReadoutItem[];
  /** R-339/PLAN-119 AC4: tapping a party seat opens the roster rail. */
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
    };
  }, [p.poi, p.scenario, p.estimate, p.expeditionDuration, t]);

  /* Quest bag as SLOT FRAMES (R-337 contract): `bagSlots` wells, slot i =
   * `selectedItemIds[i]` (selection order, same as the stock `QuestBagSlot`).
   * An empty pouch opens the bound magazzino (`onOpenStash` — the session
   * binds the stash owner to THIS poi first); a packed tile releases its item
   * back to the shared pool via the real `toggleItem`. */
  const loadout = useMemo<CassettoLoadout>(
    () => ({
      slots: Array.from({ length: QUEST_STASH.bagSlots }, (_, i) => {
        const id = p.selectedItemIds[i];
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
      onReleaseItem: (itemId: string) => p.onToggleItem(itemId),
      onOpenStash: p.onOpenStash,
    }),
    [p.selectedItemIds, p.items, p.onToggleItem, p.onOpenStash, t],
  );

  return (
    <HudRealCassetto
      quest={quest}
      slots={p.slots}
      resourceItems={p.resourceItems}
      onSlotClick={p.onOpenRoster ? () => p.onOpenRoster!() : undefined}
      onSlotClear={p.onSlotClear}
      suppressedResidentIds={p.suppressedResidentIds}
      loadout={loadout}
      canSend={p.canSend}
      disabledReason={p.canSend ? null : t('questExpedition.forecast.incomplete')}
      onConfirm={p.onSend}
    />
  );
};

export default HudRealCassettoDetail;
