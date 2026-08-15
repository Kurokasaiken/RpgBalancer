/**
 * @trailer-only
 *
 * GoblinEventModalV17 — reconstruction from split-asset mockup.
 *
 * Each visual element is a separate asset or React/i18n text.
 * No whole-mockup background. Buttons are real <button> elements.
 */

import React from 'react';
import { useTranslation } from 'react-i18next';
import { goblinEventModalTokens } from '@/balancing/config/idleVillage/goblinEventModalTokens';

export interface GoblinEventModalV17Props {
  isOpen?: boolean;
  onPrepare?: () => void;
  daysLeft?: number;
  version?: number;
}

const ASSET = {
  reference: '/mockups/external/goblin-event-lab/goblin-invasion-mockup.png',
  hero: '/mockups/goblin-invasion-painted/goblin-invasion-hero.png',
  frame: '/mockups/goblin-invasion-painted/goblin-invasion-frame.png',
  banner: '/mockups/goblin-invasion-painted/goblin-invasion-banner.png',
  panel: '/mockups/goblin-invasion-painted/goblin-invasion-panel.png',
  buttonPrimary: '/mockups/goblin-invasion-painted/goblin-invasion-button-primary.png',
  buttonSecondary: '/mockups/goblin-invasion-painted/goblin-invasion-button-secondary.png',
  iconEnemy: '/mockups/goblin-invasion-painted/goblin-invasion-icon-enemy.png',
  iconTarget: '/mockups/goblin-invasion-painted/goblin-invasion-icon-target.png',
};

const { palette, typography, layout } = goblinEventModalTokens;

export const GoblinEventModalV17: React.FC<GoblinEventModalV17Props> = ({
  isOpen = true,
  onPrepare,
  daysLeft = 2,
  version = 7,
}) => {
  const { t } = useTranslation('idleVillage');

  if (!isOpen) return null;

  const eventLabel = String(t('world.goblinInvasion.warTable.eventLabel'));
  const title = String(t('world.goblinInvasion.title'));
  const description = String(t('world.goblinInvasion.warTable.description'));
  const willBeAttacked = String(t('world.goblinInvasion.warTable.willBeAttacked'));
  const enemy = String(t('world.goblinInvasion.warTable.enemy'));
  const enemyCount = String(t('world.goblinInvasion.warTable.enemyCount'));
  const enemyUnit = String(t('world.goblinInvasion.warTable.enemyUnit'));
  const arrival = String(t('world.goblinInvasion.warTable.arrivalIn'));
  const arrivalUnit = String(t('world.goblinInvasion.warTable.days'));
  const arrivalRemaining = String(t('world.goblinInvasion.warTable.remaining'));
  const target = String(t('world.goblinInvasion.warTable.targetObjective'));
  const targetName = String(t('world.goblinInvasion.warTable.targetName'));
  const action = String(t('world.goblinInvasion.action'));
  const viewDefenses = String(t('world.goblinInvasion.viewDefenses'));

  return (
    <div className="relative aspect-[3/4] h-full w-full overflow-hidden rounded-sm">
      {/* reference overlay for V17.1 only */}
      {version === 1 && (
        <img
          src={ASSET.reference}
          alt=""
          className="pointer-events-none absolute inset-0 z-50 h-full w-full object-cover opacity-40"
        />
      )}

      {/* L0 — hero: sky + totem */}
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

      {/* L1 — banner background */}
      <img
        src={ASSET.banner}
        alt=""
        className="absolute z-10 object-fill"
        style={{
          top: layout.bannerTop,
          left: layout.bannerLeft,
          width: layout.bannerWidth,
          height: layout.bannerHeight,
        }}
      />

      {/* L2 — title text */}
      <h2
        className="absolute z-50 w-full text-center font-black uppercase"
        style={{
          top: layout.titleTop,
          fontSize: typography.titleSize,
          fontWeight: typography.titleWeight,
          letterSpacing: typography.titleTracking,
          color: palette.woodDark,
        }}
      >
        {title}
      </h2>

      {/* L3 — lower panel background */}
      <div
        className="absolute left-1/2 z-10 -translate-x-1/2"
        style={{
          top: layout.panelTop,
          width: layout.panelWidth,
          height: layout.panelHeight,
        }}
      >
        <img
          src={ASSET.panel}
          alt=""
          className="h-full w-full object-fill"
        />
      </div>

      {/* L4 — panel header */}
      <div
        className="absolute left-1/2 z-50 w-[72.3%] -translate-x-1/2 text-center font-extrabold uppercase"
        style={{
          top: layout.panelHeaderTop,
          fontSize: typography.badgeSize,
          fontWeight: typography.badgeWeight,
          letterSpacing: typography.badgeTracking,
          color: palette.parchmentDim,
        }}
      >
        {eventLabel}
      </div>

      {/* L5 — body + warning text */}
      <div
        className="absolute left-1/2 z-50 flex w-[72.3%] -translate-x-1/2 flex-col items-center justify-center"
        style={{ top: layout.bodyTop }}
      >
        <p
          className="text-center font-semibold uppercase"
          style={{
            fontSize: typography.bodySize,
            color: palette.parchment,
          }}
        >
          {description}
        </p>
      </div>

      <div
        className="absolute left-1/2 z-50 w-[72.3%] -translate-x-1/2 text-center"
        style={{ top: layout.warningTop }}
      >
        <p
          className="font-extrabold uppercase"
          style={{
            fontSize: typography.warningSize,
            color: palette.crimsonLight,
          }}
        >
          {willBeAttacked}
        </p>
      </div>

      {/* L6 — stats row */}
      <div
        className="absolute left-1/2 z-50 grid w-[72.3%] -translate-x-1/2 grid-cols-3 gap-1 text-center"
        style={{ top: layout.statsTop }}
      >
        <StatBlock
          icon={ASSET.iconEnemy}
          label={enemy}
          value={
            <>
              {enemyCount}
              <br />
              {enemyUnit}
            </>
          }
        />
        <ArrivalStat
          label={arrival}
          count={daysLeft}
          unit={arrivalUnit}
          remaining={arrivalRemaining}
        />
        <StatBlock
          icon={ASSET.iconTarget}
          label={target}
          value={targetName}
        />
      </div>

      {/* L7 — real buttons */}
      <button
        type="button"
        onClick={onPrepare}
        className="absolute left-1/2 z-50 -translate-x-1/2 whitespace-nowrap font-extrabold uppercase transition hover:brightness-110 active:brightness-90"
        style={{
          top: layout.primaryButtonTop,
          width: layout.primaryButtonWidth,
          height: layout.primaryButtonHeight,
          fontSize: typography.buttonSize,
          fontWeight: typography.buttonWeight,
          color: palette.parchment,
          backgroundImage: `url(${ASSET.buttonPrimary})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          clipPath: goblinEventModalTokens.effects.buttonNotchedClip,
          border: 'none',
          cursor: 'pointer',
        }}
      >
        {action}
      </button>

      <button
        type="button"
        className="absolute left-1/2 z-50 -translate-x-1/2 whitespace-nowrap font-extrabold uppercase transition hover:brightness-110 active:brightness-90"
        style={{
          top: layout.secondaryButtonTop,
          width: layout.secondaryButtonWidth,
          height: layout.secondaryButtonHeight,
          fontSize: typography.buttonSize,
          fontWeight: typography.buttonWeight,
          color: palette.parchment,
          backgroundImage: `url(${ASSET.buttonSecondary})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          clipPath: goblinEventModalTokens.effects.buttonNotchedClip,
          border: 'none',
          cursor: 'pointer',
        }}
      >
        {viewDefenses}
      </button>

      {/* L8 — frame on top */}
      <img
        src={ASSET.frame}
        alt=""
        className="pointer-events-none absolute inset-0 z-40 h-full w-full object-cover"
      />
    </div>
  );
};

