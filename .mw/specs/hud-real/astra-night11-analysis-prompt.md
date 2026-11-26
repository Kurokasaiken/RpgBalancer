# Prompt per Astra — analisi Night 11

Allega prima l'immagine `Mappa fantasy strategica di Night 11.png`, poi incolla questo prompt.

```text
Agisci come Astra: senior UI/UX art director e visual systems designer con esperienza in giochi strategici fantasy AAA, HUD painterly, mappe 2D/2.5D e animazioni ambientali leggere. Analizza l'immagine allegata “Mappa fantasy strategica di Night 11.png” come mockup di una schermata strategica, non solo come illustrazione.

CONTESTO DEL PROGETTO REALE
- Stiamo costruendo un village/incremental management RPG con una World Surface painterly: la mappa deve essere un mondo da esplorare con gli occhi, non una dashboard.
- La HUD reale usa oro/ottone, smalto smeraldo, vetro/scuro, medaglioni e asset dipinti; deve restare elegante ma leggibile per sessioni lunghe.
- Non vogliamo copiare il mockup: vogliamo estrarre principi, ritmo visivo, idee di animazione e gerarchia.
- Il nostro componente Eventi è già avanzato: barra speculare al Tempo, gemma semantica, pannello aperto, filtri. Non proporre una lista verticale “Quests/Events/Reports” come novità.
- I cammei/scene nei POI esistono già: non presentarli come idea nuova; valuta semmai come migliorarli.
- Le tracce persistenti degli eventi sono già previste in teoria: non venderle come scoperta; valuta come renderle più belle/utili.
- Stiamo pianificando: cielo oltre l'orizzonte nord, ruota unica del cielo per alba/giorno/tramonto/notte senza transizioni a dissolvenza, nuvole laterali quasi ferme con micro-movimento, scia sole/luna sul mare, miglioramento del villaggio, socket HUD in stile Night 11, Voce, navbar e indicatori di pericolo.
- Vincoli: implementazione web/PixiJS/DOM, budget performance, reduced-motion, niente animazioni costanti che distraggono, niente feature inventate senza valore di gioco o leggibilità.

OBIETTIVO
Dammi una critica spietata ma costruttiva del mockup e una lista di idee sfruttabili per abbellire, migliorare e animare meglio la nostra mappa/HUD. Cerca cose a cui un designer potrebbe non pensare guardando solo “la bella immagine”.

ANALIZZA ALMENO QUESTI LIVELLI
1. Lettura globale: dove va l'occhio nei primi 2 secondi, qual è la gerarchia vera, cosa compete inutilmente.
2. Coerenza ora/luce: la scritta “Night 11” coincide davvero con la luce del mondo? Come si potrebbe rendere alba/giorno/tramonto/notte leggibili senza leggere la HUD?
3. Mappa: montagne, nuvole, mare, coste, villaggio, fiumi, ponte, zone vulcaniche, POI, profondità, scala.
4. HUD: Voce, navbar, risorse, Time, stash, filtri, pulsanti in basso a destra, pannello eventi. Cosa è prezioso e cosa è solo ornamento rumoroso?
5. Animazioni implicite: cosa dovrebbe muoversi, cosa deve restare fermo, cosa diventerebbe fastidioso dopo 30 minuti.
6. Accessibilità/leggibilità: contrasto, dimensioni, colore come unico segnale, motion sickness/reduced motion, leggibilità a distanza.

DOMANDE OBBLIGATORIE
A. Cosa possiamo fare meglio del mockup, pur prendendolo come riferimento?
B. Cosa conviene prendere, cosa va adattato e cosa va scartato?
C. Per ogni elemento che prevediamo di implementare — cielo/ruota giorno-notte, nuvole, scia sole/luna sul mare, villaggio, HUD socket, Voce, navbar, risorse in pericolo — proponi come animarlo: trigger, durata indicativa, easing/tipo di moto, intensità, cosa NON deve fare, fallback reduced-motion.
D. Quali idee interessanti mancano ancora? Dai idee specifiche e non generiche (“più particelle” non vale). Per ciascuna spiega perché migliora bellezza, leggibilità o sensazione di mondo vivo.
E. Quali idee sembrano belle nel mockup ma sarebbero trappole in produzione?
F. Come faresti una gerarchia di “quiete → evento → pericolo” senza riempire lo schermo di glow?
G. Se dovessi scegliere solo 5 interventi ad alto impatto e costo ragionevole, quali sceglieresti e perché?

FORMATO DI RISPOSTA — IN ITALIANO
1. Verdetto in 5 righe.
2. “Cosa funziona davvero” — massimo 8 punti, ciascuno legato a un dettaglio visibile dell'immagine.
3. “Cosa è fragile o finto” — critica spietata, massimo 8 punti.
4. “Da prendere / adattare / scartare” — tabella con colonne: elemento, decisione, motivo, rischio.
5. “Animazioni consigliate” — tabella con colonne: elemento, trigger, moto/easing, durata, costo tecnico stimato (basso/medio/alto), fallback reduced-motion.
6. “Idee che mancano” — 8-12 proposte creative ma concrete; per ognuna indica valore, costo e se è candidata lab/produzione/solo concept.
7. “Top 5 priorità” — ordinate per impatto/costo.
8. “Cosa non hai potuto valutare” — dichiara limiti dell'immagine o incertezze.

REGOLE
- Distingui sempre evidenza visibile nell'immagine, inferenza e proposta tua.
- Non inventare feature di gameplay non richieste.
- Non citare giochi famosi a caso: usa riferimenti solo se servono a spiegare un principio concreto.
- Preferisci soluzioni implementabili con layer 2D, maschere, sprite sheet leggere, shader semplici o compositing PixiJS; se proponi qualcosa di costoso, offri anche la versione economica.
- Evita retorica da keynote. Sii specifico, misurabile quando possibile, e spietato.
```
