import { useCallback, useEffect, useRef, useState, lazy, Suspense } from 'react';
import { LAB_ROUTE_COMPONENTS, LAB_PATHS_SET } from '@/deploy/labRoutes';
import { RouteUnavailable } from './deploy/RouteUnavailable';
import { GameBootScreen } from '@/ui/idleVillage/components/gameFrame/GameBootScreen';
import { GameEntry } from '@/ui/idleVillage/components/gameFrame/menu/GameEntry';
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
import { resolveInitialSkinPresetId } from './ui/idleVillage/skins/resolveInitialSkin';

// Detect device capability → data-perf-tier on <html> gates parallax/WebGL.
applyPerfTier();
// Apply the default skin's tokens globally so --skin-* vars exist from boot.
applySkinCssVariables(resolveInitialSkinPresetId());
const MinimalGameplayPage = lazy(() => import('./ui/idleVillage/MinimalGameplayPage'));
const TestRosterPage = lazy(() => import('./ui/idleVillage/TestRosterPage'));
const TestHub = lazy(() => import('./ui/idleVillage/TestHub').then(m => ({ default: m.TestHub })));
const IdleVillageConfigRoute = lazy(() => import('./pages/idle-village-config'));
const StyleLabDemoPage = lazy(() => import('./pages/style-lab-demo'));
// Minimal slice test pages (Phase 1-6)
const Mappa2LabPage = lazy(() => import('./pages/mappa2-lab').then(m => ({ default: m.default })));
const GameFramePixiPage = lazy(() => import('./pages/game-frame-pixi').then(m => ({ default: m.default })));
// /game (2026-11-10): approved mappa2 + signed HUD surfaces; the previous game page moved to /gameOld.
const GameMappa2Page = lazy(() => import('./pages/game-mappa2').then(m => ({ default: m.default })));

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
  // Minimal slice test pages (Phase 1-6)
  const isMappa2LabPath =
    typeof window !== 'undefined' && window.location.pathname === '/mappa2-lab';
  const isGameFramePixiPath =
    typeof window !== 'undefined' && window.location.pathname === '/game-frame-pixi';
  const isGameOldPath =
    typeof window !== 'undefined' && window.location.pathname === '/gameOld';
  const isGamePath =
    typeof window !== 'undefined' && window.location.pathname === '/game';
  const isRootPath =
    typeof window !== 'undefined' &&
    (window.location.pathname === '/' || window.location.pathname === '/index.html');
  const shouldRedirectToMinimalMode = MINIMAL_MODE_ENABLED && isRootPath && !isMinimalGameplayPath;

  const { config, initialized, isInitializing, initializeConfig } = useIdleVillageConfig();
  const isMobile = useIsMobile();
  // Landing (R-297 mobile → estesa a desktop, Director 2026-11-01): the root
  // path lands on the mappa2 lab on every device; the game frame lives at
  // /game and /game-frame-pixi.
  const isLandingPath = isRootPath;

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

  // Landing (R-297): canonicalize the URL to /mappa2-lab without a
  // reload — the same page component is already rendered for this path.
  useEffect(() => {
    if (
      isLandingPath &&
      typeof window !== 'undefined' &&
      window.location.pathname !== '/mappa2-lab'
    ) {
      window.history.replaceState(
        null,
        '',
        `/mappa2-lab${window.location.search}${window.location.hash}`,
      );
    }
  }, [isLandingPath]);

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

  {
    const labPathname = typeof window !== 'undefined' ? window.location.pathname : '';
    const LabComponent = LAB_ROUTE_COMPONENTS[labPathname];
    if (LabComponent) {
      return (
        <ErrorBoundary componentName={labPathname}>
          <Suspense fallback={null}>
            <LabComponent />
          </Suspense>
        </ErrorBoundary>
      );
    }
    if (LAB_PATHS_SET.has(labPathname)) {
      return <RouteUnavailable />;
    }
  }

  // Minimal slice test pages (Phase 1+)




















  if (isGameFramePixiPath || isGameOldPath) {
    return (
      <ErrorBoundary componentName="Game Frame Pixi Page">
        <Suspense fallback={<GameBootScreen phase="manifest" indeterminate />}>
          <GameEntry>
            <GameFramePixiPage />
          </GameEntry>
        </Suspense>
      </ErrorBoundary>
    );
  }

  if (isGamePath) {
    return (
      <ErrorBoundary componentName="Game Page">
        <Suspense fallback={<GameBootScreen phase="manifest" indeterminate />}>
          <GameEntry>
            <GameMappa2Page />
          </GameEntry>
        </Suspense>
      </ErrorBoundary>
    );
  }

  if (isMappa2LabPath || isLandingPath) {
    return (
      <ErrorBoundary componentName="Mappa2 Lab Page">
        <Suspense fallback={<div className="p-4 text-xs text-slate-300">Loading Mappa2 Lab...</div>}>
          <Mappa2LabPage />
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
