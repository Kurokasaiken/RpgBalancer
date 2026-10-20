# F3 — Scheda: HUD fissa (ribbon, tempo, risorse, obiettivo, menu, nav, registro eventi) (Opus, 2026-10-20)

> Formato F2. Evidenze: `shots/hud-f3/` (1440×900) e `shots/hud-f3-1280/`. Legenda: **FATTO** · **FLAG** · **NON VERIFICATO**.

---

## 1. Cosa è, per il giocatore

La cornice che resta sempre sulla mappa:
- **in alto a sinistra** il MENU;
- **in alto al centro** la lastra del tempo: giorno, regione, pausa/×1/×2/×4;
- **in alto a destra** le risorse (oro, cibo, legno);
- **in basso al centro** la nav: Village, Map, ricentra, Workshop 🔒, Tavern 🔒;
- **in basso a destra** due pulsanti rotondi: Pannelli (con badge) e Nascondi HUD;
- **a richiesta** il registro eventi (E) e il cartiglio obiettivo (che oggi non compare mai, §4).

## 2. Dove vive

| Pezzo | File |
|---|---|
| Shell e slot | `components/gameFrame/GameFrame.tsx` (579 righe); montata da `pages/game-frame.tsx` (`GameFrameScreen`), usata da `pages/game-frame-pixi.tsx` |
| Tempo | `WhenWhereCluster.tsx` |
| Risorse | `ResourceReadout.tsx` + `resourceReadoutItems.tsx` |
| Obiettivo | `ObjectiveCartouche.tsx` (`objectiveSlot`, `game-frame.tsx:167`) |
| Menu di gioco | `HudGameMenu.tsx` |
| Menu pannelli + badge | `HudPanelsMenu.tsx` (badge = `hiddenCount`, riga 21) |
| Nascondi HUD | `HudHideToggle.tsx` (tasto H) |
| Ricentra | `HudRecenterButton.tsx` |
| Registro eventi | `HudEventLedger.tsx` (tasto E) |

## 3. Come si presenta (FATTO, 1440×900)

| Stato | Cosa si vede | Immagine |
|---|---|---|
| A riposo | 4 lastre (MENU 116×50, tempo 451×84, risorse 396×84, nav 532×78) + 2 bottoni rotondi; **9,3% dello schermo** | `00-hud-at-rest.png`, `crops/hud-pieces.png` |
| Risorse | oro e legno su tessera scura; **cibo su tessera corallo piena**, «2/20 −6/d · 0 d left» già dal giorno 2 | `crops/hud-hover-food.png` |
| Hover su velocità, oro, cibo, nav | solo **tooltip nativi del browser** (`title`: «Pause [Space]», «×2 [2]», descrizione risorsa, «locked»): non skinnati, in ritardo, invisibili negli screenshot | `10-hover-*.png`, `WhenWhereCluster.tsx:140,157`, `ResourceReadout.tsx:52`, `GameFrame.tsx:312` |
| Menu | tendina lunga: Panels (con Director e Tuning in dev), Session, Options: lingua, **tema «Layout primitives / Lacquer Atlas»**, dimensione interfaccia | `30-game-menu.png` |
| Badge Pannelli | «6» = **numero di pannelli chiusi**, non notifiche | `crop-bottom-right.png` |
| Registro eventi | lastrina sotto il tempo: «EVENTS 0 · DUE · TYPE · Nothing on the horizon.» anche dopo 12 giorni con 2 POI quest sulla mappa | `40-events-ledger.png`, `44-…` |
| HUD nascosta (H) | tutte le lastre via; resta un chevron in basso a destra | `50-hud-hidden.png` |
| Focus da tastiera | **anello blu di default del browser** (`rgb(0,95,204)`) su pausa, velocità, nav | `crops/hud-focus.png` |

## 4. Documentazione esistente vs realtà

