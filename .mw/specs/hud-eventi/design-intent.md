# Componente Eventi — design intent (R-357, PLAN-125 Fase 2bis, PLAN-117 F5)

**Perché esiste:** il giocatore deve sapere cosa sta arrivando e quando, senza aprire niente. È la risposta a «cosa succede nei prossimi giorni?»: minacce, spedizioni che rientrano, costruzioni che finiscono, raccolti, visite.

**Dove sta:** colonna destra di `/game`, in alto (ruling D-8 2026-11-17: tempo a sinistra, risorse al centro, Eventi a destra).

**Relazione col cassetto (ruling D-1):** stessa colonna. A riposo si vedono gli Eventi; aprendo una quest il cassetto spedizione (full-height) li copre interamente. Stessa larghezza e stesso bordo destro del cassetto: il cambio è pulito, niente sporge.

**Contenuto (dati veri, `gameFrameConfig.events.types`):** `threat` (danger, priorità 0), `quest` e `expedition` (warning), `construction` (neutral), `harvest` (good), `visit` (neutral). Voci ordinate per scadenza (giorni mancanti). Una minaccia entro 5 giorni è allarme (`nextEvent.ts`).

**Regole (PLAN-117 F5 / D-12):** obiettivi a medio-lungo termine, mai marker sulla mappa; segno positivo/negativo leggibile senza solo colore (sagoma + glifo); nessuna modale (veto GX-0042): il dettaglio apre in sezione dedicata, non in popup.

**Pillar:** HUD Zanara, stessa famiglia del cassetto firmato (`mockup-cassetto-v2.png`).
