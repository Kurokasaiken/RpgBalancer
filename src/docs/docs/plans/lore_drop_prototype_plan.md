# Mini Piano: Prototipo Lore Drop in Idle Village

## Obiettivo

Far comparire **reali pezzi di lore** in gioco nel più breve tempo possibile, usando come prima superficie le **quest di Idle Village** (dove esiste già la sidebar `Diario` di `QuestChronicle`).

Il prototipo implementa un **pool di Lore Drop** che vengono assegnati **randomicamente a un elemento compatibile** (quest, location, building, character, item). Una volta assegnato a un elemento, quel drop **non può più essere riassegnato** durante la partita.

---

## Concetto chiave

- **Lore Drop** = un singolo frammento di lore (titolo + corpo + categoria + vincoli di assegnazione).
- **Pool** = lista config-first di tutti i drop disponibili.
- **Assegnazione** = all'atto della generazione (o primo contatto) di un'entità, un drop compatibile viene estratto e legato all'entità.
- **Discovery** = quando l'entità viene completata/visitata/interagita, il drop viene scoperto e mostrato al player.
- **Unicità** = ogni `loreDropId` può essere assegnato **una sola volta** a una sola istanza di entità per partita.

---

## Schema dati

```typescript
// src/balancing/config/lore/loreDropTypes.ts
export type LoreDropAssignableTo = 'quest' | 'location' | 'building' | 'character' | 'item';

export interface LoreDrop {
  id: string;
  title: string;
  body: string;
  category: 'history' | 'faction' | 'location' | 'character' | 'item' | 'curio';
  assignableTo: LoreDropAssignableTo[];
  tags?: string[]; // per matching su entità, es. ['combat'], ['forest'], ['wolves']
  weight?: number; // probabilità relativa tra i drop candidati
}

export interface AssignedLoreDrop {
  loreDropId: string;
  entityId: string;
  entityType: LoreDropAssignableTo;
  discovered: boolean;
  discoveredAt?: number;
}

export interface LoreDropState {
  assigned: AssignedLoreDrop[];
  discoveredIds: string[];
}
```

---

## Esempio di pool (12 drop)

