---
status: superseded
superseded_by: docs/strategy/go_to_market_steam_first.md
---

# Go-To-Market "Steam First"

**Owner:** Cascade (Go-To-Market pod)  
**Ultimo aggiornamento:** 2026-01-05  
**Documenti correlati:** [MASTER_PLAN](../MASTER_PLAN.md), [PROFIT_LEVERS_IDLE_VILLAGE](../plans/PROFIT_LEVERS_IDLE_VILLAGE.md)

---

## 1. Visione Steam-First

1. **Steam come hub di scoperta primaria:** la pagina prodotto e i Playtest diventano la singola fonte per wishlist, feedback e store assets (niente campagne parallele disallineate).
2. **Calendario marketing orchestrato:** ogni beat (Next Fest, demo, devlog, broadcast) esiste solo se mappa a una leva di crescita KPI documentata (wishlists, CTR, installazioni PWA companion).
3. **Narrativa “Gilded Observatory” coerente:** devlog, broadcast e patch note seguono il tono analitico del progetto (telemetria + art direction). Tutte le CTA rimandano alla pagina Steam.
4. **Misurazione end-to-end:** KPI condivisi e configurabili (wishlist, opt-in Playtest, retention sessione 1, CTR broadcast, installazioni PWA companion) con owner e strumenti chiari.

---

## 2. Obiettivi strategici

1. **Steam come hub di scoperta primaria:** concentrare gli asset marketing e la narrativa sulla pagina Steam, usando devlog e broadcast per crescere la wishlist prima di qualsiasi store aggiuntivo.
2. **Playtest ciclici con CTA unica:** usare Playtest pubblici/privati di Steam per convertire gli interessati in tester, evitando form esterni e mantenendo telemetria unificata (Sync con PersistenceService).
3. **Community owned narrative:** roadmap pubblica e aggiornamenti video dentro Steam Activities per mantenere il tono "Gilded Observatory" e comunicare i miglioramenti del bilanciamento.
4. **Misurare tutto tramite KPI condivisi:** wishlist → playtest opt-in → retention sessione 1, legando ogni milestone marketing a una metrica esplicita.

---

## 3. Calendario campagne Steam & KPI

| Beat | Finestra | Attività chiave | KPI target | Tool & Owner |
| --- | --- | --- | --- | --- |
| **Steam Page + Wishlist Sprint** | Feb 2026 | Pagina + trailer vertical slice; demo web/PWA con CTA Steam; capsule e copy localizzati | 10k wishlist cumulative; CTR capsule ≥4% | Steamworks Marketing · Cascade |
| **Steam Next Fest Submission** | Mar 2026 (evento Q2) | Build “Festival” con timer ridotti; broadcast live con Q&A; press kit completo (gif, key art) | Wishlists/settimana ≥1.5k durante l'evento; Broadcast CTR ≥8% | Steam Next Fest tooling · Cascade + Art Pod |
| **Playtest #1 (Closed)** | Mar 2026 | Gate Playtest per 2k utenti; survey PersistenceService; devlog “Behind the Balancer” | 35% opt-in → download; Retention Sessione 1 ≥55% | Steam Playtest + Internal Telemetry · Cascade + Tech QA |
| **Devlog + Creator Labs** | Apr 2026 | Devlog video mensile; outreach 10 micro creator (key personalizzate); refresh screenshot store | +20% wishlist vs mese precedente; Devlog CTR ≥12% | Steam Events + Creator Spreadsheet · Marketing |
| **Playtest #2 (Open) + PWA Install Push** | Mag 2026 | Playtest aperto + evento community; CTA per installare PWA Idle Village Companion | 50% tester con ≥2 sessioni; 3k installazioni PWA verificate | Steam Playtest + PWA Telemetry · Cascade + Mobile Pod |
| **Launch Readiness & Pricing Validation** | Giu 2026 | Demo feature lock; review prezzi regionali e bundle; mini-campagna “Countdown” | 60% wishlist → demo download; prezzo base definito con ±5% vs benchmark | Steam Pricing dashboard · BizOps |

> Nota: Le finestre seguono il Master Plan trimestrale; sincronizzare ogni beat con `docs/MASTER_PLAN.md#go-to-market` prima di comunicare date pubbliche.

---

## 4. KPI principali 2026H1

| KPI | Definizione | Target 2026H1 | Strumento | Note |
| --- | --- | --- | --- | --- |
| **Wishlist attive** | Totale wishlist sulla pagina Steam | 25k | SteamWorks Dashboard | Misurata settimanalmente, segnalata in MASTER_PLAN. |
| **Conversione Playtest** | % utenti che passano da wishlist a Playtest opt-in | ≥40% | Steam Playtest Analytics | Integrare con PersistenceService per QA sulle build. |
| **Retention Sessione 1** | Utenti Playtest che tornano entro 72h | ≥55% | Telemetria interna + Steam Events | Richiede hook Idle Village per ping asincroni. |
| **Broadcast CTR** | Click-through sui broadcast Steam rispetto ai viewers live | ≥8% | Steam Broadcast Insights | Usa format "Observatory briefing" per CTA coerente. |
| **Installazioni PWA Companion** | Utenti che installano la PWA Idle Village Companion dopo la CTA Steam | 3k installazioni verificate | Web Telemetry (PWA) + Steam UTM | Serve per bridging mobile-first → Steam-first (PROFIT_LEVERS R3). |

Se uno di questi KPI non ha ancora baseline, lasciare TODO nel relativo report ma mantenere la struttura qui per garantire single source of truth.

---

## 5. Integrazione cross-doc

- MASTER_PLAN → sezione strategia Go-To-Market deve puntare a questo file per i dettagli e mantenere solo sintesi.
- PROFIT_LEVERS_IDLE_VILLAGE → leve marketing (S1–S4) e retention (R2–R3) devono citare il calendario e i KPI qui definiti.
- Ogni futuro playbook (Discord, console, mobile) deve linkare prima qui per evitare fork della narrativa.
