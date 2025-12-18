// Updated App navigation to include Spell Editor and Spell Library
import { useState, useEffect, lazy, Suspense } from 'react';
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
import { ArcaneTechGlass } from './ui/fantasy/mockups/ArcaneTechGlass';
import { GildedObservatory } from './ui/fantasy/mockups/GildedObservatory';
import { SpellCreatorNew } from './ui/spells/SpellCreatorNew';
import { ObsidianSanctum } from './ui/fantasy/mockups/ObsidianSanctum';
import { AuroraWorkshop } from './ui/fantasy/mockups/AuroraWorkshop';
import { AetherBrassLab } from './ui/fantasy/mockups/AetherBrassLab';
import { QuantumScriptorium } from './ui/fantasy/mockups/QuantumScriptorium';
import { MidnightMeridian } from './ui/fantasy/mockups/MidnightMeridian';
import { SeraphimArchive } from './ui/fantasy/mockups/SeraphimArchive';
import { VerdantAlloyDeck } from './ui/fantasy/mockups/VerdantAlloyDeck';
import { TacticalLab } from './ui/tactical/TacticalLab';
import IdleVillagePage from './ui/idleVillage/IdleVillagePage';
import IdleVillageMapPage from './ui/idleVillage/IdleVillageMapPage';
import IdleVillageConfigRoute from './pages/idle-village-config';

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
const ArchetypeTestingLab = lazy(() =>
  import('./ui/balancing/ArchetypeTestingLab').then((m) => ({ default: m.ArchetypeTestingLab }))
);
const SkillCheckPreviewPage = lazy(() =>
  import('./ui/testing/SkillCheckPreviewPage').then((m) => ({ default: m.SkillCheckPreviewPage }))
);
const VerbDetailSandbox = lazy(() =>
  import('./ui/testing/VerbDetailSandbox').then((m) => ({ default: m.default }))
);

type Tab =
  | 'balancer'
  | 'balancerStats'
  | 'archetypes'
  | 'archetypeBuilder'
  | 'archetypeFantasy'
  | 'matchupMatrix'
  | 'archetypeTesting'
  | 'autoBalancer'
  | 'characterCreator'
  | 'spellLibrary'
  | 'spellCreation'
  | 'spellCreationNew'
  | 'characterManager'
  | 'gridArena'
  | 'idleArena'
  | 'testing'
  | 'mockArcaneTech'
  | 'mockGildedObservatory'
  | 'mockObsidianSanctum'
  | 'mockAuroraWorkshop'
  | 'mockAetherBrass'
  | 'mockQuantumScriptorium'
  | 'mockMidnightMeridian'
  | 'mockSeraphimArchive'
  | 'mockVerdantAlloy'
  | 'tacticalLab'
  | 'idleVillage'
  | 'idleVillageMap'
  | 'idleVillageConfig'
  | 'skillCheckPreview'
  | 'verbDetailSandbox';

function App() {
  const [activeTab, setActiveTab] = useState<Tab>('balancer');

  // Listen for spell creation navigation from SpellLibrary
  useEffect(() => {
    const handleNavigate = () => setActiveTab('spellCreationNew');
    window.addEventListener('navigate-spell-creation', handleNavigate as EventListener);
    return () => window.removeEventListener('navigate-spell-creation', handleNavigate as EventListener);
  }, []);

  return (
    <div data-testid="app-loaded" className="min-h-screen">
      <FantasyLayout activeTab={activeTab} onTabChange={(tab) => setActiveTab(tab as Tab)}>
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
      {activeTab === 'spellCreation' && (
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
      {activeTab === 'idleVillage' && (
        <ErrorBoundary componentName="Idle Village">
          <IdleVillagePage />
        </ErrorBoundary>
      )}
      {activeTab === 'idleVillageMap' && (
        <ErrorBoundary componentName="Idle Village Map">
          <IdleVillageMapPage />
        </ErrorBoundary>
      )}
      {activeTab === 'idleVillageConfig' && (
        <ErrorBoundary componentName="Idle Village Config">
          <IdleVillageConfigRoute />
        </ErrorBoundary>
      )}
      {activeTab === 'verbDetailSandbox' && (
        <ErrorBoundary componentName="Verb Detail Sandbox">
          <Suspense fallback={<div className="p-4 text-xs text-slate-300">Loading Verb Detail Sandbox…</div>}>
            <VerbDetailSandbox />
          </Suspense>
        </ErrorBoundary>
      )}
      {activeTab === 'mockArcaneTech' && (
        <ErrorBoundary componentName="Arcane Tech Glass">
          <ArcaneTechGlass />
        </ErrorBoundary>
      )}
      {activeTab === 'mockGildedObservatory' && (
        <ErrorBoundary componentName="Gilded Observatory">
          <GildedObservatory />
        </ErrorBoundary>
      )}
      {activeTab === 'mockObsidianSanctum' && (
        <ErrorBoundary componentName="Obsidian Sanctum">
          <ObsidianSanctum />
        </ErrorBoundary>
      )}
      {activeTab === 'mockAuroraWorkshop' && (
        <ErrorBoundary componentName="Aurora Workshop">
          <AuroraWorkshop />
        </ErrorBoundary>
      )}
      {activeTab === 'mockAetherBrass' && (
        <ErrorBoundary componentName="Aether Brass Lab">
          <AetherBrassLab />
        </ErrorBoundary>
      )}
      {activeTab === 'mockQuantumScriptorium' && (
        <ErrorBoundary componentName="Quantum Scriptorium">
          <QuantumScriptorium />
        </ErrorBoundary>
      )}
      {activeTab === 'mockMidnightMeridian' && (
        <ErrorBoundary componentName="Midnight Meridian">
          <MidnightMeridian />
        </ErrorBoundary>
      )}
      {activeTab === 'mockSeraphimArchive' && (
        <ErrorBoundary componentName="Seraphim Archive">
          <SeraphimArchive />
        </ErrorBoundary>
      )}
      {activeTab === 'mockVerdantAlloy' && (
        <ErrorBoundary componentName="Verdant Alloy Deck">
          <VerdantAlloyDeck />
        </ErrorBoundary>
      )}
      {activeTab === 'tacticalLab' && (
        <ErrorBoundary componentName="Tactical Lab">
          <TacticalLab />
        </ErrorBoundary>
      )}
      </FantasyLayout>
    </div>
  );
}

export default App;
