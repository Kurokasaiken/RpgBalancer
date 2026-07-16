import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  SlotRackKitShell,
  ResidentSlotRackSkin,
  useSlotRackKitData,
} from '@/ui/idleVillage/frozen/kits/slotRackKit';
import {
  PgCard,
  usePgCardKitData,
  residentToPgCardProps,
} from '@/ui/idleVillage/frozen/kits/pgcardKit';
import {
  ClockWidgetStandalone,
  useClockKitData,
} from '@/ui/idleVillage/frozen/kits/clockKit';
import { GenericPoiSkin } from '@/ui/idleVillage/frozen/kits/poiKit';
import { POI_AMBER_SKIN_CONFIG } from '@/ui/idleVillage/skins/poi/poiAmberSkinConfig';
import { DEFAULT_IDLE_VILLAGE_CONFIG } from '@/balancing/config/idleVillage/defaultConfig';
import { getCatalogEntry } from './componentCatalog';
import { ComponentTechSheet } from './ComponentTechSheet';
import { PatternAnatomy } from './PatternAnatomy';

/**
 * GamePatternEmbeds — i mattoni reali del gioco dentro la UI Review Room.
 *
 * Ogni embed monta il componente CANONICO via frozen kit (varianti
 * Standalone/KitShell con provider chain smart) e prende i valori solo da
 * config/fixture canoniche (CanonicalDataBridge, POI_AMBER_SKIN_CONFIG,
 * DEFAULT_IDLE_VILLAGE_CONFIG) — zero literal visivi locali.
 *
 * Il file è lazy-loadato dalla pagina: gli embed pesanti non gravano sul
 * first paint della Review Room.
 */

const questConfig = DEFAULT_IDLE_VILLAGE_CONFIG.activities.quest_dangerous_hunt;
const amberTokens = POI_AMBER_SKIN_CONFIG.colorTokens;

type RgbToken = { r: number; g: number; b: number };
type ColorTokenValue = string | (RgbToken & { label?: string });

/** Narrowing fail-fast: un token del tipo sbagliato è un errore di config. */
function rgbToken(name: string): RgbToken {
  const value: ColorTokenValue | undefined = amberTokens[name];
  if (!value || typeof value === 'string') {
    throw new Error(`poiAmberSkinConfig: token "${name}" is not an {r,g,b} color`);
  }
  return { r: value.r, g: value.g, b: value.b };
}

function strToken(name: string): string {
  const value: ColorTokenValue | undefined = amberTokens[name];
  if (typeof value !== 'string') {
    throw new Error(`poiAmberSkinConfig: token "${name}" is not a string color`);
  }
  return value;
}

/** POI medallion con i colori canonici del preset Wilderness Amber. */
export function PoiMedallionEmbed() {
  return (
    <GenericPoiSkin
      icon="🏹"
      label={questConfig.label}
      progress={0.65}
      coronaCore={rgbToken('corona.core')}
      coronaGlow={rgbToken('corona.glow')}
      rimColors={[strToken('rim.stop0'), strToken('rim.stop1'), strToken('rim.stop2')]}
      stoneColors={[strToken('stone.stop0'), strToken('stone.stop1')]}
      stoneAmbient={strToken('stone.ambient')}
      pinColor={strToken('pin.color')}
      pillar={POI_AMBER_SKIN_CONFIG.metadata?.pillar as 'wilderness'}
      size={160}
      enableHover
      showRiskBadges
      dangerRating={`${questConfig.dangerRating}/5`}
    />
  );
}

/** Slot rack con gli slot derivati dal controller canonico (SLOT_LAB_CONFIG). */
export function SlotRackEmbed() {
  const { slots } = useSlotRackKitData();
  return (
    <SlotRackKitShell>
      <ResidentSlotRackSkin slots={slots} layout="detail" slotSize={96} overflowBehavior="scroll" />
    </SlotRackKitShell>
  );
}

function PgCardInner() {
  const { firstResident } = usePgCardKitData();
  if (!firstResident) return null;
  return <PgCard {...residentToPgCardProps(firstResident)} />;
}

