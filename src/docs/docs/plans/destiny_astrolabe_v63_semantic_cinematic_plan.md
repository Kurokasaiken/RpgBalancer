# Destiny Astrolabe V6.3 — Piano di miglioramento semantico + cinematografico

> Stato: **Parzialmente implementato (V6.3 lab) — iterazione in corso, in attesa di validazione visiva del Director**  
> Owner: Fausto (Director) · Redatto da Devin con hat `mw-planner`  
> Direzione scelta: **A + B** — patch semantico/leggibilità + ristrutturazione cinematografica della timeline.  
> Data: 2026-09-08 · **Ultimo sync: 2026-09-09**

---

## 0bis. Stato di avanzamento (sync 2026-09-09)

| Fase | Descrizione | Stato |
|------|-------------|-------|
| F0 | Fondamenta: `astrolabeV63Config.ts` (Zod) creato; `phaseDurations` **non** centralizzati (timings ancora in `engine.ts`); `useAstrolabeV63Phase.ts` e `astrolabeV63.types.ts` non creati | 🔶 Parziale |
| F1 | Overlay pre-roll: le informazioni (skill/stat/diff/probabilità/rischio) sono visibili sulle **label sugli assi** e sull'HUD del TestHub prima del lancio; overlay React full-screen frontale non implementato (valutato superfluo dal Director: i dati vivono sul board) | 🔶 Parziale — vedi nota F1 |
| F2 | Skill labels interne sull'asse (icona + nome + stat/difficulty) **implementate** in canvas; placche sul **perimetro bronzo** (r=455, markup SVG) non implementate | 🔶 Parziale |
| F3 | Skill Core centrale `CHECK` (i18n) con implosione al click **implementato**; `armed` esposto via `onArmed`; mancano auto-throw con countdown visibile e tasto Space/Enter esplicito | 🔶 Parziale |
| F4 | Card risoluzione: 5 verdetto i18n distinti, seal, chips ferita/morte, **math esplicito** `D100 {{roll}} · TST = 50 + ({{stat}} − {{difficulty}}) = {{tst}}`, **frase narrativa per skill** (`copy.narrativeFlavors` in `en`+`it-IT`); mancano micro-flash zona, anello speculare, trattamento "sussurrato" fail, climax differenziato per esito | 🔶 Parziale |
| F5 | i18n in `public/locales/{en,it-IT}/idleVillage.json` sotto chiave `astrolabeV63.*` (**divergenza**: non in namespace/file `astrolabe.json` separato); test unitari esistenti (29 in `tests/unit/astrolabe`); mancano E2E Playwright e test fasi | 🔶 Parziale |
| 5.5 | Frantumazione obelischi | ✅ Implementato (`shatter` in config + shard in engine) |
| 5.6 | Gap ring↔cerchio interno | ✅ Implementato (labbro bezel + fondo opaco arena) |
| 5.7 | Risoluzione cinematografica | 🔶 Parziale (card fatta; trattamenti visivi per-esito mancanti) |
| 5.8 | Fenditura radiale wound/death | 🔶 Canvas 2D in `engine.ts` (`scene.fissure`); shader WebGL in `tarGooRenderer.ts` non fatto |
| 5.9 | Skill Core `CHECK` + pallina goccia mercurio/ambra | ✅ Implementato |
| 5.10 | Proporzionalità areale esiti | ✅ Verificata da test unitari |
| — | Traiettoria pallina "snap" | ✅ Risolto: state machine `BOUNCING→ALIGNING→DECELERATING→SETTLED`, fixed 120 Hz, decelerazione quadratica target-aligned (`landing.*` in config) |
| — | Backdrop default `teal` troppo verde | ✅ Ritocciato (commit `9ef67d55`) |

**Commit rilevanti:** `9540653e` (trajectory landing state machine), `a2375a1a` (F4 card narrativa per skill + math), `deb30c6d` (RICHIESTE), `9ef67d55` (teal backdrop), `a4c814ab` (clone V6.4 — directory `destinyAstrolabeV64/` con file reali, config `astrolabeV64Config.ts`, kit, route `/minimal-destiny-astrolabe-v6-4`, i18n `astrolabeV64.*`, CSS `.da-v64`).  
**Evidence:** `test-results/r067-astrolabe-v63-2026-09-08.log`, `test-results/build-check-2026-09-08.log`.

> **⚠️ DECISIONE Director 2026-09-09: V6.3 è OFF-LIMITS.** Il piano prosegue **solo
> su V6.4** (`destinyAstrolabeV64/`, pagina `/minimal-destiny-astrolabe-v6-4`, CSS
> `.da-v64`, i18n `astrolabeV64.*`, config `astrolabeV64Config.ts`). V6.3 resta la
> baseline congelata. Tutti i riferimenti a `V63`/`v6-3` nelle sezioni F0–F5 e
> 5.5–5.10 si leggono ora come `V64`/`v6-4`.
>
> **Fatto su V6.4 (2026-09-09):** F3 cornice quiet→tension→explosion
> (`data-state` → opacità `.astro-bezel`); F4/5.7 — scrim card rinforzato,
> climax differenziato per esito (`data-verdict` + 4 keyframe dedicati:
> triumph / sigh-almost / whisper-fail / doom-epicfail), micro-flash zonale
> `--fx/--fy` sul punto di atterraggio colorato per esito.

