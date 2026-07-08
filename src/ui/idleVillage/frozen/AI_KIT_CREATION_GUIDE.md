# AI Kit Creation Guide
**Guida per creare nuovi Frozen Kits - Per Agenti AI**

## Cos'è un Frozen Kit?

Un **Frozen Kit** è un wrapper certificato che rende un componente "trapiantabile" in una sola riga. Il kit:
- Ri-esporta il componente canonico (mai una copia)
- Fornisce uno shell smart che monta automaticamente i provider necessari
- Permette di usare il componente ovunque senza preoccuparsi dei provider
- È l'unica porta d'ingresso autorizzata per riutilizzare componenti

## Anatomia di un Kit

Esempio completo da `poiKit.tsx`:

```tsx
/**
 * nomeKit
 *
 * Descrizione breve di cosa fa il kit.
 *
 * One-line transplant anywhere in the app:
 *
 *   import { ComponenteStandalone } from '@/ui/idleVillage/frozen/kits/nomeKit';
 */

import type { ComponentProps } from 'react';
import { ComponenteCanonica } from '@/ui/idleVillage/components/minimal/ComponenteCanonica';
import { createKitShell, withKitShell, type KitProviderName } from '../_infra/KitShell';

// 1. Re-export del componente canonico + tipi
export { ComponenteCanonica } from '@/ui/idleVillage/components/minimal/ComponenteCanonica';
export type { ComponenteProps } from '@/ui/idleVillage/components/minimal/ComponenteCanonica';

// 2. Definizione della catena di provider
export const NOME_PROVIDER_CHAIN: KitProviderName[] = [
  'SkinSystemProvider',
  'SandboxTimingProvider',
  // Aggiungi altri provider necessari
];

// 3. Smart shell (per composizioni più complesse)
export const NomeKitShell = createKitShell(NOME_PROVIDER_CHAIN, 'NomeKitShell');

// 4. Variante drop-in (per uso a una riga)
export const ComponenteStandalone = withKitShell<ComponentProps<typeof ComponenteCanonica>>(
  ComponenteCanonica,
  NOME_PROVIDER_CHAIN,
  'ComponenteStandalone'
);
```

## Passo per Passo: Creare un Nuovo Kit

### Step 1: Identifica il Componente Canonico

Trova il componente nella struttura `src/ui/idleVillage/components/minimal/`:
```
src/ui/idleVillage/components/minimal/NuovoComponente.tsx
```

### Step 2: Crea il File Kit

Crea `src/ui/idleVillage/frozen/kits/nuovoKit.tsx`:

```tsx
/**
 * nuovoKit
 *
 * Frozen re-export of NuovoComponente with smart provider chain.
 *
 * One-line transplant:
 *   import { NuovoComponenteStandalone } from '@/ui/idleVillage/frozen/kits/nuovoKit';
 */

import type { ComponentProps } from 'react';
import { NuovoComponente } from '@/ui/idleVillage/components/minimal/NuovoComponente';
import { createKitShell, withKitShell, type KitProviderName } from '../_infra/KitShell';

// Re-export
export { NuovoComponente } from '@/ui/idleVillage/components/minimal/NuovoComponente';
export type { NuovoComponenteProps } from '@/ui/idleVillage/components/minimal/NuovoComponente';

// Provider chain
export const NUOVO_PROVIDER_CHAIN: KitProviderName[] = [
  'SkinSystemProvider',
  'SandboxTimingProvider',
];

// Smart shell
export const NuovoKitShell = createKitShell(NUOVO_PROVIDER_CHAIN, 'NuovoKitShell');

// Standalone variant
export const NuovoComponenteStandalone = withKitShell<ComponentProps<typeof NuovoComponente>>(
  NuovoComponente,
  NUOVO_PROVIDER_CHAIN,
  'NuovoComponenteStandalone'
);
```

### Step 3: Determina i Provider Necessari

Controlla di cosa ha bisogno il componente:

| Provider | Quando serve |
|----------|--------------|
| `SkinSystemProvider` | Se usa skin/themes |
| `SandboxTimingProvider` | Se usa timing/simulazione |
| `DndContext` | Se è droppabile/draggable |
| `DragProvider` | Se usa drag & drop custom |
| `TooltipProvider` | Se usa tooltip |

**FULL_PROVIDER_CHAIN** (tutti i provider):
```tsx
import { FULL_PROVIDER_CHAIN } from '../_infra/KitShell';
export const NUOVO_PROVIDER_CHAIN = FULL_PROVIDER_CHAIN;
```

### Step 4: Aggiungi al Barrel Export

Aggiorna `src/ui/idleVillage/frozen/kits/index.ts`:

