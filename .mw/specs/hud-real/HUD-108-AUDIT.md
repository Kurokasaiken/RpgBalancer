# HUD-108 — Audit visivo e funzionale della HUD nuova (2026-11-04)

> Audit senza modifiche al codice. Basato sul rendering reale di `/hud-compose` (Playwright, 1280×800, 1440×900, 1920×1080) e sul codice in `src/ui/idleVillage/hudReal/`. Nasce da una critica esterna incollata dal Director; qui sotto le sue tesi sono verificate, non assunte.

## 0. Correzioni di perimetro alla critica
| Tesi della critica | Verifica | Esito |
|---|---|---|
| "schermata attuale di `/game`" | La schermata è `/hud-compose` (pagina di prova di PLAN-110). `/game` mostra ancora la HUD di produzione, non toccata | L'audit riguarda `/hud-compose`; `/game` solo come confronto |
| "placca WANDERLUST viola D-1 di PLAN-107" | PLAN-110 **D-8** (Director): "emblema + placca WANDERLUST, sospende D-1 di PLAN-107" | Conforme. Unica nota: D-8 voleva la scritta come **immagine** (logo), oggi è testo in codice |
| "misurare contro il limite del 18%" | PLAN-110 **D-1**: scala dei mockup in R1, budget misurato in R2 (sospende Z-1) | Misurato comunque (§2); il tetto torna vincolante alla fase R2 |
| "cibo in rosso: verificare che sia critico" | Il tono `danger` arriva da `selectResourceOutlook` del gioco (0 giorni rimasti, −6/giorno) | Corretto e legato ai dati reali |

## 1. Inventario dei componenti (riquadri a 1440×900; scala 0,9 della tela 1600×900)
| # | Componente | File | Riquadro x,y,l,a | Funzione e dati | Stati | Collegamento ai dati | Modo proposto |
|---|---|---|---|---|---|---|---|
| C8 | Marchio | `HudRealBrand.tsx` + `brand/piece.webp` | 5,7,396,149 | emblema + titolo | nessuno | testo fisso | persistente, **ridotto** |
| C1 | Roster | `HudRealRoster.tsx` + `C1/*` | 51,−42,270,698 | ritratti, nome, livello, salute, stamina, stato | hover, focus, selezione, ferito, caduto, bloccato, scroll | **reale** (`useRosterKitData`) | persistente |
| C11 | Tempo | `HudRealTime.tsx` + `time/bar.webp` | 486,11,437,76 | giorno, pausa, ×1/×2/×4 | attivo, hover, focus | **demo locale**; sorgente reale esiste (`WhenWhereCluster`: `currentDay`, `speed`) | persistente |
| C12 | Comandi | `HudRealRoundButton.tsx` | 938,31,119,36 | menu, pannelli, nascondi | hover, attivo, focus | **nessuna azione** | persistente |
| C2 | Risorse | `HudRealResources.tsx` + `resources/bar.webp` | 1068,13,356,107 | oro, cibo, legno | pericolo, tooltip, focus | **reale** (`selectResourceOutlook`) | persistente |
| C4 | Pannello | `HudRealPanel.tsx` + `panel/frame.webp` | 1112,135,306,390 | dettaglio luogo + azione | CTA hover/focus/disabled | **testo fisso**; finestra **vuota** | contestuale |
| C9 | Busto | `HudRealBust.tsx` | 1332,135,99,92 | ornamento | — | — | segue il pannello |
| C10 | Voce | `HudRealVoce.tsx` + `voce/piece.webp` | 378,476,432,217 | narrazione | — (manca ingresso/uscita) | **testo fisso** | temporaneo |
| C3 | Nav | `HudRealNav.tsx` + `nav/bar.webp` | 310,626,821,179 | 4 voci + ricentra | attivo, bloccato, hover, focus | voci **reali** (config); selezione locale; ricentra **no-op** | persistente |
| C5 | Bussola | `HudRealCompass.tsx` + `compass/piece.webp` | 7,645,297,157 | coordinate + fase | — | **testo fisso**; nessuna sorgente in produzione | a richiesta (D-2 PLAN-107) |
| C7 | Sigillo | `HudRealSeal.tsx` + `seal/bar.webp` | 1150,604,188,174 | % di successo + 5 marchi | tooltip | **testo fisso**; nessuna sorgente in produzione | contestuale (spedizione) |
| C6 | Globo | `HudRealGlobe.tsx` | 1346,709,72,83 | pulsante | hover, focus | **nessuna azione** | da eliminare o assegnare |

## 2. Superficie occupata (metodo T-101b, due cifre)
| Vista | 1280×800 | 1440×900 | 1920×1080 |
|---|---|---|---|
| Riquadri DOM, tutto acceso | 53,0% | 52,9% | 58,9% |
| Riquadri DOM, solo persistenti | 36,1% | 36,1% | 40,2% |
| Pixel percepiti, solo persistenti | 25,6% | 24,9% | 26,6% |
| Pixel percepiti, tutto acceso | n.d. (*) | n.d. (*) | 40,7% |
Rumore di fondo della mappa animata tra due catture: 5,5–7,5% (va sottratto: persistenti ≈ **19–21%**). (*) a 1280 e 1440 la mappa si è spostata tra le catture: misura scartata. Esito: i soli persistenti sono **vicini al tetto del 18%**, il tutto-acceso lo supera di circa il doppio.

