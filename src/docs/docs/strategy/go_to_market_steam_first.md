# Go-To-Market "Steam First"

**Owner:** Cascade · Go-To-Market Pod  
**Ultimo aggiornamento:** 2026-01-11  
**Documenti collegati:** [MASTER_PLAN](../MASTER_PLAN.md), [PROFIT_LEVERS_IDLE_VILLAGE](../plans/PROFIT_LEVERS_IDLE_VILLAGE.md), [MARKET_RESEARCH_ANALYSIS](../plans/MARKET_RESEARCH_ANALYSIS.md)

> Single source of truth per la strategia Steam-first 2026 H1. Qualsiasi modifica a KPI, calendario o messaggistica marketing deve partire da questo documento e poi essere sintetizzata negli altri piani.

---

## 1. Visione Steam-first

1. **Steam come hub unico di scoperta:** pagina prodotto, Playtest e broadcast sono l9s unica CTA per wishlist, feedback, press kit. Nessuna campagna parallela scollegata.
2. **Narrativa "Gilded Observatory":** devlog, trailer e broadcast mantengono il tono analitico (telemetria + art direction) e reindirizzano sempre alla pagina Steam.
3. **Calendario orchestrato:** ogni beat (Next Fest, Playtest, Devlog Labs) esiste solo se agganciato a una leva KPI documentata.
4. **Misurazione end-to-end:** wishlist 134 playtest opt-in 134 retention sessione 1 134 CTR broadcast 134 installazioni PWA companion, con owner e tool chiari.

---

## 2. Obiettivi strategici

1. **Wishlist 25k entro H1 2026:** raggiungere massa critica prima di qualunque store aggiuntivo.
2. **Playtest ciclici con CTA unica:** usare Playtest Steam (chiuso/aperto) per convertire wishlist in tester senza form esterni.
3. **Community-owned roadmap:** aggiornare roadmap e devlog dentro Steam Activities mantenendo tono Observatory.
4. **Misurare e reagire:** ogni beat ha KPI, owner e retrospettiva entro 72h per riallocare budget creativo.
5. **Bridge mobile5Steam:** incentivare installazioni della PWA Idle Village Companion come leva di retention R3.

---

## 3. KPI condivisi (H1 2026)

| KPI | Target | Owner | Tool / Fonte | Frequenza | Note |
| --- | --- | --- | --- | --- | --- |
| Wishlist attive | **25k** cumulative | Cascade + Marketing | SteamWorks Dashboard | Settimanale (lun) | Pubblicare trend nel MASTER_PLAN.
| Conversione Playtest | **40%** wishlist 134 opt-in/download | Cascade + Tech QA | Steam Playtest Analytics | A fine playtest | Integrare PersistenceService per QA build.
| Retention Sessione 1 | **55%** entro 72h | Telemetry Pod | Internal telemetry + Steam Events | Giornaliera durante playtest | Richiede hook Idle Village per ping asincroni.
| Broadcast CTR | **8%** click / viewers | Marketing + Art Pod | Steam Broadcast Insights | Per broadcast | Formato "Observatory briefing" con CTA unica.
| Installazioni PWA Companion | **3k** install verificate | Mobile Pod | PWA telemetry + Steam UTM | A fine Playtest #2 | Ponte verso leva R3 (Overlay Mode/PWA).

> Se un KPI non ha baseline, lasciare TODO nel report ma mantenere struttura qui per garantire single source of truth.

---

## 4. Calendario campagne Steam & KPI

| Beat | Finestra | Deliverable principali | KPI Target | Tool & Owner |
| --- | --- | --- | --- | --- |
| **Steam Page + Wishlist Sprint** | Feb 2026 | Pagina Coming Soon, trailer vertical slice, capsule + copy localizzati, demo web/PWA con CTA Steam | 10k wishlist cumulative · CTR capsule 4% | Steamworks Marketing · Cascade |
| **Steam Next Fest Submission** | Mar 2026 (evento Q2) | Build "Festival" con timer ridotti, broadcast live con Q&A, press kit (gif, key art, screenshot) | Wishlist/settimana 1.5k durante levento · Broadcast CTR 8% | Steam Next Fest tooling · Cascade + Art Pod |
| **Playtest #1 (Closed)** | Mar 2026 | Gate 2k utenti, survey PersistenceService, devlog "Behind the Balancer" | 35% opt-in 134 download · Retention S1 55% | Steam Playtest + Internal Telemetry · Cascade + Tech QA |
| **Devlog + Creator Labs** | Apr 2026 | Devlog video mensile, outreach 10 micro-creator (keys personalizzate), refresh screenshot store | +20% wishlist vs mese precedente · Devlog CTR 12% | Steam Events + Creator spreadsheet · Marketing |
| **Playtest #2 (Open) + PWA Install Push** | Mag 2026 | Playtest aperto, evento community, CTA install PWA Idle Village Companion | 50% tester con 2 sessioni · 3k installazioni PWA verificate | Steam Playtest + PWA telemetry · Cascade + Mobile Pod |
| **Launch Readiness & Pricing Validation** | Giu 2026 | Demo feature lock, pricing review regionale/bundle, mini-campagna "Countdown" | 60% wishlist 134 demo download · Prezzo base definito 5% vs benchmark | Steam Pricing dashboard · BizOps |

