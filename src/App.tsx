// Updated App navigation to include Spell Editor and Spell Library
import { useState, useEffect, useRef, lazy, Suspense } from 'react';
import { SpellLibrary } from './ui/spell/SpellLibrary';
import { IdleArena } from './ui/idle/IdleArena';
import { CharacterManager } from './ui/idle/CharacterManager';
import { FantasyGridArena } from './ui/fantasy/FantasyGridArena';
import { ErrorBoundary } from './ui/organisms/ErrorBoundary';
import { ArchetypeManager } from './components/balancing/archetype/ArchetypeManager';
import { ArchetypeBuilderComponent } from './ui/balancing/archetype/ArchetypeBuilderComponent';
import { ArchetypeBuilderFantasy } from './ui/balancing/archetype/ArchetypeBuilderFantasy';
import { MatchupMatrixWrapper } from './ui/balancing/matchup/MatchupMatrixWrapper';
import { AutoBalancerWrapper } from './ui/balancing/autobalancer/AutoBalancerWrapper';
import { CharacterCreator } from './ui/character/CharacterCreator';
import { FantasyLayout } from './ui/fantasy/FantasyLayout';
import { FantasySpellCreation } from './ui/fantasy/FantasySpellCreation';
import { SpellCreatorNew } from './ui/spells/SpellCreatorNew';
import { TacticalLab } from './ui/tactical/TacticalLab';
import IdleVillageMapPage from './ui/idleVillage/IdleVillageMapPage';
import IdleVillageConfigRoute from './pages/idle-village-config';
import { CombatViewerPage } from './ui/balancing/CombatViewerPage';
import { useIdleVillageConfig } from '@/balancing/hooks/useIdleVillageConfig';
import {
  DEFAULT_LANDING_TAB_ID,
  isValidNavTabId,
  type AppNavTabId,
} from '@/shared/navigation/navConfig';

interface AppNavControls {
  getActiveTab: () => AppNavTabId;
  setActiveTab: (tabId: AppNavTabId) => void;
}

declare global {
  interface Window {
    __appNavControls?: AppNavControls;
  }
}

// Lazy-loaded heavy tools (named exports wrapped as default)
const Balancer = lazy(() =>
  import('./ui/balancing/Balancer').then((m) => ({ default: m.Balancer }))
);
const TestingLab = lazy(() =>
  import('./ui/testing/TestingLab').then((m) => ({ default: m.TestingLab }))
);
const StatStressTestingPage = lazy(() =>
  import('./ui/testing/StatStressTestingPage').then((m) => ({ default: m.StatStressTestingPage }))
);
const VillageSandbox = lazy(() => import('./ui/idleVillage/VillageSandbox'));
const QuestChronicleSandbox = lazy(() => import('./ui/idleVillage/QuestChronicleSandbox'));
const ArchetypeTestingLab = lazy(() =>
  import('./ui/balancing/ArchetypeTestingLab').then((m) => ({ default: m.ArchetypeTestingLab }))
);
const SkillCheckPreviewPage = lazy(() => import('./ui/testing/SkillCheckPreviewPage'));
const VerbDetailSandbox = lazy(() =>
  import('./ui/testing/VerbDetailSandbox').then((m) => ({ default: m.default }))
);
const MoodboardPage = lazy(() =>
  import('./ui/moodboard/MoodboardPage').then((m) => ({ default: m.MoodboardPage }))
);

