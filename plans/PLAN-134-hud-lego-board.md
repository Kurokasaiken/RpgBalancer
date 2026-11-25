# PLAN-134 — `/hud-lab` LEGO board: inventario pezzi, review states e ruling export

**Stato:** battezzato Director 2026-11-25 — spec r003 converged dal dibattito multi-AI web; implementazione macchina T-001…T-005 completata, gate Director OB-10 pendente.
**Battesimo:** artifact `artifact-r003.md` sha256 `3479ad7840b67ff822c9bd3bb1c257f5d965fc492c5a44bc197a2141ada1e191`, run `mind-weaver/.mw/runs/20261125-plan134-lego-board/` (`report.md`); r001/r002 preservati nella stessa run.
**Parent:** R-384; evoluzione operativa di R-383. Estende PLAN-129 (`/hud-lab` catalogo), PLAN-130 (`pieces.json` + anatomia pezzi), PLAN-131 (charter componenti). Vincoli processo: desiderata v35, v36, v31.
**Documentation impact:** REQUIRED — `RICHIESTE.md` R-384, `plans/INDEX.md`; nuovo doc operativo corto `context/hud-lego-board.md` solo se T-005 conferma che serve una procedura durabile separata dal plan.
**Visual-fork:** skipped — superficie dev-tool interna dentro `/hud-lab`, non grammatica visiva di produzione. Puntatore: PLAN-129 §6. I pezzi mostrati conservano i golden battezzati; questo plan non crea un nuovo linguaggio visivo.

---

## 1. Problema

Il Director vuole arrivare rapidamente a stash, roster e quest pronti senza rifare mockup da zero. Esistono già componenti e pezzi in `/hud-lab`, art pieces in `src/config/hud/pieces.json`, e component charters in `src/config/hud/charters.ts`, ma manca una superficie unica che risponda in modo operativo a:

1. quali pezzi LEGO esistono;
2. che tipo sono secondo la tassonomia già canonica;
3. come si chiamano in modo stabile, così il Director può dire «usa questo ID, non quell'altro»;
4. quali sono esplicitamente approvati o rifiutati dal Director, distinguendoli dallo stato derivato già presente in canon;
5. perché un pezzo è stato rifiutato, così non viene riproposto;
6. come trasformare la selezione del Director in un ruling applicabile senza che la board diventi una fonte di verità parallela;
7. quali pezzi già esistenti coprono i bisogni di stash, roster e quest, e quali delta mancano davvero.

## 2. Direzione r002

Evoluzione di `/hud-lab`, non nuova pagina.

**V1 è art-piece-first.** Gli art pieces governati da PLAN-130 sono gli unici oggetti ruling-eligible. I control pattern vengono auditati e mostrati solo come inventario informativo/non rulingable se utile, ma **non** ricevono in questa implementazione un nuovo registry canonico, schema, lifecycle o review. Motivo: il bisogno immediato è «usa questa cornice/placca/background, non quell'altro»; modellare tutta la governance dei pattern prima dell'audit creerebbe un secondo design system prematuro.

Le entry Lab piece-ish che non si riconciliano con `pieces.json` non spariscono e non diventano rulingable per accidente: vanno in lane esplicita **non riconciliati / unresolved**, con classificazione e senza controlli di ruling.

## 3. Decisioni vincolanti

### 3.1 Identità degli oggetti

Esistono tre identità distinte:

- `LabEntry.id` — identità della card/catalogo nel lab; mai target canonico di ruling;
- `pieces.json.id` — identità immutabile dell'art piece (`<slug>-vN`); unico target rulingable in v1;
- eventuali control pattern — solo classificati/auditati in v1, senza ID canonico nuovo.

Il join tra `LabEntry` e piece deve essere esplicito (`pieceId` o mapping equivalente), mai inferito dal titolo. Una card può mostrare un pezzo, ma non ne sostituisce l'identità.

### 3.2 Baseline derivata vs ruling esplicito

La board può derivare una baseline visuale dallo status canonico:

- `baptized` → baseline approved;
- `candidate` → baseline undecided;
- `retired` → baseline rejected/retired.

Questa baseline è solo display. Non è una decisione del Director e non deve essere esportata.

Modello logico minimo:

