import type { JSX } from 'react';
import { GenericPoiSkin } from '@/ui/idleVillage/components/minimal/GenericPoiSkin';
import { PoiMatericSkin } from '@/ui/idleVillage/components/minimal/PoiMatericSkin';
import { useTranslation } from '@/localization/useTranslation';

/**
 * A/B preview page for the POI medallion material exploration.
 *
 * Left: canonical GenericPoiSkin (amber/gold default).
 * Right: PoiMatericSkin V2 (stone/bronze config) without touching canonical files.
 */
export default function PoiVisualPreviewPage(): JSX.Element {
  const { t } = useTranslation('idleVillage');

  return (
    <div className="min-h-screen bg-slate-950 p-8 text-amber-50">
      <header className="mb-8 text-center">
        <h1 className="text-2xl font-semibold tracking-wide text-amber-100">
          {t('idleVillage:poiVisualPreview.title')}
        </h1>
        <p className="mt-2 text-sm text-amber-200/60">
          GenericPoiSkin base medallion V2 — Materic stone/bronze aesthetic
        </p>
      </header>

      <div className="mx-auto grid max-w-4xl grid-cols-1 gap-8 md:grid-cols-2">
        <section
          className="flex flex-col items-center gap-6 rounded-2xl border border-amber-500/20 bg-slate-900/50 p-8"
          aria-labelledby="poi-v1-heading"
        >
          <h2 id="poi-v1-heading" className="text-sm uppercase tracking-[0.2em] text-amber-200/80">
            {t('idleVillage:poiVisualPreview.v1Label')}
          </h2>
          <GenericPoiSkin icon="🗺" label="Amber" progress={0.75} size={120} />
          <GenericPoiSkin icon="⚔" label="Amber Quest" progress={0.4} shape="stone" size={120} />
        </section>

        <section
          className="flex flex-col items-center gap-6 rounded-2xl border border-amber-500/20 bg-slate-900/50 p-8"
          aria-labelledby="poi-v2-heading"
        >
          <h2 id="poi-v2-heading" className="text-sm uppercase tracking-[0.2em] text-amber-200/80">
            {t('idleVillage:poiVisualPreview.v2Label')}
          </h2>
          <PoiMatericSkin icon="🗿" label="Materic" progress={0.75} size={120} />
          <PoiMatericSkin icon="⚔" label="Materic Quest" progress={0.4} size={120} />
        </section>
      </div>
    </div>
  );
}
