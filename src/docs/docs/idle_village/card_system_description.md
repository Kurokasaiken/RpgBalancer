# Idle Village Card System - Descrizione Completa per AI

**Aligned with Config-First Philosophy:** See [DEVELOPMENT_GUIDELINES.md](../DEVELOPMENT_GUIDELINES.md) §2 for config-first rules
**Aligned with Project Philosophy:** See [PROJECT_PHILOSOPHY.md](../PROJECT_PHILOSOPHY.md) for weight-based creator pattern
**Aligned with Semantic Constraints:** See [context/RPG_PROJECT_CONTEXT.md](../../context/RPG_PROJECT_CONTEXT.md) for freezing semantics and state mutation rules

---

## Panoramica del Sistema

Il sistema Idle Village utilizza un'architettura di card evoluta che gestisce interazioni tra personaggi (PG) e attività attraverso un sistema drag & drop sofisticato. Il sistema è passato da "VerbCard" (legacy) a "ActionCard" (nuovo) mantenendo compatibilità e funzionalità avanzate.

## 1. Vecchie VerbCard (Legacy)

### Scopo
Le VerbCard erano il sistema originale per rappresentare attività nel villaggio idle. Sono state sostituite dalle ActionCard ma rimangono in `src/ui/idleVillage/legacy/` per compatibilità.

### Caratteristiche Principali
- **Visual Style**: Hearthstone-style cards con varianti colorate (azure, ember, jade, amethyst, solar)
- **Progress Visualization**: Halo progress indicator, ribbon, o border styles
- **Risk Display**: Stripe verticale per injury/death percentages
- **Drag & Drop**: Basic drop state feedback (valid/invalid/idle)

### Struttura Dati
```typescript
interface VerbCardProps {
  icon: React.ReactNode;
  progressFraction: number;        // 0 to 1
  elapsedSeconds: number;          // Timer display
  totalDuration: number;           // Total duration
  injuryPercentage: number;       // 0-100 risk stripe
  deathPercentage: number;        // 0-100 risk stripe
  assignedCount: number;           // Assigned residents
  totalSlots: number;            // Available slots
  visualVariant: VerbVisualVariant;
  dropState: DropState;
}
```

### Interazioni con PG
- **Drag & Drop**: PG possono essere trascinati sulle VerbCard
- **Slot Assignment**: Sistema base per assegnare PG agli slot
- **Feedback Visivo**: Evidenziazione emerald per drop validi

## 2. Nuove ActionCard (Sistema Attuale)

### Scopo
Le ActionCard sono il sistema evoluto che sostituisce le VerbCard con maggiore flessibilità, styling avanzato e interazioni complesse.

### Caratteristiche Principali
- **Advanced Styling**: Theme system con feel presets e variant customization
- **Rich Interactions**: Halo medallion click, drag enter/leave, bloom effects
- **Assignee System**: Supporto per multiple assignees con portrait e status
- **Progress Tracking**: Advanced progress visualization con trail/orbit effects
- **Status Management**: idle/active/completed states con automatic transitions

### Struttura Dati
```typescript
interface ActionCardProps {
  label: string;
  icon: ReactNode;
  progressFraction: number;
  elapsedSeconds: number;
  totalDurationSeconds: number;
  isPlaying?: boolean;
  status?: ActionCardStatus;        // idle | active | completed
  variant?: VerbVisualVariant;
  themeOverride?: ActionCardTheme;
  feelPreset?: ActionCardFeelPreset;
  metrics?: ActionCardMetric[];
  assignees?: ActionCardAssignee[];
  injuryPercentage?: number;
  deathPercentage?: number;
  onCollect?: () => void;           // CTA per completed activities
}
```

### Interazioni con PG
- **Advanced Drag & Drop**: Halo medallion come drop target con bloom effects
- **Multi-Assignee Support**: Multiple PG possono essere assegnati con visualizzazione portrait
- **Status-Based Interactions**: Click per play/pause, collect CTA per completed
- **Rich Feedback**: Particle effects, glow animations, haptic feedback

## 3. ActivitySlot (Slot System)

### Scopo
Gli ActivitySlot sono i contenitori che ricevono i PG trascinati dal roster. Gestiscono l'assegnazione, validazione e stato delle attività.

