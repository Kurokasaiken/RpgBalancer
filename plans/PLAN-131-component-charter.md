# PLAN-131 — Scheda componente (charter): la forma scritta del battezzato

**Stato:** BATTEZZATO Director 2026-11-21 («battezzo») — rev **r004**
(final: micro-fix dai verdict round del dibattito
`20261121-plan131-charter`; 4/5 provider convergenti, residui assorbiti).
**Parent:** sessione Director 2026-11-21 («so cosa mi piace ma non lo fisso» —
direzione scelta dopo analisi di una critica esterna della HUD e delle 3 domande
di metodo: lingua, catalogo, processo); PLAN-129 (catalogo), PLAN-130 (kit pezzi),
PLAN-128 (adattamento/giudizio), v36 (contratti vivi), v35 (visual fork gate).

**Convergenza esterna (2026-11-21):** la sessione di analisi esterna ha
**ritirato** la proposta kit-first («non partire da un design system già
definito: costruirlo mentre scopri la direzione») e proposto un ciclo
Exploration→Convergence→Standardization→Production — coincidente col ciclo
già esistente (mockup/fork → Fase C+ruling → **questo plan** → PLAN-127/130).
Una seconda proposta esterna (GPT «HUD-LAB EVOLUTION», 5 fasi + lab a 4 aree)
è arrivata lo stesso giorno: ~70% ricopre artefatti già battezzati
(Gallery=PLAN-129, Material Library=pieces.json, Composition=`/hud-compose`,
ciclo=PLAN-127/128) — convergenza indipendente sulla direzione. Apporti
assorbiti dalle due fonti: (a) il charter registra **perché** un componente
piace (`appreciated`); (b) registra **cosa non è deciso** (`openExploration`
— idea GPT); (c) lane «esplorazione» nel lab → §8 (decisione disaccoppiata —
rilievo condiviso di 3 provider); (d) maturità estetica = derivata e
**calcolata dal gate**, non secondo enum.

**Documentation impact:** REQUIRED — nuovo doc `context/component-charter.md`,
voci `context/INDEX.md` + `plans/INDEX.md`, cross-ref nel profilo pipeline.

**Visual-fork:** skipped — il plan non crea né modifica resa visiva di
produzione: perimetro = config dati + test + display della scheda nel lab
(banco dev neutro, PLAN-129 D-1). Le decisioni estetiche restano su fork card
/ PLAN-128 Fase C e il charter le *registra*, non le prende (v35 cond. 1).

---

## 1. Problema

Le decisioni sui componenti battezzati vivono sparse: ruling nei commenti
(`HudRealCassetto.tsx` ne ha tre in un blocco), DECISION_LOG, fork card,
spec slice-kit, test. Quando il Director chiede «crea un nuovo componente»
o «rifinisci questo», l'agente ricostruisce la forma a memoria — e il
risultato deriva tra sessioni. Director 2026-11-21: **«so cosa mi piace ma
non lo fisso»**.

Cosa esiste già (non si duplica):

| Livello | Artefatto | Copre |
|---|---|---|
| Pezzo arte/geometria | `src/config/hud/pieces.json` + Zod (PLAN-130) | materiale, dialetto, scala, provenance del pezzo |
| Anatomia arte di superficie | `scripts/hud-real/specs/<X>.regions.json` (PLAN-130) | quali regioni, che ruolo, riuso/generazione |
| Catalogo | `LabEntry` in `src/pages/hud-lab/catalog.ts` (PLAN-129) | id, stato, famiglia, **provenance (autorità)** |
| Comportamento runtime | contratti INV (v36) + test | cosa il componente *fa* |
| Regole trasversali | `hud_component_guide.md` | come si costruisce *qualsiasi* componente HUD |

**Manca il livello componente**: la forma compilata di *questo* componente —
livello ornamentale, materiali per regione, stati e loro leggibilità,
pavimento tipografico, proporzioni/resize, regole di composizione, difetti
dichiarati, dimensioni non decise. La spec slice-kit copre la cornice; gli
INV coprono il runtime; nessuno dei due dice *com'è fatto e perché*.