```ts
interface PieceReview {
  baseline: 'approved' | 'undecided' | 'rejected'; // derivata, mai persistita come ruling
  ruling?: {
    decision: 'approved' | 'rejected';
    previousStatus: 'candidate' | 'baptized' | 'retired';
    reason?: RejectReason;
    note?: string;
    constraint?: string; // es. uso contestuale, non ban di famiglia
    decidedAt: string;
    inventoryRev: string;
  };
}
```

`undecided` esiste come stato di review visuale/interazione, ma non è una decisione autorevole esportabile. Reset di una scelta torna alla baseline derivata.

### 3.3 Transizioni canoniche deterministiche

L'applicazione di un packet segue solo questa tabella:

| status canonico | decisione Director | conseguenza canonica |
|---|---|---|
| `candidate` | `approved` | `baptized` |
| `candidate` | `rejected` | `retired` per quell'ID immutabile; motivo/nota/constraint registrati come provenance |
| `baptized` | `approved` | nessun cambiamento; conferma registrata solo se utile come provenance |
| `baptized` | `rejected` | `retired` per quell'ID immutabile; il packet deve marcare `previousStatus:'baptized'` |
| `retired` | `rejected` | nessun cambiamento |
| `retired` | `approved` | vietato per quell'ID immutabile: stop e chiarimento Director; una variante futura richiede nuovo ID/versione |

Il reject vale per l'ID/versione specifico, non per la famiglia. Reject contestuali («non per pannelli», «non a scala piccola») sono constraint/note, non ban globale.

### 3.4 Motivi di reject

Riutilizzare/estendere il vocabolario PLAN-130:

- `scale-mismatch`
- `dialect-intent`
- `role-nuance`
- `quality-insufficient`
- `other`

Ogni decisione `rejected` richiede uno di questi motivi. `other` richiede anche nota non vuota. I label dei motivi passano da i18n, ma il valore canonico resta il codice.

### 3.5 Tassonomia

Niente seconda tassonomia parallela. La board raggruppa gli art pieces per `kind` PLAN-130:

- `ground`
- `frame`
- `button-plate`
- `band`
- `ornament`
- `icon-plate`

Le label visibili possono essere tradotte in italiano (`background`, `cornici`, `placche pulsante`, ecc.) via i18n, ma il valore tecnico resta il `kind`. Niente bucket `other` in v1.

### 3.6 Control pattern

In v1:

- T-001 elenca i control pattern osservati in stash/roster/cassetto/nav/top-chrome come gap/inventory informativo;
- la board può mostrare una lane read-only «control pattern osservati» se il costo è basso;
- niente registry canonico, niente ID `control-*`, niente review state, niente export ruling per control pattern;
- quando una superficie reale richiede di governare un pattern, aprire un plan successivo mirato.

### 3.7 Persistenza

V1 è **in-memory + export**. La selezione non sopravvive al reload; la UI deve mostrare un avviso inline persistente: «review non salvata, esporta prima di chiudere». Niente `localStorage` diretto e niente nuovo namespace `PersistenceService` in v1. Persistenza multi-sessione solo se l'uso reale dimostra perdita di lavoro.

### 3.8 Export machine-first

Il ruling packet canonico è JSON, versionato. Una resa Markdown leggibile può essere generata dallo stesso oggetto, ma non è una fonte indipendente.

Schema logico minimo:

```ts
interface RulingPacket {
  schemaVersion: 1;
  generatedAt: string;
  inventoryRev: string;
  decisions: Array<{
    entityType: 'piece';
    id: string;
    decision: 'approved' | 'rejected';
    previousStatus: 'candidate' | 'baptized' | 'retired';
    reason?: RejectReason;
    note?: string;
    constraint?: string;
    decidedAt: string;
  }>;
}
```

`inventoryRev` è SHA-256 di una serializzazione canonica deterministica e ordinata di:

- tutti gli art pieces rulingable: `id`, `kind`, `status`;
- tutti i mapping espliciti `LabEntry.id -> pieceId`;
- tutte le classificazioni unresolved.

Non dipende da viewport, ordine visuale, label o dati presentazionali.

### 3.9 Stale packet e applicazione

L'applicazione di un packet è preflighted:

1. valida schema;
2. ricalcola `inventoryRev`;
3. verifica ID e `previousStatus`;
4. verifica conflitti con canon;
5. applica tutto o si ferma; mai applicazione parziale silenziosa;
6. registra il packet applicato e la provenance nel trail documentale esistente;
7. ricalcola la baseline dal canon.