| Doc | Dice | Si vede | Verdetto |
|---|---|---|---|
| guida HUD regola 5 | HUD a riposo ≈18%, tetto 1/3 | **9,3%** | **PASS** |
| guida HUD regola 7 | i fissi non coprono la terra | a 1440 la lastra del tempo finisce a y=84, le prime cime a ~88 | **PASS** (al limite) |
| guida HUD §2 «Pezzi pronti» | `ObjectiveCartouche` è un pezzo pronto | `/game` **non passa mai `objective`** a `GameFrameScreen`: il cartiglio **non compare mai** | **CONTRADDIZIONE**: il pezzo esiste, il giocatore non lo vede |
| guida HUD §6.9 (riga 410) | «scorciatoia nel tooltip» | la scorciatoia c'è, ma in un `title` nativo del browser | **PARZIALE**: contenuto giusto, resa non HUD |
| guida HUD (riga 385) | Tab nell'ordine visivo alto-sinistra → basso-destra | ordine reale: **POI sulla mappa (destra) → MENU → tempo → Pannelli/Nascondi (basso-destra) → Village/Map (basso-centro)** | **CONTRADDIZIONE** |
| guida HUD regola 6b | niente pallini/badge/cerchi con simbolo | icona del giorno ◎, ricentra ⊕, badge «6» tondo | **FAIL** |
| guida HUD §1 regola 2-3 | oro/bronzo opachi, niente flat | tessera FOOD corallo piena | **FAIL** (C10 + regola 6) |
| memoria/decisione 2026-10-16 | Lacquer Atlas bocciata, riferimento = skin base | il tema **Lacquer Atlas è ancora selezionabile** dal menu del giocatore | **TENSIONE** (decidi tu se toglierlo) |
| `game-frame.tsx:100` | registro con **eventi fixture** finché non c'è un sistema (R-071) | su `/game` il registro è **vuoto**: i fixture non arrivano | **COERENTE** (la mia ipotesi di F3 era sbagliata) |
| guida §352 | ogni lista vuota ha una frase | «Nothing on the horizon.» ✓ | **PASS** |

## 5. Stato di salute

**Funziona (FATTO):**
- occupazione bassa;
- nessuna collisione tra le lastre;
- H nasconde e ripristina;
- menu con scorciatoie;
- stato vuoto scritto;
- velocità selezionabili;
- 0 icone fuori asse;
- contrasto del registro 5/5.

**Rotto o incompleto (FATTO):**
1. **Cartiglio obiettivo mai visibile** su `/game`.
2. **Tooltip solo nativi** (`title`) su tempo, risorse e nav: compaiono dopo il ritardo del sistema operativo, con lo stile del sistema; nessuna spiegazione visibile di «−6/d · 0 d left».
3. **Badge dei pannelli fuorviante**: conta quelli chiusi.
4. **Focus ring di default del browser.**
5. **Ordine di Tab non visivo.**
6. FOOD: contrasto **2.26:1**, tessera piatta, e allarme di fame **acceso dal giorno 1-2 in tutte le run** (8 → 0 cibo con −6/giorno).
7. La velocità selezionata cambia **forma** (cerchio teal) rispetto alle altre (pillole): due grammatiche nello stesso gruppo.
8. Il menu espone al giocatore il cambio di tema e voci dev (in build dev). **NON VERIFICATO** in build di produzione.
9. Il registro eventi non elenca le offerte di quest presenti sulla mappa: è vuoto mentre il giocatore ha 2 POI attivi.

## 6. Polish AAA

| # | Misura (body, 1440) | Esito |
|---|---|---|
| C1 | 0 fuori asse | **PASS** |
| C2 | scarto massimo 1.75 px (baseline) | **PASS** |
| C3 | **14** spaziature (≤6); 3 corpi (12/13/19) | **FAIL** |
| C4 | 10 engraved + 3 altre; ◎ giorno, ⊕ ricentra, badge tondo; velocità con due forme | **FAIL** |
| C5 | 0 tagli | **PASS** |
| C6 | 4 fallimenti: cibo 2.26 (×3), «Day» 4.39 | **FAIL** |
| C7 | MENU alto 26 px; focus ring di sistema; tooltip di sistema; Tab non visivo | **FAIL** |
| C8 | 9,3%; nessuna collisione | **PASS** |
| C9 | non misurato (scivolata HUD 520 ms a doc) | NON VERIFICATO |
| C10 | — | **FLAG** |

## 7. Critica con il cappello

