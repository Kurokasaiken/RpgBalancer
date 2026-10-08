/**
 * questS1Lab/hud/PresetScreen — preset/party + stash screen (PLAN-024
 * T-008): two columns — party presets on the left, the bag plaque sticky
 * on the right — every CTA reachable without scroll at 1366×768.
 */

import React from 'react';
import { useTranslation } from 'react-i18next';
import { WanderlustAmbientField } from '@/ui/wanderlust-surface/layout';
import { WanderlustRosterCard } from '@/ui/idleVillage/roster';
import { HudPlaque } from '@/ui/idleVillage/skins/primitives';
import { SkinScope } from '@/ui/idleVillage/skins/primitives/SkinScope';
import type { LabStat, PartyPreset } from '@/ui/idleVillage/questS1Lab/questScenario';
import type { QuestId } from '@/ui/idleVillage/questS1Lab/questRun';
import { DEFAULT_QUEST_LAB_PRESENTATION as PRES } from '@/balancing/config/idleVillage/quests/questLabPresentation';
import { HudChip, Kicker, STAT_SHORT, statLine, TONE } from './atoms';
import { StashPicker } from './StashPicker';

export interface PresetScreenProps {
  mapArt: string;
  questId: QuestId;
  presets: PartyPreset[];
  primaryStats: LabStat[];
  loadout: string[];
  onToggleStash: (flag: string) => void;
  onBack: () => void;
  onStart: (presetId: string) => void;
}

/** Preset selection — presets left, the shared bag plaque sticky right. */
export const PresetScreen: React.FC<PresetScreenProps> = ({
  mapArt, questId, presets, primaryStats,
  loadout, onToggleStash, onBack, onStart,
}) => {
  const { t } = useTranslation('idleVillage');
  return (
    <WanderlustAmbientField className="h-screen text-ivory" fireflyCount={5}>
      <SkinScope className="quest-s1-scroll h-screen overflow-y-auto" style={{ background: 'var(--skin-surface-base)' }}>
      {/* Cinematic header — the painted Wanderlust world map */}
      <div className="relative h-36 overflow-hidden md:h-44">
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
          <h1>{t(`questS1Lab.quests.${questId}.title`)}</h1>
        </div>
      </div>
      <div className="p-6 md:px-10 md:py-6">
      <div className="mb-3 flex items-center gap-3" data-hud-controls="">
        <button onClick={onBack} type="button">
          ← {t('questS1Lab.backToQuests')}
        </button>
      </div>
      <p className="mb-3 max-w-2xl" style={{ fontFamily: 'var(--skin-font-serif)', fontSize: PRES.type.bodyPx }}>
        {t(`questS1Lab.quests.${questId}.objective`)}
      </p>
      {/* Declared primary stats — the player must know a priori which
          party solves this quest. Every mandatory check uses these. */}
      <div className="mb-5 flex items-center gap-2">
        <HudChip tone="accent">
          {t(`questS1Lab.quests.${questId}.trial`, { stats: primaryStats.map((s) => STAT_SHORT[s]).join(' + ') })}
        </HudChip>
        <span
          style={{
            fontFamily: 'var(--skin-font-serif)',
            fontSize: PRES.type.labelPx,
            color: TONE.muted,
          }}
        >
          {t('questS1Lab.primaryNote')}
        </span>
      </div>

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        {/* Party presets — roster compact rows + depart CTA per preset. */}
        <div className="space-y-5">
          {presets.map((p) => (
            <HudPlaque key={p.id} shape="panel" style={{ padding: '14px 16px 12px' }}>
              <header className="mb-3 flex items-start justify-between gap-3">
                <div>
                  <Kicker>{t('questS1Lab.partyKicker')}</Kicker>
                  <div
                    className="mt-1"
                    style={{
                      fontFamily: 'var(--skin-font-display)',
                      fontSize: PRES.type.titlePx - 4,
                      fontWeight: 700,
                      color: 'var(--skin-text-primary)',
                    }}
                  >
                    {p.label}
                  </div>
                  <div style={{ fontFamily: 'var(--skin-font-serif)', fontSize: PRES.type.labelPx, color: TONE.secondary }}>
                    {p.description}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1.5">
                  <HudChip tone="label">
                    {p.gold} {t('questS1Lab.gold')}
                  </HudChip>
                  <HudChip tone="accent">
                    ★ {primaryStats.map((s) => `${STAT_SHORT[s]} ${Math.max(...p.members.map((m) => m.stats[s]))}`).join(' · ')}
                  </HudChip>
                </div>
              </header>
              <div className="space-y-2">
                {p.members.map((m) => (
                  <WanderlustRosterCard
                    key={m.id}
                    workerId={m.id}
                    label={m.name}
                    subtitle={`${t(`questS1Lab.role.${m.role}`)} · ${statLine(m)}`}
                    hp={m.hp ?? 10}
                    maxHp={m.hp ?? 10}
                    fatigue={0}
                    portraitUrl={m.portrait}
                    isInteractive={false}
                    compact
                  />
                ))}
              </div>
              <div className="mt-4 flex justify-end">
                <button onClick={() => onStart(p.id)} data-skin="cta" type="button">
                  {t('questS1Lab.depart')}
                </button>
              </div>
            </HudPlaque>
          ))}
        </div>

        {/* The shared bag (R-102): sticky so the loadout stays on screen
            while the player compares presets. */}
        <HudPlaque
          shape="panel"
          style={{ padding: '14px 16px 12px', position: 'sticky', top: 16 }}
        >
          <StashPicker
            loadout={loadout}
            onToggle={onToggleStash}
            primaryStats={primaryStats}
          />
        </HudPlaque>
      </div>
      </div>
      </SkinScope>
    </WanderlustAmbientField>
  );
};

export default PresetScreen;