```tsx
// Nuovo Kit
export {
  NuovoComponente,
  NuovoComponenteStandalone,
  NuovoKitShell,
  NUOVO_PROVIDER_CHAIN,
} from './nuovoKit';
export type { NuovoComponenteProps } from './nuovoKit';
```

### Step 5: Aggiorna il Registry

Aggiorna `src/ui/idleVillage/frozen/registry.ts`:

```tsx
{
  kitId: 'nuovo-kit',
  kitModule: '@/ui/idleVillage/frozen/kits/nuovoKit',
  status: 'draft', // o 'certified' se completo
  hub: {
    id: 'nuovo-component',
    title: 'Nuovo Componente',
    description: 'Descrizione breve',
    path: '/minimal-nuovo',
    icon: '🆕',
    status: 'needs-refactor', // o 'ok'
  },
  contract: {
    version: '1.0.0',
    lastCertified: null, // o data se certificato
  },
}
```

### Step 6: Crea Pagina di Test (Opzionale)

Crea `src/pages/minimal-nuovo.tsx`:

```tsx
import { NuovoComponenteStandalone } from '@/ui/idleVillage/frozen/kits/nuovoKit';

export default function MinimalNuovoPage() {
  return (
    <div className="min-h-screen bg-slate-950 p-8 text-ivory">
      <NuovoComponenteStandalone prop1="value1" prop2="value2" />
    </div>
  );
}
```

## Pattern Comuni

### Pattern 1: Componente Semplice (Solo Visual)

```tsx
export const SIMPLE_PROVIDER_CHAIN: KitProviderName[] = [
  'SkinSystemProvider',
];

export const SimpleComponentStandalone = withKitShell(
  SimpleComponent,
  SIMPLE_PROVIDER_CHAIN,
  'SimpleComponentStandalone'
);
```

### Pattern 2: Componente con Drag & Drop

```tsx
export const DRAGGABLE_PROVIDER_CHAIN: KitProviderName[] = [
  'SkinSystemProvider',
  'SandboxTimingProvider',
  'DndContext',
  'DragProvider',
];

export const DraggableComponentStandalone = withKitShell(
  DraggableComponent,
  DRAGGABLE_PROVIDER_CHAIN,
  'DraggableComponentStandalone'
);
```

### Pattern 3: Componente Multi-Part (Shell + Componenti)

```tsx
export const COMPLEX_PROVIDER_CHAIN: KitProviderName[] = [
  'SkinSystemProvider',
  'SandboxTimingProvider',
  'DndContext',
];

export const ComplexKitShell = createKitShell(COMPLEX_PROVIDER_CHAIN, 'ComplexKitShell');

// Re-export di più componenti
export { PartA, PartB, PartC } from '@/ui/idleVillage/components/minimal/ComplexComponent';
```

## Regole d'Oro

1. **MAI copiare il codice** - sempre re-export
2. **MAI deep-import** - usa sempre il kit
3. **Il registry è la fonte di verità** - aggiorna sempre registry.ts
4. **Status corretto** - `draft` per in sviluppo, `certified` per completo
5. **Nomi consistenti** - `NomeKit`, `NOME_PROVIDER_CHAIN`, `NomeStandalone`

## Checklist per AI

Prima di completare un kit:

- [ ] Il file kit esiste in `frozen/kits/`
- [ ] Re-export del componente canonico presente
- [ ] Re-export dei tipi presente
- [ ] Provider chain definita correttamente
- [ ] KitShell creato (se necessario)
- [ ] Standalone variant creato
- [ ] Barrel export aggiornato (`index.ts`)
- [ ] Registry aggiornato (`registry.ts`)
- [ ] Pagina di test creata (se necessario)
- [ ] Documentazione aggiornata (se necessario)

## Esempi di Riferimento

- `poiKit.tsx` - Componenti multipli con skin
- `clockKit.tsx` - Componente semplice con timing
- `rosterKit.tsx` - Componente complesso con drag & drop
- `slotRackKit.tsx` - Composizione multi-part

## Troubleshooting

**Errore: "Il modulo non contiene un membro esportato"**
- Verifica che il re-export sia corretto nel kit
- Verifica che il componente canonico esporti davvero l'elemento

**Errore: "Provider mancante"**
- Aggiungi il provider mancante alla chain
- Verifica che il nome del provider sia corretto

**Errore: "Type mismatch"**
- Verifica che i tipi siano re-exportati correttamente
- Usa `export type { ... }` per i tipi

---

Questa guida è pensata specificamente per agenti AI che devono creare nuovi kit seguendo il pattern stabilito nel progetto.
