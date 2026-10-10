/**
 * QuestExpeditionDetail — the POI's live planning surface (PLAN-019-S2.4
 * T-2): offer header, the trusted `ResidentSlotRack`, the dynamic party
 * forecast, the loadout pick and the «Invia spedizione» commit. Pure
 * presentation — all numbers come from `resolved` (the frozen offer) and
 * `estimate` (the chunked Monte Carlo), all strings from i18n.
 */
import React from 'react';
import { useTranslation } from 'react-i18next';
import { FloatingPanel } from '@/ui/idleVillage/components/FloatingPanel';
import { ResidentSlotRack } from '@/ui/idleVillage/components/ResidentSlotRack';
import { SkinButton } from '@/ui/idleVillage/skins/primitives';
import { HudChip, TONE } from '@/ui/idleVillage/questS1Lab/hud/atoms';
import type { ResidentSlotViewModel } from '@/ui/idleVillage/slots/types';
import type { QuestPoi, DangerBand } from '@/balancing/config/idleVillage/quests/questPois';
import { DANGER_BANDS } from '@/balancing/config/idleVillage/quests/questPois';
import { REWARD_TIERS } from '@/balancing/config/idleVillage/quests/rewardTiers';
import { QUEST_STASH, loadoutCoverage } from '@/balancing/config/idleVillage/quests/questStash';
import { toEngineFlag } from '@/balancing/config/idleVillage/quests/questItems';
import type { QuestItem } from '@/balancing/config/idleVillage/quests/questItems.schema';
import type { QuestScenario } from '@/balancing/config/idleVillage/quests/questScenario.schema';
import { QUEST_PLANNER_INFO } from '@/balancing/config/idleVillage/quests/questPlannerInfo';
import type { PartyEstimate, ResolvedQuestOffer } from '@/ui/idleVillage/questS1Lab/questOffer';
import type { ForecastDelta } from '@/ui/idleVillage/questS1Lab/questSimulation';
import type { LoadoutDuration } from './questExpedition';
import { STAT_ICONS } from '@/ui/idleVillage/questS1Lab/questRun';
import { STAT_SHORT } from '@/ui/idleVillage/questS1Lab/hud/atoms';
import { getStatIconComponent, lucideStatIcons } from '@/ui/shared/statIconUtils';

const FONT = { display: 'var(--skin-font-display)', serif: 'var(--skin-font-serif)' } as const;

/** Config i18nKeys are authored `idleVillage.…`-prefixed; the namespace is
 *  already `idleVillage` — strip the prefix before `t()`. */
const stripNs = (key: string) => key.replace(/^idleVillage\./, '');

const bandById = (id: string): DangerBand | undefined => DANGER_BANDS.find((b) => b.id === id);

/** engine flag → stash entry: the static catalog join the loadout zone
 *  needs for effect tooltips (`descKey` lives on the stash item). */
const STASH_BY_FLAG = new Map(QUEST_STASH.items.map((i) => [i.flag, i]));

export interface QuestExpeditionDetailProps {
  poi: QuestPoi;
  scenario: QuestScenario | undefined;
  /** Frozen offer — `null` while the resolution (band sim) is pending. */
  resolved: ResolvedQuestOffer | null;
  resolvePending: boolean;
  slots: ResidentSlotViewModel[];
  /** 'computing' while a fresh sim is in flight, 'incomplete' until every
   *  required slot is filled, else the banded estimate. */
  estimate: PartyEstimate | 'computing';
  /** Signed pp shift vs the previous party configuration (S3 T-2) —
   *  `null` when no real previous sim exists. */
  forecastDelta: ForecastDelta | null;
  /** Planning intel rows: authored `previewHint`s always, `revealHint`s
   *  when an explorer slot unlocked them (D-S3-3). */
  intelHints: { nodeId: string; hint: string; revealed: boolean }[];
  /** Effective expedition duration under the loadout (S3 T-3):
   *  `factor ≠ 1` ⇒ the bag changes the run's real pace. */
  expeditionDuration: LoadoutDuration;
  requiredFilled: boolean;
  items: QuestItem[];
  selectedItemIds: string[];
  onToggleItem: (itemId: string) => void;
  canSend: boolean;
  onSend: () => void;
  onClose: () => void;
  onSlotClear: (slotId: string) => void;
  position?: { x: number; y: number };
}

