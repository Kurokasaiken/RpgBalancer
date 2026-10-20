# F0 — Inventario /game, copertura doc e stato piani (solo lettura)

Data: 2026-10-20 · Metodo: lettura di codice, piani e RICHIESTE. **Nessuno screenshot, nessun agente.**
Tutto ciò che è marcato **[da verificare a schermo]** è un'ipotesi dal codice, non un fatto (T-04).

## 1. Cosa vede il giocatore (da `hudPanelRegistry.ts` e slot di `GameFrame.tsx`)

| Livello | Elemento | Come si apre | Visibile al giocatore |
|---|---|---|---|
| Chrome fisso | ribbon risorse (`resourcesSlot`), lastra tempo (`whenWhereSlot`), cartiglio obiettivo (`objectiveSlot`), menu (`menuSlot`), ricentra (`recenterSlot`), nascondi HUD | sempre | sì |
| Pannello | Roster V2 | tasto `r` | sì |
| Pannello | Registro eventi | tasto `e` | sì |
| Pannello | Scorta del villaggio (stash) | tasto `v` o marker mappa | sì |
| Pannello | Mercante | tasto `m` o marker mappa | sì |
| Pannello (unlisted) | Scheda eroe | tasto `p` / rail roster | sì |
| Pannello (unlisted) | Quest planner (`questDetail`) | click su POI | sì |
| Pannello (unlisted) | Quest log | `q` | sì |
| Finestra | QuestRunWindow + overlay skill check (portal) + toast esito + reward + epilogo | invio spedizione | sì |
| Mappa | POI (Sigillo), edifici, tooltip regioni, filo di rotta `QuestJourneyRoute`, marker invasione | sempre | sì |
| Dev-only | Director (`d`), Tuning (`t`), F10 «Show quest» | — | **no** (`devOnly`) |

Regola proposta per il perimetro "al giocatore": entra ciò che è raggiungibile in una build non-dev senza hook di test. `devOnly` e `__idleVillageTestHooks` restano fuori.

## 2. Documentazione: la richiesta «se non c'è, creala» è in gran parte già soddisfatta

`src/docs/docs/idle_village/game_surface_coverage.md` (generato da `npm run surface:coverage`, R-232) dichiara 254 unità, **254 con doc, 254 con contratto, 12 a copertura zero**. Esistono anche `COMPONENT_MASTER_INDEX.md`, 252 contratti in `.mw/contracts/components/`, `quest_ui_component_guide.md`, `skill_check_workflow_spec.md`, `poi_*_spec.md`, `roster_slot_*`, `PLAN-032-SP-*` (stash/merchant).

Conseguenza: scrivere nuova doc per ogni pezzo creerebbe una terza fonte di verità. Il lavoro utile è **verificare se queste doc dicono il vero a schermo** e riempire solo i buchi (le 12 unità a copertura zero, da elencare in F0b).

Attenzione: «con doc» nella matrice significa che *un file cita l'unità*, non che la descrive bene. È una metrica di presenza, non di correttezza.

## 3. Stato onesto dei piani

### POI — il plan «non finito»
- PLAN-004 (regressioni POI quest) e PLAN-005 (POI family AI-friendly): `completed`, chiusi 2026-10-18. Non sono loro.
- Il filone ancora aperto è **PLAN-043-S11 «Tutti gli altri componenti»** (`active`): una scheda per componente, poi decisione Director **D9** per ciascuno (tenere/rifare/unire/togliere). Include il **colore degli anelli del Sigillo POI** (Gate F4 di PLAN-058) e l'addendum Director 2026-10-19 sul **reveal dei POI** («non dà abbastanza presenza»). **Attende te.**
- PLAN-043-S1, S2, S4 e S12 sono `active` con gate Director aperti (scambio slot, menu/bag, E2E goblin, riesame).
- Quindi la tua impressione è corretta: non è un plan fermo per errore, è fermo su decisioni D9 non prese.

### QuestRunWindow — R-231 (9 segnalazioni tue)
- PLAN-060 (input/frontier) e PLAN-061 (formato immagine): fatti, bundle PASS.
- PLAN-062 (barra progresso/checkpoint), PLAN-063 (chrome/layout), PLAN-064 (animazione post-entrata): **il file del piano dice `draft`, `plans/INDEX.md` dice `in corso`, RICHIESTE dice «implementazione consolidata»**. Tre fonti, tre stati. Divergenza da riconciliare prima di fidarsi di qualsiasi «fatto».
- PLAN-064 è la «parte più importante» per te e resta l'unica con eye-check Director mancante. RICHIESTE ammette: *«nella coppia statica il movimento resta sottile»*.
- `closure:lint` è andato oltre i 30s ed è stato fermato: nessuna chiusura dichiarata.

