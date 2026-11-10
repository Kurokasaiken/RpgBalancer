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

/* The signed Zanara reskin — the real component's own CSS variables re-mapped onto the
 *  signed palette. Scoped to this mount: the FROZEN files stay untouched, the override
 *  wins by specificity on `.destiny-astrolabe` inside our host only. (Director ruling:
 *  «adapt the real component to the new colours + opulence».) */
const ZANARA_SKIN_CSS = `
[data-hudreal-astrolabe] .destiny-astrolabe{
  --obsidian:#07121a;
  --slate:#0d1f1d;
  --teal-sh:rgba(31,184,119,.35);
  --emerald:#1fb877;
  --gold:#c9a94e;
  --gold-bright:#f0d68a;
  --gold-soft:#d9b96a;
  --bronze:#8a6f35;
  --bronze-d:#5e4a20;
  --ivory:#f3e7c4;
  --azure:#2fd4a3;
  --panel-bg:#0a1a22;
  --panel-line:rgba(201,169,78,.3);
  color:#f3e7c4;
}
[data-hudreal-astrolabe] .destiny-astrolabe .arena{
  box-shadow:0 0 0 1px rgba(201,169,78,.35), 0 0 34px rgba(31,184,119,.18), inset 0 0 26px rgba(0,0,0,.5);
}
[data-hudreal-astrolabe] .destiny-astrolabe .card{
  border-color:rgba(201,169,78,.45);
  box-shadow:inset 0 0 0 1px #5e4a20, 0 6px 22px rgba(0,0,0,.55);
}
`;

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
      <div data-testid="hudreal-astrolabe" data-hudreal-astrolabe="" style={{ flex: 1, minHeight: 0, width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 14 }}>
        <style>{ZANARA_SKIN_CSS}</style>
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
