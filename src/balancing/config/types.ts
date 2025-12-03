export interface StatDefinition {
  id: string;
  label: string;
  description?: string;
  type: 'number' | 'percentage';
  min: number;
  max: number;
  step: number;
  defaultValue: number;
  weight: number;
  isCore: boolean;
  isDerived: boolean;
  formula?: string;
  bgColor?: string;
  isLocked?: boolean;
  isHidden?: boolean;
  icon?: string;
}

export interface CardDefinition {
  id: string;
  title: string;
  color: string;
  icon?: string;
  statIds: string[];
  isCore: boolean;
  order: number;
   isLocked?: boolean;
   isHidden?: boolean;
}

export interface BalancerPreset {
  id: string;
  name: string;
  description: string;
  weights: Record<string, number>;
  isBuiltIn: boolean;
  createdAt: string;
  modifiedAt: string;
}

export interface BalancerConfig {
  version: string;
  stats: Record<string, StatDefinition>;
  cards: Record<string, CardDefinition>;
  presets: Record<string, BalancerPreset>;
  activePresetId: string;
}

export interface ConfigSnapshot {
  timestamp: number;
  config: BalancerConfig;
  description: string;
}
