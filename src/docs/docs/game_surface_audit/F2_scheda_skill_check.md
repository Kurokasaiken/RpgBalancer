# F2 — Scheda pilota: Skill check su /game (Opus, 2026-10-20)

> Scheda-modello per tutte le altre (F3). Prima di replicarla serve il tuo ok sul **formato**.
> Evidenze: `shots/skillcheck-f1b/`, `shots/skillcheck-fullrun/`, F1b, F1c. Legenda: **FATTO** (visto o misurato) · **FLAG** (gusto, decide il Director) · **NON VERIFICATO**.

---

## 1. Cosa è, per il giocatore

Il momento in cui il destino di un gesto si decide: la party tenta un'azione («Examine the ground», «Charge with bare steel», un turno di «Iron and ash»), il giocatore tocca il quadrante, la palla gira e si ferma su un esito: DEFEAT, VICTORY o TRIUMPH. L'esito è **già deciso dal motore** (`ResolvedCheck`), l'astrolabio lo dipinge soltanto. Il giocatore poi legge la carta dell'esito e clicca per proseguire.

## 2. Dove vive

| Pezzo | File | Nota |
|---|---|---|
| Colonna (percorso di default su /game) | `components/gameFrame/QuestSkillCheckColumn.tsx` (`settledIdle` :246, CSS di pausa :61) | montata quando esiste la geometria del cluster: `pages/game-frame-pixi.tsx:1527` |
| Overlay portal (percorso alternativo) | `components/gameFrame/QuestSkillCheckOverlay.tsx` | non visto a schermo |
| Motore del quadrante | `components/destinyAstrolabeV62/engine.ts` (parcheggio :919-927) | kit congelato `frozen/kits/destinyAstrolabeV62Kit.tsx` |
| Ponte con la finestra | `QuestRunWindow.tsx:359-376` (`publishCheckBridge`, `autoThrow = checkOpts.skipIntro`, default `false` :235) | |
| Opzioni (salta intro / salta check) | `QuestCheckOptionsPanel.tsx`, pulsante ✦ nell'header | non aperto in questa scheda |
| Config | `gameFrameConfig.ts:906-907` (`dismissArmDelayMs 350`, `verdictAutoDismissMs 0`) | |

## 3. Come si presenta (stati misurati a 1440×900 e 1280×800)

| Stato | Durata misurata | Cosa vede il giocatore | Immagine |
|---|---|---|---|
| Intro | **4.1 s** | gocce d'inchiostro → aculei blu che si chiudono; nessun testo, nessun comando | `f1c-crops/contact-sheet.png` (1-2) |
| Armato | finché clicchi | la stella al centro: è il pulsante «Throw», senza etichetta | `skillcheck-f1b/20-armed-throw-visible.png` |
| Spin | 3.6–4.0 s | una scintilla corre sulla stella; la scena a sinistra non reagisce (1,5% px cambiati) | `30-spin-t700.png`, `31-spin-t2200.png` |
| Verdetto | — | VICTORY/TRIUMPH: bagliore pieno. **DEFEAT: quasi nulla cambia.** Carta sotto il quadrante + stessa info nella finestra | `skillcheck-fullrun/full-c-verdict.png` |
| Parcheggiato | da 0.7 s dopo il verdetto | **quadrante congelato** (0 px cambiati in 3 s), raggi fermi a metà spazzata; riga grigia «Click anywhere to continue» | `full-d-parked3s.png` |
| Combattimento | ≥ 8 s × turno | lo stesso ciclo ripetuto per 5 turni: **≥ 40 s per uno scontro** | `full-c-verdict.png` |

## 4. Documentazione esistente vs realtà

| Doc | Cosa dice | Cosa si vede | Verdetto |
|---|---|---|---|
| `quest_ui_component_guide.md` §6 | Check **narrativo: centrato, overlay della scena, full-motion** | in una colonna laterale da 340 px, fuori dalla scena | **CONTRADDIZIONE** |
| idem §6 | Check di **combattimento dockato tra formazione e orda**, «occhi su HP ed esposizione mentre la ruota gira» | stessa colonna laterale, lontano dalla striscia HP/esposizione dentro la finestra | **CONTRADDIZIONE** |
| idem §8 | astrolabio «docked sopra il teatro» | colonna a destra della finestra | **SUPERATA** (PLAN-040 → overlay, poi PLAN-043 WS-4 → colonna) |
| idem §4 | «L'HP nel verdict card NON si ripete in prosa» | «(−10 HP)», «(−12 HP)» in prosa, **due volte** per carta | **CONTRADDIZIONE** |
| idem §1 | il verdetto *sostituisce* il contenuto della zona, non è una banda extra | il verdetto compare nella finestra **e** nella carta in colonna | **CONTRADDIZIONE** |
| idem §5 | «Spent marker: **pallino**» | — | **contraddice la guida HUD regola 6b** (doc contro doc) |
| `skill_check_workflow_spec.md` | `DestinyAstrolabeV4` «latest», stato candidate, 2026-08-15 | in gioco c'è la V6.2 | **OBSOLETA** |
| contratti `quest-skill-check-column.md`, `-overlay.md`, `destiny-astrolabe-v62.md` | `invariants: []`, scopo generico | — | **VUOTI**: la matrice di copertura li conta come «con contratto» |
| PLAN-043-S9 WS-4 (artifact r003) | colonna, `settledIdle` 0.0 ms/frame, «niente Continua da nessuna parte» | corrisponde | **COERENTE**, ma è la fonte delle segnalazioni (§6) |
| `settledIdle` | documentato solo in PLAN-043-S9 e nei commenti di codice | — | **MANCANTE** nella guida dei componenti |

