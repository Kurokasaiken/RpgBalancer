import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  BASE_SKIN_CSS_VARS,
  getSkinCssVariables,
} from '@/ui/idleVillage/skins/skinCssVariables';
import { useSkinPreferences } from '@/ui/idleVillage/hooks/useSkinPreferences';
import { SkinBadge, SkinButton } from '@/ui/idleVillage/skins/primitives';

/**
 * SkinPreviewMatrix — la stessa scena UI composta, ripetuta per ogni preset.
 *
 * Ruolo rigido (mai sovrapposto a Hero/Production): CONFRONTO TECNICO.
 * Stesso markup, stessi componenti, solo skin diversa. Lo scoping avviene
 * applicando `getSkinCssVariables(presetId)` come custom properties inline
 * sul container di colonna: per ereditarietà CSS battono le var inline su
 * <html> (audit: nessun CSS lega --skin-* a :root, vedi piano Fase 3).
 *
 * Matrix Health ("Skin Compatibility"): sonde runtime confrontano i computed
 * style delle colonne con la colonna base — se un token overridato dal preset
 * NON produce un cambiamento visivo, il consumatore è legacy/non scoped.
 * Warning, mai blocco. Vista artist-friendly, dettaglio tecnico al click.
 */

/** Sonda: ruolo visivo → token che il preset può overridare → proprietà CSS da confrontare. */
const HEALTH_PROBES: Array<{ probe: string; token: string; cssProp: string }> = [
  { probe: 'panel', token: '--skin-surface-bg', cssProp: 'background-image' },
  { probe: 'badge', token: '--skin-badge-color', cssProp: 'color' },
  { probe: 'link', token: '--skin-icon-accent', cssProp: 'color' },
  { probe: 'subtitle', token: '--skin-subtitle-color', cssProp: 'color' },
];

interface ColumnHealth {
  presetId: string;
  expected: number;
  adapted: number;
  issues: Array<{ probe: string; token: string }>;
}

/** La scena campione: soli ruoli skin (nessun valore proprio), markup identico per colonna. */
function MatrixScene({ presetLabel }: { presetLabel: string }) {
  return (
    <div data-skin="panel" style={{ padding: '16px 18px' }} data-matrix-probe="panel">
      <span data-skin="plaque">QUEST</span>
      <div data-skin="title" style={{ fontSize: '20px', marginTop: '8px' }}>
        Dangerous Hunt
      </div>
      <div data-skin="subtitle" data-matrix-probe="subtitle">
        {presetLabel}
      </div>
      <div data-skin="titlesep" aria-hidden />
      <p style={{ fontSize: '13px' }}>
        Track the beast through the mist — <a href="#section-matrix" data-matrix-probe="link">scout report</a>.
      </p>
      <p style={{ fontSize: '12px', margin: '6px 0' }}>
        <span style={{ color: 'var(--skin-status-met)' }}>✓ 2 residents ready</span>{' · '}
        <span style={{ color: 'var(--skin-status-unmet)' }}>✗ supplies low</span>
      </p>
      <div
        aria-hidden
        style={{
          height: '8px',
          borderRadius: '4px',
          margin: '8px 0 12px',
          background: 'var(--skin-statbar-track)',
          border: '1px solid var(--skin-statbar-track-border)',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            width: '65%',
            height: '100%',
            background:
              'linear-gradient(90deg, var(--skin-statbar-hp-start), var(--skin-statbar-hp-end))',
          }}
        />
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
        <SkinBadge data-matrix-probe="badge">rare</SkinBadge>
        <SkinButton variant="secondary">Details</SkinButton>
        <SkinButton variant="cta" ornaments={false}>
          Avvia
        </SkinButton>
      </div>
    </div>
  );
}

