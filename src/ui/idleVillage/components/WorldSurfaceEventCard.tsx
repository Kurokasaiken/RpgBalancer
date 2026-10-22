/**
 * WorldSurfaceEventCard — Goblin Invasion announcement shown at the peak of the shroud.
 *
 * The card appears reduced by 33% and shows only the "Invasion" badge plus
 * a clickable POI. After the player confirms, the sticker detaches and the
 * card shrinks into a narrow, tall reminder parked in the top-right of the world.
 *
 * Sequence, after the player confirms:
 *  1. `peeling`  — the bordered goblin sticker begins to detach;
 *  2. `falling`  — the sticker lands on the centre of `forest_1_top_left` (thud);
 *  3. `marching` — it crawls very slowly toward the village.
 *
 * In screen mode (`/game`) the sticker does not march: it starts exactly on the goblin of the glass case, flies to
 * the map marker named by `landingSelector`, and hands over to it (`onLand`), so only one goblin is ever drawn.
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { MatericEventCard } from '@/ui/designSystem/primitives';
import { GoblinInvasionWindow, GOBLIN_WINDOW_ASSETS } from '@/ui/idleVillage/components/GoblinInvasionWindow';
import { ReminderComponent } from './ReminderComponent';
import goblinStickerImage from '@/assets/ui/idleVillage/goblin-march-trasparente.webp';
import { trailerConfig } from '@/balancing/config/idleVillage/trailerConfig';
import { trackTelemetryEvent } from '@/analytics/telemetry/telemetryProvider';

export interface WorldSurfaceEventCardProps {
  /** Whether the card is visible at the peak of the shroud. */
  visible: boolean;
  /** Z-index at which the card sits: above the shroud but below the frame. */
  zIndex: number;
  /** Optional callback when the announcement sequence completes. */
  onComplete?: () => void;
  /** Called when the event card is ready to be unmounted. */
  onClose?: () => void;
  /** World point at the centre of the map where the modal appears. */
  worldCenter: { x: number; y: number };
  /** World canvas size, used to place the final reminder in the top-right. */
  canvasSize: { width: number; height: number };
  /** Current world camera, used to keep the card grounded in the world. */
  camera: { panX: number; panY: number; zoom: number };
  /** World point where the goblin sticker lands (centre of forest_1_top_left). */
  fallTarget: { x: number; y: number };
  /** World point the goblin slowly marches toward (the village). */
  marchTarget: { x: number; y: number };
  /** Days remaining (computed by parent from time engine if available). */
  daysRemaining?: number;
  /**
   * Park a reminder chip in the top-right after the player confirms. Default true (World Surface);
   * a screen with an event ledger turns it off, since the ledger already carries the countdown.
   */
  showReminder?: boolean;
  /** Size of the announcement card against the map (1 = the World Surface size). */
  cardSize?: number;
  /**
   * Screen-space anchor (CSS left/top of the card's centre). When set, the card lives in the viewport, not in the
   * world: it is scaled by `screenScale` and ignores the world offsets (the sticker does not travel yet).
   */
  screenAnchor?: { left: string; top: string };
  /** Scale of the card in screen space (1 = 460px wide). Only used with `screenAnchor`. */
  screenScale?: number;
  /**
   * Screen mode only: CSS selector of the map marker the sticker lands on. The marker must already be mounted (hidden)
   * when the fall starts; it is measured then.
   */
  landingSelector?: string;
  /** Screen mode only: the sticker has landed on the marker and unmounted — the marker takes over. */
  onLand?: () => void;
  /**
   * Screen mode only: CSS selector of the ledger row the card folds into. The row must already be mounted (hidden) when
   * the sticker leaves the case; the card is measured against it then.
   */
  rowSelector?: string;
  /** Screen mode only: the card has folded into the row — the row takes over. */
  onArrive?: () => void;
  /** The host is idle (boot finished): render the card once, invisibly, so its first real show costs nothing. */
  warm?: boolean;
}

type Stage = 'idle' | 'modal' | 'peeling' | 'falling' | 'marching' | 'done';

const DEFAULT_TOTAL_DAYS = Number(trailerConfig.threat.announcement.timerRing.number) || 5;

/**
 * World-pixel scale of the announcement card. The map canvas is 4240×2828, so
 * the card is authored at its design size (460px wide) and blown up here.
 * Reduced by 33% from the original modal size so it appears at this scale
 * from the moment the shroud shows it.
 */
const CARD_SCALE = 6 * 0.75;
/** The reminder is a narrow, tall pgCard-shaped chip, so it needs less scale. */
const REMINDER_SCALE = 3.4 * 0.75;

