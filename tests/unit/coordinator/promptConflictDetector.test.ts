import { describe, it, expect, beforeEach, vi } from 'vitest';
import { 
  PromptConflictRules,
  ConflictSeverity,
  ConflictType,
  DEFAULT_CONFLICT_DETECTION_CONFIG,
  type Conflict,
  type ConflictDetectionConfig
} from '../../../src/coordinator/promptConflictRules';

// Mock fs for testing
vi.mock('fs', () => ({
  readFileSync: vi.fn(),
  writeFileSync: vi.fn(),
}));

describe('PromptConflictRules', () => {
  let rules: PromptConflictRules;
  let mockPrompts: Map<string, any>;

  beforeEach(() => {
    rules = new PromptConflictRules();
    mockPrompts = new Map();
    
    // Setup mock prompts
    mockPrompts.set('NP-001', {
      id: 'NP-001',
      name: 'Test Prompt 1',
      status: 'In corso',
      agent: 'Agent-A',
      startDate: '2026-01-21',
      fileTargets: ['src/component1.ts', 'src/utils.ts'],
      dependencies: ['NP-002'],
      evidence: undefined,
    });

    mockPrompts.set('NP-002', {
      id: 'NP-002',
      name: 'Test Prompt 2',
      status: 'In corso',
      agent: 'Agent-A',
      startDate: '2026-01-20',
      fileTargets: ['src/component2.ts'],
      dependencies: ['NP-003'],
      evidence: undefined,
    });

    mockPrompts.set('NP-003', {
      id: 'NP-003',
      name: 'Test Prompt 3',
      status: 'Completato',
      agent: 'Agent-B',
      startDate: '2026-01-19',
      fileTargets: ['src/component3.ts'],
      dependencies: ['NP-001'], // Creates a cycle
      evidence: 'test-results/np-003.log',
    });

    mockPrompts.set('NP-004', {
      id: 'NP-004',
      name: 'Duplicate Test',
      status: 'Non assegnato',
      agent: '-',
      fileTargets: ['src/unique.ts'],
      dependencies: [],
      evidence: undefined,
    });

    mockPrompts.set('NP-005', {
      id: 'NP-005',
      name: 'Duplicate Test',
      status: 'Non assegnato',
      agent: '-',
      fileTargets: ['src/unique2.ts'],
      dependencies: [],
      evidence: undefined,
    });
  });

  describe('File Target Overlap Detection', () => {
    it('should detect file target overlaps', () => {
      // Add overlapping file targets
      mockPrompts.get('NP-002').fileTargets = ['src/component1.ts', 'src/component2.ts'];
      
      const conflicts = rules.detectFileTargetOverlaps(mockPrompts);
      
      expect(conflicts).toHaveLength(1);
      expect(conflicts[0].type).toBe(ConflictType.FILE_TARGET_OVERLAP);
      expect(conflicts[0].filePath).toBe('src/component1.ts');
      expect(conflicts[0].promptIds).toContain('NP-001');
      expect(conflicts[0].promptIds).toContain('NP-002');
      expect(conflicts[0].severity).toBe(ConflictSeverity.MEDIUM);
    });

    it('should ignore files matching ignore patterns', () => {
      // Add file that should be ignored
      mockPrompts.get('NP-004').fileTargets = ['test-results/test.log'];
      
      const conflicts = rules.detectFileTargetOverlaps(mockPrompts);
      
      // Should not detect conflict for ignored file
      const testResultsConflict = conflicts.find(c => c.filePath.includes('test-results'));
      expect(testResultsConflict).toBeUndefined();
    });

    it('should return no conflicts for unique file targets', () => {
      const conflicts = rules.detectFileTargetOverlaps(mockPrompts);
      
      expect(conflicts).toHaveLength(0);
    });

    it('should assign correct severity based on overlap count', () => {
      // Create high overlap
      mockPrompts.set('NP-006', {
        id: 'NP-006',
        fileTargets: ['src/component1.ts'],
      });
      mockPrompts.set('NP-007', {
        id: 'NP-007',
        fileTargets: ['src/component1.ts'],
      });
      mockPrompts.set('NP-008', {
        id: 'NP-008',
        fileTargets: ['src/component1.ts'],
      });
      
      const conflicts = rules.detectFileTargetOverlaps(mockPrompts);
      
      expect(conflicts[0].severity).toBe(ConflictSeverity.CRITICAL);
      expect(conflicts[0].promptIds).toHaveLength(5); // NP-001, NP-002, NP-006, NP-007, NP-008
    });
  });

  describe('Dependency Cycle Detection', () => {
    it('should detect circular dependencies', () => {
      const conflicts = rules.detectDependencyCycles(mockPrompts);
      
      expect(conflicts).toHaveLength(1);
      expect(conflicts[0].type).toBe(ConflictType.DEPENDENCY_CYCLE);
      expect(conflicts[0].severity).toBe(ConflictSeverity.HIGH);
      expect(conflicts[0].cycle).toContain('NP-001');
      expect(conflicts[0].cycle).toContain('NP-002');
      expect(conflicts[0].cycle).toContain('NP-003');
    });

    it('should return no conflicts for acyclic dependencies', () => {
      // Break the cycle
      mockPrompts.get('NP-003').dependencies = [];
      
      const conflicts = rules.detectDependencyCycles(mockPrompts);
      
      expect(conflicts).toHaveLength(0);
    });

    it('should handle self-dependencies', () => {
      // Clear existing prompts first
      const singlePromptMap = new Map();
      singlePromptMap.set('NP-004', {
        id: 'NP-004',
        dependencies: ['NP-004'],
      });
      
      const conflicts = rules.detectDependencyCycles(singlePromptMap);
      
      expect(conflicts).toHaveLength(1);
      expect(conflicts[0].cycle).toEqual(['NP-004']);
    });
  });

  describe('Agent Overload Detection', () => {
    it('should detect agent overload', () => {
      // Add more prompts to Agent-A
      mockPrompts.set('NP-006', {
        id: 'NP-006',
        status: 'In corso',
        agent: 'Agent-A',
        startDate: '2026-01-21',
      });
      mockPrompts.set('NP-007', {
        id: 'NP-007',
        status: 'In corso',
        agent: 'Agent-A',
        startDate: '2026-01-21',
      });
      
      const conflicts = rules.detectAgentOverload(mockPrompts);
      
      expect(conflicts).toHaveLength(1);
      expect(conflicts[0].type).toBe(ConflictType.AGENT_OVERLOAD);
      expect(conflicts[0].agent).toBe('Agent-A');
      expect(conflicts[0].activePrompts).toHaveLength(4);
      expect(conflicts[0].limit).toBe(3);
    });

    it('should return no conflicts for normal agent workload', () => {
      const conflicts = rules.detectAgentOverload(mockPrompts);
      
      expect(conflicts).toHaveLength(0);
    });

    it('should ignore non-active prompts', () => {
      mockPrompts.get('NP-004').status = 'Completato';
      mockPrompts.get('NP-004').agent = 'Agent-A';
      
      const conflicts = rules.detectAgentOverload(mockPrompts);
      
      expect(conflicts).toHaveLength(0);
    });
  });

  describe('Status Inconsistency Detection', () => {
    it('should detect completed prompts without evidence', () => {
      mockPrompts.get('NP-003').evidence = undefined;
      
      const conflicts = rules.detectStatusInconsistencies(mockPrompts);
      
      expect(conflicts).toHaveLength(1);
      expect(conflicts[0].type).toBe(ConflictType.STATUS_INCONSISTENCY);
      expect(conflicts[0].promptId).toBe('NP-003');
      expect(conflicts[0].severity).toBe(ConflictSeverity.MEDIUM);
    });

    it('should detect in corso prompts without agent', () => {
      mockPrompts.get('NP-001').agent = '-';
      
      const conflicts = rules.detectStatusInconsistencies(mockPrompts);
      
      expect(conflicts).toHaveLength(1);
      expect(conflicts[0].type).toBe(ConflictType.STATUS_INCONSISTENCY);
      expect(conflicts[0].promptId).toBe('NP-001');
      expect(conflicts[0].severity).toBe(ConflictSeverity.HIGH);
    });

    it('should detect stale in corso prompts', () => {
      // Clear existing prompts and create a single stale prompt
      const singlePromptMap = new Map();
      singlePromptMap.set('NP-001', {
        id: 'NP-001',
        status: 'In corso',
        agent: 'Agent-A',
        startDate: '2026-01-01', // Very old
      });
      
      const conflicts = rules.detectStatusInconsistencies(singlePromptMap);
      
      const staleConflict = conflicts.find(c => 
        c.promptId === 'NP-001' && c.description.includes('stale')
      );
      expect(staleConflict).toBeDefined();
      expect(staleConflict!.severity).toBe(ConflictSeverity.MEDIUM);
    });
  });

  describe('Evidence Missing Detection', () => {
    it('should detect missing evidence for completed prompts', () => {
      mockPrompts.get('NP-003').evidence = undefined;
      
      const conflicts = rules.detectMissingEvidence(mockPrompts);
      
      expect(conflicts).toHaveLength(1);
      expect(conflicts[0].type).toBe(ConflictType.EVIDENCE_MISSING);
      expect(conflicts[0].promptId).toBe('NP-003');
      expect(conflicts[0].severity).toBe(ConflictSeverity.HIGH);
    });

    it('should not require evidence for non-completed prompts', () => {
      const conflicts = rules.detectMissingEvidence(mockPrompts);
      
      expect(conflicts).toHaveLength(0);
    });
  });

  describe('Duplicate Prompt Detection', () => {
    it('should detect duplicate prompt names', () => {
      const conflicts = rules.detectDuplicatePrompts(mockPrompts);
      
      expect(conflicts).toHaveLength(1);
      expect(conflicts[0].type).toBe(ConflictType.DUPLICATE_PROMPT);
      expect(conflicts[0].promptId).toBe('NP-004');
      expect(conflicts[0].duplicateIds).toContain('NP-005');
      expect(conflicts[0].severity).toBe(ConflictSeverity.MEDIUM);
    });

    it('should handle prompts with unique names', () => {
      mockPrompts.get('NP-005').name = 'Unique Test';
      
      const conflicts = rules.detectDuplicatePrompts(mockPrompts);
      
      expect(conflicts).toHaveLength(0);
    });
  });

  describe('Conflict Scoring', () => {
    it('should calculate correct conflict score', () => {
      // Create conflicts with different severities
      const conflicts: Conflict[] = [
        {
          type: ConflictType.FILE_TARGET_OVERLAP,
          severity: ConflictSeverity.CRITICAL,
          promptIds: ['NP-001', 'NP-002'],
          filePath: 'src/test.ts',
          description: 'Critical overlap',
          recommendation: 'Fix it',
        },
        {
          type: ConflictType.AGENT_OVERLOAD,
          severity: ConflictSeverity.HIGH,
          agent: 'Agent-A',
          activePrompts: ['NP-001'],
          limit: 3,
          description: 'Agent overload',
          recommendation: 'Redistribute',
        },
        {
          type: ConflictType.STATUS_INCONSISTENCY,
          severity: ConflictSeverity.MEDIUM,
          promptId: 'NP-003',
          currentStatus: 'Completato',
          expectedStatus: 'Completato with evidence',
          description: 'Missing evidence',
          recommendation: 'Add evidence',
        },
        {
          type: ConflictType.DUPLICATE_PROMPT,
          severity: ConflictSeverity.LOW,
          promptId: 'NP-004',
          duplicateIds: ['NP-005'],
          description: 'Duplicate names',
          recommendation: 'Rename',
        },
      ];
      
      const score = rules.getConflictScore(conflicts);
      
      expect(score).toBe(10); // 4 + 3 + 2 + 1
    });

    it('should group conflicts by severity', () => {
      const conflicts: Conflict[] = [
        {
          type: ConflictType.FILE_TARGET_OVERLAP,
          severity: ConflictSeverity.CRITICAL,
          promptIds: ['NP-001'],
          filePath: 'src/test.ts',
          description: 'Critical',
          recommendation: 'Fix',
        },
        {
          type: ConflictType.AGENT_OVERLOAD,
          severity: ConflictSeverity.HIGH,
          agent: 'Agent-A',
          activePrompts: ['NP-001'],
          limit: 3,
          description: 'High',
          recommendation: 'Fix',
        },
        {
          type: ConflictType.STATUS_INCONSISTENCY,
          severity: ConflictSeverity.HIGH,
          promptId: 'NP-003',
          currentStatus: 'Completato',
          expectedStatus: 'Completato with evidence',
          description: 'High 2',
          recommendation: 'Fix',
        },
      ];
      
      const grouped = rules.getConflictsBySeverity(conflicts);
      
      expect(grouped.critical).toHaveLength(1);
      expect(grouped.high).toHaveLength(2);
      expect(grouped.medium).toBeUndefined();
      expect(grouped.low).toBeUndefined();
    });
  });

  describe('Configuration', () => {
    it('should use custom configuration', () => {
      const customConfig: ConflictDetectionConfig = {
        ...DEFAULT_CONFLICT_DETECTION_CONFIG,
        agentWorkloadLimit: 2,
        fileTargetOverlapThreshold: 2,
      };
      
      const customRules = new PromptConflictRules(customConfig);
      
      // Should detect overload at lower threshold
      mockPrompts.set('NP-006', {
        id: 'NP-006',
        status: 'In corso',
        agent: 'Agent-A',
        startDate: '2026-01-21',
      });
      
      const conflicts = customRules.detectAgentOverload(mockPrompts);
      
      expect(conflicts).toHaveLength(1);
      expect(conflicts[0].limit).toBe(2);
    });

    it('should use default configuration when none provided', () => {
      const defaultRules = new PromptConflictRules();
      
      const conflicts = defaultRules.detectAgentOverload(mockPrompts);
      
      expect(conflicts).toHaveLength(0);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty prompt map', () => {
      const emptyPrompts = new Map();
      
      const conflicts = [
        ...rules.detectFileTargetOverlaps(emptyPrompts),
        ...rules.detectDependencyCycles(emptyPrompts),
        ...rules.detectAgentOverload(emptyPrompts),
        ...rules.detectStatusInconsistencies(emptyPrompts),
        ...rules.detectMissingEvidence(emptyPrompts),
        ...rules.detectDuplicatePrompts(emptyPrompts),
      ];
      
      expect(conflicts).toHaveLength(0);
    });

    it('should handle prompts with missing properties', () => {
      const incompletePrompt = {
        id: 'NP-999',
        // Missing other properties
      };
      
      const singlePromptMap = new Map([['NP-999', incompletePrompt]]);
      
      expect(() => {
        rules.detectFileTargetOverlaps(singlePromptMap);
      }).not.toThrow();
      
      expect(() => {
        rules.detectAgentOverload(singlePromptMap);
      }).not.toThrow();
    });

    it('should handle non-existent dependencies', () => {
      mockPrompts.get('NP-001').dependencies = ['NON-EXISTENT'];
      
      const conflicts = rules.detectDependencyCycles(mockPrompts);
      
      expect(conflicts).toHaveLength(0); // No cycle, just missing dependency
    });
  });

  describe('Integration with All Conflict Types', () => {
    it('should detect multiple conflict types simultaneously', () => {
      // Create a scenario with multiple conflicts
      mockPrompts.get('NP-002').fileTargets = ['src/component1.ts']; // File overlap
      mockPrompts.get('NP-003').evidence = undefined; // Missing evidence
      mockPrompts.get('NP-001').agent = '-'; // Missing agent
      
      const allConflicts = [
        ...rules.detectFileTargetOverlaps(mockPrompts),
        ...rules.detectDependencyCycles(mockPrompts),
        ...rules.detectAgentOverload(mockPrompts),
        ...rules.detectStatusInconsistencies(mockPrompts),
        ...rules.detectMissingEvidence(mockPrompts),
        ...rules.detectDuplicatePrompts(mockPrompts),
      ];
      
      expect(allConflicts.length).toBeGreaterThan(3);
      
      const conflictTypes = new Set(allConflicts.map(c => c.type));
      expect(conflictTypes.has(ConflictType.FILE_TARGET_OVERLAP)).toBe(true);
      expect(conflictTypes.has(ConflictType.DEPENDENCY_CYCLE)).toBe(true);
      expect(conflictTypes.has(ConflictType.STATUS_INCONSISTENCY)).toBe(true);
      expect(conflictTypes.has(ConflictType.EVIDENCE_MISSING)).toBe(true);
      expect(conflictTypes.has(ConflictType.DUPLICATE_PROMPT)).toBe(true);
    });
  });
});
