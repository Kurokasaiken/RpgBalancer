/**
 * QuestExpeditionDetail — the POI's live planning surface (PLAN-019-S2.4
 * T-2): offer header, the trusted `ResidentSlotRack`, the dynamic party
 * forecast, the loadout pick and the «Invia spedizione» commit. Pure
 * presentation — all numbers come from `resolved` (the frozen offer) and
 * `estimate` (the chunked Monte Carlo), all strings from i18n.
 */
import React, { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { useTranslation } from 'react-i18next';
import * as Tooltip from '@radix-ui/react-tooltip';
import { Maximize2, Minus, Swords, X } from 'lucide-react';
import { ResidentSlotRack } from '@/ui/idleVillage/components/ResidentSlotRack';
import { HudPlaque, SkinButton, SkinScope } from '@/ui/idleVillage/skins/primitives';
import { HudChip, TONE } from '@/ui/idleVillage/questS1Lab/hud/atoms';
import { useHudPanelDrag } from '@/ui/idleVillage/components/gameFrame/useHudPanelDrag';
import { VillageStashItemIcon } from '@/ui/idleVillage/components/gameFrame/villageStashItemIcons';
import { EngravedIcon } from '@/ui/idleVillage/components/gameFrame/engravedIcons';
import { DEFAULT_GAME_FRAME_CONFIG } from '@/balancing/config/idleVillage/gameFrameConfig';
import type { ResidentSlotViewModel } from '@/ui/idleVillage/slots/types';
import type { QuestPoi, DangerBand } from '@/balancing/config/idleVillage/quests/questPois';
import { DANGER_BANDS } from '@/balancing/config/idleVillage/quests/questPois';
import { REWARD_TIERS } from '@/balancing/config/idleVillage/quests/rewardTiers';
import { QUEST_STASH, loadoutCoverage } from '@/balancing/config/idleVillage/quests/questStash';
import { toEngineFlag } from '@/balancing/config/idleVillage/quests/questItems';
import type { QuestScenario } from '@/balancing/config/idleVillage/quests/questScenario.schema';
import { QUEST_PLANNER_INFO } from '@/balancing/config/idleVillage/quests/questPlannerInfo';
import type { PartyEstimate, ResolvedQuestOffer } from '@/ui/idleVillage/questS1Lab/questOffer';
import type { ForecastDelta } from '@/ui/idleVillage/questS1Lab/questSimulation';
import type { ResidentState } from '@/engine/game/idleVillage/TimeEngine';
import type { LabStat } from '@/ui/idleVillage/questS1Lab/questScenario';
import { residentToQuestMember } from '@/ui/idleVillage/questS1Lab/residentToQuestMember';
import { NODE_ART } from '@/ui/idleVillage/questS1Lab/questArt';
import { deriveKeyStats, type BagStockEntry, type LoadoutDuration } from './questExpedition';
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

/** Shared tooltip surface styling — same lacquer idiom as QuestRunWindow. */
const TOOLTIP_STYLE: CSSProperties = {
  zIndex: 2000,
  maxWidth: 280,
  padding: '9px 11px',
  borderRadius: 8,
  border: '1px solid color-mix(in srgb, var(--skin-surface-border) 70%, transparent)',
  background: 'var(--skin-hud-lacquer-deep)',
  boxShadow: '0 10px 24px color-mix(in srgb, var(--skin-hud-lacquer-deep) 80%, transparent)',
};

/**
 * Rich tooltip for a bag item (PLAN-036, R-195): name, effect description,
 * stat coverage and village stock. Tiles stay icon-only — ALL text lives
 * here. `labelKey`/`descKey` may carry the `idleVillage.` prefix (stripped)
 * or be `questS1Lab.*` (verbatim).
 */
const BagItemTooltip: React.FC<{ entry: BagStockEntry }> = ({ entry }) => {
  const { t } = useTranslation('idleVillage');
  const { item, qty } = entry;
  const stash = item.engineFlag ? STASH_BY_FLAG.get(item.engineFlag) : undefined;
  const descKey = item.descKey ?? stash?.descKey;
  const line: CSSProperties = { fontFamily: FONT.serif, fontSize: 12, lineHeight: 1.35, color: TONE.text };
  return (
    <Tooltip.Portal>
      <Tooltip.Content side="top" sideOffset={6} style={TOOLTIP_STYLE}>
        <div style={{ fontFamily: FONT.display, fontSize: 13, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--skin-title-color)', marginBottom: 4 }}>
          {t(stripNs(item.labelKey))}
        </div>
        {descKey && <div style={line}>{t(descKey)}</div>}
        {stash?.stats && stash.stats.length > 0 && (
          <div style={{ ...line, color: TONE.secondary }}>
            {t('questExpedition.bag.covers')} {stash.stats.map((s) => STAT_SHORT[s] ?? s).join(' · ')}
          </div>
        )}
        <div style={{ ...line, color: TONE.secondary }}>{t('questExpedition.bag.stock', { qty })}</div>
      </Tooltip.Content>
    </Tooltip.Portal>
  );
};

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
  /** Village-stocked consumables the bag can hold (PLAN-036): the shelf IS
   *  the picker's catalogue — `qty` feeds each tile's stock badge. */
  items: BagStockEntry[];
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
  const [minimised, setMinimised] = useState(false);
  /* PLAN-036 (R-195): the external bag picker — conditionally rendered,
   *  Escape/click-outside close it (picker ONLY — a global capture handler
   *  stops the key before any panel-level handler sees it) and focus
   *  returns to the toggle. */
  const [pickerOpen, setPickerOpen] = useState(false);
  const pickerRef = useRef<HTMLDivElement | null>(null);
  const pickerToggleRef = useRef<HTMLButtonElement | null>(null);
  /* PLAN-036: the two-plaque assembly is ONE drag union — `shellRef` makes
   *  the clamp/re-clamp (companion resize, viewport resize) cover both
   *  plaques and the absolutely-positioned picker (`data-hud-companion`). */
  const shellRef = useRef<HTMLDivElement | null>(null);
  const { panelStyle, handleProps } = useHudPanelDrag({ shellRef, edgeInsetPx: 12, reclampDeps: [pickerOpen] });
  useEffect(() => {
    if (!pickerOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      e.stopPropagation();
      setPickerOpen(false);
      pickerToggleRef.current?.focus();
    };
    const onPointerDown = (e: PointerEvent) => {
      const target = e.target as Node | null;
      if (!target) return;
      if (!pickerRef.current?.contains(target) && !pickerToggleRef.current?.contains(target)) {
        setPickerOpen(false);
      }
    };
    window.addEventListener('keydown', onKey, true);
    window.addEventListener('pointerdown', onPointerDown, true);
    return () => {
      window.removeEventListener('keydown', onKey, true);
      window.removeEventListener('pointerdown', onPointerDown, true);
    };
  }, [pickerOpen]);
  const dangerBand = resolved ? bandById(resolved.resolvedOffer.bandIds.danger) : undefined;
  const rewardTier = resolved ? REWARD_TIERS.find((rt) => rt.id === resolved.resolvedOffer.bandIds.rewardTier) : undefined;
  const ready = !resolvePending && typeof estimate === 'object';
  const title = scenario?.title ?? poi.id;
  const anchor = position ?? { x: 120, y: 96 };
  const panelId = `quest-expedition-${poi.id}`;
  const LAYOUT = QUEST_PLANNER_INFO.layout;

  /* PLAN-036: authored key-stat tiers (verbatim, never derived by set
   *  subtraction — Rovine `con` legitimately sits in `primaryStats` AND the
   *  secondary tier). The deterministic fallback covers unschematized
   *  scenarios. */
  const keyTiers = useMemo(() => deriveKeyStats(scenario), [scenario]);

  /* Deterministic coverage (r008 §2.4): a key stat is ✓ when the packed bag
   *  covers it via `loadoutCoverage` OR an assigned member's derived quest
   *  stat meets `keyStatCoverageThreshold`. */
  const bagCoveredStats = useMemo(() => loadoutCoverage(selectedItemIds.map(toEngineFlag)), [selectedItemIds]);
  const memberStats = useMemo(
    () =>
      slots
        .map((s) => s.assignedResident)
        .filter((r): r is ResidentState => Boolean(r))
        .map((r) => residentToQuestMember(r, 'member').stats),
    [slots],
  );
  const keyStatCovered = useCallback(
    (stat: LabStat) =>
      bagCoveredStats.includes(stat) ||
      memberStats.some((stats) => (stats[stat] ?? 0) >= QUEST_PLANNER_INFO.keyStatCoverageThreshold),
    [bagCoveredStats, memberStats],
  );

  /* Cinema banner: authored `offer.coverArt`, else the start node's scene
   *  art — the same image the theatre would open on. */
  const cinemaSrc = scenario?.offer.coverArt ?? (scenario ? NODE_ART[scenario.startNode]?.src : undefined);

  /** Signed pp badge for a delta metric — `0` renders nothing (no noise). */
  const deltaMark = (pp: number, goodWhenDown: boolean) => {
    const v = Math.round(pp);
    if (v === 0) return null;
    const improves = goodWhenDown ? v < 0 : v > 0;
    return (
      <em style={{ fontStyle: 'normal', fontSize: 12, color: improves ? TONE.ok : TONE.danger }}>
        {v > 0 ? '+' : ''}
        {v}
      </em>
    );
  };

  const shell: CSSProperties = {
    position: 'fixed',
    left: anchor.x,
    top: anchor.y,
    pointerEvents: 'auto',
    ...panelStyle,
    zIndex: panelStyle.zIndex ?? DEFAULT_GAME_FRAME_CONFIG.zLayers.panels,
  };

  if (minimised) {
    return (
      <SkinScope>
        <HudPlaque
          shape="hang"
          as="section"
          aria-label={title}
          data-testid={`floating-panel-${panelId}`}
          style={{ ...shell, display: 'flex', alignItems: 'center', gap: 10, padding: '8px 16px' }}
        >
          <div {...handleProps} style={{ ...handleProps.style, display: 'flex', alignItems: 'center', gap: 10 }}>
            <Swords aria-hidden style={{ width: 18, height: 18, color: TONE.accent }} />
            <span style={{ fontFamily: FONT.display, fontSize: 13, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--skin-title-color)' }}>
              {title}
            </span>
            <span data-hud-controls="" style={{ display: 'inline-flex' }}>
              <button
                type="button"
                data-testid={`floating-panel-minimize-${panelId}`}
                aria-label={t('floatingPanel.restore')}
                title={t('floatingPanel.restore')}
                onClick={() => setMinimised(false)}
              >
                <Maximize2 aria-hidden />
              </button>
            </span>
          </div>
        </HudPlaque>
      </SkinScope>
    );
  }

  return (
    <SkinScope>
      {/* PLAN-036: ONE fixed shell dragging BOTH plaques as a union —
       *  `data-hud-panel` is the drag hook's anchor; flexWrap lets the
       *  sidecar fold under the main plaque when the pair cannot fit. */}
      <div
        ref={shellRef}
        data-hud-panel={panelId}
        style={{
          ...shell,
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: LAYOUT.gapPx,
          maxWidth: 'calc(100vw - 24px)',
        }}
      >
      <HudPlaque
        shape="panel"
        as="section"
        aria-label={title}
        data-testid={`floating-panel-${panelId}`}
        style={{ width: LAYOUT.mainWidthPx, maxHeight: `calc(100vh - ${LAYOUT.plaqueViewportMarginPx}px)`, display: 'flex', flexDirection: 'column', gap: 10, padding: '12px 14px 14px' }}
      >
        {/* Title row = drag handle; window controls on the right (QuestRunWindow idiom). */}
        <div {...handleProps} data-testid={`floating-panel-header-${panelId}`} style={{ ...handleProps.style, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Swords aria-hidden style={{ width: 16, height: 16, flexShrink: 0, color: TONE.accent }} />
          <h2 style={{ flex: 1, margin: 0, minWidth: 0, fontFamily: FONT.display, fontSize: 16, lineHeight: 1.2, letterSpacing: '0.06em', color: 'var(--skin-title-color)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {title}
          </h2>
          <div data-hud-controls style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <button
              type="button"
              data-testid={`floating-panel-minimize-${panelId}`}
              aria-label={t('floatingPanel.minimize')}
              title={t('floatingPanel.minimize')}
              onClick={() => setMinimised(true)}
            >
              <Minus aria-hidden />
            </button>
            <button
              type="button"
              data-testid={`floating-panel-close-${panelId}`}
              aria-label={t('floatingPanel.close')}
              title={t('floatingPanel.close')}
              onClick={onClose}
            >
              <X aria-hidden />
            </button>
          </div>
        </div>

        <div
          data-testid="quest-expedition-detail"
          data-poi-id={poi.id}
          className="quest-s1-scroll"
          style={{ flex: '1 1 auto', minHeight: 0, overflowY: 'auto', scrollbarGutter: 'stable', display: 'flex', flexDirection: 'column', gap: 12 }}
        >
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
                  <em style={{ fontStyle: 'normal', fontSize: 12 }}> ×{expeditionDuration.factor.toFixed(2)}</em>
                )}
              </HudChip>
            </span>
          </div>
        </div>

        {/* Cinema banner (R-195): ~21:9 art straight under the subtitle —
         *  `offer.coverArt` authored, else the start node's scene art. */}
        {cinemaSrc && (
          <div
            data-testid="quest-expedition-cinema"
            style={{
              width: '100%',
              aspectRatio: `${LAYOUT.cinemaAspect} / 1`,
              maxHeight: LAYOUT.cinemaMaxHeightPx,
              borderRadius: 8,
              overflow: 'hidden',
              border: '1px solid color-mix(in srgb, var(--skin-surface-border) 60%, transparent)',
            }}
          >
            <img
              src={cinemaSrc}
              alt=""
              aria-hidden
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            />
          </div>
        )}

        {/* Slots — the trusted rack; drop-state comes from the session's
         *  quest eligibility resolver. R-183: a slotted token can be dragged
         *  onto another slot (move / swap) without extracting it. */}
        <ResidentSlotRack
          slots={slots}
          layout="detail"
          onSlotClear={onSlotClear}
          slotSize={56}
          enableSlotSwap
        />

        {/* Bisaccia (PLAN-036, R-195): `QUEST_STASH.bagSlots` visible slots
         *  (icon-only; a filled slot's button removes the item) + ONE toggle
         *  that opens the EXTERNAL village-stock picker. Every surface the
         *  toggle opens lives inside this `data-hud-controls` scope (T-03). */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <span style={{ fontFamily: FONT.display, fontSize: 12, letterSpacing: '0.08em', textTransform: 'uppercase', color: TONE.secondary }}>
            {t('questExpedition.loadout', { count: selectedItemIds.length, max: QUEST_STASH.bagSlots })}
          </span>
          <div data-hud-controls="" data-testid="quest-expedition-loadout" style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 6 }}>
            {Array.from({ length: QUEST_STASH.bagSlots }, (_, i) => {
              const id = selectedItemIds[i];
              const entry = id ? items.find((e) => e.item.id === id) : undefined;
              return (
                <span
                  key={i}
                  data-testid={`bag-slot-${i}`}
                  style={{
                    width: 44, height: 44, borderRadius: 8, display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                    border: '1px solid color-mix(in srgb, var(--skin-surface-border) 60%, transparent)',
                    background: 'color-mix(in srgb, var(--skin-hud-lacquer-deep) 55%, transparent)',
                    color: entry ? 'var(--skin-title-color)' : TONE.secondary,
                  }}
                >
                  {entry ? (
                    <Tooltip.Root delayDuration={120}>
                      <Tooltip.Trigger asChild>
                        <button
                          type="button"
                          data-testid={`loadout-item-${id}`}
                          aria-label={t(stripNs(entry.item.labelKey))}
                          title={t(stripNs(entry.item.labelKey))}
                          onClick={() => onToggleItem(id!)}
                          style={{ width: '100%', height: '100%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', padding: 0 }}
                        >
                          <VillageStashItemIcon icon={entry.item.icon} size={22} />
                        </button>
                      </Tooltip.Trigger>
                      <BagItemTooltip entry={entry} />
                    </Tooltip.Root>
                  ) : (
                    <EngravedIcon id="ico-pouch" size={16} style={{ opacity: 0.4 }} aria-hidden />
                  )}
                </span>
              );
            })}
            <button
              ref={pickerToggleRef}
              type="button"
              data-testid="quest-bag-picker-toggle"
              aria-expanded={pickerOpen}
              aria-haspopup="dialog"
              aria-label={t('questExpedition.bag.openPicker')}
              title={t('questExpedition.bag.openPicker')}
              onClick={() => setPickerOpen((o) => !o)}
              style={{
                width: 44, height: 44, borderRadius: 8, display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                border: `1px dashed color-mix(in srgb, ${TONE.accent} 65%, transparent)`,
                background: pickerOpen ? `color-mix(in srgb, ${TONE.accent} 22%, transparent)` : 'transparent',
                color: TONE.accent, cursor: 'pointer', padding: 0,
              }}
            >
              <EngravedIcon id="ico-pouch" size={20} aria-hidden />
            </button>
            {pickerOpen && (
              /* HudPlaque keeps its own measurement ref (no forwardRef) —
               *  the outside-click scope lives on this positioned wrapper. */
              <div ref={pickerRef} data-hud-companion style={{ position: 'absolute', left: 0, bottom: 'calc(100% + 8px)', zIndex: 30 }}>
              <HudPlaque
                as="div"
                shape="panel"
                role="dialog"
                aria-label={t('questExpedition.bag.pickerTitle')}
                data-testid="quest-bag-external-picker"
                style={{
                  display: 'grid', gridTemplateColumns: `repeat(${items.length}, 44px)`, gap: 6, padding: 10,
                }}
              >
                {items.map((entry) => {
                  const { item, qty } = entry;
                  const selected = selectedItemIds.includes(item.id);
                  const full = !selected && selectedItemIds.length >= QUEST_STASH.bagSlots;
                  return (
                    <Tooltip.Root key={item.id} delayDuration={120}>
                      <Tooltip.Trigger asChild>
                        <button
                          type="button"
                          data-testid={`picker-item-${item.id}`}
                          aria-pressed={selected}
                          aria-label={t(stripNs(item.labelKey))}
                          disabled={full}
                          onClick={() => onToggleItem(item.id)}
                          style={{
                            position: 'relative', width: 44, height: 44, borderRadius: 8, padding: 0,
                            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                            border: `1px solid color-mix(in srgb, ${selected ? TONE.accent : 'var(--skin-surface-border)'} ${selected ? 85 : 50}%, transparent)`,
                            background: selected ? `color-mix(in srgb, ${TONE.accent} 22%, transparent)` : 'color-mix(in srgb, var(--skin-hud-lacquer-deep) 55%, transparent)',
                            color: selected ? TONE.accent : 'var(--skin-title-color)',
                            opacity: full ? 0.65 : 1,
                            cursor: full ? 'default' : 'pointer',
                          }}
                        >
                          <VillageStashItemIcon icon={item.icon} size={22} />
                          <span
                            aria-hidden
                            style={{
                              position: 'absolute', right: 1, bottom: 0, fontFamily: FONT.display, fontSize: 12, lineHeight: 1, color: TONE.secondary,
                            }}
                          >
                            ×{qty}
                          </span>
                        </button>
                      </Tooltip.Trigger>
                      <BagItemTooltip entry={entry} />
                    </Tooltip.Root>
                  );
                })}
              </HudPlaque>
              </div>
            )}
          </div>
          </div>
        </div>

        {/* Anchored footer CTA (PLAN-036): OUTSIDE the scroll region — the
         *  commit control is never pushed off-screen (BV-1). */}
        <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 6, borderTop: '1px solid color-mix(in srgb, var(--skin-text-secondary) 25%, transparent)', paddingTop: 10 }}>
          <SkinButton
            variant="cta"
            data-testid="quest-expedition-send"
            disabled={!canSend}
            aria-disabled={!canSend}
            onClick={onSend}
            style={{ width: '100%', opacity: canSend ? 1 : 0.65 }}
          >
            {t('questExpedition.send')}
          </SkinButton>
          {!canSend && (
            <span style={{ fontFamily: FONT.serif, fontSize: 12, color: TONE.secondary }}>
              {t('questExpedition.forecast.incomplete')}
            </span>
          )}
        </div>
      </HudPlaque>

      {/* RIGHT — external forecast sidecar plaque (R-195): key-stat tiers
       *  fixed on top, the scrollable analysis below. In-flow sibling of
       *  the shell, so the drag union already covers it — no
       *  `data-hud-companion` needed (that's for out-of-flow children). */}
      <HudPlaque
        shape="panel"
        as="aside"
        aria-label={t('questExpedition.forecast.title')}
        data-testid="quest-expedition-forecast-column"
        style={{ width: LAYOUT.sidecarWidthPx, maxHeight: `calc(100vh - ${LAYOUT.plaqueViewportMarginPx}px)`, display: 'flex', flexDirection: 'column', gap: 10, padding: '12px 14px 14px' }}
      >
        <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <span style={{ fontFamily: FONT.display, fontSize: 12, letterSpacing: '0.08em', textTransform: 'uppercase', color: TONE.secondary }}>
            {t('questExpedition.forecast.title')}
          </span>

          {/* Key Stats — the authored tiers VERBATIM (`keyStats`), or the
           *  deterministic `deriveKeyStats` fallback. A tier is "covered"
           *  when the bag or a member's stat meets the configured bar. */}
          {keyTiers.primary.length > 0 && (
            <div data-testid="forecast-key-stats" style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {(
                [
                  { labelKey: 'questExpedition.keyStats.primary', stats: keyTiers.primary, testid: 'forecast-primary-stats' },
                  { labelKey: 'questExpedition.keyStats.secondary', stats: keyTiers.secondary, testid: 'forecast-secondary-stats' },
                ] as const
              ).map((tier) =>
                tier.stats.length === 0 ? null : (
                  <div key={tier.testid} data-testid={tier.testid} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontFamily: FONT.display, fontSize: 12, letterSpacing: '0.08em', textTransform: 'uppercase', color: TONE.secondary, minWidth: 84 }}>
                      {t(tier.labelKey)}
                    </span>
                    <span style={{ display: 'inline-flex', flexWrap: 'wrap', gap: 4 }}>
                      {tier.stats.map((s) => {
                        const covered = keyStatCovered(s);
                        const Icon = getStatIconComponent(STAT_ICONS[s]) ?? lucideStatIcons.star;
                        return (
                          <span
                            key={s}
                            title={t(`questExpedition.statName.${s}`)}
                            style={{
                              display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px', borderRadius: 999,
                              border: `1px solid color-mix(in srgb, ${covered ? TONE.ok : 'var(--skin-surface-border)'} 65%, transparent)`,
                              fontFamily: FONT.display, fontSize: 12, color: covered ? TONE.ok : TONE.text,
                            }}
                          >
                            {Icon && <Icon style={{ width: 12, height: 12 }} aria-hidden />}
                            {t(`questExpedition.statName.${s}`)} {covered ? '✓' : '—'}
                          </span>
                        );
                      })}
                    </span>
                  </div>
                ),
              )}
            </div>
          )}

          {/* Coverage — which of the quest's declared primary stats the bag
           *  covers (same vocabulary the check consumables serve). Kept as
           *  `loadout-coverage` for E2E compatibility (r008 §2.3). */}
          {(scenario?.primaryStats?.length ?? 0) > 0 && (
            <div data-testid="loadout-coverage" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontFamily: FONT.display, fontSize: 12, letterSpacing: '0.12em', textTransform: 'uppercase', color: TONE.secondary }}>
                {t('questExpedition.coverage')}
              </span>
              {scenario!.primaryStats!.map((s) => {
                const covered = bagCoveredStats.includes(s);
                const Icon = getStatIconComponent(STAT_ICONS[s]) ?? lucideStatIcons.star;
                return (
                  <span
                    key={s}
                    title={STAT_SHORT[s]}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontFamily: FONT.display, fontSize: 12, color: covered ? TONE.ok : TONE.secondary }}
                  >
                    {Icon && <Icon style={{ width: 12, height: 12 }} aria-hidden />}
                    {STAT_SHORT[s] ?? s} {covered ? '✓' : '—'}
                  </span>
                );
              })}
            </div>
          )}
        </div>

        {/* Scrollable analysis body — OUTCOME zone (S3 T-2): aggregate →
         *  BY MEMBER → WHY → Intel. Never partial numbers: 'computing' and
         *  'incomplete' are whole states, a stale estimate never bleeds. */}
        <div
          data-testid="quest-expedition-forecast"
          data-forecast-state={estimate === 'computing' ? 'computing' : estimate === 'incomplete' ? 'incomplete' : 'ready'}
          className="quest-s1-scroll"
          style={{ flex: '1 1 auto', minHeight: 0, overflowY: 'auto', borderTop: '1px solid color-mix(in srgb, var(--skin-text-secondary) 25%, transparent)', paddingTop: 10, display: 'flex', flexDirection: 'column', gap: 8 }}
        >
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
                <span style={{ fontFamily: FONT.display, fontSize: 12, letterSpacing: '0.08em', textTransform: 'uppercase', color: TONE.secondary }}>
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
                  <span style={{ fontFamily: FONT.display, fontSize: 12, letterSpacing: '0.08em', textTransform: 'uppercase', color: TONE.secondary }}>
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
                  <span style={{ fontFamily: FONT.display, fontSize: 12, letterSpacing: '0.08em', textTransform: 'uppercase', color: TONE.secondary }}>
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
      </HudPlaque>
      </div>
    </SkinScope>
  );
};

export default QuestExpeditionDetail;
