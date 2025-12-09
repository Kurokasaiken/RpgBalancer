// Updated App navigation to include Spell Editor and Spell Library
import { useState, useEffect, lazy, Suspense } from 'react';
import { SpellLibrary } from './ui/spell/SpellLibrary';
import { FantasySpellCreation } from './ui/fantasy/FantasySpellCreation';
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
import { FantasyBalancer } from './ui/fantasy/FantasyBalancer';
import { FantasyComponentShowcase } from './ui/atoms/FantasyComponentShowcase';
import { ArcaneTechGlass } from './ui/fantasy/mockups/ArcaneTechGlass';
import { GildedObservatory } from './ui/fantasy/mockups/GildedObservatory';
import { GildedCardShowcase } from './ui/fantasy/mockups/GildedCardShowcase';
import { SpellCreatorNewMockup } from './ui/spells/SpellCreatorNewMockup';
import { SpellCreatorNew } from './ui/spells/SpellCreatorNew';
import { ObsidianSanctum } from './ui/fantasy/mockups/ObsidianSanctum';
import { AuroraWorkshop } from './ui/fantasy/mockups/AuroraWorkshop';
import { AetherBrassLab } from './ui/fantasy/mockups/AetherBrassLab';
import { QuantumScriptorium } from './ui/fantasy/mockups/QuantumScriptorium';
import { MidnightMeridian } from './ui/fantasy/mockups/MidnightMeridian';
import { SeraphimArchive } from './ui/fantasy/mockups/SeraphimArchive';
import { VerdantAlloyDeck } from './ui/fantasy/mockups/VerdantAlloyDeck';
import { CompactDemo } from './ui/pages/CompactDemo';
import { TacticalLab } from './ui/tactical/TacticalLab';

// Lazy-loaded heavy tools (named exports wrapped as default)
const BalancerNew = lazy(() =>
  import('./ui/balancing/BalancerNew').then((m) => ({ default: m.BalancerNew }))
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

type Tab =
  | 'balancer'
  | 'balancerLegacy'
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
  | 'fantasyShowcase'
  | 'mockArcaneTech'
  | 'mockSpellCreatorNew'
  | 'mockGildedObservatory'
  | 'mockObsidianSanctum'
  | 'mockAuroraWorkshop'
  | 'mockAetherBrass'
  | 'mockQuantumScriptorium'
  | 'mockMidnightMeridian'
  | 'mockSeraphimArchive'
  | 'mockVerdantAlloy'
  | 'mockGildedCards'
  | 'compactDemo'
  | 'tacticalLab';

function App() {
  const [activeTab, setActiveTab] = useState<Tab>('balancer');

  // Listen for spell creation navigation from SpellLibrary
  useEffect(() => {
    const handleNavigate = () => setActiveTab('spellCreationNew');
    window.addEventListener('navigate-spell-creation', handleNavigate as EventListener);
    return () => window.removeEventListener('navigate-spell-creation', handleNavigate as EventListener);
  }, []);

  return (
    <FantasyLayout activeTab={activeTab} onTabChange={(tab) => setActiveTab(tab as Tab)}>
      {activeTab === 'balancer' && (
        <ErrorBoundary componentName="Balancer">
          <Suspense fallback={<div className="p-4 text-xs text-slate-300">Loading Balancer…</div>}>
            <BalancerNew />
          </Suspense>
        </ErrorBoundary>
      )}
      {activeTab === 'balancerLegacy' && (
        <ErrorBoundary componentName="Legacy Balancer">
          <FantasyBalancer />
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
      {activeTab === 'fantasyShowcase' && (
        <ErrorBoundary componentName="Fantasy Showcase">
          <FantasyComponentShowcase />
        </ErrorBoundary>
      )}
      {activeTab === 'mockArcaneTech' && (
        <ErrorBoundary componentName="Arcane Tech Glass">
          <ArcaneTechGlass />
        </ErrorBoundary>
      )}
      {activeTab === 'mockSpellCreatorNew' && (
        <ErrorBoundary componentName="Spell Creator New Mockup">
          <SpellCreatorNewMockup />
        </ErrorBoundary>
      )}
      {activeTab === 'mockGildedObservatory' && (
        <ErrorBoundary componentName="Gilded Observatory">
          <GildedObservatory />
        </ErrorBoundary>
      )}
      {activeTab === 'mockGildedCards' && (
        <ErrorBoundary componentName="Gilded Card Showcase">
          <GildedCardShowcase />
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
      {activeTab === 'compactDemo' && (
        <ErrorBoundary componentName="Compact UI Demo">
          <CompactDemo />
        </ErrorBoundary>
      )}
      {activeTab === 'tacticalLab' && (
        <ErrorBoundary componentName="Tactical Lab">
          <TacticalLab />
        </ErrorBoundary>
      )}
    </FantasyLayout>
  );
}

export default App;
