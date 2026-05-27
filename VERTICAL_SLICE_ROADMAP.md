# Vertical Slice Roadmap — Steam Release

**Versione:** 3 (riscritta 2026-05-12 dopo correzioni utente)
**Cosa è questo file:** unica guida operativa per arrivare alla slice giocabile su Steam.

> **Gerarchia documentale:**
>> - `GAMEPLAY_DESIGN.md` — visione e meccaniche del gioco
> - `idle_village_conversation_context_handoff.md` — stato runtime autorevole
> - `VERTICAL_SLICE_ROADMAP.md` — *(questo file)* piano operativo
>
> Se questo file contraddice il briefing o l'handoff, il briefing/handoff vincono.

---

## 1. Cos'è la slice

Demo Steam giocabile, **durata target > 10 min** (probabilmente 30-60 min di gameplay vario prima di "End of slice"). Mostra il core loop completo:

> Personaggi normali producono materiali → mercante/negozio fornisce equip → eroi preparati affrontano quest D&D → skill check stile Cultist Simulator → ricompense → level up → upgrade edificio (WoW moment).

Setting: avamposto di frontiera Forgotten Realms. Visual: medaglioni circolari da board game su mappa con action card.

---

## 2. Verità di partenza (dall'handoff)

| Fatto | Confidence |
| --- | --- |
| `/minimal-gameplay` è la canonical runtime surface | High |
| `/test` è il verification harness | High |
| Pipeline Character → Resident è la baseline architettura | Medium-High |
| Portrait rendering funziona (utente confermò "FUNZIONA !") | High |
| Roster ordering funziona ("adesso ordina") | Medium-High |
| **Drag pickup alignment è ROTTO** (cursore non centrato sul token) | Very High |
| Spring-return non è trustworthy, da non toccare prima del pickup | High |

**Regola d'oro:** *runtime first, docs after*. Visual/UI bugs richiedono **verifica utente reale**, non bastano build green o report agent.

---

## 3. Scope rigido (dal briefing)

**Si tocca solo:**

- `src/ui/idleVillage/` ← playground principale
- `src/balancing/config/idleVillage/` ← solo file di config
- `src/engine/game/idleVillage/` ← TimeEngine e logica village

**Non si tocca:**

- `src/balancing/archetype/`, `src/balancing/simulation/`
- `src/ui/balancing/`, `src/ui/combat/`
- `src/components/balancing/`
- Combat simulator, stat balancer, archetype tools
- Documentation reconciliation di vecchi piani (focus su runtime)

**Errori TS in `src/balancing/archetype/`** (~87): fuori scope, da disaccoppiare via `tsconfig.app.json exclude` in fase di build Vercel.

---

## 4. Piano per macro-fasi

Lo scope Steam richiede più di 3 settimane. Lo divido in macro-fasi che il giocatore vede crescere progressivamente. Tempi indicativi, sub-task da pianificare uno alla volta secondo lo workflow "fewer prompts, stronger prompts" dell'handoff.

### Macro-Fase A — Drag pickup fix (1-3 giorni, blocker)

Vincolo dall'handoff: **niente altro va avanti finché il pickup non è centrato**.