export const QuestExpeditionDetail: React.FC<QuestExpeditionDetailProps> = ({
  poi,
  scenario,
  resolved,
  resolvePending,
  slots,
  estimate,
  forecastDelta,
  intelHints,
  expeditionDuration,
  requiredFilled,
  items,
  selectedItemIds,
  onToggleItem,
  canSend,
  onSend,
  onClose,
  onSlotClear,
  position,
}) => {
  const { t } = useTranslation('idleVillage');
  const dangerBand = resolved ? bandById(resolved.resolvedOffer.bandIds.danger) : undefined;
  const rewardTier = resolved ? REWARD_TIERS.find((rt) => rt.id === resolved.resolvedOffer.bandIds.rewardTier) : undefined;
  const ready = !resolvePending && typeof estimate === 'object';

  /** Signed pp badge for a delta metric — `0` renders nothing (no noise). */
  const deltaMark = (pp: number, goodWhenDown: boolean) => {
    const v = Math.round(pp);
    if (v === 0) return null;
    const improves = goodWhenDown ? v < 0 : v > 0;
    return (
      <em style={{ fontStyle: 'normal', fontSize: 10, color: improves ? 'var(--skin-success, #7ed39a)' : 'var(--skin-danger, #e07a7a)' }}>
        {v > 0 ? '+' : ''}
        {v}
      </em>
    );
  };

  return (
    <FloatingPanel
      panelId={`quest-expedition-${poi.id}`}
      title={scenario?.title ?? poi.id}
      icon="⚔"
      width={520}
      maxBodyHeight={QUEST_PLANNER_INFO.outcome.panelMaxBodyHeightPx}
      initialPosition={position}
      onClose={onClose}
    >
      <div data-testid="quest-expedition-detail" data-poi-id={poi.id} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {/* Offer header — objective, tags, frozen band/tier/duration. */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {scenario?.offer.objective && (
            <p style={{ margin: 0, fontFamily: FONT.serif, fontSize: 14, lineHeight: 1.45, color: TONE.text }}>
              {scenario.offer.objective}
            </p>
          )}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {scenario?.offer.tags?.map((tag) => (
              <HudChip key={tag} tone="secondary">{tag}</HudChip>
            ))}
            {dangerBand && (
              <span data-testid="quest-expedition-band">
                <HudChip tone="danger">
                  {t('questExpedition.danger')}: {t(stripNs(dangerBand.i18nKey))}
                </HudChip>
              </span>
            )}
            {rewardTier && resolved && (
              <span data-testid="quest-expedition-reward">
                <HudChip tone="ok">
                  {t(stripNs(rewardTier.i18nKey))} · {resolved.resolvedOffer.rewardResolved}
                </HudChip>
              </span>
            )}
            <span data-testid="quest-expedition-duration">
              <HudChip tone={expeditionDuration.factor < 1 ? 'ok' : expeditionDuration.factor > 1 ? 'warn' : 'secondary'}>
                {t('questExpedition.duration', { ticks: expeditionDuration.estimatedTicks })}
                {expeditionDuration.factor !== 1 && (
                  <em style={{ fontStyle: 'normal', fontSize: 10 }}> ×{expeditionDuration.factor.toFixed(2)}</em>
                )}
              </HudChip>
            </span>
          </div>
        </div>

        {/* Slots — the trusted rack; drop-state comes from the session's
         *  quest eligibility resolver. */}
        <ResidentSlotRack
          slots={slots}
          layout="detail"
          onSlotClear={onSlotClear}
          slotSize={56}
        />

        {/* OUTCOME zone (S3 T-2): aggregate → BY MEMBER → WHY inside a
         *  scrollable analysis region — offer header, slot rack, loadout
         *  and send stay anchored (same contract as QuestRunWindow D-7).
         *  Never partial numbers: 'computing' and 'incomplete' are whole
         *  states, a stale estimate never bleeds through. */}
        <div
          data-testid="quest-expedition-forecast"
          data-forecast-state={estimate === 'computing' ? 'computing' : estimate === 'incomplete' ? 'incomplete' : 'ready'}
          className="quest-s1-scroll"
          style={{ maxHeight: QUEST_PLANNER_INFO.outcome.analysisMaxHeightPx, overflowY: 'auto', borderTop: '1px solid color-mix(in srgb, var(--skin-text-secondary) 25%, transparent)', paddingTop: 10, display: 'flex', flexDirection: 'column', gap: 8 }}
        >
          <span style={{ fontFamily: FONT.display, fontSize: 12, letterSpacing: '0.08em', textTransform: 'uppercase', color: TONE.secondary }}>
            {t('questExpedition.forecast.title')}
          </span>
          {resolvePending && <span style={{ fontFamily: FONT.serif, fontSize: 13, color: TONE.secondary }}>{t('questExpedition.forecast.resolving')}</span>}
          {!resolvePending && estimate === 'computing' && (
            <span style={{ fontFamily: FONT.serif, fontSize: 13, color: TONE.secondary }}>{t('questExpedition.forecast.computing')}</span>
          )}
          {!resolvePending && estimate === 'incomplete' && (
            <span style={{ fontFamily: FONT.serif, fontSize: 13, color: TONE.secondary }}>{t('questExpedition.forecast.incomplete')}</span>
          )}
          {ready && typeof estimate === 'object' && (
            <>
              {/* Aggregato — headline chips; the appended mark is the signed
               *  pp shift vs the previous party configuration. */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                <span data-testid="forecast-reward-pct">
                  <HudChip tone="ok">
                    {t('questExpedition.forecast.reward', { pct: estimate.sim.outcomePct.reward.toFixed(0) })}
                    {forecastDelta && deltaMark(forecastDelta.rewardPp, false)}
                  </HudChip>
                </span>
                <span data-testid="forecast-wound-pct">
                  <HudChip tone="warn">
                    {t('questExpedition.forecast.wound', { pct: estimate.sim.anyWoundPct.toFixed(0) })}
                    {forecastDelta && deltaMark(forecastDelta.woundPp, true)}
                  </HudChip>
                </span>
                <span data-testid="forecast-death-pct">
                  <HudChip tone="danger">
                    {t('questExpedition.forecast.death', { pct: estimate.sim.anyDeathPct.toFixed(0) })}
                    {forecastDelta && deltaMark(forecastDelta.deathPp, true)}
                  </HudChip>
                </span>
                <span data-testid="forecast-wipe-pct">
                  <HudChip tone="danger">
                    {t('questExpedition.forecast.wipe', { pct: estimate.sim.outcomePct.wipe.toFixed(0) })}
                    {forecastDelta && deltaMark(forecastDelta.wipePp, true)}
                  </HudChip>
                </span>
              </div>

              {/* BY MEMBER — per-member wound/death odds and expected
               *  downtime, straight from `sim.perMember`. */}
              <div data-testid="forecast-members" style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                <span style={{ fontFamily: FONT.display, fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', color: TONE.secondary }}>
                  {t('questExpedition.members.title')}
                </span>
                {estimate.sim.perMember.map((m) => (
                  <div key={m.id} data-testid={`forecast-member-${m.id}`} style={{ display: 'flex', alignItems: 'baseline', gap: 8, fontFamily: FONT.serif, fontSize: 12 }}>
                    <span style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: TONE.text }}>
                      {m.name}
                      <span style={{ color: TONE.secondary }}> · {t(`questExpedition.members.role.${m.role}`)}</span>
                    </span>
                    <span style={{ color: TONE.secondary, whiteSpace: 'nowrap' }}>
                      {t('questExpedition.members.row', { wound: m.woundPct.toFixed(0), death: m.deathPct.toFixed(0) })}
                    </span>
                    {m.downtimeDays >= 0.5 && (
                      <span style={{ color: TONE.secondary, whiteSpace: 'nowrap' }}>
                        {t('questExpedition.members.downtime', { days: m.downtimeDays.toFixed(1) })}
                      </span>
                    )}
                  </div>
                ))}
              </div>

              {/* WHY — which authored node produced the harm, attributed
               *  inside the sims (top-N per config; the tail collapses). */}
              {estimate.sim.whyBySource.length > 0 && (
                <div data-testid="forecast-why" style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  <span style={{ fontFamily: FONT.display, fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', color: TONE.secondary }}>
                    {t('questExpedition.why.title')}
                  </span>
                  {estimate.sim.whyBySource.slice(0, QUEST_PLANNER_INFO.outcome.maxWhySources).map((src) => (
                    <div key={src.source} data-testid="forecast-why-row" style={{ fontFamily: FONT.serif, fontSize: 12, color: TONE.text, lineHeight: 1.35 }}>
                      <span style={{ color: TONE.secondary }}>«{src.source}» </span>
                      {t('questExpedition.why.row', { runs: src.runsPct.toFixed(0), death: src.deathSharePct.toFixed(0), wound: src.woundSharePct.toFixed(0) })}
                    </div>
                  ))}
                </div>
              )}

              {/* Intel — authored preview hints always; deeper `revealHint`s
               *  unlock via `revealAtPlanning` (D-S3-3). TODO: the source will
               *  be external scouting, not a party slot (Director 2026-10-10). */}
              {intelHints.length > 0 && (
                <div data-testid="forecast-intel" style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  <span style={{ fontFamily: FONT.display, fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', color: TONE.secondary }}>
                    {t('questExpedition.intel.title')}
                  </span>
                  {intelHints.map((h) => (
                    <div key={`${h.nodeId}-${h.revealed ? 'r' : 'p'}`} data-testid="forecast-intel-row" style={{ fontFamily: FONT.serif, fontSize: 12, color: TONE.text, lineHeight: 1.35 }}>
                      {h.revealed && <HudChip tone="ok">{t('questExpedition.intel.scouted')}</HudChip>} {h.hint}
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        {/* Loadout — the real item ids (engineFlag bridge), capped by the
         *  stash's bagSlots. */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <span style={{ fontFamily: FONT.display, fontSize: 12, letterSpacing: '0.08em', textTransform: 'uppercase', color: TONE.secondary }}>
            {t('questExpedition.loadout', { count: selectedItemIds.length, max: QUEST_STASH.bagSlots })}
          </span>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }} data-testid="quest-expedition-loadout">
            {items.map((item) => {
              const selected = selectedItemIds.includes(item.id);
              const full = !selected && selectedItemIds.length >= QUEST_STASH.bagSlots;
              /* Effect tooltip: catalog `descKey` first, then the stash
               *  entry's `descKey` via the engine-flag join. */
              const descKey = item.descKey ?? (item.engineFlag ? STASH_BY_FLAG.get(item.engineFlag)?.descKey : undefined);
              return (
                <SkinButton
                  key={item.id}
                  variant={selected ? 'cta' : 'utility'}
                  data-testid={`loadout-item-${item.id}`}
                  aria-pressed={selected}
                  disabled={full}
                  title={descKey ? t(descKey) : undefined}
                  onClick={() => onToggleItem(item.id)}
                >
                  {t(stripNs(item.labelKey))}
                </SkinButton>
              );
            })}
          </div>
          {/* Coverage — which of the quest's declared primary stats the bag
           *  covers (same vocabulary the check consumables serve). */}
          {(scenario?.primaryStats?.length ?? 0) > 0 && (
            <div data-testid="loadout-coverage" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontFamily: FONT.display, fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', color: TONE.secondary }}>
                {t('questExpedition.coverage')}
              </span>
              {scenario!.primaryStats!.map((s) => {
                const covered = loadoutCoverage(selectedItemIds.map(toEngineFlag)).includes(s);
                const Icon = getStatIconComponent(STAT_ICONS[s]) ?? lucideStatIcons.star;
                return (
                  <span
                    key={s}
                    title={STAT_SHORT[s]}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontFamily: FONT.display, fontSize: 11, color: covered ? 'var(--skin-success, #7ed39a)' : TONE.secondary }}
                  >
                    {Icon && <Icon style={{ width: 12, height: 12 }} aria-hidden />}
                    {STAT_SHORT[s] ?? s} {covered ? '✓' : '—'}
                  </span>
                );
              })}
            </div>
          )}
        </div>

        <SkinButton
          variant="cta"
          data-testid="quest-expedition-send"
          disabled={!canSend}
          aria-disabled={!canSend}
          onClick={onSend}
        >
          {t('questExpedition.send')}
        </SkinButton>
      </div>
    </FloatingPanel>
  );
};

export default QuestExpeditionDetail;
