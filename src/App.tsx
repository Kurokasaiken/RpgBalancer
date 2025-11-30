// Updated App navigation to include Spell Editor and Spell Library
import { useState, useEffect } from 'react';
import { Balancer } from './ui/Balancer';
import { SpellLibrary } from './ui/spell/SpellLibrary';
import { SpellCreation } from './ui/spell/SpellCreation';
import { IdleArena } from './ui/idle/IdleArena';
import { CharacterManager } from './ui/idle/CharacterManager';
import { GridArena } from './ui/grid/GridArena';
import { TestingLab } from './ui/testing/TestingLab';
import { ErrorBoundary } from './ui/organisms/ErrorBoundary';

import { ArchetypeManager } from './components/balancing/archetype/ArchetypeManager';
import { ArchetypeBuilderComponent } from './ui/balancing/archetype/ArchetypeBuilderComponent';
import { ArchetypeBuilderFantasy } from './ui/balancing/archetype/ArchetypeBuilderFantasy';
import { MatchupMatrixWrapper } from './ui/balancing/matchup/MatchupMatrixWrapper';
import { AutoBalancerWrapper } from './ui/balancing/autobalancer/AutoBalancerWrapper';
import { CharacterCreator } from './ui/character/CharacterCreator';
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
    <div className="min-h-screen bg-app text-on-dark font-body bg-wood-dark">
      {/* Tab Navigation - Wooden Beam Style */}
      <div className="fantasy-wood-panel z-50 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            {/* Logo / Title */}
            <div className="flex-shrink-0 flex items-center">
              <span className="font-display text-2xl font-bold text-gradient-gold drop-shadow-md">
                RPG Balancer
              </span>
            </div>

            {/* Navigation */}
            <nav className="flex space-x-2 overflow-x-auto scrollbar-hide mx-4 items-center h-full">
              {/* BALANCING */}
              {/* BALANCING */}
              <button
                onClick={() => setActiveTab('balancer')}
                className={`px-3 py-2 rounded-md text-sm font-display font-bold transition-all ${activeTab === 'balancer'
                  ? 'bg-sage text-wood-dark shadow-glow-green'
                  : 'text-parchment-medium hover:text-parchment-light hover:bg-wood-medium'
                  }`}
              >
                ⚖️ Balancer
              </button>

              {/* ARCHETYPES */}
              {/* ARCHETYPES */}
              <button
                onClick={() => setActiveTab('archetypes')}
                className={`px-3 py-2 rounded-md text-sm font-display font-bold transition-all ${activeTab === 'archetypes'
                  ? 'bg-sage text-wood-dark shadow-glow-green'
                  : 'text-parchment-medium hover:text-parchment-light hover:bg-wood-medium'
                  }`}
              >
                🎭 Archetypes
              </button>

              {/* ARCHETYPE BUILDER */}
              {/* ARCHETYPE BUILDER */}
              <button
                onClick={() => setActiveTab('archetypeBuilder')}
                className={`px-3 py-2 rounded-md text-sm font-display font-bold transition-all ${activeTab === 'archetypeBuilder'
                  ? 'bg-sage text-wood-dark shadow-glow-green'
                  : 'text-parchment-medium hover:text-parchment-light hover:bg-wood-medium'
                  }`}
              >
                🏗️ Builder
              </button>

              {/* ARCHETYPE FORGE (FANTASY) */}
              {/* ARCHETYPE FORGE (FANTASY) */}
              <button
                onClick={() => setActiveTab('archetypeFantasy')}
                className={`px-3 py-2 rounded-md text-sm font-display font-bold transition-all ${activeTab === 'archetypeFantasy'
                  ? 'bg-sage text-wood-dark shadow-glow-green'
                  : 'text-parchment-medium hover:text-parchment-light hover:bg-wood-medium'
                  }`}
              >
                ⚒️ Forge
              </button>

              {/* MATCHUP MATRIX */}
              {/* MATCHUP MATRIX */}
              <button
                onClick={() => setActiveTab('matchupMatrix')}
                className={`px-3 py-2 rounded-md text-sm font-display font-bold transition-all ${activeTab === 'matchupMatrix'
                  ? 'bg-sage text-wood-dark shadow-glow-green'
                  : 'text-parchment-medium hover:text-parchment-light hover:bg-wood-medium'
                  }`}
              >
                🗺️ Matrix
              </button>

              {/* AUTO-BALANCER */}
              {/* AUTO-BALANCER */}
              <button
                onClick={() => setActiveTab('autoBalancer')}
                className={`px-3 py-2 rounded-md text-sm font-display font-bold transition-all ${activeTab === 'autoBalancer'
                  ? 'bg-sage text-wood-dark shadow-glow-green'
                  : 'text-parchment-medium hover:text-parchment-light hover:bg-wood-medium'
                  }`}
              >
                ⚖️ Auto
              </button>

              {/* CHARACTER CREATOR */}
              {/* CHARACTER CREATOR */}
              <button
                onClick={() => setActiveTab('characterCreator')}
                className={`px-3 py-2 rounded-md text-sm font-display font-bold transition-all ${activeTab === 'characterCreator'
                  ? 'bg-sage text-wood-dark shadow-glow-green'
                  : 'text-parchment-medium hover:text-parchment-light hover:bg-wood-medium'
                  }`}
              >
                👤 Creator
              </button>

              {/* SPELLS */}
              {/* SPELL LIBRARY */}
              <button
                onClick={() => setActiveTab('spellLibrary')}
                className={`px-3 py-2 rounded-md text-sm font-display font-bold transition-all ${activeTab === 'spellLibrary'
                  ? 'bg-sage text-wood-dark shadow-glow-green'
                  : 'text-parchment-medium hover:text-parchment-light hover:bg-wood-medium'
                  }`}
              >
                📚 Spells
              </button>
              {/* SPELL CREATION */}
              <button
                onClick={() => setActiveTab('spellCreation')}
                className={`px-3 py-2 rounded-md text-sm font-display font-bold transition-all ${activeTab === 'spellCreation'
                  ? 'bg-sage text-wood-dark shadow-glow-green'
                  : 'text-parchment-medium hover:text-parchment-light hover:bg-wood-medium'
                  }`}
              >
                ✨ Create Spell
              </button>

              {/* CHARACTERS */}
              {/* CHARACTER MANAGER */}
              <button
                onClick={() => setActiveTab('characterManager')}
                className={`px-3 py-2 rounded-md text-sm font-display font-bold transition-all ${activeTab === 'characterManager'
                  ? 'bg-sage text-wood-dark shadow-glow-green'
                  : 'text-parchment-medium hover:text-parchment-light hover:bg-wood-medium'
                  }`}
              >
                👥 Manager
              </button>

              {/* ARENAS */}
              {/* GRID ARENA */}
              <button
                onClick={() => setActiveTab('gridArena')}
                className={`px-3 py-2 rounded-md text-sm font-display font-bold transition-all ${activeTab === 'gridArena'
                  ? 'bg-sage text-wood-dark shadow-glow-green'
                  : 'text-parchment-medium hover:text-parchment-light hover:bg-wood-medium'
                  }`}
              >
                ⚔️ Grid
              </button>

              {/* TESTING */}
              {/* TESTING */}
              <button
                onClick={() => setActiveTab('testing')}
                className={`px-3 py-2 rounded-md text-sm font-display font-bold transition-all ${activeTab === 'testing'
                  ? 'bg-sage text-wood-dark shadow-glow-green'
                  : 'text-parchment-medium hover:text-parchment-light hover:bg-wood-medium'
                  }`}
              >
                🧪 Testing
              </button>

              {/* FANTASY SHOWCASE */}
              <button
                onClick={() => setActiveTab('fantasyShowcase')}
                className={`px-3 py-2 rounded-md text-sm font-display font-bold transition-all ${activeTab === 'fantasyShowcase'
                  ? 'bg-sage text-wood-dark shadow-glow-green'
                  : 'text-parchment-medium hover:text-parchment-light hover:bg-wood-medium'
                  }`}
              >
                🎨 Fantasy UI
              </button>
              {/* IDLE ARENA */}
              <button
                onClick={() => setActiveTab('idleArena')}
                className={`px-3 py-2 rounded-md text-sm font-display font-bold transition-all ${activeTab === 'idleArena'
                  ? 'bg-sage text-wood-dark shadow-glow-green'
                  : 'text-parchment-medium hover:text-parchment-light hover:bg-wood-medium'
                  }`}
              >
                💤 Idle
              </button>
            </nav>
          </div>
        </div>
      </div>

      {/* Content */}
      {activeTab === 'balancer' && (
        <div className="p-8 flex items-center justify-center">
          <ErrorBoundary componentName="Balancer">
            <Balancer />
          </ErrorBoundary>
        </div>
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
          <SpellCreation />
        </ErrorBoundary>
      )}
      {activeTab === 'characterManager' && (
        <ErrorBoundary componentName="Character Manager">
          <CharacterManager />
        </ErrorBoundary>
      )}
      {activeTab === 'gridArena' && (
        <ErrorBoundary componentName="Grid Arena">
          <GridArena />
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
    </div>
  );
}

export default App;
