# Guida: Come Creare una Pagina di Integration Test

Questa guida documenta i pattern, le trappole e le soluzioni scoperte costruendo `/minimal-continuous-job`. Seguila per creare nuove pagine di test che funzionino al primo colpo.

---

## 1. Architettura: Le Due Anime del Sistema

Il progetto ha **due sistemi paralleli** che non comunicano automaticamente:

| Sistema | Config | Residents | Tick Logic |
|---------|--------|-----------|------------|
| **TimeEngine** (`TimeEngine.ts`) | `IdleVillageConfig` (record keyed by id) | `ResidentState` (fatigue, status, isHero) | `advanceTime()` + `applyContinuousJobTick()` |
| **Zustand Store** (`useMinimalGameplay.ts`) | `MinimalConfig` (array activities) | `MinimalResident` (fatigue, isWorking, isInjured) | `tick()` interno (day/night, food, fatigue decay) |

**Regola d'oro:** il Zustand store e' la source of truth a runtime. Il TimeEngine contiene logica engine pura ma NON viene invocato dal store tick. Se hai bisogno di logica engine (continuous jobs, skill checks, ecc.), devi integrarla nel `tick()` del store.

---

## 2. Source of Truth dei Residents

### Il Problema
Esistono **due fonti** di residents con ID diversi:

- `useVillageResidents()` → ritorna `fallback-worker-1`, `fallback-worker-2` (dal CharacterToResidentBootstrap)
- `gameplayState.state.residents` → ritorna `hero-sir-spaccaculi`, `hero-salvatrice`, `hero-giggiolillo` (dal TEST_ROSTER_HEROES nel Zustand store)

### La Soluzione
Usa SEMPRE `gameplayState.state.residents` per:
- Visualizzare il roster
- Assegnare PG alle attivita'
- Leggere fatigue/stamina
- Costruire slot view models

```tsx
// CORRETTO
const stateResidents = gameplayState.state.residents ?? [];

// SBAGLIATO — IDs diversi, non matchano con lo store
const { residents } = useVillageResidents();
```

NON usare `VillageRosterSection` (usa `useVillageResidents` internamente). Costruisci le tue card dal `stateResidents`.

---

## 3. Config Sync: Il Gap Critico

### Il Problema
Il Zustand store si inizializza con `activities: {}` (vuoto). Il hook `useMinimalGameplayWithIdleVillageConfig()` ricalcola un `MinimalConfig` corretto in un `useMemo`, ma il campo `config` interno allo store non viene aggiornato. Risultato: `startActivity()` fallisce con "Activity not found".

### La Soluzione
Aggiungi sempre questo `useEffect` nella pagina:

```tsx
const { config: idleVillageConfig } = useIdleVillageConfig();
const gameplayState = useMinimalGameplayWithIdleVillageConfig();

useEffect(() => {
  if (gameplayState.config?.activities?.length > 0) {
    const rawActivities = idleVillageConfig.activities ?? {};
    useMinimalGameplayStore.setState({
      config: gameplayState.config,
      _rawActivities: rawActivities,  // per lookup campi non trasformati
    } as any);
  }
}, [gameplayState.config]);
```

**Perche' `_rawActivities`?** La trasformazione `IdleVillageConfig → MinimalConfig` perde campi come `continuousJob`, `staminaCostPerTick`, `allowInSlotRest`, `inSlotRecoveryPerTick`, `dailyRewardProfile`. Il tick del store deve poterli leggere dal config raw.

---

## 4. Activity Definition: Campi Chiave

Quando crei un'activity di test, assicurati di:

```ts
job_mio_test: {
  id: 'job_mio_test',
  label: 'Nome Leggibile',
  // NESSUN stat requirement — altrimenti i TEST_ROSTER_HEROES non passano
  // (hanno combat stats, non D&D stats come discipline/edge/lantern)
  continuousJob: true,           // attiva la logica continuous nel tick
  allowInSlotRest: true,         // riposa nello slot invece di essere espulso
  staminaCostPerTick: 25,        // fatigue aggiunta per tick
  inSlotRecoveryPerTick: 5,      // fatigue rimossa per tick in rest
  maxSlots: 'infinite' as const, // oppure un numero
  dailyRewardProfile: [
    { resourceId: 'gold', amountPerDay: 3 },
  ],
  // ...altri campi obbligatori (tags, cardKind, level, ecc.)
}
```

**Attenzione a `maxSlots: 'infinite'`:** e' una stringa, non un numero. Il check `?? 3` non funziona perche' `'infinite'` e' truthy. Usa:

```tsx
const rawSlots = (activity as any)?.maxSlots;
const maxSlots = typeof rawSlots === 'number' ? rawSlots : 3;
```

---

## 5. Slot Rack Reale: Provider Chain

Il `ResidentSlotRack` richiede una catena di provider. Usa `SlotRackKitShell` dal frozen kit:

```tsx
import { SlotRackKitShell, ResidentSlotRack } from '@/ui/idleVillage/frozen/kits/slotRackKit';
import { TooltipProvider } from '@/ui/idleVillage/components/TooltipProvider';
import type { ResidentSlotViewModel } from '@/ui/idleVillage/slots/types';

// Dentro il JSX:
<TooltipProvider>
  <SlotRackKitShell>
    <ResidentSlotRack
      slots={slotViewModels}
      layout="detail"
      onSlotClear={handleSlotClear}
      onSlotClick={handleSlotClick}
    />
  </SlotRackKitShell>
</TooltipProvider>
```

