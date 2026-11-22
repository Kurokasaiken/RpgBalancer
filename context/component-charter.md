---
title: Component Charter
type: contract-doc
updated: 2026-11-21
---

# Component Charter — la forma scritta del battezzato

Record dati per componente (PLAN-131, battezzato Director 2026-11-21 rev
r004). Un charter dichiara **com'è fatto un componente e perché**: livello
ornamentale, materiali per regione, stati e loro leggibilità, pavimento
tipografico, proporzioni/resize, difetti dichiarati, dimensioni non
decise.

## Dove vive cosa (niente doppia fonte)

| Livello | Artefatto | Copre |
|---|---|---|
| Pezzo arte/geometria | `src/config/hud/pieces.json` + Zod (PLAN-130) | materiale, dialetto, scala, provenance del pezzo |
| Anatomia arte di superficie | `scripts/hud-real/specs/<X>.regions.json` | quali regioni, che ruolo, riuso/generazione |
| Catalogo | `LabEntry` in `src/pages/hud-lab/catalog.ts` (PLAN-129) | id, stato, famiglia, provenance (autorità) |
| **Componente — la forma** | `src/config/hud/charters.ts` + `charterSchema.ts` (**questo**) | ornamentLevel, materiali per regione, stati, typeFloor, proporzioni, appreciated, difetti, indecisi |
| Comportamento runtime | contratti INV (v36) + test | cosa il componente *fa* |
| Regole trasversali | `hud_component_guide.md` | come si costruisce *qualsiasi* componente HUD |

`provenance` NON è un campo charter (catalogo = autorità); `dialect` NON è
un campo charter (deriva da `regions.json`/pieces sulle superfici
incorniciate). I ruling interni vivono nei campi (`states.*.ruling`,
`appreciated.*.ruling`, `openExploration.*.ref`).

## Formato

Vedi `src/config/hud/charterSchema.ts` — ogni campo è commentato lì.
Punti fermi:

- `confidence: 'reconstructed'` finché il Director non rivede la scheda;
  `'director-verified'` solo dopo occhio Director → allora `verifiedBy`
  (ref al ruling/lettura) + `ornamentLevel` obbligatori. Su reconstructed
  `ornamentLevel` è **vietato** nel record: la proposta vive nelle note di
  verifica del task finché il Director non conferma — un valore proposto
  non confermato nel record è la deriva che il charter cura.
- `anatomy`: `regions` = spec PLAN-130 citata per `ref` + `hash` (sha256
  letterale del file); `zones` = mappa dichiarata zone art/dom quando la
  spec non è ancora scritta. Assente ⇒ catalogo `candidato`.
- `states`: chiavi fisse (`default|hover|press|focus|disabled|empty|full|
  error`); si documentano gli stati che **applicano**, mai inventati per
  riempire la scheda. `default` obbligatorio su battezzato.
- `appreciated`: PERCHÉ un tratto piace — preferenza, non vincolo:
  l'autorità vincolante vive nel `ruling` citato. Su battezzato ≥1 entry
  E almeno una con `ruling` valorizzato (`[{trait:"bello"}]` non passa).
- `typeFloor`: ogni entry ha `minPx` (alla viewport canonica 1440×900)
  o `ref` granulare (marker/sezione — mai «il documento» intero). Mai
  entry vacua.
