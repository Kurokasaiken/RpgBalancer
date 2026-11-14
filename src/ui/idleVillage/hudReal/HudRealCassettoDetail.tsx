/**
 * HudRealCassettoDetail — drop-in replacement of `QuestExpeditionDetail` that
 * renders the signed cassetto drawer (R-333, "lo slot corretto" surface).
 * Fed by the SAME production props the expedition session hands the stock
 * detail — read off the wrapped node by the page's `wrapDetail`, so every
 * byte shown (slots, estimate, items, canSend, send, clear) IS the real
 * session state, never a lab fabrication.
 */
import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { selectResourceOutlook, useMinimalGameplayWithIdleVillageConfig } from '@/store/useMinimalGameplay';
import { buildResourceReadoutItems } from '@/ui/idleVillage/components/gameFrame';
import type { QuestExpeditionDetailProps } from '@/ui/idleVillage/quests/QuestExpeditionDetail';
import { journeyFasiOf } from '@/ui/idleVillage/quests/questJourney';
import { expeditionTotalDays } from '@/ui/idleVillage/quests/questExpedition';
import { DEFAULT_IDLE_VILLAGE_CONFIG } from '@/balancing/config/idleVillage/defaultConfig';
import { HudRealCassetto, type CassettoQuest, type CassettoLoadout } from './HudRealCassetto';
import { emptyStashBag, useVillageStashStore } from '@/ui/idleVillage/store/useVillageStashStore';

/** `labelKey`/`descKey` may carry the `idleVillage.` prefix — stripped before `t`. */
const stripNs = (k: string) => k.replace(/^idleVillage\./, '');

export const HudRealCassettoDetail: React.FC<QuestExpeditionDetailProps> = (p) => {
  const { t } = useTranslation('idleVillage');
  /* The drawer's own resources band — same selector + builder the page's
   *  top-right slot uses, so the cassetto shows the REAL readout while its
   *  body covers that slot. */
  const { state, config } = useMinimalGameplayWithIdleVillageConfig();
  const resourceItems = useMemo(
    () => buildResourceReadoutItems(selectResourceOutlook(state, config), t),
    [state, config, t],
  );

  const quest = useMemo<CassettoQuest>(() => {
    const fasi = journeyFasiOf(p.poi);
    const estimate = p.estimate;
    const danger =
      estimate !== 'computing' && estimate !== 'incomplete' && 'bands' in estimate
        ? estimate.bands.danger
        : undefined;
    /* Middle leg = the REAL on-site estimate (same `expeditionTotalDays` the
     *  stock detail uses), not a placeholder. */
    const { site: siteDays } = expeditionTotalDays(
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
      riskLabel: danger ?? '—',
      rewards: [{ icon: 'gold', qty: String(p.scenario?.rewardBase ?? 60) }],
    };
  }, [p.poi, p.scenario, p.estimate, p.expeditionDuration, t]);

  /* Quest bag as SLOT FRAMES (R-337): the ledger's sparse `bags[poi.id]`
   * is the authoritative slot layout — the same slice the bound
   * `VillageStashPanel` writes into via `assign`. Empty slot → `onOpenStash`
   * (binds this POI + opens the magazzino); packed slot → `onToggleItem`
   * releases the item (the session's toggle is in-bag ⇒ release). */
  const stashBag = useVillageStashStore((s) => s.bags[p.poi.id]);
  const loadout = useMemo<CassettoLoadout>(() => {
    const bag = stashBag ?? emptyStashBag();
    return {
      slots: emptyStashBag().map((_, i) => {
        const id = bag[i] ?? null;
        if (!id) return null;
        const entry = p.items.find((e) => e.item.id === id);
        if (!entry) return null;
        return { id, icon: entry.item.icon, label: t(stripNs(entry.item.labelKey)), qty: entry.qty };
      }),
      onReleaseItem: p.onToggleItem,
      onOpenStash: p.onOpenStash,
    };
  }, [stashBag, p.items, p.onToggleItem, p.onOpenStash, t]);

  return (
    <HudRealCassetto
      quest={quest}
      slots={p.slots}
      resourceItems={resourceItems}
      onSlotClear={p.onSlotClear}
      suppressedResidentIds={p.suppressedResidentIds}
      loadout={loadout}
      canSend={p.canSend}
      onConfirm={p.onSend}
    />
  );
};

export default HudRealCassettoDetail;
