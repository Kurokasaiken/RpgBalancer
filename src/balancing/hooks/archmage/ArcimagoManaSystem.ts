import {
  ARCIMAGO_MANA_SYSTEM_CONFIG,
  type ArcimagoManaSystemConfig,
  type ArcimagoStabilizationSlotConfig,
  type ArcimagoStabilizationSlotId,
} from '@/balancing/config/archmage/manaSystemConfig';
import type { STSManaType } from '@/balancing/config/archmage/types';

/**
 * Unique identifier counter for mana tokens.
 */
const tokenCounter = 0;

/**
 * Arcimago mana token metadata.
 */
export interface ArcimagoManaToken {
  id: string;
  family: STSManaType;
  origin: 'draw' | 'recycled';
  state: 'temporary' | 'broken';
  tags?: readonly string[];
}
