import { describe, it, expect } from 'vitest';
import { DEFAULT_CONFIG } from '../config/defaultConfig';
import { testBalancerConfigStore } from '../../shared/testing/StorageTestExamples';

/**
 * Integration between BalancerConfigStore and the generic StorageTestFramework.
 * Ensures that save/load/reset behaviour remains stable as the default config evolves.
 */

describe('BalancerConfigStore storage integration', () => {
  it('passes the generic storage test suite with DEFAULT_CONFIG', async () => {
    const suite = await testBalancerConfigStore(DEFAULT_CONFIG);

    expect(suite.failedCount).toBe(0);
    expect(suite.successRate).toBe(100);
  });
});
