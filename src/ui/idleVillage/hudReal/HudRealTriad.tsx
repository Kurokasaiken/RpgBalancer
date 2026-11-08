/**
 * HudRealTriad — PLAN-113 family A, composition V2 "fascia unificata" (GC-1 ruling).
 * The unified company furniture: the REAL roster (`MatericRosterComponentV2`, the same
 * draggable roster /game mounts) and the REAL stash (`VILLAGE_STASH_CONFIG` items) as
 * modules of one arredo — never two co-expanded plaques. E-13 production parity.
 * The outer shell is a provisional kit-styled frame; a proper nine-slice tall
 * furniture frame is F3 build work (like pf-3 → panelFrameGeometry).
 */
import React from 'react';
import { useTranslation } from 'react-i18next';
import { SkinScope } from '@/ui/idleVillage/skins/primitives';
import { MatericRosterComponentV2 } from '@/ui/idleVillage/rosterV2';
import { VILLAGE_STASH_CONFIG } from '@/balancing/config/idleVillage/villageStashConfig';
import { villageStashViewModel } from '@/ui/idleVillage/components/gameFrame/villageStashViewModel';
import { StashItemTile } from '@/ui/idleVillage/components/gameFrame/stashItemFace';

const C = {
  field: '#e9e0cc', ink: '#2b2118', muted: '#6b5a3e',
  rail: '#a8894a', railDark: '#7c6234', shadow: '0 10px 44px rgba(0,0,0,.55)',
} as const;

export interface HudRealTriadProps {
  onRosterClose?: () => void;
}

export const HudRealTriad: React.FC<HudRealTriadProps> = ({ onRosterClose }) => {
  const { t } = useTranslation('idleVillage');
  return (
    <div
      data-hudreal-triad=""
      style={{
        position: 'absolute', inset: 0, borderRadius: 14,
        background: `linear-gradient(160deg, ${C.field} 0%, #ddd0b4 100%)`,
        border: `2px solid ${C.rail}`,
        boxShadow: `${C.shadow}, inset 0 0 0 1px ${C.railDark}, inset 0 0 42px rgba(90,70,40,.18)`,
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
        fontFamily: '"EB Garamond", serif',
      }}
    >
      {/* Module 1 — roster (the real draggable roster, inside the shared furniture) */}
      <div style={{ flex: '0 0 auto', height: '46%', overflow: 'hidden', borderBottom: `1px solid ${C.railDark}` }}>
        <SkinScope style={{ height: '100%' }}>
          <MatericRosterComponentV2 componentId="game-frame-roster" density="compact" onClose={onRosterClose} />
        </SkinScope>
      </div>
      {/* kit divider between modules */}
      <img src="/assets/ui/hud-real/kit/divider.png" alt="" draggable={false}
        style={{ width: '84%', height: 12, objectFit: 'cover', objectPosition: 'center', display: 'block', margin: '6px auto 2px', flex: '0 0 auto' }} />
      {/* Module 2 — stash (real VILLAGE_STASH_CONFIG items, kit-dressed rows) */}
      <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', padding: '4px 14px 12px' }}>
        <div style={{ fontSize: 13, letterSpacing: 1, textTransform: 'uppercase', color: C.muted, marginBottom: 6 }}>
          {t('gameFrame.stash.title', 'Magazzino')}
        </div>
        <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 5, overflowY: 'auto', overscrollBehavior: 'contain', minHeight: 0 }}>
          {villageStashViewModel(VILLAGE_STASH_CONFIG).rows.map((row) => (
            <li key={row.itemId} style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
              <span aria-hidden="true" style={{ display: 'inline-flex' }}>
                <StashItemTile icon={row.icon} qty={row.qty} size={26} iconSize={16} />
              </span>
              <span style={{ flex: 1, minWidth: 0, fontSize: 13, fontWeight: 600, color: C.ink, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {t(row.nameKey)}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default HudRealTriad;
