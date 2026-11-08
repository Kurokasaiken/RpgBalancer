/**
 * HudRealAstrolabe — PLAN-113/114 B2 port: the REAL frozen `DestinyAstrolabeV62Standalone`
 * mounted inside the signed Zanara furniture (carved gold frame + emerald points + title
 * cartouche), same props contract as the production `QuestSkillCheckColumn` mount
 * (autoStart / removeSounds / hideInternalCard / settledIdle, config mode+wound+dead).
 * NOTE: the astrolabe's internal palette is painted by its own FROZEN css — recolouring
 * the dial itself is a separate frozen-kit contract task; this host owns the furniture
 * around the real component, nothing inside it.
 */
import React, { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { DestinyAstrolabeV62Standalone, type DestinyAstrolabeV62Handle } from '@/ui/idleVillage/frozen/kits/destinyAstrolabeV62Kit';
import { Z, ZanaraPlaque, ZanaraButton } from './zanaraOrn';

/** The production baseline the real column uses for every check (QuestSkillCheckColumn). */
const ASTROLABE_DIFFICULTY_BASELINE = 50;

export interface HudRealAstrolabeProps {
  /** The check to roll — same shape production feeds (`{name, stat, difficulty}`). */
  skillName: string;
  stat: number;
  onResolve?: (result: unknown) => void;
}

export const HudRealAstrolabe: React.FC<HudRealAstrolabeProps> = ({ skillName, stat, onResolve }) => {
  const { t } = useTranslation('idleVillage');
  const astroRef = useRef<DestinyAstrolabeV62Handle | null>(null);
  /* Same remount contract as production (`key={beatId}`): a new key re-arms the throw. */
  const [beat, setBeat] = useState(0);
  /* Lab witness: the resolved verdict lands in a DOM readout so the port's
   *  functional test can assert the real engine outcome, not just the mount. */
  const [verdict, setVerdict] = useState<string | null>(null);
  return (
    <ZanaraPlaque
      title={skillName}
      style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}
    >
      <div data-testid="hudreal-astrolabe" style={{ flex: 1, minHeight: 0, width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 14 }}>
        <div style={{ aspectRatio: '1 / 1', width: '100%', maxWidth: 340 }}>
          <DestinyAstrolabeV62Standalone
            key={beat}
            ref={astroRef}
            skills={[{ name: skillName, stat, difficulty: ASTROLABE_DIFFICULTY_BASELINE }]}
            config={{ mode: 'random' }}
            onResolve={(r) => { setVerdict(JSON.stringify(r).slice(0, 160)); onResolve?.(r); }}
            autoStart
            removeSounds
            hideInternalCard
            settledIdle
          />
        </div>
      </div>
      <div style={{ display: 'flex', gap: 10, alignItems: 'center', padding: '4px 0 14px' }}>
        <ZanaraButton tone="emerald" onClick={() => { setVerdict(null); setBeat((b) => b + 1); }}>
          {t('gameFrame.questWindow.checkOverlay.throwLabel', 'Throw')}
        </ZanaraButton>
        {verdict && <span data-testid="hudreal-astrolabe-verdict" style={{ font: 'italic 11px "EB Garamond", serif', color: Z.muted, maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{verdict}</span>}
      </div>
    </ZanaraPlaque>
  );
};

export default HudRealAstrolabe;