**Nota F1 — divergenza rispetto al piano originale:** il piano proponeva un overlay React frontale con scrim/blur sopra la canvas in fase `armed`. Il Director ha chiarito che le informazioni devono vivere **sul board** (label sugli assi, HUD del TestHub), non in un pannello separato. Lo stato `armed` continua a essere il momento di lettura; un overlay ulteriore è opzionale e non bloccante.

---

---

## 0. Scope e vincoli

### Cosa si tocca
Solo la **superficie React/CSS e il markup** di `DestinyAstrolabeV63` e il suo TestHub `/minimal-destiny-astrolabe-v6-3`.  
L’**engine WebGL tar-goo e la fisica della pallina** restano invariati, salvo aggiungere hook di state machine necessari a pilotare gli overlay.

### Cosa NON si tocca
- Non si sostituisce il d100 con un d20 (canonico V1).
- Non si creano file `.css` autonomi: ogni stile nuovo entra in `astrolabe-ui.css` o via token `skinConfigRegistry`.
- Non si hardcodano stringhe: skill, difficoltà, verbi ed esiti passano da `i18n`.
- Non si cambia la direzione artistica approvata; si migliora la leggibilità e la coerenza della palette esistente.

### Autorità
- `.mw/desiderata.md` v3/v4: `Destiny Astrolabe V1` resta il contratto runtime per POI quest.
- `.mw/desiderata.md` v9: la geometria avversariale può non essere amorfa (tar-goo già valido).
- `.mw/desiderata.md` v8: `Golden UI Foundation` è il processo di congelamento visivo; questo piano è un passo di laboratorio, non una certificazione Golden.
- `DESIGN_PILLARS.md` §2: skill check come scheda dell’esito, leggibile, con halo/ritmo.

---

## 1. Diagnosi riassunta

1. **Semantica del check illeggibile.** Il giocatore non vede chiaramente: *quale skill* è in gioco, *quale difficoltà* deve battere, *quale è la sua forza*, *qual è la probabilità* prima di lanciare.
2. **THROW ambiguo.** Compare come pulsante centrale senza preparazione; non chiarisce che è l’azione del giocatore “lancia il dado”.
3. **Skill sugli assi mancanti.** Riferimento: `AltVisualsV6Asterism` mostra nomi/icon sui 5 assi; V6.3 non le espone sulle punte/obelischi.
4. **Climax debole.** La vittoria/sconfitta si risolve con un banner che manca di scrim, contrasto e “release” della tensione.
5. **Timer/arco grigio nascosto.** L’indicatore temporale, se esiste, non è leggibile.
6. **Sovraccarico decorativo.** Cornice e particelle sempre al massimo; manca la curva `quiet → tension → explosion`.

---

## 2. Direzione A + B — concetti chiave

1. **Il lancio è solo il lancio del dado.**  
   Prima del lancio il giocatore deve vedere tutte le informazioni: skill, difficoltà, stat, probabilità.  
   Dopo il click su THROW inizia la fisica; niente input aggiuntivo.
2. **Fase `armed` separata.**  
   Tra la rivelazione della superficie e il lancio c’è una pausa in cui il giocatore legge e decide. THROW pulsa ma non forza il ritmo.
3. **Skill labels sugli assi.**  
   Ogni asse porta una placca con nome skill e, se multi-skill, l’indicazione di quale skill domina quell’asse (punte).
4. **Esito narrativo contestuale.**  
   La frase finale cambia in base alla skill attiva e all’esito, non è unico testo “VITTORIA”.
5. **Palette unificata.**  
   Mantenere l’oro caldo per azione/successo, declassare il ciano a “inattivo/lume”, evitare competizione cromatica.
6. **Climax con scrim e burst.**  
   Testo su scrim scuro, micro-flash della zona, anello speculare, e un “sussurro” del fail opposto al clang del success.

---

## 3. State machine target

```
idle
  ↓ roll() (auto o chiamata esterna)
reveal
  - appare la superficie tar-goo
  - cadono gli obelischi con skill labels
  - compaiono placche difficoltà/stat
armed
  - THROW pulsa in basso/sotto il board
  - overlay informativo: skill · DC · TST · probabilità
  - il giocatore ha agency: clicca / spazio / auto-throw dopo delay
the-spin
  - il dado viene lanciato; nessuna ulteriore interazione
  - la cornice passa a 100% attività
landing (interno, sotto-stati: BOUNCING → ALIGNING → DECELERATING → SETTLED)
  - la pallina allinea la velocità verso il target pre-rollato e frena
    con decelerazione quadratica esatta (a = −v²/2d); nessuno snap posizionale
resolution
  - esplosione/contenzione della cornice
  - card con verdetto + matematica + frase narrativa
  - il giocatore chiude / raccoglie
```