function App() {
  const [activeTab, setActiveTab] = useState<AppNavTabId>(DEFAULT_LANDING_TAB_ID);
  const { config, initialized, isInitializing, initializeConfig } = useIdleVillageConfig();
  const hasAppliedPreferenceRef = useRef(false);

  // Listen for spell creation navigation from SpellLibrary
  useEffect(() => {
    const handleNavigate = () => setActiveTab('spellCreationNew');
    window.addEventListener('navigate-spell-creation', handleNavigate as EventListener);
    return () => window.removeEventListener('navigate-spell-creation', handleNavigate as EventListener);
  }, []);

  useEffect(() => {
    void initializeConfig();
  }, [initializeConfig]);

  useEffect(() => {
    if (hasAppliedPreferenceRef.current) return;
    if (!initialized || isInitializing) return;
    const preferred = config.uiPreferences?.defaultAppTabId;
    if (preferred && isValidNavTabId(preferred)) {
      setActiveTab(preferred);
    }
    hasAppliedPreferenceRef.current = true;
  }, [config.uiPreferences, initialized, isInitializing]);

  const idleVillageReady = initialized && !isInitializing;
  const idleVillageLoadingFallback = (
    <div className="p-4 text-xs text-slate-300">Loading Idle Village configuration…</div>
  );

  useEffect(() => {
    const controls: AppNavControls = {
      getActiveTab: () => activeTab,
      setActiveTab: (tabId: AppNavTabId) => {
        if (isValidNavTabId(tabId)) {
          setActiveTab(tabId);
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
        {activeTab === 'testing' && (
          <ErrorBoundary componentName="Testing Lab">
            <Suspense fallback={<div className="p-4 text-xs text-slate-300">Loading Testing Lab…</div>}>
              <TestingLab />
            </Suspense>
          </ErrorBoundary>
        )}
        {activeTab === 'idleArena' && (
          <ErrorBoundary componentName="Idle Arena">
            <IdleArena />
          </ErrorBoundary>
        )}
        {activeTab === 'combatViewer' && (
          <ErrorBoundary componentName="Combat Viewer">
            <CombatViewerPage />
          </ErrorBoundary>
        )}
        {activeTab === 'characterCreator' && (
          <ErrorBoundary componentName="Character Creator">
            <CharacterCreator />
          </ErrorBoundary>
        )}
        {activeTab === 'spellLibrary' && (
          <ErrorBoundary componentName="Spell Library">
            <SpellLibrary />
          </ErrorBoundary>
        )}
        {activeTab === 'spellCreationNew' && (
          <ErrorBoundary componentName="Spell Creation (Legacy)">
            <FantasySpellCreation />
          </ErrorBoundary>
        )}
        {activeTab === 'spellCreationNew' && (
          <ErrorBoundary componentName="Spell Creation">
            <SpellCreatorNew />
          </ErrorBoundary>
        )}
        {activeTab === 'characterManager' && (
          <ErrorBoundary componentName="Character Manager">
            <CharacterManager />
          </ErrorBoundary>
        )}
        {activeTab === 'gridArena' && (
          <ErrorBoundary componentName="Grid Arena">
            <FantasyGridArena />
          </ErrorBoundary>
        )}
        {activeTab === 'archetypes' && (
          <ErrorBoundary componentName="Archetype Manager">
            <ArchetypeManager />
          </ErrorBoundary>
        )}
        {activeTab === 'archetypeBuilder' && (
          <ErrorBoundary componentName="Archetype Builder">
            <ArchetypeBuilderComponent />
          </ErrorBoundary>
        )}
        {activeTab === 'archetypeFantasy' && (
          <ErrorBoundary componentName="Archetype Forge">
            <ArchetypeBuilderFantasy />
          </ErrorBoundary>
        )}
        {activeTab === 'matchupMatrix' && (
          <ErrorBoundary componentName="Matchup Matrix">
            <MatchupMatrixWrapper />
          </ErrorBoundary>
        )}
        {activeTab === 'archetypeTesting' && (
          <ErrorBoundary componentName="Archetype 1v1 Testing">
            <Suspense fallback={<div className="p-4 text-xs text-slate-300">Loading Archetype 1v1 Testing…</div>}>
              <ArchetypeTestingLab />
            </Suspense>
          </ErrorBoundary>
        )}
        {activeTab === 'autoBalancer' && (
          <ErrorBoundary componentName="Auto-Balancer">
            <AutoBalancerWrapper />
          </ErrorBoundary>
        )}
        {activeTab === 'balancerStats' && (
          <ErrorBoundary componentName="Stat Stress Testing">
            <Suspense fallback={<div className="p-4 text-xs text-slate-300">Loading Stat Stress Testing…</div>}>
              <StatStressTestingPage />
            </Suspense>
          </ErrorBoundary>
        )}
        {activeTab === 'skillCheckPreview' && (
          <ErrorBoundary componentName="Skill Check Preview Lab">
            <Suspense fallback={<div className="p-4 text-xs text-slate-300">Loading Skill Check Preview…</div>}>
              <SkillCheckPreviewPage />
            </Suspense>
          </ErrorBoundary>
        )}
        {activeTab === 'idleVillageMap' && (
          <ErrorBoundary componentName="Idle Village Map">
            {idleVillageReady ? <IdleVillageMapPage /> : idleVillageLoadingFallback}
          </ErrorBoundary>
        )}
        {activeTab === 'idleVillageConfig' && (
          <ErrorBoundary componentName="Idle Village Config">
            {idleVillageReady ? <IdleVillageConfigRoute /> : idleVillageLoadingFallback}
          </ErrorBoundary>
        )}
        {activeTab === 'verbDetailSandbox' && (
          <ErrorBoundary componentName="Verb Detail Sandbox">
            <Suspense fallback={<div className="p-4 text-xs text-slate-300">Loading Verb Detail Sandbox…</div>}>
              <VerbDetailSandbox />
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
        {activeTab === 'villageSandbox' && (
          <ErrorBoundary componentName="Village Sandbox">
            {idleVillageReady ? (
              <Suspense fallback={<div className="p-4 text-xs text-slate-300">Loading Village Sandbox…</div>}>
                <VillageSandbox />
              </Suspense>
            ) : (
              idleVillageLoadingFallback
            )}
          </ErrorBoundary>
        )}
        {activeTab === 'tacticalLab' && (
          <ErrorBoundary componentName="Tactical Lab">
            <TacticalLab />
          </ErrorBoundary>
        )}
        {activeTab === 'questChronicleSandbox' && (
          <ErrorBoundary componentName="Quest Chronicle Sandbox">
            {idleVillageReady ? (
              <Suspense fallback={<div className="p-4 text-xs text-slate-300">Loading Quest Chronicle Sandbox…</div>}>
                <QuestChronicleSandbox />
              </Suspense>
            ) : (
              idleVillageLoadingFallback
            )}
          </ErrorBoundary>
        )}
      </FantasyLayout>
    </div>
  );
}

export default App;
