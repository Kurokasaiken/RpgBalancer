# Verifica finale — Dossier candidatura Tambù «Prima Pubblicazione»

Data: 2026-11-15 · Preparato per: Fausto · Gioco: **Wanderlust: Triumph**

## 1. Controllo limiti formali

| Requisito call | Limite | Misurato | Esito |
|---|---|---|---|
| Descrizione del progetto | ≤ 2.000 caratteri spazi inclusi | 1.897 | ✅ |
| Sintesi GDD | ≤ 5 pagine | 3 pagine (PDF A4) | ✅ |
| Team e CV | fino a 8 file o 1 zip | 1 documento (md+docx+pdf) | ✅ |
| Piano di produzione (campo facoltativo) | ≤ 2.000 caratteri | 1.478 | ✅ |
| Gioco in breve (campo form) | ≤ 600 caratteri | ~490 | ✅ verificare conteggio nel form |
| Screenshot | ≤ 6 immagini | 6 JPEG ≤1 MB | ✅ |
| Video | ≤ 500 MB, link | non prodotto | ⚠ da registrare |
| Dichiarazione firmata | PAdES / .p7m | non prodotta | ⚠ azione manuale obbligatoria |

## 2. Coerenza tra i materiali

- Posizionamento uniforme in tutti i documenti: *fantasy strategy / management roguelite*, ispirazioni dichiarate LoW + Cultist Simulator (+ M&B/Battle Brothers per mappa e gestione).
- «Spedizioni fino a ~20 eroi» sempre marcato come **design/fasi avanzate**, mai come implementato.
- Stato dichiarato uniforme: **GDD + Prototipo avanzato** — non MVP, non vertical slice (core loop end-to-end non ancora assemblato: coerente con `CURRENT_STATE.md`).
- Uso AI dichiarato coerentemente nel form («Sì, la usiamo»), nel CV e nel GDD (produzione visiva + pair-programming sotto direzione umana).
- Team = 1 persona in tutti i documenti; nessun collaboratore inventato.

## 3. Fatti / stime / ipotesi

**FACT (verificati nel repository o sulle superfici reali):**
- Titolo `Wanderlust: Triumph` (dossier director-knowledge, repo `Kurokasaiken/RpgBalancer`).
- Implementato su `/game`: mappa dipinta hi-res con zoom e giorno/notte, HUD tempo/risorse/nav, vista villaggio, drawer quest (party slot, journey, risk&rewards, confirm), roster livelli/HP, finestra quest a fasi + rapporto spedizione, ricompense/level-up, Sala dei Caduti, reliquiario eredità, menu con salvataggi multipli, EN/IT, profili grafici desktop/Deck/mobile.
- 6 canali stat (`str,agi,con,int,perc,cha`), 4 slot equip, ritirata a checkpoint, simulazione analitica+Monte Carlo.
- «~20 membri» e «lose to progress» documentati in `GAME_VISION_IDLE_INCREMENTAL.md` (§73, §5, edifici meta).
- Stack: TypeScript/React/PixiJS WebGL2; deploy Vercel `rpg-balancer.vercel.app`.
- Profilo CV: Java/Quarkus ~3 anni, PostgreSQL, REST, Docker Compose (fonte `director-knowledge/PROFILO.md`).

**ESTIMATE (stime marcate nei documenti):**
- Tempi di produzione per fase (2–4 mesi core loop, 3–6 slice, release 2027–2028).
- Costi futuri (Steam Direct ~€100, marketing, audio).

**ASSUMPTION / DA CONFERMARE (tutti marcati `[DA CONFERMARE]` nei documenti):**
- Dati anagrafici e fiscali del referente.
- Ore settimanali dedicate, cifre spese/budget.
- Build pubblica aggiornata e linkabile come «prototipo giocabile PC».
- Nome d'arte Kurokasaiken.

## 4. Discrepanze e rischi rilevati

1. **Screenshot 02/03/04** contengono overlay dev (`DIRECTOR`, `SUPERFICI`, `SELECT A TEST MARKER`): ricatturare da build prod o con staging nascosto prima dell'invio — pena presentare superfici non finali.
2. **Vista villaggio**: gli screenshot attuali mostrano la scena dipinta con pochi edifici visibili; valutare uno stato con più layer edifici attivi per comunicare «insediamento gestionale».
3. **«Prototipo giocabile su PC Windows»**: il form chiede esplicitamente Windows; la build è web — dichiararla come tale nel campo o produrre eseguibile Tauri.
4. **Checkbox «Art bible»**: la direzione artistica è documentata ma non consolidata in un'art bible unica → raccomandato NON spuntarla.
5. **Nessun playtest esterno documentato** di recente (una prova con amico a ottobre): non vantare playtest nel dossier.
6. Il video è il singolo deliverable più costoso ancora mancante.

## 5. Azioni residue prima dell'invio (checklist)

- [x] Dati referente compilati (Boni/email/telefono/CF) — 2026-11-16.
- [x] Prospetto economico compilato con dati reali (€22/mese ≈ €280 investiti, >20h/sett da ott 2025, capitale >€1000) — 2026-11-16.
- [x] Dichiarazione compilata e firmata digitalmente PAdES self-signed (+.p7m) — 2026-11-16. NOTA: certificato auto-generato, non qualificato da CA.
- [ ] Compilare tutti i `[DA CONFERMARE]` (anagrafica, finanze, ore).
- [ ] Ricatturare screenshot 02/03/04 senza overlay dev; eventualmente sostituire 02 con vista villaggio «piena».
- [ ] Registrare video gameplay commentato (scaletta in `06_Gameplay_Showcase`).
- [ ] Verificare link build pubblica aggiornata.
- [ ] Scaricare, compilare e firmare digitalmente la Dichiarazione di Partecipazione.
- [ ] Leggere Call for Projects PDF + informativa privacy; spuntare le dichiarazioni.
- [ ] Upload dei 4 obbligatori in formato .docx o .pdf (entrambi presenti in ogni cartella).
- [ ] **Non inviare finché il Director non ha riletto tutto.**