> **Sync 2026-09-09:** lo stato `magnetic-snap` non esiste più: il "punto di atterraggio" è
> gestito dalla landing state machine (`landing.*` in `astrolabeV63Config.ts`). I nomi
> di fase pubblici emessi via `onState` restano quelli legacy (`reveal`, `action-trigger`,
> `the-spin`, `resolution`); `armed` è esposto come callback `onArmed` + stato
> `action-trigger` (alias di fatto, da rinominare in F0/F3 se serve il nome esatto).

---

## 4. Architettura dei moduli

```
src/ui/idleVillage/components/destinyAstrolabeV63/
├── DestinyAstrolabeV63.tsx          # gestione fase + overlay React
├── engine.ts                          # log WebGL/physics (INVARIATO eccetto hook)
├── tarGooRenderer.ts                  # INVARIATO
├── tentacles.ts                       # INVARIATO
├── markup.ts                          # markup statico esteso con slot per overlay
├── astrolabeV63.types.ts              # tipi condivisi (opzionale)
└── useAstrolabeV63Phase.ts            # state machine + i18n

src/ui/idleVillage/components/destinyAstrolabeV6/
├── astrolabe-ui.css                   # nuove classi overlay + cleanup
├── astrolabe.css                      # eventuali aggiustamenti

src/balancing/config/idleVillage/
├── astrolabeV63Config.ts              # nuovo: timing fasi, copy, token palette

src/localization/i18n/                  # DIVERGENZA: le chiavi V6.3 sono in
public/locales/{en,it-IT}/idleVillage.json sotto `astrolabeV63.*`
(un namespace dedicato `astrolabe.json` resta un'opzione F5, non un vincolo)

src/pages/minimal-destiny-astrolabe-v6-3.tsx  # test page con preset e flag fase

tests/
├── unit/idleVillage/astrolabeV63/astrolabeV63_phases.test.tsx
├── e2e/minimal-destiny-astrolabe-v6-3.spec.ts
```

---

## 5. Fasi di lavoro + acceptance

### F0 — Fondamenta: audit, contratto, config (0.5–1 gg)

> **Stato 2026-09-09: 🔶 parziale.** `astrolabeV63Config.ts` esiste e valida Zod
> (`skillCore`, `ball`, `shatter`, `fissure`, `landing`, `axisLabels`). Mancano:
> `phaseDurations` centralizzati (i timings `tSlam/tBurst/tPour/tSpin` sono ancora
> sparsi in `engine.ts`), `astrolabeV63.types.ts`, `useAstrolabeV63Phase.ts`,
> `<div class="pre-roll-overlay">` nel markup.

**File target**
- `src/ui/idleVillage/components/destinyAstrolabeV63/engine.ts`
- `src/balancing/config/idleVillage/astrolabeV63Config.ts` (nuovo)
- `src/ui/idleVillage/components/destinyAstrolabeV6/markup.ts`

**Cosa fare**
1. Aggiungere al contratto `onState` le fasi target (`reveal`, `armed`, `the-spin`, `snap`, `resolution`) se non già presenti.
2. Verificare quali overlay esistono in V6 e sono spenti/disabilitati in V63.
3. Creare `astrolabeV63Config.ts` (Zod) con:
   - `phaseDurations: { reveal, armed, throw, spin, snap, resolution }`
   - `copy: { verdicts, narrativeFlavors }`
   - `palette: { active, inactive, success, failure, wound, dead }`
   - `overlay: { scrimOpacity, labelRadius, badgeY }`
4. Aggiungere `<g class="axis-labels">` e `<div class="pre-roll-overlay">` nel `ASTROLABE_MARKUP`.

**Acceptance**
- `npm run build:check` verde.
- Test unitario: `engine` emette le fasi target in ordine.
- `astrolabeV63Config.ts` validato Zod con default.

---

### F1 — Pre-roll info overlay (1 gg)

> **Stato 2026-09-09: 🔶 parziale / rivisto.** Il requisito funzionale — *il giocatore
> vede skill, difficoltà, stat e probabilità prima del lancio* — è coperto dalle
> **label sugli assi** (`axisLabels` in canvas: icona + nome + `stat/difficulty`) e
> dall'HUD del TestHub. L'overlay React frontale con `backdrop-filter` descritto
> sotto è **non implementato e non più prioritario**: se si vuole comunque, è un
> punto di rifinitura da ri-valutare col Director.

**File target**
- `src/ui/idleVillage/components/destinyAstrolabeV63/DestinyAstrolabeV63.tsx`
- `src/ui/idleVillage/components/destinyAstrolabeV6/astrolabe-ui.css`
- `src/localization/i18n/en/idleVillage/astrolabe.json`
- `src/localization/i18n/it-IT/idleVillage/astrolabe.json`

**Cosa fare**
1. Renderizzare un overlay React assoluto sopra la canvas solo in fase `armed`:
   - **Top center**: skill attiva + TST (es. `ATHLETICS · TST 72`).
   - **Center ring**: placca circolare con `DC 55` / `STAT 65` / `PUNTE 3`.
   - **Bottom center**: probabilità stimata (%) con barra segmentata `SAFE / RISKY / DESPERATE`.
