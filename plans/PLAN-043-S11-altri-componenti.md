---
title: "PLAN-043-S11 — Tutti gli altri componenti di /game"
parent: PLAN-043
status: active
created: 2026-10-17 (scorporato dal master PLAN-043; lavoro del 2026-10-16)
source_request: R-207
documentation_impact: REQUIRED
doc_targets:
  - src/docs/docs/design/hud_component_guide.md
  - src/docs/docs/plans/PLAN-058_hud_roster_unification.md (gate F1/F4/F5)
---

# PLAN-043-S11 — Tutti gli altri componenti di /game

Master: [PLAN-043](PLAN-043-game-quest-surface-pass.md) · stato operativo in [INDEX](INDEX.md).

## Richiesta (verbatim, 2026-10-16)

> *"1) tutti 2) il colore dello slot nn c sta bene, idem la ghiera."* (2026-10-16 — «tutti» = il piano copre tutti i componenti di `/game`)

## Task

Una **scheda per componente** (scopo, cosa funziona, problemi misurati in F0, proposta: tenere / rifare / unire / togliere), poi il Director decide componente per componente (**D9**), poi un task per componente.

| Gruppo | Componenti |
|---|---|
| HUD fisso | lastra del tempo, lastra risorse, nav, menu di gioco, menu Pannelli, nascondi HUD, cartiglio obiettivo — chiude il **Gate F1 di PLAN-058** |
| Pannelli | Roster V2 (difetti di PLAN-058 T1.6), Eventi, Scheda eroe, Scorta del villaggio, Mercante |
| Villaggio | vista Villaggio, pin/lotti, Registro, dettaglio edificio (verifica d'integrazione con PLAN-042) |
| Mappa | POI Sigillo (sagome, taglie, **colore degli anelli** — chiude il **Gate F4 di PLAN-058**), tooltip delle regioni, marker dell'invasione, edifici sulla mappa |
| Strumenti | cursori (chiude il **Gate F5 di PLAN-058**: la prova Tauri l'ha già fatta il Director), schermata di avvio, Director e Tuning (solo coerenza, sono strumenti di sviluppo) |

- *Accettazione:* per ogni componente toccato: checklist §6.12, guardiani estesi, catture prima/dopo.
- **Gate F6:** sì del Director per gruppo.

## Addendum Director (2026-10-19) — apparizione/reveal dei POI

Il batch B4-map copre anche **come i POI appaiono sulla mappa**, non solo il
Sigillo statico: il Director segnala che l'ingresso/reveal attuale non dà
abbastanza presenza e chiede una resa migliore.

- Preparare una visual fork v35 (2–3 alternative) che confronti baseline e
  candidate per silhouette, bordo/halo, campo e comparsa del marker; nessuna
  coreografia o palette è scelta in anticipo.
- Valutare sul dipinto reale, a taglia d'uso e in colore + scala di grigi:
  il glifo deve leggersi, il marker deve distinguersi dal terreno senza
  diventare un badge estraneo alla mappa, e la comparsa non deve nascondere
  altri POI né spostare la camera.
- Verificare che i glifi di famiglia siano effettivamente collegati: il
  fallback a croce di `icon_<type>.webp` non vale come icona approvata.
- Rispettare reduced-motion; il ruling del Director seleziona baseline e
  comportamento prima di modificare la UI di produzione.

### Stato fork (2026-10-20) — pronta per il ruling

Fork preparata e verificata con testimone headless — **nessun cambio alla UI di
produzione**: `PoiMatericV3_5` espone `sigilloTheme` (opzionale, inerte di
default) e la fork vive solo nella lab page `/poi-marker-lab`, sezione
«Sigillo fork — B4-map».

- **Superficie:** `src/ui/idleVillage/pages/PoiMarkerLabPage.tsx` — 4 colonne
  (baseline + A/B/C) × 3 famiglie (quest/job/event) sulla mappa reale a
  taglia d'uso 55 px, progress 0.62, glifi dipinti veri
  (`poi-goblin-camp` / `offer-forage` / `threat-invasion` — nessun fallback a
  croce). Toggle scala di grigi, replay della comparsa, reduced-motion
  rispettato (`@media prefers-reduced-motion` → animazioni disattivate).
- **Candidate:**
  - **baseline** — ottone unico, campo teal, bordo interno avorio, halo
    circolare, comparsa fade+grow (la produzione odierna).
  - **A · metalli per famiglia** — quest ottone, job ferro, evento rame-rosso;
    stessa comparsa della baseline.
  - **B · campo + bordo** — campo caldo umber, bordo interno osso attenuato
    1.2 px; comparsa «settle» (discesa breve + assestamento).
  - **C · halo a sagoma** — il countdown è tracciato sul bordo della
    silhouette (`haloFollowsSilhouette`, stroke `pathLength`) invece del
    cerchio magico; comparsa «stamp» (ingresso marcato senza muovere camera
    né coprire altri POI).
- **Evidenza:** `.mw/runs/plan043-s11-b4-poi-fork/` — `fork-color.png`,
  `fork-grayscale.png`, `fork-reveal-mid.png`, `fork-reduced-motion.png` +
  ritagli per colonna (`fork-col-{baseline,metals,field,shape}.png`).
  Rigenerabili con `node .mw/runs/plan043-s11-b4-poi-fork/capture.mjs`
  (vite dev su :5191 o `POI_LAB_URL`).
- **Iterazione 2 (feedback Director «non si capiscono le differenze, reveal
  scattoso»):** didascalia sotto ogni colonna che nomina il delta da
  guardare; striscia di dettaglio a 130 px su campo neutro sotto la mappa;
  palette rafforzate (ferro blu-acciaio per job, rame vivo per evento,
  campo umber caldo); reveal rifatto come transizioni CSS su pin già montati
  (il remount ridisegnava 12 texture canvas nel frame dell'animazione →
  jank), stamp senza overshoot, stagger 120 ms. Evidenza
  `fork-v2-section.png`, `fork-v2-detail.png`.
- **Verifiche:** `poiSigillo.test.tsx` 11/11; tsc sui file toccati pulito
  (gli errori residui di `tsc -p tsconfig.app.json` sono in file morti
  corrotti fuori scope — vedi nota in RICHIESTE R-233).
- **In attesa:** ruling Director sulla direzione (palette/sagoma/comparsa)
  → solo allora si toccano `MapQuestPoi` e la UI di produzione. Restano da
  cablare i glifi di famiglia nel resolver `icon_<type>.webp` (oggi la
  croce è il fallback per i tipi senza glifo esplicito).

## Contratto di chiusura

- D9 componente per componente.
- Checklist §6.12, guardiani estesi, catture prima/dopo per gruppo.
- Bundle di chiusura non ancora prodotto (`.mw/runs/plan043-{sid}/verification.json` → `verify:bundle`).
