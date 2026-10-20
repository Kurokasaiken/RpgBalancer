# F3 — Schede: Hero sheet · Mercante · Vista Village e Registro (Opus, 2026-10-20, R-234)

> Formato F2 compatto. Evidenze: `shots/more-f3/` (+ `crops/`), 1440×900. Legenda: **FATTO** · **FLAG** · **NON VERIFICATO**.

---

## A. Hero sheet («la scheda del personaggio»)

**Cosa è.** La scheda di un eroe: ritratto, classe, HP e stamina, statistiche di attacco, difesa e utilità. Si apre passando sul roster, accanto alla scheda. Si può fissare (📌) e scorrere (‹ ›). Read-only (PLAN-032 SP-1). File: `components/gameFrame/HeroSheetPanel.tsx`, controller `useHeroSheet.tsx`, view-model `heroSheetViewModel.ts`.

**Cosa si vede (FATTO, `crops/hero-zoom.png`):**
- Testata: nome in oro, «AVAILABLE» **verde**, tre bottoni di tre forme diverse (‹ grigio spento, 📌 oro pieno, › oro pieno) e la X in un cerchio.
- «HERO ASSASSIN» in **ciano**; HP barra **verde**, STA barra **ciano**.
- Tre blocchi di statistiche: OFFENSE in **cremisi**, DEFENSE in **ciano**, UTILITY in **verde**. Corpo in **sans-serif** (system-ui), valori colorati per categoria. Icone minuscole di forme diverse, alcune sono **pallini** (Evasion, Regen, Cooldown, Lifesteal).
- **Molti zeri**: Armor 0, Ward 0, Thorns 0, Energy Shield 0, Resist. Pen 0%, Block 0%, Regen 0, Lifesteal 0%, Cooldown 0%, Cast Speed 0%. 10 righe su 20 dicono «niente».
- Il tasto **P** (ingresso «sticky» documentato in `useHeroSheet.tsx:59`) nella cattura non ha aperto la scheda. **NON VERIFICATO** se è un bug o un toggle che l'ha chiusa.

**Doc vs realtà:**
- La guida HUD §1 dice che ogni pannello deve sembrare il Roster: il Roster è serif e ottone, la scheda è sans e tricolore. **CONTRADDIZIONE.**
- Regola 6b (pallini, semaforo verde/rosso): **FAIL.**
- Il commento del componente dice «One accent per stat category — the only place color carries meaning». È coerente col codice, ma è proprio la scelta che crea il semaforo.

**Critica.**
- **`ui_developer`:**
  1. Tipografia e materia della famiglia Roster.
  2. Una sola grammatica di bottoni.
  3. Niente pallini: icone incise monocrome.
  4. Il colore della categoria nel filetto di sezione, non nei valori.
- **`game_director`, FLAG:** è un dump di statistiche da ARPG, non il ritratto di un eroe. Due direzioni:
  - (A) **«Ritratto e tre virtù»**: ritratto grande, tre numeri che contano per le quest (le stat derivate di QUEST_RULES), il resto a richiesta;
  - (B) **«Scheda d'archivio»**: pergamena con tratti, ferite, storia delle spedizioni, statistiche in coda.
  
  Gli zeri non si mostrano mai.

**Prompt potenziato.** Ruolo `ui_developer` AAA; input: hud_component_guide §1 e 6b, PLAN-032 SP-1 r003, `heroSheetViewModel.ts`, questa sezione. Scope: famiglia Roster, niente pallini né semaforo, righe a zero nascoste, verifica del tasto P. Visual fork A/B prima di cambiare la gerarchia. Test da tenere verdi: unit `heroSheet*`, `gameQuestFullFlow`.

---

## B. Mercante («Trader Rowen»)

**Cosa è.** Il pannello di un mercante: quattro offerte con descrizione evocativa, prezzo, disponibilità e un BUY. È **mock** (PLAN-032 SP-3): «PREVIEW», «preview only». File: `MerchantPanel.tsx`, `merchantOfferIcons.tsx`, `MockBuyControl.tsx`. Tasto M o pin «Market» nella vista Village.