### Costruire SlotViewModels dallo stato engine

```tsx
const slotViewModels: ResidentSlotViewModel[] = useMemo(() => {
  return Array.from({ length: maxSlots }, (_, i) => {
    const activity = activeActivities[i];
    const residentId = activity?.residentId ?? null;
    const resident = residentId
      ? stateResidents.find(r => r.id === residentId)
      : undefined;

    return {
      id: `my-slot-${i}`,
      index: i,
      label: resident?.displayName ?? `Slot ${i + 1}`,
      assignedResidentId: residentId,
      assignedResident: resident,
      isPlaceholder: false,
      dropState: 'idle' as const,
      bloomState: 'idle' as const,
      status: residentId ? 'assigned' as const : 'empty' as const,
      telemetryTags: [],
    };
  });
}, [activeActivities, stateResidents]);
```

---

## 6. Logica Engine nel Tick: Come Integrarla

La logica custom (continuous job, skill checks, ecc.) va nel `tick()` del Zustand store (`useMinimalGameplay.ts`), NON in un `useEffect` della pagina.

**Perche'?** Il `tick()` fa `set((s) => { ... return { state: nextState } })`. Se modifichi lo stato in un effect esterno, al tick successivo il `set()` usa lo snapshot PRIMA della tua modifica — le tue modifiche vengono perse.

### Dove inserire

```ts
// In useMinimalGameplay.ts, dentro tick(), DOPO il day/night calculation
// e PRIMA del trackTelemetryEvent:

// Continuous job processing
if (nextState.activeActivities?.length > 0) {
  const rawActivities = (get() as any)._rawActivities;
  for (const activity of nextState.activeActivities) {
    const actDef = rawActivities?.[activity.activityId];
    if (!actDef?.continuousJob) continue;
    // ... logica fatigue/reward/rest/eject
  }
}
```

---

## 7. Tick Log: Pattern di Osservazione

Non affidarti a `state.eventLog` — il Zustand store non lo popola (quello e' del TimeEngine). Usa un pattern **diff-based**: confronta lo stato corrente con quello del tick precedente.

```tsx
const prevResidentsRef = useRef<Map<string, number>>(new Map());
const prevGoldRef = useRef<number>(0);

useEffect(() => {
  // Per ogni resident, calcola delta fatigue
  for (const r of stateResidents) {
    const prev = prevResidentsRef.current.get(r.id) ?? 0;
    const delta = r.fatigue - prev;
    if (delta > 0) events.push(`FATIGUE +${delta}: ${r.name}`);
    if (r._resting) events.push(`REST: ${r.name}`);
    prevResidentsRef.current.set(r.id, r.fatigue);
  }
  // Confronta gold per reward
  if (state.gold > prevGoldRef.current) {
    events.push(`REWARD +${(state.gold - prevGoldRef.current).toFixed(2)} gold`);
  }
}, [state.currentTick]);
```

---

## 8. Checklist Pre-Launch

Prima di considerare una pagina di test "funzionante":

- [ ] **Residents**: uso `gameplayState.state.residents`, NON `useVillageResidents()`
- [ ] **Config sync**: `useEffect` che fa `useMinimalGameplayStore.setState({ config, _rawActivities })`
- [ ] **Activity trovata**: nessun stat requirement, o stats compatibili con TEST_ROSTER_HEROES
- [ ] **Slot visuale**: `SlotRackKitShell` + `TooltipProvider` wrappano il `ResidentSlotRack`
- [ ] **maxSlots**: gestito il caso `'infinite'` (stringa, non numero)
- [ ] **Logica engine nel tick**: inserita dentro `tick()` del store, non in effect esterno
- [ ] **Node version**: dev server usa Node 18+ (vedi `.claude/launch.json`)
- [ ] **Tick log diff-based**: confronta stato prev vs current, non legge eventLog

---

## 9. Dev Server e Node

Il progetto richiede Node 18+ per Vite. Se il sistema defaulta a Node 16:

```json
// .claude/launch.json
{
  "configurations": [{
    "name": "dev",
    "runtimeExecutable": "bash",
    "runtimeArgs": ["-c", "export PATH=~/.nvm/versions/node/v20.20.0/bin:$PATH && npx vite --mode development"],
    "port": 5173
  }]
}
```

---

## 10. Pattern di Test Manuale

1. **Apri la pagina** — verifica che renderizzi senza errori console
2. **Premi Assign** — verifica nel log che non ci siano BLOCKED
3. **Premi Resume** — verifica che i tick partano e la fatigue salga
4. **Osserva il ciclo**: fatigue cresce → raggiunge max → REST MODE → recovery → RESUMED → ricomincia
5. **Verifica risorse**: gold deve salire ad ogni tick di lavoro
6. **Verifica slot visuale**: avatar del PG appare nel cerchio V12
7. **Verifica stamina bar**: deve calare progressivamente nel roster

---

## Esempio Completo di Riferimento

Pagina: `/minimal-continuous-job`
File: `src/ui/idleVillage/MinimalContinuousJobPage.tsx`
Activity: `job_continuous_test` in `defaultConfig.ts`
Store logic: sezione "Continuous job processing" in `useMinimalGameplay.ts` tick()