interface StatBlockProps {
  icon: string;
  label: string;
  value: React.ReactNode;
}

const StatBlock: React.FC<StatBlockProps> = ({ icon, label, value }) => (
  <div className="flex flex-col items-center justify-center">
    <div
      className="font-extrabold uppercase"
      style={{
        fontSize: typography.labelSize,
        fontWeight: typography.labelWeight,
        color: palette.parchment,
      }}
    >
      {label}
    </div>
    <img
      src={icon}
      alt=""
      className="my-0.5 object-contain"
      style={{ width: layout.iconSize, height: layout.iconSize }}
    />
    <div
      className="font-black"
      style={{
        fontSize: typography.valueSize,
        fontWeight: typography.valueWeight,
        color: palette.amber,
      }}
    >
      {value}
    </div>
  </div>
);

interface ArrivalStatProps {
  label: string;
  count: number;
  unit: string;
  remaining: string;
}

const ArrivalStat: React.FC<ArrivalStatProps> = ({ label, count, unit, remaining }) => (
  <div
    className="absolute left-1/2 z-50 flex -translate-x-1/2 flex-col items-center"
    style={{ top: layout.arrivalLabelTop }}
  >
    <span
      className="font-extrabold uppercase"
      style={{
        fontSize: typography.labelSize,
        fontWeight: typography.labelWeight,
        color: palette.parchment,
      }}
    >
      {label}
    </span>
    <span
      className="font-black"
      style={{
        fontSize: typography.arrivalCountSize,
        fontWeight: typography.valueWeight,
        color: palette.amber,
      }}
    >
      {count}
    </span>
    <span
      className="font-extrabold uppercase"
      style={{
        fontSize: typography.arrivalUnitSize,
        fontWeight: typography.labelWeight,
        color: palette.parchment,
      }}
    >
      {unit} {remaining}
    </span>
  </div>
);

export default GoblinEventModalV17;
