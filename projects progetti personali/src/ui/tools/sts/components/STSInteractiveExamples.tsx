/**
 * STS Interactive Examples Component
 * 
 * Interactive examples and code snippets for STS Numeric Simulator
 * demonstrating core concepts, common patterns, and troubleshooting scenarios.
 */

import React, { useState, useCallback, useMemo } from 'react';
import { useSTSDebugTools } from '../utils/STSDebugTools';

interface Example {
  id: string;
  title: string;
  description: string;
  category: 'basic' | 'advanced' | 'troubleshooting' | 'performance';
  code: string;
  runnable: boolean;
  component?: React.ComponentType<any>;
}

interface InteractiveExampleProps {
  selectedExample?: string;
  onExampleSelect?: (exampleId: string) => void;
}

/**
 * Interactive Examples Component
 */
export const STSInteractiveExamples: React.FC<InteractiveExampleProps> = ({
  selectedExample,
  onExampleSelect,
}) => {
  const { log, detectIssues, analyzeManaCurve, analyzePerformance, analyzeAgency } = useSTSDebugTools();
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<any>(null);

  const examples: Example[] = [
    {
      id: 'basic-card-play',
      title: 'Basic Card Play',
      description: 'Demonstrates how to play a card from hand with mana validation',
      category: 'basic',
      code: `// Basic card play example
const handleCardPlay = (cardIndex: number) => {
  const card = state.hand[cardIndex];
  
  // Check if we can afford it
  if (canAffordCard(card, state.mana)) {
    // Deduct mana
    const newMana = deductMana(state.mana, card.cost);
    
    // Apply effects
    const newState = applyCardEffects(card, state);
    
    // Remove card from hand
    const newHand = state.hand.filter((_, i) => i !== cardIndex);
    
    // Update state
    updateState({
      ...newState,
      mana: newMana,
      hand: newHand
    });
    
    // Log the action
    log(\`Played \${card.name} for \${card.cost} mana\`);
  } else {
    logError("Cannot afford this card!");
  }
};`,
      runnable: true,
    },
    {
      id: 'mana-management',
      title: 'Mana Management',
      description: 'Shows how to manage dual-track mana system',
      category: 'basic',
      code: `// Mana management example
const manageManaResources = (state: SimulatorState) => {
  const { resonance, inspiration } = state.mana;
  
  // Check for mana issues
  const issues = [];
  
  if (resonance.alteration < 2) {
    issues.push("Low alteration mana - consider defensive plays");
  }
  
  if (inspiration.current > inspiration.maxStack * 0.8) {
    issues.push("High inspiration stack - use it or lose it!");
  }
  
  // Calculate mana efficiency
  const efficiency = calculateManaEfficiency(state);
  
  return {
    issues,
    efficiency,
    recommendations: generateManaRecommendations(state)
  };
};`,
      runnable: true,
    },
    {
      id: 'enemy-intent',
      title: 'Enemy Intent Selection',
      description: 'Demonstrates weighted enemy intent selection',
      category: 'advanced',
      code: `// Enemy intent selection example
const selectEnemyIntent = (enemyProfile: EnemyIntentProfile, playerState: PlayerState) => {
  // Apply reactive modifiers
  const modifiedWeights = applyReactiveModifiers(
    enemyProfile.intents, 
    enemyProfile.reactiveModifiers, 
    playerState
  );
  
  // Select intent based on weights
  const intent = weightedRandom(modifiedWeights);
  
  // Calculate actual values
  const result = {
    type: intent.type,
    value: calculateIntentValue(intent),
    description: generateIntentDescription(intent)
  };
  
  return result;
};`,
      runnable: true,
    },
    {
      id: 'performance-optimization',
      title: 'Performance Optimization',
      description: 'Shows React optimization patterns for better performance',
      category: 'performance',
      code: `// Performance optimization example
const STSCombatLog = React.memo(({ logs, filters }) => {
  const filteredLogs = useMemo(() => 
    logs.filter(log => matchesFilters(log, filters)),
    [logs, filters]
  );
  
  return (
    <div className="combat-log">
      {filteredLogs.map(log => <LogEntry key={log.id} log={log} />)}
    </div>
  );
});

// Batch state updates
const batchStateUpdate = (updates: Partial<SimulatorState>) => {
  startTransition(() => {
    Object.entries(updates).forEach(([key, value]) => {
      setState(prev => ({ ...prev, [key]: value }));
    });
  });
};`,
      runnable: false,
    },
    {
      id: 'debugging-tools',
      title: 'Debugging Tools',
      description: 'Demonstrates how to use STS debug tools for troubleshooting',
      category: 'troubleshooting',
      code: `// Debug tools usage example
const MyComponent = () => {
  const { log, detectIssues, analyzeManaCurve } = useSTSDebugTools();
  
  const handleDebug = () => {
    // Log custom debug message
    log("Custom debug event", { data: "example" }, "custom");
    
    // Detect issues
    const issues = detectIssues();
    console.log("Detected issues:", issues);
    
    // Analyze mana curve
    const manaAnalysis = analyzeManaCurve();
    console.log("Mana curve analysis:", manaAnalysis);
  };
  
  return <button onClick={handleDebug}>Debug</button>;
};`,
      runnable: true,
    },
    {
      id: 'state-inspection',
      title: 'State Inspection',
      description: 'Shows how to inspect and analyze simulation state',
      category: 'troubleshooting',
      code: `// State inspection example
const inspectState = (state: SimulatorState) => {
  const analysis = {
    // Basic state info
    turn: state.turn,
    phase: state.phase,
    playerHP: state.player.hp,
    enemyHP: state.enemy.hp,
    
    // Mana analysis
    mana: {
      available: calculateAvailableMana(state.mana),
      resonance: state.mana.resonance,
      inspiration: state.mana.inspiration,
      efficiency: calculateManaEfficiency(state)
    },
    
    // Hand analysis
    hand: {
      size: state.hand.length,
      affordableCards: state.hand.filter(card => 
        canAffordCard(card, state.mana)
      ).length,
      avgCost: calculateAverageManaCost(state.hand)
    },
    
    // Agency analysis
    agency: {
      score: state.agencyMetrics.agencyScore,
      turnsWithoutAction: state.agencyMetrics.turnsWithoutAction,
      fallbackUsed: state.agencyMetrics.fallbackUsed
    }
  };
  
  return analysis;
};`,
      runnable: true,
    },
    {
      id: 'error-handling',
      title: 'Error Handling',
      description: 'Demonstrates proper error handling patterns',
      category: 'troubleshooting',
      code: `// Error handling example
const safeCardPlay = (cardIndex: number) => {
  try {
    const card = state.hand[cardIndex];
    
    if (!card) {
      throw new Error(\`No card found at index \${cardIndex}\`);
    }
    
    if (!canAffordCard(card, state.mana)) {
      log("Cannot afford card", { card: card.name, cost: card.cost }, "warning");
      return false;
    }
    
    const result = playCard(card);
    log("Card played successfully", { card: card.name, result }, "success");
    return true;
    
  } catch (error) {
    log("Card play failed", { error: error.message, cardIndex }, "error");
    return false;
  }
};`,
      runnable: true,
    },
  ];

  const filteredExamples = useMemo(() => {
    if (!selectedExample) return examples;
    return examples.filter(ex => ex.id === selectedExample);
  }, [selectedExample]);

  const currentExample = useMemo(() => {
    return filteredExamples[0] || examples[0];
  }, [filteredExamples]);

  const runExample = useCallback(async () => {
    if (!currentExample.runnable) return;
    
    setIsRunning(true);
    setResults(null);
    
    try {
      // Simulate running the example
      log(`Running example: ${currentExample.title}`, {}, 'example');
      
      // Simulate some processing time
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Generate results based on example type
      let results: any = {};
      
      switch (currentExample.id) {
        case 'basic-card-play':
          results = {
            status: 'success',
            message: 'Card played successfully',
            data: { cardPlayed: true, manaSpent: 3 }
          };
          break;
          
        case 'mana-management':
          results = analyzeManaCurve();
          break;
          
        case 'debugging-tools':
          results = detectIssues();
          break;
          
        case 'performance-optimization':
          results = analyzePerformance();
          break;
          
        case 'state-inspection':
          results = {
            status: 'completed',
            message: 'State inspection completed',
            data: { turn: 1, playerHP: 50, enemyHP: 75 }
          };
          break;
          
        default:
          results = {
            status: 'completed',
            message: 'Example executed successfully'
          };
      }
      
      setResults(results);
      log(`Example completed: ${currentExample.title}`, results, 'example');
      
    } catch (error) {
      const errorResults = {
        status: 'error',
        message: error instanceof Error ? error.message : 'Unknown error',
        error: error
      };
      
      setResults(errorResults);
      log(`Example failed: ${currentExample.title}`, errorResults, 'error');
      
    } finally {
      setIsRunning(false);
    }
  }, [currentExample, log, detectIssues, analyzeManaCurve, analyzePerformance]);

  const copyCode = useCallback(() => {
    navigator.clipboard.writeText(currentExample.code);
    log('Code copied to clipboard', {}, 'example');
  }, [currentExample.code, log]);

  const categoryColors = {
    basic: 'bg-green-100 text-green-800',
    advanced: 'bg-blue-100 text-blue-800',
    troubleshooting: 'bg-red-100 text-red-800',
    performance: 'bg-purple-100 text-purple-800',
  };

  return (
    <div className="sts-interactive-examples p-6 bg-white rounded-lg shadow-lg">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          STS Interactive Examples
        </h2>
        <p className="text-gray-600 mb-4">
          Interactive examples and code snippets demonstrating STS concepts and troubleshooting.
        </p>
        
        {/* Category Filter */}
        <div className="flex flex-wrap gap-2 mb-4">
          {Array.from(new Set(examples.map(ex => ex.category))).map(category => (
            <button
              key={category}
              onClick={() => onExampleSelect?.(undefined)}
              className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${categoryColors[category as keyof typeof categoryColors]}`}
            >
              {category.charAt(0).toUpperCase() + category.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Example Selector */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Select Example
        </label>
        <select
          value={selectedExample || ''}
          onChange={(e) => onExampleSelect?.(e.target.value || undefined)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Examples</option>
          {examples.map(example => (
            <option key={example.id} value={example.id}>
              {example.title}
            </option>
          ))}
        </select>
      </div>

      {/* Example Display */}
      <div className="space-y-6">
        <div className="border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                {currentExample.title}
              </h3>
              <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${categoryColors[currentExample.category]}`}>
                {currentExample.category}
              </span>
            </div>
            <div className="flex gap-2">
              {currentExample.runnable && (
                <button
                  onClick={runExample}
                  disabled={isRunning}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                >
                  {isRunning ? 'Running...' : 'Run Example'}
                </button>
              )}
              <button
                onClick={copyCode}
                className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
              >
                Copy Code
              </button>
            </div>
          </div>
          
          <p className="text-gray-600 mb-4">
            {currentExample.description}
          </p>
          
          {/* Code Display */}
          <div className="relative">
            <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
              <code className="text-sm">{currentExample.code}</code>
            </pre>
            <button
              onClick={copyCode}
              className="absolute top-2 right-2 p-2 bg-gray-700 text-white rounded hover:bg-gray-600 transition-colors"
              title="Copy code"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h2a2 2 0 012 2v2m-6 0h6a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2a2 2 0 012 2v2" />
              </svg>
            </button>
          </div>
        </div>

        {/* Results */}
        {results && (
          <div className="border border-gray-200 rounded-lg p-4">
            <h4 className="text-lg font-semibold text-gray-900 mb-2">
              Results
            </h4>
            <div className={`p-3 rounded-md ${
              results.status === 'success' ? 'bg-green-50 text-green-800' :
              results.status === 'error' ? 'bg-red-50 text-red-800' :
              'bg-gray-50 text-gray-800'
            }`}>
              <pre className="text-sm">{JSON.stringify(results, null, 2)}</pre>
            </div>
          </div>
        )}
      </div>

      {/* Instructions */}
      <div className="border border-gray-200 rounded-lg p-4">
        <h4 className="text-lg font-semibold text-gray-900 mb-2">
          How to Use
        </h4>
        <ol className="list-decimal list-inside space-y-2 text-sm text-gray-600">
          <li>Select an example from the dropdown or filter by category</li>
          <li>Click "Run Example" to execute the interactive demonstration</li>
          <li>View the results and debug output in the console</li>
          <li>Copy the code to use in your own components</li>
          <li>Use the debug tools to analyze your own simulations</li>
        </ol>
        
        <div className="mt-4 p-3 bg-blue-50 rounded-md">
          <p className="text-sm text-blue-800">
            <strong>Pro Tip:</strong> Open your browser's developer console to see detailed debug logs and performance metrics.
          </p>
        </div>
      </div>
    </div>
  );
};

/**
 * Code Block Component
 */
interface CodeBlockProps {
  code: string;
  language?: string;
  title?: string;
  onCopy?: () => void;
}

export const CodeBlock: React.FC<CodeBlockProps> = ({ 
  code, 
  language = 'typescript', 
  title, 
  onCopy 
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    onCopy?.();
    setTimeout(() => setCopied(false), 2000);
  }, [code, onCopy]);

  return (
    <div className="code-block">
      {title && (
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-sm font-medium text-gray-700">{title}</h4>
          <button
            onClick={handleCopy}
            className="text-xs px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded transition-colors"
          >
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>
      )}
      <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
        <code className={`language-${language}`}>{code}</code>
      </pre>
    </div>
  );
};

/**
 * Interactive Example Runner Component
 */
interface ExampleRunnerProps {
  example: Example;
  onComplete?: (results: any) => void;
}

export const ExampleRunner: React.FC<ExampleRunnerProps> = ({ 
  example, 
  onComplete 
}) => {
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const runExample = useCallback(async () => {
    setIsRunning(true);
    setResults(null);
    setError(null);

    try {
      // Create a safe evaluation context
      const safeCode = `
        (function() {
          ${example.code}
          return { success: true };
        })()
      `;

      // Evaluate the code (in a real implementation, this would be more sophisticated)
      const evaluationResults = { success: true, message: 'Example executed successfully' };
      
      setResults(evaluationResults);
      onComplete?.(evaluationResults);
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      setResults({ success: false, error: errorMessage });
    } finally {
      setIsRunning(false);
    }
  }, [example, onComplete]);

  return (
    <div className="example-runner">
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-lg font-semibold text-gray-900">
          {example.title}
        </h4>
        <button
          onClick={runExample}
          disabled={isRunning || !example.runnable}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          {isRunning ? 'Running...' : 'Run'}
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-800">Error: {error}</p>
        </div>
      )}

      {results && (
        <div className="p-3 bg-gray-50 rounded-md">
          <pre className="text-sm text-gray-800">{JSON.stringify(results, null, 2)}</pre>
        </div>
      )}
    </div>
  );
};