export function SkinPreviewMatrix() {
  const { t } = useTranslation('common');
  const { availablePresets } = useSkinPreferences();
  const rootRef = useRef<HTMLDivElement>(null);
  const [health, setHealth] = useState<ColumnHealth[]>([]);
  const [showDetail, setShowDetail] = useState(false);

  const columns = useMemo(
    () =>
      availablePresets.map((preset) => ({
        id: preset.id,
        label: preset.label,
        vars: getSkinCssVariables(preset.id),
      })),
    [availablePresets]
  );

  // Sonde: confronta i computed style di ogni colonna con la colonna base.
  useEffect(() => {
    const root = rootRef.current;
    if (!root || columns.length === 0) return;
    const readProbes = (presetId: string) => {
      const col = root.querySelector(`[data-matrix-col="${presetId}"]`);
      const values: Record<string, string> = {};
      if (!col) return values;
      for (const { probe, cssProp } of HEALTH_PROBES) {
        const el = col.querySelector(`[data-matrix-probe="${probe}"]`);
        if (el) values[probe] = getComputedStyle(el).getPropertyValue(cssProp);
      }
      return values;
    };

    const baseValues = readProbes('base');
    const next: ColumnHealth[] = [];
    for (const column of columns) {
      if (column.id === 'base') continue;
      const changedTokens = new Set(
        Object.keys(column.vars).filter(
          (name) => BASE_SKIN_CSS_VARS[name as `--${string}`] !== column.vars[name as `--${string}`]
        )
      );
      const colValues = readProbes(column.id);
      const relevant = HEALTH_PROBES.filter((p) => changedTokens.has(p.token));
      const issues = relevant.filter(
        (p) => colValues[p.probe] !== undefined && colValues[p.probe] === baseValues[p.probe]
      );
      next.push({
        presetId: column.id,
        expected: relevant.length,
        adapted: relevant.length - issues.length,
        issues: issues.map((p) => ({ probe: p.probe, token: p.token })),
      });
    }
    setHealth(next);
  }, [columns]);

  const totals = health.reduce(
    (acc, h) => ({ expected: acc.expected + h.expected, adapted: acc.adapted + h.adapted }),
    { expected: 0, adapted: 0 }
  );
  const pct = totals.expected === 0 ? 100 : Math.round((totals.adapted / totals.expected) * 100);
  const issueCount = totals.expected - totals.adapted;

  return (
    <div ref={rootRef} data-testid="skin-preview-matrix">
      <p className="skin-text-secondary" style={{ marginTop: 0 }}>
        {t(
          'designSystem.matrix.note',
          'Stesso markup, solo skin diversa. Contrasto, atmosfera e leggibilità si giudicano qui, senza switchare preset.'
        )}
      </p>

      {/* Health bar — artist-friendly, dettaglio al click */}
      <div
        style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '10px 0 18px', flexWrap: 'wrap' }}
        data-testid="matrix-health"
      >
        <span data-skin="section" style={{ fontSize: '10px' }}>
          {t('designSystem.matrix.health', 'Skin Compatibility')}
        </span>
        <div
          aria-hidden
          style={{
            width: '160px',
            height: '8px',
            borderRadius: '4px',
            background: 'var(--skin-statbar-track)',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              width: `${pct}%`,
              height: '100%',
              background:
                pct === 100
                  ? 'linear-gradient(90deg, var(--skin-statbar-hp-start), var(--skin-statbar-hp-end))'
                  : 'linear-gradient(90deg, var(--skin-statbar-fatigue-start), var(--skin-statbar-fatigue-end))',
            }}
          />
        </div>
        <strong data-testid="matrix-health-pct">{pct}%</strong>
        {issueCount > 0 && (
          <span className="skin-text-muted" style={{ fontSize: '12px' }}>
            {t('designSystem.matrix.issues', `${issueCount} probes still show base styling`)}
          </span>
        )}
        <SkinButton
          variant="secondary"
          onClick={() => setShowDetail((v) => !v)}
          data-testid="matrix-health-detail-toggle"
        >
          {showDetail
            ? t('designSystem.matrix.hideDetail', 'Hide detail')
            : t('designSystem.matrix.showDetail', 'Developer detail')}
        </SkinButton>
      </div>

      {showDetail && (
        <div
          style={{
            marginBottom: '18px',
            padding: '10px 14px',
            border: '1px dashed var(--skin-separator)',
            borderRadius: 'var(--skin-inset-radius)',
            fontFamily: 'monospace',
            fontSize: '12px',
          }}
          data-testid="matrix-health-detail"
        >
          {health.length === 0 && <p className="skin-text-muted">no probes yet</p>}
          {health.map((h) => (
            <p key={h.presetId} style={{ margin: '2px 0' }}>
              {h.presetId}: {h.adapted}/{h.expected} adapted
              {h.issues.length > 0 &&
                ` — unscoped: ${h.issues.map((i) => `${i.probe} (${i.token})`).join(', ')}`}
            </p>
          ))}
        </div>
      )}

      {/* Colonne: var inline per preset — scoping locale, <html> non viene toccato */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${columns.length}, minmax(240px, 1fr))`,
          gap: '16px',
        }}
      >
        {columns.map((column) => (
          <div key={column.id} data-matrix-col={column.id} data-testid={`matrix-col-${column.id}`}>
            <div data-skin="section" style={{ fontSize: '10px', marginBottom: '8px' }}>
              {column.label}
            </div>
            <div style={column.vars as React.CSSProperties} className="skin-scope">
              <MatrixScene presetLabel={column.label} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default SkinPreviewMatrix;
