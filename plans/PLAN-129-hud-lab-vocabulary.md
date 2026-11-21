# PLAN-129 — `/hud-lab` rifatto: catalogo a card isolate dei componenti battezzati + pezzi riutilizzabili

**Stato:** **BATTEZZATO 2026-11-20** (ruling Director «si» in sessione; stamp `open` registrato `context/plan-timing.jsonl` 2026-11-20T21:50Z).
**Parent:** R-353/R-357 (restyling `/game`), PLAN-125 (restyling in corso), PLAN-127 (slice-kit), PLAN-113 (tassonomia famiglie, riusata come elenco, non come piano).
**Origine (Director, 2026-11-20, verbatim):** *«dobbiamo rifare il lab con i componenti nuovi e i pezzi dei nuovi componenti»* — poi, alla domanda «componenti sulla mappa o isolati»: *«isolati»*. Scope: *«solo quello che c'è di battezzato su game»*, *«tutto quello che m serve e servirà x il gioco»* (vocabolario = tutte le superfici, non solo HUD chrome).
**Cosa NON è:** non tocca `/game` di produzione, non modifica componenti battezzati, non è il registro documentale (il catalogo del lab È la lista viva; un doc testuale può derivarla dopo, non ora). Non ricostruisce `/hud-compose` (resta la superficie di composizione sulla mappa, invariata).

## 0. Ruling acquisiti in sessione

- **D-1 — Card isolate.** Ogni componente battezzato in una card isolata; i pezzi riutilizzabili in card proprie accanto. Niente composizione su mappa (quello è `/hud-compose`, invariato).
- **D-2 — Canon = solo battezzato su `/game`.** La superficie nuova è il riferimento; il lavoro pre-restyling (galleria mockup zanara v1/v2/v3, spikes) non conta come vocabolario → la vecchia `/hud-lab` viene riscritta, non estesa.
- **D-3 — Scope: tutte le superfici del gioco.** HUD chrome + pannelli + cerimonie + (in futuro) elementi Pixi: il catalogo cresce per famiglia (tassonomia PLAN-113 riusata).
- **D-4 — Villaggio `da-riallineare`.** Difetto dichiarato dal Director: le immagini ritagliate degli edifici non vanno. Direzione annotata (non eseguita in questo plan): edifici dipinti dentro l'opera, non incollati — coerente col learn `harmonize-object-in-scene` (2026-11-10) e «frame vuoto rigenerato > patching raster» (2026-11-16).

## 1. Obiettivo

`/hud-lab` diventa il **catalogo vivo del vocabolario battezzato**: una griglia di card isolate — una per componente battezzato, una per pezzo riutilizzabile — montate **live** (React + dati reali o fixture dichiarate), ognuna con nome, stato, provenance (ruling + ref + sha quando asset). Il lab è la risposta a «cosa uso quando compongo il prossimo componente» e «cosa devo riallineare».

## 2. Struttura

### Catalogo dati — `src/pages/hud-lab/catalog.ts`

Modulo dati (config-first: niente card hardcoded nel JSX):

```ts
interface LabEntry {
  id: string;                          // 'cassetto', 'frame-smeraldo', …
  kind: 'component' | 'piece';
  title: string;
  status: 'battezzato' | 'candidato' | 'da-riallineare' | 'deprecato';
  family: string;                      // 'chrome' | 'triade' | 'cerimonie' | 'villaggio' | …
  host: string;                        // chiave nel registro HOSTS
  provenance: { ruling: string; ref?: string; sha256?: string };
  notes?: string;                      // es. difetto villaggio, residuo noto
}
```

`status`: `battezzato` = ruling Director esiste (citato); `candidato` = montato su `/game`, ruling estetico pendente; `da-riallineare` = vivo su `/game` con look pre-battesimo (coda di backport); `deprecato` = pezzo superato tenuto a memoria.

### Pagina — rewrite di `src/pages/hud-lab.tsx`

- Due sezioni («Componenti», «Pezzi»), griglia di card isolate su stage dev neutro (sfondo scuro piatto — è un banco, non il gioco).
- Card: titolo + badge stato + area mount live + riga provenance (ruling, ref, sha troncato) + note.
- `HOSTS`: mappa `host → React.FC` che monta il componente/pezzo nella card. Host **lab-owned** in `src/pages/hud-lab/hosts/` — mai modifiche a componenti di produzione per servire il lab (se un prop/host manca: task dedicato con classificazione contratto, non in questo plan).
- Rimosso: galleria manifest zanara, `REACT_ITERATIONS`, `SLOT_LAYOUT`, import spikes. `src/pages/hud-lab/spikes/` eliminato (dead code, solo la vecchia pagina lo importa). Asset `public/mockups/hud-lab/` restano su disco (storico ruling PLAN-107; deploy-manifest li registra come asset — nessun riferimento UI).
- `SkinScope` sul root della card che monta componenti `data-hud-controls` (T-03).