## 5. Stato di salute

**Funziona** (FATTO): verdetto deterministico e coerente col motore; pulsante di lancio presente; parcheggio rapido e prevedibile (0.7-0.8 s); nessuna sovrapposizione tra pannelli; uguale a 1440 e 1280.

**Rotto o incompleto** (FATTO):
1. Quadrante **tagliato su 4 lati** (`div.arena` 766×766 in 279×279) a ogni viewport e stato.
2. Riga duplicata in **7 carte su 7**.
3. Verdetto mostrato due volte (finestra + carta).
4. Sconfitta senza messa in scena.
5. Idle congelato.
6. Pulsante di lancio non riconoscibile come tale.
7. Chip «61/50» senza legenda.
8. «−210 HP» sospetto nella cronologia (causa NON VERIFICATA).

## 6. Tensioni con decisioni registrate (da AGENTS.md: si nominano, non si risolvono)

- **«Si blocca al risultato» contro il tuo ruling** «niente Continua da nessuna parte, battezzo» (PLAN-043-S9, artifact r003). L'assenza di pulsante è voluta e il click-ovunque è la sua conseguenza. Il blocco percepito ha due cause separabili:
  - (a) affordance debole: la riga grigia da 12 px;
  - (b) l'idle congelato, che fa sembrare il gioco fermo.
  
  Si può risolvere (b) senza toccare il ruling. Toccare (a) può o no reintrodurre un «Continua»: **decidi tu**.
- **Congelamento contro gate BV di WS-4** («`settledIdle` 0.0 ms/frame», bloccante). Riattivare l'idle fa fallire un gate battezzato: serve un nuovo ruling, non una modifica silenziosa.
- **Review visiva T-04 waivata** per WS-4 («review visiva T-04 waivata dal ruling»). Quello che questa scheda trova è ciò che quella review avrebbe visto.

## 7. Polish AAA (criteri approvati)

| # | Misura | Soglia | Esito |
|---|---|---|---|
| C1 centratura | 0 icone fuori asse; 2 bottoni `icon+indicator` (barra verde 4×12.5, pallino 6×6) | ≤ 1 px | **PASS** sulla centratura; indicatori → C4 |
| C2 allineamento | titolo colonna 13 px sopra il titolo finestra; riga con `align-items:flex-start` a 13.5 px di scarto | ≤ 1 px | **FAIL** |
| C3 ritmo/tipografia | **21** spaziature distinte; **8** corpi (11, 12, 13, 14, 16, 19, 27, 46); testo a **11 px** (tappe del viaggio) | ≤ 6 / ≤ 4 / ≥ 12 | **FAIL** |
| C4 icone | header: 3 grammatiche di bottone, icone piene incise + glifi a linea; indicatori pallino/barra; «①», «●●●●●●» | 1 set per ruolo, niente 6b | **FAIL** |
| C5 clipping | quadrante tagliato su 4 lati | 0 tagli non dichiarati | **FAIL** |
| C6 contrasto | titolo colonna 2.52; DEFEAT 2.41; esposizione «100 %» 2.46; FOOD 2.26 (HUD); «Day» 4.35 | 4.5 / 3 | **FAIL** |
| C7 stati/target | 6 bottoni header da 26 px; `quest-footer-toggle` **732×4 px**; la stella non dichiara di essere un comando | ≥ 32 px | **FAIL** |
| C8 occupazione | finestra 40% del viewport + colonna; nessuna collisione | fluttuante: ammessa | **PASS** (con FLAG sulla composizione) |
| C9 moto | durate 180/240/300/600/1500/1600 ms, quasi tutto `linear`; idle congelato; reduced-motion non provato | set condiviso; nessun «morto» | **FAIL** (idle) / NON VERIFICATO (reduced-motion) |
| C10 famiglia Roster | — | Director | **FLAG** |

## 8. Critica con il cappello

**`ui_developer`** (correctness, neutral)
1. Il quadrante deve stare nel suo riquadro: arena = min(lato) del contenitore, nessun overflow. Il fondo quadrato blu notte va eliminato o fatto diventare parte della cornice. *(C5)*
2. La carta dell'esito deve mostrare ogni riga una volta, e l'HP solo sul canale visivo (guida §4). *(bug)*
3. Il verdetto va mostrato in un solo posto (guida §1).
4. Header della finestra: una grammatica di bottone, target ≥ 32 px; gli indicatori di stato diventano sagome tagliate nella materia (regola 6b), non barre e pallini.
5. Titolo della colonna su una lastra o un velo: oggi dipende da cosa c'è dietro.