## 4. Le tue segnalazioni sul skill check, lette nel codice (ipotesi)

File: `components/gameFrame/QuestSkillCheckOverlay.tsx`.

| Segnalazione | Cosa dice il codice | Esito |
|---|---|---|
| «si blocca al risultato» | Dopo il verdetto la plancia resta finché non fai click, Esc o X. `verdictAutoDismissMs: 0` in `gameFrameConfig.ts:907`, quindi nessun auto-avanzamento. Il click si arma dopo `dismissArmDelayMs: 350`. | **Non è un blocco: è un design** (PLAN-040, «click-to-dismiss»). Ma può essere vissuto come blocco se non c'è un affordance visibile «Continua». **[da verificare a schermo]** |
| «non ha il pulsante per lanciare» | L'overlay chiama `throw()` da solo se `bridge.autoThrow` (skipIntro). Altrimenti è l'astrolabio (`DestinyAstrolabeV62`) ad avere il suo arm di lancio. Tre checkbox Skip/Auto/No Sound esistono (memoria progetto). | Il pulsante esiste solo se l'astrolabio lo mostra con auto spento. **Non so quale sia il default in /game.** **[da verificare a schermo]** |
| «sembra tagliato» | La doc dell'overlay riconosce che il kit, disegnato più grande, era *clipped su tre lati* a 240px (PLAN-043 T3.2) e lo ha sostituito con larghezza esplicita. Sotto il minimo la plancia scorre internamente. | Possibile residuo a viewport bassi. **[da verificare a schermo, 1280×800 e altezze piccole]** |
| «non abbastanza cinematografico» | Asse `taste`. Non decidibile da un agente. | Flag per il Director + visual-fork. |
| «barra in basso che si colora» | R-231 #4 + PLAN-062: barra = durata reale (elapsed vs dichiarata separati), tacche per fase (`questPhaseCheckpoints`). Root cause del vecchio `15/22`: `useQuestExpeditionSession` ignorava `estimatedDurationTicks`. | Dichiarato implementato. **[da verificare a schermo]** con il clock simulato. |

## 5. Ricerche online (standard, 2026-10-20)

Limiti: fonti prevalentemente blog e forum; nessuna testimonianza degli sviluppatori sulla scelta di timing.