### Seed catalogo (v1)

**Componenti** (`battezzato` salvo indicato): cassetto expedition (`edgeMode` extracted + framed), roster colonna (`HudRealRosterColumn`/`MatericRosterComponentV2`), stash (`VillageStashPanel`), victory/reward (pergamena A — host con fixture `run`/`scenario`; se la fixture non esiste ancora: card con nota «fixture mancante» + puntatore al gate `?victory=`, niente dati inventati), top chrome (`GameTopChrome` cap speculare), nav (`HudRealNav`), time/sole (`HudRealTimeConnected`), triade, pannelli flottanti battezzati.
**Pezzi**: cornice smeraldo (`frame-smeraldo` slice-kit + `PanelFrameOrnaments` variant), angoli mockup (`corner-mockup-*.webp`), banda di scorrimento oro inciso (`HudScrollBand`), piastrina hover (`cornice-hover-a.webp` + demo tile), CTA CONFIRM/×, tab/filtri stash (radiogroup), palette nav misurata (swatch), token `--skin-hud-*` rilevanti.
**`da-riallineare`**: famiglia villaggio (difetto: edifici ritagliati — D-4), POI, e le superfici `/game` ancora su look pre-battesimo, enumerate al seed.

## 3. Task

- **T-001 — Catalogo + registro host.** `catalog.ts` + `HOSTS` + types; seed entries (componenti + pezzi + riga villaggio `da-riallineare`). Host riusati dove esistono (`HudRealCassettoHost`, kit data roster); host lab-owned nuovi solo in `src/pages/hud-lab/hosts/`.
- **T-002 — Rewrite pagina.** Sezioni, card (titolo/stato/mount/provenance/note), stage neutro, `SkinScope` dove serve. Rimozione spikes + UI manifest vecchia.
- **T-003 — Host e pezzi.** Host mancanti dei componenti seed (victory con fixture o nota; stash/top chrome/nav/time con fixture reali dello store o `testResidents`); card pezzo per ogni atomo seed.
- **T-004 — Test permanente + witness + indici.** Test integrità catalogo (`// INV:hud-lab-catalog`: id unici, `battezzato` ⇒ provenance.ruling non vuoto, ogni `host` risolve in `HOSTS`, seed set presente); witness headless `/hud-lab` @1440×900 (console errori = 0); riga `plans/INDEX.md`; voce `context/INDEX.md`; voce RICHIESTE per la sessione.

## 4. Contratto di chiusura (obbligazioni verificabili)

| OB | Cosa | Tipo | Blocking |
|---|---|---|---|
| OB-1 | `catalog.ts` esiste; ogni entry ha id unico, kind, status, family, host risolvibile; `battezzato` ⇒ `provenance.ruling` valorizzato | `state` — `npm run test -- tests/unit/**/hudLabCatalog*` | sì |
| OB-2 | `/hud-lab` renderizza N card componente + M card pezzo **live** (assert DOM su sezione/numero card) | `state` — test jsdom su pagina o probe DOM | sì |
| OB-3 | Witness headless `/hud-lab` @1440×900: screenshot in `.mw/runs/<run>/` + zero pageerror | `command` headless | sì |
| OB-4 | Seed minimo presente: cassetto, roster, stash, victory (o nota fixture), top chrome, nav, time + pezzi cornice/banda/piastrina/CTA + riga villaggio `da-riallineare` | `state` — stesso test catalogo | sì |
| OB-5 | Safeguard: `lint -- scope`, `test -- scope`, `build:check`, `closure:lint` verdi | `command` | sì |
| OB-6 | Occhio Director sul catalogo montato (il lab è il suo banco — T-04) | `human-eye` | sì |

**Regression test (R-247):** OB-1/OB-4 = test permanente `tests/unit/**/hudLabCatalog*.test.ts` che fallirebbe senza il catalogo (INV-tagged).
**Eccezione dichiarata:** i contenuti delle card (aspetto dei componenti) non sono asseriti per pixel — sono componenti già testimoniati altrove; il lab asserisce che esistono e montano senza errori, la qualità visiva la certifica il Director su `/game`.

## 5. Living contracts / classificazione

- `src/pages/hud-lab.tsx` + `src/pages/hud-lab/**`: **non contrattati** (nessun INV, nessuna entry `.mw/surface-map.json`) — Mode A libera.
- Componenti montati: consumo read-only delle API pubbliche esistenti (host di hud-compose riusati o wrapper lab-owned). **Vietato** in questo plan toccare `src/ui/idleVillage/**` production per servire il lab — se serve un prop/host nuovo su file contrattato, esce dal plan come task separato (Mode B-add + redfirst).
- `src/deploy/labRoutes.ts`/`labRouteData.ts`: route invariata (`/hud-lab` già registrata — nessuna modifica necessaria).

