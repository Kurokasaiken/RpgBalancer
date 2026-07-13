/**
 * RT-POI-D-001 Verification Page
 * 
 * Dedicated POI Detail verification page that demonstrates PoiDetailSkinWrapper
 * integration with ActivityCapsuleDetailSkinAware and validates compliance
 * with POI Detail trusted contract.
 */

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { TooltipProvider } from '@radix-ui/react-tooltip';
import { ActivityCapsuleDetailSkinAware } from '../skins/activityCapsuleDetail/ActivityCapsuleDetailSkinAware';
import type { ActivityDetailSlotData, TelemetryEntry } from '../skins/activityCapsuleDetail/ActivityCapsuleDetailSkinAware';
import { GenericPoiSkin } from '../components/minimal/GenericPoiSkin';
import { DEFAULT_IDLE_VILLAGE_CONFIG } from '@/balancing/config/idleVillage/defaultConfig';
import { trackTelemetryEvent } from '@/analytics/telemetry/telemetryProvider';
import { StyleLabSurface } from '@/ui/styleLab/StyleLabSurface';
import { POI_DETAIL_SKIN_CONFIG } from '@/ui/idleVillage/skins/poi/poiDetailSkinConfig';

// Use existing quest from config
const questConfig = DEFAULT_IDLE_VILLAGE_CONFIG.activities.quest_dangerous_hunt;
const questDurationMs = parseInt(questConfig.durationFormula, 10);
const questProgress = 0.65;
const questElapsedMs = Math.floor(questDurationMs * questProgress);
const questRemainingMs = questDurationMs - questElapsedMs;
const questMetadata = questConfig.metadata ?? {};
const questStatRequirement = questConfig.statRequirement ?? {
  label: 'Requirements',
  allOf: [],
  anyOf: [],
};

const questRewardsCopy = questConfig.rewards
  .map((reward) => `${reward.resourceId.toUpperCase()} +${reward.amountFormula}`)
  .join(' · ');

const STAT_LABEL_MAP: Record<'allOf' | 'anyOf', string> = {
  allOf: 'Richiede',
  anyOf: 'Accetta',
};

// Color mapping from poiAmberSkinConfig for wilderness pillar
const WILDERNESS_COLORS = {
  coronaCore: { r: 210, g: 138, b: 28 },
  coronaGlow: { r: 180, g: 105, b: 10 },
  rimColors: ['#fce890', '#c09030', '#200e02'] as [string, string, string],
  stoneColors: ['#1e1608', '#030202'] as [string, string],
  stoneAmbient: 'rgba(255,220,120,.22)',
  pinColor: 'rgba(205,190,148,.72)',
};

// Mock data for verification
const mockSlots: ActivityDetailSlotData[] = [
  {
    id: 'slot-1',
    state: 'empty',
    initial: '',
    progress: 0,
  },
  {
    id: 'slot-2',
    state: 'empty',
    initial: '',
    progress: 0,
  },
  {
    id: 'slot-3',
    state: 'active',
    initial: 'CD',
    progress: 0.65,
    assignedWorkerName: 'Forest Worker',
    assignedWorkerAvatarUrl: '/assets/portraits/worker-1.png',
  },
];

const mockTelemetry: TelemetryEntry[] = [
  {
    id: 'tel-1',
    timestamp: new Date(Date.now() - 3600000),
    message: 'Activity started',
    type: 'start',
  },
  {
    id: 'tel-2',
    timestamp: new Date(Date.now() - 1800000),
    message: 'Worker assigned to slot 3',
    type: 'assign',
  },
  {
    id: 'tel-3',
    timestamp: new Date(Date.now() - 600000),
    message: 'Progress update: 65%',
    type: 'done',
  },
];

