# Gemini web: capacità misurate (G-0, 2026-11-02)

Account: gratuito (banner «Fai l'upgrade»). Misure fatte dall'interfaccia via CDP :9222 con tab in background.
Script: `scripts/hud-real-g0-probe.mjs`, `-probe2.mjs`, `-probe3.mjs` (sola lettura, nessun invio) e `.mw/specs/hud-real/G0/run-gen-probe.sh` (2 generazioni).

## Modello e modalità
- Selettore: «Gemini Auto» (Modelli di Gemini 3). **«3.1 Pro» e «4 Argon» sono bloccati** (lucchetto) sull'account gratuito.
- Non si può scegliere il modello: l'interfaccia decide. Esiste un controllo «Livello di ragionamento» non esplorato.
- Nel menu «+» (Caricamento e strumenti): Carica file, Aggiungi da Drive, Altri caricamenti, **Crea immagine**, Crea video, Altri strumenti. Il nostro script usa la chat normale con «Generate an image:»; lo strumento «Crea immagine» non è mai stato provato.

## Allegati
- La pagina non espone `input[type=file]` finché non si apre il menu: l'allegato passa per «+» → «Carica file» (il selettore di file accetta più file).
- **Limite: 10 immagini per messaggio.** Provato con 12: ne restano 10, senza messaggi d'errore.
- Quindi il piano può allegare tavola base + guida geometrica + riferimento di materiale (3) con ampio margine. Le fonti trovate in rete davano «3 per i modelli veloci, 14 per i Pro»: non vale per questo account.

## Risoluzione dell'output (dai 46 file già generati oggi)
- 16:9: **1408×768** (scaricando l'originale con il pulsante «Scarica»); i file a 1024×559 sono lettura da canvas, più piccoli.
- 1:1: **1024×1024**. 3:4: **896×1200**.
- Lato lungo massimo osservato: 1408 px. L'interfaccia non offre una scelta di risoluzione.
- Conseguenza: una zona 1:1 dà 1024 px, una 16:9 dà 1408×768. Un anello che occupa l'80% del lato dà 800+ px di diametro in 1:1.

## Quota (pagina «Limiti di utilizzo»)
- **Finestra corrente: 100% utilizzata, si azzera alle 18:01.** Oggi il blocco è arrivato dopo circa 46 immagini generate tra le 11:37 e le 14:00 (più eventuali altre attività dello stesso account).
- **Limite settimanale: 16% utilizzato, si azzera il 7 novembre alle 20:01.**
- Le conversazioni recenti si chiamano «Image Generation Limit Reached»: le risposte a quota esaurita non producono immagini e vanno trattate come errore.
- Stima (non verificata): se le ~46 immagini di oggi sono la parte principale del 16%, il tetto settimanale è dell'ordine di 250–300 immagini e la finestra ne vale ~45.

## Da misurare con la generazione di prova (dopo le 18:03)
- Se Gemini accetta e rispetta 3 riferimenti con ruoli diversi (base, guida, materiale).
- Se la modifica ancorata nella stessa chat («keep everything, change only #n») conserva l'immagine.
- Risoluzione e tempo reali di queste due generazioni; quanto pesa ognuna sulla finestra.