**Cattura screenshot di canvas/WebGL/animazioni**
- `animations: 'disabled'` di Playwright riguarda solo animazioni CSS/Web Animations; **non** i loop canvas/WebGL/rAF. Fonte: [guida Playwright screenshot](https://qaskills.sh/blog/playwright-screenshot-animation-caret-disable).
- `page.clock` sostituisce `requestAnimationFrame`, `setTimeout`, `Date`, `performance`, e permette `pauseAt`/`runFor` per fermare e far avanzare il tempo. Va installato prima della navigazione. Fonti: [Playwright Clock API](https://playwright.dev/docs/api/class-clock), [guida clock](https://qaskills.sh/blog/playwright-clock-time-control-testing-guide). La combinazione clock + screenshot su canvas è **mia inferenza, non confermata da una fonte**: va provata sul pilota.
- Ricetta pratica: seme e sorgente di tempo fissati, segnale di "pronto" specifico dell'app (non attese a tempo), cattura dell'elemento canvas a viewport e scale factor fissi, tolleranza piccola nel confronto. Fonti: [test visuale per giochi](https://www.abratabia.com/game-testing/visual-testing.php), [asserzioni pixel su canvas](https://qaskills.sh/blog/playwright-canvas-pixel-assertion-testing), [WebGL headless](https://www.createit.com/?p=3319).

**Presentazione dello skill check nel genere**
- Baldur's Gate 3: i check importanti (scasso, dialogo) hanno una schermata grande con i modificatori selezionabili; l'animazione è saltabile ma la scelta dei bonus no; l'audio è teatrale, tipo slot machine. Fonte: [Game Developer](https://www.gamedeveloper.com/design/what-works-and-doesn-t-work-about-baldur-s-gate-3-s-use-of-d-d-systems) e [thread Steam](https://steamcommunity.com/app/1086940/discussions/0/3808408963762874297/?ctp=8).
- Disco Elysium: probabilità al passaggio del mouse, effetto breve, esito, **nessun «Continua» dopo un fallimento** (opinione di giocatori: scoraggia il save-scumming). Colore dello schermo verde/rosso all'esito. Fonti: [thread Steam](https://steamcommunity.com/app/632470/discussions/0/1697221074199323422), [case study UI](https://tommartin.myblog.arts.ac.uk/?p=168).
- Non trovato nulla su Pathfinder: Wrath of the Righteous.
- Lettura per te (cappello `game_director`, asse `taste`, **solo proposta**): i due giochi risolvono diversamente la tensione tra spettacolo e ritmo. Il tuo «click per proseguire» è più vicino a BG3 che a Disco; se il problema percepito è «mi blocca», l'alternativa a un auto-avanzamento è un affordance esplicito, ma decidere tra le due direzioni è un **visual-fork** da portarti, non una scelta dell'agente.

## 6. Cosa NON è stato verificato
- Qualsiasi comportamento a schermo. Nessun dev server avviato in questo passo.
- Se le 254 «doc» della matrice dicono il vero.
- Elenco delle 12 unità a copertura zero.
- Default di `autoThrow` in /game e stato reale di PLAN-062/063/064 nel codice.

## 7. Asse aggiunto dal Director (2026-10-20): qualità AAA di layout e coerenza

Richiesta: esaminare layout, posizionamento, coerenza tra icone, centratura, ecc.; il livello è «adeguato a una compagnia di videogame AAA». Entra in ogni scheda componente come asse proprio, separato dalla correttezza funzionale.

**Cosa si misura (meccanico, `correctness`)** — su ogni screenshot e via DOM a 1440×900 e 1280×800:
- Centratura: scarto tra centro del box e centro del contenuto (icona nel bottone, testo nella pillola, gruppo di icone nella plancia chiusa). Soglia da fissare in F1, p.es. ≤1 px.
- Allineamento: bordi e baseline condivisi tra elementi vicini; margini ai bordi schermo coerenti (la segnalazione #7 di R-231 è già un caso di questo tipo).
- Griglia e ritmo: spaziature ripetute (valori distinti usati) e scala tipografica (quanti corpi testo diversi).
- Icone: dimensione renderizzata, peso del tratto, padding nel riquadro, ingombro ottico. Risultato atteso: una tabella icona × (px, tratto, set di origine).
- Overflow e clipping: qualsiasi contenuto con `scrollWidth > clientWidth` o tagliato dal contenitore.
- Coerenza di stato: hover/focus/disabled presenti e uniformi tra componenti dello stesso ruolo.

**Cosa si giudica (visivo, `taste`)** — armonia, peso visivo, «sembra un prodotto unico?». È il confronto con il Roster V2, che `hud_component_guide.md` fissa come riferimento. Sono flag per il Director, mai decisioni dell'agente, con confronto affiancato.

**Rischio già visibile dal codice (ipotesi, [da verificare a schermo])**: le icone arrivano da almeno 6 sorgenti separate (`hudIcons.tsx`, `engravedIcons.tsx`, `villageBuildingIcons.tsx`, `merchantOfferIcons.tsx`, `villageStashItemIcons.tsx`, `icons/statIcons.tsx`), più i glifi del Sigillo POI. Il rischio di incoerenza di tratto e scala è concreto. Il progetto vieta già «pallini, anelli, spunte da UI kit» (hud_component_guide §1, regola 6b): la coerenza AAA va letta anche contro quella regola.

**Bar AAA, da dichiarare prima di giudicare**: «AAA» non è una misura. In F1 propongo una scheda di 8-10 criteri osservabili (p.es. nessuna icona fuori asse >1 px, un solo set di tratto per ruolo, nessun clipping a 1280×800, ritmo di spaziatura su una scala a pochi valori). Serve il tuo ok sui criteri, altrimenti il giudizio dell'agente diventa opinione.

**Effetto sul piano**: F1 produce anche lo strumento di misura (script DOM che emette box, centri, scarti, tabella icone) accanto all'harness screenshot. Ogni scheda componente guadagna la sezione «Polish AAA» con i numeri misurati e i flag di gusto separati.

### 7.1 Scheda criteri AAA (PROPOSTA, in attesa di ok Director — soglie da calibrare in F1)

Necessari, non sufficienti: superarli non dimostra «AAA», fallirli sì dimostra un difetto. Misura = DOM/computed style/pixel a 1440×900 e 1280×800. C1–C9 `correctness`, pass/fail. C10 `taste`, flag.

| # | Criterio | Misura | Soglia proposta |
|---|---|---|---|
| C1 | Centratura | scarto centro box ↔ centro contenuto (icona nel bottone, testo nella pillola, gruppo nella plancia chiusa) | ≤ 1 px |
| C2 | Allineamento e margini | bordi/baseline condivisi nel gruppo; elementi speculari a margini simmetrici dai bordi schermo | ≤ 1 px nel gruppo, ≤ 2 px speculari |
| C3 | Ritmo e tipografia | valori distinti di gap/padding e di corpo testo per componente, contro i token `--skin-hud-*` | ≤ 6 spaziature, ≤ 4 corpi; nessun letterale fuori token; testo ≥ 12 px |
| C4 | Coerenza icone | per ruolo (header, azione, stato, oggetto): px renderizzati, peso tratto, padding nel riquadro, set di origine | 1 set per ruolo, tratto ±10%, stessa scala; nessun «cerchio con simbolo» (guida HUD, regola 6b) |
| C5 | Clipping e scroll | `scrollWidth/Height` vs `client*`, contenuto fuori dal contenitore | zero tagli non dichiarati; scroll interno solo dove il contratto lo prevede |
| C6 | Contrasto e gerarchia | contrasto testo/fondo da pixel; un solo elemento primario per vista | ≥ 4.5:1 testo, ≥ 3:1 icone/grandi; 1 primario |
| C7 | Stati | riposo, hover, focus visibile, attivo, disabilitato; target interattivo | tutti presenti e con la stessa grammatica per ruolo; target ≥ 32 px |
| C8 | Occupazione e sovrapposizioni | % schermo coperta dalla HUD a riposo; collisioni tra pannelli; fissi sopra la terra | ≈ 18%, tetto 1/3; zero collisioni; fissi non coprono la terra (guida HUD regole 5, 7, 8) |
| C9 | Moto | durate/easing usati, rispetto di `prefers-reduced-motion`, assenza di scatti (frame in sequenza) | set di durate/easing condiviso; reduced-motion statico |
| C10 | Famiglia col Roster V2 | affiancato al Roster: bordo, lacca, raggi, densità | flag `taste`, decide il Director |

Limiti dichiarati: il contenuto dentro il canvas Pixi (POI, mappa) non è misurabile via DOM, si valuta solo da pixel; C9 richiede sequenze di frame e `page.clock`, da provare in F1.

## 8. Segnalazione 6 (Director, 2026-10-20): l'animazione idle finale dello skill check si congela

**Causa trovata nel codice (fatto da lettura, [da verificare a schermo] che sia quella che vedi):** il congelamento è **voluto** ed è un compromesso di prestazioni.
- `destinyAstrolabeV62/engine.ts:919-927` — dopo il verdetto, con `settledIdle`, l'engine respira per `settledIdleDelayMs` (default **700 ms**), poi `cancelAnimationFrame` e marca `astroIdle='parked'`. Da lì **0 ridisegni/s**: l'ultimo frame resta fermo finché non arriva `redrawOnce()` o un nuovo `roll()` (witness BV-04, PLAN-043 WS-4).
- `pages/game-frame-pixi.tsx:1527` passa `checkInColumn={!!clusterGeometry}`: quando esiste la geometria del cluster (3-Zone Stage, il caso normale su `/game`), lo skill check si dipinge in `QuestSkillCheckColumn.tsx:246`, che passa `settledIdle`. Quindi **su /game il congelamento è il percorso di default**.
- L'altro percorso, `QuestSkillCheckOverlay.tsx:362` (portal, senza `settledIdle`), non parcheggia il loop: lì l'idle continuerebbe. I due percorsi hanno dunque comportamenti diversi per lo stesso componente.

**Perché è un problema di design, non solo un bug:** la spec di WS-4 ha scambiato la vita dell'ultimo frame con il risparmio di CPU/GPU mentre la carta del verdetto è tenuta ferma. Per te il risultato è l'opposto di «cinematografico» proprio nel momento in cui il giocatore guarda l'esito.

**Fatti collegati emersi da questa lettura (ipotesi):**
- L'overlay monta `DestinyAstrolabeV62Standalone` con `autoStart` e `removeSounds`: usa la V6.2, **non** V6.3/V6.4, che sono le versioni con le tre checkbox Skip/Auto/No Sound. Questo può spiegare «non ha il pulsante per lanciare» (`autoStart` lancia da solo) ma va visto a schermo.
- Sotto il verdetto c'è solo un testo `dismissHint` in corsivo da 12 px: l'unico affordance per proseguire. Rilevante per «si blocca al risultato».

**Opzioni per il Director (visual-fork necessario, nessuna scelta dell'agente):**
1. Non parcheggiare: idle vivo a costo di CPU/GPU, con un tetto di frame rate.
2. Idle ridotto: un loop leggero (poche tracce, frame rate basso) al posto del parcheggio totale.
3. Parcheggio con uscita animata: la carta chiude con un gesto finale invece di restare ferma.
Vincoli da non rompere: BV-04 (zero ridisegni quando parcheggiato), `prefers-reduced-motion`, `redrawOnce()` sul resize, il test `astroIdle=parked`.
