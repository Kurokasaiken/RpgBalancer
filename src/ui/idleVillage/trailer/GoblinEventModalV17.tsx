/**
 * @trailer-only
 *
 * GoblinEventModalV17 — painter-workflow production component.
 *
 * Phase 6 skeleton (version === 1):
 *   - correct dimensions, hierarchy, regions, typography, i18n
 *   - hero asset, no effects, no glass, no polish, no decorative details
 *   - reference overlay at opacity 0.4
 *
 * Phase 7 finish (version >= 7):
 *   - carved SVG frame with wood noise and gold accents
 *   - parchment banner with torn clip-path and gold rim
 *   - glass panel with bevel and inner glow
 *   - crimson notched primary button
 *   - arrival medallion with gold ring
 *   - dust motes / solar particles
 *
 * Constraints:
 *   - No whole-asset backgrounds (frame, banner, panel, buttons).
 *   - No baked text in raster assets.
 *   - All UI text is React/i18n.
 *   - Only the central arrival countdown is shown.
 */

import React, { useId } from 'react';
import { useTranslation } from 'react-i18next';
import { goblinEventModalTokens } from '@/balancing/config/idleVillage/goblinEventModalTokens';

export interface GoblinEventModalV17Props {
  isOpen?: boolean;
  onPrepare?: () => void;
  daysLeft?: number;
  version?: number;
}

const ASSET = {
  reference: '/mockups/external/goblin-event-lab/reference.png',
  hero: '/mockups/goblin-invasion-painted/goblin-invasion-hero.png',
};

const { palette, typography, layout, effects } = goblinEventModalTokens;

/**
 * Renders the goblin invasion world-event modal.
 */
