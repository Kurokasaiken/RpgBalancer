# Idle Incremental RPG – Profit Levers

**Status:** Draft v0.2 (verificato Dic 2024)  
**Scope:** Leve che possono aumentare ricavi / LTV senza compromettere la credibilità del gioco.

> [!NOTE]
> Dati di localizzazione verificati tramite fonti Steam ufficiali e studi di settore (LCP Localizations, GameDiscoverCo).

Legenda impatto/costo/ rischio: basso / medio / alto.

---

## 1. Riepilogo Leve

| ID | Categoria | Descrizione breve | Impatto stimato | Costo/complessità | Rischio credibilità | Stato |
| --- | --- | --- | --- | --- | --- | --- |
| L1 | Localizzazione | EN + IT + ES (core), valutare eventuale 4ª lingua | Medio–Alto | Basso–Medio | Basso | Da esplorare |
| L1.b | Storefront | Pagina Steam tradotta in ≥6 lingue anche se client non lo è | Medio | Basso | Basso | Da esplorare |
| L2 | Prezzi regione | Prezzi regionali (Steam, mobile) | Medio | Basso | Basso | Da esplorare |
| P1 | Piattaforme | Modello diverso per Web / Steam / Mobile | Alto | Medio | Medio | Da esplorare |
| P2 | Pricing base | Prezzo Steam/itch fissato a **€7.99** (no 14.99) | Medio–Alto | Basso | Medio | Da esplorare |
| M1 | Monetizzazione | Pacchetto base da ~5€ (remove annoyance + QoL) | Medio–Alto | Medio | Basso | Da esplorare |
| M2 | Monetizzazione | Time warp / accelerazioni (salta X ore, boost produzione) | Medio–Alto | Medio | Medio | Da esplorare |
| M3 | Monetizzazione | Resurrezioni / salvataggi eroici (es. Phoenix Feather) | Medio | Medio | Medio–Alto | Da esplorare |
| M4 | Monetizzazione | Cosmetic e personalizzazioni (skin, temi, statue, ecc.) | Medio | Medio–Alto | Molto basso | Da esplorare |
| M5 | Monetizzazione | DLC / espansioni (nuovi biomi, sistemi, fazioni) | Alto (long term) | Alto | Basso | Da esplorare |
| R1 | Retention | Profondità meta-progression (edifici meta, eredi, ecc.) | Alto | Alto | Medio | Da esplorare |
| R2 | Retention | Stagioni / reset morbidi e leaderboard stagionali | Medio–Alto | Medio–Alto | Basso–Medio | Da esplorare |
| R3 | Retention | **Overlay Mode** (gioca ridotto in fondo allo schermo) | Alto | Medio | Basso | **Racc. alta** |
| R4 | Retention | Tutorial iniziale fortemente curato (FTUE premium) | Medio–Alto | Medio | Basso | Da esplorare |
| C1 | Community | Modding facile (config, JSON, eventuale Workshop) | Medio | Medio | Basso | Da esplorare |
| C2 | Community | Tool di bilanciamento condivisi con i giocatori | Medio–Alto | Medio–Alto | Medio | Da esplorare |
| P3 | Platform | **Steam Deck Verified** (ottimizzazione controlli/UI) | Medio–Alto | Basso | Basso | **Racc. alta** |
| S1 | Storefront | Qualità pagina Steam/itch (testi, capsule, GIF, tag) | Alto | Medio | Basso | Da esplorare |
| S2 | Storefront | Demo strategica (web + eventuale demo Steam) | Medio–Alto | Medio | Medio | Da esplorare |
| S3 | Ecosistema | Futuri bundle / cross-promo con altri giochi | Alto (long term) | Medio | Basso | Da esplorare |
| S4 | Marketing | **Multi-Festival Strategy** (partecipare a festival minori prima) | Medio | Basso | Basso | **Racc. alta** |
| S5 | Marketing | **TikTok Validation** (test 5 clip per viralità organica) | Alto (potenziale) | Basso | Basso | **Racc. alta** |
| F1 | Funding | Crowdfunding (Kickstarter/Ulule, ecc.) | Medio–Alto | Medio–Alto | Medio | Da esplorare |
| F2 | Funding | Early Access (soprattutto Steam) | Medio | Medio | Basso–Medio | Da esplorare |
| F3 | Funding | Patreon/Ko-fi (supporto continuo da fan) | Medio (long term) | Basso–Medio | Basso | Da esplorare |
| F4 | Monetizzazione | Battle pass / season pass / abbonamenti | Medio–Alto | Medio–Alto | Medio | Da esplorare |
| F5 | Merch | Merchandise fisico/digitale (artbook, OST, gadget) | Medio (long term) | Alto | Basso | Da esplorare |
| F6 | Ports | Porting console/mobile tramite publisher o in proprio | Alto (long term) | Alto | Medio | Da esplorare |

