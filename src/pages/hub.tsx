/**
 * `/hub` — curated post-mappa2 navigation hub.
 *
 * Unlike the legacy `/test-hub`, this page is intentionally small: it links only
 * durable or active surfaces from the mappa2/HUD workstream, grouped by the kind
 * of decision or inspection the Director needs to make.
 */
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { TestHub, type TestHubSection } from '@/ui/idleVillage/TestHub';

/** Static route metadata for one hub card; user-facing copy stays in i18n. */
interface HubPageSpec {
  id: string;
  path: string;
  icon: string;
  titleKey: string;
  descriptionKey: string;
}

/** Static route metadata for one hub section. */
interface HubSectionSpec {
  id: string;
  titleKey: string;
  pages: readonly HubPageSpec[];
}

const HUB_SECTIONS: readonly HubSectionSpec[] = [
  {
    id: 'now',
    titleKey: 'hub.sections.now',
    pages: [
      {
        id: 'hud-lab',
        path: '/hud-lab',
        icon: '🧱',
        titleKey: 'hub.pages.hudLab.title',
        descriptionKey: 'hub.pages.hudLab.description',
      },
    ],
  },
  {
    id: 'canon',
    titleKey: 'hub.sections.canon',
    pages: [
      {
        id: 'game',
        path: '/game',
        icon: '🎮',
        titleKey: 'hub.pages.game.title',
        descriptionKey: 'hub.pages.game.description',
      },
      {
        id: 'mappa2-lab',
        path: '/mappa2-lab',
        icon: '🗺️',
        titleKey: 'hub.pages.mappa2Lab.title',
        descriptionKey: 'hub.pages.mappa2Lab.description',
      },
    ],
  },
  {
    id: 'hud',
    titleKey: 'hub.sections.hud',
    pages: [
      {
        id: 'hud-compose',
        path: '/hud-compose',
        icon: '🧩',
        titleKey: 'hub.pages.hudCompose.title',
        descriptionKey: 'hub.pages.hudCompose.description',
      },
      {
        id: 'hud-target',
        path: '/hud-target',
        icon: '🎯',
        titleKey: 'hub.pages.hudTarget.title',
        descriptionKey: 'hub.pages.hudTarget.description',
      },
      {
        id: 'hud-layout',
        path: '/hud-layout',
        icon: '📐',
        titleKey: 'hub.pages.hudLayout.title',
        descriptionKey: 'hub.pages.hudLayout.description',
      },
      {
        id: 'hud-real-roster',
        path: '/hud-real-roster',
        icon: '📋',
        titleKey: 'hub.pages.hudRealRoster.title',
        descriptionKey: 'hub.pages.hudRealRoster.description',
      },
      {
        id: 'hud-zanara-roster',
        path: '/hud-zanara-roster',
        icon: '🏔️',
        titleKey: 'hub.pages.hudZanaraRoster.title',
        descriptionKey: 'hub.pages.hudZanaraRoster.description',
      },
      {
        id: 'hud-library',
        path: '/hud-library',
        icon: '📚',
        titleKey: 'hub.pages.hudLibrary.title',
        descriptionKey: 'hub.pages.hudLibrary.description',
      },
      {
        id: 'icon-gallery',
        path: '/icon-gallery',
        icon: '🔆',
        titleKey: 'hub.pages.iconGallery.title',
        descriptionKey: 'hub.pages.iconGallery.description',
      },
    ],
  },
  {
    id: 'review',
    titleKey: 'hub.sections.review',
    pages: [
      {
        id: 'hud-charter-review',
        path: '/hud-charter-review',
        icon: '📜',
        titleKey: 'hub.pages.hudCharterReview.title',
        descriptionKey: 'hub.pages.hudCharterReview.description',
      },
      {
        id: 'hud-compare',
        path: '/hud-compare',
        icon: '⚖️',
        titleKey: 'hub.pages.hudCompare.title',
        descriptionKey: 'hub.pages.hudCompare.description',
      },
      {
        id: 'hud-panel-compare',
        path: '/hud-panel-compare',
        icon: '🪟',
        titleKey: 'hub.pages.hudPanelCompare.title',
        descriptionKey: 'hub.pages.hudPanelCompare.description',
      },
      {
        id: 'hud-defects',
        path: '/hud-defects',
        icon: '🩹',
        titleKey: 'hub.pages.hudDefects.title',
        descriptionKey: 'hub.pages.hudDefects.description',
      },
      {
        id: 'mappa2-upscale-review',
        path: '/mappa2-upscale-review',
        icon: '🔎',
        titleKey: 'hub.pages.mappa2UpscaleReview.title',
        descriptionKey: 'hub.pages.mappa2UpscaleReview.description',
      },
    ],
  },
];

/** Curated post-mappa2 hub for active review and navigation. */
export default function HubPage() {
  const { t } = useTranslation('idleVillage');

  const sections = useMemo<TestHubSection[]>(
    () =>
      HUB_SECTIONS.map((section) => ({
        id: section.id,
        title: t(section.titleKey),
        pages: section.pages.map((page) => ({
          id: page.id,
          path: page.path,
          icon: page.icon,
          title: t(page.titleKey),
          description: t(page.descriptionKey),
        })),
      })),
    [t],
  );

  return (
    <TestHub
      title={t('hub.title')}
      subtitle={t('hub.subtitle')}
      sections={sections}
    />
  );
}
