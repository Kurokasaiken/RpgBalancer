---
type: visual-fork-card
status: draft
plan: PLAN-047-visual-fork-gate
desiderata: v35
---

# Visual Fork Card — <nome decisione estetica>

> Card di decisione visiva (v35 FROZEN). Una card per **decisione estetica** —
> non per componente. Vive in `.mw/runs/<run>/visual-fork[-<nome>].md`; a
> implementazione, provenance + hash baseline vengono promossi nel contract di
> ogni componente della scope list.
> Riferimento completo: `plans/PLAN-047-visual-fork-gate.md` §4.

## Scope

Componenti coperti da questa decisione (elenco per nome; un componente visivo
nel plan non coperto da alcuna card né da uno skip puntato è un difetto):

- `<ComponenteA>` — `<path/ruolo>`
- `<ComponenteB>` — `<path/ruolo>`

## Condizioni della decisione

Le condizioni a cui il Director ha valutato le opzioni — il ruling vale per
queste, non si estende ad altre senza dichiarazione:

- Viewport di ruling: `<es. 1280×800, registrata dalla Preview tab o riferita>`
- Stato: `<es. default / dato specifico>`
- Contenuto: `<es. testo localizzato lungo / stato interattivo / reduced-motion>`

## Opzioni

| id | nome | intento comunicativo | riferimento visivo | option_provenance | argomento più forte | costo del sceglierla |
|----|------|----------------------|--------------------|-------------------|--------------------|----------------------|
| A | `<nome>` | `<cosa comunica>` | `<path png / route lab>` | `<famiglia + perché materialmente distinta>` | `<argomento>` | `<costo>` |
| B | `<nome>` | `<cosa comunica>` | `<path png / route lab>` | `<famiglia + perché materialmente distinta>` | `<argomento>` | `<costo>` |
| C | `<nome>` (opz.) | | | | | |

- Nessun marker "recommended" di default (il Director può richiederlo).
- **Anti-domination**: la matrice deve avere ≥1 asse vinto da ogni opzione;
  se manca, il fork è degenere → riformulare le opzioni prima di sottoporle.

## Matrice comparativa (assi selezionati per questo fork)

Compilare solo gli assi rilevanti; assi DOM-dipendenti (overflow, testi
localizzati, stati interattivi, responsive, reduced-motion) ⇒ superficie di
preview minima #2.

| asse | A | B | C | DOM-dipendente? |
|------|---|---|---|------------------|
| gerarchia / densità | | | | |
| ancoraggio token skin | | | | |
| layout / overflow / i18n lungo | | | | sì |
| stati interattivi | | | | sì |
| responsive | | | | sì |
| costo implementativo (DOM, WebView budget) | | | | |
| reduced-motion / accessibilità | | | | sì |

## Superficie di preview

- Scelta: `#1 galleria PNG | #2 harness HTML/CSS | #3 route lab /lab/*`
- URL/path: `<localhost:…>` — aperta automaticamente nella scheda Preview di
  Devin Desktop (ruling Director 2026-10-18); screenshot di evidenza headless.
- Se #3: `spike: promote | remove` (default `remove`); residui da verificare a
  chiusura: `<route/import/asset/config>`. Baseline verificata sulla
  produzione, mai sullo spike.

## Ruling

- `selected: A | B | C | null`
- `ruling_id: <id>`
- Vincoli/emendamenti verbatim del Director:
  > `<verbatim>`
- `reject_all` → feedback e ritorno a explorer. Giro 2: opzione di sintesi
  dalle ragioni del rigetto + asse di variazione dichiarato: `<asse>`.
  Composito «A con X di B» → A' ri-sottoposta una sola volta; A' rigettata
  conta come voto reject_all. Bound: 2 reject_all → vincoli del Director.

## Baseline (congelata al ruling)

- `baseline_kind: png | screenshot | dom-region`
- `baseline_frozen_at: <ruling-id>`
- `sha256: <hash>`
- `path: <artefatto congelato>`
- Per `screenshot`: viewport canonica `<WxH>` + route/source state di supporto.
- Per `dom-region`: selettore + metodo di serializzazione canonica.

## Ledger

### amendments (approvati dal Director — spostano l'accettazione)

| data | verbatim | ruling_ref |
|------|----------|-----------|
| | | |

### incidental_deviations (dichiarate dall'agente a chiusura — disclosure)

| descrizione | asse matrice toccato? (se sì → era materiale, doveva essere STOP+ruling) |
|-------------|-------------------------------------------------------------------------|
| | |

## Contratto di confronto pre-registrato (→ verification.json, non editabile a chiusura)

| asse misurabile | regione/proprietà osservata | condizione (viewport/stato) | tolleranza | esito |
|------------------|-----------------------------|------------------------------|------------|-------|
| | | | | `PASS|FAIL|NOT_COMPARABLE` |

NOT_COMPARABLE ≠ PASS: si risolve col giudizio umano. L'obbligazione
`human-eye` riceve l'artefatto side-by-side baseline vs implementazione.
