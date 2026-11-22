---
title: Profilo RPG del metodo «da mockup a componente»
type: profile
updated: 2026-11-19
---

# Profilo RPG — da mockup a componente

Questo file riempie i punti aperti `[P1]…[P11]` del nucleo generico
[`shared/MOCKUP-TO-COMPONENT.md`](shared/MOCKUP-TO-COMPONENT.md). Il metodo
(fasi A/B/C, livelli T0–T3, registro, verdetti) sta lì; l'ingegneria della
Fase A (spec slice-kit, slicer, primitivo, probe V1/V2/V3, classificazione,
record di conversione) sta in [`shared/SLICEKIT.md`](shared/SLICEKIT.md).
Entrambi sono symlink a `mind-weaver/docs/` — lo standard è uno solo. Qui ci
sono solo le scelte di RPG Balancer.

Piani che lo applicano: **PLAN-127** (Fase A, strumenti slice-kit) e
**PLAN-128** (Fasi B e C). Ambito: **solo HUD** di `/game`. Arte di scena e
quest card sono fuori (grammatiche diverse, nessun contratto ancora).

Su conflitto con un documento canonico (`CANON.md`, desiderata FROZEN,
`DECISION_LOG.md`) vince il canonico: correggere questo profilo.

---

## [P1] Contesto di giudizio

- Pagina: **`/game`** reale (mappa2 + HUD firmato), mai una pagina di test isolata.
- Cattura: headless (regola `16-no-foreground-windows`), **1440×900, DPR 2**,
  schermata intera + ritaglio del componente.
- Strumento: l'harness di cattura `/game` esistente (WebGL Metal headless;
  attenzione a clock tardivo e porta dedicata: vedi le note dell'harness prima
  di usarlo). Le animazioni nel preview pane sono congelate: mai giudicare
  movimento da lì.

## [P2] Varianti senza cambiare codice

**Da costruire** (PLAN-128 OB-3): parametro nell'indirizzo, solo in sviluppo,
es. `/game?hudVariant=roster:2`, sullo stesso schema di
`src/ui/idleVillage/skins/resolveInitialSkin.ts` (che legge già un parametro
`URLSearchParams`). Ogni candidato è una configurazione, non un ramo di codice.
In build di produzione il parametro è ignorato.

## [P3] Colori — per materiale, non per colore

Un materiale dipinto non è un colore: ha ombre, mezzitoni, luci. Il riferimento
sono quindi **materiali**, misurati sul componente in basso al centro della
HUD di `/game` (la **Nav**, `public/assets/ui/hud-real/nav/bar.webp`; Director
2026-11-19). Misurati il 2026-11-19 con `scripts/hud-real/material_palette.py
reference` → `test-results/slicekit/material-palette-nav.{json,png}`. **Se la
Nav cambia, si rilancia lo script e si aggiorna questa sezione.**

| Materiale | Mediana Lab (L, a, b) | Scala (ombra profonda → riflesso) | Token oggi |
|---|---|---|---|
| **Oro filetto** (lucido, saturo: bordi, anelli, astrolabio) | 36,5 · 4,7 · 33,6 (L da 3,8 a 97,4) | `#0b0602` `#311c07` `#6f501b` `#f0d77e` `#feffb2` | `--skin-hud-brass-*` copre solo i mezzitoni |
| **Smalto smeraldo** (corpo della barra) | 18,7 · −19,1 · 4,7 | `#01110a` `#091d15` `#063427` `#00462f` `#005c34` | **nessuno** |
| **Gemma smeraldo** (punte, centro) | 67,0 · −50,5 · 22,3 | `#008243` `#008f4f` `#25b979` `#55e7aa` `#8afece` | nessuno |
| **Lacca petrolio** (fondo dei medaglioni) | 6,5 · −2,4 · −7,0 | `#030d0f` `#000f11` `#07161f` `#121e26` `#222d34` | `--skin-hud-lacquer-*`: 91% dei pixel entro ΔE 6 |

Le scale sono riassunti per quantili di luminosità, non adattamenti: servono a
mostrare e a promptare, non a misurare.

**Cosa dicono le misure (2026-11-19, `/game` a 1440×900):**

- **Smalto = un solo materiale stabile.** Nav, Risorse, Tempo, cassetto e
  cornice pannello hanno la stessa mediana (ΔE tra loro 0,3–1,4).