- `openIssues`: difetti/ruling pendenti — si può correggere.
- `openExploration`: dimensioni deliberatamente INDECISE — `ref`
  obbligatorio (chi l'ha aperta); l'agente propone, non decide; chiusura
  solo citando il ruling nel diff che toglie la voce.
- `familyOrigin`: obbligatorio quando la famiglia ha UN SOLO componente
  nel catalogo (regola deterministica dal catalogo vivo); persiste quando
  la famiglia cresce — è l'ancora fondativa.

**Stage estetico = derivato dal gate** (`computeCharterStage`), mai campo
del charter: `open` (openExploration non vuoto) · `converged`
(appreciated ≥1, niente indecisi) · `documented` (solo difetti) ·
`undocumented` (irraggiungibile via gate). Misura la *documentazione
delle decisioni*, non la bontà estetica. Il test pinna lo stage atteso
per componente (`EXPECTED_STAGE`): chiudere un nodo estetico = aggiornare
charter E pin nello stesso diff. Lo stage appare anche nella card lab.

## Procedura «crea un nuovo componente»

1. **Bozza charter prima del codice** — famiglia, regioni attese, stati,
   livello ornamentale proposto; si compila dai charter dei componenti
   della stessa famiglia (≥2 esempi battezzati citati), non da zero.
   **Famiglia nuova (zero precedenti):** il brief = ≥2 esempi battezzati
   di famiglie qualsiasi + la fork card che stabilisce la prima forma —
   il charter del primo componente nasce dalla fork card, non inventato.
2. Estetica → fork card (v35); porting da mockup → pipeline PLAN-127/128/130.
3. **Ogni ruling estetico distilla conoscenza** — a ogni ruling di fork
   card / verdetto di Fase C, l'agente registra ≥1 tratto `appreciated`
   (il *perché*). Il floor meccanico è `battezzato` ⇒ `appreciated` ≥1
   (gate); la copertura per-ruling è **procedurale** — il tentativo che
   non produce un tratto registrato è conoscenza persa (limite dichiarato).
4. `status: battezzato` nel catalogo ⇒ **charter completo** (gate
   `INV:hud-charters`). `candidato` ⇒ charter con almeno uno tra
   `appreciated`, `openIssues`, `openExploration` non vuoti — un
   candidato non può apparire completo per omissione.

La scheda vuota + gli esempi compilati **sono** il brief di creazione.

## Procedura «migliora / rifinisci X»

L'agente legge il charter prima di toccare codice:

- `appreciated` = i motivi di ciò che piace — non si tocca la forma
  sorretta da un ruling senza nuovo ruling (il vincolo è il ruling, non
  la voce);
- `openIssues` = difetti noti — si può sistemare;
- `openExploration` = dimensioni vietate alla decisione autonoma — si
  propone variante/fork, non si decide;
- `rejected` = soluzioni provate e scartate dal Director (campo
  opzionale, Director-ratified 2026-11-21 post-advisory esterno) —
  conoscenza negativa: un agente che propone varianti **non la
  ripropone**; ogni voce cita il `ruling` che l'ha scartata (gate
  schema — mai orfana). Non è un archivio di mockup scartati: conserva
  la decisione e il perché, non gli asset (v35).

Una modifica che tocca una dimensione `openExploration` senza proposta =
violazione del charter — **enforcement procedurale** (stessa classe di
v35: gate di processo, dichiarato non nascosto).

## Staleness (ibrido r002)

- **MECCANICO** — `anatomy.hash` (sha256 del `regions.json` a
  compile-time): il gate fallisce se il file cambia senza ri-compilare il
  charter; il failure stampa il nuovo hash (bump = una riga). Un diff che
  bumpa DEVE aggiornare i campi semantici O registrare il perché del
  non-impatto in `anatomy.note` — durevole, non run-scoped.
- **PROCEDURALE** — un diff che tocca lo scope di un componente
  battezzato deve aggiornare il charter o dichiarare `charter: unchanged`
  **con il perché** (una riga) nel verification — una formula rituale
  senza motivazione non vale.
- Trigger per estendere la copertura meccanica = NOMINATO: primo
  incidente di drift rilevato, o richiesta Director → allora si valuta
  hash/watch anche su scope-file.
- **Re-verifica di `director-verified` a trigger, non a scadenza**
  (Director 2026-11-21, post-advisory esterno): il verdetto resta valido
  finché non cambia il contesto attorno — palette condivisa, nav,
  top-chrome, composizione schermata — o su richiesta esplicita; si
  rivaluta nella harmony review PLAN-128, niente decay temporale.

## Confini (cosa NON è il charter)

- Niente recipe engine: per superfici incorniciate la ricetta è
  `regions.json`; il charter la *cita* (`anatomy.ref`), non la riscrive.
- Non sostituisce `hud_component_guide.md` (regole trasversali).
- Non tocca i trusted docs né il contratto runtime (v36): charter =
  *forma*, INV = *comportamento*.
- Non replica `provenance`/`dialect`/id/famiglia — quelli vivono nel
  catalogo PLAN-129; il join è per `componentId`.
