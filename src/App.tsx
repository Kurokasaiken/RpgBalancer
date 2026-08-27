import { useCallback, useEffect, useRef, useState, lazy, Suspense } from 'react';
import { FantasyLayout } from './ui/fantasy/FantasyLayout';
import { ErrorBoundary } from './ui/organisms/ErrorBoundary';
import { SpellCreatorNew } from './ui/spells/SpellCreatorNew';
import { useIdleVillageConfig } from '@/balancing/hooks/useIdleVillageConfig';
import { useIsMobile } from '@/hooks/useMediaQuery';
import { LQAProvider } from '@/localization/LQAProvider';
import {
  DEFAULT_LANDING_TAB_ID,
  isValidNavTabId,
  type AppNavTabId,
} from '@/shared/navigation/navConfig';
import { applyPerfTier } from './ui/idleVillage/skins/perfTier';
import { applySkinCssVariables } from './ui/idleVillage/skins/skinCssVariables';

// Detect device capability → data-perf-tier on <html> gates parallax/WebGL.
applyPerfTier();
// Apply V9 Obsidian skin tokens globally so --skin-* vars exist from boot.
applySkinCssVariables('base');
const MinimalGameplayPage = lazy(() => import('./ui/idleVillage/MinimalGameplayPage'));
const GameplayTestPage = lazy(() => import('./ui/idleVillage/components/GameplayTestPage'));
const GameplayTestSimple = lazy(() => import('./ui/idleVillage/components/GameplayTestSimple'));
const GameplayTestMinimal = lazy(() => import('./ui/idleVillage/components/GameplayTestMinimal'));
const TestRosterPage = lazy(() => import('./ui/idleVillage/TestRosterPage'));
const TestHub = lazy(() => import('./ui/idleVillage/TestHub').then(m => ({ default: m.TestHub })));
const MissingHub = lazy(() => import('./ui/idleVillage/MissingHub').then(m => ({ default: m.MissingHub })));
const SteamTrailerHub = lazy(() => import('./ui/idleVillage/SteamTrailerHub').then(m => ({ default: m.SteamTrailerHub })));
const IdleVillageConfigRoute = lazy(() => import('./pages/idle-village-config'));
const StyleLabDemoPage = lazy(() => import('./pages/style-lab-demo'));
const DesignSystemPage = lazy(() => import('./pages/design-system'));
const DesignVsFidelityPage = lazy(() => import('./pages/design-vs-fidelity'));
const PrimitivesPage = lazy(() => import('./pages/primitives').then(m => ({ default: m.default })));
const V9SkinSandbox = lazy(() => import('./pages/v9-skin-sandbox').then(m => ({ default: m.V9SkinSandbox })));
const VisualGrammarValidationPage = lazy(() => import('./ui/visualGrammarValidation/VisualGrammarValidationPage').then(m => ({ default: m.VisualGrammarValidationPage })));
const VisualFidelityLabPage = lazy(() => import('./ui/visualFidelityLab/VisualFidelityLabPage').then(m => ({ default: m.VisualFidelityLabPage })));
const HarmonizationGalleryPage = lazy(() => import('./ui/visualFidelityLab/HarmonizationGallery').then(m => ({ default: m.HarmonizationGallery })));
const PoiCoronaHaloLabPage = lazy(() => import('./ui/visualFidelityLab/PoiCoronaHaloLab').then(m => ({ default: m.PoiCoronaHaloLab })));
const PoiDetailVerificationPage = lazy(() => import('./ui/idleVillage/pages/PoiDetailVerificationPage').then(m => ({ default: m.PoiDetailVerificationPage })));
const PoiDetailQuestRosterIntegrationPage = lazy(() => import('./ui/idleVillage/pages/PoiDetailQuestRosterIntegrationPage').then(m => ({ default: m.default })));
const PoiDetailJobRosterIntegrationPage = lazy(() => import('./ui/idleVillage/pages/PoiDetailJobRosterIntegrationPage').then(m => ({ default: m.default })));
const PoiStandardDetailIntegrationPage = lazy(() => import('./ui/idleVillage/pages/PoiStandardDetailIntegrationPage').then(m => ({ default: m.PoiStandardDetailIntegrationPage })));
const TimeDaynightIntegrationPage = lazy(() => import('./ui/idleVillage/pages/TimeDaynightIntegrationPage').then(m => ({ default: m.TimeDaynightIntegrationPage })));
const DragPoiAssignmentPage = lazy(() => import('./ui/idleVillage/pages/DragPoiAssignmentPage').then(m => ({ default: m.DragPoiAssignmentPage })));
const DragPoiIntegrationPage = lazy(() => import('./ui/idleVillage/pages/DragPoiIntegrationPage').then(m => ({ default: m.DragPoiIntegrationPage })));
const SlotPage = lazy(() => import('./ui/idleVillage/pages/SlotPage').then(m => ({ default: m.default })));
// Minimal slice test pages (Phase 1-6)
const MinimalPoiPage = lazy(() => import('./pages/minimal-poi').then(m => ({ default: m.default })));
const MinimalRosterPage = lazy(() => import('./pages/minimal-roster').then(m => ({ default: m.default })));
const MinimalRosterSlotIntegrationPage = lazy(() => import('./pages/minimal-roster-slot-integration').then(m => ({ default: m.default })));
const MinimalClockPage = lazy(() => import('./pages/minimal-clock').then(m => ({ default: m.default })));
const DayNightPoiSkinDebugPage = lazy(() => import('./pages/day-night-poi-skin-debug').then(m => ({ default: m.default })));
const MinimalSlotRackPage = lazy(() => import('./pages/minimal-slotRack').then(m => ({ default: m.default })));
const MinimalResourceHUDPage = lazy(() => import('./pages/minimal-resourcehud').then(m => ({ default: m.default })));
const MinimalQuestCardPage = lazy(() => import('./pages/minimal-questcard').then(m => ({ default: m.default })));
const MinimalSkillCheckPage = lazy(() => import('./pages/minimal-skillcheck').then(m => ({ default: m.default })));
const MinimalSkillCheckV6Page = lazy(() => import('./pages/minimal-skillcheck-v6').then(m => ({ default: m.default })));
const MinimalDestinyAstrolabePage = lazy(() => import('./pages/minimal-destiny-astrolabe').then(m => ({ default: m.default })));
const MinimalDestinyAstrolabeV2Page = lazy(() => import('./pages/minimal-destiny-astrolabe-v2').then(m => ({ default: m.default })));
const MinimalDestinyAstrolabeV3Page = lazy(() => import('./pages/minimal-destiny-astrolabe-v3').then(m => ({ default: m.default })));
const MinimalDestinyAstrolabeV4Page = lazy(() => import('./pages/minimal-destiny-astrolabe-v4').then(m => ({ default: m.default })));
const MinimalDestinyAstrolabeV5Page = lazy(() => import('./pages/minimal-destiny-astrolabe-v5').then(m => ({ default: m.default })));
const MinimalDestinyAstrolabeV6Page = lazy(() => import('./pages/minimal-destiny-astrolabe-v6').then(m => ({ default: m.default })));
const MinimalDestinyAstrolabeV62Page = lazy(() => import('./pages/minimal-destiny-astrolabe-v6-2').then(m => ({ default: m.default })));
const MinimalDestinyAstrolabeV7Page = lazy(() => import('./pages/minimal-destiny-astrolabe-v7').then(m => ({ default: m.default })));
const MinimalDestinyAstrolabeV8Page = lazy(() => import('./pages/minimal-destiny-astrolabe-v8').then(m => ({ default: m.default })));
const MinimalDestinyAstrolabeV9Page = lazy(() => import('./pages/minimal-destiny-astrolabe-v9').then(m => ({ default: m.default })));
const MinimalDestinyAstrolabeV10Page = lazy(() => import('./pages/minimal-destiny-astrolabe-v10').then(m => ({ default: m.default })));
const SkillCheckWebV1Page = lazy(() => import('./pages/skill-check-web-v1').then(m => ({ default: m.default })));
const SkillCheckV15Page = lazy(() => import('./pages/skill-check-v15').then(m => ({ default: m.default })));
const SkillCheckV16Page = lazy(() => import('./pages/skill-check-v16').then(m => ({ default: m.default })));
const AdversaryShapesPage = lazy(() => import('./pages/adversary-shapes').then(m => ({ default: m.default })));
const HeroComponentsLabPage = lazy(() => import('./pages/hero-components-lab').then(m => ({ default: m.default })));
const MinimalOutcomeModalPage = lazy(() => import('./pages/minimal-outcome').then(m => ({ default: m.default })));
const MinimalMarketActionCardPage = lazy(() => import('./pages/minimal-market-page').then(m => ({ default: m.default })));
const MinimalJobPoiRosterIntegrationPage = lazy(() => import('./pages/minimal-job-poi-roster-integration').then(m => ({ default: m.default })));
const MinimalJobPoiRosterTimeIntegrationPage = lazy(() => import('./pages/minimal-job-poi-roster-time-integration').then(m => ({ default: m.default })));
const MinimalTimeDaynightIntegrationPage = lazy(() => import('./pages/minimal-time-daynight-integration').then(m => ({ default: m.default })));
const SpellCreatorTestPage = lazy(() => import('./pages/spell-creator').then(m => ({ default: m.default })));
const EquipmentCreatorPage = lazy(() => import('./pages/equipment-creator').then(m => ({ default: m.default })));
const EquipmentLibraryPage = lazy(() => import('./pages/equipment-library').then(m => ({ default: m.default })));
const TrailerViewer = lazy(() => import('./ui/idleVillage/trailer/TrailerViewer'));
const TrailerThreatIter = lazy(() => import('./ui/idleVillage/trailer/TrailerThreatIter'));
const TrailerThreatPage = lazy(() => import('./ui/idleVillage/trailer/TrailerThreatPage').then(m => ({ default: m.TrailerThreatPage })));
const TrailerChoicePage = lazy(() => import('./ui/idleVillage/trailer/TrailerChoicePage').then(m => ({ default: m.TrailerChoicePage })));
const TrailerPreparationPage = lazy(() => import('./ui/idleVillage/trailer/TrailerPreparationPage').then(m => ({ default: m.TrailerPreparationPage })));
const TrailerRiskPage = lazy(() => import('./ui/idleVillage/trailer/TrailerRiskPage').then(m => ({ default: m.TrailerRiskPage })));
const TrailerConsequencePage = lazy(() => import('./ui/idleVillage/trailer/TrailerConsequencePage').then(m => ({ default: m.TrailerConsequencePage })));
const TrailerLegacyPage = lazy(() => import('./ui/idleVillage/trailer/TrailerLegacyPage').then(m => ({ default: m.TrailerLegacyPage })));
const TrailerOutroPage = lazy(() => import('./ui/idleVillage/trailer/TrailerOutroPage').then(m => ({ default: m.TrailerOutroPage })));
const WorldSurfaceTestPage = lazy(() => import('./ui/idleVillage/pages/WorldSurfaceTestPage').then(m => ({ default: m.WorldSurfaceTestPage })));
const WorldPresentationDirectorPage = lazy(() => import('./ui/idleVillage/pages/WorldPresentationDirectorPage').then(m => ({ default: m.default })));
const PoiVisualPreviewPage = lazy(() => import('./ui/idleVillage/pages/PoiVisualPreviewPage').then(m => ({ default: m.default })));
const UseClientPage = lazy(() => import('./ui/idleVillage/pages/UseClientPage').then(m => ({ default: m.default })));
const PoiMarkerLabPage = lazy(() => import('./ui/idleVillage/pages/PoiMarkerLabPage').then(m => ({ default: m.PoiMarkerLabPage })));
const PoiDetailQuestRosterTimeClockIntegrationPage = lazy(() => import('./ui/idleVillage/pages/PoiDetailQuestRosterTimeClockIntegrationPage').then(m => ({ default: m.default })));
const MockupToComponentPage = lazy(() => import('./ui/idleVillage/pages/MockupToComponentPage').then(m => ({ default: m.MockupToComponentPage })));
const MinimalSlottedMedalPage = lazy(() => import('./pages/minimal-slottedmedal').then(m => ({ default: m.default })));

