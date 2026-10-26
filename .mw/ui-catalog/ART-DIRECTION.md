# ART-DIRECTION — rubrica condivisa (PLAN-086, rev 4 — BOZZA)

> **Stato:** bozza del 2026-10-26, **non in uso** finché il Director non
> approva (gate per-revisione: ogni revisione passa al Director prima
> dell'uso). La rev 3 resta in git (`git show HEAD:.mw/ui-catalog/ART-DIRECTION.md`).
> Le decisioni aperte sono in fondo (§ Decisioni aperte, D-1…D-8): finché
> una D-n è aperta, nessun mockup né digest la dà per risolta.

## Come si usa questa rubrica

- **Precedenza:** (1) ruling del Director (registro sotto) → (2)
  `src/docs/docs/design/hud_component_guide.md` e `DESIGN_PILLARS.md` →
  (3) questa rubrica. La rubrica **riassume** la guida per giudicare; non
  è una seconda guida. Se diverge dalla guida, la rubrica è sbagliata.
- **Solo a valle:** serve a digest, ranking e controllo dei mockup. **Mai
  iniettata nel prompt di critica** (R-282/prompt).
- Ogni riga porta la sua fonte tra parentesi quadre. Una riga senza fonte
  non è una regola.

## Livello 1 — Vincoli immutabili (mai violabili, neanche su proposta)

**Riferimento**
- Il risultato deve **sembrare il Roster V2**: stesso bordo, lacca,
  raggi, scala tipografica, densità. Prova: componente accanto al Roster
  a 1440×900 [guida §1; Director 2026-10-13].
- Skin di riferimento = **`base`** (lacca petrolio scura
  `--skin-hud-lacquer-*` `#0f2a35`→`#060f16` + ottone NMM). **Lacquer
  Atlas è bocciata**: niente «lacca teal», `lacquer_atlas` resta solo
  preset selezionabile [Director 2026-10-16, RICHIESTE riga «Lacquer
  Atlas è stata bocciata»].

**Stile**
- Pittorico fantasy: cartografia dipinta, china+acquerello, colori caldi,
  luce drammatica [DESIGN_PILLARS r.30]. Per «cornice intagliata
  (gargoyle/drago)» vedi **D-3**.
- Superfici HUD = `HudPlaque` + token `--skin-hud-*`; un tema è un preset
  in `skinConfigRegistry`, mai CSS ad-hoc [guida §1 regole 10, 13].
- Nessun flat design: ogni superficie ha luce, grana, peso [guida §1.6].
- **Fantasy, mai generico**: niente pallini, anelli, dischetti di stato,
  spunte/croci da UI kit, semaforo verde/rosso. Uno stato si dice con la
  **sagoma di un oggetto** (scintilla, occhio, clessidra, lucchetto di
  ferro, lame incrociate) tagliata nella materia. Un cerchio con dentro un
  simbolo va rifatto [guida §1.6b; Director 2026-10-13].
- Niente foglie, «oggettini», legno/corde/paglia usati alla lettera come
  UI [guida §1.1, bocciati due volte].
- Metalli **opachi** e consumati (NMM), mai lucidi; niente oro
  semitrasparente sulla lacca (vira al kaki) [guida §1.2, §1.4].
- Ombre **teal profondo**, mai grigie o marroni; **niente marrone** in controlli, bottoni e superfici HUD (anche l'ottone resta ottone, non bronzo-marrone) [guida §1.3; bibbia «NO grey, NO brown»; Director 2026-10-26].
- Niente sospensione fisica (perni, catene, ferramenta «appeso»).
  Attenzione: la forma `HudPlaque shape="hang"` (lastra che scende dal
  bordo) **non** è ferramenta ed è ammessa [R-282/hud-tabs-2; guida §6b].
- Niente pannelli monumentali: HUD a riposo ≈18% dello schermo, tetto
  duro 1/3; la mappa è l'eroe [guida §1.5].

**Colore**
- **Mai viola** né derivati (violetto, magenta) **nella UI**: pannelli, componenti, pulsanti, testo, icone, stati, morte compresa. **L'arte (scene, personaggi, mood-board, prompt di generazione) può usarlo liberamente** [Director 2026-10-20 e 2026-10-26]. Morte =
  ferro freddo `#93a4ad` [Director 2026-10-20; COL-D = B, PLAN-068].

**Controlli**
- **Placca CTA vietata ovunque** (`SkinButton variant="cta"`, smalto
  verde acqua + cornice ottone + bisello). Azione primaria = **lastra di
  famiglia**, una sola per schermata [Director 2026-10-20; BTN-1 = A,
  2026-10-22; guida §Pulsanti].
- Tre ruoli soli: primaria (lastra di famiglia), comando di testata
  (pillola `data-hud-controls` 26 px), utilità (`SkinButton`
  utility/secondary) [guida §Pulsanti].

**Tipografia**
- Cinzel (titoli, voci, etichette ≤3 parole) + EB Garamond (frasi, mai
  maiuscolo); mai font di sistema sulle superfici di gioco [guida §4.3].
- **Minimo 12 px per qualunque testo**; numeri `tabular-nums` [guida
  §4.3].

**Testi**
- Ogni stringa da i18n (`en` + `it-IT`); nei mockup solo placeholder
  `{i18n:key}` marcati [guida §1.11].
- Niente testo sull'arte di scena/teatro [R-245].

**Layout e accessibilità**
- I fissi (ribbon, nav, coin) non coprono la terra; i fluttuanti sì, ma
  chiudibili/spostabili. Nessuna sovrapposizione a 1440×900 e 1280×800
  [guida §1.7–8].
- La mappa non si muove mai per un pannello [guida §5b.7; Director
  2026-10-14].
- Stato mai solo a colore: colore **più** forma o testo; un elemento
  bloccato resta leggibile (velato) [guida §5].
- Focus visibile; `prefers-reduced-motion` rispettato [guida §5, §Vita
  della mappa].
- Target interattivi: 26 px desktop, ≥44×44 in modalità mobile-fit
  [guida §5, §6c] — lettura da confermare in **D-5**.

## Livello 2 — Preferenze forti + anti-pattern (violabili solo con argomento esplicito al Director)

Anti-pattern da respingere:
- Flat minimal / material design / glassmorphism.
- Neon, gradienti cyber, ombre colorate generiche.
- Dashboard chrome SaaS (card bianche arrotondate, shadow-stack).
- Emoji o glifi unicode (▶ ◆ ✦ …) come pittogrammi.
- Sans-serif moderno sui contenuti di gioco.
- Micro-interazioni da app (skeleton loader). Per bounce/overshoot/
  confetti vedi **D-6**: oggi la guida game feel li prescrive.

Preferenze (dalle critiche libere R-282, convergenti 3/3 su più componenti):
- **La decorazione non pesa mai più dell'informazione che contiene.** Tre
  livelli: (1) stato/rischio, (2) orientamento/azioni, (3) decorazione.
  Contrasti e accenti riservati al livello 1.
- **Stato critico multicanale:** sagoma + testo + tono insieme, e peso
  maggiore (dimensione/movimento), non un bordino.
- **Il normale non parla, l'eccezione sì**: l'etichetta di stato compare
  solo fuori dal normale; «100/100» solo se non al massimo [guida §4.4].
- **Microcopy semantica, non conti alla rovescia:** a 0 risorse il testo
  dice la conseguenza («Carestia»), non «0 d left». Il passaggio a
  critico è un evento di gioco (pausa + azione verso la soluzione).
- **Chip risorsa a larghezza minima fissa**, anatomia unica (icona,
  valore tabular, tasso, stato): il layout non salta.
- **Icona + valore attaccati** (gap 6–8 px), mai ai due capi della lastra
  [guida §4.4].
- **Ornamento al servizio della gerarchia**: l'oro su tutto non segnala
  niente; ottone riservato a selezione e azione attiva.
- **Effetto prima del flavor:** dove il giocatore decide (registro,
  mercante, magazzino) lo slot principale porta costo/effetto; il flavor
  va nel tooltip.
- Per «materia nella cornice» (Gemini) vedi **D-2**; per alone come
  segnale vedi **D-4**; per icone dipinte o incise vedi **D-1**.

## Registro ruling Director (precedono e vincono su tutto)

| ID | Data | Ruling |
|---|---|---|
| R-282/prompt | 2026-10-24 | Prompt di critica = solo il testo verbatim in `critique-prompt.txt`. Niente rubrica, schema o osservazioni guidate a monte. Motivo: il prompt libero ha dato critiche più ricche della versione arricchita (verificato a confronto). |
| R-282/hud-tabs-1 | 2026-10-24 | Vietato alone/luce colorata dentro la cella cibo (la «brace ambra interna» era già scartata). |
| R-282/hud-tabs-2 | 2026-10-24 | Vietata la sospensione fisica (perni, catene, ferramenta «appeso») sulle placche HUD: «brutto e stupido». |
| R-282/hud-tabs-3 | 2026-10-24 | Selettore velocità a tacche con perla approvato **senza** guida/binario d'ottone; componente giorno (placca DAY + emblema) invariato. |
| R-282/hud-tabs-4 | 2026-10-24 | Placche sinistra/destra della stessa dimensione e più lontane dai bordi; **terzo tab centrale** sempre presente (amendment al contratto renders-null di NextEventTab: stato vuoto se nessun evento). |
| skin-base | 2026-10-16 | Lacquer Atlas bocciata; riferimento = skin `base` scura. |
| CTA / BTN-1 | 2026-10-20 / 22 | Placca CTA vietata ovunque; sostituta = lastra di famiglia (A). |
| viola / COL-D | 2026-10-20 / 23 | Mai viola; morte = ferro freddo `#93a4ad` (B). |
| roster-base | 2026-10-13 | Il Roster è la base di tutti i componenti; le guide mirano a quello. |
| fantasy-6b | 2026-10-13 | «il pallino davanti alla freccia è orribile»: niente elementi generici da UI kit. |
| brushwork-1 | 2026-10-26 | HUD = pulita (opzione A). Racconto = vignetta dipinta ad hoc in cornice (opzione B). Il marrone è bandito da Wanderlust DNA e guide, bottoni compresi. |
| icons-1 | 2026-10-26 | D-1 = B: cose del mondo (edifici, risorse, oggetti) dipinte; comandi e stati incisi. |
| halo-1 | 2026-10-26 | D-4 = A: alone solo sui marker della mappa; nell'HUD stato con sagoma + testo + filetto pieno. Il registro edifici sta nella schermata Villaggio. |
| motion-1 | 2026-10-26 | D-6 = A: movimento sobrio nell'HUD, senza overshoot né particelle. `game_feel_design_guide.md` va riallineata (oggi prescrive spring/overshoot/confetti). Il registro edifici sta solo nella schermata Villaggio, mai sulla mappa (verificato: `VillageRegistry` è montato solo in `VillageScreenView`). |
| targets-1 | 2026-10-26 | D-5: 26 px desktop, ≥44 px in mobile-fit (lettura attuale approvata). |
| ranking-1 | 2026-10-26 | D-7: l'AI controlla le regole, il Director decide il gusto a vista. |
| prompt-2 | 2026-10-26 | D-8: prompt di critica verbatim, nessun dossier. |
| purple-3 | 2026-10-26 | D-9: viola vietato nella UI (pannelli, componenti, pulsanti, testo, icone, stati); libero nell'arte. Sostituisce la lettura errata «ovunque» (purple-2, annullata). |
| nav-1 | 2026-10-26 | nav-bar = M1: quattro slot di larghezza uguale; i bloccati dicono il requisito («Req · Lv 2»); stato attivo su tre canali (fondo, filetto, etichetta); il recenter esce dalla barra. |
| corner-1 | 2026-10-26 | hud-corner: dock unico con 4 comandi (recenter, menu, pannelli con badge, nascondi) e tasti rapidi; menu senza il doppione «Pannelli»; con HUD nascosta solo l'icona dell'occhio chiuso, senza etichetta. |
| mappa-ferma | 2026-10-14 | La mappa non si muove mai per un pannello. |

## Livello 3 — Giudizi contestuali (richiedono il Director)

- Nuovo linguaggio di ornamento non presente nei frozen kit.
- Cambio di gerarchia informativa dentro una regione contrattata.
- Eccezioni agli anti-pattern di livello 2.
- Mockup `structural` (cambiano interazione/layout, non solo reskin).
- Il **gusto** di un mockup: lo decide il Director. Il ranking AI non lo
  sostituisce (vedi **D-7**).

## Slice per surface-tag (selezione deterministica, per digest e controllo)

- `hud_cluster|panel|control` → L1 + L2 + guida §4 (token) e §5 (controlli).
- `overlay` → L1 + L2 + regole z-index/portaling note.
- `marker|map-overlay` → L1 + L2 + pilastro «stato sul mondo, non pannelli».
- `view` → tutto + note di composizione a schermo intero (guida §6b).
- Pagine di prosa (amanuense): + invariante reading-rect (prosa ≥48ch
  @≥1920, ≥40ch @1480–1700, pergamena ΔL≤3%) [PLAN-085]. **Non** vale
  per HUD e pannelli.

## Formato del digest (a valle — non si chiede ai critici)

Il critico risponde liberamente al prompt verbatim. È **il digest** che:
- cita l'asse della rubrica violato o rispettato, con la fonte;
- separa `quick_wins` da `structural`;
- registra ≥2 fatti visivi osservati per provider (controllo di lettura
  sbagliata) e mette in quarantena le letture sbagliate;
- conta la convergenza (n/3) e conserva i disaccordi verbatim;
- segnala ogni proposta che viola un ruling del registro, senza
  rilanciarla.

## Controllo dei mockup (prima che arrivino al Director)

Un mockup non esce se:
- è visibilmente sotto la produzione corrente nello stesso stato
  (confronto affiancato a 1:1 sullo screenshot in contesto);
- viola una riga di Livello 1 o un ruling del registro;
- usa colori o misure fuori token, glifi unicode come icone, o testo
  fisso senza placeholder i18n.

## Decisioni aperte (Director)

Ogni voce: contraddizione trovata, fonti in conflitto, opzioni. Nessuna
opzione è marcata come raccomandata.

- **D-1 — RISOLTA 2026-10-26: B (due livelli).** Cose del mondo dipinte, comandi e stati incisi. Vedi registro `icons-1`.
- ~~**D-1 — Icone: dipinte o incise?**~~ (testo originale) La rev 3 diceva «glifi incisi»
  ovunque, citando INV-1 B; ma INV-1 B (PLAN-067 T-B8) riguarda solo
  l'icona dell'oggetto uguale in tray, magazzino e mercante. La
  produzione usa icone risorse dipinte nella barra in alto; Gemini chiede
  icone pittoriche; R-177 proponeva due livelli. Opzioni: (A) tutto
  inciso; (B) due livelli: dipinte per le cose del mondo (risorse,
  oggetti, edifici), incise per comandi e stati; (C) tutto dipinto.
- **D-2 — Materia dentro i pannelli (Gemini).** *(Parzialmente informata da `brushwork-1`: sull'HUD «pulita», sul racconto vignetta dipinta in cornice. Resta aperta la parte fregi/borchie sulla banda.)* Gemini chiede tela/
  pergamena marcata dentro i box, oro sbeccato, borchie di ferro battuto,
  fregi agli angoli. In conflitto con: lacca + grana 6% della skin
  `base` (guida §4.1), «niente oggettini» (§1.1), «niente pannelli
  monumentali» (§1.5), divieto di ferramenta (hud-tabs-2). Opzioni: (A)
  nessun cambio: la materia è la lacca e la banda NMM; (B) materia solo
  nella cornice: fregi angolari incisi nella banda ammessi, niente
  borchie, dato su fondo pulito; (C) texture tela/pergamena dentro i
  pannelli.
- **D-3 — «Cornice intagliata (gargoyle/drago)» (DESIGN_PILLARS r.30) vs
  HUD a placche.** Tensione già segnalata da R-177. Opzioni: (A) vale per
  la cornice esterna dello schermo e per le schermate a pagina intera,
  non per le placche HUD; (B) vale anche per le placche principali
  (ribbon, nav); (C) va tolta dal pilastro.
- **D-4 — RISOLTA 2026-10-26: A (alone solo sui marker della mappa).** Director: «ma dovrebbe esserci un'altra schermata per quelle cose, non sulla mappa» → il registro edifici vive nella schermata Villaggio, non come pannello sulla mappa. Vedi registro `halo-1`.
- ~~**D-4 — Alone come segnale.**~~ (testo originale) La rev 3 diceva «stato comunicato da
  halo/badge»; la guida §6b vieta i dischetti e vuole la sagoma di un
  oggetto; hud-tabs-1 vieta l'alone nella cella cibo; il Sigillo POI di
  R-177 (non ratificato) usa l'alone per la valenza. Opzioni: (A) alone
  vietato nell'HUD, ammesso solo sui marker della mappa; (B) vietato
  ovunque; (C) ammesso come rinforzo secondario dove non c'è dato dentro.
- **D-5 — RISOLTA 2026-10-26: approvata la lettura attuale** (26 px desktop, ≥44 px in mobile-fit). Registro `targets-1`.
- ~~**D-5 — Dimensione dei target.**~~ (testo originale) Guida §5: pillole 26 px su desktop.
  Guida §6c: «≥44×44 su ogni elemento interattivo» nelle regole
  mobile-fit. La rev 3 diceva «≥44px» senza contesto. Opzioni: (A) 26 px
  desktop, 44 in mobile-fit (lettura attuale); (B) 44 ovunque (tutte le
  pillole vanno rifatte).
- **D-6 — RISOLTA 2026-10-26: A (sobrio) nell'HUD.** Dissolvenze brevi, nessun rimbalzo né particelle. Livello «momenti di racconto» ancora da dichiarare. Vedi registro `motion-1`.
- ~~**D-6 — Movimento: bounce e confetti.**~~ (testo originale) La rubrica li vieta come «da
  app»; `game_feel_design_guide.md` li prescrive (spring, overshoot,
  squash-stretch, `particles: "confetti"`). Il tono «sobrio,
  conseguenziale, frontiera» pende per il divieto; la richiesta di quest
  «cinematografica, shake, suoni» (F5) pende per più movimento. Opzioni:
  (A) vietati nell'HUD, ammessi nei momenti di ricompensa/scena; (B)
  vietati ovunque e la guida game feel va riscritta; (C) ammessi come da
  guida game feel.
- **D-7 — RISOLTA 2026-10-26: A.** L'AI controlla solo le regole (viola, glifi unicode, testo <12 px, marrone); il ranking di gusto lo fa il Director a vista. Registro `ranking-1`.
- ~~**D-7 — Chi classifica i mockup.**~~ (testo originale) Su hud-top-tabs il ranking AI ha
  scelto all'unanimità C (placche appese) fusa con A (brace nella cella
  cibo): proprio le due che il Director ha poi vietato. Opzioni: (A) il
  ranking AI sparisce, l'AI fa solo il controllo delle regole; (B)
  ranking AI mostrato **dopo** la scelta del Director, come confronto;
  (C) invariato.
- **D-8 — RISOLTA 2026-10-26: A (prompt verbatim invariato).** Director: la richiesta di prompt potenziati era una svista, R-282/prompt resta. Il dossier allegato non è adottato. Registro `prompt-2`.
- ~~**D-8 — «Prompt potenziati» vs R-282/prompt.**~~ (testo originale) Il Director chiede ora
  critiche «con cappello» e prompt potenziati; il ruling del 24/10 fissa
  il prompt verbatim perché la versione arricchita aveva reso peggio.
  Opzioni: (A) prompt verbatim invariato; (B) prompt verbatim invariato +
  dossier allegato come file (genere, pubblico, pilastri, riferimenti,
  ruling con immagini), prima in A/B su 2 componenti; (C) nuovo prompt
  scritto dal Director.

- **D-9 — RISOLTA 2026-10-26: viola vietato nella UI, libero nell'arte.** Director: «non ho detto ovunque, solo per pannelli, componenti, pulsanti, ecc. Per arte e cose del genere va benissimo» (rettifica della mia lettura precedente «ovunque»). I riferimenti viola/magenta del mood-board e la chiave Prismatic restano validi. Registro `purple-3`.