## 2. Il charter

Record dati per componente (non per pezzo — quello è PLAN-130), validato Zod,
config-first in `src/config/hud/` (stessa casa di `pieces.json`: arte/UI
config, non balancing).

```ts
interface ComponentCharter {
  componentId: string;            // = LabEntry.id (join, mai duplicato)
  family: string;                 // tassonomia PLAN-113
  confidence: 'reconstructed' | 'director-verified';
                                  // charter compilati retroattivamente =
                                  // 'reconstructed'; 'director-verified' solo
                                  // dopo occhio Director (rischio r000: semi
                                  // ricostruiti a memoria scambiati per verità)
  verifiedBy?: string;            // OBBLIGATORIO se confidence='director-verified'
                                  // (ref ruling/sessione/audit che autorizza) —
                                  // il gate verifica presenza+formato, NON
                                  // l'autorità: una promozione valida è un diff
                                  // avviato dal Director (autopromozione agente
                                  // = violazione procedurale, stessa classe di
                                  // openExploration e di tutti i ruling)
  ornamentLevel?: 'I' | 'II' | 'III'; // I monumentale · II prezioso · III funzionale
                                  // assegnazione = giudizio estetico → SOLO via
                                  // ruling Director (v35). OBBLIGATORIO solo su
                                  // confidence='director-verified': sui seed
                                  // 'reconstructed' la proposta vive FUORI dal
                                  // charter (note di verifica del task) finché
                                  // il Director non conferma — un valore
                                  // proposto non confermato nel record sarebbe
                                  // la deriva stessa che questo plan cura
  materials: { material: MaterialTag; region: string; note?: string }[];
                                   // MaterialTag ⊆ enum pieces.json (vocab unico)
                                   // region ⊆ regioni/zona dell'anatomia +
                                   // sentinella 'global' (check meccanico su
                                   // ENTRAMBI i kind: niente doppia fonte né
                                   // free-text su zones/hybrid)
  anatomy?:                                  // OBBLIGATORIA su battezzato;
    | { kind: 'regions'; ref: string;         // → specs/<X>.regions.json (PLAN-130)
        hash: string;                         // sha256 letterale del file, incollato
                                             // a compile-time (il test in caso di
                                             // mismatch stampa il nuovo hash —
                                             // bump = una riga). COSA COMPRA:
                                             // «il file spec è cambiato ⇒ il
                                             // charter va riletto», identità del
                                             // file, NON fedeltà semantica —
                                             // stessa classe del limite PLAN-130.
                                             // Regola: un diff che bumpa hash
                                             // deve aggiornare i campi semantici
                                             // O registrare il perché del
                                             // non-impatto in modo DUREVOLE:
        note?: string }                       // qui, una riga («hash bump da
                                             // rename regione X, nessun campo
                                             // semantico toccato») — la nota
                                             // run-scoped non basta
    | { kind: 'zones'; zones: { name: string; medium: 'art' | 'dom' }[] };
                                  // assente su candidato = «spec non ancora
                                  // scritta» (mid-fork); presente ⇒ ref deve
                                  // esistere su disco, mai ref morti
  states: Partial<Record<CharterState, {
    changes: string;              // cosa cambia: token / filtro / asset / layout
    legibility?: string;          // criterio di leggibilità dichiarato
    ruling?: string;              // ruling che ha fissato lo stato
  }>>;                            // CharterState: default|hover|press|focus|
                                  // disabled|empty|full|error — chiavi fisse.
                                  // Principio (r003): si documentano gli stati
                                  // che APPLICANO a quel componente, mai
                                  // inventati per riempire la scheda
  appreciated: { trait: string; ruling?: string }[];  // PERCHÉ piace: il MOTIVO
                                  // del giudizio («rapporto nero/verde»,
                                  // «profondità dello smalto») — preferenza,
                                  // non vincolo: l'autorità vincolante vive nel
                                  // `ruling` citato, la voce conserva il perché
                                  // (semantica chiarita r003: la regola «non
                                  // toccare senza ruling» vale perché il ruling
                                  // la sorregge, non perché la voce è norma).
                                  // Su battezzato: ≥1 entry E almeno una con
                                  // `ruling` valorizzato — [{trait:"bello"}]
                                  // non passa il gate
  typeFloor: { role: 'title'|'subtitle'|'label'|'body'|'numeric';
               minPx?: number; ref?: string }[];  // Zod refine: minPx OR ref
                                  // obbligatori (mai entry {} vacua)
                                  // minPx alla viewport canonica 1440×900;
                                  // ref GRANULARE (marker/sezione, es. profilo
                                  // [P6] floor testo slice-kit — mai «il
                                  // documento» intero) — citato, non duplicato
  proportions: { basis: 'slice-kit' | 'dom' | 'hybrid'; unit: string;
                 resize: 'stretch' | 'tile' | 'fixed' | 'dom-flow'; note?: string };
  familyOrigin?: string;          // ref alla fork card / ruling che fonda la
                                  // famiglia — OBBLIGATORIO quando la famiglia
                                  // ha UN SOLO componente nel catalogo (regola
                                  // deterministica dal catalogo vivo). Check
                                  // formato: ref non-vuoto stesso pattern di
                                  // verifiedBy («n/a» non passa). PERSISTE
                                  // quando la famiglia cresce — è l'ancora
                                  // fondativa, non un requisito transitorio
  // composition: DROPPATO in r002 — nessun consumer, free-text che marcirebbe;
  // docking/insets vivono nel catalogo (mount) e nel codice del componente
  openIssues?: { summary: string; ref?: string }[];   // difetti/ruling pendenti
  openExploration?: { dimension: string; ref: string; note?: string }[];
                                  // dimensioni deliberatamente INDECISE dove
                                  // l'agente non deve scegliere da solo:
                                  // si propone, non si decide. `ref` OBBLIGATORIO
                                  // (chi l'ha aperta); chiusura di una voce solo
                                  // con citazione ruling nel diff che la toglie.
                                  // inversa di `appreciated`, distinta da
                                  // `openIssues` (difetto noto ≠ territorio
                                  // inesplorato)
}
```