**Cosa si vede (FATTO, `crops/merchant.png`):**
- Copy bellissimo: «Bitter green glass, sealed with wax — a wound that closes before the road turns.»
- **Prezzi in ciano** («9 gold»), non in oro; icone ciano.
- Corpo in sans-serif.
- Pillola «PREVIEW» ciano.
- **BUY disabilitato**: blocco oro con testo quasi invisibile, più «preview only» accanto, ripetuto 4 volte.
- Tra le offerte ci sono **«Field rations for the long march — 4 gold»** mentre il villaggio è a **0 cibo dal giorno 1** e il giocatore ha **15 oro**: il gioco gli mostra la soluzione e gliela nega.

**Doc vs realtà:** mock dichiarato ✓. Regola HUD «colore mai da solo» e famiglia Roster: **FAIL** (ciano, sans). Contrasto del BUY disabilitato: la guida §6.4 vieta il testo disabilitato sotto ~2:1. **FAIL** (a vista).

**Critica.**
- **`ui_developer`:** prezzo in oro con l'icona della moneta; un solo «preview» nella testata invece di 4 «preview only»; BUY disabilitato leggibile oppure assente.
- **`game_director`, FLAG:** il mercante è la prima risposta alla fame. Finché è mock, offrire razioni rende la fame un vicolo cieco visibile. Due strade:
  - (A) mercante giocabile, almeno per il cibo;
  - (B) mercante assente dalla build della demo finché non lo è.

---

## C. Vista Village e Registro («il magazzino stesso» e gli altri edifici)

**Cosa è.** La scena illustrata del villaggio con i pin degli edifici: tooltip con livello, effetto, costo, «UPGRADE / BUILD preview only» e azioni («OPEN WAREHOUSE»). C'è anche un **Settlement Registry** (tasto R nella vista, chip «REGISTRY 10»), con filtri ALL / BUILT / BUILDABLE / LOCKED e gruppi Production / Civic / Defense / Arcane. File: `VillageScreenView.tsx`, `VillageRegistry.tsx`, `villageBuildingIcons.tsx`, `MockUpgradeControl.tsx`.

**Cosa si vede (FATTO):**
1. **Registro: i titoli degli edifici si sovrappongono alla riga di descrizione** («WAREHOUSE» sopra «KEEPS THE VILLAGE'S STOCK UNDER LO…»). Le descrizioni sono in maiuscoletto troncato. Collisione di testo in ogni riga (`crops/registry-zoom.png`).
2. Icone del registro: piccole case **ciano** e lucchetti, accanto a medaglioni con numeri romani: due grammatiche.
3. La scena è in letterbox con **bande nere** sopra e sotto; la HUD galleggia sul nero.
4. **Transizione d'ingresso**: 1,8 s dopo il click l'illustrazione è ancora a fasce, con pin ed ellissi tratteggiate sul nero (`30-village.png`). Pochi istanti dopo è integra. Flash visibile al giocatore: **da misurare** con una sequenza.
5. Tooltip dei pin: Farm «Food per day: 10 → 16 · UPGRADE preview only» mentre il villaggio muore di fame. Il gesto che risolverebbe è disabilitato.
6. **Esc non ha chiuso il registro** («Esc to close» scritto in testata). **NON VERIFICATO**: Esc può aver chiuso prima un tooltip.
7. **Click su Workshop (bloccato) → la HUD è sparita** (`40-workshop-click.png`). **NON VERIFICATO**, da riprodurre: potrebbe essere un'interazione dell'harness.
8. Respiro dalla cornice: 28 violazioni nella vista (C5c), comprese righe del registro fuori dalla lastra (scroll interno).

**Doc vs realtà:** il tooltip «Storage capacity 24 → 48» contro lo stash «7 OF 12» (già in F3 Stash). «Esc to close» non verificato. Famiglia Roster: registro serif, ma descrizioni in maiuscoletto sans troncate: **parziale**.

**Critica.**
- **`ui_developer`:** riga del registro su due livelli veri (titolo, poi descrizione in tondo serif, `line-height` corretto, nessun troncamento con ellissi o con tooltip completo); una sola grammatica di icone; sequenza di cattura dell'ingresso per misurare il flash.
- **`game_director`, FLAG:** il villaggio è la «casa» del gioco settlement, e oggi tutte le azioni sono «preview only». Per la demo serve almeno un edificio che si possa costruire o migliorare (la fattoria, contro la fame), altrimenti la vista è una cartolina.

---

## Non verificato (A–C)
Tasto P; Esc sul registro; Workshop che nasconde la HUD; flash d'ingresso della vista Village; 1280×800 per queste tre superfici; it-IT; tastiera.