Se hash/status non corrispondono: stop e rebase/chiarimento esplicito. La board non scrive mai direttamente `pieces.json`, catalogo, charters o componenti produzione.

### 3.10 UX interna

- niente modali/popup/dialog; reject form, warning stale e export sono inline;
- tutte le stringhe user-facing passano da i18n;
- vista per categoria con card alla stessa scala/anteprima neutra, così pezzi dello stesso tipo sono confrontabili;
- lane unresolved separata, collassabile, senza controlli approve/reject;
- ID copiabile;
- distinzione chiara tra baseline derivata e scelta touched/esplicita.

### 3.11 Nessuna modifica a `/game`

Questo plan costruisce strumenti di vocabolario, non cambia HUD di produzione né i componenti battezzati.

## 4. Task

- **T-001 — Inventory audit + reconciliation + coverage matrix.** Produrre una tabella machine-usabile e leggibile:
  - tutti gli art pieces in `pieces.json` con id/kind/status/role/provenance;
  - tutte le entry piece-ish `LAB_CATALOG` classificate come `mapped-piece | token-material-reference | duplicate-deprecated | unresolved | control-pattern-observed`;
  - mapping esplicito `LabEntry.id -> pieceId` quando esiste;
  - control pattern osservati, solo come audit informativo;
  - duplicati, orfani, naming collision;
  - coverage matrix stash/roster/quest: ruolo/pezzo necessario, IDs riusabili esistenti, delta mancanti.
  Output preferibilmente generato o testato, non solo prosa che può marcire.

- **T-002 — Data model + inventoryRev + test permanente.** Implementare config/data read model:
  - mapping `pieceId` esplicito o bridging minimale;
  - eligibility rulingable/non-rulingable;
  - classificazione unresolved;
  - funzione pura deterministic `computeInventoryRev`;
  - tipo review separato baseline/ruling;
  - test su ID unici, reference valide, mapping completi, unresolved non rulingable, inventoryRev sensibile a status/mapping.

- **T-003 — LEGO board UI in `/hud-lab`.** Estendere la pagina:
  - gruppi per `kind` PLAN-130;
  - card confrontabili a scala comune e ground neutro;
  - ID copiabile, titolo, status canonico, provenance breve, preview live/asset;
  - lane unresolved collassabile;
  - lane informativa control pattern osservati solo se emerge da T-001 a costo basso;
  - filtri per kind e stato canonico/review;
  - i18n completo;
  - niente modali/dialog.

- **T-004 — Review mode + export in-memory.** Implementare:
  - controlli inline approve/reject/reset;
  - reject enum + nota/constraint;
  - distinzione touched vs baseline;
  - avviso persistente «non salvato»;
  - export inline JSON conforme schema v1 + copia clipboard se disponibile;
  - rendering Markdown/riepilogo leggibile generato dallo stesso oggetto;
  - blocco export se `rejected` senza motivo, se `other` senza nota, o se dati inventory non coerenti;
  - nessuna persistenza e nessun writeback canonico.

- **T-005 — Preflight validator puro + apply procedure + documentazione minima.** Implementare una funzione pura `preflightRulingPacket` (o equivalente) che valida schema, ricalcola `inventoryRev`, verifica ID/status/conflitti e produce esito `applicable | stale | conflict | invalid` senza mutare canon; documentare la procedura applicativa:
  - preflight packet tramite quella funzione;
  - stop su stale/conflitto/retirement ambiguo;
  - transizioni canoniche;
  - registrazione provenance;
  - divieto di applicazione parziale;
  - regola futura: ogni nuovo componente dichiara quali piece IDs riusa e quali delta mancano.
  Aggiornare R-384 e `plans/INDEX.md`. Creare `context/hud-lego-board.md` solo se la procedura non sta in modo leggibile nel plan/R-384; se creato, aggiornare `context/INDEX.md`.
  Witness headless `/hud-lab` @1440×900 con zero errori pagina.

## 5. Contratto di chiusura