**`provenance` non è un campo charter** (r001): il catalogo
(`LabEntry.provenance`) è l'autorità; i ruling interni vivono dentro i campi
(`states.*.ruling`, `appreciated.*.ruling`, `openExploration.*.ref`). Doppia
fonte vietata.

**`dialect` non è un campo charter** (r001): deriva da `regions.json`/pieces
per superfici incorniciate; su componenti DOM-only non si applica.

**Stage estetico calcolato dal gate** (r002 — predicato esplicito, chiude il
buco "vuoto = converso vs non documentato" e l'ambiguità r001): il test deriva una **partizione completa** a quattro stage (r004 — la triade
r003 lasciava scoperto un caso):
`open` = `openExploration` non vuoto;
**`converged`** = `openExploration` vuoto + `appreciated` ≥1;
**`documented`** = `openExploration` vuoto + `appreciated` = 0 + `openIssues`
non vuoto (un candidato con solo difetti noti);
`undocumented` = tutti e tre vuoti — irraggiungibile via gate (`battezzato` ⇒
`appreciated` ≥1; `candidato` ⇒ almeno uno dei tre non vuoto, §3.4).
Nomi scelti con cura (r003): misurano la *documentazione delle decisioni*,
NON la bontà estetica — un converged con 10 openIssues è legittimo, il nome
non promette "finito". Il test **pinna**
lo stage atteso per componente (mappa fixture: cassetto=`open`, …) —
snapshot aspirazionale a compile-time, asserito continuativamente dopo:
chiudere un nodo estetico = aggiornare charter E pin nello stesso diff
(il gate non può sapere se il `ref` di una voce punta a un ruling già
chiuso — ref = stringa, veridicità procedurale come tutti i ruling).
Lo stage calcolato è anche mostrato nella card lab (T-004) — il Director lo
vede senza greppare il test. Non è un campo del charter: niente derivazione a
memoria, niente secondo enum.

