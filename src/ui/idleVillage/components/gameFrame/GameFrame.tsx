import React, { useCallback, useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { MatericButton } from '@/ui/designSystem/primitives';
import { HudPlaque, SkinScope, SkinTitle } from '@/ui/idleVillage/skins/primitives';
import { trackTelemetryEvent } from '@/analytics/telemetry/telemetryProvider';
import './gameFrameCursors.css';
import { HudRibbon } from './HudRibbon';
import { HudGlyph } from './hudIcons';
import { EngravedIcon } from './engravedIcons';
import { HudHideToggle } from './HudHideToggle';
import { HudTooltip } from './HudTooltip';
import { useHudMaterial } from './useHudMaterial';
import {
  DEFAULT_GAME_FRAME_CONFIG,
  type GameFrameConfig,
  type GameFrameNavItemConfig,
} from '@/balancing/config/idleVillage/gameFrameConfig';
import { getMobileFitConfig } from '@/balancing/config/idleVillage/mobileFitConfig';
import { useMobileFit } from '@/hooks/useMobileFit';

/**
 * GameFrame — the game's persistent shell, v3.
 *
 * v1 boxed the map in a bronze grid; v2 unboxed it but dressed every cluster
 * in uniform-radius rounded rectangles, which is the clearest "web page" tell
 * there is. v3 takes the composition of the Director's own reference mockup:
 * shaped ribbons cut at their corners, an object hung from a cord, the world
 * full-bleed underneath, and the map's *own* painted frame switched off so
 * this shell is the only frame on screen (`worldDressing.hiddenLayerIds`).
 *
 * Four clusters, one job each:
 *   top-left     — identity (who this game is)
 *   top-centre   — when and where (day, place)
 *   top-right    — what I have (resources)
 *   right edge   — what is coming (the hung tag)
 *   bottom-centre— where I can go (nav)
 *
 * The roster is not chrome: the page passes it through `rosterSlot` and the shell
 * only places it (`config.roster`); the roster carries its own shadow and moves by
 * its own drag handle. Director, 2026-10-01, reversing the 2026-09-22 call to keep it
 * off this screen.
 *
 * Mechanics are ours only: the reference mockup shows weather, a notification
 * bell and crystal/stone resources, none of which exist in this game — per
 * the Director, the mockup supplies composition, not mechanics.
 */
export interface GameFrameProps {
  /** Game title, already i18n-resolved by the caller. */
  title: string;
  /** Small tracked line under the title. */
  subtitle?: string;
  navItems: GameFrameNavItemConfig[];
  activeNavId: string;
  onNavSelect?: (id: string) => void;
  /** Top-centre ribbon content — day, place. */
  whenWhereSlot: ReactNode;
  /** Top-centre tab: the nearest event (HUD-3 = P1). Omit it, or render null, and the middle of the sky stays clear. */
  nextSlot?: ReactNode;
  /** Top-right ribbon content — the resource readout. */
  resourcesSlot: ReactNode;
  /** Right edge — the hung tag (what is coming). */
  hangingSlot?: ReactNode;
  /** Bottom-right — utility controls (speed). The corner the mockup reserves for them. */
  utilitySlot?: ReactNode;
  /** The world map (or any other view). Fills the entire frame, edge to edge. */
  children: ReactNode;
  /**
   * Optional dressing that floats directly over the map (orb, compass...),
   * between the map and the ribbons. The wrapper ignores pointer input; interactive
   * children must set `pointerEvents: 'auto'` themselves.
   */
  floatingSlot?: ReactNode;
  /**
   * Non-interactive dressing drawn ABOVE the ribbons (foliage, rolled maps) so it
   * can overlap and break their edges. Wrapped in `pointerEvents: none`.
   */
  dressingSlot?: ReactNode;
  /** Top-left cartouche: what the player should do now. Omit it and the corner stays free. */
  objectiveSlot?: ReactNode;
  /** Top-left: the game menu cartouche (R-132) — sits beside the objective in the same cell. */
  menuSlot?: ReactNode;
  /** Set into the middle of the nav plinth (the map re-centre coin). */
  recenterSlot?: ReactNode;
  /** Lower-left: the roster, laid on the table like an object (see `config.roster`). */
  rosterSlot?: ReactNode;
  config?: GameFrameConfig;
  className?: string;
  style?: CSSProperties;
  /**
   * Bump this number to call the chrome back on the game's behalf (event
   * wake): an event must always be able to restore the instruments, even
   * over a deliberately hidden HUD.
   */
  hudWakeSignal?: number;
  /**
   * Reports every chrome visibility change. `cause` says how it was hidden —
   * `'idle'` (the stillness timer) vs `'manual'` (the toggle/`h`); on a wake it
   * reports the cause of the hide it ends. The contemplation reward (sea
   * wonder) listens for `hidden === true && cause === 'idle'` (Director,
   * 2026-10-12: a hand-hidden HUD is a deliberate clean view, not a reward).
   */
  onHudHiddenChange?: (hidden: boolean, cause: 'manual' | 'idle') => void;
  /**
   * `atlas` (default) is the thin, minimal-line ribbon this shell shipped
   * with. `cartographer` adds the carved-bevel weight the R-075 review asked
   * to see compared side by side ("prendere da Cartographer's Desk la
   * materialità degli oggetti"). Same structure, same slots, same config —
   * only the ribbon's own material changes, so this is a rendering choice,
   * not a second shell to maintain.
   */
  variant?: 'atlas' | 'cartographer';
  /**
   * PLAN-043 WS-2: when the three-zone stage owns panel placement, the
   * roster/hanging slots render inside a neutral full-area layer and the
   * stage's `StagePanelFrame` supplies position + suspension — the anchor and
   * the hung-tag wrapper would double-position them.
   */
  stageMode?: boolean;
  /**
   * PLAN-043 WS-5 / DEF-06: CSS `zoom` applied to the HUD chrome clusters
   * (browser interface-size path — the desktop app zooms the whole webview
   * natively instead). The world map and its dressing keep their own scale;
   * pointer/rect code inside the chrome layer converts device px via
   * `getHudZoomFactor()`.
   */
  hudZoom?: number;
}

/**
 * Holds the roster against the bottom of the screen, but when the player collapses it
 * (the eye) the TOP edge stays where it was: the box keeps the expanded height while the
 * content shrinks upwards, instead of the whole window sinking to the bottom edge.
 * The empty part of the box does not catch pointer input.
 */
function RosterAnchor({ style, children }: { style: CSSProperties; children: ReactNode }) {
  const content = useRef<HTMLDivElement>(null);
  const [heldHeight, setHeldHeight] = useState<number | null>(null);
  useLayoutEffect(() => {
    const node = content.current;
    if (!node) return undefined;
    const measure = () => {
      const collapsed = node.querySelector('[data-collapsed]') !== null;
      if (!collapsed) setHeldHeight(node.offsetHeight);
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(node);
    return () => observer.disconnect();
  }, []);
  return (
    <div style={{ ...style, height: heldHeight ?? undefined, pointerEvents: 'none' }}>
      <div ref={content} style={{ pointerEvents: 'auto' }}>
        {children}
      </div>
    </div>
  );
}

export const GameFrame: React.FC<GameFrameProps> = ({
  title,
  subtitle,
  navItems,
  activeNavId,
  onNavSelect,
  whenWhereSlot,
  nextSlot,
  resourcesSlot,
  hangingSlot,
  utilitySlot,
  children,
  floatingSlot,
  dressingSlot,
  rosterSlot,
  recenterSlot,
  objectiveSlot,
  menuSlot,
  config = DEFAULT_GAME_FRAME_CONFIG,
  className,
  style,
  hudWakeSignal,
  onHudHiddenChange,
  variant = 'atlas',
  stageMode = false,
  hudZoom = 1,
}) => {
  const { t } = useTranslation('idleVillage');
  const chromeZoom: CSSProperties = hudZoom !== 1 ? { zoom: hudZoom } : {};
  const inset = config.insets.edgeInsetPx;
  const bevel = variant === 'cartographer';
  const lacquer = useHudMaterial() === 'lacquer';
  const z = config.zLayers;
  const washOn = config.edgeWash.enabled || (import.meta.env.DEV && typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('wash') === '1');

  /* Hide-HUD: every chrome cluster slides off its own edge — the top row rises,
   * the bottom instruments sink — while one pearl (the toggle) stays in the
   * bottom-right corner to call it all back. Session-only by design: reopening
   * the map always lands on a dressed HUD.
   *
   * Two ways in, one way out: hidden by hand (`h` / the pearl) it waits for its
   * toggle — deliberate zen stays deliberate. Hidden by stillness (`idleHideMs`)
   * ANY input calls it back, and so does the game itself (`hudWakeSignal`) when
   * an event needs the instruments. `hiddenBy` remembers which case we're in. */
  const [hudHidden, setHudHidden] = useState(false);
  const hiddenBy = useRef<'manual' | 'idle'>('manual');
  /* PLAN-083: below `mobileFitConfig.breakpointPx` the nav compacts to icon
   * chips + an «Altro» overflow sheet (VF-1 resolved in the debate — the
   * scroll variant was eliminated a priori: it violates the 44px invariant). */
  const mobileFit = useMobileFit();
  const mcfg = getMobileFitConfig();
  const [navMoreOpen, setNavMoreOpen] = useState(false);
  const navRootRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (!navMoreOpen) return undefined;
    const onDown = (event: Event) => {
      const root = navRootRef.current;
      if (root && event.target instanceof Node && !root.contains(event.target)) setNavMoreOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setNavMoreOpen(false);
    };
    window.addEventListener('pointerdown', onDown);
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('pointerdown', onDown);
      window.removeEventListener('keydown', onKey);
    };
  }, [navMoreOpen]);
  useEffect(() => {
    if (!mobileFit) setNavMoreOpen(false);
  }, [mobileFit]);
  const reducedMotion = useRef(typeof window !== 'undefined' && (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false)).current;
  const slideMs = reducedMotion ? 0 : config.hudHide.slideMs;
  const fadeMs = Math.round(slideMs * 0.55);
  const toggleHud = useCallback(() => {
    hiddenBy.current = 'manual';
    setHudHidden((v) => {
      trackTelemetryEvent('game_hud_toggle', { hidden: !v, reason: 'manual' });
      return !v;
    });
  }, []);
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      const target = event.target as HTMLElement | null;
      if (target && (target.isContentEditable || /^(INPUT|SELECT|TEXTAREA)$/.test(target.tagName))) return;
      if (event.key.toLowerCase() === config.hudHide.shortcut) toggleHud();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [toggleHud, config.hudHide.shortcut]);

  /* Idle hide: any input re-arms the clock; when it fires the chrome slides away
   * on its own. From there any input wakes it — except a hit on the pearl itself,
   * which is a deliberate toggle, not a wake. While hidden by hand the listeners
   * stay but do nothing, so the pearl remains the only way back. */
  const idleHideMs = config.hudHide.idleHideMs;
  useEffect(() => {
    if (idleHideMs <= 0) return undefined;
    // `globalThis.setTimeout`, not window.setTimeout: vitest fake timers patch the global binding.
    let timer: ReturnType<typeof globalThis.setTimeout> | undefined;
    const onActivity = (event?: Event) => {
      globalThis.clearTimeout(timer);
      timer = undefined;
      if (hudHidden) {
        // A real event only: the effect's own re-run (after the hide commits)
        // must not count as a wake, or the chrome would bounce straight back.
        const target = event?.target as HTMLElement | null;
        if (event && hiddenBy.current === 'idle' && !target?.closest?.('[data-hud-hide-toggle]')) {
          hiddenBy.current = 'manual';
          setHudHidden(false);
          trackTelemetryEvent('game_hud_toggle', { hidden: false, reason: 'input' });
        }
        return;
      }
      timer = globalThis.setTimeout(() => {
        hiddenBy.current = 'idle';
        setHudHidden(true);
        trackTelemetryEvent('game_hud_toggle', { hidden: true, reason: 'idle' });
      }, idleHideMs);
    };
    onActivity();
    const ACTIVITY_EVENTS: (keyof WindowEventMap)[] = ['pointerdown', 'pointermove', 'keydown', 'wheel'];
    ACTIVITY_EVENTS.forEach((name) => window.addEventListener(name, onActivity, { passive: true }));
    return () => {
      globalThis.clearTimeout(timer);
      ACTIVITY_EVENTS.forEach((name) => window.removeEventListener(name, onActivity));
    };
  }, [idleHideMs, hudHidden]);

  /* Event wake: the game bumps `hudWakeSignal` when an event needs attention —
   * the chrome comes back no matter how it left. */
  const wakeSignalSeen = useRef(hudWakeSignal ?? 0);
  useEffect(() => {
    const signal = hudWakeSignal ?? 0;
    if (signal === wakeSignalSeen.current) return;
    wakeSignalSeen.current = signal;
    hiddenBy.current = 'manual';
    setHudHidden((prev) => {
      if (prev) trackTelemetryEvent('game_hud_toggle', { hidden: false, reason: 'event' });
      return false;
    });
  }, [hudWakeSignal]);

  useEffect(() => {
    onHudHiddenChange?.(hudHidden, hiddenBy.current);
  }, [hudHidden, onHudHiddenChange]);
  /** Slide style for one chrome cluster. `base` preserves a transform the element already needs (centering, tilt). */
  const slideChrome = (dir: 'up' | 'down', base = ''): CSSProperties => {
    const prefix = base && base !== 'none' ? `${base} ` : '';
    return hudHidden
      ? {
          transform: `${prefix}translateY(calc(${dir === 'up' ? '-100% -' : '100% +'} ${config.hudHide.offscreenPx}px))`,
          opacity: 0,
          visibility: 'hidden',
          transition: `transform ${slideMs}ms ease, opacity ${fadeMs}ms ease, visibility 0s linear ${slideMs}ms`,
        }
      : {
          transform: base || 'none',
          opacity: 1,
          visibility: 'visible',
          transition: `transform ${slideMs}ms ease, opacity ${fadeMs}ms ease`,
        };
  };

  /* Baseline 'none' keeps the roster anchor from becoming a containing block for
   * its position:fixed drag overlay (see the comment at the anchor below). */
  const rosterBaseTransform =
    config.roster.tiltDeg !== 0 || config.roster.scale !== 1
      ? `rotate(${config.roster.tiltDeg}deg) scale(${config.roster.scale})`
      : '';

  const navTarget = mcfg.minTargetPx;
  const navItemBtn = (item: GameFrameNavItemConfig, iconOnly: boolean) => {
    const isActive = item.id === activeNavId;
    return (
      <HudTooltip key={item.id} label={t(item.labelKey)} hint={t('gameFrame.nav.locked')} side="top" wrap when={!!item.locked}>
        <MatericButton
          variant="secondary"
          disabled={item.locked}
          data-nav-id={item.id}
          onClick={item.locked ? undefined : () => onNavSelect?.(item.id)}
          aria-pressed={isActive}
          aria-label={item.locked ? `${t(item.labelKey)} — ${t('gameFrame.nav.locked')}` : iconOnly ? t(item.labelKey) : undefined}
          style={{
            display: 'flex',
            flexDirection: iconOnly ? 'row' : 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: iconOnly ? 0 : 3,
            padding: iconOnly ? 0 : '6px 18px',
            minWidth: iconOnly ? navTarget : 40,
            minHeight: iconOnly ? navTarget : 40,
            border: 'none',
            borderRadius: 4,
            background: isActive
              ? 'linear-gradient(180deg, rgba(120,220,225,0.30) 0%, rgba(28,120,132,0.22) 55%, rgba(10,50,58,0.35) 100%)'
              : 'transparent',
            boxShadow: isActive
              ? 'inset 0 1px 0 rgba(255,255,255,0.35), inset 0 -1px 0 var(--skin-title-color, #f0cf6a), 0 0 14px rgba(64,190,200,0.25)'
              : item.locked
                ? 'inset 0 1px 2px rgba(0,0,0,0.6)'
                : 'none',
            opacity: 1,
            position: 'relative',
            fontSize: 'var(--skin-hud-caps-size)',
            color: isActive ? 'var(--skin-title-color, #f0cf6a)' : item.locked ? 'var(--skin-text-secondary)' : undefined,
          }}
        >
          <HudGlyph
            iconId={item.icon}
            label={t(item.labelKey)}
            size={17}
            style={{
              color: isActive
                ? 'var(--skin-title-color, #f0cf6a)'
                : item.locked
                  ? 'var(--skin-text-secondary)'
                  : 'var(--skin-icon-color, #dfb857)',
            }}
          />
          {!iconOnly && t(item.labelKey)}
          {item.locked && (
            <EngravedIcon
              id="cmd-lock"
              aria-hidden="true"
              size="calc(var(--skin-hud-inline-gap) * 2)"
              style={{
                position: 'absolute',
                top: 'var(--skin-hud-control-gap)',
                right: 'var(--skin-hud-inline-gap)',
                color: 'var(--skin-label-primary)',
              }}
            />
          )}
        </MatericButton>
      </HudTooltip>
    );
  };

  /* Mobile branch (PLAN-083): icon-only 44×44 chips for `navPrimaryIds`
   * (ordered per config, filtered to existing items) + «Altro» chip opening
   * a sheet with the full labelled list. Deterministic budget is enforced
   * by the config schema, not by measurement here. */
  const navContent = mobileFit ? (
    <div ref={navRootRef} style={{ position: 'relative' }}>
      <nav aria-label={t('gameFrame.nav.ariaLabel')} style={{ display: 'flex', alignItems: 'center', gap: mcfg.navGapPx }}>
        {mcfg.navPrimaryIds
          .map((id) => navItems.find((it) => it.id === id))
          .filter((it): it is GameFrameNavItemConfig => !!it)
          .map((item) => navItemBtn(item, true))}
        <MatericButton
          variant="secondary"
          data-nav-more=""
          aria-label={t('gameFrame.nav.more')}
          aria-expanded={navMoreOpen}
          onClick={() => setNavMoreOpen((v) => !v)}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 0,
            minWidth: navTarget,
            minHeight: navTarget,
            border: 'none',
            borderRadius: 4,
            background: 'transparent',
          }}
        >
          <EngravedIcon id="cmd-panels" aria-hidden="true" size={18} />
        </MatericButton>
      </nav>
      {navMoreOpen && (
        <HudPlaque
          shape="panel"
          as="div"
          role="menu"
          aria-label={t('gameFrame.nav.more')}
          style={{
            position: 'absolute',
            left: '50%',
            transform: 'translateX(-50%)',
            bottom: 'calc(100% + 10px)',
            zIndex: 1100,
            display: 'flex',
            flexDirection: 'column',
            gap: 6,
            padding: '12px 14px',
            minWidth: 200,
          }}
        >
          {navItems.map((item) => {
            const isActive = item.id === activeNavId;
            return (
              <button
                key={item.id}
                type="button"
                role="menuitem"
                disabled={item.locked}
                data-nav-id={item.id}
                aria-label={item.locked ? `${t(item.labelKey)} — ${t('gameFrame.nav.locked')}` : t(item.labelKey)}
                onClick={() => {
                  if (item.locked) return;
                  onNavSelect?.(item.id);
                  setNavMoreOpen(false);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  minHeight: navTarget,
                  padding: '0 10px',
                  border: 'none',
                  borderRadius: 4,
                  background: 'transparent',
                  color: isActive ? 'var(--skin-title-color, #f0cf6a)' : 'var(--skin-text-secondary)',
                  fontFamily: 'var(--skin-font-display)',
                  fontSize: 'var(--skin-hud-caps-size)',
                  opacity: item.locked ? 0.55 : 1,
                  cursor: item.locked ? 'default' : 'pointer',
                  textAlign: 'left',
                }}
              >
                <HudGlyph iconId={item.icon} label={t(item.labelKey)} size={17} />
                {t(item.labelKey)}
              </button>
            );
          })}
        </HudPlaque>
      )}
    </div>
  ) : (
    <nav aria-label={t('gameFrame.nav.ariaLabel')} style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
      {navItems.map((item, index) => {
        return (
          <React.Fragment key={item.id}>
          {navItemBtn(item, false)}
          {index === 1 && recenterSlot}
          </React.Fragment>
        );
      })}
    </nav>
  );


  return (
    <SkinScope
      className={['game-frame', className].filter(Boolean).join(' ')}
      data-hud-hidden={hudHidden ? '' : undefined}
      style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden', overscrollBehavior: 'none', ...style }}
    >
      {/* The world. Full-bleed, edge to edge — and the only frame on screen is this shell. */}
      <div style={{ position: 'absolute', inset: 0 }}>{children}</div>

      {/* ── Dry-brush edge wash: left and bottom, over the sea, under every piece of chrome ── */}
      {washOn && (
        <div aria-hidden="true" style={{ position: 'absolute', inset: 0, zIndex: z.wash, pointerEvents: 'none', opacity: config.edgeWash.opacity }}>
          <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: config.edgeWash.leftPx, backgroundImage: `url(${config.edgeWash.leftSrc})`, backgroundSize: '100% 100%', backgroundPosition: 'left center', maskImage: 'linear-gradient(90deg, #000 0%, transparent 100%)', WebkitMaskImage: 'linear-gradient(90deg, #000 0%, transparent 100%)' }} />
          <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: config.edgeWash.bottomPx, backgroundImage: `url(${config.edgeWash.bottomSrc})`, backgroundSize: '100% 100%', backgroundPosition: 'center bottom', maskImage: 'linear-gradient(0deg, #000 0%, transparent 100%)', WebkitMaskImage: 'linear-gradient(0deg, #000 0%, transparent 100%)' }} />
        </div>
      )}

      {/* ── Floating dressing: sits over the map, under the ribbons ── */}
      {floatingSlot != null && (
        // Full-screen, so it must not eat map input; each instrument opts back in with `pointerEvents: auto`.
        <div style={{ position: 'absolute', inset: 0, zIndex: z.floating, pointerEvents: 'none' }}>{floatingSlot}</div>
      )}

      {/* ── Top-left: identity (off by default, `config.identity.showTitle`) ── */}
      {config.identity.showTitle && (
        <HudRibbon
          bevel={bevel}
          anchor="top"
          cutPx={22}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            zIndex: 10,
            flexDirection: 'column',
            alignItems: 'flex-start',
            padding: '8px 40px 12px 22px',
            ...chromeZoom,
            ...slideChrome('up'),
          }}
        >
          <SkinTitle level="subtitle" style={{ margin: 0, fontSize: 15, letterSpacing: '0.1em' }}>
            {title}
          </SkinTitle>
          {subtitle != null && (
            <span
              style={{
                fontFamily: 'var(--skin-font-display)',
                fontSize: 11,
                letterSpacing: '0.24em',
                textTransform: 'uppercase',
                color: 'var(--skin-label-tertiary, #9a8246)',
                marginTop: 2,
              }}
            >
              {subtitle}
            </span>
          )}
        </HudRibbon>
      )}

      {/* ── Top row (lacquer): objective | when and where | what I have — a grid, so the plaques cannot overlap ── */}
      {lacquer && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            zIndex: z.chrome,
            display: 'grid',
            gridTemplateColumns: mobileFit ? 'minmax(0, 1fr) minmax(0, auto)' : 'minmax(0, 1fr) auto minmax(0, 1fr)',
            columnGap: 12,
            padding: 'env(safe-area-inset-top, 0px) 20px 0',
            alignItems: 'start',
            pointerEvents: 'none',
            ...chromeZoom,
            ...slideChrome('up'),
          }}
        >
          {/* HUD-3 = P1 (R-234): three DETACHED tabs — time · what's next · resources. The menu left this
           *  row (icon in the bottom-right cluster, Esc opens it); the sky between the tabs stays map. */}
          <div style={{ justifySelf: 'start', alignSelf: 'stretch', minWidth: 0, pointerEvents: 'auto', display: 'flex', alignItems: 'stretch', gap: 10 }}>
            <HudPlaque shape="hang" as="section" style={{ padding: mobileFit ? '8px 12px' : '10px 20px 10px', display: 'flex', alignItems: 'center' }}>
              {whenWhereSlot}
            </HudPlaque>
            {/* PLAN-083: secondary top-row tabs move off the strip on mobile-fit —
             *  objective/next are reachable through the village/quest surfaces;
             *  only the when-where plaque and the compact resources stay. */}
            {objectiveSlot != null && !mobileFit && <div style={{ alignSelf: 'flex-start' }}>{objectiveSlot}</div>}
          </div>
          {!mobileFit && (
            <div style={{ justifySelf: 'center', minWidth: 0, maxWidth: '100%', pointerEvents: 'none', display: 'flex', alignItems: 'flex-start' }}>{nextSlot}</div>
          )}
          <HudPlaque
            shape="hang"
            as="section"
            style={{ justifySelf: 'end', maxWidth: '100%', display: 'flex', alignItems: 'center', padding: mobileFit ? '8px 12px' : '10px 22px 10px', pointerEvents: 'auto', alignSelf: 'stretch' }}
          >
            <div style={{ minWidth: 0, overflow: 'hidden' }}>{resourcesSlot}</div>
          </HudPlaque>
        </div>
      )}

      {/* ── Legacy ribbons (`?hud=legacy`) ── */}
      {!lacquer && (
        <>
          <HudRibbon
            bevel={bevel}
            anchor="top"
            ornament
            style={{ position: 'absolute', top: 0, left: '50%', zIndex: z.chrome, ...chromeZoom, ...slideChrome('up', 'translateX(-50%)') }}
          >
            {whenWhereSlot}
          </HudRibbon>
          <HudRibbon
            bevel={bevel}
            anchor="top"
            cutPx={22}
            style={{ position: 'absolute', top: 0, right: 0, zIndex: z.chrome, padding: '8px 22px 12px 40px', maxWidth: 'calc(50% - 130px)', ...chromeZoom, ...slideChrome('up') }}
          >
            {/* The clip lives on an inner box: overflow on the ribbon root would cut its shadow. */}
            <div style={{ minWidth: 0, overflow: 'hidden' }}>{resourcesSlot}</div>
          </HudRibbon>
        </>
      )}

      {/* ── Right edge: what is coming, hung from the top ribbon ── */}
      {hangingSlot != null && (
        stageMode ? (
          /* WS-2: the stage layer — the frame inside the slot positions itself
           *  from the rightWing rect; `pointerEvents` is re-armed per frame. */
          <div style={{ position: 'absolute', inset: 0, zIndex: z.panels, pointerEvents: 'none', ...chromeZoom }}>{hangingSlot}</div>
        ) : (
          <div style={{ position: 'absolute', top: config.insets.hangingTopPx, right: inset + 8, zIndex: z.panels, ...chromeZoom, ...slideChrome('up') }}>{hangingSlot}</div>
        )
      )}



      {rosterSlot != null && (
        stageMode ? (
          /* WS-2: the stage owns the roster rect (leftWing) — the anchor's
           *  fixed corner placement and held-height trick are superseded. */
          <div style={{ position: 'absolute', inset: 0, zIndex: z.panels, pointerEvents: 'none', ...chromeZoom }}>{rosterSlot}</div>
        ) : (
          <RosterAnchor
            style={{
              position: 'absolute',
              left: config.roster.leftPx,
              bottom: config.roster.bottomPx,
              width: config.roster.widthPx,
              zIndex: z.panels,
              ...chromeZoom,
              transformOrigin: 'bottom left',
              // No transform unless one is configured: any transform here becomes the
              // containing block for the roster's position:fixed drag overlay, which then
              // lands off-target (the portrait medallion never shows under the cursor).
              // No shadow either: the roster moves inside this box, its own shadow moves
              // with it, and a shadow here would stay behind as a ghost.
              // (`slideChrome` returns `transform: 'none'` at rest, which is exempt.)
              ...slideChrome('down', rosterBaseTransform),
            }}
          >
            {rosterSlot}
          </RosterAnchor>
        )
      )}

      {dressingSlot != null && (
        <div style={{ position: 'absolute', inset: 0, zIndex: z.dressing, pointerEvents: 'none', ...chromeZoom }}>{dressingSlot}</div>
      )}

      {/* ── Bottom-centre: where I can go ───────────────────────── */}
      {lacquer ? (
        <HudPlaque
          shape="plinth"
          as="div"
          style={{ position: 'absolute', bottom: 0, left: '50%', zIndex: z.chrome, padding: '20px 40px 8px', paddingBottom: 'calc(8px + env(safe-area-inset-bottom, 0px))', ...chromeZoom, ...slideChrome('down', 'translateX(-50%)') }}
        >
          {navContent}
        </HudPlaque>
      ) : (
        <HudRibbon
          bevel={bevel}
          anchor="bottom"
          cutPx={26}
          ornament
          style={{
            position: 'absolute',
            bottom: 0,
            left: '50%',
            zIndex: z.chrome,
            gap: 2,
            padding: '10px 30px 8px',
            ...chromeZoom,
            ...slideChrome('down', 'translateX(-50%)'),
          }}
        >
          {navContent}
        </HudRibbon>
      )}

      {/* ── Bottom-right: utility controls, and the pearl that stays when the rest is hidden ── */}
      {/* Last in the DOM on purpose: Tab reaches the corner utilities after the top bar and the nav (R-234, T-A14). */}
      <div data-hud-corner="" style={{ position: 'absolute', bottom: `calc(${inset + 8}px + env(safe-area-inset-bottom, 0px))`, right: `calc(${inset + 8}px + env(safe-area-inset-right, 0px))`, zIndex: z.chrome, display: 'flex', alignItems: 'flex-end', gap: 8, ...chromeZoom }}>
        {menuSlot != null && <div style={slideChrome('down')}>{menuSlot}</div>}
        {utilitySlot != null && <div style={slideChrome('down')}>{utilitySlot}</div>}
        <HudHideToggle hidden={hudHidden} onToggle={toggleHud} />
      </div>
    </SkinScope>
  );
};

export default GameFrame;
