// Updated App navigation to include Spell Editor and Spell Library
import { useState, useEffect } from 'react';
import { SpellLibrary } from './ui/spell/SpellLibrary';
import { FantasySpellCreation } from './ui/fantasy/FantasySpellCreation';

// ... (inside App component)
{
  activeTab === 'spellCreation' && (
    <ErrorBoundary componentName="Spell Creation">
      <FantasySpellCreation />
    </ErrorBoundary>
  )
}
import { IdleArena } from './ui/idle/IdleArena';
import { CharacterManager } from './ui/idle/CharacterManager';
import { FantasyGridArena } from './ui/fantasy/FantasyGridArena';

// ... (inside App component)
{
  activeTab === 'gridArena' && (
    <ErrorBoundary componentName="Grid Arena">
      <FantasyGridArena />
    </ErrorBoundary>
  )
}
import { TestingLab } from './ui/testing/TestingLab';
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

type Tab = 'balancer' | 'archetypes' | 'archetypeBuilder' | 'archetypeFantasy' | 'matchupMatrix' | 'autoBalancer' | 'characterCreator' | 'spellLibrary' | 'spellCreation' | 'characterManager' | 'gridArena' | 'idleArena' | 'testing' | 'fantasyShowcase';

function App() {
  const [activeTab, setActiveTab] = useState<Tab>('balancer');

  // Listen for spell creation navigation from SpellLibrary
  useEffect(() => {
    const handleNavigate = () => setActiveTab('spellCreation');
    window.addEventListener('navigate-spell-creation', handleNavigate as EventListener);
    return () => window.removeEventListener('navigate-spell-creation', handleNavigate as EventListener);
  }, []);



  return (
    <FantasyLayout activeTab={activeTab} onTabChange={(tab) => setActiveTab(tab as Tab)}>
      {activeTab === 'balancer' && (
        <ErrorBoundary componentName="Balancer">
          <FantasyBalancer />
        </ErrorBoundary>
      )}
      {activeTab === 'testing' && (
        <ErrorBoundary componentName="Testing Lab">
          <TestingLab />
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
        <ErrorBoundary componentName="Spell Creation">
          <FantasySpellCreation />
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
      {activeTab === 'autoBalancer' && (
        <ErrorBoundary componentName="Auto-Balancer">
          <AutoBalancerWrapper />
        </ErrorBoundary>
      )}
      {activeTab === 'fantasyShowcase' && (
        <ErrorBoundary componentName="Fantasy Showcase">
          <FantasyComponentShowcase />
        </ErrorBoundary>
      )}
    </FantasyLayout>
  );
}

export default App;
