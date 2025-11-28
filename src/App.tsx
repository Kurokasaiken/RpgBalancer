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

type Tab = 'balancer' | 'archetypes' | 'spellLibrary' | 'spellCreation' | 'characterManager' | 'gridArena' | 'idleArena' | 'testing';

function App() {
  const [activeTab, setActiveTab] = useState<Tab>('balancer');

  // Listen for spell creation navigation from SpellLibrary
  useEffect(() => {
    const handleNavigate = () => setActiveTab('spellCreation');
    window.addEventListener('navigate-spell-creation', handleNavigate as EventListener);
    return () => window.removeEventListener('navigate-spell-creation', handleNavigate as EventListener);
  }, []);

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Tab Navigation */}
      <div className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-8">
          <nav className="flex space-x-8 overflow-x-auto">
            {/* BALANCING */}
            <button
              onClick={() => setActiveTab('balancer')}
              className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors ${activeTab === 'balancer'
                ? 'border-purple-500 text-white'
                : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-300'
                }`}
            >
              ⚖️ Balancer
            </button>

            {/* ARCHETYPES */}
            <button
              onClick={() => setActiveTab('archetypes')}
              className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors ${activeTab === 'archetypes'
                ? 'border-purple-500 text-white'
                : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-300'
                }`}
            >
              🎭 Archetypes
            </button>

            {/* SPELLS */}
            <button
              onClick={() => setActiveTab('spellLibrary')}
              className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors ${activeTab === 'spellLibrary'
                ? 'border-purple-500 text-white'
                : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-300'
                }`}
            >
              📚 Spell Library
            </button>
            <button
              onClick={() => setActiveTab('spellCreation')}
              className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors ${activeTab === 'spellCreation'
                ? 'border-purple-500 text-white'
                : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-300'
                }`}
            >
              🔮 Spell Creation
            </button>

            {/* CHARACTERS */}
            <button
              onClick={() => setActiveTab('characterManager')}
              className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors ${activeTab === 'characterManager'
                ? 'border-purple-500 text-white'
                : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-300'
                }`}
            >
              👤 Character Manager
            </button>

            {/* ARENAS */}
            <button
              onClick={() => setActiveTab('gridArena')}
              className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors ${activeTab === 'gridArena'
                ? 'border-purple-500 text-white'
                : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-300'
                }`}
            >
              ⚔️ Grid Arena
            </button>

            {/* TESTING */}
            <button
              onClick={() => setActiveTab('testing')}
              className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors ${activeTab === 'testing'
                ? 'border-purple-500 text-white'
                : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-300'
                }`}
            >
              🧪 Testing
            </button>
            <button
              onClick={() => setActiveTab('idleArena')}
              className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors ${activeTab === 'idleArena'
                ? 'border-purple-500 text-white'
                : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-300'
                }`}
            >
              🤖 Idle Arena
            </button>
          </nav>
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
    </div>
  );
}

export default App;