- **Oro = almeno due dialetti sulla stessa schermata.** *Filetto* (Nav, barre
  Risorse/Tempo: L≈31–37, contrasto pieno, ΔE vs Nav 2–5) e *filigrana champagne*
  (cornici Roster/Stash, cassetto, fascia ornata sotto Risorse: L≈45–60,
  ombre meno profonde, ΔE vs Nav **9–24**). Confermato anche a occhio su un
  ingrandimento a 3×. **Ruling Director 2026-11-19:** due ruoli voluti (varietà:
  solo oro sarebbe opprimente), ma **canonico è solo l'oro della Nav**; la
  filigrana attuale è lavoro in corso e non fa da riferimento (`DECISION_LOG`
  2026-11-19). Cautela: la mediana dei pezzi sottili
  dipende da quanta ombra contengono; il confronto definitivo va fatto su
  ritagli della resa, a pari composizione.
- **I token dell'ottone non coprono l'arte.** Solo il 27% dei pixel d'oro della
  Nav sta entro ΔE 6 dalla scala `--skin-hud-brass-*`; il 36% è più scuro del
  token più scuro (incisioni, contorni) e il 19% più chiaro del più chiaro
  (riflessi crema). Lo smalto smeraldo non ha token: la lacca dei token è
  petrolio, non smeraldo.

**Misura (protocollo):** CIEDE2000; sRGB → Lab, D65, 2°; pixel con alpha ≥ 200;
segmentazione per materiale con le regole in testa allo script. Si confronta la
**mediana del materiale** (nel confronto arte/resa: ΔE 0,3–0,4) più l'inviluppo
di contrasto (L P5 e L P95). Il ΔE pixel-per-pixel contro i gradini di una
scala **non** si usa: sull'oro, anche con 12 gradini, il 90% dei pixel resta a
ΔE 8,4.

**Fasce sulla mediana (derivate dalla dispersione dei componenti approvati, da
riconfermare dopo 3 componenti):**

| Materiale | passa | segnalato | da decidere |
|---|---|---|---|
| Smalto, lacca | ≤ 2 | 2–4 | > 4 |
| Oro | ≤ 3 | 3–6 | > 6 |

Fuori fascia = segnalazione per il Director, mai rifiuto automatico (nucleo §3.3).
Gemma: troppo piccola per fasce affidabili (2054 px); si giudica a occhio finché
non ci sono più campioni. Icone avorio dei medaglioni: colore DOM, non misurato
in modo affidabile (due stati diversi, normale e attivo).

## [P4] Lista T0 (cambi meccanici)

1. colore DOM scritto a mano → token `--skin-*` dello stesso ruolo;
2. controllo cotto nell'arte → primitivo `Skin*` / componente del registry;
3. testo cotto o letterale → stringa i18n (it-IT, en, de, ar + pseudo);
4. testo in `cqw` → px/rem con il minimo di [P6].

Altro → T1 se è solo imposto dal contenitore, altrimenti T2.

## [P5] Divieti (T3)

- forma, motivi e materiali del golden registrato;
- testo cotto nell'arte;
- bordo dipinto stirato;
- placca CTA (`SkinButton` variante `cta`) — vietata ovunque;
- blu/oltremare **come superficie dei pannelli** (ruling 2026-10-28; il blu è
  ammesso dove già deciso: ghiera Zanara, POI spedizione — `DECISION_LOG`
  2026-11-11).

Colori con storia che **non** sono T3: il **viola** è testabile come variante
T2 (ruling 2026-10-28).

## [P6] Contenuto e cornice

- Testo funzionale ≥ 11 px (12 px dove lo dice il contratto della superficie);
  `cqw` vietato per il testo funzionale.
- Cornice **fuori** dal rettangolo del pannello, ~1 px di sovrapposizione sul
  bordo interno; scala degli ornamenti uniforme su tutta la HUD.
- Ogni pannello lista ha la banda incisa di scorrimento.
- Il meno possibile di asset, il più possibile CSS/React (Director 2026-08-14).

## [P7] Approvazione e testimone

