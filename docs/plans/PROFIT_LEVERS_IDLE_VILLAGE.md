# Idle Village – Profit Levers

**Status:** Draft v0.1  
**Scope:** Leve che possono aumentare ricavi / LTV senza compromettere la credibilità del gioco.

Legenda impatto/costo/ rischio: basso / medio / alto.

---

## 1. Riepilogo Leve

| ID  | Categoria      | Descrizione breve                                                | Impatto stimato | Costo/complessità | Rischio credibilità | Stato        |
|-----|----------------|------------------------------------------------------------------|-----------------|-------------------|---------------------|-------------|
| L1  | Localizzazione | EN + IT + ES (core), valutare eventuale 4ª lingua               | Medio–Alto      | Basso–Medio       | Basso               | Da esplorare |
| L2  | Prezzi regione | Prezzi regionali (Steam, mobile)                                | Medio           | Basso             | Basso               | Da esplorare |
| P1  | Piattaforme    | Modello diverso per Web / Steam / Mobile                        | Alto            | Medio             | Medio               | Da esplorare |
| P2  | Pricing base   | Prezzo Steam/itch (es. 9.99 vs 14.99)                           | Medio–Alto      | Basso             | Medio               | Da esplorare |
| M1  | Monetizzazione | Pacchetto base da ~5€ (remove annoyance + QoL)                  | Medio–Alto      | Medio             | Basso               | Da esplorare |
| M2  | Monetizzazione | Time warp / accelerazioni (salta X ore, boost produzione)       | Medio–Alto      | Medio             | Medio               | Da esplorare |
| M3  | Monetizzazione | Resurrezioni / salvataggi eroici (es. Phoenix Feather)         | Medio           | Medio             | Medio–Alto          | Da esplorare |
| M4  | Monetizzazione | Cosmetic e personalizzazioni (skin, temi, statue, ecc.)         | Medio           | Medio–Alto        | Molto basso         | Da esplorare |
| M5  | Monetizzazione | DLC / espansioni (nuovi biomi, sistemi, fazioni)                | Alto (long term)| Alto              | Basso               | Da esplorare |
| R1  | Retention      | Profondità meta-progression (edifici meta, eredi, ecc.)         | Alto            | Alto              | Medio               | Da esplorare |
| R2  | Retention      | Stagioni / reset morbidi e leaderboard stagionali               | Medio–Alto      | Medio–Alto        | Basso–Medio         | Da esplorare |
| S1  | Storefront     | Qualità pagina Steam/itch (testi, capsule, GIF, tag)            | Alto            | Medio             | Basso               | Da esplorare |
| S2  | Storefront     | Demo strategica (web + eventuale demo Steam)                    | Medio–Alto      | Medio             | Medio               | Da esplorare |
| S3  | Ecosistema     | Futuri bundle / cross-promo con altri giochi                    | Alto (long term)| Medio             | Basso               | Da esplorare |
| F1  | Funding        | Crowdfunding (Kickstarter/Ulule, ecc.)                          | Medio–Alto      | Medio–Alto        | Medio               | Da esplorare |
| F2  | Funding        | Early Access (soprattutto Steam)                                | Medio           | Medio             | Basso–Medio         | Da esplorare |
| F3  | Funding        | Patreon/Ko-fi (supporto continuo da fan)                        | Medio (long term)| Basso–Medio      | Basso               | Da esplorare |
| F4  | Monetizzazione | Battle pass / season pass / abbonamenti                         | Medio–Alto      | Medio–Alto        | Medio               | Da esplorare |
| F5  | Merch          | Merchandise fisico/digitale (artbook, OST, gadget)              | Medio (long term)| Alto             | Basso               | Da esplorare |
| F6  | Ports          | Porting console/mobile tramite publisher o in proprio           | Alto (long term)| Alto              | Medio               | Da esplorare |

> Nota: "Stato" verrà aggiornato a "Deciso: Sì/No/Più avanti" man mano che facciamo ricerche specifiche per leva.

---

## 2. Dettaglio Leve

### L1 – Localizzazione (EN, IT, ES + eventuale 4ª lingua)

- **Idea:** tradurre interfaccia, testi di gioco e store page in più lingue.
- **Base attuale:**
  - IT = nativo (costo quasi zero).
  - EN = già considerata lingua principale.
  - ES = opzione naturale (mercati ES + LATAM).
- **Dati chiave (Steam 2024, vari studi):**
  - Solo ~**33%** degli utenti Steam usa l'inglese come lingua dell'interfaccia: una sola lingua copre circa **1/3** del mercato.
  - Localizzando nelle **prime 6 lingue** (EN, Simplified Chinese, Russian, Spanish, Brazilian Portuguese, German) si può coprire ~**85%** degli utenti Steam.
  - Studi su pagine Steam localizzate mostrano fino a **4,5× wishlist** in più rispetto a pagine solo EN, a parità di marketing (HowToMarketAGame / LCP Localizations).
- **Impatto atteso:**
  - Migliore accessibilità ⇒ più giocatori totali ⇒ più payers.
  - Miglior percezione di qualità (soprattutto su Steam).
- **Rischi:**
  - Traduzioni di bassa qualità se si aggiungono lingue extra senza budget.
- **Decisione da prendere (futuro):**
  - Definire lingue V1 e pipeline di localizzazione (file JSON/config-first, no hardcoding).
  - Strategia suggerita per V1:
    - EN + IT (gratis) + ES (basso costo) come base.
    - Considerare in futuro una 4ª lingua ad alto impatto (es. PT-BR o DE) in base a dati reali di wishlist/traffico.

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

- **Idea:** prezzo di listino per PC (es. 9.99€ vs 14.99€).
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

- **Idea:** cicli stagionali con soft reset e leaderboard nuove.
- **Impatto atteso:**
  - Spinge a tornare ciclicamente, utile per whale e giocatori dedicati.
- **Rischi:**
  - Se troppo frequenti o troppo punitivi, generano fatigue.

---

### S1 – Qualità pagina Steam/itch

- **Idea:** testi chiari, hook forte, capsule art, GIF/clip di gameplay chiare.
- **Impatto atteso:**
  - Conversione visita→wishlist→acquisto.
- **Rischi:**
  - Bassi; è principalmente un investimento di tempo/arte.

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

- **Idea:** artbook digitale, OST, wallpaper pack, eventuali gadget fisici a tema Idle Village.
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
