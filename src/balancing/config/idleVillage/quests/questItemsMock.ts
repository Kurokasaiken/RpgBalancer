// MOCK — nessun inventario reale. Lista statica di oggetti assegnabili a una
// quest, usata solo per dimostrare l'effetto sui calcoli di preview live
// (useQuestAssignmentPreview). Da sostituire quando esisterà un vero
// item/inventory system condiviso col resto del gioco.

export interface QuestItemMock {
  id: string;
  label: string;
  icon: string;
  effect: {
    deathChanceDelta?: number; // percentage points
    injuryChanceDelta?: number; // percentage points
    rewardMultiplierDelta?: number; // additive, e.g. 0.1 = +10%
  };
}

export const MOCK_QUEST_ITEMS: QuestItemMock[] = [
  {
    id: 'potion_heal',
    label: 'Pozione di Cura',
    icon: '🧪',
    effect: { deathChanceDelta: -10 },
  },
  {
    id: 'bandages',
    label: 'Bende',
    icon: '🩹',
    effect: { injuryChanceDelta: -15 },
  },
  {
    id: 'lucky_charm',
    label: 'Amuleto Fortunato',
    icon: '🍀',
    effect: { rewardMultiplierDelta: 0.1 },
  },
];
