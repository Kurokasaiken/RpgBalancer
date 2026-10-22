/**
 * QuestPartyRosterPanel — the running quest's party, as a companion plaque of
 * the `QuestRunWindow` shell (R-196 / PLAN-035). Mounts at the window's LEFT
 * inside `[data-hud-companion="left"]`; lists ONLY the members currently in
 * `run.party` — each with the canonical roster card (`PgCard`, horizontal
 * variant): portrait, name, status and the QUEST hit points (m.hp/m.maxHp).
 *
 * While armed action items would heal a member on the next commit, the card
 * shows a `+N HP` preview chip — the same numbers `previewArmedActionItems`
 * computes, never a guess. `Escape` or the header X closes the panel and the
 * caller returns focus to the header toggle.
 */

import React from 'react';
import { useTranslation } from 'react-i18next';
import { EngravedIcon } from './engravedIcons';
import { HudPlaque } from '@/ui/idleVillage/skins/primitives';
import { TONE } from '@/ui/idleVillage/questS1Lab/hud/atoms';
import PgCard from '@/ui/idleVillage/components/PgCard';
import { RosterKitShell, useRosterKitData } from '@/ui/idleVillage/frozen/kits/rosterKit';
import { formatResidentLabel } from '@/ui/idleVillage/residentName';
import { getResidentPortraitUrl } from '@/engine/game/idleVillage/residentVisualResolver';
import type { QuestRunState } from '@/ui/idleVillage/questS1Lab/questRun';

export interface QuestPartyRosterPanelProps {
  /** `id` the header toggle points at with `aria-controls`. */
  panelId: string;
  run: QuestRunState;
  /** memberId → the heal the armed action items would apply on the next
   *  commit (`previewArmedActionItems` output — the committed values, not an
   *  estimate). Omitted/empty = no heal preview. */
  healDeltas?: Record<string, { hpDelta: number; clearedWound: boolean }>;
  onClose: () => void;
}

export const QuestPartyRosterPanel: React.FC<QuestPartyRosterPanelProps> = ({ panelId, run, healDeltas, onClose }) => {
  const { t } = useTranslation('idleVillage');
  const { residentsById } = useRosterKitData();
  const alive = run.party.filter((m) => !m.dead).length;
  return (
    <HudPlaque
      shape="panel"
      as="aside"
      id={panelId}
      data-testid="quest-party-roster"
      aria-label={t('gameFrame.questWindow.roster')}
      onKeyDown={(e) => {
        if (e.key === 'Escape') {
          e.stopPropagation();
          onClose();
        }
      }}
      style={{ display: 'flex', flexDirection: 'column', gap: 6, padding: '10px 12px 12px', minHeight: 0, flexShrink: 1, overflow: 'hidden' }}
    >
      {/* Header per the component guide: title + count left, X on the right. */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <EngravedIcon id="nav-company" size={14} style={{ color: 'var(--skin-title-color)' }} />
        <span title={t('gameFrame.questWindow.roster')} style={{ flex: 1, minWidth: 0, fontFamily: 'var(--skin-font-display)', fontSize: 12, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--skin-title-color)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {t('gameFrame.questWindow.roster')}
        </span>
        <span style={{ fontFamily: 'var(--skin-font-display)', fontSize: 12, fontVariantNumeric: 'tabular-nums', color: TONE.secondary }} title={t('gameFrame.questWindow.partyStatus', { alive, total: run.party.length })} aria-label={t('gameFrame.questWindow.partyStatus', { alive, total: run.party.length })}>
          {alive}/{run.party.length}
        </span>
        <span data-hud-controls="" style={{ display: 'inline-flex' }}>
          <button type="button" aria-label={t('gameFrame.panels.close')} title={t('gameFrame.panels.close')} onClick={onClose}>
            <EngravedIcon id="cmd-close" />
          </button>
        </span>
      </div>
      <div className="quest-s1-scroll" style={{ display: 'flex', flexDirection: 'column', gap: 5, minHeight: 0, overflowY: 'auto', flex: '1 1 auto' }}>
        {/* The certified `PgCard` needs the canonical provider chain (Drag,
         *  Skin, Timing, Dnd) — `RosterKitShell` mounts only what the /game
         *  tree does not already supply; the panel itself stays read-only. */}
        <RosterKitShell>
        {run.party.map((m) => {
          const resident = residentsById[m.id];
          const statusKey = m.dead ? 'dead' : m.wounded || resident?.isInjured ? 'injured' : 'away';
          const heal = healDeltas?.[m.id];
          return (
            <div key={m.id} style={{ position: 'relative' }}>
              <PgCard
                workerId={m.id}
                label={resident ? formatResidentLabel(resident) : m.name}
                hp={Math.max(0, m.hp)}
                maxHp={m.maxHp}
                fatigue={resident?.fatigue ?? 0}
                portraitUrl={getResidentPortraitUrl(resident)}
                statusLabel={t(`roster.status.${statusKey}`)}
                disabled={m.dead}
                /* R-241 B5 (INV:R-241-roster-status-only): a member already
                   committed to the run has no «slot compatibility» to judge —
                   `idle` keeps the card status-only, otherwise `undefined`
                   would paint «Nessuno slot compatibile» on every row. */
                compatibilityState="idle"
                frameType="bronze"
                horizontal
              />
              {heal && heal.hpDelta > 0 && (
                <span
                  data-testid={`quest-heal-preview-${m.id}`}
                  style={{
                    position: 'absolute',
                    top: 4,
                    right: 6,
                    fontFamily: 'var(--skin-font-display)',
                    fontSize: 12,
                    fontVariantNumeric: 'tabular-nums',
                    color: TONE.ok,
                    textShadow: '0 0 6px color-mix(in srgb, var(--skin-status-ok, currentColor) 60%, transparent)',
                  }}
                >
                  +{heal.hpDelta} HP
                </span>
              )}
            </div>
          );
        })}
        </RosterKitShell>
      </div>
    </HudPlaque>
  );
};

export default QuestPartyRosterPanel;