**`game_director`** (taste → FLAG)
6. La sconfitta deve pesare quanto la vittoria. Oggi il giocatore la scopre leggendo un chip, non la vede.
7. Il combattimento a 5 tiri identici consuma l'effetto: dopo il secondo turno il rito diventa attesa. Se poi il danno è sempre −12 qualunque sia l'esito, il tiro non comunica nulla sulla sopravvivenza.
8. Il quadrante in colonna laterale separa il destino dalla scena: la scena dovrebbe «sentire» il tiro (luce, camera, suono), o il tiro dovrebbe prendersi la scena.
9. I 4 s d'intro senza istruzione: tensione se dicono cosa sta per succedere, attesa se non dicono niente.

**`objective_critic`** su questa scheda
1. **ASSUMPTION** — «la sconfitta non pesa»: visto su 3 sconfitte senza ferita grave né morte. *Fix*: catturare un DEFEAT con `wounded`/`dead`.
2. **UNSUPPORTED** — «≥ 40 s per scontro»: somma di tempi minimi misurati su dev server; un giocatore reale legge e clicca più lentamente, quindi è un limite inferiore. *Fix*: misurare su build di produzione con input umano simulato.
3. **RISK** — C3 (21 spaziature) conta anche lo stage teatro e la HUD visibile, non solo il componente. *Fix*: ripetere `measure` con root = `quest-check-column`.
4. **CONTRADICTION** — §6 dice «si può risolvere (b) senza toccare il ruling»; ma (b) tocca un gate battezzato. Comunque serve un tuo ruling: è scritto.
5. **BIAS** — le direzioni di §9 vengono da due soli riferimenti di genere (BG3, Disco).

## 9. Visual fork necessari (nessuna scelta dell'agente)

| Fork | Direzione A | Direzione B | Asse |
|---|---|---|---|
| F-1 Dove vive il tiro | il check prende il centro della scena per la sua durata | resta in colonna, la scena reagisce | gerarchia |
| F-2 Dopo il verdetto | idle vivo e leggero (tetto fps) | uscita animata, poi quiete (nessun frame «morto») | moto |
| F-3 Combattimento | un solo tiro per scontro con esito aggregato | tiri per turno ma più rapidi dal 2° (intro saltata, spin breve) | ritmo |
| F-4 Comando di lancio | stella con etichetta incisa + invito che pulsa | intro che termina con l'istruzione e poi la stella | affordance |

## 10. Prompt potenziato (per l'agente che migliorerà il componente)

```
You are a senior UI designer and developer at a AAA studio working on the RPG project
(/Users/faustoboni/progetti_personali/RPG), surface /game, component: quest skill check
(QuestSkillCheckColumn + DestinyAstrolabeV62 engine + Verdict Card).

Inputs:
- DESIDERATA: .mw/desiderata.md (latest FROZEN); DESIGN_PILLARS.md.
- DIRECTOR RULINGS IN FORCE: PLAN-043-S9 WS-4 artifact r003 — «niente Continua da nessuna parte»;
  gate BV `settledIdle` 0.0 ms/frame. Any change touching these needs an explicit new ruling: STOP and ask.
- CONTEXT: src/docs/docs/game_surface_audit/F2_scheda_skill_check.md (this card), F1b, F1c;
  src/docs/docs/design/hud_component_guide.md (rule 6b, tokens --skin-hud-*);
  src/docs/docs/idle_village/quest_ui_component_guide.md §1, §4, §6.
- EVIDENCE HARNESS: src/docs/docs/game_surface_audit/harness/*.txt (Metal WebGL, isolated vite config,
  late page.clock). Use it for before/after captures; never claim a visual fix without them (T-04).

Scope (correctness only, no taste decisions):
1. Board fits its box: no overflow of div.arena at 1280x800 and 1440x900, all states.
2. Verdict card: each line once; HP only on the visual channel.
3. Verdict shown in one place (resolve guide §1 vs current duplication; ask if ambiguous).
4. Header buttons: one button grammar, targets >= 32px; status indicators as carved silhouettes (rule 6b).
5. Column title legible regardless of the map behind (contrast >= 4.5:1).

Rules:
- Tokens only (--skin-*, --skin-hud-*), strings via react-i18next (en + it-IT), numbers in gameFrameConfig (Zod).
- Do not modify frozen kits in place; extend per the kit convention.
- Traps: T-02 (round caps on arcs from 0), T-03 (data-hud-controls scope), T-04, T-13 (parallel sessions).
- Keep green: questRunWindow.test.tsx, gameQuestCluster.spec.ts (BV-01..BV-14), gameQuestFullFlow.spec.ts.

Output: diff + before/after PNGs from the harness at both viewports + a table C1..C9 with numbers,
and an explicit "not verified" list.
```

## 11. Non verificato
Percorso overlay; DEFEAT con ferita grave o morte; audio; reduced-motion; pannello opzioni ✦ (salta intro / salta check); build di produzione; causa di «−210 HP»; mappa assente a 1440×900 (anomalia ricorrente, da indagare a parte).
