# Vertical Slice "Pacifista" – Gameplay & Economy Spec

Script operativo per i primi 10 minuti (senza combattimento) della demo Idle Village. Traduce le regole psicologiche e le quattro fasi in parametri concreti da caricare nella state machine/config. Tutti i valori sono pensati per essere facili da iterare in Physics Lab + Style Laboratory.

## 1. Golden Rules (Psychological Balance Guardrails)

| ID | Regola | Implementazione tecnica |
| --- | --- | --- |
| GR-1 | **Cibo = Buff, non Tassa** | Ogni ricetta "cotta" applica `BenNutrito` (+20% XP gain, +1 stat random temporanea per 2 cicli). Niente stati "muori se non mangi". |
| GR-2 | **Fail Forward** | Gli skill check (Asterism) restituiscono l'oggetto e generano un debuff temporaneo (`Ferita`, `UmiditaNelleOssa`) che blocca l'eroe per X cicli/sleep. |
| GR-3 | **Asterism Fisico** | Pilastri fisici: su fail il pilastro della stat richiesta collassa (shader + particelle). UI mostra il delta richiesto (+2 forza avrebbe aiutato). |
| GR-4 | **Progressione Visiva** | Campo base passa da `TendaLv0` → `Tenda+Focolare` → `BaraccaLv1`. Ogni upgrade sblocca preset visivi e nuove ricette. |

## 2. Script in Quattro Fasi

### Timeline sintetica

| Fase | Minuti | Componenti attivi | Obiettivo del giocatore | Punto di attrito |
| --- | --- | --- | --- | --- |
| 1. Povertà | 0–2 | Vagabondo (Lv1), Tenda Lv0, Nodo "Rovine" | Capire drag/drop, sentire il tonfo, raccogliere prime risorse | Stamina dopo 3 cicli → obbliga al riposo |
| 2. Investimento | 2–5 | Mercante o Tavolo Crafting, Focolare | Decidere tra sopravvivenza breve termine o upgrade | Risorse appena sufficienti: devi scegliere una sola cosa |
| 3. Muro & Fallimento | 5–8 | Quest "Cripta Allagata", Asterism V2 | Mostrare fallimento controllato, introdurre debuff | Probabilità 40% → fallimento quasi certo, debuff `Umidita` |
| 4. Trionfo | 8–10 | Equip "Piede di Porco", ritorno alla quest | Dimostrare differenza con equip e buff `BenNutrito` | Asterism 75% → successo, drop lore + teaser nuovo eroe |

### Flusso dettagliato

1. **Povertà**
   - Drag `Vagabondo` → slot `Rovine`. Physics Lab riproduce peso (liftScale ~1.08), halo e thud.
   - Ogni ciclo (20s) rende `+1 Pietra Grezza` + `+1 Scarti`.
   - Stamina 100 → -35/ciclo. Dopo 3 cicli <10% ⇒ UI forzata a trascinarlo nella `Tenda` (azione "Riposa").
2. **Investimento**
   - Riposo 30s, Stamina full.
   - Risorse: circa 3 Pietra, 3 Scarti + reward random. Sblocco `CraftingChoice`: 8P/6S per Mercante oppure 10P/5S per `Focolare`.
   - Il piano guida verso Focolare: sblocca ricetta `Scarti → Zuppa Calda` (2 Scarti → 1 Zuppa ogni 30s) = buff `BenNutrito` (+1 ciclo lavoro, +5% Forza per 2 cicli).
3. **Muro & Fallimento**
   - Quest `Cripta Allagata` appare (Forza richiesta 6). Vagabondo base = 4. Probabilità 40%.
   - Fail = Asterism crolla, produce `UmiditaNelleOssa`: -20% Forza, -20% Stamina recovery per 2 cicli.
   - Debuff richiede dormita + 1 Zuppa per rimuoversi.
