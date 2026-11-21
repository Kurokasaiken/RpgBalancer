# PLAN-130 — Kit di pezzi approvati: compone prima, genera il delta

**Stato:** BATTEZZATO Director 2026-11-21 («perfetto, battezzo il plan»).
Dibattito multi-provider concluso (run MW `20261121-piece-kit-plan`,
**5/5 ACCEPT** su `artifact-r006.md`). Artefatto completo:
`mind-weaver/.mw/runs/20261121-piece-kit-plan/artifact-r006.md`
Report: `…/report.md` · Decision memo: `…/decision_memo.md`

**Documentation impact:** REQUIRED (OB-9: SLICEKIT Passo 6, pipeline, profilo)
**Visual fork:** nessun fork nuovo — usa golden/provenance dei pezzi esistenti;
il dialect enum (OB-10) richiede evidenza visiva al primo ruling.

---
Architettura r002–r005 invariata.

## 1. Problema

Ogni nuova superficie da mockup riparte da zero → divergenza di materiali,
lavoro duplicato, patch loop. Desiderata Director (R-370): a ogni mockup
**si compone prima dai pezzi battezzati, si genera standalone solo il delta**.

## 2. Il pezzo

Unità d'arte/geometria approvata (non componente DOM). Schema Zod discriminated
union in `src/config/hud/pieceSchema.ts`, dati `src/config/hud/pieces.json`
(fuori da `balancing/`, arte non config di gioco).

```ts
type PieceKind = "ground" | "ornament" | "button-plate" | "band" | "icon-plate" | "frame";
type FrameSource = "slice-kit" | "standalone";
type PieceStatus = "candidate" | "baptized" | "retired";   // canonical/superseded = derivati, mai scritti
type PieceScope = "hud" | "family";    // "surface" non esiste: un asset mono-superficie resta locale

piece = {
  id: "<slug>-v<N>",                 // revisione nell'id, record immutabile
  kind, source?: FrameSource, scope, status,
  role: string,                       // ruolo specifico (voce tabella ruolo→kind):
                                      // un ornament "skull" non matcha una regione
                                      // "laurel" — il match e' su role, non su kind
  dialect: "<enum>",                  // enum OB-10, asse separato da materials
  materials: MaterialTag[],           // >=1, vocabolario [P3]
  ornamentScale?: number,             // obbligatorio ornament|frame
  assets?: { master: path },          // tutti i kind con raster (incluso frame/standalone)
  specRef?: path,                     // solo frame/slice-kit
  family?: string,                    // obbligatorio se scope="family"
  supersedes?: "<slug>-v<M>",
  provenance: { golden: path, sha256, ruling, generator?, promptPath?, date,
                deltaE?, partialFields?: string[] }   // sha256 UNICO qui;
                // frame/slice-kit: sha256 = sha(specRef)+sha(golden), MAI del manifest
                // (il manifest si rigenera: sha stabile = niente -vN spurii)
}
```

- `candidate`: solo route `*-lab`/fork card. `baptized`: produzione, solo via
  ruling Director. `retired`: mai cancellato, bloccato.
- `superseded` derivato: il pezzo X è superseded se esiste `*-vM` baptized
  con `supersedes = X.id`. **Non** bloccato in produzione: è il golden
  congelato delle superfici che lo pinnano (nessuna auto-propagazione).
  Conta solo per `compatibleForNew` (§3): mai proposto a una NUOVA regione.
- `canonical` derivato = `baptized` + usedBy calcolato non vuoto.

## 3. regions.json — contratto completo

Per superficie `<X>` in porting: `scripts/hud-real/specs/<X>.regions.json`,
con header `{ surface: "<id>", family?: "<famiglia>" }`. La risoluzione dello
scope è dichiarata: `scope:"hud"` consente ogni superficie; `scope:"family"`
consente solo superfici con `family` === `piece.family` (la family della
superficie sta nel suo regions.json — fonte normativa, non dedotta).
"Superficie toccata" = esiste regions.json o diff su spec/componente mappata.

Ogni regione dichiara i **metadati di matching** (input di `compatible`):