export function PoiDetailVerificationPage() {
  const [detailOpen, setDetailOpen] = useState(true);

  useEffect(() => {
    trackTelemetryEvent('poi_detail_verification_loaded', {
      questId: questConfig.id,
      skinVersion: POI_DETAIL_SKIN_CONFIG.version,
      edition: 'RT-POI-D-001',
    });
  }, []);

  const handleClose = useCallback(() => {
    setDetailOpen(false);
  }, []);

  const handlePoiClick = useCallback(() => {
    setDetailOpen(true);
  }, []);

  const riskBadges = useMemo(
    () => [
      {
        label: 'Injury Risk',
        value: `${questMetadata.injuryChanceDisplay ?? 0}%`,
      },
      {
        label: 'Death Risk',
        value: `${questMetadata.deathChanceDisplay ?? 0}%`,
      },
      {
        label: 'Danger Rating',
        value: `${questConfig.dangerRating}/5`,
      },
    ],
    []
  );

  const versionBadges = useMemo(
    () => [
      `Versione ${POI_DETAIL_SKIN_CONFIG.version}`,
      `Target ${POI_DETAIL_SKIN_CONFIG.targetVersion}`,
      `Qualità ${POI_DETAIL_SKIN_CONFIG.quality}`,
    ],
    []
  );

  return (
    <StyleLabSurface className="poi-detail-surface" variant="panel">
      <TooltipProvider>
        <div className="poi-detail-verification-page" data-testid="poi-detail-verification-page">
          <header className="poi-detail-hero">
            <div className="poi-detail-hero__eyebrow">RT-POI-D-001 · Wilderness Amber Edition</div>
            <div className="poi-detail-hero__headline">
              <h1>POI Detail Verification</h1>
              <p>
                Replica fedele della scheda missione “{questConfig.label}”. Mostriamo testo, titolo, versione e
                componenti estetici esattamente come nel POI Detail reale per garantire parità visiva.
              </p>
            </div>
            <div className="poi-detail-hero__badges">
              {versionBadges.map((badge) => (
                <span key={badge} className="poi-detail-badge">
                  {badge}
                </span>
              ))}
              <button type="button" className="poi-detail-hero__toggle" onClick={() => setDetailOpen((open) => !open)}>
                {detailOpen ? 'Nascondi detail' : 'Mostra detail'}
              </button>
            </div>
          </header>

          <section className="poi-detail-summary-grid">
            <article className="summary-card">
              <p className="summary-label">Quest</p>
              <h2 className="summary-value">{questConfig.label}</h2>
              <p className="summary-copy">{questConfig.description}</p>
            </article>
            <article className="summary-card">
              <p className="summary-label">Pillar</p>
              <h3 className="summary-value">Wilderness Amber</h3>
              <p className="summary-copy">Slot tags: {questConfig.slotTags.join(', ')}</p>
              <div className="summary-chips">
                {questConfig.tags.map((tag) => (
                  <span key={tag} className="summary-chip">
                    #{tag}
                  </span>
                ))}
              </div>
            </article>
            <article className="summary-card">
              <p className="summary-label">Stat Requirements</p>
              <h3 className="summary-value">{questStatRequirement.label}</h3>
              {(['allOf', 'anyOf'] as const).map((key) =>
                questStatRequirement[key]?.length ? (
                  <p key={key} className="summary-copy">
                    <strong>{STAT_LABEL_MAP[key]}:</strong> {questStatRequirement[key]?.join(', ')}
                  </p>
                ) : null
              )}
            </article>
            <article className="summary-card">
              <p className="summary-label">Ricompense</p>
              <h3 className="summary-value">{questRewardsCopy}</h3>
              <p className="summary-copy">Durata prevista: {questDurationMs / 1000}s · Max slots: {questConfig.maxSlots}</p>
            </article>
          </section>

          <section className="poi-detail-stage">
            <div className="poi-detail-stage__medallion" onClick={handlePoiClick} role="button" tabIndex={0}>
              <GenericPoiSkin
                icon="🏹"
                progress={questProgress}
                coronaCore={WILDERNESS_COLORS.coronaCore}
                coronaGlow={WILDERNESS_COLORS.coronaGlow}
                rimColors={WILDERNESS_COLORS.rimColors}
                stoneColors={WILDERNESS_COLORS.stoneColors}
                stoneAmbient={WILDERNESS_COLORS.stoneAmbient}
                pinColor={WILDERNESS_COLORS.pinColor}
                pillar="wilderness"
                size={200}
                enableHover
                label="Dangerous Hunt"
                timeRemainingMs={questRemainingMs}
                isExpirable
                showRiskBadges
                injuryRisk={questMetadata.injuryChanceDisplay ?? 0}
                deathRisk={questMetadata.deathChanceDisplay ?? 0}
                dangerRating={`${questConfig.dangerRating}/5`}
              />
            </div>

            <div className="poi-detail-stage__detail">
              <ActivityCapsuleDetailSkinAware
                pillar="wilderness"
                activityId={questConfig.id}
                name={questConfig.label}
                type="quest"
                questTags={questConfig.tags}
                subtitle={questConfig.description}
                status="in-progress"
                progress={questProgress}
                duration={questDurationMs}
                elapsed={questElapsedMs}
                slots={mockSlots}
                maxSlots={questConfig.maxSlots === 'infinite' ? 99 : questConfig.maxSlots}
                durationDisplay={`${questDurationMs / 1000}s`}
                rewardDisplay={questConfig.rewards
                  .map((reward) => `${reward.resourceId}: +${reward.amountFormula}`)
                  .join(', ')}
                etaDisplay={`${questRemainingMs / 1000}s`}
                telemetry={mockTelemetry}
                isOpen={detailOpen}
                onClose={handleClose}
                enableDrag
                showTelemetry
                showSlots
                showInfo
                compact={false}
                inlineMode={false}
                ariaLabel={`POI Detail: ${questConfig.label}`}
                ariaLive="polite"
                enableDevTools
                dataTestId="poi-detail-wrapper-test"
              />
            </div>
          </section>

          <section className="poi-detail-copy">
            <article>
              <h3>Versione estetica</h3>
              <p>
                La skin <strong>{POI_DETAIL_SKIN_CONFIG.name}</strong> applica il tema Dark Luxury: titolo Cinzel con glow,
                cornici bronzee, rack in legno annerito e CTA serif. Questa verification page imposta gli stessi token di
                colore e tipografia così da confrontare qualsiasi regressione visiva.
              </p>
              <ul>
                <li>Material stack: {POI_DETAIL_SKIN_CONFIG.metadata?.materialHierarchy?.join(' → ')}</li>
                <li>Target engine: {POI_DETAIL_SKIN_CONFIG.compatibility?.join(', ')}</li>
                <li>Skin ID: {POI_DETAIL_SKIN_CONFIG.id}</li>
              </ul>
            </article>
            <article>
              <h3>Copy di missione</h3>
              <p>
                «Una bestia colossale sta devastando il bosco. Gli scout stimano <strong>25%</strong> di feriti e
                <strong>8%</strong> di perdite, ma l’oro promesso attira comunque gli avventurieri. Solo hunter élite con
                forza e agilità impeccabili vengono considerati.»
              </p>
              <p>
                Il testo sopra replica l’headline narrativa usata nella pagina POI Detail, garantendo che la versione di
                default del componente mantenga tono e gerarchia.
              </p>
            </article>
            <article>
              <h3>Telemetry attesa</h3>
              <ol>
                {mockTelemetry.map((entry) => (
                  <li key={entry.id}>
                    <span>{entry.message}</span> · <time dateTime={entry.timestamp.toISOString()}>{entry.timestamp.toLocaleTimeString()}</time>
                  </li>
                ))}
              </ol>
            </article>
          </section>
        </div>
      </TooltipProvider>
    </StyleLabSurface>
  );
};

export default PoiDetailVerificationPage;