2. Tutti i numeri da `skills[]` e `config`, testi da `i18n`.
3. Stile con `backdrop-filter: blur`, bordo oro, `text-shadow` su scrim.

**Acceptance**
- Il TestHub mostra le informazioni prima che THROW appaia/attivi.
- Cambiare stat/difficoltà aggiorna i numeri in tempo reale.
- Nessun valore hardcoded; build verde; lint 0 errori.

---

### F2 — Skill labels sugli assi (1–1.5 gg)

> **Stato 2026-09-09: 🔶 parziale.** Le label (icona + nome + `stat/difficulty`)
> sono disegnate **in canvas** dagli `axisLabels` di `engine.ts`/`astrolabeV63Config.ts`
> con stagger di reveal. Non esistono le **placche SVG sul perimetro bronzo**
> (`g` in markup a raggio ~455); se si vogliono, sono aggiunte a `markup.ts` +
> `astrolabe-ui.css` senza toccare il canvas.

**File target**
- `src/ui/idleVillage/components/destinyAstrolabeV63/engine.ts` (esporre `axisSkill` al markup)
- `src/ui/idleVillage/components/destinyAstrolabeV6/markup.ts`
- `src/ui/idleVillage/components/destinyAstrolabeV6/astrolabe-ui.css`

**Cosa fare**
1. Generare 5 `g` SVG con placche posizionate sul perimetro bronzo (raggio ~455, angoli `TIP(i)`).
2. Ogni placca mostra:
   - nome della skill mappata su quell’asse (`geo.axisSkill[i]`)
   - icona iniziale opzionale
   - piccolo numero `stat / difficulty`
3. Animazione stagger di entrata in `reveal`.
4. Su multi-skill, evidenziare la skill attiva/testata (quella il cui indice corrisponde al risultato).

**Acceptance**
- Con 5 skill diverse, ogni asse mostra il proprio nome.
- Con 1 skill, tutti e 5 gli assi mostrano lo stesso nome.
- Le placche non coprono l’area di gioco e restano leggibili in mobile 360px.

---

### F3 — Timeline e THROW → Skill Core CHECK (1–1.5 gg)

> **Stato 2026-09-09: 🔶 parziale.** Il pulsante THROW è stato **sostituito dal
> Skill Core centrale** (decisione Director, §5.9): sigillo dorato che pulsa in
> `armed`, implode al click e da lì parte la pallina. Etichetta `CHECK` i18n
> (`astrolabeV63.check`), click handler React, `autoThrow`/`skipAnimation` props
> esistono già nel wrapper. **Mancano:** countdown visibile dell'auto-throw e
> trigger `Space`/`Enter` (il bottone è un `<button>` quindi Enter funziona di
> default; Space va verificato/testato). La curva cornice quiet→tension→explosion
> (10%/40%/100%) non è ancora misurata/esplicita.

**File target**
- `src/ui/idleVillage/components/destinyAstrolabeV63/engine.ts`
- `src/ui/idleVillage/components/destinyAstrolabeV63/DestinyAstrolabeV63.tsx`
- `src/ui/idleVillage/components/destinyAstrolabeV6/astrolabe-ui.css`

**Cosa fare**
1. Inserire fase `armed` esplicita nell’engine:
   - al termine di `reveal`, l’engine emette `onState('armed')` e attende `throw()`.
   - auto-throw opzionale con countdown visibile.
2. Spostare/ridefinire il bottone THROW:
   - posizione inferiore del board (non sopra il Big Win core)
   - label i18n `astrolabe.throw`
   - animazione `da-tira-pulse` solo in `armed`
   - al click: `engine.throw()` + flash del bottone.
3. La cornice passa a ~10% in `reveal`, ~40% in `armed`, ~100% in `the-spin` (animazioni CSS sul `.astro-bezel`).

**Acceptance**
- Test Playwright: click su THROW scatena `the-spin`; senza click resta in `armed`.
- `spacebar` e `Enter` attivano THROW quando focalizzato.
- Auto-throw 0.5s/1s toggle funziona.

---

### F4 — Climax e resolution (1.5–2 gg)

> **Stato 2026-09-09: 🔶 parziale.** Implementati (commit `a2375a1a`):
> - `cardTitle` con 5 verdetto i18n distinti (`verdict.*`);
> - `cardSub` con math esplicito `D100 {{roll}} · TST = 50 + ({{stat}} − {{difficulty}}) = {{tst}}`;
> - `cardNums` con **frase narrativa per skill** (`copy.narrativeFlavors`,
>   `astrolabeV63.narrative.<Skill>.<verdict>` con fallback generico, `en`+`it-IT`);
> - chips `FERITO`/`CADUTO` i18n.
>
> **Mancano:** scrim/contrasto dedicati alla card su background chiari, micro-flash
> della zona, anello speculare, trattamento "sussurrato" per il fail (luce che
> defluisce), climax visivo differenziato per i 5 esiti.

**File target**
- `src/ui/idleVillage/components/destinyAstrolabeV63/DestinyAstrolabeV63.tsx`
- `src/ui/idleVillage/components/destinyAstrolabeV6/astrolabe-ui.css`
- `src/balancing/config/idleVillage/astrolabeV63Config.ts`

