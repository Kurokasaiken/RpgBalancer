/**
 * QuestRewardPopup — the expedition's return report as a floating plaque
 * OUTSIDE the quest window's DOM (R-199 pt.14, Director 2026-10-15).
 *
 * Presentation pattern (web research, plan T-06): a staged aftermath
 * reveal — outcome banner first, then the settlement's sections one at a
 * time (cost before yield, per the S4 contract), then the close affordance.
 * Every stage auto-advances on `stageMs` and hurries on click/any key; the
 * whole thing is a NON-MODAL `HudPlaque` — no backdrop, the map stays
 * visible and the theatre keeps breathing behind it (Pillar 1, v4/v27).
 *
 * Behaviour contract:
 * - `position: fixed`, centred over the map, draggable by its title row
 *   (`useHudPanelDrag`, same clamp as every HUD panel).
 * - Focus moves into it on open; `Escape` closes and restores focus.
 * - `run` must be an ENDED run — the component renders the already-settled
 *   report; settlement itself happens in `useQuestExpeditionSession`, never
 *   here.
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { EngravedIcon, type EngravedIconId } from './engravedIcons';
import { HudPlaque, SkinButton, SkinScope } from '@/ui/idleVillage/skins/primitives';
import { HudChip, TONE } from '@/ui/idleVillage/questS1Lab/hud/atoms';
import type { QuestOutcome, QuestRunState } from '@/ui/idleVillage/questS1Lab/questRun';
import type { QuestScenario } from '@/balancing/config/idleVillage/quests/questScenario.schema';
import { buildQuestEpilogue } from '@/ui/idleVillage/quests/questEpilogue';
import { markRewardShown } from '@/ui/idleVillage/questS1Lab/questRunStore';
import { runIdOf } from '@/ui/idleVillage/quests/questSettlement';
import { DEFAULT_GAME_FRAME_CONFIG } from '@/balancing/config/idleVillage/gameFrameConfig';
import { useHudPanelDrag } from './useHudPanelDrag';
import { QuestEpilogue } from './QuestEpilogue';

/** Outcome chip tone — wipe/fled read differently from a clean return. */
const OUTCOME_TONE: Record<QuestOutcome, 'ok' | 'warn' | 'danger'> = {
  running: 'ok',
  reward: 'ok',
  survived: 'ok',
  fled: 'warn',
  wipe: 'danger',
};

/** PLAN-040 T-006: one large glyph per outcome for the banner. */
const OUTCOME_ICON: Record<QuestOutcome, EngravedIconId> = {
  running: 'ico-target',
  reward: 'ico-cup',
  survived: 'ico-cup',
  fled: 'ico-gust',
  wipe: 'status-fallen',
};

export interface QuestRewardPopupProps {
  /** An ended run — the report is read from its committed state. */
  run: QuestRunState;
  /** The authored scenario — epilogue intel labels and grant seams. */
  scenario?: QuestScenario;
  /** Plaque width, px (`questWindow.rewardPopup.widthPx`). */
  widthPx: number;
  /** Wall-clock between reveal stages (`questWindow.rewardPopup.stageMs`). */
  stageMs: number;
  onClose: () => void;
}