interface AppNavControls {
  getActiveTab: () => AppNavTabId;
  setActiveTab: (tabId: AppNavTabId) => void;
}

declare global {
  interface Window {
    __appNavControls?: AppNavControls;
    __idleVillageReady?: boolean;
  }
}

const Balancer = lazy(() =>
  import('./ui/balancing/Balancer').then((m) => ({ default: m.Balancer }))
);
const MoodboardPage = lazy(() =>
  import('./ui/moodboard/MoodboardPage').then((m) => ({ default: m.MoodboardPage }))
);
const StoryboardPage = lazy(() =>
  import('./pages/storyboard').then((m) => ({ default: m.default }))
);
const MoodboardSkeleton = () => (
  <div className="moodboard-shell" data-testid="moodboard-content" data-moodboard="true" aria-busy="true">
    <div className="moodboard-shell__grid animate-pulse p-6 text-slate-400">
      <div className="moodboard-main space-y-6">
        <header>
          <p className="moodboard-kicker">Moodboard</p>
          <h1 className="moodboard-title">Inspiration Deck</h1>
          <p className="moodboard-subcopy">Preparazione assets…</p>
        </header>
        <div className="h-96 rounded-3xl border border-white/10 bg-white/5" />
        <div className="moodboard-panel moodboard-panel--dashed h-60" />
      </div>
      <aside className="moodboard-sidebar space-y-4">
        <div className="h-40 rounded-3xl border border-white/10 bg-white/5" />
        <div className="h-32 rounded-3xl border border-white/10 bg-white/5" />
      </aside>
    </div>
  </div>
);
const PromptAndBibleStylePage = lazy(() =>
  import('./ui/prompts/PromptAndBibleStylePage').then((m) => ({ default: m.PromptAndBibleStylePage ?? m.default }))
);
const WanderlustMockupPage = lazy(() =>
  import('./ui/wanderlust/WanderlustMockupPage').then((m) => ({ default: m.WanderlustMockupPage }))
);
const MINIMAL_MODE_ENABLED = typeof process !== 'undefined' && process.env?.MINIMAL_MODE === 'true';

const ALLOWED_TABS: AppNavTabId[] = [
  'balancer',
  'spellCreationNew',
  'moodboard',
  'promptBible',
  'styleLabDemo',
  'idleVillageConfig',
  'minimalGameplay',
  'storyboard',
  'test',
  'testHub',
  'wanderlust',
];

const allowedTabSet = new Set(ALLOWED_TABS);

