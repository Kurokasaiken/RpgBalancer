---
summary: Guida per aggiungere nuove superfici al workspace Wanderlust Triumph
---

# Importare nuove superfici nel workspace minimale

Questa guida spiega come estendere il workspace `wanderlust triumph/` aggiungendo
nuove pagine leggere (es. StyleLab demo, altre viste Idle Village) mantenendo il
setup snello.

## 1. Valutare la superficie

1. Verificare che la pagina dipenda solo da moduli leggeri (Idle Village, Style
   Lab, shared). Se richiede balancer/moodboard/analytics pesanti, considerare una
   variante "thin" o lazy import.
2. Assicurarsi che eventuali config esistano in `src/balancing/config/**`.

## 2. Creare la route minimale

1. Aprire `wanderlust triumph/src/AppMinimal.tsx`.
2. Aggiungere un nuovo `MinimalRoute` (es. `'style-lab-demo'`).
3. Mappare la route nel `routeMap` con un `ErrorBoundary` e il componente
   desiderato.
4. Aggiungere il bottone al nav (`NavLink`) con etichetta chiara.

## 3. Garantire l'import tree-shakable

1. Importare il componente dal path `@/...` (symlink root).
2. Se richiede dependencies non già presenti, verificare che siano condivise con
   MinimalGameplay/TestRoster. Se no, valutare stub/flag via `vite.config.ts`.

## 4. Aggiornare Vite (se servono alias/flag)

1. In `wanderlust triumph/vite.config.ts`, aggiungere alias o define
   supplementari per nuove dipendenze.
2. Se la route richiede asset da escludere dal watch, aggiornare
   `server.watch.ignored`.

## 5. Test

1. Eseguire `npm run dev` e verificare la nuova route.
2. Aggiornare `README.md` con la lista delle superfici disponibili.
3. Se la superficie ha test dedicati, aggiungerli sotto `tests/unit/idleVillage`
   o `tests/integration/idleVillage` e verificare con `npm run test`.

## 6. Documentare

1. Annotare nel README eventuali flag/config richiesti.
2. Facoltativo: aggiungere screenshot/micro guida in `docs/` (non linkata ma
   utile per ricordare setup).
