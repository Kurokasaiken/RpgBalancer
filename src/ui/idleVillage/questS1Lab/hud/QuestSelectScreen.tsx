/**
 * questS1Lab/hud/QuestSelectScreen — lab entry screen (PLAN-024):
 * painted map header (the world is the hero), quest cards as HudPlaque
 * panels, chips on skin tokens. The card uses role="button" — a <button>
 * inside SkinScope would inherit the struck-bronze plate + specular streak
 * meant for 26px controls.
 */

import React from 'react';
import { useTranslation } from 'react-i18next';
import { WanderlustAmbientField } from '@/ui/wanderlust-surface/layout';
import { HudPlaque } from '@/ui/idleVillage/skins/primitives';
import { SkinScope } from '@/ui/idleVillage/skins/primitives/SkinScope';
import { QUESTS } from '@/ui/idleVillage/questS1Lab/questRun';
import type { QuestId } from '@/ui/idleVillage/questS1Lab/questRun';
import { DEFAULT_QUEST_LAB_PRESENTATION as PRES } from '@/balancing/config/idleVillage/quests/questLabPresentation';
import { HudChip, Kicker, STAT_SHORT } from './atoms';

export interface QuestSelectScreenProps {
  /** Painted map art for the cinematic header. */
  mapArt: string;
  cards: { id: QuestId; art: string; riskKey: string }[];
  onPick: (id: QuestId) => void;
}

/** Quest selection — painted map header + quest card plaques. */
export const QuestSelectScreen: React.FC<QuestSelectScreenProps> = ({ mapArt, cards, onPick }) => {
  const { t } = useTranslation('idleVillage');
  return (
    <WanderlustAmbientField className="h-screen text-ivory" fireflyCount={5}>
      <SkinScope className="quest-s1-scroll h-screen overflow-y-auto" style={{ background: 'var(--skin-surface-base)' }}>
      <div className="relative h-44 overflow-hidden md:h-56">
        <img
          src={mapArt}
          alt=""
          className="h-full w-full object-cover"
          style={{ objectPosition: '50% 30%', opacity: 0.75 }}
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(180deg, color-mix(in srgb, var(--skin-hud-lacquer-deep) 40%, transparent) 0%, transparent 45%, var(--skin-hud-lacquer-deep) 100%)',
          }}
        />
        <div className="absolute bottom-4 left-6 md:left-10">
          <Kicker>{t('questS1Lab.kicker')}</Kicker>
          <h1>{t('questS1Lab.labTitle')}</h1>
        </div>
      </div>
      <div className="p-6 md:p-10">
        <p className="mb-8 max-w-2xl" style={{ fontFamily: 'var(--skin-font-serif)', fontSize: PRES.type.bodyPx }}>
          {t('questS1Lab.pickQuest')}
        </p>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {cards.map((q) => (
            <HudPlaque key={q.id} shape="panel" style={{ overflow: 'hidden' }}>
              <div
                role="button"
                tabIndex={0}
                onClick={() => onPick(q.id)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onPick(q.id);
                  }
                }}
                className="cursor-pointer text-left"
              >
                <div className="relative h-44 overflow-hidden">
                  <img
                    src={q.art}
                    alt=""
                    className="h-full w-full object-cover transition"
                    style={{ objectPosition: '50% 80%', opacity: 0.85 }}
                  />
                  <div
                    className="absolute inset-0"
                    style={{
                      background:
                        'linear-gradient(0deg, var(--skin-hud-lacquer-deep) 0%, color-mix(in srgb, var(--skin-hud-lacquer-deep) 25%, transparent) 60%, transparent 100%)',
                    }}
                  />
                  <div className="absolute bottom-3 left-4">
                    <div
                      style={{
                        fontFamily: 'var(--skin-font-display)',
                        fontSize: PRES.type.titlePx,
                        fontWeight: 700,
                        color: 'var(--skin-title-color)',
                        textShadow: 'var(--skin-incision-title)',
                      }}
                    >
                      {t(`questS1Lab.quests.${q.id}.title`)}
                    </div>
                  </div>
                </div>
                <div className="space-y-2 p-4">
                  <p style={{ fontFamily: 'var(--skin-font-serif)', fontSize: PRES.type.bodyPx }}>
                    {t(`questS1Lab.quests.${q.id}.desc`)}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <HudChip tone="accent">
                      ★ {QUESTS[q.id].primaryStats.map((s) => STAT_SHORT[s]).join(' + ')}
                    </HudChip>
                    <HudChip tone="warn">{t(`questS1Lab.risk.${q.riskKey}`)}</HudChip>
                    <HudChip tone="muted">{t(`questS1Lab.quests.${q.id}.duration`)}</HudChip>
                  </div>
                </div>
              </div>
            </HudPlaque>
          ))}
        </div>
      </div>
      </SkinScope>
    </WanderlustAmbientField>
  );
};

export default QuestSelectScreen;