- **Tutti i mock prodotti vanno mostrati al Director** (ruling 2026-11-20,
  verbatim: *«la regola dice falli tutti e mostrami i mock tra cui scegliere.
  se nn c'è scritto esplicitamente deve essere aggiunto a queste strategie»*).
  Nessuna pre-selezione dell'agente: ogni candidato generato o costruito è
  presentato come mock nel contesto d'uso; il "default 2, max 3" di PLAN-047
  limita le **opzioni della fork card**, non il numero di mock mostrati.
- **Golden:** visual-fork (PLAN-047) → ruling del Director →
  `.mw/specs/<area>/refs/REGISTERED.md`.
- **Verdetto di Fase C:** riga nel record di conversione della superficie
  ([P8]); se il candidato scelto contiene cambi T2, riga anche in
  `REGISTERED.md` (è il nuovo aspetto approvato). Ogni ruling estetico
  distilla conoscenza: ≥1 tratto `appreciated` (il perché) nel component
  charter — vedi [`component-charter.md`](component-charter.md) (PLAN-131).
- **Testimone visivo:** T-04 — un claim su UI si chiude solo guardando la
  cattura montata; quello che non è stato guardato va detto.
- Con sessioni parallele sullo stesso worktree vale anche T-13.

## [P8] Percorsi

| Cosa | Dove |
|---|---|
| standard Fase A (spec, slicer, primitivo, probe) | `context/shared/SLICEKIT.md` → `mind-weaver/docs/SLICEKIT.md` |
| slicer (Python PIL) | `scripts/hud-real/` |
| specifica slice-kit (dati) | `scripts/hud-real/specs/<spec>.json` |
| pezzi tagliati WebP + manifest JSON | `public/assets/ui/hud-real/slicekit/<spec>/` |
| manifest TS generato | `src/generated/slicekit/<spec>Frame.ts` |
| primitivo cornice condiviso | `src/ui/idleVillage/skins/primitives/PanelFrameOrnaments.tsx` |
| record di conversione (+ verdetto di Fase C) | `test-results/slicekit/<surface>.json` |
| journal append-only patch/gate (Passo 7bis, T-32) | `test-results/slicekit/<surface>.journal.jsonl` |
| gate di affettabilità pre-slice (Passo 1ter) | `npm run slice:gate -- <spec.json|image.png>` (`scripts/hud-real/sliceability-gate.mjs` → `npx -y slicewright inspect`; accetta spec con `source.path` o PNG; exit 1 se ci sono warning; `--out` salva il report nel review bundle; `--record <record>` scrive la ricevuta `sliceability_1ter` con exit code + sha12 golden/spec/tool) |
| audit ricevute (transition gate, Passo 7bis) | `npm run slice:audit -- <surface>` (`scripts/hud-real/slice-audit.mjs`; exit 1 su ricevuta mancante/stale/`declared:` senza evidenza/patch ≥3/matrix sotto minimo [P9]; cablato scoped in `closure:lint`) |
| skill esecutiva pipeline | `coordinator/skills/mw-slice-run/SKILL.md` (obbligatoria; workflow per-passo comando+ricevuta+STOP) |
| cartella del componente (nucleo §6) | `test-results/slicekit/<surface>/review/` |
| base di riferimento HUD | `test-results/slicekit/hud-baseline/<data>-<surface>.png` |
| gate di chiusura | `npm run closure:lint` |

Regole da aggiungere a `closure:lint` (PLAN-128 OB-1): un cambio T2 nel
registro senza verdetto → rosso; «entro tolleranza» senza numero ΔE → rosso.

## [P9] Ambiente

- Matrice completa in Chromium headless: 1280×800, 1440×900, 1920×1080,
  3440×1440 × DPR 1–2, contenuto normale + contenuto lungo.
- Una corsia WKWebView (runtime Tauri) a 1440×900 DPR 2.
- Testimone manuale in `tauri dev` per la chiusura.
- Minimo macchinabile per `npm run slice:audit` (`matrix_coverage` nel record
  deve coprire questo; matrice ridotta consentita per superfici non pilota):

```json matrixMin
{"viewports":["1280x800","1440x900","1920x1080","3440x1440"],"dprs":[1,2],"contents":["normal","long"],"wkwebview":true}
```

## [P10] Consegna

- **Devin:** messaggio con link numerati `file:///…` + `<ref_file>` (ruling 2026-11-16).
- **Claude Code:** link markdown ai file + invio dei PNG come file nella conversazione.
- Ordine: tavola → scelto a schermo intero → golden/riproduzione → registro.

## [P11] Pilota

Banda di scorrimento → **Roster** → **Stash** (le tre conversioni impegnate di
PLAN-127). PLAN-128 parte su Roster dopo che Roster passa la Fase A. L'ultimo
report (`test-results/slicekit/roster-stash-findings.md`) registra ancora rosso
il controllo sul minimo del testo (120 testi a 10 px): va rieseguito prima di
partire.