```ts
type RegionBase = {
  region: string;
  expectedRole: string;              // voce della tabella ruolo→kind (appendice)
  expectedDialect?: string;          // assente = dialetto libero (v. regola sotto)
  expectedScale?: number;            // OBBLIGATORIO se expectedRole mappa a
                                     // ornament|frame (tabella); assenza = regione
                                     // non classificabile (rosso); ignorato altrove
};

type RegionClassification = RegionBase & (
  | { strategy: "reuse"; pieceId: "<slug>-vN>"; adoptViaRuling?: "R-NNN";
      frozenGolden?: "<path|ruling>" }   // OBBLIGATORIO se il pezzo è superseded:
                                          // dichiara il pin del golden congelato;
                                          // su superficie NUOVA (nessun regions.json
                                          // preesistente) reuse di superseded = rosso
  | { strategy: "slice-kit"; specRef: string; pieceRefs?: Record<role, "<slug>-vN>"> }
  | { strategy: "generate"; deltaReason: string;
      checkedPieces: [{ pieceId: "<slug>-vN>";
                        reason: { code: RejectCode, note?: string } }] }
  | { strategy: "dom-css" | "existing-component"; reason: string }
);

type RejectCode = "scale-mismatch" | "dialect-intent" | "role-nuance"
                | "quality-insufficient" | "other";   // "other" richiede note>=10 char;
                                                      // >2 "other" nella stessa regione = rosso
```

**Scope check in compatibleForNew:** `scope:"hud"` sempre ammesso;
`scope:"family"` ammesso solo se `piece.family === regions.family`.
(expectedDialect assente = qualunque dialetto matcha — ma se il kit contiene
>=2 dialetti per quel ruolo, `expectedDialect` è richiesto o `adoptViaRuling`
nella riga, così `checkedPieces` resta mirato e non boilerplate.)

**Due predicati distinti (fix B3):**
- `mountValid(piece)` = `status=baptized` (superseded incluso: i golden
  congelati restano montabili finché la superficie li pinna).
- `compatibleForNew(piece, region)` = `mountValid` + non superseded +
  `piece.role === region.expectedRole` (role, non kind) +
  kind ammesso da `expectedRole` (tabella) +
  (`expectedDialect` assente O `piece.dialect === expectedDialect` O
  `adoptViaRuling` registrato) +
  `|ornamentScale/expectedScale − 1| ≤ tolerance` +
  scope consente la superficie.

**Dialetto:** regione senza `expectedDialect` accetta pezzi di QUALUNQUE
dialetto (i due ori convivono: la scelta è registrazione/witness, non T2).
Il T2 `adoptViaRuling` serve solo quando `expectedDialect` è fissato e il
pezzo scelto è di dialetto diverso. `tolerance` = campo config nel registry,
default dichiarato `0.25` (rapporto `[0.8, 1.25]`), modificabile solo via
ruling; il check gira SEMPRE con un valore presente (fix B2).

**Tabella ruolo→kind (appendice normativa, estendibile solo via ruling):**
`ctaWindow→button-plate`; `sectionFrame|outerFrame→frame`;
`headerBand|titleBand|engravedBand→band`; `railOrnament|cornerOrnament|
laurel|gem|skull|supplyIcon→ornament`; `componentGround|panelGround→ground`;
`iconPlate|poiIcon→icon-plate`. Ruolo non in tabella → regione non
classificabile (rosso finché il ruling non la aggiunge).

`checkedPieces` deve contenere TUTTI i pezzi `compatibleForNew` calcolati
dal check (non una selezione), ciascuno col motivo dello scarto.

## 4. Montaggio — matrice kind×source completa

Via di montaggio e segnale per il check, per ogni combinazione:

| Tipo | Via di montaggio | Segnale usato dal check |
|---|---|---|
| frame/slice-kit | spec → slicer → manifest | `usedPieces[{id,rev,sha256}]` nel manifest |
| frame/standalone | barrel `pieceRef()` | named export `pieceRef("<id>-vN")` |
| ground/ornament/button-plate/band/icon-plate | barrel `pieceRef()` | named export `pieceRef("<id>-vN")` |

Barrel = `src/generated/hud/pieceMounts.ts`, generato dallo script che legge
registry+regions e risolve asset+rev+sha. Componenti: MAI import diretto di
asset di pezzo né path CSS a mano (OB-4 test negativo). `usedBy` calcolato
solo da barrel+manifest; `usedByDeclared` eliminato.

## 5. Gate — due check

`pieces:check` **globale** (in `closure:lint`): id inesistente; rev/sha
barrel/manifest ≠ registry; candidate|retired referenziato in barrel,
manifest o regions di superficie; materials/dialect fuori vocabolario;
supersedes rotto; doppione ruolo+dialect+scala senza supersedes né
non-fusione motivata; regions.json con regione della spec non elencata;
baptized senza consumatori = canonical-derivato falso, NON errore (atteso
dopo il battezzo). Per `frame/slice-kit` il confronto sha è sempre su
spec+golden (mai sul manifest rigenerabile): "manifest rigenerato, spec
invariata" = verde, test negativo dedicato.