4. **Trionfo**
   - Nuova ricetta `Piede di Porco`: 6 Pietra + 2 Oggetti Recuperati (drop 15% dalle Rovine dopo fail) → equip arma.
   - Equip + buff porta Forza effettiva a 6.5 => Asterism chance 75%.
   - Successo = audio monete + drop `Oggetto Antico` (Lore) + `Fama +1`. Appare silhouette nuovo eroe nel roster.

## 3. Economia & Costi

| Elemento | Costo materiali | Tempo produzione | Effetto |
| --- | --- | --- | --- |
| Focolare (upgrade Tenda) | 10 Pietra + 5 Scarti | 45s build | +1 slot ricetta, sblocca `Zuppa Calda`, +10% stamina recovery |
| Mercante (cibo rapido) | 8 Pietra + 6 Scarti | 30s | Converte 2 Scarti → 1 Snack (buff +5% XP per 1 ciclo) |
| Zuppa Calda | 2 Scarti | 30s auto | Stato `BenNutrito`: +20% XP, +1 ciclo lavoro, +5% Forza (stack 1) |
| Riposo in Tenda | 0 (slot occupato) | 30s | Rimuove `Esausto`, ripristina Stamina 100% |
| Quest Cripta (tentativo) | 0 | 15s anim | Base reward XP 50; su fail debuff |
| Piede di Porco | 6 Pietra + 2 Oggetti Recuperati | 40s | Equip arma: +2 Forza, +15% success chance |
| Oggetto Antico (reward) | n/a | n/a | Lore item + `Fama +1` (trigger nuovo eroe) |

## 4. Stati & Debuff

| Stato | Trigger | Effetto | Rimozione |
| --- | --- | --- | --- |
| `Esausto` | Stamina < 10% | -50% output lavoro, quest bloccate | Riposo |
| `BenNutrito` | Consumare Zuppa | +20% XP, +1 ciclo lavoro, +5% Forza | Scade dopo 2 cicli o dormita |
| `UmiditaNelleOssa` | Fail Cripta | -20% Forza, -20% Stamina recovery | Dormita + 1 Zuppa |
| `Ferita` (riserva) | Fail futuri | -30% output, richiede cura avanzata | Non usata in slice ma definita |

## 5. Componenti UI da certificare nel Physics Lab

1. **Hero Card** – deve mostrare Stamina, buff/debuff, slot equip, indicatori di probabilità Asterism quando un oggetto viene equipaggiato.
2. **Work Slots (Rovine/Tenda)** – feedback glowing/pulse legato a Stamina e occupancy; deve supportare drag back-and-forth (Physics Lab toggles: Chaos mode per 20 carte).
3. **Resource HUD** – mostra pietra/scarti/zuppa con micro-animazioni (fly-to counters) e warning quando risorse insufficienti.
4. **Asterism V2 Canvas** – pilastri in pietra, catene, outcome tiers; deve reagire all’equip (Piede di Porco) e crollare in caso di fail.
5. **Buff Indicators** – overlay UI per `BenNutrito`, `Umidita` con timer/progress.
6. **Audio/FX** – tonfi drag (fase 1), collapse (fase 3), coins+glow (fase 4); includere nel piano FX/HUD per vertical slice.

## 6. Step Operativi Immediati

1. **Config Sheet** – portare questa tabella in `minimalGameplayConfig` / preset JSON (costs, timers, drop rates). → Input per state machine.
2. **Physics Lab alignment** – aggiornare i preset della carta/slot/resource HUD con i parametri reali, abilitare FPS HUD e Chaos mode.
3. **Quest/Asterism** – montare la scena V2 (Shader, catene, outcome tiers) con probabilità 40%/75% configurabili.
4. **State Machine Test** – simulare i 10 minuti nel browser (Script timeline) e raccogliere log di tempi morti/eventi.
5. **Evidence** – tracciare `physics_lab_adjusted`, `physics_lab_exported`, `minimal_slice_playthrough` per QA.
