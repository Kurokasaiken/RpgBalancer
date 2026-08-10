---
title: Richieste esplicite
type: intent-ledger
updated: 2026-08-07
---

# Richieste esplicite

Questo file è la bussola operativa. Contiene ciò che Fausto ha chiesto, con le sue parole.

## Stati

`da chiarire` · `aperta` · `in corso` · `fatta` · `ridotta` · `rinviata` · `ritirata`

`ridotta`, `rinviata` e `ritirata` solo con approvazione esplicita.

---

## R-001 — Sfruttare Mind Weaver per produrre autonomamente un gioco riusando RPG

**Richiesta:** *"Voglio vedere cosa Mind Weaver riesce a fare autonomamente, più che stime di guadagno massimizzate. Se il risultato finale è interessante provo a pubblicarlo. Voglio che tu prenda il più possibile dal progetto RPG."*
**Data:** 2026-08-10
**Stato:** `da chiarire`
**Desiderata FROZEN:** nessuna corrispondente; `.mw/desiderata.md` v1 riguarda l'adozione del protocollo Mind Weaver in RPG. Questa richiesta richiede una nuova desiderata.
**Cosa manca:** genere/tema del gioco e stack tecnologico specifici; la base è chiara.
**Chiarimento del Director (2026-08-10):** il progetto è nuovo (nuovo nome, nuovo brand, nuovo tutto). Da RPG si possono prendere solo riferimenti utili (estetica/Style Lab, filosofia config-first, metodo componenti, ecc.), non asset o brand. Se interessante, può essere pubblicato.

---

## R-002 — Rendere le skill Mind Weaver di RPG cross-IDE

**Richiesta:** *"procedi"* (risposta alla proposta di creare i symlink per rendere le skill di RPG visibili a tutti gli IDE).
**Data:** 2026-08-10
**Stato:** `fatta`
**Desiderata FROZEN:** `.mw/desiderata.md` v1 — adozione del protocollo Mind Weaver in RPG.
**Cosa è successo:** creati symlink `.claude/skills`, `.devin/skills` e `.agents/skills` in RPG che puntano a `coordinator/skills`. `.windsurf/skills` era già un symlink allo stesso target. `find -L` conferma che tutte e quattro le directory vedono gli stessi 9 `SKILL.md`. Le skill di RPG sono già caricate nella sessione corrente (viste in `available_skills`).
