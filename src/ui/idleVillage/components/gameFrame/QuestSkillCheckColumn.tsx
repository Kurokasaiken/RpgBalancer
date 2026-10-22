/**
 * QuestSkillCheckColumn — PLAN-043 WS-4 (artifact-r003 §4.2, T5.5): the skill
 * check as the cluster's RIGHT WING — a naked Astrolabe (no plaque, no scrim,
 * no drag) with the external Verdict Card painted directly below it.
 *
 * Same bridge contract as the old centered `QuestSkillCheckOverlay`
 * (`questRunStore.QuestCheckBridge`): the engine already resolved verdict AND
 * harm — this column only paints (`mode` forced, `harm` mirrored so the card
 * cannot contradict the engine), reports `onResolved`/`onDismiss` back and
 * fills the imperative `handle` slot (`skipToResult`/`throwNow`).
 *
 * Differences from the overlay it replaces:
 * - docked, not floating: the cluster solver owns its rect — no drag handle,
 *   no scrim, pointer-events only inside the column;
 * - `hideInternalCard` suppresses the engine's `#card`; the verdict lives in
 *   the external card under the board — verdict + flavor + authored
 *   consequences, information only, NO continue/advance control;
 * - `settledIdle` parks the astrolabe's rAF loop after the verdict (BV-04);
 * - post-verdict dismissal = click anywhere on the column once armed
 *   (`dismissArmDelayMs` = 350ms — a skip-click landing as the card appears
 *   cannot erase it, BV-12) or Escape when topmost. Exactly-once via
 *   `dismissedFor`.
 */