## 3. Problemi, per priorità
**P0 — struttura (prima di qualunque rifinitura)**
1. **Dati finti presentati come veri:** tempo, bussola, sigillo, Voce, pannello mostrano testo fisso; comandi e globo non fanno nulla; il ricentra della nav è vuoto. Per la regola "no dead chrome" (PLAN-107 D-2/D-3), ciò che non è collegato non deve restare persistente.
2. **Nessuna distinzione persistente / contestuale / temporaneo:** la pagina accende tutto insieme; superficie percepita ~35% a 1920.
3. **Slot vuoti:** due tondi della nav senza voce; finestra del pannello vuota (sembra un caricamento fallito).
4. **Sigillo fuori contesto:** il 68% è la probabilità di successo di una spedizione (mockup1-classic), non uno stato di campagna; come oggetto fisso in basso a destra non si capisce cosa misura.
**P1 — gerarchia e leggibilità**
5. Cinque protagonisti in competizione: marchio, roster, pannello, Voce, astrolabio della nav.
6. Corpo del testo: nomi del roster 14 px, livello 12 px, etichette nav 12 px, coordinate 13 px sulla tela 1600 (a 1280×800 diventano ~10–11 px reali).
7. Roster: selezione indistinguibile quando le placche sono a riposo; rombo a destra senza funzione; due barre (salute verde, stamina oro) senza legenda.
8. Bussola grande rispetto alle informazioni; tempo, comandi e risorse sono tre barre con proporzioni e ornamenti diversi.
**P2 — materiali e rifinitura**
9. Superfici interne povere rispetto ai bordi: lo smalto è piatto, l'oro porta tutta la ricchezza (conferma la critica §4).
10. Coerenza tra pezzi: smalto ora unificato (tinta 188°, L 21), ma spessori dei bordi e direzione della luce variano perché i pezzi sono generati separatamente.
11. Nessuna animazione d'ingresso/uscita per pannello, Voce e sigillo.

## 4. Scostamenti dalle decisioni
| Decisione | Stato |
|---|---|
| PLAN-110 D-8 (emblema + placca) | rispettata; scritta in codice invece che immagine |
| PLAN-110 D-1 (scala mockup in R1) | rispettata; budget da rimisurare in R2 |
| PLAN-107 D-2/D-3 (bussola e sigillo restano, persistenti solo se collegati) | **non rispettata**: entrambi persistenti senza dati reali |
| PLAN-107 D-4 (`base` resta predefinito, `zanara` dietro preset) | rispettata: nulla è su `/game` |
| Ruling 27/10 (solo vittoria + pericolo, teschi ok, niente drop %) | rispettato nel sigillo |

## 5. Tre viste proposte
- **Panoramica (persistente):** emblema ridotto, roster compatto (ritratti + gemma di stato, placche a passaggio), barra superiore unica (tempo · comandi · risorse con la stessa altezza e lo stesso bordo), nav con astrolabio più piccolo e senza tondi vuoti. Bersaglio ≤ 18% percepito.
- **Contestuale:** il pannello si apre alla selezione di un luogo o spedizione; il sigillo vive **dentro** il pannello (riga "probabilità di successo"), non nell'angolo.
- **Narrativa:** la Voce entra come notifica sottile (ritratto piccolo + una riga), espandibile; non si sovrappone al pannello (coda o lato opposto).
Bussola e globo: fuori dalla panoramica finché non hanno dati o azione.

## 6. Piano d'intervento (rischio crescente, valore decrescente)
1. **P0 senza immagini:** modo di visualizzazione per componente in `/hud-compose` (tre viste commutabili); collegare il tempo a `WhenWhereCluster`/store; togliere o nascondere ciò che non ha dati (bussola, globo, comandi senza azione); sigillo dentro il pannello; nav a 4 tondi o 2 voci in più reali. *~1 giornata, 0 immagini.*
2. **Misura** delle tre viste con T-101b (questa sessione ha il metodo pronto). *1 h.*
3. **Barra superiore unica** (C11 + C12 + C2 con stessa altezza e bordo). *0–3 immagini.*
4. **Roster compatto con stati** (gemma di stato sull'anello, selezione evidente, legenda barre). *0–2 immagini.*
5. **Spike materiali** (PLAN-107 T-102a medaglione, T-102b alabastro con superficie interna): è il punto dove la critica ha più ragione. *2–6 immagini.*
6. **Nav più leggera** (astrolabio ridotto, icone incise). *0–4 immagini.*
7. **Rifinitura:** animazioni, tipografia per schermo reale (≥14 px reali), accessibilità, test 1280→3440.

## 7. Task da aggiornare
- PLAN-110: aggiungere la fase "tre viste" prima di R2; marcare C5, C6, C7 come "a richiesta finché non collegati"; C12 senza azioni.
- PLAN-107: T-002 (modo per ornamento) → usare la tabella §1; T-101b → metodo e numeri di §2; T-102a/b restano validi e diventano il passo 5.
- DECISIONI-APERTE.md: le voci 3 (gerarchia), 4 (globo), 7 (comandi) trovano qui una proposta concreta.

## 8. Non verificato
Tutto è misurato su `/hud-compose`, non su `/game`; la misura "tutto acceso" vale solo a 1920; non ho testato 3440 né 390×844; l'occupazione percepita include i 5–7% di rumore della mappa animata.
