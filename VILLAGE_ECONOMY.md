---
title: Village Economy — economia del villaggio e delle spedizioni
type: canonical-draft
status: DRAFT — bozza di piano da migliorare (Director 2026-10-05: «ci stiamo
  lavorando»); le proposte non ratificate restano marcate `proposta`
updated: 2026-10-05
---

# VILLAGE_ECONOMY — economia villaggio e spedizioni

Dominio: produzione di risorse, forza lavoro, costo reale delle quest,
capacità di spedizione. Bozza compilata da fonti esistenti — non aggiunge
regole nuove.

**Regole quest** (vigenti) → `QUEST_RULES.md`. Questo documento copre il
lato villaggio/economia, non la risoluzione delle quest.

## 1. Loop economico (visione — `GAMEPLAY_DESIGN.md` §2.3)

**STATUS:** `vigente` come visione di design.

- Gli **artigiani/peasant** producono materiali (ferro, legname, cibo, oro);
  i materiali comprano equipaggiamento; l'equip permette agli eroi quest più
  difficili; quest → XP e ricompense rare → level up e upgrade edifici → più
  produzione. Divisorio netto forza lavoro ↔ forza avventuriera.
- **SOURCE:** `GAMEPLAY_DESIGN.md` §2; `GLOSSARY.md` (Peasant/Hero).

## 2. Proposte economia-villaggio — `proposta` (OPEN-010)

Non ratificate; fonte `context/QUEST_ECONOMY_NOTES.md` (conversazione
Director/ChatGPT 2026-10-04, R-083), ledger in
`context/ingestions/2026-10-05-progettare-quest-strategiche.md`.

- **human-days** — costo reale di una quest = `persone × giorni`; una ferita
  è «uomo non disponibile per X giorni», non «−10 HP». Esempio: 4 persone ×
  ~7 giorni ≈ 28 human-days.
- **Regola leader-capacity** — la capacità di spedizione è limitata dallo
  stato del leader e dal pool di umani disponibili, NON da un cooldown
  «1 quest/X giorni». Direttiva Director verbatim: *«fino a quando il leader
  nn è stanco o ferito (o morto) puoi continuare a fare quest fino a quando
  hai altri umani»*.
- **Quest come opportunità** — 8–10 quest compaiono/mese, 4–5
  realisticamente affrontabili; alcune scadono, altre richiedono uomini o
  equip non pronti. Domanda strategica: *«qual è il prossimo miglior uso dei
  miei umani?»* — non «prossimo bottone da premere».
- **Test proposto** — scenario 30 giorni → X quest generate → 1–2 party →
  4–5 spedizioni → human-days/feriti/morti → nuove opportunità, per
  verificare se emerge il gioco cercato.

## 3. Vincoli e avvisi

- **Avviso bilanciamento (CONSTRAINT):** ~1 morto medio/quest rischia
  «roulette russa» — è un warning, non un target di design
  (`QUEST_ECONOMY_NOTES.md`, ingestion E-05).
- **Losabilità (vigente):** una quest che non può fallire è inutile —
  criterio di diagnosi, non percentuale target (`QUEST_RULES.md` §8).
- Config-first: i valori di dominio vivono in `src/balancing/config/**`,
  non in questo documento.

## 4. Domande aperte

- Ratifica delle proposte §2 → `context/OPEN.md` OPEN-010.
- Parametri numerici dell'economia villaggio (produzione/ciclo, costi
  reclutamento) → `idle_village_gameplay_math_spec.md` è la spec più vicina;
  la mappatura completa non è formalizzata.
- Collocazione nel macro-piano: candidato per PLAN-019 S4.

## Provenance

Compilato 2026-10-05 (R-085) da: `GAMEPLAY_DESIGN.md`, `context/QUEST_ECONOMY_NOTES.md`,
`context/ingestions/2026-10-05-progettare-quest-strategiche.md`, `RICHIESTE.md` R-083.