| OB | Obbligazione | Tipo | Blocking |
|---|---|---|---|
| OB-1 | Audit completo: tutti gli art pieces e tutte le entry Lab piece-ish classificate; duplicati/gap; coverage matrix stash/roster/quest | `state` + `docs` | sì |
| OB-2 | Data model validato; ID unici; mapping risolvibili; unresolved non rulingable; `inventoryRev` deterministico | `state` — test unit | sì |
| OB-3 | `/hud-lab` mostra board filtrabile/raggruppata per kind, card confrontabili, ID copiabile, provenance, lane unresolved; stringhe i18n | `state` + probe DOM | sì |
| OB-4 | Baseline derivata mai esportata; solo ruling touched esportati; reject senza motivo o `other` senza nota bloccato; retired non rivivibile; packet schema v1 valido | `state` + test/probe | sì |
| OB-5 | Nessun writeback diretto: review/export non modificano `pieces.json`, catalogo, charter, produzione; niente localStorage/sessionStorage diretti | `state` + static/test | sì |
| OB-6 | Stale handling: cambiando inventory fixture/hash il preflight applicativo restituisce `stale`/`conflict` e richiede rebase esplicito; nessuna mutazione avviene | `state` + test | sì |
| OB-7 | Witness headless `/hud-lab` @1440×900: screenshot in `.mw/runs/<run>/` + zero pageerror; probe conferma assenza `role=dialog`/`<dialog>` | `command` headless | sì |
| OB-8 | Documentazione minima aggiornata: R-384, `plans/INDEX.md`, procedura apply; `context/hud-lego-board.md` + `context/INDEX.md` solo se il doc separato viene creato | `docs` | sì |
| OB-9 | Safeguard: `npm run lint -- <scope>`, `npm run test -- <scope>`, `npm run build:check`, `npm run closure:lint` verdi o fallimenti foreign documentati | `command` | sì |
| OB-10 | Occhio Director con task concreto: scegliere una cornice e una button-plate per stash usando solo la board | `human-eye` | sì |

## 6. Behavioral Verification

Test permanenti o probe minimi:

1. una voce `baptized` appare approved come baseline ma non è presente nel packet se untouched;
2. confermare esplicitamente una voce `baptized` può creare una decisione touched se il Director la tocca;
3. reject di una voce `baptized` esporta `previousStatus:'baptized'` e viene trattata come retirement in applicazione;
4. reject senza motivo blocca export inline; reject `other` senza nota blocca export inline;
5. reject di `frame-x-v1` non implica reject di `frame-x-v2`;
6. entry unresolved non mostrano controlli ruling e non compaiono nel packet;
7. export JSON valida contro schema; Markdown/riepilogo deriva dallo stesso oggetto;
8. modificare inventory/status dopo la decisione rende il packet `stale`/`conflict` in preflight;
9. ricaricare la pagina perde le selezioni e mostra l'avviso in-memory;
10. nessun file canonico cambia per sola interazione con la pagina.

## 7. Living contracts / classificazione

- `src/pages/hud-lab.tsx`, `src/pages/hud-lab/**`: Mode A salvo registrazione consapevole in surface-map se il wiring cresce.
- `src/config/hud/pieces.json`, `pieceSchema.ts`, `charters.ts`: consumo read-only in questo plan. Mutazioni solo come applicazione successiva di ruling packet, con test e provenance.
- Nessun nuovo registry canonico control pattern in v1.
- Non si toccano componenti produzione `src/ui/idleVillage/**` né `/game`.

## 8. Confini dichiarati

- Non è un redesign della HUD.
- Non è un design system completo né un nuovo linguaggio visivo.
- Non aggiunge mockup generativi.
- Non migra stash/roster/quest: produce inventario + coverage matrix che rendono quella migrazione più rapida.
- Non governa ancora i control pattern come oggetti canonici.
- Non introduce persistenza multi-sessione in v1.
- Non copre l'applicazione massiva dei primi ruling: avviene dopo il primo export reale del Director.

## 9. Decisioni aperte residue

- **D-open-1 — Lane control pattern osservati:** mostrarli read-only in v1 se cheap, oppure tenerli solo nel report T-001. Default proposto: mostrarli read-only solo se non aggiunge quasi lavoro.
- **D-open-2 — Procedura documentale:** doc corto separato `context/hud-lego-board.md` oppure procedura dentro R-384/plan. Default proposto: doc corto separato se supera ~40 righe.
- **D-open-3 — Export Markdown:** chiuso in r003 — includere solo un riepilogo testuale semplice generato dallo stesso oggetto; niente pipeline documentale separata.

## 10. Rischi e mitigazioni

