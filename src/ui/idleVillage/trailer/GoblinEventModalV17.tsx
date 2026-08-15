/**
 * @trailer-only
 *
 * GoblinEventModalV17 — reconstruction from split-asset mockup.
 *
 * Each visual element is a separate asset or React text.
 * No whole-mockup background. Buttons are real <button> elements.
 */

import React from 'react';
import { useTranslation } from 'react-i18next';
import { goblinEventModalTokens } from '@/balancing/config/idleVillage/goblinEventModalTokens';

export interface GoblinEventModalV17Props {
  isOpen?: boolean;
  onPrepare?: () => void;
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
  iconArrival: '/mockups/goblin-invasion-painted/goblin-invasion-icon-arrival.png',
  iconTarget: '/mockups/goblin-invasion-painted/goblin-invasion-icon-target.png',
};

const { palette, typography } = goblinEventModalTokens;

export const GoblinEventModalV17: React.FC<GoblinEventModalV17Props> = ({
  isOpen = true,
  onPrepare,
  version = 6,
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
  const arrival = String(t('world.goblinInvasion.warTable.arrival'));
  const arrivalCount = String(t('world.goblinInvasion.warTable.arrivalCount'));
  const arrivalUnit = String(t('world.goblinInvasion.warTable.arrivalUnit'));
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
        className="absolute left-[11%] top-[12.4%] z-0 w-[77.9%]"
        style={{ aspectRatio: '846 / 640' }}
      />

      {/* L1 — banner background */}
      <img
        src={ASSET.banner}
        alt=""
        className="absolute top-[8.3%] z-10 h-[9.7%] w-[77.9%] object-fill"
        style={{ left: '11%' }}
      />

      {/* L2 — badge + title text */}
      <div
        className="absolute z-50 w-full text-center font-extrabold uppercase"
        style={{
          top: '9.7%',
          fontSize: typography.badgeSize,
          fontWeight: typography.badgeWeight,
          letterSpacing: typography.badgeTracking,
          color: palette.parchmentDim,
        }}
      >
        {eventLabel}
      </div>

      <h2
        className="absolute z-50 w-full text-center font-black uppercase"
        style={{
          top: '14.5%',
          fontSize: '1.65rem',
          fontWeight: '900',
          letterSpacing: '0.16em',
          color: palette.woodDark,
        }}
      >
        {title}
      </h2>

      {/* L3 — lower panel background */}
      <div
        className="absolute left-1/2 z-10 -translate-x-1/2"
        style={{ top: '53.9%', width: '72.3%', aspectRatio: '786 / 220' }}
      >
        <img
          src={ASSET.panel}
          alt=""
          className="h-full w-full object-fill"
        />
      </div>

      {/* L4 — panel text + stats */}
      <div
        className="absolute left-1/2 z-50 flex w-[72.3%] -translate-x-1/2 flex-col items-center justify-center"
        style={{ top: '55.5%' }}
      >
        <p
          className="text-center font-semibold uppercase"
          style={{
            fontSize: '0.48rem',
            color: palette.parchment,
          }}
        >
          {description}
        </p>
        <p
          className="mt-0.5 text-center font-extrabold uppercase"
          style={{
            fontSize: '0.58rem',
            color: palette.crimsonLight,
          }}
        >
          {willBeAttacked}
        </p>
      </div>

      <div
        className="absolute left-1/2 z-50 grid w-[72.3%] -translate-x-1/2 grid-cols-3 gap-1 text-center"
        style={{ top: '63.5%' }}
      >
        <StatBlock
          icon={ASSET.iconEnemy}
          label={enemy}
          value={`${enemyCount} ${enemyUnit}`}
        />
        <StatBlock
          icon={ASSET.iconArrival}
          label={arrival}
          value={`${arrivalCount} ${arrivalUnit}`}
        />
        <StatBlock
          icon={ASSET.iconTarget}
          label={target}
          value={targetName}
        />
      </div>

      {/* L5 — real buttons */}
      <button
        type="button"
        onClick={onPrepare}
        className="absolute left-1/2 z-50 -translate-x-1/2 font-extrabold uppercase transition hover:brightness-110 active:brightness-90"
        style={{
          top: '74.6%',
          width: '48.4%',
          height: '5.9%',
          fontSize: '0.55rem',
          fontWeight: '900',
          letterSpacing: '0.12em',
          color: palette.parchment,
          backgroundImage: `url(${ASSET.buttonPrimary})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          clipPath: 'polygon(5% 0%, 95% 0%, 100% 50%, 95% 100%, 5% 100%, 0% 50%)',
          border: 'none',
          cursor: 'pointer',
        }}
      >
        {action}
      </button>

      <button
        type="button"
        className="absolute left-1/2 z-50 -translate-x-1/2 font-extrabold uppercase transition hover:brightness-110 active:brightness-90"
        style={{
          top: '81.5%',
          width: '44.8%',
          height: '4.1%',
          fontSize: '0.48rem',
          fontWeight: '900',
          letterSpacing: '0.1em',
          color: palette.parchment,
          backgroundImage: `url(${ASSET.buttonSecondary})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          clipPath: 'polygon(5% 0%, 95% 0%, 100% 50%, 95% 100%, 5% 100%, 0% 50%)',
          border: 'none',
          cursor: 'pointer',
        }}
      >
        {viewDefenses}
      </button>

      {/* L6 — frame on top */}
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
  value: string;
}

const StatBlock: React.FC<StatBlockProps> = ({ icon, label, value }) => (
  <div className="flex flex-col items-center justify-center">
    <img src={icon} alt="" className="mb-0.5 h-8 w-8 object-contain" />
    <span
      className="block font-extrabold uppercase tracking-wider"
      style={{
        fontSize: typography.labelSize,
        fontWeight: typography.labelWeight,
        color: palette.parchmentDim,
      }}
    >
      {label}
    </span>
    <span
      className="block font-black"
      style={{
        fontSize: typography.valueSize,
        fontWeight: typography.valueWeight,
        color: palette.amber,
      }}
    >
      {value}
    </span>
  </div>
);

export default GoblinEventModalV17;