**Cosa fare**
1. Riusare/estendere `#card` markup per la schermata di risoluzione:
   - `cardSeal` diventa icona esito (`✦` / `✗` / `☠`).
   - `cardTitle` è il verdetto i18n (`TRIONFO`, `SUCCESSO`, `PARZIALE`, `FALLIMENTO`, `DISASTRO`).
   - `cardSub` è la matematica: `roll 38 + stat 65 = 103 ≥ DC 55`.
   - `cardNums` è la frase narrativa contestuale alla skill (configurata in `astrolabeV63Config.ts`).
2. Aggiungere:
   - `da-screen-flash--success` / `da-screen-flash--failure` esistente; assicurarsi che parta su `resolution`.
   - scrim scuro `rgba(10, 8, 5, 0.55)` dietro il testo.
   - `text-shadow` su titolo e sottotitolo.
3. Per il fail: anello che si spegne, luce che defluisce verso il centro, frase “sussurrata”.

**Acceptance**
- “VITTORIA” non si fonde con lo sfondo chiaro.
- La matematica è leggibile in <1s.
- La frase narrativa cambia tra `Atletica`, `Perception`, `Persuasion`, `Stealth`, ecc.

---

### F5 — Config, i18n, test e safeguard (1 gg)

> **Stato 2026-09-09: 🔶 parziale.** Le chiavi i18n sono in
> `public/locales/{en,it-IT}/idleVillage.json` sotto `astrolabeV63.*` (divergenza
> rispetto al namespace `astrolabe.json` qui sotto — vedi §0bis). Test unitari
> `tests/unit/astrolabe` verdi (29 test). **Mancano:** test E2E Playwright su
> `/minimal-destiny-astrolabe-v6-3`, test fasi (`onState`/`onArmed` ordine), test
> Monte Carlo proporzionalità areale (§5.10), screenshot per i 5 esiti forzati,
> smoke/console-error check documentato, evidence log dedicato.

**File target**
- tutti i file sopra + test

**Cosa fare**
1. Aggiungere namespace `astrolabe` nelle risorse i18n esistenti.
2. Verificare che ogni colore legga da `--skin-*` token o da `astrolabeV63Config.ts`.
3. Scrivere test:
   - unit: `astrolabeV63_phases.test.tsx` verifica che `onState` emetta le fasi corrette e che l’overlay mostri le skill.
   - Playwright E2E: aprire `/minimal-destiny-astrolabe-v6-3`, impostare stat/diff, verificare che le info pre-roll siano visibili, cliccare THROW, verificare la card di risoluzione.
4. Run safeguard:
   - `npm run lint -- src/ui/idleVillage/components/destinyAstrolabeV63`
   - `npm run test -- astrolabeV63`
   - `npm run build:check`
   - `npm run kanban:lint`

**Acceptance**
- Tutti i safeguard passano.
- Evidence log in `test-results/destiny-astrolabe-v63-2026-09-08.log`.

---

## 5.5 — Transizione di uscita degli obelischi: FRANTUMAZIONE (DECISO — ✅ implementato 2026-09-08)

> **Stato:** `shatter` in `astrolabeV63Config.ts` + shard che cadono con gravità/rotazione
> e affondano nel goo, in `engine.ts`. Uscita verso l'alto (`dropY=(1-pl.drop)*-520`)
> sostituita. Da verificare visivamente sul TestHub.

Il Director ha specificato che gli obelischi non devono sparire andando verso l'alto e ha scelto la **frantumazione**:

