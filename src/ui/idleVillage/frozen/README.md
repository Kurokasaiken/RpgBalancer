# Frozen Kits — componenti trapiantabili a una riga

Ogni componente certificato del TestHub ha un **kit** in `kits/` che è l'unica
porta d'ingresso per riusarlo altrove. Il kit ri-esporta il componente canonico
(mai una copia), quindi ogni modifica al componente base si propaga ovunque.

## Uso: una riga, provider inclusi

```tsx
// Variante drop-in: già avvolta nel suo shell smart, funziona in QUALSIASI pagina.
import { JobPOIStandalone } from '@/ui/idleVillage/frozen/kits/poiKit';
import { DestinyAstrolabeStandalone } from '@/ui/idleVillage/frozen/kits/destinyAstrolabeKit';

<JobPOIStandalone activityId="wood" label="Taglialegna" status="idle" ... />
```

Lo shell è **smart**: rileva i provider già montati sopra (skin, timing, drag,
dnd) e monta solo quelli mancanti. Dentro l'app reale riusa i provider di
pagina; in una pagina nuda se li porta dietro da solo.

## Composizioni più ricche: Shell + componenti

```tsx
import { SlotRackKitShell, ResidentSlotRackSkin, useSlotRackKitData } from '@/ui/idleVillage/frozen/kits/slotRackKit';

<SlotRackKitShell>
  {/* più kit possono convivere sotto lo stesso shell senza doppi provider */}
</SlotRackKitShell>
```

## Regole

1. **Mai deep-import** dei componenti canonici fuori da `src/ui/idleVillage/`:
   una regola ESLint (`no-restricted-imports`, per ora `warn`) rimanda al kit.
2. **Mai copiare file**: la propagazione automatica delle modifiche funziona
   solo finché la fonte è unica. Il contract sweep
   (`tests/contract/minimal-vs-test.spec.ts`) verifica i kit `certified`.
3. **Il registry è la fonte di verità** (`registry.ts`): status
   (`certified`/`draft`), metadati del TestHub (che è generato da qui),
   contratto. Un kit `draft` ha già l'ergonomia drop-in: quando il componente
   viene sistemato basta cambiare lo status, i call site non cambiano.

## Anatomia di un kit

- re-export del componente canonico + tipi;
- `<Nome>KitShell` — `createKitShell(chain)` con la catena provider dichiarata;
- `<Nome>Standalone` — `withKitShell(Componente, chain)`, il drop-in a una riga;
- `use<Nome>KitData()` — dati canonici deterministici per le pagine isolate;
- `.contract.ts` / `.cert.json` / `.fixture.ts` / `.md` per la certificazione.

Infra: `_infra/KitShell.tsx` (smart shell), test: `tests/unit/frozen/KitShell.test.tsx`.