> Nota: "Stato" verrà aggiornato a "Deciso: Sì/No/Più avanti" man mano che facciamo ricerche specifiche per leva.

---

### Collegamento Go-To-Market “Steam First” (GT-2)

- Le leve storefront/marketing (S1–S4) e retention (R2–R3) devono seguire il calendario e i KPI documentati in
  [`strategy/go_to_market_steam_first.md`](../strategy/go_to_market_steam_first.md).
- KPI chiave da monitorare e riallocare nei forecast:
  - **Wishlist attive:** target 25k entro 2026H1 (Steam Page + Next Fest).
  - **Conversione Playtest:** ≥40% opt-in/download tra wishlist e Playtest (#1/#2).
  - **Retention Sessione 1:** ≥55% entro 72h per i tester, correlata alle offerte QoL (M1/M2).
  - **Broadcast CTR:** ≥8% durante i broadcast “Observatory briefing”.
  - **Installazioni PWA Companion:** 3k installazioni verificate durante Playtest #2 (leva ponte per R3 Overlay Mode/PWA).
- Ogni decisione sulle leve qui sotto deve citare il beat del calendario (Steam Page Sprint, Next Fest, Playtest chiusi/aperti,
  Launch Readiness) per mantenere una sola fonte di verità sui deliverable marketing.

---

### Tattiche Launch & Monetization Support

#### GT1 – Soglia di sicurezza 7k wishlist

- **Azione:** non lanciare sotto 5k–7k wishlist; se sei a 2k rimanda e partecipa a un altro festival minore.
- **Motivo:** sotto la massa critica non entri nella lista “Nuove uscite popolari” di Steam, il lancio diventa invisibile.
- **KPI:** obiettivo minimo 7k wishlist prima del bottone “Release”. Usare forecast tab Go-To-Market per stimare a che beat raggiungiamo la soglia.
- **Wishlist velocity:** monitorare quotidianamente il ritmo pre-Next Fest. Se <**5 wishlist/giorno** per più di 7 giorni, la coda “fredda” converte <10% ⇒ trigger immediato di attività marketing (devlog, creator outreach, mini event).

#### GT2 – Lettera del Developer (disclaimer AI → asset)

- **Azione:** sostituire il disclaimer AI generico con una lettera personale nella descrizione Steam (es. “sono un solodev… uso l’AI come pennello…”).
- **Motivo:** disinnescare l’odio ideologico verso l’AI prima che nascano review negative “preventive”.
- **Risultato atteso:** trasformare detrattori in sostenitori della crescita, migliorare conversione pagina e tono community.

#### GT3 – Playtest aperto come filtro bilanciamento

- **Azione:** usare Steam Playtest aggressivo (500–1000 tester affamati di numeri) per trovare build rotte prima del lancio.
- **Motivo:** negli idle un singolo bug/bilanciamento sbilenco genera rimborsi immediati.
- **Risultato:** recensioni day-one focalizzate su “bilanciamento solido”, riduzione refund.

#### GT4 – FTUE con 3 micro-ricompense nella prima ora

- **Azione:** garantire che i primi 20 minuti includano ≥3 micro-ricompense (es. primo edificio meta, prima morte con bonus permanente, prima spell rara).
- **Motivo:** riduce drop-off 15’→refund e prepara a monetizzazione successiva.
- **KPI:** Refund Rate <5–8% e retention D0→D1 >55%.

#### GT5 – Localizzazione bait della pagina Steam

- **Azione:** tradurre SUBITO la pagina Steam in Cinese Semplificato e Tedesco (anche se il client resta EN/IT/ES inizialmente).
- **Motivo:** segnale “potenziale globale” all’algoritmo e raccolta wishlist da mercati non coperti dalle lingue base.
- **Risultato:** visibilità extra senza costo alto; da collegare alla leva L1.b nel riepilogo.
- **Checklist localizzazione:**
  1. Tradurre headline, short description, capsule copy in **DE** e **ZH-CN**.
  2. Aggiornare screenshot/gif con UI tradotta (almeno HUD e tooltip principali).
  3. Inserire CTA “Client EN/IT/ES – UI DE/ZH in arrivo” per gestire aspettative.
  4. Aggiornare `architecture_state.md` se vengono introdotte nuove pipeline di localizzazione.

---

## 2. Dettaglio Leve

### L1 – Localizzazione (EN, IT, ES + eventuale 4ª lingua)

- **Idea:** tradurre interfaccia, testi di gioco e store page in più lingue.
- **Base attuale:**
  - IT = nativo (costo quasi zero).
  - EN = già considerata lingua principale.
  - ES = opzione naturale (mercati ES + LATAM).

- **Dati chiave (Steam 2024, verificati):**

> [!IMPORTANT]
> Nel 2024 il **Simplified Chinese ha superato l'Inglese** come lingua più usata su Steam (33.7% vs 33.5%).

- Solo ~**33%** degli utenti Steam usa l'inglese: una sola lingua copre solo **1/3** del mercato.
- **Top 6 lingue** (EN, Simplified Chinese, Russian, Spanish, BR-Portuguese, German) coprono ~**85%** degli utenti Steam.
- Pagine Steam localizzate mostrano fino a **4.5× wishlist** in più rispetto a pagine solo EN durante periodi non promozionali.
- La localizzazione è l'**unico fattore che influenza costantemente la visibilità algoritmica** su Steam.
  
- **Impatto atteso:**
  - Migliore accessibilità ⇒ più giocatori totali ⇒ più payers.
  - Miglior percezione di qualità (soprattutto su Steam).
  
- **Rischi:**
  - Traduzioni di bassa qualità se si aggiungono lingue extra senza budget.
  - Un case study (Wanba Warriors, 29 lingue) non ha visto aumenti proporzionali - prioritizzare qualità su quantità.
  
- **Decisione da prendere (futuro):**
  - Definire lingue V1 e pipeline di localizzazione (file JSON/config-first, no hardcoding).
  - **Strategia raccomandata per V1:**
    - **Tier 1 (lancio):** EN + IT (gratis/nativo).
    - **Tier 2 (pre-lancio se budget):** ES (basso costo, alto ROI).
    - **Tier 3 (post-lancio, basato su telemetria):** Simplified Chinese o PT-BR in base a dati reali di wishlist/traffico.

---

### L2 – Prezzi regionali

- **Idea:** usare i prezzi regionali raccomandati (soprattutto su Steam) e, se serve, adattare lo stesso principio su mobile.
- **Impatto atteso:**
  - Aumentare il volume di vendite in regioni con potere d’acquisto più basso.
- **Costo:**
  - Quasi nullo: seguire linee guida Steam / store.
- **Rischi:**
  - Quasi nulli, se non si fanno sconti “strani” che generano confusione.

> Nota: Steam raccomanda espressamente di usare il sistema di prezzi regionali. Abbinato alla localizzazione della pagina, aumenta sia la **visibilità algoritmica** (liste localizzate) sia le chance che utenti di mercati non-EN effettivamente acquistino.

---

### P1 – Modello per piattaforma (Web / Steam / Mobile)

- **Idea:**
  - Web/itch: demo giocabile gratuita.
  - Steam: versione premium (es. 10–20€) con contenuto completo e/o DLC futuri.
  - Mobile: F2P con IAP (pack da 5€, time warp, eventuali ads opzionali).
- **Impatto atteso:**
  - Massimizza modi di monetizzare giocatori con preferenze diverse.
- **Costi / complessità:**
  - Mantenere coerenza fra versioni, differenziare cosa è incluso dove.
- **Rischi credibilità:**
  - Va comunicato bene per evitare la sensazione di "versioni ingiuste".

---

### P2 – Prezzo base (Steam/itch)

- **Idea:** prezzo di listino per PC fissato a **€7.99** (niente tier 14.99€ per V1).
- **Impatto atteso:**
  - Influenza conversione iniziale, recensioni, efficacia dei saldi.
- **Rischi:**
  - Prezzo percepito troppo alto per un idle semplice ⇒ review negative.

---

### M1 – Pacchetto base da 5€ (remove annoyance + QoL)

- **Idea:** una volta sola, rimuove frizioni fastidiose e aggiunge piccoli QoL (senza rompere il bilanciamento).
- **Impatto atteso:**
  - Con tassi di conversione 2–5% sui giocatori attivi, può da solo coprire buona parte del target 5–10k€.
- **Rischi:**
  - Se percepito come "paywall" necessario, può danneggiare le review.

---

### M2 – Time warp / accelerazioni

- **Idea:** acquisti che permettono di saltare ore di produzione o aumentare temporaneamente le rese.
- **Impatto atteso:**
  - Buona leva per giocatori che hanno poco tempo ma vogliono "spingere" una run.
- **Rischi:**
  - Se il gioco è bilanciato per spingerti a comprarli, la UX diventa tossica.

---

### M3 – Resurrezioni / salvataggi eroici

- **Idea:** consumabili costosi che salvano il Founder o un eroe da morte definitiva.
- **Impatto atteso:**
  - Monetizza i momenti ad alta tensione emotiva.
- **Rischi:**
  - Se abusati, minano il pillar "Lose to Progress".

---

### M4 – Cosmetic e personalizzazioni

- **Idea:** skin, palette, effetti, statue, decorazioni del villaggio.
- **Impatto atteso:**
  - Aumenta ARPPU in modo "pulito", senza toccare il bilanciamento.
- **Rischi:**
  - Principalmente costo in tempo/asset.

---

### M5 – DLC / Espansioni

- **Idea:** aggiunta di grandi blocchi di contenuto dopo il successo del gioco base.
- **Impatto atteso:**
  - Potenziale forte incremento di ricavi a medio-lungo termine.
- **Rischi:**
  - Se il base non è percepito come completo, i DLC sembrano "cut content".

---

### R1 – Profondità meta-progression

- **Idea:** sistema ricco di edifici meta, eredi, start variabili, ecc.
- **Impatto atteso:**
  - Aumenta la longevità e quindi il potenziale di spesa (soprattutto su mobile).
- **Rischi:**
  - Complessità eccessiva può scoraggiare parte del pubblico.

---

### R2 – Stagioni / reset morbidi

- **Idea:** ciclo di stagionali con soft reset e leaderboard nuove.
- **Impatto atteso:**
  - Spinge a tornare ciclicamente, utile per whale e giocatori dedicati.
- **Rischi:**
  - Se troppo frequenti o troppo punitivi, generano fatigue.

---

### R3 – Overlay Mode

- **Idea:** permettere ai giocatori di giocare in una finestra ridotta in fondo allo schermo, mantenendo la possibilità di interagire con il gioco mentre si svolgono altre attività (desktop e PWA companion).
- **Impatto atteso:**
  - Aumenta la longevità del gioco e la possibilità di giocare in qualsiasi momento.
- **Rischi:**
  - Se non implementato correttamente, può generare problemi di prestazioni o di usabilità.
- **Nota KPI:** durante il beat “Playtest #2 + PWA Install Push” mirare a 3k installazioni PWA e monitorare ritorni ≥2 sessioni per tester (vedi `go_to_market_steam_first.md`).

---

### S1 – Qualità pagina Steam/itch

- **Idea:** testi chiari, hook forte, capsule art, GIF/clip di gameplay chiare.
- **Impatto atteso:**
  - Conversione visita→wishlist→acquisto.
- **Rischi:**
  - Bassi; è principalmente un investimento di tempo/arte.
- **Nota KPI:** allineare copy, capsule e CTA con gli obiettivi wishlist/conversione descritti in
  [Go-To-Market “Steam First”](../strategy/go_to_market_steam_first.md) (target 25k wishlist, conversione playtest ≥40%,
  broadcast CTR ≥8%) e mappare i rilanci con gli slot “Steam Page + Wishlist Sprint” e “Devlog + Creator Labs”.

---

### S2 – Demo strategica

- **Idea:** demo gratuita (web + eventualmente Steam) che mostra il core loop.
- **Impatto atteso:**
  - Riduce incertezza, converte curiosi in fan/tester.
- **Rischi:**
  - Demo troppo grezza o poco rappresentativa può danneggiare la percezione.

---

### S3 – Futuri bundle / cross-promo

- **Idea:** una volta che esistono altri giochi del tuo ecosistema, usare bundle e cross-promo.
- **Impatto atteso:**
  - Molto forte nel lungo periodo (portfolio strategy).
- **Rischi:**
  - Nessuno rilevante; è semplicemente pianificazione futura.
- **Nota KPI:** gli slot festival devono seguire il beat “Steam Next Fest Submission” del Go-To-Market; usare finestre Q2/Q3 per ottenere wishlist/settimana ≥1.5k e mantenere broadcast CTR ≥8%. Eventuali festival extra arrivano solo dopo aver coperto gli obiettivi Next Fest.

---

### F1 – Crowdfunding (Kickstarter / simili)

- **Idea:** usare una campagna Kickstarter/Ulule per finanziare sviluppo extra (art, musica, porting) e costruire community pre-lancio.
- **Impatto atteso:**
  - Può fornire una grossa iniezione di cassa upfront e validare l'interesse per il gioco.
- **Rischi:**
  - Overpromising, gestione complicata di ricompense fisiche, pressione sulla timeline.

---

### F2 – Early Access

- **Idea:** lanciare il gioco in Early Access (soprattutto su Steam) con prezzo leggermente inferiore al 1.0, aggiornando regolarmente.
- **Impatto atteso:**
  - Entrate già durante lo sviluppo, feedback continuo sul core loop (perfetto per idle/balancing).
- **Rischi:**
  - Se gli update rallentano o il gioco sembra "abbandonato", si danneggia la reputazione.

---

### F3 – Patreon / Ko-fi

- **Idea:** permettere ai fan più dedicati di sostenere con piccole donazioni ricorrenti (es. 3–10€/mese) in cambio di devlog extra, accesso anticipato, piccoli bonus cosmetici.
- **Impatto atteso:**
  - Flusso di entrate stabile nel tempo, anche se probabilmente limitato a una nicchia.
- **Rischi:**
  - Richiede una certa costanza nel pubblicare update per non far sentire i supporter trascurati.

---

### F4 – Battle pass / Season pass / abbonamenti

- **Idea:** introdurre, se il gioco lo giustifica, un sistema di season pass legato alle stagioni/metagame (cosmetici, risorse extra, obiettivi stagionali).
- **Impatto atteso:**
  - Può aumentare molto l'ARPPU nei giocatori più attivi.
- **Rischi:**
  - Se percepito come troppo grindy o necessario, può allontanare chi cerca un'esperienza più rilassata.

---

### F5 – Merchandise

- **Idea:** artbook digitale, OST, wallpaper pack, eventuali gadget fisici a tema Idle Incremental RPG.
- **Impatto atteso:**
  - Buono sul lungo periodo quando esiste già una fanbase forte.
- **Rischi:**
  - Costo alto in tempo/logistica rispetto al potenziale ritorno per un solo titolo.

---

### F6 – Ports (console / altre piattaforme)

- **Idea:** portare il gioco su Switch/console/mobile nativa, direttamente o tramite publisher/partner.
- **Impatto atteso:**
  - Altissimo potenziale di ricavi addizionali se il gioco funziona bene su PC.
- **Rischi:**
  - Richiede molto effort tecnico; negoziare con publisher può implicare compromessi creativi/di revenue share.