/** PgCard del primo residente canonico (deterministico, come il contract test). */
export function PgCardEmbed() {
  return (
    <SlotRackKitShell>
      <PgCardInner />
    </SlotRackKitShell>
  );
}

function ClockInner() {
  const { t } = useTranslation('common');
  const clock = useClockKitData();
  const [speed, setSpeed] = useState(clock.speedMultiplier);
  return (
    <div>
      <ClockWidgetStandalone {...clock} speedMultiplier={speed} onSpeedChange={setSpeed} />
      <p className="skin-text-muted" style={{ fontSize: '11px', marginTop: '6px' }}>
        {t('designSystem.embeds.clockSpeed', `Speed: ${speed}x`)}
      </p>
    </div>
  );
}

/** Clock widget con i timing canonici (DEFAULT_MINIMAL_CONFIG.timeEngine). */
export function ClockEmbed() {
  return <ClockInner />;
}

/* ═══ Sezioni componibili (lazy-loadate dalla pagina) ═════════════════════ */

function ProductionBlock({
  entryId,
  children,
}: {
  entryId: string;
  children: React.ReactNode;
}) {
  const { t } = useTranslation('common');
  const entry = getCatalogEntry(entryId);
  return (
    <div style={{ marginBottom: '26px' }} data-testid={`production-${entryId}`}>
      <div style={{ display: 'flex', gap: '12px', alignItems: 'baseline', flexWrap: 'wrap' }}>
        <h3 style={{ margin: 0 }}>{entry?.title ?? entryId}</h3>
        <span className="skin-text-muted" style={{ fontSize: '11px', fontFamily: 'monospace' }}>
          {t('designSystem.production.source', 'Source')}: {entry?.sourcePath}
        </span>
      </div>
      <div
        style={{
          marginTop: '10px',
          padding: '18px',
          border: '1px solid var(--skin-separator)',
          borderRadius: 'var(--skin-inset-radius)',
          background: 'var(--skin-footer-bg)',
        }}
      >
        {children}
      </div>
    </div>
  );
}

/**
 * Current Production — la UI vera del gioco, montata via frozen kit.
 * Read-only per regola: nessun controllo di editing, gli esperimenti
 * stanno in Experimental.
 */
export function CurrentProductionSection() {
  const { t } = useTranslation('common');
  return (
    <div data-testid="current-production-content">
      <p className="skin-text-secondary" style={{ marginTop: 0 }}>
        {t(
          'designSystem.production.note',
          'Quello che vedi qui è quello che vede il giocatore: componenti canonici montati via frozen kit, dati dalle fixture canoniche. Read-only.'
        )}
      </p>
      <ProductionBlock entryId="clock-widget">
        <ClockEmbed />
      </ProductionBlock>
      <ProductionBlock entryId="resident-slot-rack">
        <SlotRackEmbed />
      </ProductionBlock>
    </div>
  );
}

function PatternBlock({
  entryId,
  children,
}: {
  entryId: string;
  children?: React.ReactNode;
}) {
  const entry = getCatalogEntry(entryId);
  if (!entry) return null;
  return (
    <div style={{ marginBottom: '30px' }} data-testid={`pattern-${entryId}`}>
      {children && (
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            padding: '22px',
            marginBottom: '12px',
            border: '1px solid var(--skin-separator)',
            borderRadius: 'var(--skin-inset-radius)',
            background: 'var(--skin-inset-bg)',
          }}
        >
          {children}
        </div>
      )}
      <ComponentTechSheet entry={entry} />
      <PatternAnatomy entry={entry} />
    </div>
  );
}

/**
 * Game Patterns — i mattoni del gioco con scheda tecnica e anatomy
 * (Component Extraction Mode: dal pattern ai pezzi catalogati).
 */
export function GamePatternsSection() {
  return (
    <div data-testid="game-patterns-content">
      <PatternBlock entryId="poi-medallion">
        <PoiMedallionEmbed />
      </PatternBlock>
      <PatternBlock entryId="pg-card">
        <PgCardEmbed />
      </PatternBlock>
      {/* Embed rinviati — le schede documentano il blocco (kit draft/rotti) */}
      <PatternBlock entryId="slotted-medal" />
      <PatternBlock entryId="activity-capsule-detail" />
    </div>
  );
}
