import React from 'react';
import { useTranslation } from 'react-i18next';
import { KIT_REGISTRY } from '@/ui/idleVillage/frozen/registry';
import { SkinBadge } from '@/ui/idleVillage/skins/primitives';
import { COMPONENT_CATALOG, getCatalogCounts, getCatalogStatus } from './componentCatalog';

/**
 * UIHealthReport (Lab) — la risposta rapida a "com'è messo il sistema?".
 *
 * Dashboard sintetica derivata da fonti canoniche, mai dichiarata a mano:
 * - catalog counts (status derivati da KIT_REGISTRY)
 * - kit certificati vs draft (KIT_REGISTRY)
 * - entry bloccate (blockedNote nel catalog)
 * - visual regression: stato onesto (non configurata finché non esiste)
 */
export function UIHealthReport() {
  const { t } = useTranslation('common');
  const counts = getCatalogCounts();
  const certified = KIT_REGISTRY.filter((k) => k.status === 'certified').length;
  const draft = KIT_REGISTRY.length - certified;
  const blocked = COMPONENT_CATALOG.filter((e) => e.blockedNote);

  const rows: Array<{ label: string; value: React.ReactNode }> = [
    {
      label: t('designSystem.health.catalog', 'Catalog'),
      value: `${counts.production} production · ${counts.candidate} candidate · ${counts.deprecated} deprecated · ${counts.experimental} experimental`,
    },
    {
      label: t('designSystem.health.kits', 'Frozen kits'),
      value: `${certified} certified · ${draft} draft (KIT_REGISTRY)`,
    },
    {
      label: t('designSystem.health.blocked', 'Blocked embeds'),
      value:
        blocked.length === 0
          ? t('designSystem.health.none', 'none')
          : blocked.map((e) => `${e.title} (${getCatalogStatus(e)})`).join(' · '),
    },
    {
      label: t('designSystem.health.regression', 'Visual regression'),
      value: t('designSystem.health.notConfigured', 'not configured yet (Step 11)'),
    },
  ];

  return (
    <div data-testid="ui-health-report">
      {rows.map((row) => (
        <div
          key={row.label}
          style={{
            display: 'flex',
            gap: '14px',
            alignItems: 'baseline',
            padding: '8px 0',
            borderBottom: '1px solid var(--skin-separator)',
          }}
        >
          <SkinBadge>{row.label}</SkinBadge>
          <span style={{ fontSize: '13px' }}>{row.value}</span>
        </div>
      ))}
      {blocked.length > 0 && (
        <ul style={{ margin: '10px 0 0', paddingLeft: '18px', fontSize: '12px' }}>
          {blocked.map((e) => (
            <li key={e.id} className="skin-text-muted">
              {e.title}: {e.blockedNote}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default UIHealthReport;