### Caratteristiche Principali
- **Drop Validation**: Sistema dual-layer con custom e general validators
- **Visual Feedback**: Glow effects per valid/invalid drops con variant colors
- **Lock System**: Slots possono essere bloccati per phase (es. notte)
- **Progress Integration**: Visualizzazione progress quando PG è assegnato
- **Modifier Support**: Tooltip con stat modifiers applicati allo slot

### Struttura Dati
```typescript
interface ActivitySlotCardProps {
  slotId: string;
  iconName: string;
  label: string;
  assignedWorkerName?: string;
  assignedWorkerAvatarUrl?: string;
  progressFraction: number;
  elapsedSeconds: number;
  totalDuration: number;
  isInteractive?: boolean;
  dropState?: DropState;
  canAcceptDrop?: boolean;
  visualVariant?: VerbVisualVariant;
  isLockedByPhase?: boolean;
  validationResult?: DropValidationResult;
}
```

### Interazioni con PG
- **Drag & Drop Reception**: Accetta PG dal roster con validazione completa
- **Click Assignment**: Click diretto per assegnare PG disponibili
- **Visual Feedback**: Glow emerald per drop validi, rosso per invalidi
- **State Management**: Aggiorna stato PG (working, injured, fatigued)

## 4. Categorie di Attività

### 4.1 Attività Passive (Ciclo Giorno/Notte e Fame)

**Descrizione**: Sistema automatico che gestisce cicli naturali e bisogni base del villaggio.

**Caratteristiche**:
- **Automatic Execution**: Non richiedono assegnazione PG
- **Phase-Based**: Si attivano/disattivano basandosi su day/night cycle
- **Global Effects**: Influenzano l'intero villaggio (es. fame riduce efficiency)
- **Background Processing**: Corrono in background senza interazione utente

**Implementazione**:
```typescript
// Passive activities typically use ActionCard con isInteractive=false
<ActionCard
  label="Ciclo Giorno/Notte"
  icon="🌅/🌙"
  isPlaying={true}  // Always running
  status="active"
  isInteractive={false}
  metrics={[
    { label: "Phase", value: currentPhase },
    { label: "Hunger", value: `${hungerLevel}%` }
  ]}
/>
```

**Interazioni PG**: Indirette - influenzano disponibilità e performance dei PG

### 4.2 Attività Attive (Job e Activity con Details e Slot)

**Descrizione**: Attività principali che richiedono assegnazione PG per produrre risorse.

**Caratteristiche**:
- **Slot-Based**: Richiedono assegnazione PG tramite ActivitySlot
- **Resource Production**: Generano risorse (gold, food, materials)
- **Risk/Reward**: Balance tra rischio (injury/death) e ricompense
- **Time-Based**: Durata definita con progress visualization

**Implementazione**:
```typescript
// Active activities usano ActionCard + ActivitySlot system
<ActivitySlot
  slotId="forest-gathering"
  iconName="🪓"
  label="Raccolta"
  visualVariant="jade"  // Green for nature activities
  isInteractive={true}
  canAcceptDrop={true}
  onWorkerDrop={handleWorkerAssignment}
  progressFraction={progress}
  totalDuration={120}  // 2 minutes
  injuryPercentage={15}
  deathPercentage={2}
/>
```

**Interazioni PG**:
- **Drag Assignment**: PG trascinati dal roster agli slot
- **Click Assignment**: Click diretto per assegnazione automatica
- **Validation**: HP ≥ 200, tag requirements, stat requirements
- **Status Updates**: PG becomes "working", gains fatigue, risk injury

### 4.3 Attività Speciali (Luoghi e Quest)

**Descrizione**: Attività speciali con meccaniche uniche e narrative elements.

**Caratteristiche**:
- **Location-Based**: Associate a luoghi specifici sulla mappa
- **Quest Mechanics**: Multi-phase con branching e choices
- **Special Requirements**: Requisiti unici (es. specific PG, items)
- **Narrative Elements**: Story progression e character development

**Implementazione**:
```typescript
// Special activities usano ActionCard con themes custom
<ActionCard
  label="Foresta Misteriosa"
  icon="🌲"
  visualVariant="amethyst"  // Purple for mystery/quest
  feelPreset="quest"
  status={questStatus}
  metrics={[
    { label: "Phase", value: currentQuestPhase },
    { label: "Discovery", value: `${discoveryPercent}%` }
  ]}
  assignees={questParticipants}
  onCollect={handleQuestReward}
/>

// Location-based slot con special validation
<ActivitySlot
  slotId="mysterious-forest"
  iconName="🌲"
  label="Luogo Segreto"
  visualVariant="amethyst"
  isLockedByPhase={!isNightTime}  // Only accessible at night
  validationResult={validateQuestRequirements}
/>
```