```typescript
// src/balancing/config/lore/loreDropSamples.ts
export const LORE_DROP_SAMPLES: LoreDrop[] = [
  {
    id: 'ld-ashes-oath',
    title: 'Il Giuramento delle Ceneri',
    body: '«Quando l\'ultima fiamma si sarà spenta, il patto sarà sigillato con la cenere, non con il sangue.»',
    category: 'history',
    assignableTo: ['quest'],
    tags: ['combat', 'ritual'],
    weight: 1,
  },
  {
    id: 'ld-wolf-hunger',
    title: 'La Fame del Branco',
    body: 'I lupi delle rovine non attaccano per fame: seguono un ordine più antico, scritto nelle fosse fuori dalle mura.',
    category: 'faction',
    assignableTo: ['quest', 'location'],
    tags: ['wolves', 'night', 'forest'],
    weight: 1,
  },
  {
    id: 'ld-gate-whispers',
    title: 'I Sussurri del Cancello',
    body: 'Di notte, le grate del villaggio vibrano come corde. I vecchi dicono che le mura stiano imparando a parlare.',
    category: 'location',
    assignableTo: ['building', 'location'],
    tags: ['village_gate', 'defense'],
    weight: 1,
  },
  {
    id: 'ld-first-forge',
    title: 'La Prima Forgia',
    body: 'Prima che le fucine spettrali crollassero, un solo martello fu battuto sotto il sole. Ne rimane il calco.',
    category: 'history',
    assignableTo: ['building'],
    tags: ['forge', 'smithy'],
    weight: 1,
  },
  {
    id: 'ld-sewer-cartographer',
    title: 'Il Cartografo delle Fogne',
    body: 'Nessuno ha mai disegnato le fogne del villaggio. Nessuno, tranne lui. E lui non è mai tornato su.',
    category: 'character',
    assignableTo: ['quest', 'location'],
    tags: ['city_sewers', 'explore'],
    weight: 1,
  },
  {
    id: 'ld-ember-sigil',
    title: 'Il Sigillo di Brace',
    body: 'Gli Ember Sigils non sono moneta: sono memoria compressa di un\'era in cui il sole non tramontava mai.',
    category: 'item',
    assignableTo: ['item'],
    tags: ['currency', 'ember'],
    weight: 1,
  },
  {
    id: 'ld-forest-resin',
    title: 'Resina del Confine',
    body: 'La resina della foresta settentrionale non brucia. Canta, a bassa voce, quando il vento cambia direzione.',
    category: 'location',
    assignableTo: ['location', 'quest'],
    tags: ['forest', 'wood'],
    weight: 1,
  },
  {
    id: 'ld-ghost-furnace',
    title: 'Le Fornaci Spettrali',
    body: 'I wraith non difendono le fornaci. Le fornaci li ricordano. E il ricordo è più forte della paura.',
    category: 'history',
    assignableTo: ['quest'],
    tags: ['wraith', 'forge'],
    weight: 1,
  },
  {
    id: 'ld-spy-blade',
    title: 'La Lama della Spia',
    body: 'Non tutti gli spie portano pugnali. Alcuni portano silenzi così affilati da tagliare la verità a metà.',
    category: 'character',
    assignableTo: ['character'],
    tags: ['spy', 'night'],
    weight: 1,
  },
  {
    id: 'ld-stellar-blood',
    title: 'Sangue Stellare',
    body: 'Quando il sangue delle stelle tocca la terra, il terreno diventa memoria. Quando tocca un uomo, diventa legge.',
    category: 'item',
    assignableTo: ['item', 'quest'],
    tags: ['arcane', 'ritual'],
    weight: 1,
  },
  {
    id: 'ld-market-scales',
    title: 'Le Bilance del Mercato',
    body: 'Nel mercato del villaggio, le bilance non misurano il peso. Misurano quanto un uomo è disposto a dimenticare.',
    category: 'location',
    assignableTo: ['building', 'location'],
    tags: ['market', 'shop'],
    weight: 1,
  },
  {
    id: 'ld-obsidian-tyrant',
    title: 'L\'Anima dell\'Ossidiana',
    body: 'Il Tiranno Ossidiano non cerca la carne. Cerca lo specchio in cui il calore di un coraggio ancora si riflette.',
    category: 'faction',
    assignableTo: ['quest'],
    tags: ['combat', 'tyrant'],
    weight: 1,
  },
];
```

---

## Logica di assegnazione (unique)

```typescript
// src/engine/game/lore/LoreDropService.ts
function assignLoreDrop(
  entity: { id: string; type: LoreDropAssignableTo; tags?: string[] },
  pool: LoreDrop[],
  usedIds: Set<string>,
): LoreDrop | null {
  const candidates = pool.filter(d =>
    d.assignableTo.includes(entity.type) &&
    !usedIds.has(d.id) &&
    (!d.tags || d.tags.every(t => entity.tags?.includes(t))),
  );
  if (candidates.length === 0) return null;

  const weighted = candidates.flatMap(d => Array(d.weight ?? 1).fill(d));
  return weighted[Math.floor(Math.random() * weighted.length)];
}
```

Flusso:

1. All'avvio/partita, carica `LoreDropState` da `PersistenceService`.
2. Quando una quest/location/building/character/item viene generata o visitata per la prima volta, chiama `assignLoreDrop`.
3. Se trova un candidato, lo scrive in `state.assigned` e aggiorna `PersistenceService`.
4. Quando l'entità viene completata/visitata, `discovered = true` e `discoveredIds` viene aggiornato.

---

## Superfici di discovery (per il prototipo)

### 1. Quest (priorità alta)

File: `src/ui/idleVillage/components/QuestChronicle.tsx`

- Quando una quest passa alla fase finale o viene completata, `QuestChronicle` controlla `quest.loreDropId`.
- Se presente e non ancora scoperto, mostra il `LoreDrop` nella sidebar `Diario` al posto di `activeNarrative` (o come aggiunta).
- Esempio di rendering:

```typescript
const discoveredDrop = useLoreDropForQuest(quest.id);
// ...
<div>
  <strong>{discoveredDrop?.title}</strong>
  <p>{discoveredDrop?.body}</p>
</div>
```

### 2. Location (opzionale per il prototipo)

File: `src/ui/idleVillage/frozen/kits/locationDetailKit.tsx`