const CARD_W = 460;
/** Viewport that crops the glass case inside the card (from /primitives). */
const WINDOW_BOX_W = 364;
const WINDOW_BOX_H = 294;
const WINDOW_INNER_SCALE = 0.7;

/** Natural size of the sticker sprite once detached from the card. */
const STICKER_W = 476;
const STICKER_H = 376;
/** Apparent scale of the sticker while it still sits inside the card. */
const STICKER_CARD_SCALE = CARD_SCALE * WINDOW_INNER_SCALE;
/** Apparent scale once it has landed on the forest and marches on the map. */
const STICKER_MAP_SCALE = 1.6;
/** Where the glass case sits inside the card, in card-local pixels. */
const STICKER_START_Y = 30;

/** How long the invisible warm-up render stays mounted: enough for decode, filter raster and compositor upload. */
const WARM_MS = 2500;

/** Where a goblin sprite sits on screen, relative to the card anchor, and the sticker scale that matches it. */
interface StickerPose { x: number; y: number; scale: number }

/** Pose of the sticker that would cover `img` exactly (both draw the sprite `contain`-fitted, centred in their box). */
const poseOf = (img: HTMLElement, anchor: DOMRect, fitted: boolean): StickerPose => {
  const r = img.getBoundingClientRect();
  const nat = img instanceof HTMLImageElement && img.naturalHeight > 0 ? img.naturalWidth / img.naturalHeight : STICKER_W / STICKER_H;
  const contentW = fitted ? Math.min(r.width, r.height * nat) : r.width;
  return {
    x: r.x + r.width / 2 - anchor.x,
    y: r.y + r.height / 2 - anchor.y,
    scale: contentW / Math.min(STICKER_W, STICKER_H * nat),
  };
};

/** The card folds into its ledger row (shorter than the fall: the row is there to read before the goblin lands). */
const MORPH_MS = 1100;

const PEEL_MS = 900;
const FALL_MS = 1600;
const MARCH_DURATION_MS = trailerConfig.threat.goblin.marchDurationMs;

/**
 * Shared AudioContext for the landing thud. `new AudioContext()` blocks the main
 * thread (~1.1 s measured, PLAN-034 T-004/RC-2), so it is created during the
 * card's idle warm-up — never inside the landing animation — and resumed from
 * the player's confirm gesture to satisfy autoplay policy.
 */
let thudAudioContext: AudioContext | null = null;

