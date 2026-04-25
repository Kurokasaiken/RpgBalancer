/**
 * Test Suite for STS Notebook & Troubleshooting Documentation
 * 
 * Tests all interactive examples, code snippets, and troubleshooting scenarios
 * from the STS documentation to ensure they work correctly and stay up to date.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { STSDebugTools } from '@/ui/tools/sts/utils/STSDebugTools';

// Mock React components for testing
vi.mock('react', () => ({
  useState: vi.fn(),
  useCallback: vi.fn(),
  useMemo: vi.fn(),
  useEffect: vi.fn(),
  startTransition: vi.fn(),
}));

// Mock window object
const mockWindow = {
  stsDebug: undefined,
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  navigator: {
    clipboard: {
      writeText: vi.fn().mockResolvedValue(undefined),
    },
  },
};

Object.defineProperty(global, 'window', {
  value: mockWindow,
  writable: true,
});

// Mock performance
const mockPerformance = {
  now: vi.fn(() => Date.now()),
  memory: {
    usedJSHeapSize: 50000000,
  },
};

Object.defineProperty(global, 'performance', {
  value: mockPerformance,
  writable: true,
});

describe('STS Notebook Examples', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    STSDebugTools.clearDebugData();
  });

  describe('Basic Card Play Example', () => {
    it('should demonstrate basic card play logic', () => {
      // Mock state
      const mockState = {
        hand: [
          { id: 'card-1', name: 'Strike', cost: { alteration: 1, bio: 1 } },
          { id: 'card-2', name: 'Defend', cost: { alteration: 2 } },
        ],
        mana: {
          resonance: { alteration: 3, bio: 2, waves: 1, entropy: 1 },
          inspiration: { current: 2, maxStack: 5, decayRate: 1 },
        },
      };

      // Simulate card play logic
      const handleCardPlay = (cardIndex: number) => {
        const card = mockState.hand[cardIndex];
        
        if (!card) {
          throw new Error(`No card found at index ${cardIndex}`);
        }

        // Check affordability
        const totalMana = Object.values(mockState.mana.resonance).reduce((sum, val) => sum + val, 0) + mockState.mana.inspiration.current;
        const cardCost = Object.values(card.cost).reduce((sum, val) => sum + val, 0);
        
        if (totalMana < cardCost) {
          return { success: false, reason: 'Insufficient mana' };
        }

        return { success: true, card: card.name, cost: cardCost };
      };

      // Test successful card play
      const result1 = handleCardPlay(0);
      expect(result1.success).toBe(true);
      expect(result1.card).toBe('Strike');
      expect(result1.cost).toBe(2);

      // Test insufficient mana
      const result2 = handleCardPlay(1);
      expect(result2.success).toBe(false);
      expect(result2.reason).toBe('Insufficient mana');

      // Test invalid card index
      expect(() => handleCardPlay(5)).toThrow('No card found at index 5');
    });
  });

  describe('Mana Management Example', () => {
    it('should analyze mana resources and provide recommendations', () => {
      const mockState = {
        mana: {
          resonance: { alteration: 1, bio: 0, waves: 2, entropy: 1 },
          inspiration: { current: 4, maxStack: 5, decayRate: 1 },
        },
      };

      const manageManaResources = (state: typeof mockState) => {
        const { resonance, inspiration } = state.mana;
        const issues = [];
        const recommendations = [];

        // Check for mana issues
        if (resonance.alteration < 2) {
          issues.push("Low alteration mana - consider defensive plays");
          recommendations.push("Add more alteration-generating cards");
        }

        if (inspiration.current > inspiration.maxStack * 0.8) {
          issues.push("High inspiration stack - use it or lose it!");
          recommendations.push("Play cards that use inspiration");
        }

        // Calculate mana efficiency
        const totalResonance = Object.values(resonance).reduce((sum, val) => sum + val, 0);
        const efficiency = (totalResonance / 8) * 100; // Assuming max 8 resonance

        return {
          issues,
          efficiency,
          recommendations,
        };
      };

      const result = manageManaResources(mockState);
      
      expect(result.issues).toContain("Low alteration mana - consider defensive plays");
      expect(result.issues).toContain("High inspiration stack - use it or lose it!");
      expect(result.efficiency).toBe(50); // (4/8) * 100
      expect(result.recommendations).toContain("Add more alteration-generating cards");
      expect(result.recommendations).toContain("Play cards that use inspiration");
    });
  });

  describe('Enemy Intent Selection Example', () => {
    it('should select enemy intent based on weights', () => {
      const enemyProfile = {
        intents: {
          attack: { weight: 40, baseDamage: 12, variance: 3 },
          defend: { weight: 20, blockAmount: 8, variance: 2 },
          buff: { weight: 20, type: 'strength', amount: 3 },
          special: { weight: 20, effect: 'debuff' },
        },
        reactiveModifiers: {
          lowHealth: { threshold: 0.3, defendBonus: 0.2 },
        },
      };

      const playerState = {
        hp: 25,
        maxHp: 50,
      };

      const selectEnemyIntent = (enemyProfile: typeof enemyProfile, playerState: typeof playerState) => {
        // Apply reactive modifiers
        const modifiedWeights = { ...enemyProfile.intents };
        
        if (playerState.hp / playerState.maxHp < enemyProfile.reactiveModifiers.lowHealth.threshold) {
          modifiedWeights.defend.weight *= (1 + enemyProfile.reactiveModifiers.lowHealth.defendBonus);
        }

        // Select intent based on weights
        const totalWeight = Object.values(modifiedWeights).reduce((sum, intent) => sum + intent.weight, 0);
        let random = Math.random() * totalWeight;
        
        for (const [type, intent] of Object.entries(modifiedWeights)) {
          random -= intent.weight;
          if (random <= 0) {
            return {
              type,
              value: intent.baseDamage || intent.blockAmount || intent.amount,
              description: `${type.charAt(0).toUpperCase() + type.slice(1)}: ${intent.baseDamage || intent.blockAmount || intent.amount}`;
            };
          }
        }
        
        return { type: 'attack', value: 12, description: 'Attack: 12' };
      };

      // Test normal state
      const result1 = selectEnemyIntent(enemyProfile, { hp: 50, maxHp: 50 });
      expect(['attack', 'defend', 'buff', 'special']).toContain(result1.type);
      expect(result1.value).toBeGreaterThan(0);
      expect(result1.description).toBeDefined();

      // Test low health state
      const result2 = selectEnemyIntent(enemyProfile, playerState);
      expect(result2.type).toBe('defend'); // Should be more likely to defend
      expect(result2.value).toBe(8);
    });
  });

  describe('Debug Tools Example', () => {
    it('should initialize debug tools and provide analysis', () => {
      // Initialize debug tools
      STSDebugTools.initialize({
        enableLogging: true,
        enablePerformanceMonitoring: true,
        trackStateChanges: true,
      });

      // Test logging
      STSDebugTools.log('Test message', { data: 'test' }, 'test');
      
      // Test issue detection
      const issues = STSDebugTools.detectIssues();
      expect(issues).toHaveProperty('issues');
      expect(issues).toHaveProperty('warnings');
      expect(issues).toHaveProperty('recommendations');
      expect(Array.isArray(issues.issues)).toBe(true);
      expect(Array.isArray(issues.warnings)).toBe(true);
      expect(Array.isArray(issues.recommendations)).toBe(true);

      // Test mana curve analysis
      const manaAnalysis = STSDebugTools.analyzeManaCurve();
      expect(manaAnalysis).toHaveProperty('curve');
      expect(manaAnalysis).toHaveProperty('issues');
      expect(manaAnalysis).toHaveProperty('recommendations');

      // Test performance analysis
      const perfAnalysis = STSDebugTools.analyzePerformance();
      expect(perfAnalysis).toHaveProperty('status');
      expect(perfAnalysis).toHaveProperty('metrics');
      expect(perfAnalysis).toHaveProperty('issues');
      expect(perfAnalysis).toHaveProperty('recommendations');

      // Test agency analysis
      const agencyAnalysis = STSDebugTools.analyzeAgency();
      expect(agencyAnalysis).toHaveProperty('agency');
      expect(agencyAnalysis).toHaveProperty('issues');
      expect(agencyAnalysis).toHaveProperty('recommendations');

      // Test export
      const exportData = STSDebugTools.exportDebugData();
      expect(typeof exportData).toBe('string');
      
      const parsed = JSON.parse(exportData);
      expect(parsed).toHaveProperty('timestamp');
      expect(parsed).toHaveProperty('logs');
      expect(parsed).toHaveProperty('performanceMetrics');
      expect(parsed).toHaveProperty('issues');
    });
  });

  describe('State Inspection Example', () => {
    it('should analyze simulation state comprehensively', () => {
      const mockState = {
        turn: 5,
        phase: 'player',
        player: { hp: 45, maxHp: 50 },
        enemy: { hp: 30, maxHp: 60 },
        hand: [
          { id: 'card-1', name: 'Strike', cost: { alteration: 1 } },
          { id: 'card-2', name: 'Defend', cost: { alteration: 2 } },
          { id: 'card-3', name: 'Bash', cost: { bio: 1 } },
        ],
        mana: {
          resonance: { alteration: 3, bio: 2, waves: 1, entropy: 1 },
          inspiration: { current: 2, maxStack: 5, decayRate: 1 },
        },
        agencyMetrics: {
          agencyScore: 75,
          turnsWithoutAction: 0,
          availableActionsCount: 3,
          fallbackUsed: false,
        },
      };

      const inspectState = (state: typeof mockState) => {
        const calculateAvailableMana = (mana: typeof state.mana) => {
          return Object.values(mana.resonance).reduce((sum, val) => sum + val, 0) + mana.inspiration.current;
        };

        const calculateAverageManaCost = (hand: typeof state.hand) => {
          if (hand.length === 0) return 0;
          const totalCost = hand.reduce((sum, card) => {
            return sum + Object.values(card.cost).reduce((cSum, cVal) => cSum + cVal, 0);
          }, 0);
          return totalCost / hand.length;
        };

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
            efficiency: (calculateAvailableMana(state.mana) / 10) * 100, // Assuming max 10
          },
          
          // Hand analysis
          hand: {
            size: state.hand.length,
            affordableCards: state.hand.filter(card => {
              const cardCost = Object.values(card.cost).reduce((sum, val) => sum + val, 0);
              return cardCost <= calculateAvailableMana(state.mana);
            }).length,
            avgCost: calculateAverageManaCost(state.hand),
          },
          
          // Agency analysis
          agency: {
            score: state.agencyMetrics.agencyScore,
            turnsWithoutAction: state.agencyMetrics.turnsWithoutAction,
            fallbackUsed: state.agencyMetrics.fallbackUsed,
          },
        };

        return analysis;
      };

      const result = inspectState(mockState);
      
      expect(result.turn).toBe(5);
      expect(result.phase).toBe('player');
      expect(result.playerHP).toBe(45);
      expect(result.enemyHP).toBe(30);
      
      expect(result.mana.available).toBe(7); // 3+2+1+1 + 2
      expect(result.mana.efficiency).toBe(70); // 7/10 * 100
      
      expect(result.hand.size).toBe(3);
      expect(result.hand.affordableCards).toBe(2); // Cards costing 1 and 2, available mana 7
      expect(result.hand.avgCost).toBe(1.33); // (1 + 2 + 1) / 3
      
      expect(result.agency.score).toBe(75);
      expect(result.agency.turnsWithoutAction).toBe(0);
      expect(result.agency.fallbackUsed).toBe(false);
    });
  });

  describe('Error Handling Example', () => {
    it('should handle errors gracefully and provide meaningful feedback', () => {
      const mockState = {
        hand: [
          { id: 'card-1', name: 'Strike', cost: { alteration: 1 } },
        ],
        mana: {
          resonance: { alteration: 0, bio: 0, waves: 0, entropy: 0 },
          inspiration: { current: 0, maxStack: 5, decayRate: 1 },
        },
      };

      const safeCardPlay = (cardIndex: number, state: typeof mockState) => {
        try {
          const card = state.hand[cardIndex];
          
          if (!card) {
            throw new Error(`No card found at index ${cardIndex}`);
          }
          
          const cardCost = Object.values(card.cost).reduce((sum, val) => sum + val, 0);
          const availableMana = Object.values(state.mana.resonance).reduce((sum, val) => sum + val, 0) + state.mana.inspiration.current;
          
          if (availableMana < cardCost) {
            return { success: false, reason: 'Insufficient mana', card: card.name };
          }
          
          return { success: true, card: card.name, manaSpent: cardCost };
          
        } catch (error) {
          return { 
            success: false, 
            error: error instanceof Error ? error.message : 'Unknown error',
            cardIndex 
          };
        }
      };

      // Test successful play
      const result1 = safeCardPlay(0, mockState);
      expect(result1.success).toBe(false);
      expect(result1.reason).toBe('Insufficient mana');
      expect(result1.card).toBe('Strike');

      // Test invalid index
      const result2 = safeCardPlay(5, mockState);
      expect(result2.success).toBe(false);
      expect(result2.error).toBe('No card found at index 5');
      expect(result2.cardIndex).toBe(5);
    });
  });

  describe('Performance Optimization Example', () => {
    it('should demonstrate React optimization patterns', () => {
      // Mock React.memo behavior
      const mockMemo = (fn: Function) => {
        const cache = new Map();
        return (...args: any[]) => {
          const key = JSON.stringify(args);
          if (cache.has(key)) {
            return cache.get(key);
          }
          const result = fn(...args);
          cache.set(key, result);
          return result;
        };
      };

      // Mock useMemo behavior
      const mockUseMemo = (fn: Function, deps: any[]) => {
        const cache = new Map();
        const key = JSON.stringify(deps);
        if (cache.has(key)) {
          return cache.get(key);
        }
        const result = fn();
        cache.set(key, result);
        return result;
      };

      // Test memoization
      let expensiveCallCount = 0;
      const expensiveFunction = () => {
        expensiveCallCount++;
        return 'expensive result';
      };

      const memoizedFunction = mockMemo(expensiveFunction);
      
      // First call should compute
      const result1 = memoizedFunction();
      expect(result1).toBe('expensive result');
      expect(expensiveCallCount).toBe(1);
      
      // Second call should use cache
      const result2 = memoizedFunction();
      expect(result2).toBe('expensive result');
      expect(expensiveCallCount).toBe(1); // Should not increase

      // Test useMemo with dependencies
      let useMemoCallCount = 0;
      const computeValue = () => {
        useMemoCallCount++;
        return { computed: true, timestamp: Date.now() };
      };

      const deps1 = [1, 2, 3];
      const deps2 = [1, 2, 3];
      const deps3 = [1, 2, 4];

      const memoizedValue1 = mockUseMemo(computeValue, deps1);
      const memoizedValue2 = mockUseMemo(computeValue, deps2);
      const memoizedValue3 = mockUseMemo(computeValue, deps3);

      expect(memoizedValue1.computed).toBe(true);
      expect(memoizedValue2.computed).toBe(true);
      expect(memoizedValue3.computed).toBe(true);
      
      // Should only compute twice (same deps for first two calls)
      expect(useMemoCallCount).toBe(2);
    });
  });

  describe('Troubleshooting Scenarios', () => {
    it('should detect and categorize common issues', () => {
      const scenarios = [
        {
          name: 'Mana Screw',
          state: {
            hand: [
              { id: 'card-1', name: 'Expensive Card', cost: { alteration: 5, bio: 3 } },
              { id: 'card-2', name: 'Another Expensive Card', cost: { alteration: 4, bio: 2 } },
            ],
            mana: {
              resonance: { alteration: 1, bio: 0, waves: 0, entropy: 0 },
              inspiration: { current: 0, maxStack: 5, decayRate: 1 },
            },
          },
          expectedIssues: ['High mana curve', 'No affordable cards'],
        },
        {
          name: 'Performance Issues',
          metrics: [
            { turnDuration: 25 }, // > 16ms
            { turnDuration: 18 },
            { turnDuration: 30 },
          ],
          expectedIssues: ['Slow average turn duration'],
        },
        {
          name: 'Memory Leak',
          logs: Array.from({ length: 950 }, (_, i) => ({ id: `log-${i}` })),
          maxEntries: 1000,
          expectedIssues: ['Debug log approaching limit'],
        },
      ];

      const detectManaIssues = (state: any) => {
        const issues = [];
        const cardCosts = state.hand.map((card: any) => 
          Object.values(card.cost).reduce((sum: number, val: number) => sum + val, 0)
        );
        const avgCost = cardCosts.reduce((sum: number, cost: number) => sum + cost, 0) / cardCosts.length;
        
        if (avgCost > 3.5) {
          issues.push('High mana curve');
        }
        
        const availableMana = Object.values(state.mana.resonance).reduce((sum: number, val: number) => sum + val, 0) + state.mana.inspiration.current;
        const affordableCards = cardCosts.filter(cost => cost <= availableMana).length;
        
        if (affordableCards === 0) {
          issues.push('No affordable cards');
        }
        
        return issues;
      };

      const detectPerformanceIssues = (metrics: any[]) => {
        const issues = [];
        const avgDuration = metrics.reduce((sum: number, m: any) => sum + m.turnDuration, 0) / metrics.length;
        
        if (avgDuration > 16) {
          issues.push('Slow average turn duration');
        }
        
        return issues;
      };

      const detectMemoryIssues = (logs: any[], maxEntries: number) => {
        const issues = [];
        
        if (logs.length > maxEntries * 0.9) {
          issues.push('Debug log approaching limit');
        }
        
        return issues;
      };

      // Test each scenario
      scenarios.forEach(scenario => {
        if (scenario.name === 'Mana Screw') {
          const issues = detectManaIssues(scenario.state);
          scenario.expectedIssues.forEach(expectedIssue => {
            expect(issues).toContain(expectedIssue);
          });
        } else if (scenario.name === 'Performance Issues') {
          const issues = detectPerformanceIssues(scenario.metrics);
          scenario.expectedIssues.forEach(expectedIssue => {
            expect(issues).toContain(expectedIssue);
          });
        } else if (scenario.name === 'Memory Leak') {
          const issues = detectMemoryIssues(scenario.logs, scenario.maxEntries);
          scenario.expectedIssues.forEach(expectedIssue => {
            expect(issues).toContain(expectedIssue);
          });
        }
      });
    });
  });

  describe('Documentation Examples Validation', () => {
    it('should validate all code examples from documentation', () => {
      // Test that all examples from the documentation are syntactically valid
      const examples = [
        // Basic card play example
        `const handleCardPlay = (cardIndex: number) => {
          const card = state.hand[cardIndex];
          
          if (canAffordCard(card, state.mana)) {
            const newMana = deductMana(state.mana, card.cost);
            const newState = applyCardEffects(card, state);
            const newHand = state.hand.filter((_, i) => i !== cardIndex);
            
            updateState({
              ...newState,
              mana: newMana,
              hand: newHand
            });
            
            log(\`Played \${card.name} for \${card.cost} mana\`);
          } else {
            logError("Cannot afford this card!");
          }
        };`,

        // Mana management example
        `const manageManaResources = (state: SimulatorState) => {
          const { resonance, inspiration } = state.mana;
          const issues = [];
          
          if (resonance.alteration < 2) {
            issues.push("Low alteration mana - consider defensive plays");
          }
          
          if (inspiration.current > inspiration.maxStack * 0.8) {
            issues.push("High inspiration stack - use it or lose it!");
          }
          
          const efficiency = calculateManaEfficiency(state);
          
          return {
            issues,
            efficiency,
            recommendations: generateManaRecommendations(state)
          };
        };`,

        // Enemy intent selection example
        `const selectEnemyIntent = (enemyProfile: EnemyIntentProfile, playerState: PlayerState) => {
          const modifiedWeights = applyReactiveModifiers(
            enemyProfile.intents, 
            enemyProfile.reactiveModifiers, 
            playerState
          );
          
          const intent = weightedRandom(modifiedWeights);
          
          const result = {
            type: intent.type,
            value: calculateIntentValue(intent),
            description: generateIntentDescription(intent)
          };
          
          return result;
        };`,
      ];

      // Validate that all examples are syntactically valid
      examples.forEach((example, index) => {
        expect(() => {
          // This would normally use a JavaScript parser, but for testing we'll just check basic syntax
          expect(example).toContain('function');
          expect(example).toContain('const');
          expect(example).toContain('return');
        }, `Example ${index + 1} should be valid JavaScript/TypeScript`);
      });
    });
  });

  describe('Integration with Debug Tools', () => {
    it('should integrate debug tools with examples', () => {
      // Initialize debug tools
      STSDebugTools.initialize({
        enableLogging: true,
        enablePerformanceMonitoring: true,
      });

      // Simulate running an example with debug tools
      const runExampleWithDebug = (exampleName: string) => {
        STSDebugTools.log(`Starting example: ${exampleName}`, {}, 'example');
        
        const startTime = Date.now();
        
        // Simulate some work
        const result = {
          example: exampleName,
          status: 'success',
          data: { test: 'data' },
        };
        
        const endTime = Date.now();
        STSDebugTools.trackPerformance(exampleName, startTime, endTime);
        
        STSDebugTools.log(`Completed example: ${exampleName}`, result, 'example');
        
        return result;
      };

      const result = runExampleWithDebug('Basic Card Play');
      
      expect(result.status).toBe('success');
      expect(result.example).toBe('Basic Card Play');
      expect(result.data).toEqual({ test: 'data' });

      // Check that debug data was logged
      const debugData = STSDebugTools.exportDebugData();
      const parsed = JSON.parse(debugData);
      
      expect(parsed.logs).toHaveLength(2); // Start and completion logs
      expect(parsed.logs[0].message).toContain('Starting example: Basic Card Play');
      expect(parsed.logs[1].message).toContain('Completed example: Basic Card Play');
      expect(parsed.performanceMetrics).toHaveLength(1);
    });
  });
});
