import { useCallback, useEffect, useRef, useState, lazy, Suspense } from 'react';
import { FantasyLayout } from './ui/fantasy/FantasyLayout';
import { ErrorBoundary } from './ui/organisms/ErrorBoundary';
import { SpellCreatorNew } from './ui/spells/SpellCreatorNew';
import { useIdleVillageConfig } from '@/balancing/hooks/useIdleVillageConfig';
import { useIsMobile } from '@/hooks/useMediaQuery';
import {
  DEFAULT_LANDING_TAB_ID,
  isValidNavTabId,
  type AppNavTabId,
} from '@/shared/navigation/navConfig';
import { applySkinCssVariables } from './ui/idleVillage/skins/skinCssVariables';
import { applyPerfTier } from './ui/idleVillage/skins/perfTier';

// Global default skin: writes --skin-* / --wl-* CSS variables on <html> so
// every skin-aware sub-element (titles, buttons, footers, icons…) inherits it.
applySkinCssVariables();
// Detect device capability → data-perf-tier on <html> gates parallax/WebGL.
applyPerfTier();
const MinimalGameplayPage = lazy(() => import('./ui/idleVillage/MinimalGameplayPage'));
const GameplayTestPage = lazy(() => import('./ui/idleVillage/components/GameplayTestPage'));
const GameplayTestSimple = lazy(() => import('./ui/idleVillage/components/GameplayTestSimple'));
const GameplayTestMinimal = lazy(() => import('./ui/idleVillage/components/GameplayTestMinimal'));
const TestRosterPage = lazy(() => import('./ui/idleVillage/TestRosterPage'));
const TestHub = lazy(() => import('./ui/idleVillage/TestHub').then(m => ({ default: m.TestHub })));
const IdleVillageConfigRoute = lazy(() => import('./pages/idle-village-config'));
const StyleLabDemoPage = lazy(() => import('./pages/style-lab-demo'));
const SkinLabPage = lazy(() => import('./pages/SkinLabPage'));
const V8SkinSandbox = lazy(() => import('./pages/v8-skin-sandbox').then(m => ({ default: m.V8SkinSandbox })));
const V9SkinSandbox = lazy(() => import('./pages/v9-skin-sandbox').then(m => ({ default: m.V9SkinSandbox })));
const PoiDetailVerificationPage = lazy(() => import('./ui/idleVillage/pages/PoiDetailVerificationPage').then(m => ({ default: m.PoiDetailVerificationPage })));
const PoiDetailRosterIntegrationPage = lazy(() => import('./ui/idleVillage/pages/PoiDetailRosterIntegrationPage').then(m => ({ default: m.default })));
const PoiStandardDetailIntegrationPage = lazy(() => import('./ui/idleVillage/pages/PoiStandardDetailIntegrationPage').then(m => ({ default: m.PoiStandardDetailIntegrationPage })));
const TimeDaynightIntegrationPage = lazy(() => import('./ui/idleVillage/pages/TimeDaynightIntegrationPage').then(m => ({ default: m.TimeDaynightIntegrationPage })));
const DragPoiAssignmentPage = lazy(() => import('./ui/idleVillage/pages/DragPoiAssignmentPage').then(m => ({ default: m.DragPoiAssignmentPage })));
const SlotPage = lazy(() => import('./ui/idleVillage/pages/SlotPage').then(m => ({ default: m.default })));
// Minimal slice test pages (Phase 1-6)
const MinimalPoiPage = lazy(() => import('./pages/minimal-poi').then(m => ({ default: m.default })));
const MinimalRosterPage = lazy(() => import('./pages/minimal-roster').then(m => ({ default: m.default })));
const MinimalRosterSlotIntegrationPage = lazy(() => import('./pages/minimal-roster-slot-integration').then(m => ({ default: m.default })));
const MinimalClockPage = lazy(() => import('./pages/minimal-clock').then(m => ({ default: m.default })));
const MinimalSlotRackPage = lazy(() => import('./pages/minimal-slotRack').then(m => ({ default: m.default })));
const MinimalResourceHUDPage = lazy(() => import('./pages/minimal-resourcehud').then(m => ({ default: m.default })));
const MinimalQuestCardPage = lazy(() => import('./pages/minimal-questcard').then(m => ({ default: m.default })));
const MinimalSkillCheckPage = lazy(() => import('./pages/minimal-skillcheck').then(m => ({ default: m.default })));
const MinimalSkillCheckV6Page = lazy(() => import('./pages/minimal-skillcheck-v6').then(m => ({ default: m.default })));
const MinimalDestinyAstrolabePage = lazy(() => import('./pages/minimal-destiny-astrolabe').then(m => ({ default: m.default })));
const MinimalOutcomeModalPage = lazy(() => import('./pages/minimal-outcome').then(m => ({ default: m.default })));
const MinimalMarketActionCardPage = lazy(() => import('./pages/minimal-market-page').then(m => ({ default: m.default })));
const MinimalIntegrationQuestFlowPage = lazy(() => import('./pages/minimal-integration-quest-flow').then(m => ({ default: m.default })));
const MinimalJobPoiRosterIntegrationPage = lazy(() => import('./pages/minimal-job-poi-roster-integration').then(m => ({ default: m.default })));
const MinimalJobPoiRosterTimeIntegrationPage = lazy(() => import('./pages/minimal-job-poi-roster-time-integration').then(m => ({ default: m.default })));
const MinimalQuestDetailPage = lazy(() => import('./pages/minimal-quest-detail').then(m => ({ default: m.default })));
const MinimalTimeDaynightIntegrationPage = lazy(() => import('./pages/minimal-time-daynight-integration').then(m => ({ default: m.default })));

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
  const isSkinLabPath =
    typeof window !== 'undefined' && window.location.pathname === '/skin-lab';
  const isV8SkinSandboxPath =
    typeof window !== 'undefined' && window.location.pathname === '/skin-sandbox';
  const isV9SkinSandboxPath =
    typeof window !== 'undefined' && window.location.pathname === '/v9-skin-sandbox';
  const isPoiDetailVerificationPath =
    typeof window !== 'undefined' && window.location.pathname === '/poi-detail-verification';
  const isPoiDetailRosterIntegrationPath =
    typeof window !== 'undefined' && window.location.pathname === '/poi-detail-roster-integration';
  const isPoiStandardDetailIntegrationPath =
    typeof window !== 'undefined' && window.location.pathname === '/poi-standard-detail-integration';
  const isTimeDaynightIntegrationPath =
    typeof window !== 'undefined' && window.location.pathname === '/time-daynight-integration';
  const isDragPoiAssignmentPath =
    typeof window !== 'undefined' && window.location.pathname === '/drag-poi-assignment';
  const isSlotPath =
    typeof window !== 'undefined' && window.location.pathname === '/slot';
  // Minimal slice test pages (Phase 1-6)
  const isMinimalPoiPath =
    typeof window !== 'undefined' && window.location.pathname === '/minimal-poi';
  const isMinimalRosterPath =
    typeof window !== 'undefined' && window.location.pathname === '/minimal-roster';
  const isMinimalRosterSlotIntegrationPath =
    typeof window !== 'undefined' && window.location.pathname === '/minimal-roster-slot-integration';
  const isMinimalClockPath =
    typeof window !== 'undefined' && window.location.pathname === '/minimal-clock';
  const isMinimalSlotRackPath =
    typeof window !== 'undefined' && window.location.pathname === '/minimal-slotRack';
  const isMinimalResourceHUDPath =
    typeof window !== 'undefined' && window.location.pathname === '/minimal-resourcehud';
  const isMinimalJobCardPath =
    typeof window !== 'undefined' && window.location.pathname === '/minimal-jobcard';
  const isMinimalQuestCardPath =
    typeof window !== 'undefined' && window.location.pathname === '/minimal-questcard';
  const isMinimalSkillCheckPath =
    typeof window !== 'undefined' && window.location.pathname === '/minimal-skillcheck';
  const isMinimalSkillCheckV6Path =
    typeof window !== 'undefined' && window.location.pathname === '/minimal-skillcheck-v6';
  const isMinimalDestinyAstrolabePath =
    typeof window !== 'undefined' && window.location.pathname === '/minimal-destiny-astrolabe';
  const isMinimalOutcomeModalPath =
    typeof window !== 'undefined' && window.location.pathname === '/minimal-outcome';
  const isMinimalMarketActionCardPath =
    typeof window !== 'undefined' && window.location.pathname === '/minimal-market';
  const isMinimalIntegrationQuestFlowPath =
    typeof window !== 'undefined' && window.location.pathname === '/minimal-integration-quest-flow';
  const isMinimalJobPoiRosterIntegrationPath =
    typeof window !== 'undefined' && window.location.pathname === '/minimal-job-poi-roster-integration';
  const isMinimalJobPoiRosterTimeIntegrationPath =
    typeof window !== 'undefined' && window.location.pathname === '/minimal-job-poi-roster-time-integration';
  const isMinimalQuestDetailPath =
    typeof window !== 'undefined' && window.location.pathname === '/minimal-quest-detail';
  const isMinimalTimeDaynightIntegrationPath =
    typeof window !== 'undefined' && window.location.pathname === '/minimal-time-daynight-integration';
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

  if (isTestHubPath) {
    return (
      <ErrorBoundary componentName="Test Hub">
        <Suspense fallback={<div className="p-4 text-xs text-slate-300">Loading Test Hub…</div>}>
          <TestHub />
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

  if (isMinimalResourceHUDPath) {
    return (
      <ErrorBoundary componentName="Minimal ResourceHUD Page">
        <Suspense fallback={<div className="p-4 text-xs text-slate-300">Loading ResourceHUD Test…</div>}>
          <MinimalResourceHUDPage />
        </Suspense>
      </ErrorBoundary>
    );
  }

  if (isMinimalJobCardPath) {
    return (
      <ErrorBoundary componentName="Minimal JobCard Page">
        <Suspense fallback={<div className="p-4 text-xs text-slate-300">Loading JobCard Test…</div>}>
          <MinimalJobCardPage />
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

  if (isMinimalIntegrationQuestFlowPath) {
    return (
      <ErrorBoundary componentName="Minimal Integration Quest Flow Page">
        <Suspense fallback={<div className="p-4 text-xs text-slate-300">Loading Integration Quest Flow Test…</div>}>
          <MinimalIntegrationQuestFlowPage />
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

  if (isMinimalQuestDetailPath) {
    return (
      <ErrorBoundary componentName="Minimal Quest Detail Page">
        <Suspense fallback={<div className="p-4 text-xs text-slate-300">Loading Quest Detail…</div>}>
          <MinimalQuestDetailPage />
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

  if (isSkinLabPath) {
    return (
      <ErrorBoundary componentName="Skin Lab Page">
        <Suspense fallback={<div className="p-4 text-xs text-slate-300">Loading Skin Lab...</div>}>
          <SkinLabPage />
        </Suspense>
      </ErrorBoundary>
    );
  }

  if (isV8SkinSandboxPath) {
    return (
      <ErrorBoundary componentName="V8 Skin Sandbox">
        <Suspense fallback={<div className="p-4 text-xs text-slate-300">Loading V8 Skin Sandbox...</div>}>
          <V8SkinSandbox />
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

  if (isPoiDetailVerificationPath) {
    return (
      <ErrorBoundary componentName="POI Detail Verification Page">
        <Suspense fallback={<div className="p-4 text-xs text-slate-300">Loading POI Detail Verification...</div>}>
          <PoiDetailVerificationPage />
        </Suspense>
      </ErrorBoundary>
    );
  }

  if (isPoiDetailRosterIntegrationPath) {
    return (
      <ErrorBoundary componentName="POI Detail Roster Integration Page">
        <Suspense fallback={<div className="p-4 text-xs text-slate-300">Loading POI Detail Roster Integration...</div>}>
          <PoiDetailRosterIntegrationPage />
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

  return (
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
  );
}

export default App;