- Le punte si spezzano in **schegge che cadono verso il basso** e sprofondano nella materia del tar-goo.
- **Successo** = schegge d'oro che fondono nella stella; **fallimento** = schegge d'ossidiana che affondano nel goo.
- Il codice da sostituire è `dropY=(1-pl.drop)*-520` in `engine.ts` (uscita verso l'alto): va sostituito con frammenti che cadono con gravità, rotazione casuale e dissolvenza nel goo.
- La transizione influenzerà il reset di `scene.whitePillars`/`scene.blackPillars` in `engine.ts` e le animazioni di `resolution`. Timings, numero schegge e colori da `astrolabeV63Config.ts` / token skin.

## 5.6 — Gap tra ring e cerchio interno: CHIUDERE IL LABBRO (DECISO — ✅ implementato 2026-09-08)

> **Stato:** `astro-bezel` a `inset: -12%` e `.arena` clippata a `inset: 3%` in
> `astrolabe.css` (file ancora nel working tree, non commesso: va concordato se
> farne commit o rigenerarlo dal template). Il fondo opaco dell'arena copre
> l'antialiasing.

**Diagnosi verificata nel codice:** la canvas disegna il disco dell'arena fino a `R=362` su 800 (`engine.ts`, `const W=800…R=362`), cioè ~90% del raggio dell'arena DOM. Il bezel SVG (`markup.ts`) è sopra la canvas (z-index 6) ma il suo labbro interno — "L4 field stone" a `r=438`, "L8 AO" a `r=432` — non arriva a coprire l'anello trasparente restante della canvas: lì si vede lo sfondo della pagina.

**Soluzione decisa (minima, niente strati nuovi):**

1. **Estendere il labbro interno del bezel verso il centro** — aumentare `stroke-width` / ridurre `r` del field stone L4 fino a sovrapporsi al bordo del disco disegnato, con margine di sicurezza (overlap di qualche unità viewBox per coprire antialiasing e scaled-down).
2. **Rete di sicurezza:** fondo opaco sull'`.arena` (radial-gradient in tinta con `mb-g-f`, deepTeal/obsidian) così anche la parte di canvas non disegnata non mostra mai la pagina — una riga di CSS, copre anche reveal e reduced-motion.

Non serve ridisegnare il ring né introdurre nuovi materiali: basta che il labbro interno e il disco dell'arena si tocchino/sovrapponano.

## 5.7 — Risoluzione cinematografica per i 5 esiti

> **Stato 2026-09-09: 🔶 parziale.** La card ha ora 5 titoli distinti + math +
> frase narrativa per skill (vedi F4). I trattamenti visivi specifici per esito
> (tabella sotto: anello d'oro per trionfo, sussurro per fail, ecc.) non sono
> ancora differenziati — oggi la card cambia solo il testo e la classe tono.

Il Director richiede che la schermata di risoluzione sia rifatta in modo interessante, bello e cinematografico, e che i 5 esiti siano:

1. **Successo critico** (mappa su `bigwin`)
2. **Successo** (mappa su `win`)
3. **Almost** (mappa su `almost`)
4. **Fallimento** (mappa su `fail`)
5. **Fallimento critico** (mappa su `epicfail`)

Trattamento proposto per ogni esito:

| Esito | Trattamento visivo | Trattamento audio (placeholder) | Frase narrativa |
|-------|--------------------|---------------------------------|-----------------|
| **Successo critico** | Il nucleo esplode in un anello di luce dorata; la stella si espande oltre il tar-goo; particelle d'avorio esplodono verso la cornice. | Clang + riverbero caldo | “Il destino si inchina al tuo passo.” |
| **Successo** | La stella pulsa una volta; un anello speculare parte dal centro e si dissolve; la cornice brilla. | Timbro bronzeo | “La prova cede sotto il tuo sforzo.” |
| **Almost** | La stella si contrae, quasi a lambire la pallina; la luce si spegne con un sospiro; resta un alone ambrato sul confine. | Nota che si frange | “Un soffio, e la verità ti sfugge.” |
| **Fallimento** | Il sigillo si oscura; la luce defluisce verso il centro; il tar-goo risale di un istante, poi si ferma. | Sussurro basso | “La presa scivola.” |
| **Fallimento critico** | Il goo erutta; le fessure si aprono; l'anello bronzo trema e si annerisce; il centro diventa un gorgo. | Risonanza grave | “Il mondo ti respinge.” |

**Card di risoluzione — cosa mostra concretamente:**

```
        ┌─────────────────────────────┐
        │            ✦                │   cardSeal: icona esito
        │         TRIONFO             │   cardTitle: nome esito (i18n)
        │  roll 38 + stat 65 = 103    │   cardSub: matematica del check
        │        ≥ DC 55              │
        │ “Il destino si inchina      │   cardNarrative: frase legata
        │   al tuo passo.”            │   alla skill attiva
        │  [FERITO −20%]              │   badge rischio, solo se accade
        └─────────────────────────────┘
```

- `cardSeal` con icona/esito distintivo per ogni livello (`✦` trionfo, `✓`-runa successo, `◔` almost, `✗` fallimento, `☠` disastro — set definitivo in F4).
- `cardTitle`: nome esito i18n, diverso per ognuno dei 5 esiti.
- `cardSub`: matematica `roll + stat = risultato vs DC` (o percentuale D100), leggibile in <1s.
- `cardNarrative`: frase contestuale alla skill (Athletics, Perception, Persuasion, Stealth, ecc.).
- Scrim scuro obbligatorio per garantire leggibilità su ogni background.
- Oggi il componente mostra un solo testo generico: i **nomi diversi degli esiti sono una novità di questo piano**, appaiono come `cardTitle` in `resolution`.

**Acceptance F4 aggiuntivo:**
- Ogni esito mostra un trattamento visivo distintivo a colpo d'occhio.
- Il testo di esito/frase è leggibile su tutti i background del TestHub.
- Playwright cattura screenshot per tutti e 5 gli esiti forzati.

## 5.8 — Ferita e morte come "terremoti" (desiderata v12 FROZEN)

Il Director rimanda alla desiderata v12 FROZEN: la messa in scena del secondo dado è **"i due terremoti — fenditura che si chiude per la ferita, spacco che resta aperto per la morte"** <ref_snippet file="/Users/faustoboni/progetti_personali/RPG/.mw/desiderata.md" lines="532-533" />.

**Vincoli:**
- Ferita = fenditura che **si chiude** (danno temporaneo, la superficie si ricompose).
- Morte = spacco che **resta aperto** (perdita definitiva, il vuoto resta).
- Nessun gorgo, blob, buco o icona esagerata.
- Le zone devono essere sullo schermo, leggibili, ma senza "visual noise".
- Non devono competere con la stella, il goo e l’azione di lancio.
- Mantenere proporzionalità areale e i 5 esiti.

**Adattamento al tar-goo V6.3 (deliberazione multi-AI):**

La deliberazione multi-AI in `.mw/runs/2026-09-08-astrolabe-terremoti` raccomanda **Opzione A — fenditura radiale sul tar-goo**, con i dettagli operativi seguenti:

0. **Nota sullo stato attuale (2026-09-09):** la fenditura **esiste in canvas 2D** in
   `engine.ts` (`scene.fissure`, trigger su `resolve()` quando `wounded`/`dead`): wound
   → apertura + richiusura in cicatrice ambrata; death → spacco scuro/viola persistente.
   Il passo **WebGL shader in `tarGooRenderer.ts` non è ancora fatto**: i punti 1–6
   sotto restano il target di qualità, il canvas 2D è il livello minimo già live.
1. **Cosa si intende per “fenditura radiale”:** una crepa che **parte dal punto di impatto della pallina e corre lungo il raggio** del cerchio verso il bordo (o verso il centro), come una scheggiatura nella materia del tar-goo. Non una crepa concentrica, non un buco, non un gorgo: una linea di frattura sottile e direzionale.
2. **Wound** — la fenditura si apre all’impatto, vibra e poi si **richiude** lasciando una **cicatrice ambrata sottile**. Il “terremoto” è avvenuto e la superficie si è ricomposta.
3. **Death** — la fenditura si apre e **NON si chiude**, lasciando uno **spacco nero/viola** che assorbe luce.
3. **WebGL2**, single pass: la fenditura viene disegnata nello stesso `tarGooRenderer.ts` usando un nuovo shader iniettato in TS (no file `.glsl` esterni, no `.css` autonomi).
4. **Area-proporzionale**: la larghezza della fenditura è `k × (hitArea / maxArea)`, con `k` da token skin/design-system.
5. **Clipping**: la fenditura resta confinata dentro il cerchio del goo, mai sopra la stella o la cornice.
6. **Fuori scope di questa iterazione**: pause del quest clock, pannelli extra, ARIA live completa (possono essere aggiunti in seguito se richiesti).

**Task per F2/F4:**

1. Aggiungere token `--fissure-base-width`, `--amber-scar`, `--violet-crack`, `--scar-duration`, `--crack-duration` nello skin system.
2. Estendere `tarGooRenderer.ts` con un shader che riceve `uTheta`, `uTime`, `uWidth`, `uAreaRatio`, `uColor` e disegna la fenditura radiale.
3. Esportare da `engine.ts` `impactAngle`, `hitArea`, `maxArea` e il flag `wounded`/`dead`.
4. Triggerare l’animazione della fenditura in `magnetic-snap` / `resolution`, non prima.
5. Salvare lo stato “cicatrice chiusa” o “spacco aperto” fino al prossimo `roll()`.
6. Test visuale: screenshot a 3 risoluzioni per ferita e morte.

**In risoluzione:**
- Il badge Ferito/Caduto esce dal motore e diventa testo i18n nella card.
- La frase narrativa varia in base a esito + ferita/morte.

**Acceptance aggiuntivo:**
- `wounded` e `dead` non appaiono mai come hardcoded stringhe nel motore o nella UI.
- Le zone sono leggibili al primo sguardo ma non rumore.
- Ogni combinazione esito + stato di rischio ha un trattamento distintivo.

## 5.9 — Azione: CHECK via Skill Core + pallina a goccia (decisioni del Director — ✅ implementato 2026-09-08)

> **Stato:** Skill Core `da-skill-core` in `DestinyAstrolabeV63.tsx` +
> `astrolabe-ui.css`, pallina a goccia (`ball.*` in `astrolabeV63Config.ts`):
> stretch su velocità, trail sottile, implosione al click, label `CHECK` i18n.
> Verifica visiva Director ancora aperta.

Il Director propone di sostituire `THROW` con `CHECK` e non è soddisfatto del pulsante attuale. Decisioni prese:

- **Input di lancio = Opzione A — Skill Core centrale.** Un sigillo dorato con runa al centro del board: spento in `reveal`, pulsante in `armed`, implode al click e da lì esce la pallina. Etichetta `CHECK` i18n sotto il core.
- **Pallina = Opzione B — Goccia di mercurio/ambra.** Forma allungata in direzione del moto, riflesso speculare che gira, trail sottile e brillante senza particelle esagerate.

### 5.9.1 — Input di lancio: Skill Core centrale (DECISO — Opzione A)

- **Sigillo dorato con runa incisa** al centro della board, sopra il tar-goo.
- **Stati:** spento in `reveal`; in `armed` pulsa con luce calda e un anello esterno che “respira”; in `hover` l’anello si solleva (translateZ/scale leggero + bagliore).
- **Click:** il sigillo si comprime verso il centro (implosione ~150ms), flash breve, la pallina nasce dal core ed entra in `the-spin`.
- **Etichetta:** `CHECK` in piccolo sotto il core, da i18n (`astrolabe.check`), mai hardcoded.
- **Accessibilità:** stesso trigger su `Space`/`Enter`; auto-throw opzionale con countdown.
- Vincolo rispettato: l’input si legge come “confermo la prova e lancio il dado”, non come verbo generico.

### 5.9.2 — Pallina: goccia di mercurio/ambra (DECISO — Opzione B)

- **Forma:** sfera leggermente allungata lungo il vettore velocità (stretch dinamico, `scaleY ≈ 1 + k·|v|`), si riassume nei rimbalzi.
- **Materiale:** riflesso speculare che “gira” seguendo la rotazione; nucleo ambrato con highlight bianco-oro.
- **Trail:** scia sottile e brillante (gradiente ambra→trasparente), senza nuvole di particelle; poche scintille d’oro solo sui rimbalzi interni, schegge scure sul bordo del goo.
- **Cambio zona:** quando attraversa stella→goo il riflesso si raffredda di un istante (micro-aberration cromatica, se economica).

**Impatto:** tocca `engine.ts` (draw ball/trail/particles) e `markup.ts`/`astrolabe-ui.css` (Skill Core).

## 5.10 — Proporzionalità areale dei 5 esiti

Il Director conferma che **successo critico**, **fallimento critico** e **almost** devono essere corretti e proporzionali rispetto all’area del goo. Nel motore V63 questo è già implementato:

- **`bigwin`** → `solveCoreRadius(geo.snap, big)` risolve il raggio del nucleo in modo che l’area interna corrisponda alla percentuale `bigwin`.
- **`almost`** → `solveOuterBands(geo.snap, rStarAt, [almost], 1440)` risolve la banda oltre la stella in modo area-proporzionale.
- **`epicfail`** → `solveGooBand(geo.snap, epic, 1440)` risolve la banda critica sul bordo del goo in modo area-proporzionale.

Questa proporzionalità è un **invariante** da preservare in tutte le modifiche di F1–F4. Ogni nuovo effetto visivo (flash, particellare, climax) non deve alterare le aree di gioco.

> **Stato 2026-09-09:** ✅ verificata dai test unitari esistenti
> (`tests/unit/astrolabe` — 29 test verdi, incluso il feasibility check V63).
> Il test Monte Carlo esplicito su `bigwin`/`almost`/`epicfail` campionato vs.
> percentuali di config resta un'aggiunta F5 non ancora scritta.

## 6. Rischi e mitigazioni

| Rischio | Mitigazione |
|---------|-------------|
| Touchare `engine.ts` rompe la fisica tar-goo | isolare i cambi in hook `onState`; non toccare `tick`, `rCheckAt`, `rStarAt`. |
| Skill labels coprono il gameplay mobile | posizionarle sul perimetro bronzo, nasconderle sotto 480px se troppo piccole, attivabili da config. |
| THROW spostato rompe l’abitudine del test | mantenere click centrato opzionale nel TestHub, default nuovo in V63. |
| Nuovi testi i18n non tradotti | aggiungere stub `it-IT` con fallback inglese; `translation_missing` deve essere telemetrato, non soppresso. |
| Overload visivo con overlay + labels + card | fase `reveal` mostra progressivamente; nascondere i non attivi nelle fasi successive. |

---

## 7. Prossimo passo — decisioni già prese (sync 2026-09-09)

Le tre domande di avallo sono **state risolte dal Director durante l'esecuzione**:

1. ~~Posizione THROW~~ → **Skill Core centrale `CHECK`** (§5.9, Opzione A).
2. ~~Dettaglio frase narrativa~~ → **elenco per skill in i18n**
   (`astrolabeV63.narrative.<Skill>.<verdict>`, fallback generico) — risolto con
   `copy.narrativeFlavors`, non da `astrolabeV63Config.ts` perché i testi utente
   devono passare da `react-i18next`, non da config hardcoded.
3. ~~Scope~~ → **V6.3-only lab**, nessuna propagazione a V6/V6+.

**Ordine suggerito per i punti ancora aperti:**

1. **F3 resto** — countdown auto-throw visibile + `Space`/`Enter` espliciti (chiude
   l'interazione del CHECK).
2. **F4/5.7 resto** — scrim card su sfondi chiari, climax differenziato per esito
   (il più impattante visivamente).
3. **F0 resto** — `phaseDurations` centralizzati, `useAstrolabeV63Phase.ts`,
   `astrolabeV63.types.ts` (debito tecnico, basso rischio).
4. **F2 resto** — placche SVG sul perimetro bronzo (rifinitura, non bloccante).
5. **5.8 shader** — fenditura WebGL in `tarGooRenderer.ts` (qualità, non blocco).
6. **F5** — E2E Playwright + test fasi + Monte Carlo areale + evidence log finale.
7. **Cleanup** — `astrolabe.css` residual nel working tree (commettere o rigenerare),
   `console.log` residui, `data-testid` `destiny-astrolabe-v62` da correggere in `v63`.

Validazione visiva del Director sul TestHub resta **richiesta prima di certificare**:
questo piano non copre certificazione Golden UI.
