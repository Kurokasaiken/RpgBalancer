import { FeatureFlags } from '@/shared/config/featureFlags';

const BASE_APP_NAV_TAB_IDS = [
  'balancer',
  'spellCreationNew',
  'idleVillageConfig',
  'minimalGameplay',
  'test',
  'testHub',
  'moodboard',
  'promptBible',
  'styleLabDemo',
  'wanderlust',
] as const;

const DEV_ONLY_TAB_IDS = [] as const;

export const APP_NAV_TAB_IDS = [...BASE_APP_NAV_TAB_IDS, ...DEV_ONLY_TAB_IDS] as const;

export type AppNavTabId = (typeof APP_NAV_TAB_IDS)[number];

export interface AppNavItem {
  id: AppNavTabId;
  label: string;
  icon?: string;
}

export interface AppNavSection {
  title: string;
  items: AppNavItem[];
}

export type MobileNavItem = AppNavItem | { id: 'more'; label: string; icon: string };

const NAV_ITEM_MAP: Record<AppNavTabId, AppNavItem> = {
  balancer: { id: 'balancer', label: 'Balancer', icon: '⚖️' },
  spellCreationNew: { id: 'spellCreationNew', label: 'Spell Creation', icon: '✨' },
  idleVillageConfig: { id: 'idleVillageConfig', label: 'Idle Village Config', icon: '🏘️' },
  minimalGameplay: { id: 'minimalGameplay', label: 'Minimal Gameplay', icon: '🌒' },
  test: { id: 'test', label: 'Test', icon: '🧪' },
  testHub: { id: 'testHub', label: 'Test Hub', icon: '�' },
  moodboard: { id: 'moodboard', label: 'Moodboard', icon: '🖼️' },
  promptBible: { id: 'promptBible', label: 'Prompt & Bible', icon: '📜' },
  styleLabDemo: { id: 'styleLabDemo', label: 'Style Lab Demo', icon: '🎨' },
  wanderlust: { id: 'wanderlust', label: 'Wanderlust Mockup', icon: '🗺️' },
};

const DEV_ONLY_TAB_SET = new Set<AppNavTabId>(DEV_ONLY_TAB_IDS as unknown as AppNavTabId[]);
const isDevRuntime = import.meta.env?.DEV ?? false;
const shouldIncludeTab = (id: AppNavTabId) =>
  (isDevRuntime || !DEV_ONLY_TAB_SET.has(id));

export const isTabEnabled = (id: AppNavTabId): boolean => shouldIncludeTab(id);

const NAV_SECTION_DEFS: { title: string; itemIds: AppNavTabId[] }[] = [
  {
    title: 'Core',
    itemIds: ['balancer', 'spellCreationNew'],
  },
  {
    title: 'Idle Village',
    itemIds: ['minimalGameplay', 'idleVillageConfig', 'test', 'testHub'],
  },
  {
    title: 'Content',
    itemIds: ['moodboard', 'promptBible', 'styleLabDemo', 'wanderlust'],
  },
];

export const NAV_SECTIONS: AppNavSection[] = NAV_SECTION_DEFS.map((section) => {
  const items = section.itemIds.filter(shouldIncludeTab).map((id) => NAV_ITEM_MAP[id]);
  return { title: section.title, items };
}).filter((section) => section.items.length > 0);

export const BOTTOM_NAV: MobileNavItem[] = [
  { ...NAV_ITEM_MAP.moodboard, label: 'Moodboard' },
  NAV_ITEM_MAP.balancer,
  NAV_ITEM_MAP.spellCreationNew,
  NAV_ITEM_MAP.minimalGameplay,
  NAV_ITEM_MAP.test,
  { id: 'more', label: 'More', icon: '☰' },
];

export const DEFAULT_LANDING_TAB_ID: AppNavTabId = 'testHub';

export function getUniqueNavItems(): AppNavItem[] {
  return APP_NAV_TAB_IDS.filter(shouldIncludeTab).map((id) => NAV_ITEM_MAP[id]);
}

export function isValidNavTabId(value: unknown): value is AppNavTabId {
  return typeof value === 'string' && (APP_NAV_TAB_IDS as readonly string[]).includes(value);
}
