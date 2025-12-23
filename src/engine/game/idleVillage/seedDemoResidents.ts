import type { IdleVillageConfig, FounderPreset } from '@/balancing/config/idleVillage/types';
import type { ResidentState, VillageState } from './TimeEngine';
import { buildResidentFromFounder } from './TimeEngine';

export function selectDefaultFounder(config?: IdleVillageConfig | null): FounderPreset | null {
  if (!config) return null;
  const founders = config.founders ?? {};
  return founders.founder_standard ?? Object.values(founders)[0] ?? null;
}

export function seedDemoResidents(
  state: VillageState,
  config?: IdleVillageConfig | null,
  minimumResidents = 3,
): VillageState {
  if (!config) return state;
  const seededResidents: Record<string, ResidentState> = { ...state.residents };
  const target = Math.max(1, minimumResidents);
  const maxFatigueBeforeExhausted = config.globalRules?.maxFatigueBeforeExhausted ?? 0;

  if (Object.keys(seededResidents).length >= target) {
    return state;
  }

  const founderPresets = Object.values(config.founders ?? {});
  if (founderPresets.length === 0) {
    return state;
  }

  let attempt = 0;
  while (Object.keys(seededResidents).length < target) {
    const basePreset = founderPresets[attempt % founderPresets.length];
    const derivedPreset: FounderPreset =
      attempt < founderPresets.length
        ? basePreset
        : {
            ...basePreset,
            id: `${basePreset.id}_demo_${attempt}`,
          };
    const resident = buildResidentFromFounder(derivedPreset, {
      startingFatigue: maxFatigueBeforeExhausted,
    });
    const normalizedResident: ResidentState = {
      ...resident,
      fatigue: maxFatigueBeforeExhausted,
      currentHp: resident.maxHp,
    };
    if (!seededResidents[normalizedResident.id]) {
      seededResidents[normalizedResident.id] = normalizedResident;
    }
    attempt += 1;
    if (attempt > founderPresets.length * 3) {
      break;
    }
  }

  return {
    ...state,
    residents: seededResidents,
  };
}