export const GoblinEventModalV17: React.FC<GoblinEventModalV17Props> = ({
  isOpen = true,
  onPrepare,
  daysLeft = 2,
  version = 7,
}) => {
  const { t } = useTranslation('idleVillage');
  const uid = useId().replace(/:/g, '');
  const isSkeleton = version === 1;

  if (!isOpen) return null;

  const title = String(t('world.goblinInvasion.title'));
  const eventLabel = String(t('world.goblinInvasion.warTable.eventLabel'));
  const description = String(t('world.goblinInvasion.warTable.description'));
  const willBeAttacked = String(t('world.goblinInvasion.warTable.willBeAttacked'));
  const arrival = String(t('world.goblinInvasion.warTable.arrivalIn'));
  const arrivalUnit = String(t('world.goblinInvasion.warTable.days'));
  const arrivalRemaining = String(t('world.goblinInvasion.warTable.remaining'));
  const action = String(t('world.goblinInvasion.action'));

  return (
    <div
      className="relative aspect-[3/4] h-full w-full overflow-hidden rounded-sm"
      style={{
        background: `${effects.solarGradient}, linear-gradient(to bottom, ${palette.skyTop}, ${palette.skyMid} 45%, ${palette.skyBottom})`,
        boxShadow: isSkeleton ? 'none' : effects.frameShadow,
      }}
    >
      {/* Phase 6: reference overlay for skeleton */}
      {isSkeleton && (
        <img
          src={ASSET.reference}
          alt=""
          className="pointer-events-none absolute inset-0 z-50 h-full w-full object-cover opacity-40"
        />
      )}

      {/* L0 — hero */}
      <img
        src={ASSET.hero}
        alt=""
        className="absolute z-0 h-auto"
        style={{
          top: layout.heroTop,
          left: layout.heroLeft,
          width: layout.heroWidth,
          aspectRatio: '846 / 520',
        }}
      />

      {/* L1 — banner + title */}
      <GoblinEventBanner
        title={title}
        eventLabel={eventLabel}
        isSkeleton={isSkeleton}
        uid={uid}
      />

      {/* L2 — panel + body + warning + arrival */}
      <GoblinEventPanel
        eventLabel={eventLabel}
        description={description}
        willBeAttacked={willBeAttacked}
        daysLeft={daysLeft}
        arrival={arrival}
        arrivalUnit={arrivalUnit}
        arrivalRemaining={arrivalRemaining}
        isSkeleton={isSkeleton}
        uid={uid}
      />

      {/* L3 — primary action */}
      <GoblinEventButton action={action} onPrepare={onPrepare} isSkeleton={isSkeleton} />

      {/* L4 — carved outer frame (Phase 7 only) */}
      {!isSkeleton && <GoblinEventFrame uid={uid} />}

      {/* L5 — dust motes (Phase 7 only) */}
      {!isSkeleton && (
        <div className="pointer-events-none absolute inset-0 z-30 h-full w-full overflow-hidden">
          {DUST_MOTES.map((mote, i) => (
            <div
              key={i}
              className="absolute rounded-full"
              style={{
                top: mote.top,
                left: mote.left,
                width: mote.size,
                height: mote.size,
                background: palette.gold,
                opacity: mote.opacity,
              }}
            />
          ))}
        </div>
      )}

      {/* Hidden SVG defs shared by the decorative layers */}
      <svg aria-hidden="true" className="absolute left-0 top-0 h-0 w-0" width="0" height="0">
        <defs>
          <linearGradient id={`g-${uid}-wood`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={palette.woodLight} />
            <stop offset="35%" stopColor={palette.woodMid} />
            <stop offset="100%" stopColor={palette.woodDark} />
          </linearGradient>
          <radialGradient id={`g-${uid}-gold`} cx="30%" cy="30%" r="70%">
            <stop offset="0%" stopColor={palette.gold} />
            <stop offset="60%" stopColor={palette.amber} />
            <stop offset="100%" stopColor={palette.woodDark} />
          </radialGradient>
          <linearGradient id={`g-${uid}-crimson`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={palette.crimsonLight} />
            <stop offset="40%" stopColor={palette.crimson} />
            <stop offset="100%" stopColor={palette.woodDark} />
          </linearGradient>
          <filter id={`f-${uid}-wood`} x="-10%" y="-10%" width="120%" height="120%">
            <feTurbulence type="fractalNoise" baseFrequency="0.45" numOctaves="4" seed="3" result="noise" />
            <feColorMatrix in="noise" type="matrix" values="0 0 0 0 0.05 0 0 0 0 0.03 0 0 0 0 0.02 0 0 0 0.18 0" result="coloredNoise" />
            <feBlend in="SourceGraphic" in2="coloredNoise" mode="overlay" />
          </filter>
          <filter id={`f-${uid}-glow`} x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>
      </svg>
    </div>
  );
};

const DUST_MOTES = [
  { top: '12%', left: '15%', size: '2px', opacity: 0.7 },
  { top: '8%', left: '70%', size: '3px', opacity: 0.5 },
  { top: '22%', left: '85%', size: '2px', opacity: 0.6 },
  { top: '30%', left: '10%', size: '2px', opacity: 0.4 },
  { top: '45%', left: '92%', size: '3px', opacity: 0.5 },
  { top: '6%', left: '40%', size: '2px', opacity: 0.6 },
  { top: '38%', left: '25%', size: '2px', opacity: 0.4 },
];

interface BannerProps {
  title: string;
  isSkeleton: boolean;
  uid: string;
}

/**
 * Top parchment banner with the title.
 */
const GoblinEventBanner: React.FC<BannerProps> = ({ title, isSkeleton, uid }) => (
  <>
    <div
      className="absolute left-1/2 -translate-x-1/2"
      style={{
        top: layout.bannerTop,
        left: layout.bannerLeft,
        width: layout.bannerWidth,
        height: layout.bannerHeight,
        background: isSkeleton
          ? palette.woodMid
          : `linear-gradient(to bottom, ${palette.woodLight}, ${palette.woodMid} 40%, ${palette.woodDark})`,
        clipPath: isSkeleton ? 'none' : effects.bannerClip,
        border: isSkeleton ? 'none' : `2px solid ${palette.gold}`,
        boxShadow: isSkeleton ? 'none' : effects.panelShadow,
        zIndex: 10,
      }}
    />
    {!isSkeleton && (
      <div
        className="pointer-events-none absolute left-1/2 -translate-x-1/2"
        style={{
          top: layout.bannerTop,
          left: layout.bannerLeft,
          width: layout.bannerWidth,
          height: layout.bannerHeight,
          clipPath: effects.bannerClip,
          background: `linear-gradient(to bottom, transparent, ${palette.shadow})`,
          opacity: 0.25,
          zIndex: 11,
        }}
      />
    )}
    <h2
      className="absolute z-20 w-full text-center font-black uppercase"
      style={{
        top: layout.titleTop,
        fontSize: typography.titleSize,
        fontWeight: typography.titleWeight,
        letterSpacing: typography.titleTracking,
        color: isSkeleton ? palette.woodDark : palette.parchment,
        textShadow: isSkeleton ? 'none' : `0 2px 4px ${palette.shadow}`,
      }}
    >
      {title}
    </h2>
    {!isSkeleton && (
      <svg
        className="pointer-events-none absolute z-10"
        style={{
          top: layout.bannerTop,
          left: layout.bannerLeft,
          width: layout.bannerWidth,
          height: layout.bannerHeight,
        }}
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <path
          d="M2,10 L50,18 L98,10 L96,5 L4,5 Z"
          fill={`url(#g-${uid}-gold)`}
          opacity="0.35"
        />
      </svg>
    )}
  </>
);

interface PanelProps {
  eventLabel: string;
  description: string;
  willBeAttacked: string;
  daysLeft: number;
  arrival: string;
  arrivalUnit: string;
  arrivalRemaining: string;
  isSkeleton: boolean;
  uid: string;
}

/**
 * Lower panel with body, warning and arrival medallion.
 */
const GoblinEventPanel: React.FC<PanelProps> = ({
  eventLabel,
  description,
  willBeAttacked,
  daysLeft,
  arrival,
  arrivalUnit,
  arrivalRemaining,
  isSkeleton,
  uid,
}) => (
  <>
    <div
      className="absolute left-1/2 -translate-x-1/2"
      style={{
        top: layout.panelTop,
        width: layout.panelWidth,
        height: layout.panelHeight,
        background: isSkeleton
          ? palette.panel
          : `linear-gradient(to bottom, ${palette.panel}, ${palette.panelGlass})`,
        border: isSkeleton ? '1px solid transparent' : `1px solid ${palette.gold}`,
        boxShadow: isSkeleton ? 'none' : effects.panelShadow,
        zIndex: 20,
      }}
    />
    {!isSkeleton && (
      <div
        className="pointer-events-none absolute left-1/2 -translate-x-1/2"
        style={{
          top: layout.panelTop,
          width: layout.panelWidth,
          height: layout.panelHeight,
          background: `linear-gradient(135deg, ${palette.solar}, transparent 50%)`,
          zIndex: 21,
        }}
      />
    )}
    <div
      className="absolute left-1/2 w-[90%] -translate-x-1/2 text-center font-extrabold uppercase"
      style={{
        top: layout.panelHeaderTop,
        fontSize: typography.badgeSize,
        fontWeight: typography.badgeWeight,
        letterSpacing: typography.badgeTracking,
        color: palette.parchmentDim,
        zIndex: 25,
      }}
    >
      {eventLabel}
    </div>

    <p
      className="absolute left-1/2 w-[90%] -translate-x-1/2 text-center font-semibold uppercase"
      style={{
        top: layout.bodyTop,
        fontSize: typography.bodySize,
        color: palette.parchment,
        zIndex: 25,
      }}
    >
      {description}
    </p>

    <p
      className="absolute left-1/2 w-[90%] -translate-x-1/2 text-center font-extrabold uppercase"
      style={{
        top: layout.warningTop,
        fontSize: typography.warningSize,
        color: palette.crimsonLight,
        zIndex: 25,
      }}
    >
      {willBeAttacked}
    </p>

    <GoblinEventArrival
      arrival={arrival}
      daysLeft={daysLeft}
      arrivalUnit={arrivalUnit}
      arrivalRemaining={arrivalRemaining}
      isSkeleton={isSkeleton}
      uid={uid}
    />
  </>
);

interface ArrivalProps {
  arrival: string;
  daysLeft: number;
  arrivalUnit: string;
  arrivalRemaining: string;
  isSkeleton: boolean;
  uid: string;
}

/**
 * Central arrival countdown medallion.
 */
const GoblinEventArrival: React.FC<ArrivalProps> = ({
  arrival,
  daysLeft,
  arrivalUnit,
  arrivalRemaining,
  isSkeleton,
  uid,
}) => (
  <div
    className="absolute left-1/2 z-10 flex -translate-x-1/2 flex-col items-center"
    style={{ top: layout.arrivalLabelTop, zIndex: 30 }}
  >
    {!isSkeleton && (
      <svg
        className="pointer-events-none absolute z-[-1] h-auto w-auto"
        style={{
          top: '-35%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '4rem',
          height: '4rem',
        }}
        viewBox="0 0 100 100"
        aria-hidden="true"
      >
        <circle cx="50" cy="50" r="45" fill={palette.panel} stroke={`url(#g-${uid}-gold)`} strokeWidth="4" />
        <path d="M5,50 L20,45 L20,55 Z" fill={palette.gold} />
        <path d="M95,50 L80,45 L80,55 Z" fill={palette.gold} />
      </svg>
    )}
    <span
      className="font-extrabold uppercase"
      style={{
        fontSize: typography.labelSize,
        fontWeight: typography.labelWeight,
        color: palette.parchment,
      }}
    >
      {arrival}
    </span>
    <span
      className="font-black"
      style={{
        fontSize: typography.arrivalCountSize,
        fontWeight: typography.valueWeight,
        color: isSkeleton ? palette.parchment : palette.amber,
      }}
    >
      {daysLeft}
    </span>
    <span
      className="font-extrabold uppercase"
      style={{
        fontSize: typography.arrivalUnitSize,
        fontWeight: typography.labelWeight,
        color: palette.parchment,
      }}
    >
      {arrivalUnit} {arrivalRemaining}
    </span>
  </div>
);

interface ButtonProps {
  action: string;
  onPrepare?: () => void;
  isSkeleton: boolean;
}

/**
 * Primary notched CTA button.
 */
const GoblinEventButton: React.FC<ButtonProps> = ({ action, onPrepare, isSkeleton }) => (
  <button
    type="button"
    onClick={onPrepare}
    className="absolute left-1/2 z-30 -translate-x-1/2 whitespace-nowrap font-extrabold uppercase transition hover:brightness-110 active:brightness-90"
    style={{
      top: layout.primaryButtonTop,
      width: layout.primaryButtonWidth,
      height: layout.primaryButtonHeight,
      fontSize: typography.buttonSize,
      fontWeight: typography.buttonWeight,
      color: palette.parchment,
      background: isSkeleton ? palette.crimson : effects.buttonPrimaryGradient,
      clipPath: isSkeleton ? 'none' : effects.buttonNotchedClip,
      border: isSkeleton ? 'none' : `2px solid ${palette.gold}`,
      cursor: 'pointer',
      textShadow: isSkeleton ? 'none' : `0 1px 2px ${palette.shadow}`,
    }}
  >
    {action}
  </button>
);

interface FrameProps {
  uid: string;
}

/**
 * Carved timber outer frame with gold crest and corner ornaments.
 */
const GoblinEventFrame: React.FC<FrameProps> = ({ uid }) => {
  const frameInset = Number.parseFloat(layout.heroLeft);
  const inner = 100 - 2 * frameInset;
  const ornament = frameInset + 3;
  const crestTop = Number.parseFloat(layout.bannerTop);

  return (
    <svg
      className="pointer-events-none absolute inset-0 z-40 h-full w-full"
      preserveAspectRatio="none"
      viewBox="0 0 100 100"
      aria-hidden="true"
    >
      <path
        d={`M0,0 h100 v100 h-100 z M${frameInset},${frameInset} v${inner} h${inner} v-${inner} z`}
        fill={`url(#g-${uid}-wood)`}
        filter={`url(#f-${uid}-wood)`}
        stroke={`url(#g-${uid}-gold)`}
        strokeWidth="0.5"
      />
      <path d={`M${frameInset},${frameInset} L${ornament},${frameInset} L${frameInset},${ornament} Z`} fill={palette.gold} opacity="0.9" />
      <path d={`M${100 - frameInset},${frameInset} L${100 - ornament},${frameInset} L${100 - frameInset},${ornament} Z`} fill={palette.gold} opacity="0.9" />
      <path d={`M${frameInset},${100 - frameInset} L${ornament},${100 - frameInset} L${frameInset},${100 - ornament} Z`} fill={palette.gold} opacity="0.9" />
      <path d={`M${100 - frameInset},${100 - frameInset} L${100 - ornament},${100 - frameInset} L${100 - frameInset},${100 - ornament} Z`} fill={palette.gold} opacity="0.9" />
      <circle cx="50" cy={crestTop} r="3" fill={`url(#g-${uid}-gold)`} filter={`url(#f-${uid}-glow)`} />
      <rect
        x={frameInset}
        y={frameInset}
        width={inner}
        height={inner}
        fill="none"
        stroke={palette.gold}
        strokeWidth="0.25"
        opacity="0.6"
      />
      <path
        d={`M${frameInset},${frameInset} L${frameInset},${ornament} M${100 - frameInset},${frameInset} L${100 - frameInset},${ornament}`}
        stroke={palette.gold}
        strokeWidth="0.4"
        opacity="0.5"
      />
    </svg>
  );
};

export default GoblinEventModalV17;