export const QuestRewardPopup: React.FC<QuestRewardPopupProps> = ({ run, scenario, widthPx, stageMs, onClose }) => {
  const { t } = useTranslation('idleVillage');
  const shellRef = useRef<HTMLDivElement | null>(null);
  const { panelStyle, handleProps } = useHudPanelDrag({ shellRef, edgeInsetPx: 12 });

  /* Staged reveal: stage 0 = the outcome banner, stages 1..N = the epilogue
   * sections one at a time, the last stage only unlatches the close row.
   * Click/any-key hurries the reveal by one stage — the same progressive
   * skip contract as the theatre's beats. */
  const sectionCount = useMemo(() => buildQuestEpilogue(run, scenario).length, [run, scenario]);
  const lastStage = sectionCount + 1;
  const [stage, setStage] = useState(0);
  const done = stage >= lastStage;
  const advance = useCallback(() => setStage((s) => Math.min(s + 1, lastStage)), [lastStage]);

  useEffect(() => {
    if (done) return;
    const id = setTimeout(advance, stageMs);
    return () => clearTimeout(id);
  }, [stage, done, stageMs, advance]);

  /* Focus contract (WITNESS-04): on open the plaque takes focus so keys and
   * Escape work; on close the previously focused element gets it back. */
  const restoreFocusTo = useRef<HTMLElement | null>(null);
  useEffect(() => {
    restoreFocusTo.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    shellRef.current?.querySelector<HTMLElement>('[data-reward-body]')?.focus({ preventScroll: true });
    return () => restoreFocusTo.current?.focus?.({ preventScroll: true });
  }, []);

  /* PLAN-040 T-005: acknowledge the report's first PAINTED frame — the
   * outcome toast holds the last unsettled check until this stamp arrives,
   * and flushes anyway if it never does (the report carries the outcome;
   * an outcome is never lost). */
  useEffect(() => {
    const id = requestAnimationFrame(() => markRewardShown(run.questId, runIdOf(run)));
    return () => cancelAnimationFrame(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onBodyKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Escape') {
      event.stopPropagation();
      onClose();
      return;
    }
    if (event.metaKey || event.ctrlKey || event.altKey) return;
    if ((event.target as HTMLElement | null)?.closest('button, a, input, select, textarea')) return;
    event.preventDefault();
    if (!done) advance();
  };

  return (
    <SkinScope>
      {/* Centring wrapper: the drag transform lands on the inner
          `[data-hud-panel]`, so the plaque's own translate stays relative
          to the centred anchor instead of fighting it. */}
      <div style={{ position: 'fixed', left: '50%', top: '50%', transform: 'translate(-50%, -50%)', zIndex: DEFAULT_GAME_FRAME_CONFIG.zLayers.reward, pointerEvents: 'none' }}>
        <div data-hud-panel="quest-reward" ref={shellRef} style={{ pointerEvents: 'auto', ...panelStyle }}>
          <HudPlaque
            shape="panel"
            as="section"
            role="dialog"
            aria-label={t('gameFrame.questEpilogue.title')}
            data-testid="quest-reward-popup"
            style={{ width: widthPx, maxWidth: 'calc(100vw - 48px)', display: 'flex', flexDirection: 'column', gap: 8, padding: '12px 14px 14px' }}
          >
            {/* Title row = drag handle; close icon on its right. */}
            <div {...handleProps} title={t('gameFrame.panel.dragHint')} style={{ ...handleProps.style, display: 'flex', alignItems: 'center', gap: 8 }}>
              <EngravedIcon id="ico-cup" size={15} style={{ color: 'var(--skin-title-color)' }} />
              <h2 style={{ flex: 1, margin: 0, minWidth: 0, fontFamily: 'var(--skin-font-display)', fontSize: 14, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--skin-title-color)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {t('gameFrame.questEpilogue.title')}
              </h2>
              <span data-hud-controls="" style={{ display: 'inline-flex' }}>
                <button type="button" aria-label={t('gameFrame.questWindow.rewardClose')} title={t('gameFrame.questWindow.rewardClose')} onClick={onClose}>
                  <EngravedIcon id="cmd-close" />
                </button>
              </span>
            </div>

            {/* Reveal area: click / any key advances the stages. */}
            <div
              data-reward-body=""
              tabIndex={-1}
              onKeyDown={onBodyKeyDown}
              onClick={done ? undefined : advance}
              style={{ display: 'flex', flexDirection: 'column', gap: 8, outline: 'none', cursor: done ? 'default' : 'pointer' }}
            >
              {/* PLAN-040 T-006: the authored cover leads the report — a
                  strip, not a hero, so the banner still lands first. Only
                  painted when the scenario declares `coverArt`. */}
              {scenario?.offer?.coverArt && (
                <div
                  data-testid="quest-reward-cover"
                  aria-hidden
                  style={{
                    height: 64,
                    borderRadius: 6,
                    overflow: 'hidden',
                    border: '1px solid color-mix(in srgb, var(--skin-label-primary) 35%, transparent)',
                    backgroundImage: `url(${scenario.offer.coverArt})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center 30%',
                  }}
                />
              )}

              {/* Stage 0 — the outcome banner lands first: the large glyph
                  carries the result before a single number is read. */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <EngravedIcon
                  id={OUTCOME_ICON[run.outcome]}
                  size={34}
                  style={{ flexShrink: 0, color: run.outcome === 'wipe' ? TONE.death : OUTCOME_TONE[run.outcome] === 'warn' ? TONE.warn : 'var(--skin-title-color)' }}
                />
                <div style={{ display: 'flex', flexDirection: 'column', gap: 3, minWidth: 0 }}>
                  <HudChip tone={OUTCOME_TONE[run.outcome]}>{t(`questS1Lab.outcome.${run.outcome}`)}</HudChip>
                  <span style={{ fontFamily: 'var(--skin-font-display)', fontSize: 13, letterSpacing: '0.06em', color: run.outcome === 'wipe' ? TONE.death : TONE.label }}>
                    {t(run.outcome === 'wipe' ? 'gameFrame.questWindow.noneReturned' : 'gameFrame.questWindow.returned')}
                  </span>
                </div>
              </div>

              {/* Stages 1..N — the settlement's own sections, cost first:
                  stage s reveals the first s sections (stage 0 is banner-only). */}
              <QuestEpilogue run={run} scenario={scenario} visibleSections={stage} />

              {!done && (
                <span style={{ fontFamily: 'var(--skin-font-serif)', fontStyle: 'italic', fontSize: 12, color: TONE.muted }}>
                  {t('gameFrame.questWindow.rewardHint')}
                </span>
              )}
              {done && (
                /* PLAN-040 T-006: the real CTA — the skin's own cta button,
                   not a bare text link. «Collect rewards» only when there is
                   something to collect; fled/wipe close the report. */
                <SkinButton
                  variant="cta"
                  data-testid="quest-reward-collect"
                  onClick={onClose}
                  style={{ alignSelf: 'flex-end', fontFamily: 'var(--skin-font-display)', fontSize: 13, letterSpacing: '0.06em', display: 'inline-flex', alignItems: 'center', gap: 6 }}
                >
                  <EngravedIcon id={run.outcome === 'wipe' || run.outcome === 'fled' ? 'ico-scroll' : 'ico-cup'} size={13} />
                  {t(run.outcome === 'wipe' || run.outcome === 'fled' ? 'questChronicle.closeReport' : 'questChronicle.collectRewards')}
                </SkinButton>
              )}
            </div>
          </HudPlaque>
        </div>
      </div>
    </SkinScope>
  );
};

export default QuestRewardPopup;
