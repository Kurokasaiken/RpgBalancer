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
import type { QuestExpeditionDetailProps } from '@/ui/idleVillage/quests/QuestExpeditionDetail';
import { journeyFasiOf } from '@/ui/idleVillage/quests/questJourney';
import { QUEST_STASH } from '@/balancing/config/idleVillage/quests/questStash';
import { HudRealCassetto, type CassettoQuest, type LoadoutRow } from './HudRealCassetto';

/** `labelKey`/`descKey` may carry the `idleVillage.` prefix — stripped before `t`. */
const stripNs = (k: string) => k.replace(/^idleVillage\./, '');

export const HudRealCassettoDetail: React.FC<QuestExpeditionDetailProps> = (p) => {
  const { t } = useTranslation('idleVillage');

  const quest = useMemo<CassettoQuest>(() => {
    const fasi = journeyFasiOf(p.poi);
    const estimate = p.estimate;
    const danger =
      estimate !== 'computing' && estimate !== 'incomplete' && 'bands' in estimate
        ? estimate.bands.danger
        : undefined;
    return {
      title: p.scenario?.title ?? '',
      subtitle: t('gameFrame.cassetto.demo.subtitle', 'Pianifica la spedizione'),
      briefing: p.scenario?.offer.dispatch ?? p.scenario?.offer.objective ?? '',
      legs: [
        { label: t('gameFrame.cassetto.leg.outbound', 'Outbound'), days: fasi?.travelDays ?? 0 },
        { label: t('gameFrame.cassetto.leg.site', 'At site'), days: '—' },
        { label: t('gameFrame.cassetto.leg.return', 'Return'), days: fasi?.travelDays ?? 0 },
      ],
      riskLabel: danger ?? '—',
      rewards: [{ icon: 'gold', qty: String(p.scenario?.rewardBase ?? 60) }],
    };
  }, [p.poi, p.scenario, p.estimate, t]);

  /* Loadout = the session's REAL expedition items (shared village pool):
   * click packs/unpacks the planner's bag — same `onToggleItem` the stock
   * detail fires. Full bag disables unpacked rows. */
  const loadoutRows = useMemo<LoadoutRow[]>(() => {
    const full = p.selectedItemIds.length >= QUEST_STASH.bagSlots;
    return p.items.map((entry) => {
      const packed = p.selectedItemIds.includes(entry.item.id);
      return {
        id: entry.item.id,
        icon: entry.item.icon,
        label: t(stripNs(entry.item.labelKey)),
        qty: entry.qty,
        packed,
        disabled: !packed && full,
        onToggle: () => p.onToggleItem(entry.item.id),
      };
    });
  }, [p.items, p.selectedItemIds, p.onToggleItem, t]);

  return (
    <HudRealCassetto
      quest={quest}
      slots={p.slots}
      onSlotClear={p.onSlotClear}
      suppressedResidentIds={p.suppressedResidentIds}
      loadoutRows={loadoutRows}
      canSend={p.canSend}
      onConfirm={p.onSend}
    />
  );
};

export default HudRealCassettoDetail;
