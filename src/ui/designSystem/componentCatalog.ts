import { z } from 'zod';
import { getKitEntry } from '@/ui/idleVillage/frozen/registry';

/**
 * Component Catalog — l'inventario della UI Review Room (/design-system).
 *
 * Regole anti-duplicazione:
 * - Dove esiste un frozen kit, lo STATUS deriva dal KIT_REGISTRY
 *   (`certified` → production, `draft` → candidate) — mai ridichiarato qui.
 * - Il catalog aggiunge solo i campi di direzione artistica che i cert non
 *   hanno: visualRole (perché il componente esiste), usage/forbiddenUsage,
 *   compositionRules semantiche, visibility (concetto del gate), e per i
 *   pattern: composedOf/responsibilities/flow/emotionalGoal.
 * - Schema minimo obbligatorio; anagrafica (owner, history) opzionale perché
 *   invecchia male.
 */

/** Ciclo di vita del componente nella pipeline UI. */
export const CatalogStatusSchema = z.enum(['production', 'candidate', 'deprecated', 'experimental']);
export type CatalogStatus = z.infer<typeof CatalogStatusSchema>;

/** Dimensione separata dallo status: "in gioco ma ancora brutto" esiste. */
export const CatalogMaturitySchema = z.enum(['stable', 'needs-review']);
export type CatalogMaturity = z.infer<typeof CatalogMaturitySchema>;

/** Solo `public` è soggetto al gate di governance. */
export const CatalogVisibilitySchema = z.enum(['public', 'internal', 'hidden']);
export type CatalogVisibility = z.infer<typeof CatalogVisibilitySchema>;

export const CatalogCategorySchema = z.enum(['pattern', 'component', 'primitive']);
export type CatalogCategory = z.infer<typeof CatalogCategorySchema>;

/** Regole di composizione semantiche — contesti, mai matrici allowedWith. */
export const CompositionRulesSchema = z.object({
  primaryContexts: z.array(z.string()),
  forbiddenContexts: z.array(z.string()),
});

export const CatalogEntrySchema = z.object({
  id: z.string(),
  title: z.string(),
  category: CatalogCategorySchema,
  /** Se presente, status/certificazione derivano dal KIT_REGISTRY. */
  kitId: z.string().optional(),
  /** Usato solo quando NON esiste un kit da cui derivare. */
  statusOverride: CatalogStatusSchema.optional(),
  maturity: CatalogMaturitySchema,
  visibility: CatalogVisibilitySchema,
  /** Perché il componente esiste — più importante di category. */
  visualRole: z.string(),
  usage: z.array(z.string()),
  forbiddenUsage: z.array(z.string()),
  /** Alternativa consigliata quando l'uso è vietato. */
  alternative: z.string().optional(),
  /** Token --skin-* consumati (per Token Inspector e Matrix Health). */
  bindings: z.array(z.string()),
  compositionRules: CompositionRulesSchema.optional(),
  /** Da dove arriva nel gioco — reso visibile in Current Production. */
  sourcePath: z.string(),
  lastValidated: z.string().optional(),
  /** Anagrafica opzionale — invecchia male, mai obbligatoria. */
  owner: z.string().optional(),
  introducedVersion: z.string().optional(),
  /* ── Solo pattern ── */
  composedOf: z.array(z.string()).optional(),
  /** id componente → visual responsibility ("contenitore/profondità"). */
  responsibilities: z.record(z.string(), z.string()).optional(),
  flow: z.array(z.string()).optional(),
  emotionalGoal: z.string().optional(),
  playerExpectation: z.string().optional(),
  referenceIntent: z.string().optional(),
  /** Nota di blocco/gap (es. kit non certificato, fixture mancante). */
  blockedNote: z.string().optional(),
});

export type CatalogEntry = z.infer<typeof CatalogEntrySchema>;

/**
 * Deriva lo status effettivo: dal KIT_REGISTRY se l'entry punta a un kit,
 * altrimenti da statusOverride (default: experimental).
 */
export function getCatalogStatus(entry: CatalogEntry): CatalogStatus {
  if (entry.kitId) {
    const kit = getKitEntry(entry.kitId);
    if (kit) return kit.status === 'certified' ? 'production' : 'candidate';
  }
  return entry.statusOverride ?? 'experimental';
}