Regole di vocabolario (mutuata da PLAN-130): `materials` ⊆ enum
`pieces.json.materials`; un materiale mancante (es. **lacca-petrolio**, misurato
[P3] ma assente dall'enum) si aggiunge solo via ruling Director registrato come
amend PLAN-130 — il charter non edita `pieces.json`, lo consuma.

## 3. Procedura «crea un nuovo componente»

Documentata in `context/component-charter.md` (T-005):

1. **Bozza charter prima del codice** — famiglia, regioni attese, stati,
   livello ornamentale proposto; si compila dai charter dei componenti della
   stessa famiglia (≥2 esempi battezzati citati), non da zero. **Famiglia
   nuova (zero precedenti):** il brief = ≥2 esempi battezzati di famiglie
   qualsiasi + la fork card che stabilisce la prima forma della famiglia —
   il charter del primo componente nasce dalla fork card, non inventato.
2. Estetica → fork card (v35); porting da mockup → pipeline PLAN-127/128/130.
3. **Ogni ruling estetico distilla conoscenza** — a ogni ruling di fork card /
   verdetto di Fase C, l'agente registra ≥1 tratto `appreciated` (il *perché*).
   Il floor meccanico è `battezzato` ⇒ `appreciated` ≥1 (gate); la copertura
   per-ruling è **procedurale** (dovere dell'agente a tempo di ruling — non
   esiste una lista meccanica dei ruling estetici da cui verificare il
   conteggio; il tentativo che non produce un tratto registrato è conoscenza
   persa, e questo resta un limite dichiarato).
4. `status: battezzato` nel catalogo ⇒ **charter completo** (gate meccanico,
   OB-2). `candidato` ⇒ charter con almeno uno tra `appreciated`,
   `openIssues`, `openExploration` non vuoti — un candidato non può apparire
   completo per omissione; se dichiara solo un difetto, è "documentato", non
   silenziosamente maturo.

La scheda vuota + gli esempi compilati **sono** il brief di creazione.

Quando il Director chiede «migliora X», l'agente legge il charter prima di
toccare codice: `appreciated` = i motivi di ciò che piace (il vincolo è il
ruling citato — non si tocca la forma sorretta da un ruling senza nuovo
ruling),
`openIssues` = difetti noti (si può sistemare), `openExploration` = dimensioni
vietate alla decisione autonoma (si propone variante/fork, non si decide).
Una modifica che tocca una dimensione `openExploration` senza proposta =
violazione del charter — **enforcement procedurale** (stessa classe di v35:
gate di processo, non check meccanico su diff; dichiarato, non nascosto).

**Staleness (r002 — ibrido: meccanico dove possibile, procedurale il resto):**
(a) MECCANICO — `anatomy.hash` (sha256 del `regions.json` a compile-time): il
gate fallisce se il file cambia senza ri-compilare il charter — il drift
sulla spec anatomica è intercettato subito.
(b) PROCEDURALE — un diff che tocca lo scope di un componente battezzato deve
aggiornare il charter o dichiarare `charter: unchanged` **con il perché** (una
riga: «il diff non altera forma/stati/materiali descritti») nel verification —
una formula rituale senza motivazione non vale; il trigger per estendere la copertura meccanica
è NOMINATO, non vago: primo incidente di drift rilevato, o richiesta Director
→ allora si valuta hash/watch anche su scope-file. Come PLAN-130 certifica
identità/versione e non pixel, il gate certifica struttura + la spec
anatomica, non la fedeltà del codice componente.

## 4. Task

- **T-001 — Schema + modulo dati + gate.** `src/config/hud/charterSchema.ts`
  (Zod) + `charters.ts`; test permanente `tests/unit/**/componentCharters*`
  (`// INV:hud-charters`): ogni entry catalogo `kind:'component'` con
  `status ∈ {battezzato, candidato}` ha charter; ogni `componentId` risolve
  nel catalogo; `materials` ⊆ enum `pieces.json` (vocab unico — niente campo
  `dialect` nel charter); `materials.region` ∈ regioni/zona dell'anatomia ∪
  `{'global'}` per entrambi i kind; `anatomy` presente + kind='regions' ⇒
  `ref` esiste su disco E `hash` coincide col file (staleness meccanica);
  kind='zones' ⇒ validazione solo strutturale (zones[].name non vuote,
  medium ∈ {art,dom}) — niente ref/hash su zones; `anatomy` assente
  ⇒ status=candidato; chiavi `states` solo nell'enum + `default` presente su
  battezzato; `typeFloor` entries con minPx XOR ref; `battezzato` ⇒
  `appreciated` ≥1 con almeno una `ruling` valorizzata + `anatomy` presente;
  `confidence='director-verified'` ⇒ `verifiedBy` + `ornamentLevel`;
  `candidato` ⇒ almeno uno dei tre array non vuoto; `openExploration` con
  `ref`; `familyOrigin` su famiglia a componente singolo + ref non-vuoto;
  stage derivato **e pinnato** (mappa attesa nel test, cassetto=`open`) con
  messaggio di failure che nomina entrambe le cause possibili: «computed X,
  pinned Y — aggiorna il pin SOLO se un ruling ha chiuso il nodo, altrimenti
  correggi il charter».
- **T-002 — Charter pilota: cassetto** (`confidence: reconstructed` fino a
  OB-7). Compilazione completa, `anatomy.ref` → `specs/cassetto.regions.json`.
  `states.disabled` descrive la realtà: filtro smalto-only + motivo sr-only,
  `ruling` = commento codice «Director 2026-11-20». Il **drift vs
  REQ:v38-states («motivo»)** va in `openIssues` con ref — pending Director:
  amend desiderata o motivo visibile (r001: non codificare l'indeciso come
  deciso). `openIssues`: materiale pozzi (lacca-petrolio vs smalto profondo —
  in attesa di ruling/fork); leggibilità disabled; affordance
  `HudScrollBand`; `openExploration` per le dimensioni non risolte.
  `appreciated` compilato dai ruling R-353/PLAN-125 + esiti audit R-374
  (`.mw/runs/20261121-cassetto-aesthetic-audit/`).
  **Dipendenza ruling (r001):** `lacca-petrolio` nell'enum materiali di
  `pieces.json` = amend PLAN-130 via ruling Director — richiesta al battesimo
  di questo plan; se rinviata, il cassetto ship con `openIssues` dedicato e
  `materials` senza quella regione (entrambi i percorsi dichiarati, OB-3 non
  bloccato sul ruling).
- **T-003 — Seed charters** (`confidence: reconstructed`): nav, top-chrome,
  time, roster, stash, victory — la lista fissa dei `battezzato` component
  del seed catalogo. «Sottile» è definito: tutti i campi richiesti dello
  schema per quel `anatomy.kind` (anatomy, states che applicano, typeFloor,
  appreciated con ≥1 ruling) — non «parziale». `ornamentLevel` NON entra nei
  seed: le proposte vivono nelle note di verifica del task finché il Director
  non conferma (il campo esiste solo su `director-verified`). Promozione:
  meccanismo esplicito = un diff per componente che setta
  `confidence:'director-verified'` + `verifiedBy` (ref alla lettura/ruling)
  + `ornamentLevel` — OB-7 promuove solo il cassetto; i 6 seed restano
  `reconstructed` con flag visibile nel lab. **Trigger nominato** (r003 —
  non arredo permanente): ogni seed viene promosso alla prima occasione in
  cui il Director tocca/rivede quel componente per qualsiasi motivo — la
  lettura del charter fa parte del checkout visivo; `reconstructed` è uno
  stato informativo di «audit pendente», non un difetto del componente.
- **T-004 — Scheda nel lab.** La card PLAN-129 mostra sotto il mount una
  sezione **a forma fissa, sempre visibile** — niente accordion/disclosure/
  popup, nessuno stato nascosto: pagina più lunga accettata (il lab è un
  banco dev, non UI di gioco; GX-0042 è scoped alla UI di gioco e qui si
  sceglie la forma più forte: zero interazioni per leggere). Gerarchia
  informativa (r003 — prima ciò che guida le decisioni): riga verdetto
  (stage calcolato + `confidence`) → `appreciated` → `openIssues` →
  `openExploration` → campi tecnici (materiali/stati/typeFloor). Le tre
  domande che la card deve rispondere a colpo d'occhio: cosa non toccare,
  cosa si può correggere, cosa va chiesto al Director. Join `componentId`;
  condizionale OB-5 come da contratto (predicato fisso a closure).
- **T-005 — Procedura + indici.** `context/component-charter.md` (formato +
  procedura §3 + confini + regola staleness); voci `context/INDEX.md`,
  `plans/INDEX.md`; cross-ref in `context/mockup-pipeline-profile.md`;
  voce RICHIESTE.

## 5. Contratto di chiusura

| OB | Obbligazione | Tipo | Blocking |
|---|---|---|---|
| OB-1 | `charterSchema.ts` + `charters.ts` validati Zod; regole §2 | `state` — `npm run test -- tests/unit/**/componentCharters*` | sì |
| OB-2 | Gate `INV:hud-charters` verde — check enumerati: copertura live dal catalogo; join `componentId`; `materials` ⊆ enum pieces.json; `materials.region` ⊆ anatomia∪`{'global'}` (entrambi i kind); kind='regions' ⇒ `ref` esiste + `hash` match; kind='zones' ⇒ zone strutturali; chiavi `states` ⊆ enum + `default` su battezzato; `typeFloor` minPx XOR ref; `battezzato` ⇒ `anatomy` + `appreciated`≥1 con ruling; `director-verified` ⇒ `verifiedBy` + `ornamentLevel`; `candidato` ⇒ ≥1 dei tre array; `openExploration` con `ref`; `familyOrigin` su famiglia a componente singolo; stage derivato e pinnato | `state` — stesso test | sì |
| OB-3 | Charter cassetto compilato con openIssues/openExploration dichiarati e ruling registrati (incl. nota drift v38 come openIssue) | `state` + `docs` | sì |
| OB-4 | Charter presenti per la lista fissa delle entry `kind:'component'` battezzate: nav, top-chrome, time, roster, stash, victory | `state` | sì |
| OB-5 | (a) Join charter↔catalogo: asserito sempre. (b) Assert DOM sulla scheda in card: predicato FISSO valutato a chiusura — `test -f src/pages/hud-lab/index.tsx` (o file pagina effettivo se rinominato) decide se l'assert DOM si esegue; il predicato è nel contratto, non rinegoziato a runtime | `state` | sì |
| OB-6 | Safeguard: `lint -- scope`, `test -- scope`, `build:check`, `closure:lint` | `command` | sì |
| OB-7 | Occhio Director sulla scheda cassetto compilata — certifica che dice ciò che intende (T-04: il charter esiste per lui); promuove `confidence` a `director-verified` con `verifiedBy` + `ornamentLevel`. I 6 seed restano `reconstructed` — promozione separata per-lettura (T-003) | `human-eye` | sì |

**Regression test (R-247):** OB-2 — il gate fallirebbe senza i charter
(`battezzato` senza charter = rosso).

## 6. Confini dichiarati (cosa NON è questo plan)

- **Niente rifinitura**: i nodi aperti del cassetto (materiale pozzi,
  disabled, floor) entrano come `openIssues`/`openExploration` registrati —
  la decisione resta su fork card / PLAN-128 Fase C, non qui.
- **Niente recipe engine**: per superfici incorniciate la ricetta è già
  `regions.json` (PLAN-130); il charter la *cita* (`anatomy.ref`), non la
  riscrive; `materials.region` su anatomy='regions' deve stare *dentro* quel
  file, non accanto.
- **Non sostituisce** `hud_component_guide.md` (regole trasversali — tra
  l'altro ferma all'era Lacquer Atlas: il suo riallineamento al restyle
  smeraldo è task separato, fuori scope).
- **Non tocca** i trusted docs né il contratto runtime (v36): charter =
  *forma*, INV = *comportamento*. Confine dichiarato.
- Nessun dibattito multi-AI aggiuntivo sulla struttura: il dibattito
  `20261121-plan131-charter` È la critica di questo plan (r000→r001 dalla
  clarification); convenzione PLAN-081 soddisfata.
- **Due assi di maturità, non due enum** (idea GPT assorbita come regola
  derivata): lo `status` del catalogo è l'asse *governance/mount*; la maturità
  estetica è lo stage **calcolato dal gate** (open/converged/documented/
  undocumented, §2 — partizione completa).
  Un componente può essere `battezzato` in produzione E esteticamente aperto
  (il cassetto oggi): non serve un secondo enum, serve che il test lo calcoli.
- **Niente fase «audit» separata** (proposta GPT M1): la compilazione dei
  charter T-002/T-003 È l'audit — inventario di deciso/indeciso, dipendenze,
  difetti. Un audit documentale a monte duplicherebbe il lavoro.
- **Limite dichiarato (r002):** `changes`/`legibility` possono diventare
  stale rispetto al codice — mitigazione = `anatomy.hash` meccanico ora +
  regola procedurale §3 + trigger nominato (primo drift o richiesta
  Director). Copertura meccanica sullo scope-codice = futuro.
- **`charters.ts` modulo unico = scelta deliberata** (r002): precedente
  `pieces.json`, import unico per il gate; se il numero di charter cresce
  oltre la leggibilità si passa a per-file — la schema shape non cambia.

## 7. Living contracts / classificazione

- `src/config/hud/**`, `src/pages/hud-lab/**`, `context/**`, `plans/**`:
  non contrattati (`.mw/surface-map.json` non li copre) — Mode A libera.
- `scripts/hud-real/specs/*.regions.json`: consumo **read-only**
  (`anatomy.ref`, regions ⊆ check), nessuna mutazione.
- `src/config/hud/pieces.json`: consumo **read-only** dell'enum; estensione
  vocab = amend PLAN-130 via ruling, non edit in questo plan.
- Nessun file con blocchi `// INV:` esistenti viene toccato; il nuovo
  `INV:hud-charters` nasce nel test di questo plan.

## 8. Decisioni aperte (ruling Director)

- **D-open-1 — Lane «esplorazione» nel lab → DISACCOPPIATA (r001).** Due
  proposte esterne + tre provider del dibattito convergono: la domanda merita
  un ruling proprio, non il battesimo di questo plan (amendare PLAN-129 D-2
  accoppiando le decisioni = difetto condiviso). Questo plan **non** tocca
  `LabEntryStatus` né D-2: il lab resta canon-only; la questione
  `status:'esplorazione'` esce come fork card / ruling separato. Raccomandazione
  registrata, non vincolante: (b) con sezione separata esclusa dal gate.
- **D-open-2 — Livello «proven» tra battezzato e trusted/frozen?**
  Raccomandazione: **no** (YAGNI) — `battezzato su /game` copre già «usato in
  schermate reali + ruling»; trusted/frozen restano il livello contrattuale
  delle `*_trusted.md`; la maturità estetica è lo stage derivato. Rejected,
  non buco.
- **D-open-3 — Maturità dei pezzi vs componenti.** I livelli del catalogo e
  quelli dei pezzi PLAN-130 (`candidate`/`baptized`/`retired`) sono omologhi
  ma non identici: si lasciano separati (scope diverso) — solo nota.
- **D-open-4 — `lacca-petrolio` nell'enum `pieces.json` (r001):** ruling
  Director richiesto al battesimo; se rinviato, T-002 ship con `openIssues`
  dedicato (percorso dichiarato in §4).
