# UI Catalog — resoconto per handoff (2026-10-26)

## Obiettivo (R-282, PLAN-086)

Catalogo wiki di **tutto ciò che il giocatore vede su `/game`**: ogni
componente documentato con stati/screenshot, sottoposto a critica AI web
(prompt verbatim del Director), mockup di upgrade filtrati dalle AI,
ruling Director, implementazione con prima/dopo. Ciclo componente-per-
componente, pipeline a 3 stadi.

## Stato attuale (numeri)

- **39 componenti censiti** su `/game` (INDEX.md)
- **34 documentati** (page.md + shots V1 ctx/iso + meta.json); 5 di
  questi `documenting`+partial onesti (stati irraggiungibili, non
  fabbricati)
- **~27 con critiche AI** raccolte + digest (deepseek quasi tutte,
  claude 21/21 dopo refill quota, chatgpt solo 1 — quota free)
- **3 in_review** con mockup + ranking AI + review page per il Director:
  `hud-top-tabs`, `nav-bar`, `hud-corner`
- **5 unassigned**: i componenti quest (bug TDZ sotto)

## Dove sta tutto

```
.mw/ui-catalog/
├── manifest.json        # fonte di verità: 39 entry, status machine,
│                        #   states/driver/assertion, versions/shots/meta
├── INDEX.md             # censimento tabellare
├── ART-DIRECTION.md     # rubrica rev3: livelli, ruling Director, regola
│                        #   prompt verbatim, asse "materia in cornice,
│                        #   chiarezza nel dato"
├── critique-prompt.txt  # prompt verbatim Director (MAI modificare)
├── critiques-external-*.md  # critiche trasportate (Gemini via Director)
├── RESOCONTO.md         # questo file
└── components/<id>/
    ├── page.md          # scheda: cosa è/fa, stati, selettori, scope
    ├── fixes.md         # dove serve: fix harness/driver proposti
    ├── shots/V1/        # ctx-a/b + iso-N + meta.json (sha, GL, errori)
    ├── critiques/       # {chatgpt,claude,deepseek}.md verbatim +
    │                    #   digest.md (convergenze, disaccordi, misread)
    └── mockups/         # solo in_review: HTML+PNG + rank-*.md + ranking.md
.mw/review/<id>/         # review page servite a :5300 (python http.server)
scripts/catalog/         # macchinario: manifestSchema (Zod),
                         #   documentComponent, catalogValidate, drivers/
```

## Convenzioni vincolanti (ruling Director)

1. **Prompt AI = verbatim del Director, MAI arricchito.** Testo esatto:
   «Sei un lead UI senior designer di una compagnia di videogame AAA, fa
   una ricerca online, dammi una critica spietata e costruttiva di
   questo componente. Poi proponi delle soluzioni a tua volta, cn
   esempi di codice, ecc.» — rubriche e gating solo a VALLE (digest/
   ranking), mai a monte. Errore documentato in learn
   (`pattern-prompt-sovereignty`).
2. **Status machine**: `unassigned → documenting → documented →
   in_critique → in_review → updated` (+`documenting`+meta.partial per
   stati irraggiunti — mai fabbricare).
3. **Ruling Director registrati** (in ART-DIRECTION + manifest): no
   halo/luce dentro la cella cibo; no ferramenta "appeso"; regolo
   tacche+perla approvato SENZA guida ottone; placche stessa dimensione
   + più margine dai bordi; terzo tab centrale obbligatorio (override
   renders-null); componente giorno più grande.
4. **Frozen build** per gli screenshot (preview :5199, NON dev server
   — HMR falsifica le catture).
5. **Fallimenti dichiarati, mai nascosti**: `DECLARED FAILURE` nei
   file, misread quarantinati nel digest.
6. **Nessun tocco a `src/`** dagli stadi 1-2: solo stage-3
   (implementazione post-ruling) modifica produzione.
7. **Parallelismo**: subagent per componente/blocco; il manifest.json
   lo edita SOLO l'orchestratore in serie (race documentata).

## Macchinario

- `npx tsx scripts/catalog/documentComponent.mts --component <id>
  --base-url http://localhost:5199` — reach via GAME_SURFACE_GRAPH,
  assertion, doppio shot, meta.json, scrive manifest
- `npx tsx scripts/catalog/catalogValidate.mts` — valida manifest
- Mind Weaver `scripts/mw-web-turn.py` (venv
  `mind-weaver/browser-runtime/.venv/bin/python`): `run-create`, `send
  --post-only --image` (multi), `collect`, `reconcile` — browser
  condiviso CDP; failure bundle in `.mw/runs/<run>/failures/`
- Review server: `python3 -m http.server 5300 --bind 127.0.0.1` in
  `.mw/review/`

## Scoperte notevoli

- **Bug reale**: `expedition demoLaunch` → TDZ circular import
  ("Cannot access 'node' before initialization"), ErrorBoundary prende
  la route — i 5 componenti quest sono irraggiungibili finché non è
  fixato. `expedition openDetail` invece FUNZIONA.
- **Pattern trasversali delle critiche**: decorazione > info
  decisionale (4/5 pannelli); stato solo-a-colore; "medaglione vuoto"
  pins+slot = P0; overlay mappa = "debug draw" su pittura.
- **Provider health** (oggi): deepseek affidabile 100%; claude cap 5h;
  chatgpt quota upload quasi sempre spenta.
- **Fix infrastrutturali fatti**: documenter delega al S-graph;
  driver menu con wait-for-boot; `--image` su mw-web-turn.

## Pending / prossimi passi

1. **Ruling Director** sui 3 in_review (review :5300):
   - hud-top-tabs: mockup E (frecce progressive + quadrante giorno +
     placche uguali + terzo tab) — in attesa
   - nav-bar: M1 dock-equal / M2 sealed-doors / M3 brass-rail
   - hud-corner: M1 dock / M2 menu deduplicato / M3 hide labeled
2. **Chatgpt refill** gambe mancanti (26 comp) — prossima finestra quota
3. **Mockup wave** sui ~26 documentati (come i 3 pilot) — da lanciare
4. **Bugfix TDZ** `expedition demoLaunch` — sblocca i 5 componenti quest
5. **Stage-3 implementazione** di hud-top-tabs dopo il ruling E
6. Migliorie harness note nei `fixes.md` (assert-absent, waitFor-attach,
   try/catch driver, seam `seedHudEvent`)