/** Creates (once) the shared thud AudioContext. Null when WebAudio is unavailable. */
const ensureThudAudioContext = (): AudioContext | null => {
  if (thudAudioContext) return thudAudioContext;
  const AudioContextCtor =
    (window as never as { AudioContext?: typeof AudioContext; webkitAudioContext?: typeof AudioContext }).AudioContext ||
    (window as never as { AudioContext?: typeof AudioContext; webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioContextCtor) return null;
  thudAudioContext = new AudioContextCtor();
  return thudAudioContext;
};

/** Synthetic thud produced when the goblin hits the forest floor. */
const playThud = () => {
  const ctx = ensureThudAudioContext();
  if (!ctx) return;
  void ctx.resume();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.frequency.setValueAtTime(120, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(35, ctx.currentTime + 0.12);
  gain.gain.setValueAtTime(0.7, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start();
  osc.stop(ctx.currentTime + 0.2);
};

export const WorldSurfaceEventCard: React.FC<WorldSurfaceEventCardProps> = ({
  visible,
  zIndex,
  onComplete,
  onClose,
  worldCenter,
  canvasSize,
  fallTarget,
  marchTarget,
  daysRemaining = DEFAULT_TOTAL_DAYS,
  showReminder = true,
  cardSize = 1,
  screenAnchor,
  screenScale = 1,
  landingSelector,
  onLand,
  rowSelector,
  onArrive,
  warm = false,
}) => {
  const { t } = useTranslation('idleVillage');
  const [stage, setStage] = useState<Stage>('modal');
  const daysLeft = daysRemaining;
  const rootRef = useRef<HTMLDivElement>(null);
  const startPose = useRef<StickerPose | null>(null);
  const landPose = useRef<StickerPose | null>(null);
  const [warming, setWarming] = useState(false);
  /** Where the card folds to (offsets from the anchor + the scales that give the row's size); null = just fade. */
  const [morph, setMorph] = useState<{ x: number; y: number; sx: number; sy: number } | null>(null);
  const [cardGone, setCardGone] = useState(false);
  /** The action arms when the card has finished appearing (R-234): never confirm a card the player has not seen. */
  const [armed, setArmed] = useState(false);
  // The host passes inline callbacks that change every render; the stage timers must not restart because of them.
  const onCloseRef = useRef(onClose);
  const onLandRef = useRef(onLand);
  const onArriveRef = useRef(onArrive);
  useEffect(() => {
    onCloseRef.current = onClose;
    onLandRef.current = onLand;
    onArriveRef.current = onArrive;
  });

  const screenMode = screenAnchor !== undefined;
  /** Scale the card is authored at: world blow-up on the map, plain screen size in the viewport. */
  const cardScale = (screenMode ? screenScale : CARD_SCALE) * cardSize;

  const fallOffset = useMemo(
    () => (screenMode ? { x: 0, y: 0 } : { x: fallTarget.x - worldCenter.x, y: fallTarget.y - worldCenter.y }),
    [fallTarget, worldCenter, screenMode],
  );

  const marchOffset = useMemo(
    () => (screenMode ? { x: 0, y: 0 } : { x: marchTarget.x - worldCenter.x, y: marchTarget.y - worldCenter.y }),
    [marchTarget, worldCenter, screenMode],
  );

  /**
   * Parked position of the reminder: top-right of the map, pulled inside the
   * carved frame so the card is not clipped by it.
   */
  const reminderOffset = useMemo(() => ({
    x: canvasSize.width * 0.8 - worldCenter.x,
    y: canvasSize.height * 0.26 - worldCenter.y,
  }), [canvasSize, worldCenter]);

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    setStage(visible ? 'modal' : 'idle');
    setMorph(null);
    setCardGone(false);
    setArmed(false);
  }, [visible]);
  /* eslint-enable react-hooks/set-state-in-effect */

  /**
   * Fetch and decode every image of the card as soon as it is mounted, not when it opens: the sticker only enters the
   * DOM at `peeling`, and the case draws four images through SVG filters, so a cold start dropped frames at the reveal
   * (766ms measured, see .mw/runs/2026-09-15-world-surface-perf/findings.md).
   */
  useEffect(() => {
    for (const src of [...GOBLIN_WINDOW_ASSETS, goblinStickerImage]) {
      const img = new Image();
      img.src = src;
      void img.decode?.().catch(() => undefined);
    }
    /* Pre-create the thud AudioContext while the card idles in `modal` waiting
     * for the player: the constructor blocks the main thread, so it must never
     * run inside the landing animation (PLAN-034 T-008). */
    const warm = window.setTimeout(() => ensureThudAudioContext(), 300);
    return () => window.clearTimeout(warm);
  }, []);

  /* Once the host is idle, mount the case invisibly for a moment so layout, filter raster and GPU upload are paid now. */
  useEffect(() => {
    if (!warm) return undefined;
    setWarming(true);
    const timer = window.setTimeout(() => setWarming(false), WARM_MS);
    return () => window.clearTimeout(timer);
  }, [warm]);

  useEffect(() => {
    if (stage === 'peeling') {
      const timer = window.setTimeout(() => {
        // Screen mode: the marker is mounted by now (hidden); the sticker flies to wherever it is on screen.
        const marker = screenMode && landingSelector ? document.querySelector<HTMLElement>(landingSelector) : null;
        const anchor = rootRef.current?.getBoundingClientRect();
        landPose.current = marker && anchor ? poseOf(marker, anchor, false) : null;
        // The card folds into its ledger row: same centre, the row's width and height.
        const row = screenMode && rowSelector ? document.querySelector<HTMLElement>(rowSelector) : null;
        const body = rootRef.current?.querySelector<HTMLElement>('[data-testid="world-event-card-body"]');
        if (row && body && anchor) {
          const r = row.getBoundingClientRect();
          const b = body.getBoundingClientRect();
          setMorph({
            x: r.x + r.width / 2 - anchor.x,
            y: r.y + r.height / 2 - anchor.y,
            sx: (cardScale * r.width) / b.width,
            sy: (cardScale * r.height) / b.height,
          });
        }
        setStage('falling');
      }, PEEL_MS);
      return () => window.clearTimeout(timer);
    }
    if (stage === 'falling') {
      const arrive = window.setTimeout(() => {
        setCardGone(true);
        onArriveRef.current?.();
      }, MORPH_MS);
      const timer = window.setTimeout(() => {
        playThud();
        if (screenMode) {
          onLandRef.current?.();
          setStage('done');
          onCloseRef.current?.();
          return;
        }
        setStage('marching');
      }, FALL_MS);
      return () => {
        window.clearTimeout(timer);
        window.clearTimeout(arrive);
      };
    }
    if (stage === 'marching') {
      const timer = window.setTimeout(() => {
        setStage('done');
        onCloseRef.current?.();
      }, MARCH_DURATION_MS + 500);
      return () => window.clearTimeout(timer);
    }
    return undefined;
  }, [stage, screenMode, landingSelector, rowSelector, cardScale]);

  /* The design-system card has no `disabled` seam (and is not ours to extend here): until the card has fully
   * appeared its own action button is disabled from outside, so it neither looks nor acts armed (R-234). */
  useEffect(() => {
    const button = rootRef.current?.querySelector<HTMLButtonElement>('[data-testid="world-event-card-body"] button');
    if (button) button.disabled = !armed;
  });

  const handleAction = useCallback(() => {
    if (stage !== 'modal' || !armed) return;
    trackTelemetryEvent('world_surface_event_ack', {
      eventType: 'world_surface_event_ack',
      data: { event: 'goblin_invasion', daysLeft },
      context: 'world-surface-event-card',
      timestamp: Date.now(),
      metadata: {},
    });
    // Resume the shared thud context inside the player's gesture (autoplay policy);
    // if the warm-up hasn't run yet this also creates it here, off the landing path.
    void ensureThudAudioContext()?.resume();
    // Screen mode: the sticker starts exactly on the goblin of the case, whatever the case's parallax is doing.
    const source = screenMode ? rootRef.current?.querySelector<HTMLElement>('[data-testid="goblin-window-sticker"]') : null;
    const anchor = rootRef.current?.getBoundingClientRect();
    startPose.current = source && anchor ? poseOf(source, anchor, true) : null;
    onComplete?.();
    setStage('peeling');
  }, [stage, armed, onComplete, daysLeft, screenMode]);

  /* The sticker takes over the goblin the moment the peel starts: it is mounted at its card position and the window
   * hides its own goblin, so the two never show together (the old mount at `falling` drew both for ~0.5 s). */
  // Screen mode: the case plays its own peel (the border wipes in) and the sticker takes over only when it ends.
  const stickerDetached = screenMode
    ? stage === 'falling'
    : stage === 'peeling' || stage === 'falling' || stage === 'marching' || stage === 'done';
  const modalBody = (
    <motion.div
      key="modal"
      data-testid="world-event-card-body"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      onAnimationComplete={(def) => { if (typeof def === 'object' && (def as { opacity?: number }).opacity === 1) setArmed(true); }}
      style={{
        position: 'absolute',
        left: 0,
        top: 0,
        width: CARD_W,
        transform: 'translate(-50%, -50%)',
      }}
    >
      <MatericEventCard
        variant="modal"
        badge={String(t('world.goblinInvasion.invasion'))}
        subtitle={String(t('world.goblinInvasion.subtitle', { count: daysLeft }))}
        image={
          <div
            style={{
              position: 'relative',
              width: WINDOW_BOX_W,
              height: WINDOW_BOX_H,
              overflow: 'hidden',
              margin: '0 auto',
            }}
          >
            <GoblinInvasionWindow
              ariaLabel={String(t('world.goblinInvasion.title'))}
              peeled={stage === 'peeling'}
              goblinHidden={stickerDetached}
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: `translate(-50%, -50%) scale(${WINDOW_INNER_SCALE})`,
              }}
            />
          </div>
        }
        actionLabel={String(t('world.goblinInvasion.action'))}
        onAction={handleAction}
        style={{
          maxWidth: CARD_W,
          width: CARD_W,
          background:
            'radial-gradient(ellipse at 25% 8%, rgba(255,255,255,.08), transparent 42%), ' +
            'radial-gradient(ellipse at 85% 95%, rgba(0,118,130,.14), transparent 48%), ' +
            'linear-gradient(135deg, #07131b 0%, #0c1921 45%, #061016 100%)',
          boxShadow:
            'inset 0 1px rgba(255,255,255,.11), inset 0 -2px rgba(0,0,0,.7), ' +
            '0 4px 4px rgba(0,0,0,.5), 0 14px 30px rgba(0,0,0,.35)',
        }}
      />
    </motion.div>
  );

  if (!visible || stage === 'idle') {
    // Warm-up: the same card, invisible and inert, so its first real show finds everything decoded and rastered.
    if (!warming || !screenMode) return null;
    return (
      <div
        aria-hidden
        style={{ position: 'absolute', left: screenAnchor.left, top: screenAnchor.top, width: 0, height: 0, zIndex, opacity: 0.01, pointerEvents: 'none' }}
      >
        <div style={{ position: 'absolute', left: 0, top: 0, width: 0, height: 0, transform: `scale(${cardScale})` }}>{modalBody}</div>
      </div>
    );
  }

  /** The card keeps its modal shape while the sticker is still attached. */
  const isModal = stage === 'modal' || stage === 'peeling';
  /** Screen mode: the card stays up while it folds into its ledger row, then fades. */
  const folding = screenMode && morph !== null && stage === 'falling' && !cardGone;
  const showBody = isModal || folding;
  // Screen mode measures the real goblin of the case; world mode keeps the authored geometry.
  const stickerStartY = startPose.current ? startPose.current.y : STICKER_START_Y * cardScale;
  const stickerStartX = startPose.current ? startPose.current.x : 0;
  const stickerStartScale = startPose.current ? startPose.current.scale : STICKER_CARD_SCALE * (cardScale / CARD_SCALE);
  const landing: StickerPose = landPose.current ?? { x: stickerStartX, y: stickerStartY, scale: stickerStartScale };

  const stickerAnimate = stage === 'peeling'
    ? { x: stickerStartX, y: stickerStartY, scale: stickerStartScale }
    : stage === 'falling'
      ? (screenMode ? landing : { x: fallOffset.x, y: fallOffset.y, scale: STICKER_MAP_SCALE })
      : { x: marchOffset.x, y: marchOffset.y, scale: STICKER_MAP_SCALE };

  const stickerTransition = stage === 'peeling'
    ? { duration: 0 }
    : stage === 'falling'
      ? {
        x: { duration: FALL_MS / 1000, ease: 'easeIn' as const },
        y: { duration: FALL_MS / 1000, ease: 'easeIn' as const },
        scale: { duration: FALL_MS / 1000, ease: 'easeOut' as const },
      }
    : {
        x: { duration: MARCH_DURATION_MS / 1000, ease: 'linear' as const },
        y: { duration: MARCH_DURATION_MS / 1000, ease: 'linear' as const },
        scale: { duration: 0.4 },
      };

  return (
    <div
      ref={rootRef}
      data-testid="world-event-card"
      style={{
        position: 'absolute',
        left: screenAnchor ? screenAnchor.left : worldCenter.x,
        top: screenAnchor ? screenAnchor.top : worldCenter.y,
        width: 0,
        height: 0,
        zIndex,
        // The host overlay is pointer-transparent; the card itself must still take clicks.
        pointerEvents: screenMode ? 'auto' : undefined,
      }}
    >
      {/* Card: modal in the middle of the map, then a small reminder top-right. */}
      <motion.div
        initial={{ x: 0, y: 0, scaleX: cardScale, scaleY: cardScale }}
        animate={
          isModal
            ? { x: 0, y: 0, scaleX: cardScale, scaleY: cardScale }
            : screenMode && morph
              // Folds into the ledger row (same centre, the row's own size) and stays there while it fades out.
              ? { x: morph.x, y: morph.y, scaleX: morph.sx, scaleY: morph.sy }
              : showReminder
                ? { x: reminderOffset.x, y: reminderOffset.y, scaleX: REMINDER_SCALE, scaleY: REMINDER_SCALE }
                // The host keeps the reminder elsewhere (its own ledger): the card just fades where it stands.
                : { x: 0, y: 0, scaleX: cardScale, scaleY: cardScale }
        }
        transition={folding ? { duration: MORPH_MS / 1000, ease: [0.5, 0, 0.2, 1] } : { duration: 1.2, ease: 'easeInOut' }}
        style={{ position: 'absolute', left: 0, top: 0, width: 0, height: 0 }}
      >
        <AnimatePresence mode="wait">
          {showBody ? (
            modalBody
          ) : !showReminder ? null : (
            <motion.div
              key="reminder"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
              style={{
                position: 'absolute',
                left: 0,
                top: 0,
                transform: 'translate(-50%, -50%)',
              }}
            >
              <ReminderComponent
                title={String(t('world.goblinInvasion.invasion'))}
                daysLeftValue={daysLeft}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* The bordered goblin sticker, once torn off the card. */}
      {stickerDetached && (
        <motion.div
          data-testid="goblin-flight-sticker"
          initial={{ x: stickerStartX, y: stickerStartY, scale: stickerStartScale }}
          animate={stickerAnimate}
          transition={stickerTransition}
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            width: STICKER_W,
            height: STICKER_H,
            marginLeft: -STICKER_W / 2,
            marginTop: -STICKER_H / 2,
            pointerEvents: 'none',
            zIndex: 10,
          }}
        >
          <img
            src={goblinStickerImage}
            alt=""
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'contain',
              filter: 'drop-shadow(0 12px 22px rgba(0,0,0,0.55))',
            }}
          />
        </motion.div>
      )}
    </div>
  );
};

export default WorldSurfaceEventCard;