**Interazioni PG**:
- **Quest Assignment**: PG specifici richiesti per quest
- **Location Requirements**: Accesso basato su location, phase, items
- **Multi-Phase Progress**: Progress attraverso quest phases
- **Special Rewards**: Unique rewards e character development

## 5. Sistema di Interazione PG-Activity

### 5.1 Roster System

**Componenti**:
- **PgCard**: Card singola PG draggable
- **WorkerPanel**: Micro-roster verticale
- **TestRosterPage**: Pagina principale con lista completa

**Stati PG**:
```typescript
interface MinimalResident {
  id: string;
  name: string;
  hp: number;           // 0-100
  fatigue: number;      // 0-100
  isWorking: boolean;   // Currently assigned
  isInjured: boolean;   // Cannot work
  isHero: boolean;      // Special status
}
```

### 5.2 Drag & Drop Flow

**1. Drag Initiation**:
```typescript
// PgCard.onPointerDown → set drag image + cursor offset
const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
  id: resident.id,
  data: { type: 'resident-token', residentId: resident.id },
});
```

**2. Drop Validation**:
```typescript
// useResidentDropValidation → dual-layer validation
const validation = useResidentDropValidation({
  residentId,
  slotId,
  rules: residentDropRules,  // HP ≥ 200, tags, stats
});
```

**3. Assignment Logic**:
```typescript
// SlotLabPanel → handle valid/invalid drops
const handleDrop = (residentId: string | null) => {
  if (validation.isValid) {
    assignWorkerToSlot(slotId, residentId);
    updateResidentStatus(residentId, 'working');
  } else {
    showDropFeedback(validation.message);
  }
};
```

### 5.3 Validation System

**Tag-Based Requirements**:
```typescript
const tagRequirements = {
  requiredTags: ['woodcutting', 'basic'],
  forbiddenTags: ['injured', 'exhausted'],
};
```

**Numeric Requirements**:
```typescript
const numericRequirements = {
  hp: { operator: '>=', value: 200 },
  strength: { operator: '>=', value: 50 },
};
```

**Custom Validators**:
```typescript
const customValidator = (resident: Resident, slot: ActivitySlot) => {
  return resident.fatigue < 80 && !slot.isLockedByPhase;
};
```

## 6. Stato e Persistence

### 6.1 State Management
- **DragContext**: Globale drag state (activeId, cursorOffset)
- **Local State**: Component-specific states (isDragging, isOver)
- **Scenario API**: Persistent assignment storage

### 6.2 Persistence
```typescript
// Assignments salvate in scenario API
const scenarioState = {
  assignments: {
    'forest-gathering': { workerId: 'resident-1', startTime: Date.now() },
    'blacksmith': { workerId: 'resident-2', startTime: Date.now() },
  },
  residents: {
    'resident-1': { hp: 85, fatigue: 30, isWorking: true },
    'resident-2': { hp: 92, fatigue: 15, isWorking: true },
  },
};
```

## 7. Feedback System

### 7.1 Visual Feedback
- **Valid Drop**: Emerald glow con ring animation
- **Invalid Drop**: Red glow con shake effect
- **Locked Slot**: Gray overlay con lock icon
- **Progress**: Halo progress con variant colors

### 7.2 Audio/Haptic Feedback
```typescript
const { playCue } = useAudioCueConfig();
const { trigger: triggerHaptic } = useHaptic({
  enabledPatterns: ['success', 'warning', 'error'],
});

// Success assignment
playCue('slot-assign-success');
triggerHaptic('success');
```

### 7.3 Telemetry
```typescript
trackTelemetryEvent('slot_assignment', {
  slotId,
  residentId,
  validationResult: validation.isValid,
  assignmentTime: Date.now(),
  dropCoordinates: { x, y },
});
```

## 8. Config-First Architecture

### 8.1 Drag Configuration
```typescript
// src/ui/idleVillage/config/dragConfig.ts
export const dragConfig = {
  sensors: {
    PointerSensor: { activationConstraint: { distance: 4 } },
    TouchSensor: { activationConstraint: { delay: 250, tolerance: 5 } },
  },
  collision: 'pointerWithin',  // Prevents ghost assignments
  feedback: {
    validGlow: 'rgba(16,185,129,0.6)',
    invalidGlow: 'rgba(244,63,94,0.6)',
  },
};
```

