import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { validatePromptSchema, validateChildPromptDependencies, validateMasterPromptStructure } from '../scripts/prompt/prompt-check/schemaValidator';
import type { PromptSchema, ChildPromptSchema, MasterPromptSchema } from '../scripts/prompt/prompt-check/types';

describe('Master Prompt Framework Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Schema Validation', () => {
    it('should validate a valid master prompt', () => {
      const validMasterPrompt: PromptSchema = {
        promptId: 'MASTER-2025-01-12-batch-framework',
        parentId: null,
        type: 'master',
        status: 'in_progress',
        dependencies: [],
        prerequisites: ['Node.js 20.19.6', 'TypeScript configurato'],
        scope: 'Implementare framework per batch processing di prompt',
        safeguards: ['Verifica compatibilità KS-005', 'Test regressioni'],
        agent: 'Cascade',
        lastUpdate: '2026-01-12T23:45:00.000Z',
        notes: 'Framework documentation completed'
      };

      expect(() => validatePromptSchema(validMasterPrompt)).not.toThrow();
    });

    it('should validate a valid child prompt', () => {
      const validChildPrompt: PromptSchema = {
        promptId: 'MASTER-2025-01-12-batch-framework-child-001',
        parentId: 'MASTER-2025-01-12-batch-framework',
        type: 'child',
        status: 'completed',
        dependencies: ['MASTER-2025-01-12-batch-framework-child-000'],
        prerequisites: ['Master prompt completato'],
        scope: 'Implementare schema validazione per prompt-check',
        safeguards: ['Test unitari passanti', 'Documentazione aggiornata'],
        agent: 'Cascade',
        lastUpdate: '2026-01-12T23:50:00.000Z',
        notes: 'Schema validation completed'
      };

      expect(() => validatePromptSchema(validChildPrompt)).not.toThrow();
    });

    it('should reject child prompt without parentId', () => {
      const invalidChildPrompt: Partial<PromptSchema> = {
        promptId: 'CHILD-INVALID',
        type: 'child',
        status: 'in_progress',
        dependencies: [],
        prerequisites: [],
        scope: 'Invalid child prompt'
      };

      expect(() => validatePromptSchema(invalidChildPrompt as PromptSchema)).toThrow();
    });

    it('should reject master prompt with dependencies', () => {
      const invalidMasterPrompt: Partial<PromptSchema> = {
        promptId: 'MASTER-INVALID',
        parentId: null,
        type: 'master',
        status: 'in_progress',
        dependencies: ['OTHER-PROMPT'], // Master prompts cannot have dependencies
        prerequisites: [],
        scope: 'Invalid master prompt'
      };

      expect(() => validatePromptSchema(invalidMasterPrompt as PromptSchema)).toThrow();
    });
  });

  describe('Child Prompt Dependencies', () => {
    it('should validate child prompt with valid dependencies', () => {
      const childPrompt: ChildPromptSchema = {
        promptId: 'CHILD-001',
        parentId: 'MASTER-001',
        type: 'child',
        status: 'in_progress',
        dependencies: ['MASTER-001'],
        prerequisites: [],
        scope: 'Test child prompt',
        safeguards: [],
        agent: 'TestAgent',
        lastUpdate: '2026-01-12T23:45:00.000Z',
        notes: ''
      };

      expect(() => validateChildPromptDependencies(childPrompt)).not.toThrow();
    });

    it('should reject child prompt with circular dependency', () => {
      const circularChildPrompt: ChildPromptSchema = {
        promptId: 'CHILD-CIRCULAR',
        parentId: 'MASTER-001',
        type: 'child',
        status: 'in_progress',
        dependencies: ['CHILD-CIRCULAR'], // Circular dependency
        prerequisites: [],
        scope: 'Circular dependency test',
        safeguards: [],
        agent: 'TestAgent',
        lastUpdate: '2026-01-12T23:45:00.000Z',
        notes: ''
      };

      expect(() => validateChildPromptDependencies(circularChildPrompt)).toThrow(/circular dependency/i);
    });

    it('should reject child prompt depending on non-existent parent', () => {
      const orphanChildPrompt: ChildPromptSchema = {
        promptId: 'CHILD-ORPHAN',
        parentId: 'NON-EXISTENT-PARENT',
        type: 'child',
        status: 'in_progress',
        dependencies: ['NON-EXISTENT-PARENT'],
        prerequisites: [],
        scope: 'Orphan child prompt',
        safeguards: [],
        agent: 'TestAgent',
        lastUpdate: '2026-01-12T23:45:00.000Z',
        notes: ''
      };

      expect(() => validateChildPromptDependencies(orphanChildPrompt)).toThrow(/parent.*not found/i);
    });
  });

  describe('Master Prompt Structure', () => {
    it('should validate master prompt with valid structure', () => {
      const masterPrompt: MasterPromptSchema = {
        promptId: 'MASTER-001',
        parentId: null,
        type: 'master',
        status: 'in_progress',
        dependencies: [],
        prerequisites: ['Node.js 20.19.6'],
        scope: 'Test master prompt',
        safeguards: [],
        agent: 'TestAgent',
        lastUpdate: '2026-01-12T23:45:00.000Z',
        notes: ''
      };

      expect(() => validateMasterPromptStructure(masterPrompt)).not.toThrow();
    });

    it('should reject master prompt with missing required sections', () => {
      const incompleteMasterPrompt: Partial<MasterPromptSchema> = {
        promptId: 'MASTER-INCOMPLETE',
        parentId: null,
        type: 'master',
        status: 'in_progress',
        dependencies: [],
        prerequisites: [],
        // Missing scope
        safeguards: [],
        agent: 'TestAgent',
        lastUpdate: '2026-01-12T23:45:00.000Z',
        notes: ''
      };

      expect(() => validateMasterPromptStructure(incompleteMasterPrompt as MasterPromptSchema)).toThrow(/scope.*required/i);
    });

    it('should reject master prompt with invalid child sequence', () => {
      const masterPromptWithInvalidSequence: MasterPromptSchema = {
        promptId: 'MASTER-INVALID-SEQUENCE',
        parentId: null,
        type: 'master',
        status: 'in_progress',
        dependencies: [],
        prerequisites: [],
        scope: 'Master prompt with invalid sequence',
        safeguards: [],
        agent: 'TestAgent',
        lastUpdate: '2026-01-12T23:45:00.000Z',
        notes: ''
      };

      expect(() => validateMasterPromptStructure(masterPromptWithInvalidSequence)).toThrow(/child.*sequence/i);
    });
  });

  describe('Batch Workflow Integration', () => {
    it('should validate complete batch workflow', () => {
      const masterPrompt: MasterPromptSchema = {
        promptId: 'BATCH-001',
        parentId: null,
        type: 'master',
        status: 'in_progress',
        dependencies: [],
        prerequisites: ['Node.js 20.19.6', 'TypeScript'],
        scope: 'Complete batch workflow test',
        safeguards: ['Test all child prompts', 'Validate integration'],
        agent: 'TestAgent',
        lastUpdate: '2026-01-12T23:45:00.000Z',
        notes: ''
      };

      const childPrompts: ChildPromptSchema[] = [
        {
          promptId: 'BATCH-001-CHILD-001',
          parentId: 'BATCH-001',
          type: 'child',
          status: 'completed',
          dependencies: ['BATCH-001'],
          prerequisites: [],
          scope: 'First child task',
          safeguards: [],
          agent: 'TestAgent',
          lastUpdate: '2026-01-12T23:45:00.000Z',
          notes: ''
        },
        {
          promptId: 'BATCH-001-CHILD-002',
          parentId: 'BATCH-001',
          type: 'child',
          status: 'in_progress',
          dependencies: ['BATCH-001', 'BATCH-001-CHILD-001'],
          prerequisites: ['First child completed'],
          scope: 'Second child task',
          safeguards: [],
          agent: 'TestAgent',
          lastUpdate: '2026-01-12T23:45:00.000Z',
          notes: ''
        }
      ];

      // Validate master prompt
      expect(() => validateMasterPromptStructure(masterPrompt)).not.toThrow();

      // Validate each child prompt
      childPrompts.forEach(childPrompt => {
        expect(() => validateChildPromptDependencies(childPrompt)).not.toThrow();
      });

      // Validate schema for all prompts
      expect(() => validatePromptSchema(masterPrompt)).not.toThrow();
      childPrompts.forEach(childPrompt => {
        expect(() => validatePromptSchema(childPrompt)).not.toThrow();
      });
    });

    it('should detect dependency violations in batch', () => {
      const childWithInvalidDependency: ChildPromptSchema = {
        promptId: 'BATCH-001-CHILD-INVALID',
        parentId: 'BATCH-001',
        type: 'child',
        status: 'in_progress',
        dependencies: ['BATCH-001-CHILD-003'], // Non-existent child
        prerequisites: [],
        scope: 'Invalid dependency test',
        safeguards: [],
        agent: 'TestAgent',
        lastUpdate: '2026-01-12T23:45:00.000Z',
        notes: ''
      };

      expect(() => validateChildPromptDependencies(childWithInvalidDependency)).toThrow(/dependency.*not found/i);
    });
  });

  describe('Error Handling', () => {
    it('should handle malformed prompt IDs gracefully', () => {
      const malformedPrompt: Partial<PromptSchema> = {
        promptId: 'invalid-id-with-spaces',
        type: 'single',
        status: 'in_progress',
        dependencies: [],
        prerequisites: [],
        scope: 'Test malformed ID'
      };

      expect(() => validatePromptSchema(malformedPrompt as PromptSchema)).toThrow(/pattern/i);
    });

    it('should handle invalid enum values', () => {
      const invalidPrompt: Partial<PromptSchema> = {
        promptId: 'TEST-001',
        type: 'invalid-type',
        status: 'invalid-status',
        dependencies: [],
        prerequisites: [],
        scope: 'Test invalid enums'
      };

      expect(() => validatePromptSchema(invalidPrompt as PromptSchema)).toThrow();
    });

    it('should handle missing required fields', () => {
      const incompletePrompt: Partial<PromptSchema> = {
        promptId: 'TEST-001'
        // Missing required fields
      };

      expect(() => validatePromptSchema(incompletePrompt as PromptSchema)).toThrow(/required/i);
    });
  });

  describe('Performance and Edge Cases', () => {
    it('should handle large dependency arrays efficiently', () => {
      const childWithManyDependencies: ChildPromptSchema = {
        promptId: 'CHILD-MANY-DEPS',
        parentId: 'MASTER-001',
        type: 'child',
        status: 'in_progress',
        dependencies: Array.from({ length: 100 }, (_, i) => `DEP-${i}`),
        prerequisites: [],
        scope: 'Test many dependencies',
        safeguards: [],
        agent: 'TestAgent',
        lastUpdate: '2026-01-12T23:45:00.000Z',
        notes: ''
      };

      // Should handle large arrays without performance issues
      expect(() => validateChildPromptDependencies(childWithManyDependencies)).not.toThrow();
    });

    it('should handle empty strings in optional fields', () => {
      const promptWithEmptyFields: PromptSchema = {
        promptId: 'TEST-001',
        parentId: null,
        type: 'single',
        status: 'in_progress',
        dependencies: [],
        prerequisites: [],
        scope: 'Test prompt',
        safeguards: [],
        agent: '',
        lastUpdate: '2026-01-12T23:45:00.000Z',
        notes: ''
      };

      expect(() => validatePromptSchema(promptWithEmptyFields)).not.toThrow();
    });

    it('should validate maximum length constraints', () => {
      const promptWithTooLongId: Partial<PromptSchema> = {
        promptId: 'A'.repeat(101), // Exceeds maxLength of 100
        type: 'single',
        status: 'in_progress',
        dependencies: [],
        prerequisites: [],
        scope: 'Test'
      };

      expect(() => validatePromptSchema(promptWithTooLongId as PromptSchema)).toThrow(/maxLength/i);
    });
  });
});
