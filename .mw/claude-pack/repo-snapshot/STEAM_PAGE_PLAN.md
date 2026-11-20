# Steam Page Plan — pagina "Coming Soon" (r005)

**Stato:** Proposed (non ratificato) — r005, riveduto via dibattito multi-AI web (chatgpt, claude, grok) 2026-10-09
**Richiesta:** R-117 in `RICHIESTE.md`
**Obiettivo:** aprire la pagina Steam il prima possibile per raccogliere wishlist — ma **abbastanza convincente da convertire le visite in wishlist senza creare aspettative che lo sviluppo non può mantenere**. Priorità del Director: reputazione > ricavi; prezzo previsto 14.99 premium.
**Regola delle fonti:** ogni regola Steam citata è marcata `CONFIRMED` (doc Steamworks ufficiale, con URL in appendice), `UNVERIFIED` (da controllare prima dell'upload) o `RECOMMENDATION`. Un `CONFIRMED` senza URL+data in appendice decade automaticamente a `UNVERIFIED`. La checklist Steamworks resta l'ultima parola.

---

## 0. Decisioni del Director (con reversibilità)

| # | Decisione | Reversibilità | Nota |
|---|---|---|---|
| D1 | **Nome del gioco** | **Cara** — blocca la pubblicazione | **Deciso (Director, 2026-10-09): "Wanderlust: Triumph"** — check Steam 2026-10-09: nessun omonimo esatto; però esiste il franchise `Wanderlust` (Different Tales, 3 titoli "Wanderlust: X" 2019-2020) + `Wanderlust: The Bermuda Secret` (2021) — stesso pattern "Wanderlust: Sottotitolo", search diluita, possibile marchio registrato. **Prima del logo: verifica marchio videogiochi su EUIPO/USPTO** (check <200€). "RpgBalancer" = codename |
| D5 | **Disclosure AI** | Blocca la pubblicazione | Questionario contenuti obbligatorio, pubblico sulla pagina, coerente col copy (§6) |
| D2 | **Pitch** | Economica | Regola sul copy: le bozze devono passare il claim ledger |
| D3 | **Genere dichiarato** | Economica | **Deciso (Director, 2026-10-10): "roguelite" SÌ** — morte→bonus = meta-progressione core, nella demo. Va nel build prima del lancio → tag/claim solo dopo verifica in-build |
| D4 | **Lingue del gioco** | Economica | **Deciso (Director, 2026-10-10):** pagina store **EN/IT** subito; gioco al lancio demo **EN/IT/DE/FR** (FR incerta — "forse no francese"); **ES/DE/ZH-CN** solo dopo trazione → "localization roadmap" nella sezione planned, NON dichiarate come supportate. Authored content oggi solo IT → serve EN content per la pagina EN |
| D6 | **Data** | Economica | **Deciso (Director, 2026-10-10): "Coming Soon"**. Prezzo NON bloccante: le pagine Coming Soon non mostrano il prezzo; decidibile fino al lancio. **Strategia prezzo (Director 2026-10-11/12, R-160, provvisoria):** pattern di nicchia — ingresso basso + sconto lancio -10/15% + rialzo come evento alla 1.0; base chiarita: **~$9.99 lancio → ~$14.99 alla 1.0** (ref `context/COMPETITIVE_LANDSCAPE.md` §8.1). Rivedere il "$14.99 premium" ipotizzato in §0 quando si fissa il prezzo |

Solo D1 e D5 sono **decisioni del Director** che bloccano la pubblicazione; D2–D4, D6 sono regole sul contenuto: gli asset reversibili (screenshot, clip, bozze) si producono prima del titolo. Distinto dalle decisioni, il GATE di §7 elenca **requisiti operativi oggettivi** (≥5 screenshot reali, test di comprensione superato, canale scelto, hub verificato): sono precondizioni di qualità, non decisioni — non derogabili singolarmente, con unica eccezione il trailer (waiver scritto del Director), perché una pagina sotto soglia non converte e danneggia la reputazione.

### 0.1 Claim ledger — fonte unica per tutto il copy
File `marketing/steam/claim-ledger.md`, obbligatorio prima dell'invio. Tre stati:

| Stato | Dove può apparire |
|---|---|
| **true-now** (esiste e dimostrabile nel build oggi) | ovunque: short desc, tag, capsule, about |
| **true-at-launch** (committato ma non ancora implementato) | **solo** nella sezione "What we're building", con data di revisione |
| **vietato** | mai |

- Con nessuna data di lancio, un claim "true-at-launch" non ha falsificatore: **ogni update re-audita il ledger; un claim ancora non costruito dopo due audit viene rimosso, non ammorbidito**.
- Ogni verbo del copy ("prepare", "assign", "defend") va classificato come azione dimostrabile o promessa — es. "prepare your heroes" è lecito solo se roster/assegnazione sono verificati sulla superficie di lancio.

---

## 1. Mappa della pagina

| Zona | Contenuto | Priorità |
|---|---|---|
| **Capsule** | Arte + logo + eventuale sottotitolo ufficiale. Niente testo promozionale sulle capsule base (`CONFIRMED` — Graphical Asset Rules: solo artwork, nome gioco, sottotitolo ufficiale; testo extra solo via Artwork Override localizzata ~1 mese) | **P0** |
| **Video slot 1** | Trailer gameplay minimo 15-30 s da sequenze reali | **P0-alto** (`CONFIRMED`: i primi due trailer precedono gli screenshot; Steam raccomanda gameplay-first, leggibile senza audio) |
| **Screenshot** | ≥5 reali in-engine ≥1920×1080, ordinati per comprensione | **P0** (`CONFIRMED`: min 5, solo gameplay reale, no concept art/mock/testo marketing) |
| **Short description** | 1 frase ≤300 char, solo claim true-now | **P0** |
| **Tag** | fino a 20, ordinate per verità del gioco | **P0** |
| **About** | Hook + sezioni con GIF/video come prova progressiva | **P0** |
| **Info laterali** | Lingue (gate §5), requisiti (da misurare: Tauri/WebView2), dev/publisher, link | P1 |
| **Content Survey + AI** | Tabella asset + wording (§6) | **P0** |

**Attenzione trailer:** le tre scene (mappa → scelta quest → Astrolabio) sono autentiche ma il loop non è assemblato — il montaggio non deve suggerire continuità inesistente. Gate: uno spettatore estraneo non deve dedurre che il core loop sia già giocabile. Se non riesce in 15-30 s, meglio un video più breve e inequivocabile. Il trailer è un **gate qualitativo**, non un prerequisito assoluto: il Director può approvare un waiver esplicito se ritarda sensibilmente la pagina (altrimenti si ritarda).

---

## 2. Asset

### 2.1 Screenshot — shot list
Regole `CONFIRMED`: ≥5 screenshot, ≥1920×1080 16:9, solo gameplay in-engine reale.

| # | Scena | Reale nel build? | Cosa mostra |
|---|---|---|---|
| 1 | **Gameplay leggibile** (quest con scelta + Astrolabio, o mappa con evento leggibile in corso) | Y | Cosa fa il giocatore |
| 2 | Mappa intera viva | Y | Il mondo |
| 3 | Astrolabio durante un tiro | Y | La meccanica-firma |
| 4 | Invasione goblin / minaccia | Y | Posta in gioco |
| 5 | Roster/assegnazione | da verificare | Il gestionale |
| 6 | Vista villaggio | da verificare | Cosa gestisci |
| ~~7~~ | SETTLEMENT LOST | **mock → ESCLUSO** | rientra quando implementato |
| ~~8~~ | Scheda eroe | **placeholder → ESCLUSO** | rientra quando è bello |

- **Procedura di selezione:** la shot list è ordinata per preferenza; si prendono i primi 5 che risultano "reali nel build". Se meno di 5 verificano → ritardo, mai riempire con mock. Il test di comprensione gira **sul set finale effettivo** (i 5 che andranno in upload), non sulla lista teorica.
- **Criterio go/no-go screenshot (r002):** "da reputazione" = uno spettatore estraneo capisce il gioco dal primo screenshot + ogni shot regge il confronto affiancato ai comparabili (Against the Storm ecc.).
- **Test di comprensione (regola decisionale univoca):** l'intera sequenza che il visitatore vedrà — capsule + short desc + **tutti** gli screenshot nell'ordine finale + il trailer se presente — a 5 estranei → "che gioco è? cosa fai? cosa è già giocabile?". **Misread critico** = descrive un genere diverso da "gestione villaggio + quest" OPPURE crede giocabile qualcosa di non implementato (run-end, preparazione eroi se non verificata, ecc.). **Regola: si pubblica solo quando gli ultimi 5 tester consecutivi producono zero misread critici**; un solo misread → si corregge l'asset incriminato e si riparte il conteggio. Campione piccolo per scelta: il test cerca errori grossolani, non significatività statistica.

### 2.2 Video
- **Trailer gameplay minimo** (slot 1): 15-30 s, tre capacità distinte senza finta continuità, no voice-over, musica solo licenziata.
- Teaser R-072 → primo posto quando esiste.

### 2.3 GIF/media nella descrizione lunga
- La colonna descrizione è passata a **780 px** nel redesign store 2025 (pagina a 1200 px): GIF target ~780 px, non 616 (616 = misura storica).
- La descrizione accetta anche **.mp4/.webm** (riportato ~100 MB / ~12 s — `UNVERIFIED`, verificare in Steamworks): se confermato, preferire video corti a GIF pesanti.

### 2.4 Capsule e logo
Dimensioni dalla tabella ufficiale "Graphical Assets" **da scaricare al momento della produzione** (i valori in circolazione — header 920×430, small 462×174, main 1232×706, vertical 748×896 — provengono da fonti secondarie: `UNVERIFIED` fino al template ufficiale). Regole `CONFIRMED`: artwork + nome + sottotitolo ufficiale; Library Hero = solo artwork.
- Una sola idea per capsula, niente collage. Arte derivata da render in-engine reali: non può mostrare cose che il gioco non ha.
- Test: small capsule a dimensione reale accanto a 10 capsule del genere; logo leggibile.

### 2.5 Moodboard — fuori dalla pagina (press kit/devlog/Reddit).

---

## 3. Testi

### Principi
1. Promessa prima delle feature. 2. **Claim ledger** su ogni frase. 3. Verbi del giocatore, ognuno classificato dimostrabile/promessa. 4. Corto. 5. Funnel: primo blocco = "che gioco è / cosa faccio / perché seguirlo ora"; about = prova progressiva.
6. **Parole vietate fino a prova contraria:** `hand-painted`, `hand-drawn`, `handcrafted`, `procedural`; `roguelite`, `invasion`, `storm is coming` e ogni allusione alla fine della run finché D3 non committa. Alternative: `painterly`, `illustrated`, `a living map`.

### Short description — varianti (EN master; tutte solo true-now)
- A: *"Lead a frontier village on a living, painterly continent. Send heroes on perilous quests, read the stars of the Destiny Astrolabe, and decide what you're willing to pay for every choice."*
- B: *"A village-management RPG where every quest has a price. Assign your people, roll fate on the Astrolabe, and live with what it costs."* (verbo "assign" da classificare nel ledger: dimostrabile se roster/assegnazione verificati)
- C: *"Your village is small, the world is wide. Plan, gamble, and pay the price of every choice in a painterly fantasy management RPG."*

### Descrizione lunga — struttura
1. Hook + media mappa. 2. **A living world**. 3. **Every quest has a price** (R-094). 4. **Read your destiny** (Astrolabio). 5. **What exists / what we're building** — due elenchi espliciti e non ambigui: *"Systems shown are real and in-engine today"* (solo claim true-now) + *"Planned:"* dove ogni claim true-at-launch è marcato singolarmente come pianificato e porta la sua data di revisione (re-audit a ogni update; rimosso dopo due audit senza implementazione). 6. Wishlist + cosa mostreremo (teaser, demo) + Discord se esiste.

### Tono — fantasy classico leggibile, caldo e un po' solenne. La disclosure AI e la pagina dicono la stessa cosa.

---

## 4. Tag
Fino a 20 tag (`CONFIRMED` cap esiste; "l'ordine conta / prime 5 pesano" è `UNVERIFIED` — confermare nella doc Tags attuale). Le tag sono poi votate dagli utenti — una sbagliata viene corretta pubblicamente.
- **True-now:** Management, RPG, Fantasy, Strategy, Choices Matter, Atmospheric, Singleplayer, Indie.
- **Gate D3:** Roguelite, Permadeath.
- **Da validare su comparabili:** Colony Sim/Village Builder, Base Building, Real-Time with Pause (TimeEngine ha tick+pausa).
- Metodo: comparabili + Tag Wizard; lista finale esportata e ri-verificata prima dell'invio.

---

## 5. Lingue
- **Gate semantico** (non solo conteggio chiavi): script che verifica per locale — chiavi mancanti, valori vuoti, fallback usati, interpolazioni/plurali — poi test sui percorsi UI effettivamente nel build. Una lingua di gioco si dichiara solo se le stringhe visibili sono complete.
- Pagina tradotta ≠ gioco tradotto: nota onesta dove serve ("page translated, game in EN/IT").
- `ar`: solo se RTL testato in gioco.
- Apertura: pagina **EN+IT**; gioco: solo lingue che passano il gate. Pre-teaser: +DE/FR/ES/PT-BR/ZH-Hans (+RU/JA se revisione sostenibile), glossario fisso → AI → **revisione madrelingua**.

---

## 6. AI Disclosure (deliverable obbligatorio)
File `marketing/steam/ai-disclosure.md` prima dell'invio. **Due tavole separate** (r002): contenuti nel build vs materiali marketing/localizzazioni.

**Prima di scriverla — provenance audit:** per ogni asset AI nel build documentare modello base e licenza, LoRA/checkpoint, immagini sorgente img2img e loro ownership, e grep dei prompt per nomi di artisti viventi. Valve richiede che il contenuto pre-generato non contenga materiale illecito/infringing (`CONFIRMED` riportato da fonti secondarie — verificare wording nel survey). "Coinvolgimento umano" si scrive solo da dichiarazione del Director, non pre-compilato.
- Survey `CONFIRMED`: sezioni **Pre-Generated** vs **Live-Generated**; la disclosure è pubblica sulla pagina.
- `Live-Generated: none` **solo dopo code-search reale** su runtime.
- Tono: prima persona, parole semplici, coerente col copy.

---

## 7. Fasi operative (r002)

| Fase | Contenuto | Dipende da |
|---|---|---|
| F0 — Regole contenuto | Claim ledger v1; D2/D3/D4/D6 come regole | Director |
| F1 — Account | Steamworks, $100 fee, fiscale/bancario; attesa primo titolo `UNVERIFIED` (21-30 gg, confermare) | Director |
| F2 — Asset | logo + capsule + ≥5 screenshot verificati + trailer minimo | modalità cattura; D1 solo per logo/capsule |
| F3 — Testi | short + about + tag che passano il ledger | F0 |
| **GATE pubblicazione** | D1 fatto; D5 scritta+provenance audit; ≥5 shot reali (criterio §2.1); test comprensione: zero misread critici negli ultimi 5 tester (§2.1); trailer pronto **o waiver scritto del Director**; canale primario di distribuzione scelto; Community Hub: l'unico requisito è **verificare** se l'account lo attiva — se sì: post pinnato + owner + check settimanale; se la piattaforma non lo rende disponibile, il punto si chiude con nota nel ledger e si ricontrolla al primo update (non è bloccante) | Director |
| F4 — Review Valve | `CONFIRMED`: pagina pubblica ≥2 settimane prima del release; inviare a review ≥7 giorni lavorativi prima della pubblicazione desiderata | GATE |
| F5 — Vita della pagina | **Una regola sola: mai update vuoti a scadenza.** Update quando esiste qualcosa di dimostrabile; se a ~30 gg non c'è nulla di nuovo, una status-note onesta ("in early development, ecco cosa è reale") è ammessa ma non obbligatoria. Check settimanale Community Hub se attivo; baseline traffico/wishlist | post-F4 |
| F6 — Lingue pagina | traduzioni + revisione madrelingua | F3 |
| F7 — Teaser R-072 | primo posto nel carosello | R-072 |
| F8 — Demo/Next Fest | app separata | core loop |

### Lavoro tecnico
**Modalità cattura su `/game`** (pannelli nascosti, 1920×1080+, seed deterministico, no cursore) · **script ffmpeg** GIF/clip · **script gate i18n** (semantico) · **grep provenance AI** (§6).

---

## 8. Checklist finale
- [ ] Nome verificato (omonimi Steam, marchi)
- [ ] Claim ledger compilato; ogni frase = true-now sopra la piega, true-at-launch solo in "What we're building"
- [ ] Parole vietate assenti (§3.6) — inclusi "storm/invasion" pre-D3
- [ ] Capsule: arte+logo, dim da template ufficiale scaricato, small leggibile
- [ ] ≥5 screenshot reali, criterio estraneo superato
- [ ] Trailer leggibile senza audio, nessuna falsa continuità — o waiver Director scritto
- [ ] Tag ≤20, D3-gated fuori finché non committate
- [ ] AI disclosure: provenance audit fatto, Live-Generated verificato, coerente col copy
- [ ] Lingue gioco = gate semantico passato
- [ ] Review inviata ≥7 gg lav.; pagina pubblica ≥2 sett. prima di release (`CONFIRMED`)
- [ ] Community Hub: attivabilità verificata sull'account; se attivo, post pinnato + owner + check settimanale
- [ ] Canale primario di distribuzione scelto; piano per il primo update reale (nessuna data forzata)
- [ ] Link esterni funzionanti o assenti

---

## Appendice A — Fonti da consolidare (ogni CONFIRMED va qui con URL+data prima dell'invio)
- Steamworks "Graphical Assets" (capsule rules, override) · "Screenshots" (≥5, 1920×1080, gameplay-only) · "Trailers" (gameplay-first, precedono screenshot) · "Coming Soon" (≥2 sett. pubblica; review ≥7 gg lav.) · "Content Survey — Generative AI" (pre- vs live-generated, pubblica) · "Steam Tags" (cap 20, ordine) · Store redesign 2025 (pagina 1200 px, colonna 780 px).
- Da verificare in Steamworks al momento dell'esecuzione: dimensioni capsule esatte, limiti GIF/video in descrizione, attesa primo titolo, regole tag utenti.

## Appendice B — Punti contestati (decisioni Director)
- **Prezzo 14.99 vs 4.99** (grok): non adottato — prezzo = decisione Director già espressa; la pagina Coming Soon non ha acquisto quindi il rischio refund non nasce qui (claude). Rischio residuo annotato: premium + contenuto sottile al lancio.
- **Cadenza**: convergenza su "update solo quando c'è contenuto dimostrabile + hub curato", mai un calendario artificiale né update vuoti a scadenza.