### 8.2 Slot Configuration
```typescript
// src/ui/idleVillage/config/minimalFeedbackConfig.ts
export const slotGlowConfig = {
  valid: {
    boxShadow: '0 0 20px rgba(16,185,129,0.6)',
    borderColor: 'rgba(16,185,129,0.8)',
  },
  invalid: {
    boxShadow: '0 0 20px rgba(244,63,94,0.6)',
    borderColor: 'rgba(244,63,94,0.8)',
  },
};
```

## 9. Testing e Debug

### 9.1 E2E Tests
- **drag-offset**: Verifica allineamento overlay cursore
- **invalid-drop-rejection**: Verifica rifiuto drop invalidi
- **sequential-assignment**: Verifica assegnazione multipla
- **ghost-drop-prevention**: Verifica nessuna assegnazione fantasma

### 9.2 Debug Tools
- **Drag Test Container**: Interfaccia per test drag & drop
- **Telemetry Dashboard**: Visualizzazione eventi e performance
- **Slot Lab Panel**: Interface per testing slot validation

## 10. Best Practices per AI

### 10.1 Quando Creare Nuove Activity
1. **Definire categoria**: Passive/Active/Special
2. **Scegliere variant**: Color appropriato per tipo attività
3. **Configurare requirements**: HP, tags, stats necessari
4. **Impostare risk/reward**: Injury/death percentages bilanciati
5. **Testare validation**: Assicurarsi che solo PG appropriati possano essere assegnati

### 10.2 Quando Modificare Interazioni
1. **Maintain drag contract**: Usare sempre `pointerWithin` collision detection
2. **Preserve validation**: Dual-layer validation (custom + general)
3. **Update telemetry**: Tracciare tutte le interazioni utente
4. **Test edge cases**: Drop invalidi, locked slots, exhausted PG

### 10.3 Performance Considerations
1. **Lazy loading**: Caricare componenti solo quando necessari
2. **Memoization**: Usare useMemo per calcoli costosi
3. **Debounce updates**: Evitare re-render eccessivi durante drag
4. **Optimize animations**: Usare CSS transforms invece di layout changes

## 11. Esempi Pratici

### 11.1 Creazione Activity Passive (Fame)
```typescript
<ActionCard
  label="Sistema Fame"
  icon="🍖"
  variant="ember"  // Red for hunger/danger
  isPlaying={true}
  isInteractive={false}
  status="active"
  metrics={[
    { label: "Fame Villaggio", value: `${villageHunger}%` },
    { label: "Efficienza", value: `${efficiencyPenalty}%` }
  ]}
/>
```

### 11.2 Creazione Activity Active (Lavoro)
```typescript
<ActivitySlot
  slotId="mining"
  iconName="⛏️"
  label="Miniera"
  variant="solar"  // Gold/yellow for mining
  isInteractive={true}
  canAcceptDrop={true}
  totalDuration={180}  // 3 minutes
  injuryPercentage={25}
  deathPercentage={5}
  onWorkerDrop={(workerId) => assignMiner(workerId)}
/>
```

### 11.3 Creazione Activity Special (Quest)
```typescript
<ActionCard
  label="Ricerca Artefatto"
  icon="🔮"
  variant="amethyst"  // Purple for mystery
  feelPreset="quest"
  status={questPhase}
  assignees={questMembers}
  metrics={[
    { label: "Progresso", value: `${questProgress}%` },
    { label: "Fase", value: currentPhase }
  ]}
  onCollect={claimQuestReward}
/>
```

## 12. Troubleshooting Comune

### 12.1 Drop Non Funziona
- Verificare `collisionDetection={pointerWithin}`
- Controllare che `canAcceptDrop` sia true
- Verificare validazione requirements

### 12.2 PG Non Si Assegnano
- Controllare stato PG (injured, exhausted)
- Verificare HP ≥ 200 requirements
- Controllare slot availability

### 12.3 Progress Non Aggiorna
- Verificare `elapsedSeconds` e `totalDuration`
- Controllare che `isPlaying` sia true
- Assicurarsi che timer loop sia attivo

---

Questo sistema fornisce una base solida per creare esperienze idle village complesse con interazioni PG-activity sofisticate, mantenendo performance ottimali e用户体验 eccellente.