> Sincronizzare ogni beat con `docs/MASTER_PLAN.md#go-to-market` prima di condividere date pubbliche.

---

## 5. Asset & Messaging Checklist

- **Pagina Steam:** capsule statiche + animated, trailer vertical slice, screenshot aggiornati per ogni milestone.
- **Devlog / Broadcast:** tono Observatory, CTA unica (wishlist / Playtest), dati telemetria leggeri per rafforzare narrativa.
- **Press Kit:** key art 4K, loghi vettoriali, GIF gameplay (loop villaggio + overlay mode), one-pager KPI.
- **Steam Events:** template "Observatory briefing" (intro, metriche, CTA) da riusare per broadcast/annunci.
- **Localization:** copy store (EN/IT + top 3 regioni target) con consistency sheet condiviso.

---

## 6. Pipeline Playtest & CTA

| Step | Playtest #1 (Closed) | Playtest #2 (Open) |
| --- | --- | --- |
| Target utenti | 2k (wishlist top) | 10k (wishlist + social) |
| Accesso | Steam Playtest chiuso (batch) | Steam Playtest aperto (auto-approve) |
| CTA primaria | "Join Playtest" 134 survey PersistenceService | "Play + Install PWA Companion" |
| Telemetria | Session logs + survey integration | Session logs + PWA install tracking |
| Retrospettiva | Report entro 72h con KPI vs target | Report entro 72h + lista fix per Launch Readiness |

Workflow: Wishlist tagging 134 email Steam 134 Playtest gating 134 telemetry export 134 retrospective doc.

---

## 7. Telemetry & Governance

- **Data sources:** SteamWorks (wishlist, CTR), Steam Playtest, Broadcast Insights, internal telemetry (Idle Village), PWA analytics.
- **Storage:** PersistenceService + telemetry warehouse (weekly snapshot). Nessun CSV manuale fuori pipeline.
- **Guardrail:** Se un KPI crolla 30% vs target due settimane di fila, aprire retrospettiva e aggiornare Profit Levers.
- **Owner Sync:** stand-up settimanale (lun) con Marketing + Telemetry + BizOps per revisione KPI e azioni.

---

## 8. Rischi & Mitigazioni

| Rischio | Impatto | Mitigazione |
| --- | --- | --- |
| Demo / Playtest non pronti per Next Fest | Wishlist stagnanti, reputazione negativa | Feature lock 4 settimane prima, QA checklist condivisa, fallback demo web aggiornata |
| KPI non misurati / incoerenti | Decisioni marketing errate | Dashboard condivisa (Looker) con owner, audit mensile dati |
| Narrative drift (messaggi multipli) | CTA confuse, conversione bassa | Script "Observatory" centralizzato, approvazione copy da Go-To-Market pod |
| Mancanza asset localized | CTR inferiore in mercati target | Localization sprint Feb (EN/IT/DE/FR) + QA screenshot |
| Overlap con roadmap mobile | Team diluito, deliverable ritardati | Freeze nuove iniziative mobile finch39 Launch Readiness non  completato, usare PWA solo come leva Playtest |

---

## 9. Operational Checklist

1. **Kick-off (Settimana 1):** completare lock prompt, confermare owner KPI, creare board asset.
2. **Prima del Steam Page Sprint:** trailer vertical slice approvato, copy localizzato, CTA coerente.
3. **Prima del Next Fest:** build festival taggata, broadcast script registrato, press kit aggiornato.
4. **Playtest #1:** gating lista, survey pronta, telemetry watchers attivi, retrospettiva 72h.
5. **Devlog Labs:** selezionare 10 micro-creator, inviare keys + briefing, misurare CTR.
6. **Playtest #2:** aprire auto-approve, orchestrare evento community, push installazioni PWA.
7. **Launch Readiness:** pricing review, countdown assets, sync con BizOps.
8. **Post-beat:** aggiornare KPI table + Profit Levers nota, archiviare log in `test-results/`.

---

## 10. Evidence & Change Log

- 2026-01-11: Doc iniziale creato da Cascade (GT-2). Include Visione, KPI, calendario, pipeline playtest e governance.
