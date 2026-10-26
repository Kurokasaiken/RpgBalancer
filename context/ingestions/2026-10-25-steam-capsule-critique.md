---
title: Ingestion — critica esterna capsule/key-art Steam (Wanderlust Triumph)
type: ingestion-report
date: 2026-10-25
source: analisi testuale incollata dal Director in sessione (valutazione asset marketing Steam)
related: R-151, R-178, marketing/steam/, context/STEAM_PAGE_PLAN.md
---

# Knowledge Ingestion Report

## 1. Source Overview

Critica esterna (autore ignoto — testo incollato dal Director, presumibilmente
output di una AI o di un consulente marketing) della suite di capsule/key-art
per la pagina Steam di «Wanderlust: Triumph». La fonte valuta i file sorgente
in `~/Downloads/` (`Header Capsule.png`, `Library Capsule.png`,
`main capsule.png`, `library hero.png`, `logo1.png`), assegna un voto a
ciascuno, valuta l'impatto commerciale e propone 3 azioni.

Attenzione ai nomi: i file giudicati sono i **sorgenti in Downloads**, non gli
slot finali in `marketing/steam/upload/` — la mappatura effettiva è in §3/E-11.

## 2. Extraction Ledger

| ID | TYPE | STATEMENT | TEMPORAL | VERDICT | SOURCE | RELATIONSHIPS |
|----|------|-----------|----------|---------|--------|---------------|
| E-01 | RESEARCH | La key art con eroe di spalle («Header Capsule.png») è l'asset più forte del set (voto 9/10): la figura dà scala al mondo, crea narrazione e ingaggia; contrasto vegetazione violacea/arancione + sole radente spettacolare | CURRENT | CONFIRM | §1.A della fonte | conferma la decisione R-178 (capsule = key art eroe) |
| E-02 | FACT+PROPOSAL | Nella key art la luce solare dietro l'emblema centrale «mangia» il contrasto dei bordi del logo; a dimensioni miniatura (ricerche/liste promo ~120 px) «WANDERLUST TRIUMPH» rischia di non restare decifrabile. Fix proposto: drop shadow scuro dietro il testo | CURRENT | REFINE (difetto su asset corrente) + proposta di fix | §1.A, §3 Azione 2 | affine alla preoccupazione leggibilità di REVIEW-2026-10-12 §3 (lì su capsule-mappa, ormai superate) |
| E-03 | RESEARCH | Le capsule panoramiche senza soggetto (sorgenti «Library Capsule.png», «main capsule.png») valgono 6.5/10: bel paesaggio, ma nessun eroe/perno visivo; in miniatura il villaggio diventa macchia indistinta e il genere non si capisce (city builder? 4X? RPG?) | CURRENT | CONFIRM | §1.B | stessa diagnosi di REVIEW-2026-10-12 §3 sulle vecchie capsule-mappa («non c'è un soggetto», «non comunica il genere») |
| E-04 | RESEARCH | Il panorama «library hero» (macchinario/ruota a sx, fiume, zona vulcanica a dx) funziona come banner di libreria (8/10): comunica la varietà dei biomi in una vista | CURRENT | CONFIRM | §1.C | coerente con l'uso attuale (slot library_hero) |
| E-05 | RESEARCH | «logo1.png» (logo 3D arancione su tramonto mare) è datato e meno raffinato (5/10) rispetto al logo placca+sole inciso; la brand identity ufficiale è il logo con disco solare tra le due parole | CURRENT | CONFIRM + REFINE | §1.D, §3 Azione 3 | conferma R-151 (logo authored = ufficiale); la fonte spinge oltre: eliminare logo1 anche come arte alternativa |
| E-06 | PROPOSAL | Azione 1: usare la composizione con eroe (di spalle sulla rupe) come base principale per tutti i formati capsule di vendita (Header, Small, Main) | PLANNED→parz. | PROPOSAL — parzialmente già applicata | §3 Azione 1 | estende R-178 agli slot ancora panoramici (vertical, library capsule) |
| E-07 | PROPOSAL | Azione 2: drop shadow scuro dietro il testo del logo nella Header Capsule per staccarlo dai raggi del sole; garanzia di leggibilità anche a 120 px | PLANNED | PROPOSAL | §3 Azione 2 | implementa la cura del difetto E-02 |
| E-08 | PROPOSAL | Azione 3: eliminare «logo1.png» dagli asset; brand identity = emblema del sole tra le due parole | PLANNED | PROPOSAL | §3 Azione 3 | raffina R-151 (logo1 era tenuto «come art di sfondo alternativo») |
| E-09 | PROPOSAL | La suite marketing mostra solo il lato «solare/idilliaco»; nessuna traccia di antagonista/pericolo. Per un roguelite/strategico un accenno di conflitto (ombra, mostro, bioma corrotto) aumenta l'interesse | UNRESOLVED | PROPOSAL | §2 «Manca la minaccia» | tensione da mediare col claim-ledger: mostrare pericolo che il gioco non contiene violerebbe l'onestà; ma goblin/permadeath esistono → un accenno veritiero è possibile |
| E-10 | CONSTRAINT | Il logo/capsule deve restare leggibile quando l'immagine scende a ~120 px di larghezza (miniature Steam) | CURRENT | REFINE | §1.A, §2 | si somma al test già prescritto in REVIEW-2026-10-12 §3 (small a 184×69 accanto a capsule competitor) |
| E-11 | FACT | I nomi nella critica sono i sorgenti `~/Downloads/`, non gli slot `upload/`. Mappatura reale del pacchetto: header/main/event capsule = key art eroe; small = logo su texture dipinta; vertical + library capsule = panorama villaggio+logo; library hero = panorama (ruota/villaggio/vulcano); library logo = placca+sole authored | CURRENT | CORRECT (previene falsa lettura) | verifica visiva dei file | la «main capsule» panoramica della critica ≠ lo slot main_capsule (già eroe); è l'arte usata per library_hero |
| E-12 | DROP | I voti numerici per singolo asset (9, 6.5, 8, 5) | — | DROP | §1 | dettaglio di provenance utile solo nel ledger; il succo è nelle righe sopra |

## 3. New Knowledge

- **E-02** (FACT): difetto concreto sugli asset *correnti* — il sole dipinto
  dietro l'emblema riduce il contrasto dei bordi del logo; leggibilità a ~120 px
  non garantita. Proposed location: nota in `marketing/steam/` + criterio di
  accettazione capsule.
- **E-09** (PROPOSAL): la suite è tutta «idilliaca»; manca un accenno di
  minaccia/antagonista. Questione aperta di posizionamento marketing —
  coerente col genere roguelite/permadeath dichiarato nel copy («Most will
  fall») ma da bilanciare con l'onestà del claim ledger.

## 4. Confirmed Knowledge

- **E-01**: la key art con eroe è la scelta giusta — conferma indipendente di
  R-178 (Director 2026-10-13: «la capsule è la key art»).
- **E-03**: i panorami senza soggetto non comunicano genere — stessa diagnosi
  già prodotta in `marketing/steam/REVIEW-2026-10-12.md` §3 sulle capsule
  precedenti; vale ancora per gli slot rimasti panoramici (vertical, library
  capsule).
- **E-05**: il logo placca+sole è la brand identity — conferma R-151.
- **E-04**: library hero panorama adeguato al suo slot.

## 5. Refinements

- **E-10**: criterio di accettazione esplicito «leggibile a ~120 px» per logo e
  capsule (estende il test 184×69 di REVIEW §3).
- **E-05→E-08**: logo1.png — R-151 lo teneva «disponibile come art di sfondo
  alternativo»; la critica consiglia di eliminarlo del tutto (è un logo
  competente solo a mezza qualità, e tenere un secondo logo in giro rischia
  deriva di brand).

## 6. Corrections

- **E-11**: la critica attribuisce «main capsule» all'arte panoramica; nel
  pacchetto `upload/` lo slot main (e header, event) usa già la key art con
  eroe. L'arte panoramica giudicata è quella che alimenta `library_hero`
  (+ vertical/library capsule da sorgente affine). Le azioni vanno lette sugli
  **slot**, non sui nomi dei file sorgente.

## 7. Decisions

Nessuna decisione nuova: la fonte è una critica esterna, le «Azioni» sono
candidati non ratificati → raccolti come R-288 `proposta` in `RICHIESTE.md`.

Decisioni preesistenti confermate: R-178 (capsule = key art eroe),
R-151 (logo authored placca+sole).

## 8. Research

- Fonte: critica testuale anonima incollata dal Director (2026-10-25).
- Finding: su Steam una capsule senza soggetto/eroe in primo piano non
  comunica genere né ferma lo scroll; il logo deve sopravvivere alle miniature
  (~120 px); mostrare solo il lato idilliaco può sotto-vendere un titolo
  strategico/roguelite.
- Limitation: nessuna fonte citata; valutazione di gusto singolo osservatore;
  non verificata sul rendering reale di Steam (thumbnail effettive).
- Project implication: materiale per rifinire il pacchetto `upload/` prima
  della pubblicazione (bloccata comunque da B1–B6 di PUBLISH-CHECKLIST).

## 9. Rejected Approaches

- «logo1.png» come brand/logo: valutato 5/10 «datato» — la fonte chiede di
  eliminarlo dagli asset (rafforza il «non usarlo come logo» già deciso in
  R-151; la novità è non tenerlo nemmeno come arte alternativa).

## 10. Unresolved Questions

- Estendere la composizione-eroe anche a **vertical** e **library capsule**
  (oggi panoramiche)? La library capsule verticale è il formato più visto
  post-acquisto, non di vendita — il criterio «ferma lo scroll» pesa meno.
- Aggiungere un accenno di minaccia (ombra/creatura/bioma corrotto) nella key
  art o in una capsule secondaria? Serve giudizio Director: permadeath e
  goblin esistono davvero, quindi un accenno è veritiero; ma la key art è già
  «firmata» e una modifica richiede nuova generazione/paintover.
- Drop shadow sul logo: ritocco puntuale delle PNG in `upload/` (impermeabile
  alle future rigenerazioni) o da incorporare nel master key art?

## 11. Conflicts

Nessun conflitto con la documentazione esistente. Nota di tensione gestita:
«accenno di antagonista» vs claim-ledger (niente claim non veri) — risolvibile
perché il gioco contiene davvero invasione goblin e permadeath.

## 12. Changes of Direction

Nessuna. La critica è una conferma+raffinamento della direzione già decisa
(key art con soggetto, logo authored), non un cambio.

## 13. Documentation Changes

- Creato questo report: `context/ingestions/2026-10-25-steam-capsule-critique.md`.
- `context/INDEX.md`: riga di registro.
- `RICHIESTE.md`: voce **R-288** `proposta` — le 3 azioni + questione
  antagonista, in attesa di ruling Director.
- `marketing/steam/PUBLISH-CHECKLIST.md` §3: riga «punti aperti» con puntatore
  a questo report (le decisioni visive pendenti incidono sul pacchetto prima
  dell'upload).

## 14. Implementation Impact

Se il Director ratifica (nessuna implementazione fatta ora):

- `upload/capsules/header_capsule_920x430.png` (+ main/event): drop shadow
  dietro il logo — ritocco PNG o rigenerazione dal master.
- `upload/capsules/vertical_capsule_748x896.png` e
  `upload/library/library_capsule_600x900.png`: valutare variante con eroe.
- `~/Downloads/logo1.png`: eliminazione dalla circolazione (è fuori repo;
  l'unico riferimento testuale è la nota in R-151).
- `marketing/steam/ASSETS.md` / `PUBLISH-CHECKLIST.md`: aggiornare righe
  capsule + eventuale criterio «leggibile a 120 px».
- Preview (`preview/index.html`) risincronizzata via `tools/sync-preview.py`.

## 15. Argomenti trattati

- Voti per asset: header/eroe 9/10, panorami 6.5/10, library hero 8/10, logo1 5/10.
- Leggibilità logo a miniatura (sole dietro l'emblema, ~120 px).
- Assenza di soggetto → genere non comunicato (panorami).
- Brand identity: sole-emblema sì, logo1 3D arancione no.
- Assenza di minaccia/antagonista nella suite marketing.
- 3 azioni: eroe ovunque, drop shadow logo, scartare logo1.

## 16. Problemi risolti

- Perché «main capsule» della critica sembra contraddire il pacchetto: i nomi
  sono i sorgenti Downloads, non gli slot — chiarito in E-11.

## 17. Ripresa della conversazione

La pagina Steam è pronta in pacchetto (`marketing/steam/upload/`, R-178 `in
corso`) ma la pubblicazione resta bloccata da B1–B6 in
`PUBLISH-CHECKLIST.md`. La critica esterna delle capsule è stata ingerita qui;
le sue 3 azioni + la questione «antagonista assente» sono registrate come
R-288 `proposta` e attendono ruling Director. Prossimo passo atteso: il
Director decide quali ritocchi fare (drop shadow logo, slot panoramici,
logo1, eventuale accenno di minaccia) prima o dopo l'upload iniziale.

**UPDATE 2026-10-25 — ratificato e applicato.** Il Director ha ratificato
(«ratifico, dobbiamo fare le modifiche dove vanno fatte e in caso rigenerare
quello che dobbiamo rigenerare»): `tools/capsule-brand-fix.py` ha prodotto
halo+drop shadow+logo authored su tutte le capsule con logo e rigenerato
vertical/library capsule su composizione-eroe; `logo1.png` eliminato
(Cestino); `library_logo` riesportato con ombra. Antagonista: prompt in
`marketing/steam/prompts/keyart-antagonist-variant.md` → da generare →
visual fork. R-288 `in corso`, eye-check Director pendente.
