# Componente Eventi — brief di composizione (PLAN-125 Fase 4/OB-8)

**Metodo:** mockup composto in DOM su token reali (`public/mockups/eventi-lab/`,
stesso canale della banda di scorrimento `.mw/runs/20261120-scroll-band/` —
visual-fork surface #2, harness HTML/CSS, `spike: remove`). Nessuna nuova
generazione AI: ogni parte deriva da un golden **già registrato** in
`.mw/specs/expedition-ui/refs/`.

## Sorgenti (provenance)

| Parte | Golden | Stato del ruling |
|---|---|---|
| Cornice (4 lati: angoli ad acanto + gemma a griffe, bordi incisi, fermaglio al centro del bordo alto, pendente rombo smeraldo sotto) | `mockup-r357-cornici-aperta.png` | **battezzata** (ruling v4b «Molto belle le cornici così, le battezzo»; pezzi estratti `panel-frame5/*` + ritagli `eventi-lab/assets/`) |
| Toolbar header (titolo + contatore + controlli tondi: filtro, ordina, vista, riduci, chiudi — identica a Roster/Stash) | `mockup-r357-hud-aperta-v4c.png` | **approvata** (ruling v4d «I filtri nuovi sn buoni, approvati»; «il world ledger dovrebbe essere come quello d roster») |
| Voci evento (vignetta dipinta, titolo, countdown in giorni, descrizione, chevron, barra di avanzamento per % events, riga «OTHER EVENTS • N» collassabile) | `mockup-r357-cornici-aperta.png` + `mockup-r357-hud-aperta-v4c.png` | contenuto approvato in entrambe |
| Banda di scorrimento | `scroll-band-oro-inciso.png` (fork card `.mw/runs/20261120-scroll-band/`, ruling B «Oro inciso» 2026-11-20) | **battezzata** |
| Stato ridotto a striscia (3 mini-righe icona+titolo+giorni) | `mockup-r357-cornici-chiusa.png` | riferimento |
| Palette | nav / placca risorse (golden standard colori, ruling 2026-11-17) | battezzata |

## Regole strutturali (desiderata + ruling)

- **D-8:** fascia alta = tempo a sinistra, risorse al centro, **Eventi a destra**.
- **D-1 / regola di copertura:** Eventi e cassetto condividono la colonna
  destra. A riposo si vedono gli Eventi; il cassetto aperto li copre
  **interamente**. Stessa larghezza o più stretto del cassetto (512 px @
  1440×900; `drawer.columnAspect` 0.5689 × altezza, cap 613), stesso bordo
  destro — niente sporge, il cambio è pulito.
- **Cornice su tutti i 4 lati** (gli Eventi non sono il cassetto estratto:
  bordo destro corniciato, non a filo schermo).
- **Segno positivo/negativo senza solo colore** (PLAN-117 F5): sagoma o glifo
  diverso per pericolo/buono/neutro.
- **Nessuna modale** (veto GX-0042): Event Detail in sezione dedicata, non
  popup — fuori da questo mockup (mockup Detail a parte, PLAN-125 §9).
- **Tipi** da `gameFrameConfig.events.types`: threat(danger) · quest ·
  expedition · construction · harvest · visit; ordine per scadenza; minaccia
  entro 5 giorni = allarme (`nextEvent.ts`).

## Cosa il mockup NON copre

- Event Detail (sezione dedicata) — mockup a parte.
- Icone definitive — programma icone D-6 (plan proprio); qui si usano i
  ritagli del golden come segnaposto pittorici.
- Dati reali — voci fittizie fedeli al golden (Invasion/Tournament/
  Fortification/Other), mapping sui type-id reali in produzione.