const enforceAllowedTab = (tabId: AppNavTabId): AppNavTabId => {
  if (allowedTabSet.has(tabId)) {
    return tabId;
  }
  return 'minimalGameplay';
};

function App() {
  const isMinimalGameplayPath =
    typeof window !== 'undefined' && window.location.pathname === '/minimal-gameplay';
  const isGameplayPath =
    typeof window !== 'undefined' && window.location.pathname === '/gameplay';
  const isSimplePath =
    typeof window !== 'undefined' && window.location.pathname === '/simple';
  const isMinimalPath =
    typeof window !== 'undefined' && window.location.pathname === '/minimal';
  const isTestPath =
    typeof window !== 'undefined' && window.location.pathname === '/test';
  const isTestHubPath =
    typeof window !== 'undefined' && window.location.pathname === '/test-hub';
  const isMissingHubPath =
    typeof window !== 'undefined' && window.location.pathname === '/missing-hub';
  const isSteamTrailerHubPath =
    typeof window !== 'undefined' && window.location.pathname === '/test-hub/steam-trailer-hub';
  const isV9SkinSandboxPath =
    typeof window !== 'undefined' &&
    ['/v9-skin-sandbox', '/skin-lab', '/skin-sandbox'].includes(window.location.pathname);
  const isDesignSystemPath =
    typeof window !== 'undefined' && window.location.pathname === '/design-system';
  const isPrimitivesPath =
    typeof window !== 'undefined' && window.location.pathname === '/primitives';
  const isDesignVsFidelityPath =
    typeof window !== 'undefined' && window.location.pathname === '/design-vs-fidelity';
  const isVisualGrammarValidationPath =
    typeof window !== 'undefined' && window.location.pathname === '/visual-grammar-validation';
  const isVisualFidelityLabPath =
    typeof window !== 'undefined' && window.location.pathname === '/visual-fidelity-lab';
  const isHarmonizationGalleryPath =
    typeof window !== 'undefined' && window.location.pathname === '/harmonization-gallery';
  const isPoiCoronaHaloLabPath =
    typeof window !== 'undefined' && window.location.pathname === '/poi-corona-lab';
  const isPoiDetailVerificationPath =
    typeof window !== 'undefined' && window.location.pathname === '/poi-detail-verification';
  const isPoiQuestDetailRosterIntegrationPath =
    typeof window !== 'undefined' && window.location.pathname === '/poi-quest-detail-roster-integration';
  const isPoiJobDetailRosterIntegrationPath =
    typeof window !== 'undefined' && window.location.pathname === '/poi-job-detail-roster-integration';
  const isPoiStandardDetailIntegrationPath =
    typeof window !== 'undefined' && window.location.pathname === '/poi-standard-detail-integration';
  const isTimeDaynightIntegrationPath =
    typeof window !== 'undefined' && window.location.pathname === '/time-daynight-integration';
  const isDragPoiAssignmentPath =
    typeof window !== 'undefined' && window.location.pathname === '/drag-poi-assignment';
  const isDragPoiIntegrationPath =
    typeof window !== 'undefined' && window.location.pathname === '/drag-poi-integration';
  const isSlotPath =
    typeof window !== 'undefined' && window.location.pathname === '/slot';
  // Minimal slice test pages (Phase 1-6)
  const isMinimalPoiPath =
    typeof window !== 'undefined' && window.location.pathname === '/minimal-poi';
  const isMinimalRosterPath =
    typeof window !== 'undefined' && window.location.pathname === '/minimal-roster';
  const isMinimalRosterSlotIntegrationPath =
    typeof window !== 'undefined' && window.location.pathname === '/minimal-roster-slot-integration';
  const isDayNightPoiSkinDebugPath =
    typeof window !== 'undefined' && window.location.pathname === '/day-night-poi-skin-debug';
  const isMinimalClockPath =
    typeof window !== 'undefined' && window.location.pathname === '/minimal-clock';
  const isMinimalSlotRackPath =
    typeof window !== 'undefined' && window.location.pathname === '/minimal-slotRack';
  const isMinimalSlottedMedalPath =
    typeof window !== 'undefined' && window.location.pathname === '/minimal-slottedmedal';
  const isMinimalResourceHUDPath =
    typeof window !== 'undefined' && window.location.pathname === '/minimal-resourcehud';
  const isMinimalQuestCardPath =
    typeof window !== 'undefined' && window.location.pathname === '/minimal-questcard';
  const isMinimalSkillCheckPath =
    typeof window !== 'undefined' && window.location.pathname === '/minimal-skillcheck';
  const isMinimalSkillCheckV6Path =
    typeof window !== 'undefined' && window.location.pathname === '/minimal-skillcheck-v6';
  const isMinimalDestinyAstrolabePath =
    typeof window !== 'undefined' && window.location.pathname === '/minimal-destiny-astrolabe';
  const isMinimalDestinyAstrolabeV2Path =
    typeof window !== 'undefined' && window.location.pathname === '/minimal-destiny-astrolabe-v2';
  const isMinimalDestinyAstrolabeV3Path =
    typeof window !== 'undefined' && window.location.pathname === '/minimal-destiny-astrolabe-v3';
  const isMinimalDestinyAstrolabeV4Path =
    typeof window !== 'undefined' && window.location.pathname === '/minimal-destiny-astrolabe-v4';
  const isMinimalDestinyAstrolabeV5Path =
    typeof window !== 'undefined' && window.location.pathname === '/minimal-destiny-astrolabe-v5';
  const isMinimalDestinyAstrolabeV6Path =
    typeof window !== 'undefined' && window.location.pathname === '/minimal-destiny-astrolabe-v6';
  const isMinimalDestinyAstrolabeV62Path =
    typeof window !== 'undefined' && window.location.pathname === '/minimal-destiny-astrolabe-v6-2';
  const isMinimalDestinyAstrolabeV7Path =
    typeof window !== 'undefined' && window.location.pathname === '/minimal-destiny-astrolabe-v7';
  const isMinimalDestinyAstrolabeV10Path =
    typeof window !== 'undefined' && window.location.pathname === '/minimal-destiny-astrolabe-v10';
  const isMinimalDestinyAstrolabeV8Path =
    typeof window !== 'undefined' && window.location.pathname === '/minimal-destiny-astrolabe-v8';
  const isMinimalDestinyAstrolabeV9Path =
    typeof window !== 'undefined' && window.location.pathname === '/minimal-destiny-astrolabe-v9';
  const isSkillCheckWebV1Path =
    typeof window !== 'undefined' && window.location.pathname === '/skill-check-web-v1';
  const isSkillCheckV16Path =
    typeof window !== 'undefined' &&
    (window.location.pathname === '/skill-check-v16' ||
     window.location.pathname === '/minimal-destiny-astrolabe-v16');
  const isSkillCheckV15Path =
    typeof window !== 'undefined' &&
    (window.location.pathname === '/skill-check-v15' ||
     window.location.pathname === '/minimal-destiny-astrolabe-v15');
  const isAdversaryShapesPath =
    typeof window !== 'undefined' && window.location.pathname === '/adversary-shapes';
  const isHeroComponentsLabPath =
    typeof window !== 'undefined' && window.location.pathname === '/hero-components-lab';
  const isMinimalOutcomeModalPath =
    typeof window !== 'undefined' && window.location.pathname === '/minimal-outcome';
  const isMinimalMarketActionCardPath =
    typeof window !== 'undefined' && window.location.pathname === '/minimal-market';
  const isMinimalJobPoiRosterIntegrationPath =
    typeof window !== 'undefined' && window.location.pathname === '/minimal-job-poi-roster-integration';
  const isMinimalJobPoiRosterTimeIntegrationPath =
    typeof window !== 'undefined' && window.location.pathname === '/minimal-job-poi-roster-time-integration';
  const isMinimalTimeDaynightIntegrationPath =
    typeof window !== 'undefined' && window.location.pathname === '/minimal-time-daynight-integration';
  const isSpellCreatorPath =
    typeof window !== 'undefined' && window.location.pathname === '/spell-creator';
  const isEquipmentCreatorPath =
    typeof window !== 'undefined' && window.location.pathname === '/equipment-creator';
  const isEquipmentLibraryPath =
    typeof window !== 'undefined' && window.location.pathname === '/equipment-library';
  const isTrailerPath =
    typeof window !== 'undefined' && window.location.pathname === '/trailer';
  const isTrailerThreatPath =
    typeof window !== 'undefined' && window.location.pathname === '/trailer-threat';
  const isTrailerChoicePath =
    typeof window !== 'undefined' && window.location.pathname === '/trailer-choice';
  const isTrailerPreparationPath =
    typeof window !== 'undefined' && window.location.pathname === '/trailer-preparation';
  const isTrailerRiskPath =
    typeof window !== 'undefined' && window.location.pathname === '/trailer-risk';
  const isTrailerConsequencePath =
    typeof window !== 'undefined' && window.location.pathname === '/trailer-consequence';
  const isTrailerLegacyPath =
    typeof window !== 'undefined' && window.location.pathname === '/trailer-legacy';
  const isTrailerOutroPath =
    typeof window !== 'undefined' && window.location.pathname === '/trailer-outro';
  const isTrailerThreatIterPath =
    typeof window !== 'undefined' && window.location.pathname === '/trailer-threat-iter';
  const isMockupToComponentPath =
    typeof window !== 'undefined' && window.location.pathname === '/mockup-to-component';
  const isWorldSurfacePath =
    typeof window !== 'undefined' && window.location.pathname === '/world-surface';
  const isWorldPresentationDirectorPath =
    typeof window !== 'undefined' && window.location.pathname === '/world-presentation-director';
  const isPoiVisualPreviewPath =
    typeof window !== 'undefined' && window.location.pathname === '/poi-visual-preview';
  const isUseClientPath =
    typeof window !== 'undefined' && window.location.pathname === '/use-client';
  const isPoiMarkerLabPath =
    typeof window !== 'undefined' && window.location.pathname === '/poi-marker-lab';
  const isPoiQuestDetailRosterTimeClockIntegrationPath =
    typeof window !== 'undefined' && window.location.pathname === '/poi-quest-detail-roster-time-clock';
  const isRootPath =
    typeof window !== 'undefined' &&
    (window.location.pathname === '/' || window.location.pathname === '/index.html');
  const shouldRedirectToMinimalMode = MINIMAL_MODE_ENABLED && isRootPath && !isMinimalGameplayPath;

  const { config, initialized, isInitializing, initializeConfig } = useIdleVillageConfig();
  const isMobile = useIsMobile();

  const getInitialTab = useCallback((): AppNavTabId => {
    // Priority 1: URL parameter (for deep linking and tests)
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get('tab');
      if (tabParam && isValidNavTabId(tabParam)) {
        return enforceAllowedTab(tabParam);
      }

      // Priority 2: Hash-based navigation fallback
      const hash = window.location.hash.replace('#', '');
      if (hash && isValidNavTabId(hash)) {
        return enforceAllowedTab(hash);
      }
    }

    // Priority 3: Configured preference
    if (initialized && !isInitializing) {
      const preferred = config.uiPreferences?.defaultAppTabId;
      if (preferred && isValidNavTabId(preferred)) {
        return enforceAllowedTab(preferred);
      }
    }
    if (isMobile) {
      return enforceAllowedTab('moodboard');
    }
    const defaultTab = enforceAllowedTab(DEFAULT_LANDING_TAB_ID);
    return defaultTab;
  }, [config.uiPreferences, initialized, isInitializing, isMobile]);

  const [activeTab, setActiveTab] = useState<AppNavTabId>(getInitialTab);
  const hasAppliedMobileLanding = useRef(false);

  useEffect(() => {
    if (hasAppliedMobileLanding.current) {
      return;
    }
    if (isMobile && activeTab === enforceAllowedTab(DEFAULT_LANDING_TAB_ID)) {
      hasAppliedMobileLanding.current = true;
      setActiveTab(enforceAllowedTab('moodboard'));
    }
  }, [activeTab, isMobile]);

  // Listen for spell creation navigation from SpellLibrary
  useEffect(() => {
    if (shouldRedirectToMinimalMode) {
      window.location.replace('/minimal-gameplay');
    }
  }, [shouldRedirectToMinimalMode]);

  useEffect(() => {
    const handleNavigate = () => setActiveTab('spellCreationNew');
    window.addEventListener('navigate-spell-creation', handleNavigate as EventListener);
    return () => window.removeEventListener('navigate-spell-creation', handleNavigate as EventListener);
  }, []);

  useEffect(() => {
    void initializeConfig();
  }, [initializeConfig]);

  const idleVillageReady = initialized && !isInitializing;

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    window.__idleVillageReady = idleVillageReady;
    return () => {
      if (window.__idleVillageReady === idleVillageReady) {
        delete window.__idleVillageReady;
      }
    };
  }, [idleVillageReady]);

  const idleVillageLoadingFallback = (
    <div className="p-4 text-xs text-slate-300">Loading Idle Village configuration…</div>
  );

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const syncFromLocation = () => {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get('tab');
      const hashTab = window.location.hash.replace('#', '');
      const targetTab = tabParam ?? hashTab;
      if (targetTab && isValidNavTabId(targetTab)) {
        const enforced = enforceAllowedTab(targetTab);
        if (enforced !== activeTab) {
          setActiveTab(enforced);
        }
      }
    };

    syncFromLocation();
    window.addEventListener('hashchange', syncFromLocation);
    window.addEventListener('popstate', syncFromLocation);

    return () => {
      window.removeEventListener('hashchange', syncFromLocation);
      window.removeEventListener('popstate', syncFromLocation);
    };
  }, [activeTab]);

  useEffect(() => {
    const controls: AppNavControls = {
      getActiveTab: () => activeTab,
      setActiveTab: (tabId: AppNavTabId) => {
        if (isValidNavTabId(tabId)) {
          const enforced = enforceAllowedTab(tabId);
          setActiveTab(enforced);
        }
      },
    };
    window.__appNavControls = controls;
    return () => {
      if (window.__appNavControls === controls) {
        delete window.__appNavControls;
      }
    };
  }, [activeTab]);

  if (shouldRedirectToMinimalMode) {
    return (
      <div
        data-testid="minimal-mode-redirect"
        className="flex min-h-screen items-center justify-center bg-black text-amber-100"
      >
        <p>Redirecting to Minimal Gameplay…</p>
      </div>
    );
  }

  if (isTestPath) {
    return (
      <ErrorBoundary componentName="Test Roster Page">
        <Suspense fallback={<div className="p-4 text-xs text-slate-300">Loading Test Harness…</div>}>
          <TestRosterPage />
        </Suspense>
      </ErrorBoundary>
    );
  }

  if (isSteamTrailerHubPath) {
    return (
      <ErrorBoundary componentName="Steam Trailer Hub">
        <Suspense fallback={<div className="p-4 text-xs text-slate-300">Loading Steam Trailer Hub…</div>}>
          <SteamTrailerHub />
        </Suspense>
      </ErrorBoundary>
    );
  }

  if (isTestHubPath) {
    return (
      <ErrorBoundary componentName="Test Hub">
        <Suspense fallback={<div className="p-4 text-xs text-slate-300">Loading Test Hub…</div>}>
          <TestHub />
        </Suspense>
      </ErrorBoundary>
    );
  }

  if (isMissingHubPath) {
    return (
      <ErrorBoundary componentName="Missing Hub">
        <Suspense fallback={<div className="p-4 text-xs text-slate-300">Loading Missing Hub…</div>}>
          <MissingHub />
        </Suspense>
      </ErrorBoundary>
    );
  }

  if (isSlotPath) {
    return (
      <ErrorBoundary componentName="Slot Page">
        <Suspense fallback={<div className="p-4 text-xs text-slate-300">Loading Slot Test…</div>}>
          <SlotPage />
        </Suspense>
      </ErrorBoundary>
    );
  }

  // Minimal slice test pages (Phase 1+)
  if (isMinimalPoiPath) {
    return (
      <ErrorBoundary componentName="Minimal POI Page">
        <Suspense fallback={<div className="p-4 text-xs text-slate-300">Loading POI Test…</div>}>
          <MinimalPoiPage />
        </Suspense>
      </ErrorBoundary>
    );
  }

  if (isMinimalRosterPath) {
    return (
      <ErrorBoundary componentName="Minimal Roster Page">
        <Suspense fallback={<div className="p-4 text-xs text-slate-300">Loading Roster Test…</div>}>
          <MinimalRosterPage />
        </Suspense>
      </ErrorBoundary>
    );
  }

  if (isMinimalRosterSlotIntegrationPath) {
    return (
      <ErrorBoundary componentName="Minimal Roster Slot Integration Page">
        <Suspense fallback={<div className="p-4 text-xs text-slate-300">Loading Roster + SlotRack…</div>}>
          <MinimalRosterSlotIntegrationPage />
        </Suspense>
      </ErrorBoundary>
    );
  }

  if (isDayNightPoiSkinDebugPath) {
    return (
      <ErrorBoundary componentName="Day Night POI Skin Debug Page">
        <Suspense fallback={<div className="p-4 text-xs text-slate-300">Loading Day/Night Debug…</div>}>
          <DayNightPoiSkinDebugPage />
        </Suspense>
      </ErrorBoundary>
    );
  }

  if (isMinimalClockPath) {
    return (
      <ErrorBoundary componentName="Minimal Clock Page">
        <Suspense fallback={<div className="p-4 text-xs text-slate-300">Loading Clock Test…</div>}>
          <MinimalClockPage />
        </Suspense>
      </ErrorBoundary>
    );
  }

  if (isMinimalSlotRackPath) {
    return (
      <ErrorBoundary componentName="Minimal SlotRack Page">
        <Suspense fallback={<div className="p-4 text-xs text-slate-300">Loading SlotRack Test…</div>}>
          <MinimalSlotRackPage />
        </Suspense>
      </ErrorBoundary>
    );
  }

  if (isMinimalSlottedMedalPath) {
    return (
      <ErrorBoundary componentName="Minimal SlottedMedal Page">
        <Suspense fallback={<div className="p-4 text-xs text-slate-300">Loading SlottedMedal Test…</div>}>
          <MinimalSlottedMedalPage />
        </Suspense>
      </ErrorBoundary>
    );
  }

  if (isMinimalResourceHUDPath) {
    return (
      <ErrorBoundary componentName="Minimal ResourceHUD Page">
        <Suspense fallback={<div className="p-4 text-xs text-slate-300">Loading ResourceHUD Test…</div>}>
          <MinimalResourceHUDPage />
        </Suspense>
      </ErrorBoundary>
    );
  }

  if (isMinimalQuestCardPath) {
    return (
      <ErrorBoundary componentName="Minimal QuestCard Page">
        <Suspense fallback={<div className="p-4 text-xs text-slate-300">Loading QuestCard Test…</div>}>
          <MinimalQuestCardPage />
        </Suspense>
      </ErrorBoundary>
    );
  }

  if (isMinimalSkillCheckPath) {
    return (
      <ErrorBoundary componentName="Minimal SkillCheck Page">
        <Suspense fallback={<div className="p-4 text-xs text-slate-300">Loading SkillCheck Test…</div>}>
          <MinimalSkillCheckPage />
        </Suspense>
      </ErrorBoundary>
    );
  }

  if (isMinimalSkillCheckV6Path) {
    return (
      <ErrorBoundary componentName="Minimal SkillCheck V6 Page">
        <Suspense fallback={<div className="p-4 text-xs text-slate-300">Loading SkillCheck V6…</div>}>
          <MinimalSkillCheckV6Page />
        </Suspense>
      </ErrorBoundary>
    );
  }

  if (isMinimalDestinyAstrolabePath) {
    return (
      <ErrorBoundary componentName="Minimal Destiny Astrolabe Page">
        <Suspense fallback={<div className="p-4 text-xs text-slate-300">Loading Destiny Astrolabe…</div>}>
          <MinimalDestinyAstrolabePage />
        </Suspense>
      </ErrorBoundary>
    );
  }

  if (isMinimalDestinyAstrolabeV2Path) {
    return (
      <ErrorBoundary componentName="Minimal Destiny Astrolabe V2 Page">
        <Suspense fallback={<div className="p-4 text-xs text-slate-300">Loading Destiny Astrolabe V2…</div>}>
          <MinimalDestinyAstrolabeV2Page />
        </Suspense>
      </ErrorBoundary>
    );
  }

  if (isMinimalDestinyAstrolabeV3Path) {
    return (
      <ErrorBoundary componentName="Minimal Destiny Astrolabe V3 Page">
        <Suspense fallback={<div className="p-4 text-xs text-slate-300">Loading Destiny Astrolabe V3…</div>}>
          <MinimalDestinyAstrolabeV3Page />
        </Suspense>
      </ErrorBoundary>
    );
  }

  if (isMinimalDestinyAstrolabeV4Path) {
    return (
      <ErrorBoundary componentName="Minimal Destiny Astrolabe V4 Page">
        <Suspense fallback={<div className="p-4 text-xs text-slate-300">Loading Destiny Astrolabe V4…</div>}>
          <MinimalDestinyAstrolabeV4Page />
        </Suspense>
      </ErrorBoundary>
    );
  }

  if (isMinimalDestinyAstrolabeV5Path) {
    return (
      <ErrorBoundary componentName="Minimal Destiny Astrolabe V5 Page">
        <Suspense fallback={<div className="p-4 text-xs text-slate-300">Loading Destiny Astrolabe V5…</div>}>
          <MinimalDestinyAstrolabeV5Page />
        </Suspense>
      </ErrorBoundary>
    );
  }

  if (isMinimalDestinyAstrolabeV6Path) {
    return (
      <ErrorBoundary componentName="Minimal Destiny Astrolabe V6 Page">
        <Suspense fallback={<div className="p-4 text-xs text-slate-300">Loading Destiny Astrolabe V6…</div>}>
          <MinimalDestinyAstrolabeV6Page />
        </Suspense>
      </ErrorBoundary>
    );
  }

  if (isMinimalDestinyAstrolabeV62Path) {
    return (
      <ErrorBoundary componentName="Minimal Destiny Astrolabe V6.2 Page">
        <Suspense fallback={<div className="p-4 text-xs text-slate-300">Loading Destiny Astrolabe V6.2…</div>}>
          <MinimalDestinyAstrolabeV62Page />
        </Suspense>
      </ErrorBoundary>
    );
  }

  if (isMinimalDestinyAstrolabeV7Path) {
    return (
      <ErrorBoundary componentName="Minimal Destiny Astrolabe V7 Page">
        <Suspense fallback={<div className="p-4 text-xs text-slate-300">Loading Destiny Astrolabe V7…</div>}>
          <MinimalDestinyAstrolabeV7Page />
        </Suspense>
      </ErrorBoundary>
    );
  }

  if (isAdversaryShapesPath) {
    return (
      <ErrorBoundary componentName="Adversary Shapes Page">
        <Suspense fallback={<div className="p-4 text-xs text-slate-300">Loading shapes…</div>}>
          <AdversaryShapesPage />
        </Suspense>
      </ErrorBoundary>
    );
  }

  if (isHeroComponentsLabPath) {
    return (
      <ErrorBoundary componentName="Hero Components Lab Page">
        <Suspense fallback={<div className="p-4 text-xs text-slate-300">Loading hero components…</div>}>
          <HeroComponentsLabPage />
        </Suspense>
      </ErrorBoundary>
    );
  }

  if (isMinimalDestinyAstrolabeV10Path) {
    return (
      <ErrorBoundary componentName="Minimal Destiny Astrolabe V10 Page">
        <Suspense fallback={<div className="p-4 text-xs text-slate-300">Loading Destiny Astrolabe V10…</div>}>
          <MinimalDestinyAstrolabeV10Page />
        </Suspense>
      </ErrorBoundary>
    );
  }

  if (isMinimalDestinyAstrolabeV8Path) {
    return (
      <ErrorBoundary componentName="Minimal Destiny Astrolabe V8 Page">
        <Suspense fallback={<div className="p-4 text-xs text-slate-300">Loading Destiny Astrolabe V8…</div>}>
          <MinimalDestinyAstrolabeV8Page />
        </Suspense>
      </ErrorBoundary>
    );
  }

  if (isMinimalDestinyAstrolabeV9Path) {
    return (
      <ErrorBoundary componentName="Minimal Destiny Astrolabe V9 Page">
        <Suspense fallback={<div className="p-4 text-xs text-slate-300">Loading Destiny Astrolabe V9…</div>}>
          <MinimalDestinyAstrolabeV9Page />
        </Suspense>
      </ErrorBoundary>
    );
  }

  if (isSkillCheckV16Path) {
    return (
      <ErrorBoundary componentName="Skill Check V16 Page">
        <Suspense fallback={<div className="p-4 text-xs text-slate-300">Loading Skill Check V16…</div>}>
          <SkillCheckV16Page />
        </Suspense>
      </ErrorBoundary>
    );
  }

  if (isSkillCheckV15Path) {
    return (
      <ErrorBoundary componentName="Skill Check V15 Page">
        <Suspense fallback={<div className="p-4 text-xs text-slate-300">Loading Skill Check V15…</div>}>
          <SkillCheckV15Page />
        </Suspense>
      </ErrorBoundary>
    );
  }

  if (isSkillCheckWebV1Path) {
    return (
      <ErrorBoundary componentName="Skill Check Web V1 Page">
        <Suspense fallback={<div className="p-4 text-xs text-slate-300">Loading Skill Check Web V1…</div>}>
          <SkillCheckWebV1Page />
        </Suspense>
      </ErrorBoundary>
    );
  }

  if (isMinimalOutcomeModalPath) {
    return (
      <ErrorBoundary componentName="Minimal OutcomeModal Page">
        <Suspense fallback={<div className="p-4 text-xs text-slate-300">Loading OutcomeModal Test…</div>}>
          <MinimalOutcomeModalPage />
        </Suspense>
      </ErrorBoundary>
    );
  }

  if (isMinimalMarketActionCardPath) {
    return (
      <ErrorBoundary componentName="Minimal MarketActionCard Page">
        <Suspense fallback={<div className="p-4 text-xs text-slate-300">Loading MarketActionCard Test…</div>}>
          <MinimalMarketActionCardPage />
        </Suspense>
      </ErrorBoundary>
    );
  }


  if (isMinimalJobPoiRosterIntegrationPath) {
    return (
      <ErrorBoundary componentName="Minimal Job POI Roster Integration Page">
        <Suspense fallback={<div className="p-4 text-xs text-slate-300">Loading POI Roster Integration…</div>}>
          <MinimalJobPoiRosterIntegrationPage />
        </Suspense>
      </ErrorBoundary>
    );
  }

  if (isMinimalJobPoiRosterTimeIntegrationPath) {
    return (
      <ErrorBoundary componentName="Minimal Job POI Roster Time Integration Page">
        <Suspense fallback={<div className="p-4 text-xs text-slate-300">Loading POI Roster Time Integration…</div>}>
          <MinimalJobPoiRosterTimeIntegrationPage />
        </Suspense>
      </ErrorBoundary>
    );
  }

  if (isMinimalTimeDaynightIntegrationPath) {
    return (
      <ErrorBoundary componentName="Minimal Time Daynight Integration Page">
        <Suspense fallback={<div className="p-4 text-xs text-slate-300">Loading Time Daynight Integration…</div>}>
          <MinimalTimeDaynightIntegrationPage />
        </Suspense>
      </ErrorBoundary>
    );
  }

  if (isSpellCreatorPath) {
    return (
      <ErrorBoundary componentName="Spell Creator Test Page">
        <Suspense fallback={<div className="p-4 text-xs text-slate-300">Loading Spell Creator…</div>}>
          <SpellCreatorTestPage />
        </Suspense>
      </ErrorBoundary>
    );
  }

  if (isEquipmentCreatorPath) {
    return (
      <ErrorBoundary componentName="Equipment Creator Page">
        <Suspense fallback={<div className="p-4 text-xs text-slate-300">Loading Equipment Creator…</div>}>
          <EquipmentCreatorPage />
        </Suspense>
      </ErrorBoundary>
    );
  }

  if (isEquipmentLibraryPath) {
    return (
      <ErrorBoundary componentName="Equipment Library Page">
        <Suspense fallback={<div className="p-4 text-xs text-slate-300">Loading Equipment Library…</div>}>
          <EquipmentLibraryPage />
        </Suspense>
      </ErrorBoundary>
    );
  }

  if (isTrailerThreatPath) {
    return (
      <ErrorBoundary componentName="Trailer Threat">
        <Suspense fallback={<div className="p-4 text-xs text-slate-300">Loading Trailer Threat…</div>}>
          <TrailerThreatPage />
        </Suspense>
      </ErrorBoundary>
    );
  }

  if (isTrailerChoicePath) {
    return (
      <ErrorBoundary componentName="Trailer Choice">
        <Suspense fallback={<div className="p-4 text-xs text-slate-300">Loading Trailer Choice…</div>}>
          <TrailerChoicePage />
        </Suspense>
      </ErrorBoundary>
    );
  }

  if (isTrailerPreparationPath) {
    return (
      <ErrorBoundary componentName="Trailer Preparation">
        <Suspense fallback={<div className="p-4 text-xs text-slate-300">Loading Trailer Preparation…</div>}>
          <TrailerPreparationPage />
        </Suspense>
      </ErrorBoundary>
    );
  }

  if (isTrailerRiskPath) {
    return (
      <ErrorBoundary componentName="Trailer Risk">
        <Suspense fallback={<div className="p-4 text-xs text-slate-300">Loading Trailer Risk…</div>}>
          <TrailerRiskPage />
        </Suspense>
      </ErrorBoundary>
    );
  }

  if (isTrailerConsequencePath) {
    return (
      <ErrorBoundary componentName="Trailer Consequence">
        <Suspense fallback={<div className="p-4 text-xs text-slate-300">Loading Trailer Consequence…</div>}>
          <TrailerConsequencePage />
        </Suspense>
      </ErrorBoundary>
    );
  }

  if (isTrailerLegacyPath) {
    return (
      <ErrorBoundary componentName="Trailer Legacy">
        <Suspense fallback={<div className="p-4 text-xs text-slate-300">Loading Trailer Legacy…</div>}>
          <TrailerLegacyPage />
        </Suspense>
      </ErrorBoundary>
    );
  }

  if (isTrailerOutroPath) {
    return (
      <ErrorBoundary componentName="Trailer Outro">
        <Suspense fallback={<div className="p-4 text-xs text-slate-300">Loading Trailer Outro…</div>}>
          <TrailerOutroPage />
        </Suspense>
      </ErrorBoundary>
    );
  }

  if (isTrailerThreatIterPath) {
    return (
      <ErrorBoundary componentName="Trailer Threat Iter">
        <Suspense fallback={<div className="p-4 text-xs text-slate-300">Loading Trailer Threat Iter…</div>}>
          <TrailerThreatIter autoStart captureMode={false} />
        </Suspense>
      </ErrorBoundary>
    );
  }

  if (isTrailerPath) {
    return (
      <ErrorBoundary componentName="Trailer">
        <Suspense fallback={<div className="p-4 text-xs text-slate-300">Loading Trailer…</div>}>
          <TrailerViewer />
        </Suspense>
      </ErrorBoundary>
    );
  }

  if (isMockupToComponentPath) {
    return (
      <ErrorBoundary componentName="Mockup to Component">
        <Suspense fallback={<div className="p-4 text-xs text-slate-300">Loading Mockup to Component…</div>}>
          <MockupToComponentPage />
        </Suspense>
      </ErrorBoundary>
    );
  }

  if (isV9SkinSandboxPath) {
    return (
      <ErrorBoundary componentName="V9 Skin Sandbox">
        <Suspense fallback={<div className="p-4 text-xs text-slate-300">Loading V9 Skin Sandbox...</div>}>
          <V9SkinSandbox />
        </Suspense>
      </ErrorBoundary>
    );
  }

  if (isVisualGrammarValidationPath) {
    return (
      <ErrorBoundary componentName="Visual Grammar Validation Spike">
        <Suspense fallback={<div className="p-4 text-xs text-slate-300">Loading Visual Grammar Validation...</div>}>
          <VisualGrammarValidationPage />
        </Suspense>
      </ErrorBoundary>
    );
  }

  if (isVisualFidelityLabPath) {
    return (
      <ErrorBoundary componentName="Visual Fidelity Lab">
        <Suspense fallback={<div className="p-4 text-xs text-slate-300">Loading Visual Fidelity Lab...</div>}>
          <VisualFidelityLabPage />
        </Suspense>
      </ErrorBoundary>
    );
  }

  if (isHarmonizationGalleryPath) {
    return (
      <ErrorBoundary componentName="Harmonization Gallery">
        <Suspense fallback={<div className="p-4 text-xs text-slate-300">Loading Harmonization Gallery...</div>}>
          <HarmonizationGalleryPage />
        </Suspense>
      </ErrorBoundary>
    );
  }

  if (isPoiCoronaHaloLabPath) {
    return (
      <ErrorBoundary componentName="POI Corona Halo Lab">
        <Suspense fallback={<div className="p-4 text-xs text-slate-300">Loading POI Corona Halo Lab...</div>}>
          <PoiCoronaHaloLabPage />
        </Suspense>
      </ErrorBoundary>
    );
  }

  if (isPrimitivesPath) {
    return (
      <ErrorBoundary componentName="Primitives Lab">
        <Suspense fallback={<div className="p-4 text-xs text-slate-300">Loading Primitives Lab...</div>}>
          <PrimitivesPage />
        </Suspense>
      </ErrorBoundary>
    );
  }

  if (isDesignSystemPath) {
    return (
      <ErrorBoundary componentName="Design System Page">
        <Suspense fallback={<div className="p-4 text-xs text-slate-300">Loading Design System...</div>}>
          <DesignSystemPage />
        </Suspense>
      </ErrorBoundary>
    );
  }

  if (isDesignVsFidelityPath) {
    return (
      <ErrorBoundary componentName="Design vs Fidelity Page">
        <Suspense fallback={<div className="p-4 text-xs text-slate-300">Loading Design vs Fidelity...</div>}>
          <DesignVsFidelityPage />
        </Suspense>
      </ErrorBoundary>
    );
  }

  if (isPoiDetailVerificationPath) {
    return (
      <ErrorBoundary componentName="POI Detail Verification Page">
        <Suspense fallback={<div className="p-4 text-xs text-slate-300">Loading POI Detail Verification...</div>}>
          <PoiDetailVerificationPage />
        </Suspense>
      </ErrorBoundary>
    );
  }

  if (isPoiQuestDetailRosterIntegrationPath) {
    return (
      <ErrorBoundary componentName="Quest POI Detail Roster Integration Page">
        <Suspense fallback={<div className="p-4 text-xs text-slate-300">Loading Quest POI Detail Roster Integration...</div>}>
          <PoiDetailQuestRosterIntegrationPage />
        </Suspense>
      </ErrorBoundary>
    );
  }

  if (isPoiQuestDetailRosterTimeClockIntegrationPath) {
    return (
      <ErrorBoundary componentName="Quest POI Detail Roster Time Clock Integration Page">
        <Suspense fallback={<div className="p-4 text-xs text-slate-300">Loading Quest POI Detail Roster Time Clock Integration...</div>}>
          <PoiDetailQuestRosterTimeClockIntegrationPage />
        </Suspense>
      </ErrorBoundary>
    );
  }

  if (isPoiJobDetailRosterIntegrationPath) {
    return (
      <ErrorBoundary componentName="Job POI Detail Roster Integration Page">
        <Suspense fallback={<div className="p-4 text-xs text-slate-300">Loading Job POI Detail Roster Integration...</div>}>
          <PoiDetailJobRosterIntegrationPage />
        </Suspense>
      </ErrorBoundary>
    );
  }

  if (isPoiStandardDetailIntegrationPath) {
    return (
      <ErrorBoundary componentName="POI Standard + Detail Integration Page">
        <Suspense fallback={<div className="p-4 text-xs text-slate-300">Loading POI Standard + Detail Integration...</div>}>
          <PoiStandardDetailIntegrationPage />
        </Suspense>
      </ErrorBoundary>
    );
  }

  if (isTimeDaynightIntegrationPath) {
    return (
      <ErrorBoundary componentName="Time + Day/Night Integration Page">
        <Suspense fallback={<div className="p-4 text-xs text-slate-300">Loading Time + Day/Night Integration...</div>}>
          <TimeDaynightIntegrationPage />
        </Suspense>
      </ErrorBoundary>
    );
  }

  if (isDragPoiAssignmentPath) {
    return (
      <ErrorBoundary componentName="Drag + POI Assignment Page">
        <Suspense fallback={<div className="p-4 text-xs text-slate-300">Loading Drag + POI Assignment...</div>}>
          <DragPoiAssignmentPage />
        </Suspense>
      </ErrorBoundary>
    );
  }

  if (isDragPoiIntegrationPath) {
    return (
      <ErrorBoundary componentName="Drag + POI Integration Page">
        <Suspense fallback={<div className="p-4 text-xs text-slate-300">Loading Drag + POI Integration...</div>}>
          <DragPoiIntegrationPage />
        </Suspense>
      </ErrorBoundary>
    );
  }

  if (isSimplePath) {
    return (
      <ErrorBoundary componentName="Simple Test Page">
        <Suspense fallback={<div className="p-4 text-xs text-slate-300">Loading Simple Test...</div>}>
          <GameplayTestSimple />
        </Suspense>
      </ErrorBoundary>
    );
  }

  if (isMinimalPath) {
    return (
      <ErrorBoundary componentName="Minimal Test Page">
        <Suspense fallback={<div className="p-4 text-xs text-slate-300">Loading Minimal Test...</div>}>
          <GameplayTestMinimal />
        </Suspense>
      </ErrorBoundary>
    );
  }

  if (isGameplayPath) {
    return (
      <ErrorBoundary componentName="Gameplay Test Page">
        <Suspense fallback={<div className="p-4 text-xs text-slate-300">Loading Gameplay Test...</div>}>
          <GameplayTestPage />
        </Suspense>
      </ErrorBoundary>
    );
  }

  if (isMinimalGameplayPath) {
    return (
      <ErrorBoundary componentName="Minimal Gameplay Page">
        <Suspense fallback={<div className="p-4 text-xs text-slate-300">Loading Minimal Gameplay...</div>}>
          <MinimalGameplayPage />
        </Suspense>
      </ErrorBoundary>
    );
  }

  if (isWorldSurfacePath) {
    return (
      <ErrorBoundary componentName="World Surface Test Page">
        <Suspense fallback={<div className="p-4 text-xs text-slate-300">Loading World Surface...</div>}>
          <WorldSurfaceTestPage />
        </Suspense>
      </ErrorBoundary>
    );
  }

  if (isWorldPresentationDirectorPath) {
    return (
      <ErrorBoundary componentName="World Presentation Director">
        <Suspense fallback={<div className="p-4 text-xs text-slate-300">Loading World Presentation Director...</div>}>
          <WorldPresentationDirectorPage />
        </Suspense>
      </ErrorBoundary>
    );
  }

  if (isPoiMarkerLabPath) {
    return (
      <ErrorBoundary componentName="POI Marker Lab Page">
        <Suspense fallback={<div className="p-4 text-xs text-slate-300">Loading POI Marker Lab...</div>}>
          <PoiMarkerLabPage />
        </Suspense>
      </ErrorBoundary>
    );
  }


  if (isPoiVisualPreviewPath) {
    return (
      <ErrorBoundary componentName="POI Visual Preview Page">
        <Suspense fallback={<div className="p-4 text-xs text-slate-300">Loading POI Visual Preview…</div>}>
          <PoiVisualPreviewPage />
        </Suspense>
      </ErrorBoundary>
    );
  }

  if (isUseClientPath) {
    return (
      <ErrorBoundary componentName="Use Client Page">
        <Suspense fallback={<div className="p-4 text-xs text-slate-300">Loading Use Client...</div>}>
          <UseClientPage />
        </Suspense>
      </ErrorBoundary>
    );
  }

  return (
    <LQAProvider>
      <div data-testid="app-loaded" className="min-h-screen">
        <FantasyLayout activeTab={activeTab} onTabChange={(tab) => setActiveTab(tab)}>
          {activeTab === 'balancer' && (
            <ErrorBoundary componentName="Balancer">
              <Suspense fallback={<div className="p-4 text-xs text-slate-300">Loading Balancer…</div>}>
                <Balancer />
              </Suspense>
            </ErrorBoundary>
          )}
        {activeTab === 'spellCreationNew' && (
          <ErrorBoundary componentName="Spell Creation">
            <SpellCreatorNew />
          </ErrorBoundary>
        )}
        {activeTab === 'idleVillageConfig' && (
          <ErrorBoundary componentName="Idle Village Config">
            {idleVillageReady ? (
              <Suspense fallback={<div className="p-4 text-xs text-slate-300">Loading Idle Village Config…</div>}>
                <IdleVillageConfigRoute />
              </Suspense>
            ) : (
              idleVillageLoadingFallback
            )}
          </ErrorBoundary>
        )}
        {activeTab === 'minimalGameplay' && (
          <ErrorBoundary componentName="Minimal Gameplay">
            <Suspense fallback={<div className="p-4 text-xs text-slate-300">Loading Minimal Gameplay…</div>}>
              <MinimalGameplayPage />
            </Suspense>
          </ErrorBoundary>
        )}
        {activeTab === 'moodboard' && (
          <ErrorBoundary componentName="Moodboard">
            <Suspense fallback={<div className="p-4 text-xs text-slate-300">Loading Moodboard…</div>}>
              <MoodboardPage />
            </Suspense>
          </ErrorBoundary>
        )}
        {activeTab === 'storyboard' && (
          <ErrorBoundary componentName="Storyboard">
            <Suspense fallback={<div className="p-4 text-xs text-slate-300">Loading Storyboard…</div>}>
              <StoryboardPage />
            </Suspense>
          </ErrorBoundary>
        )}
        {activeTab === 'promptBible' && (
          <ErrorBoundary componentName="Prompt & Bible">
            <Suspense fallback={<div className="p-4 text-xs text-slate-300">Loading Prompt Bible…</div>}>
              <PromptAndBibleStylePage />
            </Suspense>
          </ErrorBoundary>
        )}
        {activeTab === 'styleLabDemo' && (
          <ErrorBoundary componentName="Style Lab Demo">
            <Suspense fallback={<div className="p-4 text-xs text-slate-300">Loading Style Lab Demo…</div>}>
              <StyleLabDemoPage />
            </Suspense>
          </ErrorBoundary>
        )}
        {activeTab === 'wanderlust' && (
          <ErrorBoundary componentName="Wanderlust Mockup">
            <Suspense fallback={<div className="p-4 text-xs text-slate-300">Loading Wanderlust Mockup…</div>}>
              <WanderlustMockupPage />
            </Suspense>
          </ErrorBoundary>
        )}
        {activeTab === 'test' && (
          <ErrorBoundary componentName="Test Roster Page">
            <Suspense fallback={<div className="p-4 text-xs text-slate-300">Loading Test Harness…</div>}>
              <TestRosterPage />
            </Suspense>
          </ErrorBoundary>
        )}
        {activeTab === 'testHub' && (
          <ErrorBoundary componentName="Test Hub">
            <Suspense fallback={<div className="p-4 text-xs text-slate-300">Loading Test Hub…</div>}>
              <TestHub />
            </Suspense>
          </ErrorBoundary>
        )}
      </FantasyLayout>
    </div>
    </LQAProvider>
  );
}

export default App;