- [ ] **A.1** Inspect runtime drag start path: `PgCard` / `SlottedMedal` / `CustomDragOverlay` / `useDraggable` (@dnd-kit) / transform-origin / overlay offset.
- [ ] **A.2** Misurare DOM rect reale del token visibile al pickup vs pointer event coordinates. Niente "estimated geometry" (handoff §6.2).
- [ ] **A.3** Identificare la prima divergenza esatta e applicare il fix minimo (non riscrivere la pipeline drag).
- [ ] **A.4** Verifica runtime con manuale signoff utente. **Solo questo conclude il task** (regola GV-WF-001 dell'handoff).
- [ ] **A.5** Logging evidence: `test-results/drag-pickup-alignment-regression-fix-<YYYY-MM-DD>.log`.

### Macro-Fase B — Core loop minimo girabile (1-2 settimane)

Obiettivo: in `/minimal-gameplay` un giocatore può eseguire un giro completo del loop, anche con contenuti placeholder.

- [ ] **B.1 Mappa con piazza centrale + 3-4 edifici fissi** (Taverna, Centro Villaggio, Taglialegna, +1)
- [ ] **B.2 Roster iniziale** con almeno 2 artigiani + 1 eroe (Character → Resident pipeline esistente)
- [ ] **B.3 Job ripetibile "Taglia legna"**: `JobCard` esistente, assegnazione via drag medaglione, timer, output legname
- [ ] **B.4 HUD risorse**: legname, ferro, cibo, gold visibili e aggiornati live
- [ ] **B.5 Mercante itinerante**: action card temporanea che spawna a giorno 2 o 3. **Richiede implementazione `MarketActionCard.tsx` che oggi è TODO**
- [ ] **B.6 Acquisto equip**: scambio gold → oggetto, aggiunto a inventario eroe, modifica stat effettive
- [ ] **B.7 Quest narrativa**: una `QuestCard` con skill check pulito (vedi C). Assegnazione eroe, timer, outcome
- [ ] **B.8 Reclutamento**: spawning nuovo eroe alla taverna dopo prima quest completata o reputazione X

### Macro-Fase C — Skill check Cultist Simulator-style (3-5 giorni)

Obiettivo: il momento di risoluzione quest è esteticamente curato e leggibile.

- [ ] **C.1 Layout pannello skill check**: oggetto-quest al centro, stat richieste e stat effettive ai lati, niente fronzoli
- [ ] **C.2 Roll deterministico-probabilistico**: 5 outcome tier (critical / success / partial / fail / disaster)
- [ ] **C.3 Animazione roll**: minimale, leggibile, no flashy
- [ ] **C.4 Outcome feedback**: tipografia chiara, copy narrativo, transizione pulita al modal ricompensa
- [ ] **C.5 Decisione UX**: il pannello è full-screen overlay o card embedded? Da prototipare e testare con utente

### Macro-Fase D — Reward + Level up + Upgrade (1 settimana)

Obiettivo: il WoW moment funziona.

- [ ] **D.1 Quest Success Modal**: visualizza outcome + lista ricompense
- [ ] **D.2 Reward application**: gold, materiali, oggetti, exp eroe
- [ ] **D.3 Level up eroe**: glow medaglione (skin ring bronze → silver), notifica
- [ ] **D.4 Upgrade edificio disponibile**: icona "upgrade" lampeggia sull'edificio Taglialegna (o quello rilevante)
- [ ] **D.5 Upgrade applicato**: produce X% in più o sblocca nuovo job. Visivamente: l'edificio cambia skin
- [ ] **D.6 Reputazione**: sistema di tracking + trigger per nuovo eroe alla taverna

### Macro-Fase E — Contenuto Steam-presentabile (1-2 settimane)

Obiettivo: c'è abbastanza materiale da giocare per 30-60 min senza ripetersi.

- [ ] **E.1 Almeno 3 quest narrative** con stat threshold diversi (es. una Forza, una Percezione, una Spirito)
- [ ] **E.2 Almeno 2 job ripetibili** (Taglialegna + Fucina o Cucina)
- [ ] **E.3 Inventario equip**: 6-8 oggetti acquistabili dal mercante con stat tradeoff
- [ ] **E.4 5-8 eroi reclutabili** con stat e costi diversi (verificare con `Character` esistente)
- [ ] **E.5 Sistema feriti**: eroi falliti gravemente vanno "in cura" alla taverna per N giorni
- [ ] **E.6 Eventi notturni** (opzionale): assalto banditi randomico se reputazione bassa

### Macro-Fase F — Polish, audio, distribuzione (1-2 settimane)

- [ ] **F.1 Audio ambient mistico**: 1 BGM loop + 4 SFX (drop, success, fail, gain)
- [ ] **F.2 Visual polish**: floating numbers, hover states, animazioni minimali
- [ ] **F.3 Tipografia & UI cleanup**: passata estetica generale stile Cultist Simulator
- [ ] **F.4 Save / Load**: consolidare le 3 versioni di `PersistenceService`, smoke test reload
- [ ] **F.5 Localization EN + stub IT**: tutta UI passa da `LocalizationService`
- [ ] **F.6 Build Vercel**: aggiustare `tsconfig.app.json exclude` per escludere balancer, deploy live
- [ ] **F.7 Build Tauri**: `.dmg` macOS prioritario, poi `.msi` Windows
- [ ] **F.8 Steam page setup**: capsule, screenshot, descrizione, trailer 30 sec
- [ ] **F.9 Playtest privato**: 3-5 persone esterne giocano e raccontano

---

## 5. Workflow operativo (dall'handoff §2)

**Roles:**
- Strategist — architettura/governance
- Coordinator — chain di task / dipendenze
- Executioner — implementazione runtime

**Stile preferito:**
- Fewer prompts, stronger prompts
- Un task alla volta
- Niente analisi+fix+docs mescolati nello stesso prompt
- Visual/UI: identifica → ispeziona baseline → fix minimo → verifica runtime → docs/test dopo

**Per ogni task runtime/UI:**
1. Identifica esatto componente/sistema
2. Inspect canonical baseline
3. Fix minimo
4. Verifica reale (non build/lint)
5. Solo dopo: test + docs

---

## 6. Decisioni operative (riepilogo)

| Tema | Decisione |
| --- | --- |
| Target distribuzione | Steam (priorità) + Vercel web demo + Tauri binari standalone |
| Audio | Ambient mistico (royalty-free OpenGameArt / Pixabay) |
| Asset visivi | Placeholder CC0 (Kenney) per token/icone, finché design definitivo non arriva |
| Save system | Persistente, autosave. Consolidare 3 versioni `PersistenceService` |
| Lingua | EN per slice. `LocalizationService` esteso. Stub `it: {}` predisposto |
| Build TS | Escludere balancer da `tsconfig.app.json` (fuori scope) |
| Git | Branch `vertical-slice-steam`. Commit frequenti. Tag `v0.1-vertical-slice-steam` a fine F |
| Surface canonica | `/minimal-gameplay` (confermato da handoff) |
| Architettura PG | Character → Resident pipeline (non rifare, usa esistente) |

---

## 7. Rischi e mitigazioni

| Rischio | Probabilità | Impatto | Mitigazione |
| --- | --- | --- | --- |
| Pickup alignment fix richiede più giorni del previsto | Alta | Bloccante | Time-box rigido. Se dopo 3 giorni non risolto, considerare rollback delle modifiche spring-return e ripartire da baseline |
| Scope creep verso il balancer/combat | Alta | Alto | Briefing è il contratto. Tutto fuori `src/ui/idleVillage/` va negoziato |
| `MarketActionCard.tsx` da implementare ex novo | Media | Medio | Allocare task dedicato in B.5, basarsi su `JobCard` + `QuestCard` come riferimento |
| Skill check estetica non convince utente | Media | Alto | Prototipare presto (Macro-Fase C, anche prima della Fase B completa). Iterare con utente |
| Build Steam richiede certificazioni complesse | Bassa | Medio | Steam è permissivo per indie. Tauri firmato basta. |
| Documenti precedenti continuano a confondere (Focolare/Zuppa/Cripta) | Alta | Basso | Pulizia docs in Macro-Fase F.5 (basso priorità ma utile) |
| Bug nascosti nel codice idleVillage (349 .tsx) | Alta | Medio | Procedere incrementalmente, fix solo dove serve, niente refactor cosmetici |

---

## 8. Definition of Done — slice pronta per Steam

- [ ] Drag pickup centrato sul token (verifica utente reale)
- [ ] Spring return al token origin (verifica utente reale)
- [ ] `npm run dev` apre `/minimal-gameplay`, zero errori in console
- [ ] Loop completo gioca senza crash per ≥ 30 min
- [ ] Skill check estetica approvata dall'utente
- [ ] Almeno 1 level up + 1 upgrade edificio durante playthrough
- [ ] Reclutamento nuovo eroe avvenuto in playthrough
- [ ] BGM mistico + 4 SFX presenti
- [ ] Save / Load testati con reload pagina
- [ ] Tutto il testo nuovo passa da `LocalizationService`
- [ ] `npm run build` exit 0 (con balancer escluso)
- [ ] Deploy Vercel live e accessibile
- [ ] Build Tauri `.dmg` apre e gioca
- [ ] Steam page predisposta (capsule, screenshot, descrizione)
- [ ] Tag `v0.1-vertical-slice-steam` creato
- [ ] Filmato 5 min di gameplay realizzato per trailer

---

## 9. Prossimo task concreto

**Macro-Fase A.1 → A.5: drag pickup alignment fix.**

Prompt suggerito (modificato dall'handoff §11 per il contesto attuale):

```
OBIETTIVO
Fix del drag pickup: quando il giocatore afferra un medaglione PG (PgCard o SlottedMedal),
il cursore/hand deve essere centrato sul token, non shiftato.

VINCOLI
- Solo intervento minimo
- No spring-return polishing in questa task
- No portrait work, no sorting, no docs
- File coinvolti probabili:
  * src/ui/idleVillage/components/PgCard.tsx
  * src/ui/idleVillage/components/SlottedMedal.tsx
  * src/ui/idleVillage/components/CustomDragOverlay.tsx
  * dnd-kit useDraggable activation/measurement
- Niente "estimated geometry": usare DOM rect reali (handoff §6.2)

VERIFICA
- Manual signoff utente: "il cursore è centrato sul token al pickup"
- Solo questo chiude il task

EVIDENCE
- test-results/drag-pickup-alignment-fix-<YYYY-MM-DD>.log
```

Quando vuoi che parta con questo task, dimmelo. Prima di farlo, però, manca ancora chiarire le 7 decisioni pendenti in `GAMEPLAY_DESIGN.md` §11.