## 6. visual-fork

`visual-fork: skipped — la rappresentazione è fissata dai ruling di sessione: "card isolate" (D-1) e "solo battezzato su /game" (D-2) decidono composizione e contenuto; il chrome della card è superficie dev-tool, fuori dalla grammatica visiva del gioco — puntatore: verbatim Director questa sessione + precedente lab tooling (cap-mirror-lab, cassetto-edge-lab) mai forkato.`

## 7. Trappole ereditate

- **T-03** — `SkinScope` sul root della card: i componenti con `data-hud-controls` (stash, roster) dentro una card fuori scope ereditano il default.
- **T-04** — «le card montano» si chiude col witness headless (OB-3), non col fatto che compila.
- **T-13** — worktree condiviso: nessun commit di file altrui; collisioni mtime → riprova, non fixare.
- **T-15** — script probe via tsx: `page.evaluate` su stringhe, non funzioni (o helper esistente).
- **T-14** — niente selettori/testid inventati: il test DOM usa `data-lab-card`/struttura del catalogo, non classi dei componenti montati.

## 8. Documentation Impact: REQUIRED

- `plans/INDEX.md` — riga PLAN-129.
- `context/INDEX.md` — voce lab-vocabolario.
- `RICHIESTE.md` — voce della richiesta di sessione («rifare il lab…») con puntatore a questo plan.
- Se il catalogo diventa poi anche doc testuale: `src/docs/docs/design/` come home (decisione rinviata — non in questo plan).

## 9. Fuori scope / aperto

- Rigenerazione `villaggio.png` con edifici dipinti (D-4: direzione annotata, decisione di look = prossimo giro mockup→ruling).
- Elementi Pixi (marker/halo) come card: il catalogo accetta `family: 'pixi'` ma il seed non include host Pixi (valutare se servono — aperto).
- Aggregazione meccanica da `REGISTERED.md`/`test-results/slicekit/*.json` (idea emersa in explorer): possibile evoluzione del catalogo, non prerequisito del lab.
- Doc vocabolario testuale separato (rinviato, §8).

## 10. Log implementazione — 2026-11-20 (sessione planner/executor)

**Fatto:**
- `src/pages/hud-lab.tsx` riscritto: griglia card isolate, 3 sezioni (Componenti / Pezzi / Da riallineare), chrome dev-stage neutro, badge status, provenance ruling+sha in footer. `transform: translateZ(0)` sul mount → figli `position:fixed` (stash, drawer) restano dentro la card.
- `catalog.ts` — 19 entry: 8 componenti battezzati + 2 candidati + 3 da-riallineare (villaggio col difetto edifici ritagliati annotato, POI, quest teatro) + 8 pezzi.
- `hosts.tsx` — 17 host lab-owned; `hostRegistry.ts` separato (fast-refresh rule). Victory = NoteHost dichiarato (serve QuestRunState reale — `/game?dev` fork esistente, fuori scope).
- Test INV `tests/unit/idleVillage/hudLabCatalog.test.ts` — 7 test: unicità id, risoluzione host, no orfani, provenance, host reale per componenti, seed OB-4, flag villaggio.

**Verdict OB:**
- OB-1/OB-4 ✅ test catalogo verde (7/7).
- OB-2/OB-3 ✅ witness headless `.mw/runs/2026-11-20-hudlab-plan129/` (19 card, 0 errori pagina; PNG top/mid/bottom; anche `test-results/hud-lab/`).
- OB-5 ⚠️ lint scope verde (4 warning no-restricted-imports — kit non riesportano quei componenti, stesso pattern di hud-compose); test verde; build:check PASS; **closure:lint ROSSO ma non sui file del plan** — fallisce su `quarantine/2026-11-20-merge-broken/**` (debris del merge 00cd031d2, superficie non mappata) + resource-gate lease dev-server scaduto di altra sessione. Da segnalare, non da toccare (T-13).
- OB-6 ⏳ occhio Director — il lab è pronto per il giro di revisione.

**Deviazioni dal plan:**
- `src/pages/hud-lab/spikes/` NON cancellati: consumati da `hud-compare.tsx` e `hud-roster-crop.tsx` (lab separati vivi) — cancellarli rompeva build:check. Restano legacy interno, non più serviti da `/hud-lab`.
- Fix pre-esistente fuori plan: `SlotV12Renderer.tsx` aveva `BezelPreset` dichiarato due volte (debris merge 00cd031d2) — bloccava il load di `/hud-lab`; rimossa la dichiarazione duplicata meno recente (superset conservato).