const ENTRIES: CatalogEntry[] = [
  /* ── Game Patterns ─────────────────────────────────────────────────── */
  {
    id: 'poi-medallion',
    title: 'POI Medallion (Generic Skin)',
    category: 'pattern',
    kitId: 'poiKit',
    // Prova di accettazione 2026-07-16: NON risponde ai preset skin — i colori
    // arrivano via props da TemporarySkinConfig (per-pillar), non da --skin-*.
    maturity: 'needs-review',
    visibility: 'public',
    visualRole: 'anchor a world activity in space and invite the player to it',
    usage: ['punti di interesse sulla mappa villaggio', 'attività con progresso e rischio'],
    forbiddenUsage: ['indicatori di risorsa', 'bottoni di azione generici'],
    alternative: 'SkinBadge per stati inline',
    bindings: [],
    sourcePath: 'src/ui/idleVillage/components/minimal/GenericPoiSkin.tsx',
    composedOf: ['slotted-medal'],
    responsibilities: { 'slotted-medal': 'token residente agganciato al POI' },
    flow: ['notice', 'approach', 'inspect', 'commit'],
    emotionalGoal: 'create curiosity and exploration desire',
    playerExpectation: 'I want to know what is here',
    referenceIntent: 'create curiosity before information',
  },
  {
    id: 'resident-slot-rack',
    title: 'Resident Slot Rack',
    category: 'pattern',
    kitId: 'slotRackKit',
    maturity: 'stable',
    visibility: 'public',
    visualRole: 'stage where residents are committed to an activity',
    usage: ['assegnazione residenti nel dettaglio attività'],
    forbiddenUsage: ['liste di sola lettura', 'inventari di oggetti'],
    bindings: ['--skin-medallion-ring', '--skin-drag-valid-glow', '--skin-drag-invalid-glow'],
    sourcePath: 'src/ui/idleVillage/components/ResidentSlotRackSkin.tsx',
    composedOf: ['slotted-medal'],
    responsibilities: { 'slotted-medal': 'residente slottato — stato prezioso/attivo' },
    flow: ['drag resident', 'preview slot', 'commit', 'confirm assignment'],
    emotionalGoal: 'make assigning a resident feel like a deliberate commitment',
    playerExpectation: 'my choice of who goes where matters',
    referenceIntent: 'enable fast decision making',
  },
  /* ── Components ────────────────────────────────────────────────────── */
  {
    id: 'pg-card',
    title: 'PG Card (Resident)',
    category: 'component',
    kitId: 'pgcardKit',
    maturity: 'stable',
    visibility: 'public',
    visualRole: 'represent a living resident with their current condition',
    usage: ['roster del villaggio', 'selezione residente'],
    forbiddenUsage: ['NPC senza stato', 'ricompense'],
    bindings: ['--skin-statbar-hp-start', '--skin-statbar-fatigue-start', '--skin-medallion-ring'],
    compositionRules: {
      primaryContexts: ['roster', 'assignment'],
      forbiddenContexts: ['reward', 'shop'],
    },
    sourcePath: 'src/ui/idleVillage/components/PgCard.tsx',
  },
  {
    id: 'slotted-medal',
    title: 'Slotted Medal',
    category: 'component',
    kitId: 'slottedMedalKit',
    maturity: 'stable',
    visibility: 'public',
    visualRole: 'a resident token committed to a slot — precious, engraved',
    usage: ['slot rack', 'POI con residenti assegnati'],
    forbiddenUsage: ['avatar generici', 'icone decorative'],
    bindings: ['--skin-medallion-ring', '--skin-medallion-ring-border', '--skin-medallion-highlight'],
    compositionRules: {
      primaryContexts: ['assignment', 'poi'],
      forbiddenContexts: ['navigation', 'decoration'],
    },
    sourcePath: 'src/ui/idleVillage/components/SlottedMedal.tsx',
    blockedNote:
      'Embed bloccato: slottedMedalKit importa @/ui/idleVillage/components/SlottedMedal che NON esiste (kit draft, certified:false). Il canonico va implementato prima del freeze.',
  },
  {
    id: 'clock-widget',
    title: 'Clock Widget',
    category: 'component',
    kitId: 'clockKit',
    maturity: 'stable',
    visibility: 'public',
    visualRole: 'make the passage of village time tangible and controllable',
    usage: ['HUD tempo di gioco', 'controllo velocità simulazione'],
    forbiddenUsage: ['timer di singola attività', 'countdown ricompense'],
    bindings: [],
    sourcePath: 'src/ui/idleVillage/components/minimal/ClockWidget.tsx',
  },
  {
    id: 'activity-capsule-detail',
    title: 'Activity Capsule Detail (POI Detail)',
    category: 'pattern',
    kitId: 'activityCapsuleKit',
    maturity: 'needs-review',
    visibility: 'public',
    visualRole: 'the full dossier of an activity — where the player decides',
    usage: ['dettaglio POI/quest aperto dal medallion'],
    forbiddenUsage: ['tooltip rapidi', 'liste compatte'],
    bindings: ['--skin-surface-bg', '--skin-title-color', '--skin-cta-bg'],
    sourcePath: 'src/ui/idleVillage/skins/activityCapsuleDetail/ActivityCapsuleDetailSkinAware.tsx',
    flow: ['open dossier', 'read stakes', 'assign residents', 'commit (AVVIA)'],
    emotionalGoal: 'weigh risk against reward before committing',
    playerExpectation: 'I understand what I risk and what I gain',
    referenceIntent: 'create curiosity before information',
    blockedNote:
      'Embed rinviato: slots/telemetry in PoiDetailVerificationPage sono literal locali, serve fixture canonica (stesso gap del cert outcomeKit).',
  },
  /* ── Primitives ────────────────────────────────────────────────────── */
  {
    id: 'materic-frame',
    title: 'MatericFrame',
    category: 'primitive',
    statusOverride: 'candidate',
    maturity: 'needs-review',
    visibility: 'public',
    visualRole: 'a sculpted metal frame — the edge that defines a materic surface',
    usage: ['panel edges', 'well borders', 'roster containers', 'card frames'],
    forbiddenUsage: ['plain flat borders', 'decorative frames without depth'],
    alternative: 'CSS border for non-materic contexts',
    bindings: ['--skin-surface-border', '--skin-surface-bg'],
    compositionRules: {
      primaryContexts: ['panel', 'well', 'card'],
      forbiddenContexts: ['minimal flat UI', 'unskinned surfaces'],
    },
    sourcePath: 'src/ui/designSystem/primitives/MatericFrame.tsx',
  },
  {
    id: 'materic-surface',
    title: 'MatericSurface',
    category: 'primitive',
    statusOverride: 'candidate',
    maturity: 'needs-review',
    visibility: 'public',
    visualRole: 'a shaped materic panel — the ground where all other primitives sit',
    usage: ['panels', 'cards', 'wells', 'modal shells'],
    forbiddenUsage: ['plain sheets', 'unskinned backgrounds'],
    alternative: 'MatericFrame for the edge only, or a plain div for flat UI',
    bindings: ['--skin-surface-bg', '--skin-surface-border'],
    compositionRules: {
      primaryContexts: ['panel', 'card', 'well'],
      forbiddenContexts: ['minimal flat UI', 'unskinned surfaces'],
    },
    sourcePath: 'src/ui/designSystem/primitives/MatericSurface.tsx',
  },
  {
    id: 'materic-grain',
    title: 'MatericGrain',
    category: 'primitive',
    statusOverride: 'candidate',
    maturity: 'needs-review',
    visibility: 'public',
    visualRole: 'a whisper of painted texture over a materic field',
    usage: ['materic panel fields', 'roster backgrounds', 'observatory surfaces'],
    forbiddenUsage: ['solid color surfaces', 'high-contrast backgrounds'],
    alternative: 'plain gradient or CSS texture when grain is unnecessary',
    bindings: ['--skin-surface-bg'],
    compositionRules: {
      primaryContexts: ['panel field', 'surface'],
      forbiddenContexts: ['text foreground', 'icon'],
    },
    sourcePath: 'src/ui/designSystem/primitives/MatericGrain.tsx',
  },
  {
    id: 'materic-ambient-field',
    title: 'MatericAmbientField',
    category: 'primitive',
    statusOverride: 'candidate',
    maturity: 'needs-review',
    visibility: 'public',
    visualRole: 'an atmospheric field behind materic content — nebula, vignette, fireflies',
    usage: ['panel interiors', 'card backgrounds', 'observatory fields'],
    forbiddenUsage: ['plain surfaces', 'foreground content'],
    alternative: 'MatericGrain or plain background',
    bindings: ['--skin-surface-bg'],
    compositionRules: {
      primaryContexts: ['panel field', 'surface'],
      forbiddenContexts: ['foreground', 'minimal flat UI'],
    },
    sourcePath: 'src/ui/designSystem/primitives/MatericAmbientField.tsx',
  },
  {
    id: 'materic-heading',
    title: 'MatericHeading',
    category: 'primitive',
    statusOverride: 'candidate',
    maturity: 'needs-review',
    visibility: 'public',
    visualRole: 'a stacked title + subtitle + description for materic panels',
    usage: ['panel headers', 'card titles'],
    forbiddenUsage: ['inline labels', 'single line captions'],
    alternative: 'MatericSectionHeader for shorter titles',
    bindings: ['--skin-title-color', '--skin-subtitle-color'],
    compositionRules: {
      primaryContexts: ['panel header', 'card title'],
      forbiddenContexts: ['inline text', 'list item'],
    },
    sourcePath: 'src/ui/designSystem/primitives/MatericHeading.tsx',
  },
  {
    id: 'materic-section-header',
    title: 'MatericSectionHeader',
    category: 'primitive',
    statusOverride: 'candidate',
    maturity: 'needs-review',
    visibility: 'public',
    visualRole: 'a short, tiered section header with optional hint',
    usage: ['section breaks', 'well headers'],
    forbiddenUsage: ['page title', 'button label'],
    alternative: 'MatericHeading for page/card titles',
    bindings: ['--skin-title-color'],
    compositionRules: {
      primaryContexts: ['section', 'well'],
      forbiddenContexts: ['page title', 'navigation'],
    },
    sourcePath: 'src/ui/designSystem/primitives/MatericSectionHeader.tsx',
  },
  {
    id: 'materic-field',
    title: 'MatericField',
    category: 'primitive',
    statusOverride: 'candidate',
    maturity: 'needs-review',
    visibility: 'public',
    visualRole: 'a label/value pair in materic typography',
    usage: ['stat displays', 'quick facts', 'metadata'],
    forbiddenUsage: ['long paragraphs', 'interactive controls'],
    alternative: 'MatericHeading for unstructured text',
    bindings: ['--skin-title-color', '--skin-label-primary'],
    compositionRules: {
      primaryContexts: ['stat', 'metadata'],
      forbiddenContexts: ['narrative', 'interactive'],
    },
    sourcePath: 'src/ui/designSystem/primitives/MatericField.tsx',
  },
  {
    id: 'materic-field-group',
    title: 'MatericFieldGroup',
    category: 'primitive',
    statusOverride: 'candidate',
    maturity: 'needs-review',
    visibility: 'public',
    visualRole: 'a layout container for MatericField columns/rows/grid',
    usage: ['quick fact grids', 'stat blocks'],
    forbiddenUsage: ['unrelated fields without separators', 'arbitrary grids'],
    alternative: 'plain CSS grid for non-semantic grids',
    bindings: ['--skin-surface-bg'],
    compositionRules: {
      primaryContexts: ['stat block', 'quick facts'],
      forbiddenContexts: ['gallery', 'list'],
    },
    sourcePath: 'src/ui/designSystem/primitives/MatericFieldGroup.tsx',
  },
  {
    id: 'materic-divider',
    title: 'MatericDivider',
    category: 'primitive',
    statusOverride: 'candidate',
    maturity: 'needs-review',
    visibility: 'public',
    visualRole: 'an ornamental horizontal separator with diamond center',
    usage: ['between sections', 'below headers'],
    forbiddenUsage: ['between unrelated UI', 'as a line only'],
    alternative: 'plain <hr> for flat UI',
    bindings: ['--skin-surface-border'],
    compositionRules: {
      primaryContexts: ['panel', 'card', 'well'],
      forbiddenContexts: ['minimal flat UI', 'inline'],
    },
    sourcePath: 'src/ui/designSystem/primitives/MatericDivider.tsx',
  },
  {
    id: 'materic-record-list',
    title: 'MatericRecordList',
    category: 'primitive',
    statusOverride: 'candidate',
    maturity: 'needs-review',
    visibility: 'public',
    visualRole: 'a columnar record list with optional rail',
    usage: ['event chronicle', 'ledger', 'milestone list'],
    forbiddenUsage: ['interactive lists', 'sortable tables'],
    alternative: 'MatericRequirementList for check-style lists',
    bindings: ['--skin-body-color', '--skin-label-tertiary'],
    compositionRules: {
      primaryContexts: ['chronicle', 'ledger'],
      forbiddenContexts: ['interactive table', 'form'],
    },
    sourcePath: 'src/ui/designSystem/primitives/MatericRecordList.tsx',
  },
  {
    id: 'materic-requirement-list',
    title: 'MatericRequirementList',
    category: 'primitive',
    statusOverride: 'candidate',
    maturity: 'needs-review',
    visibility: 'public',
    visualRole: 'a list of current-vs-required checks',
    usage: ['squad requirements', 'prerequisites', 'warnings'],
    forbiddenUsage: ['plain text lists', 'countdowns'],
    alternative: 'MatericRecordList for read-only rows',
    bindings: ['--skin-body-color'],
    compositionRules: {
      primaryContexts: ['requirements', 'warnings'],
      forbiddenContexts: ['plain text', 'timer'],
    },
    sourcePath: 'src/ui/designSystem/primitives/MatericRequirementList.tsx',
  },
  {
    id: 'materic-portrait',
    title: 'MatericPortrait',
    category: 'primitive',
    statusOverride: 'candidate',
    maturity: 'needs-review',
    visibility: 'public',
    visualRole: 'a circular portrait with gold frame and atmospheric glow',
    usage: ['resident avatar', 'hero portrait', 'token medallion'],
    forbiddenUsage: ['generic icons', 'unframed images'],
    alternative: 'plain <img> for unframed avatars',
    bindings: ['--skin-medallion-ring', '--skin-title-color'],
    compositionRules: {
      primaryContexts: ['roster', 'character', 'token'],
      forbiddenContexts: ['icon', 'decoration'],
    },
    sourcePath: 'src/ui/designSystem/primitives/MatericPortrait.tsx',
  },
  {
    id: 'materic-stat-bar',
    title: 'MatericStatBar',
    category: 'primitive',
    statusOverride: 'candidate',
    maturity: 'needs-review',
    visibility: 'public',
    visualRole: 'a carved channel showing vital energy — HP, stamina, fatigue',
    usage: ['stat bars in roster', 'stat bars in character sheet', 'progress bars for vitals'],
    forbiddenUsage: ['generic progress bars', 'XP bars'],
    alternative: 'CarvedBar for stepped progress',
    bindings: ['--skin-statbar-hp-start', '--skin-statbar-stamina-start', '--skin-statbar-fatigue-start'],
    compositionRules: {
      primaryContexts: ['roster', 'character', 'vital display'],
      forbiddenContexts: ['quest progress', 'crafting progress'],
    },
    sourcePath: 'src/ui/designSystem/primitives/MatericStatBar.tsx',
  },
  {
    id: 'materic-inset',
    title: 'MatericInset',
    category: 'primitive',
    statusOverride: 'candidate',
    maturity: 'needs-review',
    visibility: 'public',
    visualRole: 'a recessed inset panel with material-aware CSS',
    usage: ['wells', 'nested information', 'compact blocks'],
    forbiddenUsage: ['top-level panels', 'floating modals'],
    alternative: 'MatericSurface for the top-level container',
    bindings: ['--skin-surface-bg', '--skin-surface-border'],
    compositionRules: {
      primaryContexts: ['well', 'nested block'],
      forbiddenContexts: ['modal', 'floating panel'],
    },
    sourcePath: 'src/ui/designSystem/primitives/MatericInset.tsx',
  },
  {
    id: 'materic-carved-bar',
    title: 'MatericCarvedBar',
    category: 'primitive',
    statusOverride: 'candidate',
    maturity: 'needs-review',
    visibility: 'public',
    visualRole: 'a carved channel with stepped energy fills (xp, mana, danger, capacity)',
    usage: ['quest progress', 'survey completion', 'capacity bars'],
    forbiddenUsage: ['vital stat bars (hp/stamina/fatigue)'],
    alternative: 'MatericStatBar for continuous vitals',
    bindings: ['--skin-statbar-stamina-start'],
    compositionRules: {
      primaryContexts: ['quest progress', 'survey', 'capacity'],
      forbiddenContexts: ['roster vitals'],
    },
    sourcePath: 'src/ui/designSystem/primitives/MatericCarvedBar.tsx',
  },
  {
    id: 'materic-button',
    title: 'MatericButton',
    category: 'primitive',
    statusOverride: 'candidate',
    maturity: 'needs-review',
    visibility: 'public',
    visualRole: 'a struck-bronze action plate',
    usage: ['actions', 'commits', 'utility buttons'],
    forbiddenUsage: ['navigation links', 'state toggles'],
    alternative: 'MatericBadge for status, <a> for navigation',
    bindings: ['--skin-btn-bg', '--skin-cta-bg'],
    compositionRules: {
      primaryContexts: ['action', 'commit'],
      forbiddenContexts: ['navigation', 'status'],
    },
    sourcePath: 'src/ui/designSystem/primitives/MatericButton.tsx',
  },
  {
    id: 'materic-badge',
    title: 'MatericBadge',
    category: 'primitive',
    statusOverride: 'candidate',
    maturity: 'needs-review',
    visibility: 'public',
    visualRole: 'an azure status whisper',
    usage: ['status tags', 'quest tags', 'rarity labels'],
    forbiddenUsage: ['counters', 'timers', 'resources'],
    alternative: 'MatericStatBar for continuous values',
    bindings: ['--skin-badge-bg', '--skin-badge-border'],
    compositionRules: {
      primaryContexts: ['status', 'quest', 'rarity'],
      forbiddenContexts: ['timer', 'resource', 'counter'],
    },
    sourcePath: 'src/ui/designSystem/primitives/MatericBadge.tsx',
  },
  {
    id: 'materic-close-button',
    title: 'MatericCloseButton',
    category: 'primitive',
    statusOverride: 'candidate',
    maturity: 'needs-review',
    visibility: 'public',
    visualRole: 'a gold radial coin close control',
    usage: ['panel close', 'modal close'],
    forbiddenUsage: ['inline destructive actions', 'cancel in forms'],
    alternative: 'MatericButton secondary for cancel',
    bindings: ['--skin-icon-color'],
    compositionRules: {
      primaryContexts: ['panel', 'modal'],
      forbiddenContexts: ['form', 'inline action'],
    },
    sourcePath: 'src/ui/designSystem/primitives/MatericCloseButton.tsx',
  },
  {
    id: 'materic-plaque',
    title: 'MatericPlaque',
    category: 'primitive',
    statusOverride: 'candidate',
    maturity: 'needs-review',
    visibility: 'public',
    visualRole: 'a small engraved badge — category or rank',
    usage: ['panel category', 'rank badge', 'targa'],
    forbiddenUsage: ['inline status', 'numeric counter'],
    alternative: 'MatericBadge for status pills',
    bindings: ['--skin-plaque-bg', '--skin-plaque-color'],
    compositionRules: {
      primaryContexts: ['header', 'badge'],
      forbiddenContexts: ['inline text', 'counter'],
    },
    sourcePath: 'src/ui/designSystem/primitives/MatericPlaque.tsx',
  },
  {
    id: 'materic-title-sep',
    title: 'MatericTitleSep',
    category: 'primitive',
    statusOverride: 'candidate',
    maturity: 'needs-review',
    visibility: 'public',
    visualRole: 'an ornamental title separator with center ornament',
    usage: ['below headers', 'between title and body'],
    forbiddenUsage: ['plain horizontal rule', 'between unrelated blocks'],
    alternative: 'MatericDivider for longer section breaks',
    bindings: ['--skin-titlesep-line', '--skin-titlesep-diamond-color'],
    compositionRules: {
      primaryContexts: ['header', 'title'],
      forbiddenContexts: ['plain list', 'form'],
    },
    sourcePath: 'src/ui/designSystem/primitives/MatericTitleSep.tsx',
  },
  {
    id: 'materic-slot',
    title: 'MatericSlot',
    category: 'primitive',
    statusOverride: 'candidate',
    maturity: 'needs-review',
    visibility: 'public',
    visualRole: 'a circular slot coin with optional label',
    usage: ['slot racks', 'crew assignment', 'required roles'],
    forbiddenUsage: ['avatar without commitment', 'decorative coin'],
    alternative: 'MatericPortrait for resident faces, MatericMedallion for tokens',
    bindings: ['--skin-subtitle-color'],
    compositionRules: {
      primaryContexts: ['slot rack', 'assignment'],
      forbiddenContexts: ['avatar', 'decoration'],
    },
    sourcePath: 'src/ui/designSystem/primitives/MatericSlot.tsx',
  },
  {
    id: 'material-stat-bar',
    title: 'MaterialStatBar',
    category: 'primitive',
    statusOverride: 'candidate',
    maturity: 'stable',
    visibility: 'public',
    visualRole: 'a carved channel showing vital energy — HP, stamina, fatigue',
    usage: ['stat bars in roster', 'stat bars in character sheet', 'progress bars for vitals'],
    forbiddenUsage: ['generic progress bars', 'XP bars'],
    alternative: 'MaterialDial for cyclic progress',
    bindings: ['--skin-statbar-hp-start', '--skin-statbar-stamina-start', '--skin-statbar-fatigue-start', '--mat-hp-fill', '--mat-stamina-fill'],
    compositionRules: {
      primaryContexts: ['roster', 'character', 'vital display'],
      forbiddenContexts: ['quest progress', 'crafting progress'],
    },
    sourcePath: 'src/ui/idleVillage/skins/primitives/index.ts',
  },
  {
    id: 'skin-button',
    title: 'SkinButton',
    category: 'primitive',
    statusOverride: 'production',
    maturity: 'stable',
    visibility: 'public',
    visualRole: 'a struck-bronze action plate — weight behind every action',
    usage: ['azioni utility (default)', 'azioni secondarie (secondary)', 'azione primaria di scena (cta)'],
    forbiddenUsage: ['link di navigazione', 'toggle di stato'],
    alternative: 'SkinBadge per stati, <a> per navigazione',
    bindings: ['--skin-btn-bg', '--skin-btn2-bg', '--skin-cta-bg'],
    compositionRules: {
      primaryContexts: ['action', 'commit'],
      forbiddenContexts: ['status', 'navigation'],
    },
    sourcePath: 'src/ui/idleVillage/skins/primitives/SkinButton.tsx',
  },
  {
    id: 'skin-badge',
    title: 'SkinBadge',
    category: 'primitive',
    statusOverride: 'production',
    maturity: 'stable',
    visibility: 'public',
    visualRole: 'an azure whisper of status — information, not action',
    usage: ['stati inline', 'tag di rarità/quest'],
    forbiddenUsage: ['counter numerici', 'timer', 'risorse'],
    alternative: 'stat bar per valori continui',
    bindings: ['--skin-badge-bg', '--skin-badge-border', '--skin-badge-color'],
    compositionRules: {
      primaryContexts: ['status', 'achievement', 'quest'],
      forbiddenContexts: ['timer', 'resource', 'counter'],
    },
    sourcePath: 'src/ui/idleVillage/skins/primitives/SkinBadge.tsx',
  },
];

/* Valida al load: un'entry malformata deve fallire subito, non in render. */
export const COMPONENT_CATALOG: CatalogEntry[] = ENTRIES.map((entry) =>
  CatalogEntrySchema.parse(entry)
);

/** Lookup per id. */
export function getCatalogEntry(id: string): CatalogEntry | undefined {
  return COMPONENT_CATALOG.find((entry) => entry.id === id);
}

/** Conteggi per l'inventory counter dell'header. */
export function getCatalogCounts(): Record<CatalogStatus, number> {
  const counts: Record<CatalogStatus, number> = {
    production: 0,
    candidate: 0,
    deprecated: 0,
    experimental: 0,
  };
  for (const entry of COMPONENT_CATALOG) {
    counts[getCatalogStatus(entry)] += 1;
  }
  return counts;
}