- Se `location.loreDropId` è presente, mostra un piccolo badge "Lore scoperta" e il testo in aggiunta a `flavorText`.

### 3. Toast di discovery

File: `src/ui/idleVillage/components/LoreDropToast.tsx` (nuovo placeholder)

- Quando un drop viene scoperto, appare un toast "Hai scoperto: [titolo]".
- Non serve un `LoreBook` completo per il prototipo.

---

## Persistenza

File: `src/store/loreDropStore.ts` (o riusare `src/store/loreStore.ts` se già creato)

- Usa `PersistenceService` (async `saveData`/`loadData`).
- Chiave: `loreDropState`.
- Salvataggio su ogni `assign` e `discover`.
- Non salvare in `localStorage` direttamente.

---

## Piano d'azione (ASAP)

### Fase 1 — Tipi e config (30 min)

1. Creare `src/balancing/config/lore/loreDropTypes.ts`.
2. Creare `src/balancing/config/lore/loreDropSamples.ts` con i 12 esempi sopra.

### Fase 2 — Service (30 min)

1. Creare `src/engine/game/lore/LoreDropService.ts` con `assignLoreDrop`, `discoverLoreDrop`, `getLoreDropById`.
2. Creare `src/store/loreDropStore.ts` con `PersistenceService`.
3. Aggiungere unit test `tests/unit/lore/LoreDropService.test.ts`:
   - unicità dell'assegnazione
   - nessun drop riassegnato
   - discovery aggiorna stato

### Fase 3 — Wire in Quest (30 min)

1. Estendere `src/balancing/config/idleVillage/defaultConfig.ts` (o `activity`) per accettare `loreDropId?: string`.
2. Modificare `QuestChronicle` per renderizzare il drop nella sidebar `Diario` quando presente.
3. Aggiungere hook `useLoreDropForQuest`.

### Fase 4 — Wire in Location/Building (opzionale, 30 min)

1. Estendere `locationDetailKit` per mostrare il drop se `location.loreDropId` esiste.
2. Estendere `BuildingDefinition`/`mapSlot` con `loreDropId?`.

### Fase 5 — Test in gioco (15 min)

1. Avviare il flusso Idle Village.
2. Completare una quest compatibile.
3. Verificare che la sidebar `Diario` mostri il Lore Drop.
4. Verificare che il toast appaia.
5. Verificare che allo stesso drop non venga assegnato a un'altra quest nella stessa run.

### Fase 6 — Safeguards (15 min)

1. `npm run lint`
2. `npm run test -- LoreDropService.test.ts`
3. `npm run build:check`
4. Creare evidence log in `test-results/wl-lore-drop-prototype-<date>.log`

---

## File coinvolti

| File | Azione |
| --- | --- |
| `src/balancing/config/lore/loreDropTypes.ts` | nuovo |
| `src/balancing/config/lore/loreDropSamples.ts` | nuovo |
| `src/engine/game/lore/LoreDropService.ts` | nuovo |
| `src/store/loreDropStore.ts` | nuovo |
| `src/ui/idleVillage/components/QuestChronicle.tsx` | modifica |
| `src/ui/idleVillage/frozen/kits/locationDetailKit.tsx` | modifica opzionale |
| `src/balancing/config/idleVillage/defaultConfig.ts` | modifica (aggiungere `loreDropId?`) |
| `src/balancing/config/idleVillage/buildings.ts` | modifica (aggiungere `loreDropId?`) |
| `tests/unit/lore/LoreDropService.test.ts` | nuovo |
| `test-results/wl-lore-drop-prototype-<date>.log` | nuovo |

---

## Note di design

- **Unicità**: lo stato `assigned` garantisce che un `loreDropId` non venga riassegnato. Se il pool si esaurisce, l'assegnazione restituisce `null`.
- **Reattività**: `QuestChronicle` deve leggere `loreDropStore` attraverso il hook per aggiornarsi quando un drop viene scoperto.
- **Config-first**: i testi non sono hardcodati nei componenti; sono in `loreDropSamples.ts`.
- **Art direction**: tutti i testi sopra rispettano il tono solar/triumph/no-grim del progetto.

---

## Prossimo passo

Se approvi il piano, posso iniziare con la **Fase 1** (tipi + pool) e portarti un primo commit funzionante entro breve.