| Rischio | Mitigazione |
|---|---|
| Board bella ma non operativa | ID stabili + unresolved lane + export schema v1 + Director eye task |
| Doppia verità tra lab e pieces.json | mapping esplicito + inventoryRev + unresolved non rulingable |
| Baseline scambiata per ruling | separazione baseline/ruling + export solo touched |
| Writeback ambiguo | nessun writeback diretto + preflight applicativo deterministico |
| Control pattern come scope creep | audit only/read-only in v1; nessun registry canonico |
| Persistenza come costo nascosto | in-memory + export in v1 |
| Tassonomia parallela | raggruppamento per `kind` PLAN-130, label solo i18n |

## 11. Implementation note (2026-11-25)

T-001…T-005 implementati in `/hud-lab`:

- audit generato in `.mw/runs/plan134-hud-lego-board/audit.json|md` con reconciliation esplicita Lab→piece, control pattern read-only e coverage matrix stash/roster/quest;
- read model in `src/pages/hud-lab/lego/inventory.ts` con classificazioni, eligibility e `computeInventoryRev` SHA-256 deterministico;
- board in `src/pages/hud-lab/lego/LegoBoard.tsx` montata in `src/pages/hud-lab.tsx`: gruppi per kind, filtri, card confrontabili, ID copiabile, lane unresolved/control pattern/coverage, review inline, export JSON+Markdown in-memory;
- packet v1 + preflight puro in `src/pages/hud-lab/lego/review.ts`; procedura applicativa in `context/hud-lego-board.md`;
- test permanenti `tests/unit/idleVillage/hudLegoBoard*.test.*` sui 10 comportamenti §6; witness headless `scripts/hud-lab-lego-witness.mjs`.

Divergenza/emergenza inventory: `time-disc-v1` non valida contro `pieceSchema` (sha/asset separati sun/moon senza `provenance.sha256`/`assets.master`). Non è stato mutato perché il plan consuma canon read-only: la board lo espone come difetto unresolved non rulingable e l'audit lo registra.

Verifica 2026-11-25: bundle `.mw/runs/plan134-hud-lego-board/bundle.json` prodotto con verdict `BLOCKED`. OB-1…OB-8 PASS; OB-9 raggiunge lint/test/build verdi e fallisce solo al `closure:lint` globale per contaminazione/drift fuori scope del worktree parallelo; OB-10 resta gate Director non assolto.

Adozione/ripresa 2026-11-25: i file dell'implementazione parallela nel worktree sono risultati byte-identici ai file PLAN-134 già in `HEAD`; lo stato `D + ??` era un artefatto dell'indice git ed è stato riparato senza riscrivere l'implementazione.

Decisione `time-disc-v1` (2026-11-25): dentro PLAN-134 non si estende `pieceSchema` al multi-asset e non si corregge/splitta il pezzo in `pieces.json`. PLAN-130 è battezzato con `assets.master` + `provenance.sha256`; sia una variante multi-asset sia uno split sole/luna sono mutazioni canoniche che richiedono ruling/plan dedicato. Conseguenza voluta: `time-disc-v1` resta un inventory defect unresolved/non-rulingable, visibile in board e audit, e la sua failure `pieces:check` è classificata foreign rispetto a PLAN-134.

Timeout flaky DOM test: il primo test renderizza l'intera board e nel cold run sotto carico poteva superare il default Vitest di 5s anche se a caldo dura ~0.9–1.6s. Il test di rendering ha ora timeout esplicito `15000`; non è un indebolimento di asserzioni funzionali, solo budget ambientale dichiarato per una superficie interna che monta tutte le card.

Confronto OB-1…OB-10 dopo adozione: OB-1…OB-8 PASS con evidenze aggiornate (`audit.json|md`, 25/25 test, witness headless); OB-9 PASS-per-contratto perché lint `--no-ignore`, test e `build:check` sono verdi mentre `closure:lint` resta rosso solo su drift/failure foreign documentati (`anti-glob piece-kit`, asset/script HUD-mappa non mappati, red-first `r374CassettoV2`, receipts slice-kit cassetto, schema `time-disc-v1`); OB-10 resta semanticamente pendente: richiede il Director-eye task «scegliere una cornice e una button-plate per stash usando solo la board». Il manifest della run è stato riallineato al contratto marcando OB-10 `blocking: true`.