`pieces:check --surface=<X>` **task-scoped** (flusso di porting, pattern
`slice:audit`): regions.json assente su superficie toccata; `generate` con
set `compatibleForNew` non vuoto e `checkedPieces` incompleto/vuoto;
`reuse`/`pieceRefs` senza riga corrispondente nel barrel/manifest; kind non
ammesso dalla tabella; `adoptViaRuling` con ruling inesistente; `piece.role`
≠ `expectedRole`; strategy `reuse` su pezzo che non è `mountValid`;
`reuse` su pezzo superseded **senza `frozenGolden`** = rosso; `reuse` su
superseded in superficie NUOVA (nessun `<X>.regions.json` nel commit
precedente — controllo git/filesystem, non giudizio) = rosso.

## 6. Pilota (rifacimento cassetto in produzione, R-370)

Ordine: 1) schema+registry+barrel vuoti; 2) check globale minimo; 3)
`cassetto.regions.json` + check scoped; 4) montaggi reali nella superficie
`/game` del cassetto.

- I 4 frame-spec slice-kit → `frame/slice-kit` `baptized` (record slicekit =
  battezzo), `provenance.partialFields=["generator","promptPath"]`,
  sha256 = sha(specRef)+sha(golden) — mai del manifest (rigenerabile).
- Le 3 generazioni cassetto (pulsante, ground, cornice sezione) → in
  lab/fork al Director; battezzate → `button-plate`, `ground`,
  `frame/standalone` e **montate nella superficie cassetto di produzione**;
  non battezzate → candidate/retired con motivo.
- Backfill: ≥1 asset hud-real con golden+sha256+ruling; parziale solo su
  generator/promptPath/deltaE.
- Compose-first: `cassetto.regions.json` ≥1 `reuse` su pezzo preesistente.
  Se la ricerca onesta non trova candidato: PASS-WITH-NOTE + ack Director +
  backlog item — non prova della politica.

## 7. Contratto di chiusura

| ID | Obbligazione | Tipo |
|---|---|---|
| OB-1 | `pieces.json` + Zod union (`*-vN`, dialect enum, supersedes, scope hud\|family, RegionBase metadata) | state+test |
| OB-2 | `pieces:check` globale: TUTTE le condizioni §5 con **test negativo per ciascuna**; in closure:lint | state+test |
| OB-3 | `pieces:check --surface`: TUTTE le condizioni §5 con **test negativo per ciascuna** — incluso `generate` con checkedPieces vuoto e candidato esistente, e `reuse` su superseded consentito | state+test |
| OB-4 | Barrel `pieceMounts.ts` + `pieceRef()` unica via di montaggio per ogni kind×source non-spec; **test negativo** (import asset diretto / CSS path a mano = rosso) | state+test |
| OB-5 | `cassetto.regions.json` validato + ≥1 `reuse` risolto; escape solo con `checkedPieces` popolato + ack Director + backlog | state+docs+human-eye |
| OB-6 | `pieceRefs` in spec → slicer → manifest `usedPieces` con rev+sha; test su rev retired | state+test |
| OB-7 | ≥4 frame-spec registrati + ≥1 backfill con golden+sha+ruling | state |
| OB-8 | Cassetto montato su `/game` + side-by-side golden/render + witness T-04 Director su OGNI pezzo montato (non a campione) | human-eye |
| OB-9 | SLICEKIT Passo 6 + pipeline + profilo + tabella ruolo→kind (appendice normativa nel piano) | docs |
| OB-10 | Enum `dialect` approvato Director con mappa tag↔dialetto + evidenza visiva; primo ruling congela anche `tolerance` (default 0.25 dichiarato intanto); test: dialect fuori enum = rosso | docs+test |
| OB-11 | Chiusura pilota: ≥1 reuse verificato O nota di fallimento con causa + backlog item | state+docs |

## 8. Limiti dichiarati

Il gate certifica identità/versione/dichiarazione/montaggio-via-barrel —
NON somiglianza visiva né armonia (Fase C, witness Director, T-30).
Il barrel prova la citazione risolta, non il pixel finale: il side-by-side
di OB-8 resta l'unico controllo visivo, eseguito su ogni pezzo montato.
