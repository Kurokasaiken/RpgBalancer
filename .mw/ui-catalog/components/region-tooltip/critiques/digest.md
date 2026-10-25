# Digest critiche — region-tooltip (round 1, 2/3 image-grounded)

Provider: chatgpt, claude, deepseek — run
`20261025-critique-region-tooltip`, turn T-001 (+retry T-002 chatgpt),
prompt verbatim R-282, 2 shot allegati (ctx-a, iso-0).

**Provider failure dichiarati:**

- **chatgpt** — `ATTACH_FAILED` su T-001 e T-002 ("no upload affordance
  found"), pattern persistente del giorno. `chatgpt.md`.
- **claude** [RECUPERATO v. sezione merge] — quota free esaurita: banner verificato «Hai esaurito i
  messaggi gratuiti fino alle 12:20» (CET), submit provider-side
  disabilitato. T-001 POSTED orfano su `/new`. `claude.md`.

**Grounded:** solo deepseek (T-001 SUCCESS, 7.6k chars, italiano).
Verbatim in `deepseek.md`. Fatti corretti: tooltip «WHISPERING WOODS»,
cartouche blu notte con bordo oro sulla mappa pittorica.

## Niente convergenza misurabile

Un solo provider grounded: nessuna convergenza 2/2 riportabile. I temi
sotto sono della singola critica grounded.

## Punti della critica (deepseek, 1/1)

1. **Non diegetico: sembra "appiccicato".** «Blu notte con bordi
   dorati… non dialoga con la mappa sottostante», palette organica
   (verdi/terre) vs etichetta «ritagliata da un menu principale».
   Proposta: forma più organica — «da cartello a pergamena o insegna»,
   angoli arrotondati, bordo "consumato", `clip-path`/`border-image`.

2. **Tipografia senza gerarchia.** «WHISPERING WOODS è tutto uguale» —
   maiuscoletto con tracking ampio dona tono epico ma riduce
   distinguibilità a 1080p; nessuna distinzione nome/sottotitolo/stato.
   Proposta: `h3` titolo + `p.subtitle` descrittiva
   («Foresta Antica · Esplorata») + icona di categoria.

3. **Manca separazione dal fondo.** «Manca un'ombra esterna (drop
   shadow) che separi il tooltip dallo sfondo della mappa, facendolo
   sembrare incollato»; bordo oro «troppo sottile e luminoso», rischia
   di "bruciare" in luce ambientale.

4. **Statico, nessun feedback.** «Completamente statico… l'assenza di
   un'animazione di ingresso lo fa sembrare un bug o un elemento non
   finito»; posizione fissa che può coprire altre info al pan camera.
   Proposta: freccia/ancoraggio verso il POI + fade/scale-in.

5. **Informazione sprecata.** «È solo un nome… dovrebbe essere un
   biglietto da visita della regione»: mancano icone risorsa/pericolo,
   stato («Esplorato», «Pericolo: Alto»).

## Misread

Nessuno rilevato: nome regione, palette e forma del cartouche
corrispondono agli shot.

## Note operative

- claude irraggiungibile fino a 12:20 CET (quota free); rilanciare il
  turno dopo il reset o su account diverso.
- La draft «velenosa» del composer `/new` (prompt + allegati residui di
  send abortiti) si accumula a ogni send fallito: purge manuale eseguita
  due volte in sessione; lo stato condiviso resta fragile con più worker
  concorrenti sullo stesso profilo.


## Merge claude (refill T-001 su run -r2, post-reset quota 17:20)

claude GROUNDED (~9.1k chars, verbatim in `claude.md`). Assunzione
dichiarata: la targa è lo stato hover/selected di una regione.

**Convergenza (claude + deepseek)**: entrambi corretti sui fatti
(«WHISPERING WOODS», cartouche blu notte con bordo oro su mappa
pittorica). Entrambi convergono su:
- **Identità**: elemento UI-HUD appoggiato sulla mappa, non segno
  cartografico (deepseek: pannello cartouche sulla mappa; claude:
  «sticker flottante, non un nome sul territorio»).
- **Leggibilità/scala**: testo ~13px sotto soglia; claude cita placement
  cartografico (polylabel, etichetta curva, alone) e LOD/densità.
- **Zero affordance/informazione**: la targa restituisce solo il nome —
  niente pericolo/stato/livello né segnale di interagibilità.

**Punti solo claude**: piazzamento sul collo di strozzatura che nasconde
il contorno; ornamento → rumore a 30px; pin vuoto con stesso peso della
targa; nessun aggancio al terreno (alone/ombra/fade); soluzioni: etichetta
curva con alone in SVG, contorno duale con dimming esterno, targa compatta
solo in hover/selected.
