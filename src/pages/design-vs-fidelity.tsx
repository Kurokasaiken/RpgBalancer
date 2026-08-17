import React, { Suspense } from 'react';
import { useTranslation } from 'react-i18next';
import { SkinScope, SkinTitle, SkinBadge } from '@/ui/idleVillage/skins/primitives';
import { WanderlustRecordList } from '@/ui/wanderlust-surface/layout';
import { MISSING_ITEMS, type MissingItem } from '@/ui/idleVillage/MissingHub';
import { ErrorBoundary } from '@/ui/organisms/ErrorBoundary';

/**
 * /design-vs-fidelity — side-by-side comparison between the canonical UI
 * reference (`/design-system`) and the best visual fidelity candidate
 * (`/visual-fidelity-lab`).
 *
 * Also surfaces the current Missing Hub catalog at the bottom so the gap
 * between approved reference and open experiments is visible in one place.
 */
export default function DesignVsFidelityPage() {
  const { t } = useTranslation('common');

  const records = MISSING_ITEMS.map((item: MissingItem) => [
    item.status,
    item.area,
    item.name,
    item.note,
  ]);

  return (
    <SkinScope className="min-h-screen" data-testid="design-vs-fidelity-page">
      <div
        className="mx-auto max-w-[1800px] p-4 sm:p-6 lg:p-8"
        style={{ background: 'var(--skin-surface-base)' }}
      >
        <header className="mb-6" data-testid="page-header">
          <div data-skin="subtitle">{t('designVsFidelity.kicker', 'UI Audit')}</div>
          <SkinTitle>{t('designVsFidelity.title', 'Design System vs Visual Fidelity')}</SkinTitle>
          <div data-skin="titlesep" aria-hidden />
          <div className="mt-3 flex items-center gap-3">
            <a
              href="/test-hub"
              data-testid="back-to-hub"
              className="inline-flex items-center rounded px-3 py-2 text-xs uppercase tracking-widest"
              style={{
                fontFamily: 'var(--skin-font-display)',
                color: 'var(--skin-btn2-color)',
                background: 'var(--skin-btn2-bg)',
                border: '1px solid var(--skin-btn2-border)',
              }}
            >
              {t('designVsFidelity.backToHub', 'Back to Test Hub')}
            </a>
            <SkinBadge>{t('designVsFidelity.missingCount', '{{count}} missing items', { count: MISSING_ITEMS.length })}</SkinBadge>
          </div>
        </header>

        <div
          className="flex flex-col gap-4 lg:flex-row"
          style={{ height: '75vh' }}
          data-testid="comparison-frames"
        >
          <section
            className="flex flex-1 flex-col overflow-hidden rounded-lg border"
            style={{ borderColor: 'var(--skin-surface-border)' }}
          >
            <h2
              className="px-4 py-2 text-xs uppercase tracking-widest"
              style={{
                fontFamily: 'var(--skin-font-display)',
                color: 'var(--skin-title-color)',
                background: 'var(--skin-surface-bg)',
              }}
            >
              {t('designVsFidelity.designSystemColumn', 'Design System /design-system')}
            </h2>
            <ErrorBoundary componentName="Design System IFrame">
              <Suspense fallback={<div className="p-4 text-sm text-slate-300">Loading design system…</div>}>
                <iframe
                  title={t('designVsFidelity.designSystemFrame', 'Design System')}
                  src="/design-system"
                  className="w-full flex-1"
                  style={{ background: 'var(--skin-surface-base)' }}
                  data-testid="design-system-frame"
                />
              </Suspense>
            </ErrorBoundary>
          </section>

          <section
            className="flex flex-1 flex-col overflow-hidden rounded-lg border"
            style={{ borderColor: 'var(--skin-surface-border)' }}
          >
            <h2
              className="px-4 py-2 text-xs uppercase tracking-widest"
              style={{
                fontFamily: 'var(--skin-font-display)',
                color: 'var(--skin-title-color)',
                background: 'var(--skin-surface-bg)',
              }}
            >
              {t('designVsFidelity.visualFidelityColumn', 'Visual Fidelity /visual-fidelity-lab')}
            </h2>
            <ErrorBoundary componentName="Visual Fidelity IFrame">
              <Suspense fallback={<div className="p-4 text-sm text-slate-300">Loading visual fidelity lab…</div>}>
                <iframe
                  title={t('designVsFidelity.visualFidelityFrame', 'Visual Fidelity Lab')}
                  src="/visual-fidelity-lab"
                  className="w-full flex-1"
                  style={{ background: 'var(--skin-surface-base)' }}
                  data-testid="visual-fidelity-frame"
                />
              </Suspense>
            </ErrorBoundary>
          </section>
        </div>

        <section
          className="mt-8 rounded-lg border p-4 sm:p-6"
          style={{ borderColor: 'var(--skin-surface-border)', background: 'var(--skin-surface-bg)' }}
          data-testid="missing-section"
        >
          <h2
            className="mb-4 text-lg uppercase tracking-wide"
            style={{ fontFamily: 'var(--skin-font-display)', color: 'var(--skin-title-color)' }}
          >
            {t('designVsFidelity.missingSection', 'Missing & Mocked Components')}
          </h2>
          <WanderlustRecordList
            columns={[
              { width: '110px', variant: 'caption' },
              { width: '110px', variant: 'caption' },
              { width: '1.5fr', variant: 'body' },
              { width: '2.5fr', variant: 'body' },
            ]}
            records={records}
          />
        </section>
      </div>
    </SkinScope>
  );
}