/**
 * Troubleshooting Checklist Component
 */
export const TroubleshootingChecklist: React.FC = () => {
  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set());

  const checklistItems = [
    {
      id: 'mana-screw',
      title: 'Mana Screw/Flood',
      description: 'Player cannot cast any cards due to insufficient mana',
      solution: 'Check deck configuration for mana curve balance',
      category: 'critical'
    },
    {
      id: 'performance',
      title: 'Slow Performance',
      description: 'Simulation becomes slow after many turns',
      solution: 'Use React.memo and limit log size',
      category: 'high'
    },
    {
      id: 'memory-leak',
      title: 'Memory Leak',
      description: 'Memory usage grows continuously',
      solution: 'Check event listeners and array bounds',
      category: 'medium'
    },
    {
      id: 'inconsistent-rng',
      title: 'Inconsistent Randomness',
      description: 'Same seed produces different results',
      solution: 'Use single RNG instance with proper seeding',
      category: 'medium'
    },
    {
      id: 'state-corruption',
      title: 'State Corruption',
      description: 'Invalid state values detected',
      solution: 'Add validation checks and proper error handling',
      category: 'critical'
    },
  ];

  const toggleItem = (id: string) => {
    setCheckedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const categoryColors = {
    critical: 'border-red-500',
    high: 'border-orange-500',
    medium: 'border-yellow-500',
    low: 'border-green-500',
  };

  return (
    <div className="troubleshooting-checklist p-6 bg-white rounded-lg shadow-lg">
      <h3 className="text-xl font-bold text-gray-900 mb-4">
        Troubleshooting Checklist
      </h3>
      
      <div className="space-y-3">
        {checklistItems.map(item => (
          <div
            key={item.id}
            className={`border-l-4 ${categoryColors[item.category as keyof typeof categoryColors]} p-4 rounded-r-lg bg-gray-50`}
          >
            <div className="flex items-start">
              <input
                type="checkbox"
                id={item.id}
                checked={checkedItems.has(item.id)}
                onChange={() => toggleItem(item.id)}
                className="mt-1 mr-3"
              />
              <div className="flex-1">
                <h4 className="text-base font-semibold text-gray-900">
                  {item.title}
                </h4>
                <p className="text-sm text-gray-600 mt-1">
                  {item.description}
                </p>
                <p className="text-sm text-gray-500 mt-2">
                  <strong>Solution:</strong> {item.solution}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-6 p-4 bg-blue-50 rounded-md">
        <p className="text-sm text-blue-800">
          <strong>Tip:</strong> Check items as you resolve issues. This helps track your troubleshooting progress.
        </p>
      </div>
    </div>
  );
};
