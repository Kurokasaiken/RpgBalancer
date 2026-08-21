/**
 * Custom hook for managing user default equipment configuration in storage.
 * Mirrors useDefaultStorage for the equipment creator.
 */

import { useState, useEffect } from 'react';
import { saveData, loadData } from '../persistence/PersistenceService';
import { EquipmentItemSchema, type EquipmentItem, type EquipmentStatTick } from '../../balancing/equipment/equipmentTypes';
import {
  getEquipmentStatTicks,
  getEquipmentTypeConfig,
} from '../../balancing/equipment/equipmentBalancingConfig';

interface DefaultConfig {
  equipment: EquipmentItem;
  statOrder: string[];
  collapsedStats: string[];
  statSteps: Record<string, EquipmentStatTick[]>;
  selectedTicks: Record<string, number>;
}

const STORAGE_KEY = 'userDefaultEquipment';

const DEFAULT_EQUIPMENT: EquipmentItem = {
  id: crypto.randomUUID(),
  name: '',
  type: 'weapon',
  slot: 'weapon',
  rarity: 'common',
  stats: {},
  grantedSkillIds: ['attack_base'],
  tags: ['weapon', 'common'],
};

export const useEquipmentDefaultStorage = () => {
  const createDefaultConfig = (base: EquipmentItem = DEFAULT_EQUIPMENT): DefaultConfig => {
    const typeConfig = getEquipmentTypeConfig(base.type);
    const statOrder = [...typeConfig.unlockedStats];
    const statSteps: Record<string, EquipmentStatTick[]> = {};
    const selectedTicks: Record<string, number> = {};

    for (const stat of typeConfig.unlockedStats) {
      statSteps[stat] = getEquipmentStatTicks(stat);
      selectedTicks[stat] = 0;
    }

    return {
      equipment: { ...base, slot: typeConfig.slot, grantedSkillIds: typeConfig.grantedSkillIds },
      statOrder,
      collapsedStats: [],
      statSteps,
      selectedTicks,
    };
  };

  const initialConfig = createDefaultConfig();

  const [equipment, setEquipment] = useState<EquipmentItem>(initialConfig.equipment);
  const [statOrder, setStatOrder] = useState<string[]>(initialConfig.statOrder);
  const [collapsedStats, setCollapsedStats] = useState<Set<string>>(
    new Set(initialConfig.collapsedStats)
  );
  const [statSteps, setStatSteps] = useState<Record<string, EquipmentStatTick[]>>(
    initialConfig.statSteps
  );
  const [selectedTicks, setSelectedTicks] = useState<Record<string, number>>(
    initialConfig.selectedTicks
  );

  useEffect(() => {
    const loadConfig = async () => {
      try {
        const saved = await loadData<unknown>(STORAGE_KEY, null);
        if (!saved) return;

        const parsed = saved as Partial<DefaultConfig>;
        const parsedEquipment = EquipmentItemSchema.safeParse(parsed.equipment);
        const base = parsedEquipment.success ? parsedEquipment.data : DEFAULT_EQUIPMENT;
        const defaultConfig = createDefaultConfig(base);

        setEquipment(defaultConfig.equipment);
        setStatOrder(parsed.statOrder || defaultConfig.statOrder);
        setCollapsedStats(new Set(parsed.collapsedStats || []));
        setStatSteps({ ...defaultConfig.statSteps, ...(parsed.statSteps || {}) });
        setSelectedTicks({ ...defaultConfig.selectedTicks, ...(parsed.selectedTicks || {}) });
      } catch (error) {
        console.warn('[useEquipmentDefaultStorage] Failed to load default config:', error);
      }
    };

    void loadConfig();
  }, []);

  const saveDefaultConfig = async (config: {
    equipment: EquipmentItem;
    statOrder: string[];
    collapsedStats: Set<string>;
    statSteps: Record<string, EquipmentStatTick[]>;
    selectedTicks: Record<string, number>;
  }): Promise<boolean> => {
    try {
      const configToSave: DefaultConfig = {
        equipment: config.equipment,
        statOrder: config.statOrder,
        collapsedStats: Array.from(config.collapsedStats),
        statSteps: config.statSteps,
        selectedTicks: config.selectedTicks,
      };
      await saveData(STORAGE_KEY, configToSave);
      return true;
    } catch (error) {
      console.error('[useEquipmentDefaultStorage] Failed to save default config:', error);
      return false;
    }
  };

  const resetToDefaults = async () => {
    try {
      const saved = await loadData<unknown>(STORAGE_KEY, null);
      if (!saved) {
        const defaultConfig = createDefaultConfig();
        setEquipment(defaultConfig.equipment);
        setStatOrder(defaultConfig.statOrder);
        setCollapsedStats(new Set());
        setStatSteps(defaultConfig.statSteps);
        setSelectedTicks(defaultConfig.selectedTicks);
        return;
      }
      const parsed = saved as Partial<DefaultConfig>;
      const parsedEquipment = EquipmentItemSchema.safeParse(parsed.equipment);
      const base = parsedEquipment.success ? parsedEquipment.data : DEFAULT_EQUIPMENT;
      const defaultConfig = createDefaultConfig(base);

      setEquipment(defaultConfig.equipment);
      setStatOrder(parsed.statOrder || defaultConfig.statOrder);
      setCollapsedStats(new Set(parsed.collapsedStats || []));
      setStatSteps({ ...defaultConfig.statSteps, ...(parsed.statSteps || {}) });
      setSelectedTicks({ ...defaultConfig.selectedTicks, ...(parsed.selectedTicks || {}) });
    } catch (error) {
      console.error('[useEquipmentDefaultStorage] Failed to reset to defaults:', error);
    }
  };

  return {
    equipment,
    setEquipment,
    statOrder,
    setStatOrder,
    collapsedStats,
    setCollapsedStats,
    statSteps,
    setStatSteps,
    selectedTicks,
    setSelectedTicks,
    saveDefaultConfig,
    resetToDefaults,
  };
};