**`ui_developer`** (correctness, neutral)
1. Tooltip HUD (skinnati) con nome + scorciatoia al posto dei `title` nativi (il contenuto esiste già).
2. Focus ring skinnato (anello ottone come l'hover), mai quello di sistema.
3. Ordine di Tab = ordine visivo; i POI sulla mappa dopo la HUD, o in un gruppo raggiungibile con una scorciatoia.
4. Badge: o si toglie, o conta qualcosa che chiede attenzione (eventi non letti).
5. Stato del cibo: segnalarlo senza tessera piatta e con contrasto ≥ 4.5:1 (testo scuro su corallo, o bordo/brace sulla tessera scura).
6. Una sola grammatica per i pulsanti di velocità (stato selezionato = stessa forma, luce diversa).

**`game_director`** (taste → FLAG)
7. **La fame dal minuto uno.** Ogni run comincia con «0 d left» in corallo. Se è voluto (pressione), va raccontato: perché il villaggio ha fame e cosa posso fare. Se non lo è, il giocatore impara a ignorare l'unico allarme della HUD.
8. **Il cartiglio obiettivo è la voce del gioco** («cosa faccio ora?»). Esiste, è vietato agli oggetti come vuoi tu, e non è collegato. Collegarlo è il gesto più economico per l'onboarding (teaser/demo Next Fest).
9. Registro eventi vuoto con due quest sulla mappa: il giocatore che preme E per capire «cosa succede» trova «niente all'orizzonte». O il registro include le offerte, o va chiamato diversamente.

**`objective_critic`** su questa scheda
1. **ASSUMPTION → corretta** — avevo scritto «nessun tooltip»: i controlli hanno `title` nativi (`WhenWhereCluster.tsx:140,157`, `ResourceReadout.tsx:52`, `GameFrame.tsx:312`), invisibili in headless. Scheda corretta in §3, §4, §5.
2. **UNSUPPORTED** — «fame dal giorno 1 in tutte le run»: vero nelle 9 run di questo audit, tutte da partita nuova. Con un villaggio avviato potrebbe non succedere.
3. **RISK** — il menu con Director/Tuning e il tema è in **dev build**; in produzione `devOnly` li toglie (`hudPanelRegistry.ts`). Il tema invece non è `devOnly`. *Fix*: verificare con `build` di produzione.
4. **CONTRADICTION** — §4 dice «PASS» sui fissi che non coprono la terra a 1440, ma il margine è di ~4 px: un cambio di zoom o di arte lo rompe (T-01). Da tenere come rischio, non come pass pulito.
5. **BIAS** — la HUD è stata giudicata solo sulla mappa; nella vista Village (letterbox nero) i rapporti cambiano.

## 8. Visual fork / decisioni

| Fork | A | B |
|---|---|---|
| F-HUD-1 stato cibo | brace/incrinatura sulla tessera scura | tessera corallo ma con testo scuro e bordo |
| F-HUD-2 badge pannelli | rimosso | badge = eventi non letti |
| F-HUD-3 obiettivo | cartiglio appeso sempre presente quando c'è un'azione | obiettivo dentro la lastra del tempo |

## 9. 1280×800 (FATTO, `shots/hud-f3-1280/`)

- Occupazione **10%**, 0 collisioni.
- La lastra del tempo si stringe (451 → 317 px): **sparisce il nome della regione** («The Eastern Marches»).
- La tessera cibo perde il ritmo: «8/20» senza «−6/d · d left». Il giocatore a 1280 non vede più quanti giorni di cibo restano.
- Bordo inferiore della lastra del tempo (y=84) a pochi pixel dalle cime: stesso rischio T-01 di 1440.
- Contrasto: 3 fallimenti (tessera cibo). MENU ancora alto 26 px.

## 10. Prompt potenziato

```
You are a senior UI designer and developer at a AAA studio on the RPG project
(/Users/faustoboni/progetti_personali/RPG), surface /game, the fixed HUD:
GameFrame.tsx, WhenWhereCluster, ResourceReadout, ObjectiveCartouche, HudGameMenu, HudPanelsMenu,
HudHideToggle, HudRecenterButton, HudEventLedger (src/ui/idleVillage/components/gameFrame/).

Inputs:
- DESIDERATA: .mw/desiderata.md (latest FROZEN); DESIGN_PILLARS.md.
- GUIDE (binding): src/docs/docs/design/hud_component_guide.md — rules 5-8 (coverage, no land
  covered, 1280x800), 6b (no dots/badges/circles with symbols), §6.9 (tooltip with shortcut,
  visual Tab order, contrast >= 4.5:1). Director 2026-10-16: Lacquer Atlas rejected, base skin is the reference.
- CONTEXT: src/docs/docs/game_surface_audit/F3_scheda_hud_fissa.md.
- HARNESS: src/docs/docs/game_surface_audit/harness/run-f3hud.mjs.txt (own vite port).

Scope (correctness):
1. Tooltip (name + shortcut) on every HUD control.
2. Skinned focus ring; Tab order = visual order.
3. Panels badge removed or repurposed (ask: F-HUD-2).
4. Food warning contrast >= 4.5:1 (representation: F-HUD-1, ask first).
5. Speed control: one shape grammar for selected/unselected.
6. Wire ObjectiveCartouche on /game ONLY after the Director decides what the objective says (F-HUD-3).
Rules: tokens only; i18n en + it-IT; config in gameFrameConfig (Zod); traps T-01 (insets/land),
T-03 (data-hud-controls scope), T-04, T-13. Run hudGuards.test.ts.
Output: diff + before/after harness PNGs at 1440x900 and 1280x800 + C1..C9 + "not verified".
```

## 11. Non verificato
Build di produzione (voci dev e tema); attributi `title` nativi; scivolata HUD (520 ms); ricentra (selettore non trovato: «Re-centre»); vista Village; it-IT; 1920 e 2560; Steam Deck reale.

---

## 12. Ri-audit dopo la tua segnalazione (R-234, 2026-10-20)

Hai segnalato: *«i 3 pannelli in alto dell'HUD sono uno piccolissimo e con il pulsante strano, sproporzionato che va oltre i confini dell'HUD. È piena di problemi che non hai individuato.»* Avevi ragione, e qui c'è perché non li avevo visti.

**Perché li avevo mancati (errore mio e dello strumento):**
- C5 cercava contenuti **tagliati** dentro contenitori con overflow nascosto. La pillola MENU non è tagliata: è dentro il rettangolo della lastra, ma passa sopra la **cornice disegnata** (spalle curve e filetto interno), che il DOM non vede.
- Nella lettura visiva ho guardato i pezzi uno per uno (`crops/hud-pieces.png`), non il loro rapporto.

**Nuova misura C5c «respiro dalla cornice»** (`plaqueClearance`, guida HUD §3: clearance + padding ≈ 22 px). Uguale a 1440 e 1280, `shots/hud-top-r234/`:

| Lastra | Controllo | Distanza minima dal bordo | Esito |
|---|---|---|---|
| MENU (116×50) | pillola «Menu» 84×26 | **11 px** (sx 16, alto 13, basso 11) | **FAIL** |
| Nav (532×78) | Village / Map / Workshop / Tavern | **8 px** dal fondo | **FAIL** |
| Nav | Ricentra | 12 px | **FAIL** |
| Risorse (396×84) | Oro / Cibo / Legno | 15 px | **FAIL** |
| Tempo (447×84) | Pausa, ×1, ×2, ×4 | ≥ 25 px | **PASS** |

**Cosa vede il giocatore (FATTO, `mockups/baseline/top-strip.png`):**
1. La lastra MENU è alta **50 px** contro **84** delle altre due ed è tutta pillola: un oggetto di un'altra famiglia.
2. La pillola copre la cornice: esce dai margini interni disegnati.
3. Le tre lastre hanno tre respiri diversi (11 / ≥25 / 15 px): il tempo sembra «vuoto», le altre due «piene».
4. Le risorse hanno tre tessere di larghezza diversa (il cibo più largo e piatto).
5. Il **menu a tendina** (19 voci, 230×656 px) mette insieme pannelli (con quelli dev), sessione e opzioni (lingua, tema, dimensione), e copre tutta la colonna sinistra della mappa.

**Proposte**: `mockups/fork-mockups-v2.html` §HUD-2: **H1** tre lastre di una famiglia (stessa altezza, stesso respiro, MENU come icona + etichetta dentro i margini) oppure **H2** due lastre (il menu entra come primo comando della lastra del tempo).

**Domanda aperta**: con «il componente in alto a destra con le opzioni» intendi la lastra delle risorse, oppure il menu a tendina che si apre da MENU (in alto a sinistra)? Le misure sopra coprono entrambi.
