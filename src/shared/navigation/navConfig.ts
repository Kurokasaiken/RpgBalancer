export const APP_NAV_TAB_IDS = [
  'balancer',
  'balancerStats',
  'archetypes',
  'archetypeBuilder',
  'archetypeFantasy',
  'matchupMatrix',
  'archetypeTesting',
  'autoBalancer',
  'characterCreator',
  'spellLibrary',
  'spellCreationNew',
  'characterManager',
  'gridArena',
  'idleArena',
  'testing',
  'combatViewer',
  'mockArcaneTech',
  'mockGildedObservatory',
  'mockObsidianSanctum',
  'mockAuroraWorkshop',
  'mockAetherBrass',
  'mockQuantumScriptorium',
  'mockMidnightMeridian',
  'mockSeraphimArchive',
  'mockVerdantAlloy',
  'tacticalLab',
  'idleVillage',
  'idleVillageMap',
  'idleVillageConfig',
  'skillCheckPreview',
  'verbDetailSandbox',
] as const;

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
  balancerStats: { id: 'balancerStats', label: 'Stat Testing', icon: '📊' },
  archetypes: { id: 'archetypes', label: 'Archetypes', icon: '🎭' },
  archetypeBuilder: { id: 'archetypeBuilder', label: 'Archetype Builder', icon: '🏗️' },
  archetypeFantasy: { id: 'archetypeFantasy', label: 'Archetype Forge', icon: '✦' },
  matchupMatrix: { id: 'matchupMatrix', label: 'War Room', icon: '🗺️' },
  archetypeTesting: { id: 'archetypeTesting', label: '1v1 Archetypes', icon: '⚔️' },
  autoBalancer: { id: 'autoBalancer', label: 'Auto-Balancer', icon: '⚙️' },
  characterCreator: { id: 'characterCreator', label: 'Character Creator', icon: '👤' },
  spellLibrary: { id: 'spellLibrary', label: 'Spell Library', icon: '📚' },
  spellCreationNew: { id: 'spellCreationNew', label: 'Spell Creation', icon: '✨' },
  characterManager: { id: 'characterManager', label: 'Roster', icon: '🗂️' },
  gridArena: { id: 'gridArena', label: 'Grid Arena', icon: '⚔️' },
  idleArena: { id: 'idleArena', label: 'Idle Arena', icon: '🏰' },
  testing: { id: 'testing', label: 'Testing Lab', icon: '🧪' },
  combatViewer: { id: 'combatViewer', label: 'Combat Viewer', icon: '⚔️' },
  mockArcaneTech: { id: 'mockArcaneTech', label: 'Arcane Tech Glass', icon: '💠' },
  mockGildedObservatory: { id: 'mockGildedObservatory', label: 'Gilded Observatory', icon: '🜂' },
  mockObsidianSanctum: { id: 'mockObsidianSanctum', label: 'Obsidian Sanctum', icon: '🜃' },
  mockAuroraWorkshop: { id: 'mockAuroraWorkshop', label: 'Aurora Workshop', icon: '✺' },
  mockAetherBrass: { id: 'mockAetherBrass', label: 'Aether Brass Lab', icon: '⚗️' },
  mockQuantumScriptorium: { id: 'mockQuantumScriptorium', label: 'Quantum Scriptorium', icon: '✒️' },
  mockMidnightMeridian: { id: 'mockMidnightMeridian', label: 'Midnight Meridian', icon: '✦' },
  mockSeraphimArchive: { id: 'mockSeraphimArchive', label: 'Seraphim Archive', icon: '✶' },
  mockVerdantAlloy: { id: 'mockVerdantAlloy', label: 'Verdant Alloy Deck', icon: '🌿' },
  tacticalLab: { id: 'tacticalLab', label: 'Tactical Lab', icon: '⚔️' },
  idleVillage: { id: 'idleVillage', label: 'Idle Village', icon: '🏡' },
  idleVillageMap: { id: 'idleVillageMap', label: 'Idle Village Map (New)', icon: '🗺️' },
  idleVillageConfig: { id: 'idleVillageConfig', label: 'Idle Village Config', icon: '⚙️' },
  skillCheckPreview: { id: 'skillCheckPreview', label: 'Skill Check Lab', icon: '🎯' },
  verbDetailSandbox: { id: 'verbDetailSandbox', label: 'Verb Detail Sandbox', icon: '🜂' },
};

const NAV_SECTION_DEFS: { title: string; itemIds: AppNavTabId[] }[] = [
  {
    title: 'Core',
    itemIds: ['balancer', 'balancerStats', 'spellCreationNew'],
  },
  {
    title: 'Content',
    itemIds: [
      'spellLibrary',
      'spellCreationNew',
      'combatViewer',
      'idleVillageMap',
      'characterCreator',
      'characterManager',
      'gridArena',
      'idleArena',
      'testing',
    ],
  },
  {
    title: 'Idle Village',
    itemIds: ['idleVillage', 'idleVillageConfig', 'verbDetailSandbox', 'skillCheckPreview'],
  },
  {
    title: 'Archetypes',
    itemIds: ['archetypes', 'matchupMatrix', 'archetypeTesting', 'archetypeBuilder', 'archetypeFantasy', 'autoBalancer'],
  },
  {
    title: 'Mockups',
    itemIds: [
      'mockGildedObservatory',
      'mockObsidianSanctum',
      'mockAuroraWorkshop',
      'mockArcaneTech',
      'mockAetherBrass',
      'mockQuantumScriptorium',
      'mockMidnightMeridian',
      'mockSeraphimArchive',
      'mockVerdantAlloy',
    ],
  },
  {
    title: 'System',
    itemIds: ['tacticalLab'],
  },
];

export const NAV_SECTIONS: AppNavSection[] = NAV_SECTION_DEFS.map((section) => ({
  title: section.title,
  items: section.itemIds.map((id) => NAV_ITEM_MAP[id]),
}));

export const BOTTOM_NAV: MobileNavItem[] = [
  NAV_ITEM_MAP.balancer,
  NAV_ITEM_MAP.archetypes,
  NAV_ITEM_MAP.spellCreationNew,
  NAV_ITEM_MAP.gridArena,
  { id: 'more', label: 'More', icon: '☰' },
];

export const DEFAULT_LANDING_TAB_ID: AppNavTabId = 'skillCheckPreview';

export function getUniqueNavItems(): AppNavItem[] {
  return APP_NAV_TAB_IDS.map((id) => NAV_ITEM_MAP[id]);
}

export function isValidNavTabId(value: unknown): value is AppNavTabId {
  return typeof value === 'string' && (APP_NAV_TAB_IDS as readonly string[]).includes(value);
}
