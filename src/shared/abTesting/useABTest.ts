/**
 * useABTest Hook
 * React hook for A/B testing with variant assignment and tracking
 * 
 * @see NP-223 – A/B Test Framework
 */

import { useState, useEffect, useCallback } from 'react';
import { ABTestFramework, type ABTestConfig, type ABTestVariant } from './abTestFramework';
import { saveData, loadData } from '@/shared/persistence/PersistenceService';

/**
 * A/B test hook options
 */
export interface UseABTestOptions {
  userId: string;
  config: ABTestConfig;
  onVariantAssigned?: (variant: ABTestVariant) => void;
  onConversion?: (variantId: string) => void;
}

/**
 * A/B test hook return type
 */
export interface UseABTestReturn {
  variant: ABTestVariant | null;
  isLoading: boolean;
  trackImpression: () => void;
  trackConversion: () => void;
  isActive: boolean;
}

/**
 * React hook for A/B testing
 */
export function useABTest(options: UseABTestOptions): UseABTestReturn {
  const { userId, config, onVariantAssigned, onConversion } = options;
  const [variant, setVariant] = useState<ABTestVariant | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [framework] = useState(() => new ABTestFramework(config));

  useEffect(() => {
    const loadVariant = async () => {
      try {
        const storageKey = `ab_test_${config.testId}_${userId}`;
        const stored = await loadData<{ variantId: string }>(storageKey);

        let assignedVariant: ABTestVariant;

        if (stored?.variantId) {
          const found = config.variants.find(v => v.id === stored.variantId);
          assignedVariant = found || framework.assignVariant(userId);
        } else {
          assignedVariant = framework.assignVariant(userId);
          await saveData(storageKey, { variantId: assignedVariant.id });
        }

        setVariant(assignedVariant);
        onVariantAssigned?.(assignedVariant);
      } catch (error) {
        console.error('Failed to load A/B test variant:', error);
        const fallback = framework.assignVariant(userId);
        setVariant(fallback);
      } finally {
        setIsLoading(false);
      }
    };

    loadVariant();
  }, [userId, config.testId, framework, onVariantAssigned]);

  const trackImpression = useCallback(() => {
    if (!variant || !framework.isActive()) return;

    const event = {
      type: 'ab_test_impression',
      testId: config.testId,
      variantId: variant.id,
      userId,
      timestamp: Date.now(),
    };

    console.log('[A/B Test] Impression tracked:', event);
  }, [variant, config.testId, userId, framework]);

  const trackConversion = useCallback(() => {
    if (!variant || !framework.isActive()) return;

    const event = {
      type: 'ab_test_conversion',
      testId: config.testId,
      variantId: variant.id,
      userId,
      timestamp: Date.now(),
    };

    console.log('[A/B Test] Conversion tracked:', event);
    onConversion?.(variant.id);
  }, [variant, config.testId, userId, onConversion, framework]);

  return {
    variant,
    isLoading,
    trackImpression,
    trackConversion,
    isActive: framework.isActive(),
  };
}
