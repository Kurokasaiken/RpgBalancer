import React from 'react';
import { useTranslation } from 'react-i18next';
import { SkinBadge } from '@/ui/idleVillage/skins/primitives';
import { getCatalogStatus, type CatalogEntry, type CatalogStatus } from './componentCatalog';

/**
 * ComponentTechSheet — la scheda tecnica di un'entry del catalog.
 *
 * Rende: status (derivato dal KIT_REGISTRY quando esiste un kit), maturity,
 * visualRole (il "perché esiste"), usage/forbidden con alternativa,
 * compositionRules semantiche, bindings --skin-* e Source path.
 * Stile: solo ruoli data-skin e var(--skin-*) — nessun valore proprio.
 */

const STATUS_GLYPH: Record<CatalogStatus, string> = {
  production: '✔',
  candidate: '🟡',
  deprecated: '🔴',
  experimental: '🧪',
};

export interface ComponentTechSheetProps {
  entry: CatalogEntry;
  /** Compatta (dentro un pattern) o completa (sezione Components). */
  compact?: boolean;
}

export function ComponentTechSheet({ entry, compact = false }: ComponentTechSheetProps) {
  const { t } = useTranslation('common');
  const status = getCatalogStatus(entry);

  return (
    <div
      id={`catalog-${entry.id}`}
      style={{
        border: '1px solid var(--skin-separator)',
        borderRadius: 'var(--skin-inset-radius)',
        padding: '12px 14px',
        background: 'var(--skin-footer-bg)',
      }}
      data-testid={`tech-sheet-${entry.id}`}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
        <strong>{entry.title}</strong>
        <SkinBadge data-testid={`tech-sheet-status-${entry.id}`}>
          {STATUS_GLYPH[status]} {status}
        </SkinBadge>
        {entry.maturity === 'needs-review' && (
          <SkinBadge>{t('designSystem.catalog.needsReview', 'needs review')}</SkinBadge>
        )}
        <span className="skin-text-muted" style={{ fontSize: '11px', fontFamily: 'monospace' }}>
          {t('designSystem.catalog.source', 'Source')}: {entry.sourcePath}
          {entry.lastValidated ? ` · ${t('designSystem.catalog.lastValidated', 'Last validated')}: ${entry.lastValidated}` : ''}
        </span>
      </div>

      <p className="skin-text-secondary" style={{ margin: '8px 0 0', fontStyle: 'italic' }}>
        {entry.visualRole}
      </p>

      {entry.blockedNote && (
        <p className="skin-text-muted" style={{ margin: '6px 0 0', fontSize: '12px' }}>
          ⛔ {entry.blockedNote}
        </p>
      )}

      {!compact && (
        <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap', marginTop: '10px' }}>
          <div style={{ minWidth: '220px' }}>
            <div data-skin="section" style={{ fontSize: '10px' }}>
              ✔ {t('designSystem.catalog.use', 'Use for')}
            </div>
            <ul style={{ margin: '4px 0 0', paddingLeft: '18px' }}>
              {entry.usage.map((u) => (
                <li key={u} style={{ fontSize: '13px' }}>{u}</li>
              ))}
            </ul>
          </div>
          <div style={{ minWidth: '220px' }}>
            <div data-skin="section" style={{ fontSize: '10px', color: 'var(--skin-status-unmet)' }}>
              ✖ {t('designSystem.catalog.dont', "Don't use for")}
            </div>
            <ul style={{ margin: '4px 0 0', paddingLeft: '18px' }}>
              {entry.forbiddenUsage.map((u) => (
                <li key={u} style={{ fontSize: '13px' }}>{u}</li>
              ))}
            </ul>
            {entry.alternative && (
              <p className="skin-text-muted" style={{ margin: '4px 0 0', fontSize: '12px' }}>
                → {t('designSystem.catalog.alternative', 'Alternative')}: {entry.alternative}
              </p>
            )}
          </div>
          {entry.bindings.length > 0 && (
            <div style={{ minWidth: '220px' }}>
              <div data-skin="section" style={{ fontSize: '10px' }}>
                {t('designSystem.catalog.bindings', 'Skin bindings')}
              </div>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '4px' }}>
                {entry.bindings.map((b) => (
                  <code key={b} className="skin-text-muted" style={{ fontSize: '11px' }}>
                    {b}
                  </code>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default ComponentTechSheet;