import React, { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react';
import { useTranslation } from 'react-i18next';
import { EngravedIcon } from './engravedIcons';
import { SkinScope, prefersReducedMotion } from '@/ui/idleVillage/skins/primitives';
import { HudChip } from '@/ui/idleVillage/questS1Lab/hud/atoms';
import { QuestVerdictCardBody } from './QuestVerdictCard';
import { DestinyAstrolabeV62Standalone, type DestinyAstrolabeV62Handle } from '@/ui/idleVillage/frozen/kits/destinyAstrolabeV62Kit';
import { DEFAULT_GAME_FRAME_CONFIG } from '@/balancing/config/idleVillage/gameFrameConfig';
import { trackTelemetryEvent } from '@/analytics/telemetry/telemetryProvider';
import { runIdOf } from '@/ui/idleVillage/quests/questSettlement';
import type { LabStat, QuestRunState, ResolvedCheck } from '@/ui/idleVillage/questS1Lab/questRun';
import { STAT_ICONS } from '@/ui/idleVillage/questS1Lab/questRun';
import { getStatIconComponent, lucideStatIcons } from '@/ui/shared/statIconUtils';
import type { QuestCheckBridge } from '@/ui/idleVillage/questS1Lab/questRunStore';
import { useOverlayEscape } from './overlayStack';

const FONT = {
  display: 'var(--skin-font-display)',
  serif: 'var(--skin-font-serif)',
} as const;

/** Checks whose verdict this session already painted — a remount of a held
 *  check hydrates straight to `resolved-held` (no second spin). */
const seenCheckKeys = new Set<string>();

/** Max pointer travel (px) a click may carry before it counts as a drag tail. */
const CLICK_DRAG_TOLERANCE_PX = 4;

/** Same presentation baseline the overlay used (`engine.ts` defaults to
 *  `{stat:60, difficulty:50}`) — `check.score` is the success bound after
 *  clamps; the column's chip and the board's paint share the constant. */
const ASTROLABE_DIFFICULTY_BASELINE = 50;

/** Every authored stat id — the profile fills the axes not covered by the
 *  check's tested stats with the party's NEXT best stats (descending), so a
 *  strong party still reads as a broad star even on a single-stat check. */
const ALL_STATS: LabStat[] = ['perc', 'int', 'str', 'con', 'agi', 'cha'];

/** R-253: the astrolabe silhouette from the REAL check data — every tested
 *  stat becomes an axis at the party's best living value (best-member rule,
 *  same as `groupScore`); the remaining axes take the party's next best
 *  stats descending, then pad with the check's own score. Black obelisks
 *  sit on the authored check baseline. Display-only: the engine's `skills`
 *  array — which the landing angle picks the verdict from — is untouched. */
export function checkAxisProfile(
  check: ResolvedCheck,
  run: QuestRunState,
  axes = 5,
): { stat: number; difficulty: number }[] {
  const alive = run.party.filter((m) => !m.dead);
  const best = (s: LabStat) => (alive.length === 0 ? 0 : Math.max(...alive.map((m) => m.stats[s] ?? 0)));
  const tested = check.stats ?? [];
  const profile = tested.map((s) => best(s));
  const rest = ALL_STATS.filter((s) => !tested.includes(s)).map(best).sort((a, b) => b - a);
  const values = [...profile, ...rest].slice(0, axes);
  while (values.length < axes) values.push(check.score);
  return values.map((stat) => ({ stat, difficulty: ASTROLABE_DIFFICULTY_BASELINE }));
}

/** Dial = the board's side, nothing clipped (PLAN-067 T-A3, SC-1 A). The frozen
 *  V6 kit draws its gold bezel at a FIXED `inset:-80px` around `.stage`
 *  (`width: min(63.75vh, 69.7%)`) and paints an obsidian square behind it — in
 *  the square, `overflow:hidden` board that cut the ring on four sides. Host
 *  override, kit untouched: the bezel inset becomes proportional (80/313 — the
 *  ratio the kit had at its usual size, so the ring keeps its proportions), and
 *  `.stage` is sized so ring + drop shadow fit the side. `filter: none` on
 *  `.stage` restores V6's own rule: the V1 sheet (`destinyAstrolabe/astrolabe.css`,
 *  same `.destiny-astrolabe .stage` selector, loaded on /game) leaks a
 *  `drop-shadow(0 32px 70px)` that the board clips into a visible square.
 *  The obsidian ground the kit paints as a square becomes a disc under the
 *  stage that reaches just inside the ring's outer edge (the bezel's inner
 *  bands are translucent): same colour, no corners.
 *  Bezel geometry: SVG
 *  viewBox 1200, outermost ring r≈449 → ring diameter = 898/1200 of the bezel
 *  box = 0.748 × (1 + 2·0.2555) ≈ 1.131 × stage. */
const BEZEL_INSET_RATIO = 0.2555;
const BEZEL_RING_PER_STAGE = 1.131;
/** Ground disc overhang per side, as a fraction of the stage — just under the
 *  ring's outer edge ((1.131 − 1) / 2 ≈ 0.065). */
const BEZEL_GROUND_RATIO = 0.06;
/** `.astro-bezel` drop-shadow (0 6px 14px) reach, per side. */
const BEZEL_SHADOW_PX = 20;
const BOARD = '[data-testid="quest-check-board"]';
const BOARD_FIT_CSS = `
${BOARD} .destiny-astrolabe { background: transparent; }
${BOARD} .destiny-astrolabe .scene-col { background: transparent; }
${BOARD} .destiny-astrolabe .stage { width: calc((100% - ${2 * BEZEL_SHADOW_PX}px) / ${BEZEL_RING_PER_STAGE}); filter: none; }
${BOARD} .destiny-astrolabe .stage::before { content: ''; position: absolute; inset: ${-BEZEL_GROUND_RATIO * 100}%; border-radius: 50%; background: var(--obsidian); }
${BOARD} .destiny-astrolabe .astro-bezel { inset: ${-BEZEL_INSET_RATIO * 100}%; }
/* SC-1 = A (PLAN-067 T-B1, R-234): the kit's THROW button as the command ON the star. The global
   \`.wanderlust-artifact { position: relative }\` beat the kit's \`absolute\` and dropped it 170px below
   the dial, behind the board edge; the host pins it back as a transparent target over the star
   (96px, well over 32), draws a breathing ring around it, and the word lives in the engraved label
   under the dial (\`quest-check-throw-label\`). The kit's own markup and rules stay untouched. */
${BOARD} .da-tira.wanderlust-artifact { position: absolute; left: 50%; top: 50%; width: 96px; height: 96px; transform: translate(-50%, -50%); border: 0; border-radius: 50%; background: transparent; box-shadow: none; color: transparent; font-size: 0; text-shadow: none; overflow: visible; animation: none; cursor: pointer; }
${BOARD} .da-tira.wanderlust-artifact:active { transform: translate(-50%, -50%) scale(0.96); }
${BOARD} .da-tira.wanderlust-artifact:focus-visible { outline: 2px solid var(--skin-icon-accent); outline-offset: 6px; }
${BOARD} .da-tira::before { content: ''; position: absolute; inset: -18px; border-radius: 50%; border: 1px solid color-mix(in srgb, var(--skin-title-color) 60%, transparent); animation: questThrowBreath 2.4s ease-in-out infinite; pointer-events: none; }
@keyframes questThrowBreath { 0%, 100% { transform: scale(0.92); opacity: 0.3; } 50% { transform: scale(1.05); opacity: 0.95; } }
@media (prefers-reduced-motion: reduce) { ${BOARD} .da-tira::before { animation: none; opacity: 0.7; } }`;

/** The verdict card's entrance — one fade/rise, disabled under reduced motion.
 *  `data-astro-idle="parked"` freezes the frozen-kit ambient loops (fog, fate
 *  pulses) so the held verdict is a real still frame (BV-04). R-241 B4: the
 *  `.rays` — the astrolabe's lights — are the ONE loop that keeps turning,
 *  slowed to `skillCheck.parkedRaysDurationMs`; reduced motion still stops
 *  them via the media query. */
const COLUMN_CSS = `
@keyframes questCheckColumnIn { from { opacity: 0; transform: translateX(12px); } to { opacity: 1; transform: none; } }
@keyframes questVerdictCardIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: none; } }
[data-astro-idle="parked"] * { animation-play-state: paused !important; }
[data-astro-idle="parked"] .rays { animation-play-state: running !important; animation-duration: ${DEFAULT_GAME_FRAME_CONFIG.questWindow.skillCheck.parkedRaysDurationMs}ms !important; }
@media (prefers-reduced-motion: reduce) { [data-astro-idle="parked"] .rays { animation-play-state: paused !important; } }
${BOARD_FIT_CSS}`;

export interface QuestSkillCheckColumnProps {
  bridge: QuestCheckBridge;
  run: QuestRunState;
}

export const QuestSkillCheckColumn: React.FC<QuestSkillCheckColumnProps> = ({ bridge, run }) => {
  const { t } = useTranslation('idleVillage');
  const cfg = DEFAULT_GAME_FRAME_CONFIG.questWindow.skillCheck;
  const clusterCfg = DEFAULT_GAME_FRAME_CONFIG.questWindow.cluster;
  const { beatId, check, mode } = bridge;
  const checkKey = `${runIdOf(run)}#${check.checkSeq}`;
  /* R-253: real party stats paint the silhouette — the tested stats lead,
   *  then the party's next best values; the engine key (`beatId`) remounts
   *  per check so the profile is captured once per board. */
  const axisProfile = checkAxisProfile(check, run);
  const testedStats = check.stats ?? [];

  /* `resolved` = the astrolabe painted the verdict; `armed` = the post-verdict
   * dismiss accepts input (arm delay elapsed). */
  const [resolved, setResolved] = useState(() => seenCheckKeys.has(checkKey));
  const [armed, setArmed] = useState(false);
  /* SC-1 = A: the engraved «throw» label shows while the kit's throw button exists (armed). */
  const [throwReady, setThrowReady] = useState(false);
  const columnRef = useRef<HTMLDivElement | null>(null);
  const boardRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const board = boardRef.current;
    if (!board) return undefined;
    const sync = () => setThrowReady(Boolean(board.querySelector('.da-tira')));
    sync();
    const mo = new MutationObserver(sync);
    mo.observe(board, { childList: true, subtree: true });
    return () => mo.disconnect();
  }, [beatId]);
  const astroRef = useRef<DestinyAstrolabeV62Handle | null>(null);
  /* R-241 B3: the check whose ball THIS host already launched — a second
   *  progress while `data-state` has not flipped yet still skips, and the
   *  flag re-arms on the next check. */
  const thrownFor = useRef<string | null>(null);
  const armTimer = useRef<number | null>(null);
  const autoDismissTimer = useRef<number | null>(null);
  const pointerDownAt = useRef<{ x: number; y: number } | null>(null);
  /* Double-dismiss guard (debate r007): the settle is keyed to THIS check. */
  const dismissedFor = useRef<string | null>(null);

  const overlayId = `quest-check:${beatId}`;

  /** The only valid dismiss: verdict painted + arm delay elapsed, once. */
  const dismiss = useCallback(() => {
    if (!armed || dismissedFor.current === checkKey) return;
    dismissedFor.current = checkKey;
    trackTelemetryEvent('quest_check_dismissed', {
      runId: runIdOf(run),
      checkSeq: check.checkSeq,
      visitSeq: check.visitSeq,
      beatIndex: check.beatIndex,
      outcome: check.verdict,
    });
    bridge.onDismiss(beatId);
  }, [armed, bridge, beatId, run, check, checkKey]);

  /* Escape reaches only the topmost overlay; mid-spin it is a no-op. */
  useOverlayEscape(overlayId, dismiss);

  /* R-241 B3 — one PROGRESS step on the board: read the suite's live
   *  `data-state` and advance the choreography. Pre-spin states throw the
   *  ball (`throw()` warps the reveal if needed and fires immediately —
   *  THE animation the Director was missing); only while the ball is
   *  already flying does a click skip to the verdict. User input NEVER
   *  re-rolls (engine discipline): `resolution`/`idle` are engine-guarded
   *  no-ops. A second progress before `data-state` catches up still skips
   *  (`thrownFor`), so rapid taps cannot double-fire the throw. */
  const progressAstro = useCallback(() => {
    const astro = astroRef.current;
    if (!astro) return;
    const state = boardRef.current?.querySelector<HTMLElement>('[data-suite]')?.getAttribute('data-state') ?? '';
    if (state === 'resolution') return;
    if (state === 'the-spin' || state === 'magnetic-snap' || thrownFor.current === checkKey) {
      astro.skipToResult();
      return;
    }
    thrownFor.current = checkKey;
    astro.throw();
  }, [checkKey]);

  /* Fill the imperative slot: the owner's click-to-skip reaches the astrolabe
   * through `bridge.handle` (skipToResult / throwNow / progress). */
  useEffect(() => {
    bridge.handle.current = {
      skipToResult: () => astroRef.current?.skipToResult(),
      throwNow: () => astroRef.current?.throw(),
      progress: progressAstro,
    };
    return () => {
      if (bridge.handle.current) bridge.handle.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bridge.handle, progressAstro]);

  /* skipIntro: throw right after the mount has confirmed (debate W-08).
   * Resolved-held hydration skips the spin via skipToResult on the same
   * deferred path — the astrolabe's own arm must exist first. */
  useEffect(() => {
    const id = window.setTimeout(() => {
      if (seenCheckKeys.has(checkKey)) astroRef.current?.skipToResult();
      else if (bridge.autoThrow) astroRef.current?.throw();
    }, 0);
    return () => window.clearTimeout(id);
    /* `bridge.autoThrow` is a live toggle — flipping «skip intro» mid-spin
     * throws immediately (the deferred 0ms keeps the arm-order guarantee). */
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [checkKey, bridge.autoThrow]);

  /* Arm the dismiss once the verdict is painted + the configured 350ms; the
   * optional auto-dismiss rides the same moment. */
  useEffect(() => {
    if (!resolved) return;
    armTimer.current = window.setTimeout(() => setArmed(true), cfg.dismissArmDelayMs);
    if (cfg.verdictAutoDismissMs > 0) {
      autoDismissTimer.current = window.setTimeout(() => {
        setArmed(true);
        /* Dismiss needs `armed` true — the state above lands next render;
         * the owner's settle is idempotent, so call it directly here. */
        bridge.onDismiss(beatId);
      }, cfg.dismissArmDelayMs + cfg.verdictAutoDismissMs);
    }
    columnRef.current?.focus();
    return () => {
      if (armTimer.current !== null) window.clearTimeout(armTimer.current);
      if (autoDismissTimer.current !== null) window.clearTimeout(autoDismissTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resolved]);

  /** Astrolabe painted the verdict → tell the owner (dwell) and arm up. */
  const handleAstroResolve = useCallback(() => {
    seenCheckKeys.add(checkKey);
    setResolved(true);
    bridge.onResolved(beatId);
  }, [bridge, beatId, checkKey]);

  const verdictLabel = t(`questS1Lab.verdict.${mode.startsWith('fail') ? 'fail' : mode}`);
  const verdictTone = mode.startsWith('fail') || mode === 'epicfail' ? 'danger' : mode === 'almost' ? 'warn' : 'ok';
  const harm = check.harm;

  /* Click policy: during the spin the BOARD click settles the verdict
   * (progressive skip); after resolve + arm the whole column dismisses —
   * buttons, double-clicks and drag tails are ignored. */
  const onColumnClick = (event: React.MouseEvent<HTMLElement>) => {
    if (event.detail > 1) return;
    if ((event.target as HTMLElement).closest('button')) return;
    if (!resolved || !armed) return;
    const down = pointerDownAt.current;
    if (down && Math.abs(event.clientX - down.x) + Math.abs(event.clientY - down.y) > CLICK_DRAG_TOLERANCE_PX) return;
    dismiss();
  };
  const onBoardClick = (event: React.MouseEvent<HTMLElement>) => {
    if (resolved) return;
    if ((event.target as HTMLElement).closest('button')) return;
    progressAstro();
    event.stopPropagation();
  };

  const boardWidth = `min(100%, ${clusterCfg.skillCheckColumn.astrolabeMaxPx}px)`;

  return (
    <SkinScope>
      <style>{COLUMN_CSS}</style>
      <div
        ref={columnRef}
        data-testid="quest-check-column"
        data-check-resolved={resolved || undefined}
        data-check-armed={armed || undefined}
        role="dialog"
        aria-modal="false"
        aria-label={check.title}
        tabIndex={-1}
        onPointerDown={(e) => {
          pointerDownAt.current = { x: e.clientX, y: e.clientY };
        }}
        onClick={onColumnClick}
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
          width: '100%',
          maxHeight: '100%',
          outline: 'none',
          animation: prefersReducedMotion() ? undefined : 'questCheckColumnIn 180ms ease-out both',
        } as CSSProperties}
      >
        {/* Title row — the check's name + the stat/difficulty chip (same pair
            the board paints), then the verdict chip once resolved. */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, minHeight: 24 }}>
          <EngravedIcon id="ico-spark" size={14} style={{ color: 'var(--skin-title-color)' }} />
          <span style={{ flex: 1, minWidth: 0, fontFamily: FONT.display, fontSize: 13, letterSpacing: '0.08em', color: 'var(--skin-title-color)', textTransform: 'uppercase', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {check.title}
          </span>
          {/* R-253: the stats the check tests — one Lucide icon each,
              i18n tooltip via `questExpedition.statName.*`. */}
          {testedStats.map((s) => {
            const Icon = getStatIconComponent(STAT_ICONS[s]) ?? lucideStatIcons.star;
            return (
              <span key={s} data-testid={`quest-check-stat-${s}`} title={t(`questExpedition.statName.${s}`)} style={{ display: 'inline-flex', color: 'var(--skin-title-color)', opacity: 0.85 }}>
                <Icon size={13} />
              </span>
            );
          })}
          <HudChip tone="label" title={t('gameFrame.questWindow.checkOverlay.scoreTitle', { score: check.score, difficulty: ASTROLABE_DIFFICULTY_BASELINE })}>
            {t('gameFrame.questWindow.checkOverlay.scoreVs', { score: check.score, difficulty: ASTROLABE_DIFFICULTY_BASELINE })}
          </HudChip>
        </div>
        {/* The board square — naked (no plaque), capped at the column's
            astrolabe budget, never under `boardMinPx`. */}
        <div
          ref={boardRef}
          data-testid="quest-check-board"
          onClick={onBoardClick}
          style={{
            width: boardWidth,
            maxWidth: '100%',
            aspectRatio: '1 / 1',
            minHeight: cfg.boardMinPx,
            alignSelf: 'center',
            overflow: 'hidden',
            cursor: resolved ? 'default' : 'pointer',
          }}
        >
          <DestinyAstrolabeV62Standalone
            key={beatId}
            ref={astroRef}
            skills={[{ name: check.title, stat: check.score, difficulty: ASTROLABE_DIFFICULTY_BASELINE }]}
            axisProfile={axisProfile}
            config={{ mode, wound: check.woundPct, dead: check.deathPct, harm: check.harm }}
            onResolve={handleAstroResolve}
            autoStart
            removeSounds
            hideInternalCard
            settledIdle
          />
        </div>
        {/* SC-1 = A: the engraved word for the gesture, under the dial, only while the throw is armed. */}
        {throwReady && !resolved && (
          <span
            data-testid="quest-check-throw-label"
            aria-hidden
            style={{
              alignSelf: 'center', marginTop: -2, fontFamily: FONT.display, fontSize: 13, fontWeight: 600, letterSpacing: '0.32em',
              textTransform: 'uppercase', color: 'var(--skin-title-color)', textShadow: '0 1px 0 var(--skin-hud-lacquer-deep)', pointerEvents: 'none',
            }}
          >
            {t('gameFrame.questWindow.checkOverlay.throwLabel')}
          </span>
        )}
        {/* The external Verdict Card — informational only (artifact-r003
            §4.2: NO continue/advance control). Click anywhere on the column
            dismisses once armed. */}
        {resolved && (
          <div
            data-testid="quest-verdict-card"
            role="status"
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 6,
              padding: '10px 12px 12px',
              borderRadius: 8,
              border: `1px solid color-mix(in srgb, ${verdictTone === 'danger' ? 'var(--skin-status-death, #a33)' : 'var(--skin-surface-border)'} 60%, transparent)`,
              background: 'var(--skin-hud-lacquer-deep)',
              boxShadow: '0 10px 24px color-mix(in srgb, var(--skin-hud-lacquer-deep) 80%, transparent)',
              animation: prefersReducedMotion() ? undefined : 'questVerdictCardIn 220ms ease-out both',
            }}
          >
            {/* R-259: the body is shared with QuestOutcomeToast so the popup
                is identical to the skill-check result. Harm reaches the card
                only as chips (R-234, guide §4). */}
            <QuestVerdictCardBody check={check} verdictLabel={verdictLabel} verdictTone={verdictTone} />
            <span style={{ fontFamily: FONT.serif, fontStyle: 'italic', fontSize: 12, color: 'var(--skin-text-muted)' }}>
              {t('gameFrame.questWindow.checkOverlay.dismissHint')}
            </span>
          </div>
        )}
        {/* Verdict announcement for assistive tech. */}
        <div aria-live="polite" style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clipPath: 'inset(50%)' }}>
          {resolved ? `${check.title}: ${verdictLabel}` : ''}
        </div>
      </div>
    </SkinScope>
  );
};

export default QuestSkillCheckColumn;
