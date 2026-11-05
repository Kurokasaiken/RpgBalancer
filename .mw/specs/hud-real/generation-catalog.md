# Catalogo di generazione (PLAN-111)

Cose da far generare a Gemini, con prompt pronti da incollare. Vale per te, a mano, e per gli agenti.

## Come si usa
1. Scegli un elemento.
2. **Modalità A (da descrizione):** niente allegati. È il modo di K1, quello che ha dato gli anelli che ti sono piaciuti.
3. **Modalità B (modifica del mockup):** allega `gen-inputs/<ID>.png` (il ritaglio, già ingrandito 4× in modo fedele) e incolla il prompt B.
4. Prima l'immagine, poi il testo (l'ordine conta). Una chat nuova per ogni variante.
5. Salva con il nome `gen-results/<ID>/<modalità>-<n>.png` (per esempio `gen-results/RO-01/B-3.png`).
6. Segna il risultato in `trials.md` (modello di riga in fondo): voto 0–3 su sei criteri e due righe di note.

## Regole fisse dei prompt (non parafrasare, T-26)
- Parte con «Generate an image:» e sta su **una sola riga**.
- Vocabolario dei materiali sempre uguale: *matte painted antique gold with fine engraved detail, deep vitreous emerald-green enamel, light from the upper left, soft deep teal shadows, crisp edges*.
- Fondo sempre blu notte piatto `#0a1622` (così lo scontorno è un flood-fill pulito).
- Mai testo, lettere, numeri; mai viola o marrone.

## Elenco
| ID | Elemento | Formato consigliato |
|---|---|---|
| RO-01 | Roster: anello del ritratto | 1:1 quadrato |
| RO-02 | Roster: placca del nome con punta | 16:9 largo |
| RO-03 | Roster: banda verticale con terminale e pendente | 3:4 verticale |
| RO-04 | Roster: emblema alato | 1:1 quadrato |
| RO-05 | Roster: riga completa (anello + placca + giunto) | 16:9 largo |
| RO-06 | Roster: colonna completa | 9:16 verticale |
| RS-01 | Risorse: barra completa | 16:9 molto largo |
| RS-02 | Risorse: capo sinistro con gemme | 4:3 |
| NV-01 | Nav: barra completa con astrolabio | 16:9 molto largo |
| NV-02 | Nav: astrolabio centrale | 1:1 quadrato |
| NV-03 | Nav: alloggio voce in tre stati | 16:9 largo |
| PN-01 | Pannello: cornice di alabastro completa | 3:4 verticale |
| PN-02 | Pannello: angolo | 1:1 quadrato |
| PN-03 | Pannello: bottone INIZIA | 16:9 largo |
| AN-01 | Angolo sinistro: bussola con piastrina | 16:9 largo |
| AN-02 | Angolo destro: gruppo di roundel (da verificare) | 1:1 quadrato |
| SG-01 | Sigillo del verdetto | 1:1 quadrato |
| MR-01 | Marchio: emblema con placca | 16:9 largo |
| BU-01 | Busto sinistro | 3:4 verticale |
| BU-02 | Busto destro | 3:4 verticale |
| VO-01 | Voce: busto del narratore | 3:4 verticale |
| VO-02 | Voce: medaglione con quadrante | 1:1 quadrato |
| VO-03 | Voce: placca del messaggio | 16:9 largo |
| GM-01 | Gemme di stato: accesa e spenta | 3:2 |

---

## RO-01 · Roster: anello del ritratto
- **Sorgente:** zanara-v2 · zona anello (tavola base già pronta)
- **Allegato per B:** `gen-inputs/RO-01.png`
- **Formato:** 1:1 quadrato
- **Note:** È la zona pilota. Il ritaglio è già la tavola base senza ritratto.

**Prompt A (da descrizione):**
```
Generate an image: one isolated game-UI asset on a perfectly flat uniform dark navy background (#0a1622), nothing else in frame. A circular portrait ring for a fantasy strategy game HUD: a gold ring with an emerald-enamel band, a crescent of emerald enamel on its left side carrying three faceted emerald gems, and one diamond-shaped emerald gem at the bottom. The centre of the ring is completely empty, flat navy like the background. Matte painted antique gold with fine engraved detail, deep vitreous emerald-green enamel, light from the upper left, soft deep teal shadows, crisp edges. Front orthographic view, centred, square 1:1 image. No text, no letters, no numbers, no watermark, no purple, no brown.
```
**Prompt B (modifica del mockup):**
```
Generate an image: Image 1 is the approved design of a circular portrait ring for a fantasy strategy game HUD: a gold ring with an emerald-enamel band, a crescent of emerald enamel on its left side carrying three faceted emerald gems, and one diamond-shaped emerald gem at the bottom. Preserve its exact design: the enamel crescent with its gems on the left, the gem at the bottom, the gold rims with engraving, the emerald enamel band. Redraw it at high resolution with crisp engraved detail in matte painted antique gold with fine engraved detail, deep vitreous emerald-green enamel, light from the upper left, soft deep teal shadows, crisp edges, and fix these defects: the gold band has the same thickness all around; the inner gold rim is a perfect circle concentric with the outer rim; the three crescent gems are identical in size, cut and setting and evenly spaced; the bottom gem sits exactly on the vertical axis; also the left and right halves are mirror images of each other, repeated elements (gems, studs, engraving) are identical, every rim is a clean curve with no wobble, no fused or melted ornaments, no letter-like marks. Keep everything else unchanged. The centre of the ring is completely empty, flat navy like the background. Flat uniform dark navy background (#0a1622), front orthographic view, centred, square 1:1 image. No text, no letters, no numbers, no watermark, no purple, no brown.
```

## RO-02 · Roster: placca del nome con punta
- **Sorgente:** zanara-v2 · parte destra della riga
- **Allegato per B:** `gen-inputs/RO-02.png`
- **Formato:** 16:9 largo
- **Note:** Il ritaglio mostra nome, livello e barra: vanno rimossi (sono contenuto in codice).

**Prompt A (da descrizione):**
```
Generate an image: one isolated game-UI asset on a perfectly flat uniform dark navy background (#0a1622), nothing else in frame. A horizontal name plaque for a fantasy strategy game HUD: a dark emerald-enamel field in an ornate gold frame, a concave curved left end (as if tucked behind a round ring), a pointed chevron arrow tip on the right with a small emerald at the point, and a small diamond-shaped gold socket near the right end. The enamel field is empty: no name, no numbers, no bar; the diamond socket is empty. Matte painted antique gold with fine engraved detail, deep vitreous emerald-green enamel, light from the upper left, soft deep teal shadows, crisp edges. Front orthographic view, centred, wide 16:9 image. No text, no letters, no numbers, no watermark, no purple, no brown.
```
**Prompt B (modifica del mockup):**
```
Generate an image: Image 1 is the approved design of a horizontal name plaque for a fantasy strategy game HUD: a dark emerald-enamel field in an ornate gold frame, a concave curved left end (as if tucked behind a round ring), a pointed chevron arrow tip on the right with a small emerald at the point, and a small diamond-shaped gold socket near the right end. Preserve its exact design: the concave left end, the chevron tip with its emerald, the gold frame with engraved rails, the diamond socket. Redraw it at high resolution with crisp engraved detail in matte painted antique gold with fine engraved detail, deep vitreous emerald-green enamel, light from the upper left, soft deep teal shadows, crisp edges, and fix these defects: the top and bottom rails are parallel with equal thickness; the chevron tip is symmetric about the horizontal axis and its gem sits on the axis; also the left and right halves are mirror images of each other, repeated elements (gems, studs, engraving) are identical, every rim is a clean curve with no wobble, no fused or melted ornaments, no letter-like marks. Keep everything else unchanged. The enamel field is empty: no name, no numbers, no bar; the diamond socket is empty. Flat uniform dark navy background (#0a1622), front orthographic view, centred, wide 16:9 image. No text, no letters, no numbers, no watermark, no purple, no brown.
```

## RO-03 · Roster: banda verticale con terminale e pendente
- **Sorgente:** zanara-v2 · fondo della colonna
- **Allegato per B:** `gen-inputs/RO-03.png`
- **Formato:** 3:4 verticale
- **Note:** Il ritaglio contiene un pezzo di anello e un ritratto: vanno tolti.

**Prompt A (da descrizione):**
```
Generate an image: one isolated game-UI asset on a perfectly flat uniform dark navy background (#0a1622), nothing else in frame. The bottom end of a narrow vertical band for a fantasy HUD: two straight gold rails around a strip of emerald enamel coming in from the top edge, closing with an ornate gold cap from which hangs one diamond-shaped faceted emerald pendant. Show only the band and the pendant: remove every ring, portrait or other fragment. Matte painted antique gold with fine engraved detail, deep vitreous emerald-green enamel, light from the upper left, soft deep teal shadows, crisp edges. Front orthographic view, centred, tall vertical 3:4 image. No text, no letters, no numbers, no watermark, no purple, no brown.
```
**Prompt B (modifica del mockup):**
```
Generate an image: Image 1 is the approved design of the bottom end of a narrow vertical band for a fantasy HUD: two straight gold rails around a strip of emerald enamel coming in from the top edge, closing with an ornate gold cap from which hangs one diamond-shaped faceted emerald pendant. Preserve its exact design: the band with its rails, the gold cap, the diamond pendant. Redraw it at high resolution with crisp engraved detail in matte painted antique gold with fine engraved detail, deep vitreous emerald-green enamel, light from the upper left, soft deep teal shadows, crisp edges, and fix these defects: the two rails are straight and parallel; the cap and the pendant sit exactly on the band axis; also the left and right halves are mirror images of each other, repeated elements (gems, studs, engraving) are identical, every rim is a clean curve with no wobble, no fused or melted ornaments, no letter-like marks. Keep everything else unchanged. Show only the band and the pendant: remove every ring, portrait or other fragment. Flat uniform dark navy background (#0a1622), front orthographic view, centred, tall vertical 3:4 image. No text, no letters, no numbers, no watermark, no purple, no brown.
```

## RO-04 · Roster: emblema alato
- **Sorgente:** zanara-v2 · testa della colonna
- **Allegato per B:** `gen-inputs/RO-04.png`
- **Formato:** 1:1 quadrato
- **Note:** DECISIONE: nel mockup c'è una sola ala (a destra). Si può chiedere anche la versione con due ali simmetriche aggiungendo: «add a matching ivory wing on the left side».

**Prompt A (da descrizione):**
```
Generate an image: one isolated game-UI asset on a perfectly flat uniform dark navy background (#0a1622), nothing else in frame. A round winged compass emblem for a fantasy HUD: a gold-ringed emerald-enamel disc with an eight-point gold compass rose and a large faceted emerald at the centre, a sword-hilt finial on top, an ivory feathered wing on the right side, and small pointed gold pendants below. Nothing else in frame: no plaque, no band. Matte painted antique gold with fine engraved detail, deep vitreous emerald-green enamel, light from the upper left, soft deep teal shadows, crisp edges. Front orthographic view, centred, square 1:1 image. No text, no letters, no numbers, no watermark, no purple, no brown.
```
**Prompt B (modifica del mockup):**
```
Generate an image: Image 1 is the approved design of a round winged compass emblem for a fantasy HUD: a gold-ringed emerald-enamel disc with an eight-point gold compass rose and a large faceted emerald at the centre, a sword-hilt finial on top, an ivory feathered wing on the right side, and small pointed gold pendants below. Preserve its exact design: the disc with the compass rose and the central emerald, the hilt finial on top, the ivory wing, the pendants below. Redraw it at high resolution with crisp engraved detail in matte painted antique gold with fine engraved detail, deep vitreous emerald-green enamel, light from the upper left, soft deep teal shadows, crisp edges, and fix these defects: the disc is a perfect circle with a centred compass rose; the eight compass points are identical; the wing feathers are clean and distinct; also the left and right halves are mirror images of each other, repeated elements (gems, studs, engraving) are identical, every rim is a clean curve with no wobble, no fused or melted ornaments, no letter-like marks. Keep everything else unchanged. Nothing else in frame: no plaque, no band. Flat uniform dark navy background (#0a1622), front orthographic view, centred, square 1:1 image. No text, no letters, no numbers, no watermark, no purple, no brown.
```

## RO-05 · Roster: riga completa (anello + placca + giunto)
- **Sorgente:** zanara-v2 · prima riga
- **Allegato per B:** `gen-inputs/RO-05.png`
- **Formato:** 16:9 largo
- **Note:** Serve per provare se conviene generare la riga intera o le zone separate.

**Prompt A (da descrizione):**
```
Generate an image: one isolated game-UI asset on a perfectly flat uniform dark navy background (#0a1622), nothing else in frame. One complete roster row for a fantasy HUD: a gold portrait ring with an enamel crescent and gems on the left, joined to a horizontal emerald-enamel name plaque with a pointed chevron tip on the right, a short piece of vertical gold-and-enamel band at the far left. The ring centre is empty flat navy; the plaque field is empty: no portrait, no name, no numbers, no bar. Matte painted antique gold with fine engraved detail, deep vitreous emerald-green enamel, light from the upper left, soft deep teal shadows, crisp edges. Front orthographic view, centred, wide 16:9 image. No text, no letters, no numbers, no watermark, no purple, no brown.
```
**Prompt B (modifica del mockup):**
```
Generate an image: Image 1 is the approved design of one complete roster row for a fantasy HUD: a gold portrait ring with an enamel crescent and gems on the left, joined to a horizontal emerald-enamel name plaque with a pointed chevron tip on the right, a short piece of vertical gold-and-enamel band at the far left. Preserve its exact design: the ring, the enamel crescent and gems, the plaque with its tip, the piece of band at the left, the way ring and plaque interlock. Redraw it at high resolution with crisp engraved detail in matte painted antique gold with fine engraved detail, deep vitreous emerald-green enamel, light from the upper left, soft deep teal shadows, crisp edges, and fix these defects: ring and plaque are exactly aligned on the same horizontal axis; ring and plaque rails meet cleanly at the junction; also the left and right halves are mirror images of each other, repeated elements (gems, studs, engraving) are identical, every rim is a clean curve with no wobble, no fused or melted ornaments, no letter-like marks. Keep everything else unchanged. The ring centre is empty flat navy; the plaque field is empty: no portrait, no name, no numbers, no bar. Flat uniform dark navy background (#0a1622), front orthographic view, centred, wide 16:9 image. No text, no letters, no numbers, no watermark, no purple, no brown.
```

## RO-06 · Roster: colonna completa
- **Sorgente:** zanara-v2 · colonna intera
- **Allegato per B:** `gen-inputs/RO-06.png`
- **Formato:** 9:16 verticale
- **Note:** Prova di framing: componente intero. Di solito peggiora il dettaglio, ma mostra se la coerenza tra righe migliora.

**Prompt A (da descrizione):**
```
Generate an image: one isolated game-UI asset on a perfectly flat uniform dark navy background (#0a1622), nothing else in frame. A vertical roster column for a fantasy HUD: a winged compass emblem at the top, a vertical gold-and-emerald band running down the left, four identical roster rows each with a gold portrait ring and an emerald-enamel name plaque with a chevron tip, and a diamond pendant at the bottom. Rings and plaques are empty: no portraits, no names, no numbers. Matte painted antique gold with fine engraved detail, deep vitreous emerald-green enamel, light from the upper left, soft deep teal shadows, crisp edges. Front orthographic view, centred, tall vertical 9:16 image. No text, no letters, no numbers, no watermark, no purple, no brown.
```
**Prompt B (modifica del mockup):**
```
Generate an image: Image 1 is the approved design of a vertical roster column for a fantasy HUD: a winged compass emblem at the top, a vertical gold-and-emerald band running down the left, four identical roster rows each with a gold portrait ring and an emerald-enamel name plaque with a chevron tip, and a diamond pendant at the bottom. Preserve its exact design: the emblem, the band, the four rows, the pendant. Redraw it at high resolution with crisp engraved detail in matte painted antique gold with fine engraved detail, deep vitreous emerald-green enamel, light from the upper left, soft deep teal shadows, crisp edges, and fix these defects: the four rows are IDENTICAL in every detail (same ring, same plaque length, same gems, same spacing); the band is straight; also the left and right halves are mirror images of each other, repeated elements (gems, studs, engraving) are identical, every rim is a clean curve with no wobble, no fused or melted ornaments, no letter-like marks. Keep everything else unchanged. Rings and plaques are empty: no portraits, no names, no numbers. Flat uniform dark navy background (#0a1622), front orthographic view, centred, tall vertical 9:16 image. No text, no letters, no numbers, no watermark, no purple, no brown.
```

## RS-01 · Risorse: barra completa
- **Sorgente:** zanara-v3 · barra in alto a destra
- **Allegato per B:** `gen-inputs/RS-01.png`
- **Formato:** 16:9 molto largo
- **Note:** Il mockup ha 5 slot e una gemma viola: il gioco ha 3 risorse (oro, cibo, legna) e il viola è vietato. Per 5 slot scrivere «five» al posto di «three».

**Prompt A (da descrizione):**
```
Generate an image: one isolated game-UI asset on a perfectly flat uniform dark navy background (#0a1622), nothing else in frame. A horizontal resource bar for a fantasy HUD: a dark emerald-enamel pill-shaped field in an ornate gold frame, with gem-decorated end caps (faceted emerald teardrop pendants), divided by thin gold dividers into three equal empty rounded slots. The slots are empty: no icons, no numbers. Matte painted antique gold with fine engraved detail, deep vitreous emerald-green enamel, light from the upper left, soft deep teal shadows, crisp edges. Front orthographic view, centred, very wide horizontal image. No text, no letters, no numbers, no watermark, no purple, no brown.
```
**Prompt B (modifica del mockup):**
```
Generate an image: Image 1 is the approved design of a horizontal resource bar for a fantasy HUD: a dark emerald-enamel pill-shaped field in an ornate gold frame, with gem-decorated end caps (faceted emerald teardrop pendants), divided by thin gold dividers into three equal empty rounded slots. Preserve its exact design: the pill shape, the gold frame, the end caps with their gems, the dividers. Redraw it at high resolution with crisp engraved detail in matte painted antique gold with fine engraved detail, deep vitreous emerald-green enamel, light from the upper left, soft deep teal shadows, crisp edges, and fix these defects: the left and right end caps are mirror images; the three slots are identical in size and spacing; also the left and right halves are mirror images of each other, repeated elements (gems, studs, engraving) are identical, every rim is a clean curve with no wobble, no fused or melted ornaments, no letter-like marks. Keep everything else unchanged. The slots are empty: no icons, no numbers. Flat uniform dark navy background (#0a1622), front orthographic view, centred, very wide horizontal image. No text, no letters, no numbers, no watermark, no purple, no brown.
```

## RS-02 · Risorse: capo sinistro con gemme
- **Sorgente:** zanara-v3 · estremità della barra
- **Allegato per B:** `gen-inputs/RS-02.png`
- **Formato:** 4:3
- **Note:** Pezzo ripetibile: la sua copia speculare è il capo destro.

**Prompt A (da descrizione):**
```
Generate an image: one isolated game-UI asset on a perfectly flat uniform dark navy background (#0a1622), nothing else in frame. The left end cap of a fantasy HUD resource bar: an ornate gold frame with emerald enamel and faceted emerald gems, a teardrop emerald pendant hanging below, the start of a dark emerald-enamel pill field on the right. The pill field is empty. Matte painted antique gold with fine engraved detail, deep vitreous emerald-green enamel, light from the upper left, soft deep teal shadows, crisp edges. Front orthographic view, centred, landscape 4:3 image. No text, no letters, no numbers, no watermark, no purple, no brown.
```
**Prompt B (modifica del mockup):**
```
Generate an image: Image 1 is the approved design of the left end cap of a fantasy HUD resource bar: an ornate gold frame with emerald enamel and faceted emerald gems, a teardrop emerald pendant hanging below, the start of a dark emerald-enamel pill field on the right. Preserve its exact design: the cap with its gems, the pendant, the gold frame. Redraw it at high resolution with crisp engraved detail in matte painted antique gold with fine engraved detail, deep vitreous emerald-green enamel, light from the upper left, soft deep teal shadows, crisp edges, and fix these defects: the cap is symmetric about its horizontal axis; the gems are identical in cut; also the left and right halves are mirror images of each other, repeated elements (gems, studs, engraving) are identical, every rim is a clean curve with no wobble, no fused or melted ornaments, no letter-like marks. Keep everything else unchanged. The pill field is empty. Flat uniform dark navy background (#0a1622), front orthographic view, centred, landscape 4:3 image. No text, no letters, no numbers, no watermark, no purple, no brown.
```

## NV-01 · Nav: barra completa con astrolabio
- **Sorgente:** zanara-v1 · barra in basso
- **Allegato per B:** `gen-inputs/NV-01.png`
- **Formato:** 16:9 molto largo
- **Note:** Il mockup ha 3+3 voci; il gioco ne ha 4 (Villaggio, Mappa | Officina, Taverna): quindi 2+2. L'astrolabio è il comando di ricentratura (D-4).

**Prompt A (da descrizione):**
```
Generate an image: one isolated game-UI asset on a perfectly flat uniform dark navy background (#0a1622), nothing else in frame. A horizontal navigation bar for a fantasy HUD: dark emerald-enamel pill segments in gold frames on both sides of a central round armillary astrolabe with a large emerald and a gold compass star, each side holding two equal empty rounded button sockets separated by thin gold dividers. The sockets are empty: no icons, no labels. Matte painted antique gold with fine engraved detail, deep vitreous emerald-green enamel, light from the upper left, soft deep teal shadows, crisp edges. Front orthographic view, centred, very wide horizontal image. No text, no letters, no numbers, no watermark, no purple, no brown.
```
**Prompt B (modifica del mockup):**
```
Generate an image: Image 1 is the approved design of a horizontal navigation bar for a fantasy HUD: dark emerald-enamel pill segments in gold frames on both sides of a central round armillary astrolabe with a large emerald and a gold compass star, each side holding two equal empty rounded button sockets separated by thin gold dividers. Preserve its exact design: the central astrolabe, the pill segments, the gold frames, the dividers. Redraw it at high resolution with crisp engraved detail in matte painted antique gold with fine engraved detail, deep vitreous emerald-green enamel, light from the upper left, soft deep teal shadows, crisp edges, and fix these defects: the left and right halves are exact mirror images; the astrolabe is centred; all four sockets are identical; also the left and right halves are mirror images of each other, repeated elements (gems, studs, engraving) are identical, every rim is a clean curve with no wobble, no fused or melted ornaments, no letter-like marks. Keep everything else unchanged. The sockets are empty: no icons, no labels. Flat uniform dark navy background (#0a1622), front orthographic view, centred, very wide horizontal image. No text, no letters, no numbers, no watermark, no purple, no brown.
```

## NV-02 · Nav: astrolabio centrale
- **Sorgente:** zanara-v1 · centro della barra
- **Allegato per B:** `gen-inputs/NV-02.png`
- **Formato:** 1:1 quadrato
- **Note:** Pezzo animabile (rotazione lenta): serve centrato e simmetrico.

**Prompt A (da descrizione):**
```
Generate an image: one isolated game-UI asset on a perfectly flat uniform dark navy background (#0a1622), nothing else in frame. A round armillary astrolabe for a fantasy HUD: concentric gold rings around an emerald-enamel globe with a large faceted emerald and an eight-point gold compass star, four pointed emerald-tipped finials at the cardinal points. Nothing else in frame. Matte painted antique gold with fine engraved detail, deep vitreous emerald-green enamel, light from the upper left, soft deep teal shadows, crisp edges. Front orthographic view, centred, square 1:1 image. No text, no letters, no numbers, no watermark, no purple, no brown.
```
**Prompt B (modifica del mockup):**
```
Generate an image: Image 1 is the approved design of a round armillary astrolabe for a fantasy HUD: concentric gold rings around an emerald-enamel globe with a large faceted emerald and an eight-point gold compass star, four pointed emerald-tipped finials at the cardinal points. Preserve its exact design: the concentric rings, the globe, the star, the four finials. Redraw it at high resolution with crisp engraved detail in matte painted antique gold with fine engraved detail, deep vitreous emerald-green enamel, light from the upper left, soft deep teal shadows, crisp edges, and fix these defects: the four finials are identical and at exact cardinal points; the rings are concentric perfect circles; also the left and right halves are mirror images of each other, repeated elements (gems, studs, engraving) are identical, every rim is a clean curve with no wobble, no fused or melted ornaments, no letter-like marks. Keep everything else unchanged. Nothing else in frame. Flat uniform dark navy background (#0a1622), front orthographic view, centred, square 1:1 image. No text, no letters, no numbers, no watermark, no purple, no brown.
```

## NV-03 · Nav: alloggio voce in tre stati
- **Sorgente:** zanara-v1 · voci a sinistra
- **Allegato per B:** `gen-inputs/NV-03.png`
- **Formato:** 16:9 largo
- **Note:** Serve per ricavare normale / attivo / bloccato dalla stessa forma.

**Prompt A (da descrizione):**
```
Generate an image: one isolated game-UI asset on a perfectly flat uniform dark navy background (#0a1622), nothing else in frame. A row of three identical rounded button sockets for a fantasy HUD, each a dark emerald-enamel pill in a gold frame: the first normal, the second active with a brighter gold rim and a soft emerald glow, the third locked, darker and desaturated. The sockets are empty: no icons, no labels. Matte painted antique gold with fine engraved detail, deep vitreous emerald-green enamel, light from the upper left, soft deep teal shadows, crisp edges. Front orthographic view, centred, wide 16:9 image. No text, no letters, no numbers, no watermark, no purple, no brown.
```
**Prompt B (modifica del mockup):**
```
Generate an image: Image 1 is the approved design of a row of three identical rounded button sockets for a fantasy HUD, each a dark emerald-enamel pill in a gold frame: the first normal, the second active with a brighter gold rim and a soft emerald glow, the third locked, darker and desaturated. Preserve its exact design: the pill shape and the gold frame, the active glow. Redraw it at high resolution with crisp engraved detail in matte painted antique gold with fine engraved detail, deep vitreous emerald-green enamel, light from the upper left, soft deep teal shadows, crisp edges, and fix these defects: the three sockets are identical in shape, size and frame; only the state differs; also the left and right halves are mirror images of each other, repeated elements (gems, studs, engraving) are identical, every rim is a clean curve with no wobble, no fused or melted ornaments, no letter-like marks. Keep everything else unchanged. The sockets are empty: no icons, no labels. Flat uniform dark navy background (#0a1622), front orthographic view, centred, wide 16:9 image. No text, no letters, no numbers, no watermark, no purple, no brown.
```

## PN-01 · Pannello: cornice di alabastro completa
- **Sorgente:** zanara-v3 · pannello a destra
- **Allegato per B:** `gen-inputs/PN-01.png`
- **Formato:** 3:4 verticale
- **Note:** Il mockup ha una statua a sinistra e fogli arrotolati: restano come nel mockup (D-2).

**Prompt A (da descrizione):**
```
Generate an image: one isolated game-UI asset on a perfectly flat uniform dark navy background (#0a1622), nothing else in frame. A tall vertical information panel frame for a fantasy HUD: an ivory alabaster panel in a thin gold frame, emerald-enamel arched corner ornaments at the top, a pointed gold-and-emerald finial at the top centre, a vertical rounded illustration window on the right side of the upper half, a decorated bottom edge. The inside is empty ivory alabaster and the window is empty dark: no title, no text, no icons, no picture. Matte painted antique gold with fine engraved detail, deep vitreous emerald-green enamel, light from the upper left, soft deep teal shadows, crisp edges. Front orthographic view, centred, tall vertical 3:4 image. No text, no letters, no numbers, no watermark, no purple, no brown.
```
**Prompt B (modifica del mockup):**
```
Generate an image: Image 1 is the approved design of a tall vertical information panel frame for a fantasy HUD: an ivory alabaster panel in a thin gold frame, emerald-enamel arched corner ornaments at the top, a pointed gold-and-emerald finial at the top centre, a vertical rounded illustration window on the right side of the upper half, a decorated bottom edge. Preserve its exact design: the alabaster panel, the gold frame, the enamel corner ornaments, the finial, the illustration window. Redraw it at high resolution with crisp engraved detail in matte painted antique gold with fine engraved detail, deep vitreous emerald-green enamel, light from the upper left, soft deep teal shadows, crisp edges, and fix these defects: the left and right corner ornaments are mirror images; the frame edges are straight and parallel; also the left and right halves are mirror images of each other, repeated elements (gems, studs, engraving) are identical, every rim is a clean curve with no wobble, no fused or melted ornaments, no letter-like marks. Keep everything else unchanged. The inside is empty ivory alabaster and the window is empty dark: no title, no text, no icons, no picture. Flat uniform dark navy background (#0a1622), front orthographic view, centred, tall vertical 3:4 image. No text, no letters, no numbers, no watermark, no purple, no brown.
```

## PN-02 · Pannello: angolo
- **Sorgente:** zanara-v3 · angolo in alto a sinistra
- **Allegato per B:** `gen-inputs/PN-02.png`
- **Formato:** 1:1 quadrato
- **Note:** Un angolo buono si specchia sui quattro lati: è il pezzo più riusabile.

**Prompt A (da descrizione):**
```
Generate an image: one isolated game-UI asset on a perfectly flat uniform dark navy background (#0a1622), nothing else in frame. The top-left corner of an ivory alabaster panel for a fantasy HUD: a thin gold frame with an emerald-enamel arched corner ornament and a pointed gold-and-emerald finial. The panel field is empty ivory: no text. Matte painted antique gold with fine engraved detail, deep vitreous emerald-green enamel, light from the upper left, soft deep teal shadows, crisp edges. Front orthographic view, centred, square 1:1 image. No text, no letters, no numbers, no watermark, no purple, no brown.
```
**Prompt B (modifica del mockup):**
```
Generate an image: Image 1 is the approved design of the top-left corner of an ivory alabaster panel for a fantasy HUD: a thin gold frame with an emerald-enamel arched corner ornament and a pointed gold-and-emerald finial. Preserve its exact design: the corner ornament, the finial, the gold frame. Redraw it at high resolution with crisp engraved detail in matte painted antique gold with fine engraved detail, deep vitreous emerald-green enamel, light from the upper left, soft deep teal shadows, crisp edges, and fix these defects: the ornament is symmetric about the corner diagonal; the engraving repeats with equal pitch; also the left and right halves are mirror images of each other, repeated elements (gems, studs, engraving) are identical, every rim is a clean curve with no wobble, no fused or melted ornaments, no letter-like marks. Keep everything else unchanged. The panel field is empty ivory: no text. Flat uniform dark navy background (#0a1622), front orthographic view, centred, square 1:1 image. No text, no letters, no numbers, no watermark, no purple, no brown.
```

## PN-03 · Pannello: bottone INIZIA
- **Sorgente:** zanara-v3 · base del pannello
- **Allegato per B:** `gen-inputs/PN-03.png`
- **Formato:** 16:9 largo
- **Note:** Resta come nel mockup (D-3). La scritta INIZIA è testo in codice.

**Prompt A (da descrizione):**
```
Generate an image: one isolated game-UI asset on a perfectly flat uniform dark navy background (#0a1622), nothing else in frame. A wide pill button for a fantasy HUD: an emerald-enamel field in an ornate gold frame, a compass-rose medallion at the left end, pointed emerald gems at both ends. The field is empty: no text. Matte painted antique gold with fine engraved detail, deep vitreous emerald-green enamel, light from the upper left, soft deep teal shadows, crisp edges. Front orthographic view, centred, wide 16:9 image. No text, no letters, no numbers, no watermark, no purple, no brown.
```
**Prompt B (modifica del mockup):**
```
Generate an image: Image 1 is the approved design of a wide pill button for a fantasy HUD: an emerald-enamel field in an ornate gold frame, a compass-rose medallion at the left end, pointed emerald gems at both ends. Preserve its exact design: the pill shape, the compass-rose medallion at the left, the pointed end gems, the gold frame. Redraw it at high resolution with crisp engraved detail in matte painted antique gold with fine engraved detail, deep vitreous emerald-green enamel, light from the upper left, soft deep teal shadows, crisp edges, and fix these defects: the end gems are identical; the rails are parallel; the medallion is a perfect circle; also the left and right halves are mirror images of each other, repeated elements (gems, studs, engraving) are identical, every rim is a clean curve with no wobble, no fused or melted ornaments, no letter-like marks. Keep everything else unchanged. The field is empty: no text. Flat uniform dark navy background (#0a1622), front orthographic view, centred, wide 16:9 image. No text, no letters, no numbers, no watermark, no purple, no brown.
```

## AN-01 · Angolo sinistro: bussola con piastrina
- **Sorgente:** zanara-v1 · angolo in basso a sinistra
- **Allegato per B:** `gen-inputs/AN-01.png`
- **Formato:** 16:9 largo
- **Note:** DECISIONE RIMANDATA (D-5): cosa mostra la piastrina. Si genera vuota.

**Prompt A (da descrizione):**
```
Generate an image: one isolated game-UI asset on a perfectly flat uniform dark navy background (#0a1622), nothing else in frame. A gold compass instrument for a fantasy HUD: a round emerald-enamel dial in a gold frame with an eight-point gold compass rose and a faceted emerald at each cardinal point, attached on the right to a dark emerald-enamel rounded info plate in a gold frame. The info plate is empty: no coordinates, no text; the dial has no letters. Matte painted antique gold with fine engraved detail, deep vitreous emerald-green enamel, light from the upper left, soft deep teal shadows, crisp edges. Front orthographic view, centred, wide 16:9 image. No text, no letters, no numbers, no watermark, no purple, no brown.
```
**Prompt B (modifica del mockup):**
```
Generate an image: Image 1 is the approved design of a gold compass instrument for a fantasy HUD: a round emerald-enamel dial in a gold frame with an eight-point gold compass rose and a faceted emerald at each cardinal point, attached on the right to a dark emerald-enamel rounded info plate in a gold frame. Preserve its exact design: the dial, the compass rose, the cardinal gems, the info plate. Redraw it at high resolution with crisp engraved detail in matte painted antique gold with fine engraved detail, deep vitreous emerald-green enamel, light from the upper left, soft deep teal shadows, crisp edges, and fix these defects: the four cardinal gems are identical and on the exact axes; the dial is a perfect circle with a centred rose; also the left and right halves are mirror images of each other, repeated elements (gems, studs, engraving) are identical, every rim is a clean curve with no wobble, no fused or melted ornaments, no letter-like marks. Keep everything else unchanged. The info plate is empty: no coordinates, no text; the dial has no letters. Flat uniform dark navy background (#0a1622), front orthographic view, centred, wide 16:9 image. No text, no letters, no numbers, no watermark, no purple, no brown.
```

## AN-02 · Angolo destro: gruppo di roundel (da verificare)
- **Sorgente:** board-breakdown · angolo in basso a destra
- **Allegato per B:** `gen-inputs/AN-02.png`
- **Formato:** 1:1 quadrato
- **Note:** ATTENZIONE: il ritaglio del mockup mostra un forziere e un medaglione, non un gruppo di roundel. Va verificato quale pezzo intendevi: in quel caso scegli tu l'area dal mockup. La modalità A (da descrizione) funziona comunque.

**Prompt A (da descrizione):**
```
Generate an image: one isolated game-UI asset on a perfectly flat uniform dark navy background (#0a1622), nothing else in frame. A compact cluster of four round gold roundel buttons for a fantasy HUD, each a gold ring around an emerald-enamel disc with a faceted emerald accent, arranged in a tight 2x2 group. The discs are empty: no icons. Matte painted antique gold with fine engraved detail, deep vitreous emerald-green enamel, light from the upper left, soft deep teal shadows, crisp edges. Front orthographic view, centred, square 1:1 image. No text, no letters, no numbers, no watermark, no purple, no brown.
```
**Prompt B (modifica del mockup):**
```
Generate an image: Image 1 is the approved design of a compact cluster of four round gold roundel buttons for a fantasy HUD, each a gold ring around an emerald-enamel disc with a faceted emerald accent, arranged in a tight 2x2 group. Preserve its exact design: the roundel shape, the gold ring and enamel disc of each button. Redraw it at high resolution with crisp engraved detail in matte painted antique gold with fine engraved detail, deep vitreous emerald-green enamel, light from the upper left, soft deep teal shadows, crisp edges, and fix these defects: the four roundels are identical in size and detail; the group is symmetric; also the left and right halves are mirror images of each other, repeated elements (gems, studs, engraving) are identical, every rim is a clean curve with no wobble, no fused or melted ornaments, no letter-like marks. Keep everything else unchanged. The discs are empty: no icons. Flat uniform dark navy background (#0a1622), front orthographic view, centred, square 1:1 image. No text, no letters, no numbers, no watermark, no purple, no brown.
```

## SG-01 · Sigillo del verdetto
- **Sorgente:** mockup1-classic · sigillo
- **Allegato per B:** `gen-inputs/SG-01.png`
- **Formato:** 1:1 quadrato
- **Note:** La percentuale e i teschi sono contenuto in codice.

**Prompt A (da descrizione):**
```
Generate an image: one isolated game-UI asset on a perfectly flat uniform dark navy background (#0a1622), nothing else in frame. A round victory seal for a fantasy HUD: a gold ring around an emerald-enamel disc, two crossed gold swords at the top inside a gold laurel wreath, and below the disc a long horizontal emerald-enamel band in a gold frame holding five empty round sockets. The centre of the disc is empty emerald enamel (a number goes there) and the five sockets are empty. Matte painted antique gold with fine engraved detail, deep vitreous emerald-green enamel, light from the upper left, soft deep teal shadows, crisp edges. Front orthographic view, centred, square 1:1 image. No text, no letters, no numbers, no watermark, no purple, no brown.
```
**Prompt B (modifica del mockup):**
```
Generate an image: Image 1 is the approved design of a round victory seal for a fantasy HUD: a gold ring around an emerald-enamel disc, two crossed gold swords at the top inside a gold laurel wreath, and below the disc a long horizontal emerald-enamel band in a gold frame holding five empty round sockets. Preserve its exact design: the ring, the crossed swords, the laurel wreath, the lower band with five sockets. Redraw it at high resolution with crisp engraved detail in matte painted antique gold with fine engraved detail, deep vitreous emerald-green enamel, light from the upper left, soft deep teal shadows, crisp edges, and fix these defects: the laurel wreath is symmetric left to right with identical leaves; the swords cross exactly on the vertical axis; the five sockets are identical and evenly spaced; also the left and right halves are mirror images of each other, repeated elements (gems, studs, engraving) are identical, every rim is a clean curve with no wobble, no fused or melted ornaments, no letter-like marks. Keep everything else unchanged. The centre of the disc is empty emerald enamel (a number goes there) and the five sockets are empty. Flat uniform dark navy background (#0a1622), front orthographic view, centred, square 1:1 image. No text, no letters, no numbers, no watermark, no purple, no brown.
```

## MR-01 · Marchio: emblema con placca
- **Sorgente:** board-palette · marchio
- **Allegato per B:** `gen-inputs/MR-01.png`
- **Formato:** 16:9 largo
- **Note:** D-8: emblema + placca. Il testo WANDERLUST va messo in codice con un carattere dedicato.

**Prompt A (da descrizione):**
```
Generate an image: one isolated game-UI asset on a perfectly flat uniform dark navy background (#0a1622), nothing else in frame. A brand badge for a fantasy HUD: a round winged compass emblem on the left joined to a long horizontal emerald-enamel plaque with a pointed arrow tip on the right, all in ornate gold. The plaque is empty: no text (the game title is typeset separately). Matte painted antique gold with fine engraved detail, deep vitreous emerald-green enamel, light from the upper left, soft deep teal shadows, crisp edges. Front orthographic view, centred, wide 16:9 image. No text, no letters, no numbers, no watermark, no purple, no brown.
```
**Prompt B (modifica del mockup):**
```
Generate an image: Image 1 is the approved design of a brand badge for a fantasy HUD: a round winged compass emblem on the left joined to a long horizontal emerald-enamel plaque with a pointed arrow tip on the right, all in ornate gold. Preserve its exact design: the emblem, the plaque, the pointed tip. Redraw it at high resolution with crisp engraved detail in matte painted antique gold with fine engraved detail, deep vitreous emerald-green enamel, light from the upper left, soft deep teal shadows, crisp edges, and fix these defects: the plaque rails are parallel; the emblem is centred on the plaque axis; also the left and right halves are mirror images of each other, repeated elements (gems, studs, engraving) are identical, every rim is a clean curve with no wobble, no fused or melted ornaments, no letter-like marks. Keep everything else unchanged. The plaque is empty: no text (the game title is typeset separately). Flat uniform dark navy background (#0a1622), front orthographic view, centred, wide 16:9 image. No text, no letters, no numbers, no watermark, no purple, no brown.
```

## BU-01 · Busto sinistro
- **Sorgente:** busts-voce · angolo in alto a sinistra
- **Allegato per B:** `gen-inputs/BU-01.png`
- **Formato:** 3:4 verticale
- **Note:** Nel mockup ci sono foglie intorno (D-2: restano).

**Prompt A (da descrizione):**
```
Generate an image: one isolated game-UI asset on a perfectly flat uniform dark navy background (#0a1622), nothing else in frame. A sculpted bronze-gold bust of a helmeted heroic explorer for a fantasy HUD corner ornament, head and shoulders, turned to the right, with gold trim. Nothing else in frame. Matte painted antique gold with fine engraved detail, deep vitreous emerald-green enamel, light from the upper left, soft deep teal shadows, crisp edges. Front orthographic view, centred, tall vertical 3:4 image. No text, no letters, no numbers, no watermark, no purple, no brown.
```
**Prompt B (modifica del mockup):**
```
Generate an image: Image 1 is the approved design of a sculpted bronze-gold bust of a helmeted heroic explorer for a fantasy HUD corner ornament, head and shoulders, turned to the right, with gold trim. Preserve its exact design: the helmeted head, the shoulders, the pose and the gold trim. Redraw it at high resolution with crisp engraved detail in matte painted antique gold with fine engraved detail, deep vitreous emerald-green enamel, light from the upper left, soft deep teal shadows, crisp edges, and fix these defects: the helmet is clean and symmetric; the face and torso have consistent proportions; no melted details; also the left and right halves are mirror images of each other, repeated elements (gems, studs, engraving) are identical, every rim is a clean curve with no wobble, no fused or melted ornaments, no letter-like marks. Keep everything else unchanged. Nothing else in frame. Flat uniform dark navy background (#0a1622), front orthographic view, centred, tall vertical 3:4 image. No text, no letters, no numbers, no watermark, no purple, no brown.
```

## BU-02 · Busto destro
- **Sorgente:** busts-voce · angolo in alto a destra
- **Allegato per B:** `gen-inputs/BU-02.png`
- **Formato:** 3:4 verticale
- **Note:** Il mockup mostra una creatura leonina: verificare che sia quella voluta.

**Prompt A (da descrizione):**
```
Generate an image: one isolated game-UI asset on a perfectly flat uniform dark navy background (#0a1622), nothing else in frame. A sculpted bronze-gold bust of a seated sphinx-like guardian creature for a fantasy HUD corner ornament, turned to the left, with gold trim. Nothing else in frame. Matte painted antique gold with fine engraved detail, deep vitreous emerald-green enamel, light from the upper left, soft deep teal shadows, crisp edges. Front orthographic view, centred, tall vertical 3:4 image. No text, no letters, no numbers, no watermark, no purple, no brown.
```
**Prompt B (modifica del mockup):**
```
Generate an image: Image 1 is the approved design of a sculpted bronze-gold bust of a seated sphinx-like guardian creature for a fantasy HUD corner ornament, turned to the left, with gold trim. Preserve its exact design: the creature, the pose and the gold trim. Redraw it at high resolution with crisp engraved detail in matte painted antique gold with fine engraved detail, deep vitreous emerald-green enamel, light from the upper left, soft deep teal shadows, crisp edges, and fix these defects: the anatomy is consistent; no melted details; also the left and right halves are mirror images of each other, repeated elements (gems, studs, engraving) are identical, every rim is a clean curve with no wobble, no fused or melted ornaments, no letter-like marks. Keep everything else unchanged. Nothing else in frame. Flat uniform dark navy background (#0a1622), front orthographic view, centred, tall vertical 3:4 image. No text, no letters, no numbers, no watermark, no purple, no brown.
```

## VO-01 · Voce: busto del narratore
- **Sorgente:** busts-voce · busto in basso a sinistra
- **Allegato per B:** `gen-inputs/VO-01.png`
- **Formato:** 3:4 verticale
- **Note:** DECISIONE: il mockup mostra una giovane donna con corona di alloro; il ruling Z11 vuole l'Amanuense (scriba). Per lo scriba scrivere nel soggetto: «a wise warm village scribe with a quill and a dark emerald robe».

**Prompt A (da descrizione):**
```
Generate an image: one isolated game-UI asset on a perfectly flat uniform dark navy background (#0a1622), nothing else in frame. A painted half-length portrait bust of the narrator character of a fantasy strategy game, turned to the right, framed by gold ornament. Nothing else in frame: no message plaque. Matte painted antique gold with fine engraved detail, deep vitreous emerald-green enamel, light from the upper left, soft deep teal shadows, crisp edges. Front orthographic view, centred, tall vertical 3:4 image. No text, no letters, no numbers, no watermark, no purple, no brown.
```
**Prompt B (modifica del mockup):**
```
Generate an image: Image 1 is the approved design of a painted half-length portrait bust of the narrator character of a fantasy strategy game, turned to the right, framed by gold ornament. Preserve its exact design: the character, the pose, the gold ornament. Redraw it at high resolution with crisp engraved detail in matte painted antique gold with fine engraved detail, deep vitreous emerald-green enamel, light from the upper left, soft deep teal shadows, crisp edges, and fix these defects: the face is clean and symmetric in construction; hands and ornament are clean, with no melted details; also the left and right halves are mirror images of each other, repeated elements (gems, studs, engraving) are identical, every rim is a clean curve with no wobble, no fused or melted ornaments, no letter-like marks. Keep everything else unchanged. Nothing else in frame: no message plaque. Flat uniform dark navy background (#0a1622), front orthographic view, centred, tall vertical 3:4 image. No text, no letters, no numbers, no watermark, no purple, no brown.
```

## VO-02 · Voce: medaglione con quadrante
- **Sorgente:** busts-voce · medaglione sotto il busto
- **Allegato per B:** `gen-inputs/VO-02.png`
- **Formato:** 1:1 quadrato
- **Note:** L'ago è un livello separato (animato).

**Prompt A (da descrizione):**
```
Generate an image: one isolated game-UI asset on a perfectly flat uniform dark navy background (#0a1622), nothing else in frame. A round medallion for a fantasy HUD: a gold ring around an emerald-enamel dial with an eight-point gold compass star and small gold tick marks, a faceted emerald at the centre. Nothing else in frame; no needle, no letters. Matte painted antique gold with fine engraved detail, deep vitreous emerald-green enamel, light from the upper left, soft deep teal shadows, crisp edges. Front orthographic view, centred, square 1:1 image. No text, no letters, no numbers, no watermark, no purple, no brown.
```
**Prompt B (modifica del mockup):**
```
Generate an image: Image 1 is the approved design of a round medallion for a fantasy HUD: a gold ring around an emerald-enamel dial with an eight-point gold compass star and small gold tick marks, a faceted emerald at the centre. Preserve its exact design: the dial, the compass star, the gold ring, the central emerald. Redraw it at high resolution with crisp engraved detail in matte painted antique gold with fine engraved detail, deep vitreous emerald-green enamel, light from the upper left, soft deep teal shadows, crisp edges, and fix these defects: the ticks are evenly spaced; the star is centred; the ring is a perfect circle; also the left and right halves are mirror images of each other, repeated elements (gems, studs, engraving) are identical, every rim is a clean curve with no wobble, no fused or melted ornaments, no letter-like marks. Keep everything else unchanged. Nothing else in frame; no needle, no letters. Flat uniform dark navy background (#0a1622), front orthographic view, centred, square 1:1 image. No text, no letters, no numbers, no watermark, no purple, no brown.
```

## VO-03 · Voce: placca del messaggio
- **Sorgente:** busts-voce · placca a destra del busto
- **Allegato per B:** `gen-inputs/VO-03.png`
- **Formato:** 16:9 largo
- **Note:** Il testo è contenuto in codice.

**Prompt A (da descrizione):**
```
Generate an image: one isolated game-UI asset on a perfectly flat uniform dark navy background (#0a1622), nothing else in frame. A horizontal message plaque for a fantasy HUD: a dark emerald-enamel field in an ornate gold frame with small ornaments at the corners and a pointed finial at the right end. The field is empty: no text. Matte painted antique gold with fine engraved detail, deep vitreous emerald-green enamel, light from the upper left, soft deep teal shadows, crisp edges. Front orthographic view, centred, wide 16:9 image. No text, no letters, no numbers, no watermark, no purple, no brown.
```
**Prompt B (modifica del mockup):**
```
Generate an image: Image 1 is the approved design of a horizontal message plaque for a fantasy HUD: a dark emerald-enamel field in an ornate gold frame with small ornaments at the corners and a pointed finial at the right end. Preserve its exact design: the frame, the corner ornaments, the finial. Redraw it at high resolution with crisp engraved detail in matte painted antique gold with fine engraved detail, deep vitreous emerald-green enamel, light from the upper left, soft deep teal shadows, crisp edges, and fix these defects: the rails are parallel; the corner ornaments are identical; also the left and right halves are mirror images of each other, repeated elements (gems, studs, engraving) are identical, every rim is a clean curve with no wobble, no fused or melted ornaments, no letter-like marks. Keep everything else unchanged. The field is empty: no text. Flat uniform dark navy background (#0a1622), front orthographic view, centred, wide 16:9 image. No text, no letters, no numbers, no watermark, no purple, no brown.
```

## GM-01 · Gemme di stato: accesa e spenta
- **Sorgente:** nessun mockup (solo modalità A)
- **Allegato per B:** `gen-inputs/GM-01.png`
- **Formato:** 3:2
- **Note:** Allegare, se vuoi, il file kit/approved/K4 (castoni già generati) come riferimento di materiale.

**Prompt A (da descrizione):**
```
Generate an image: one isolated game-UI asset on a perfectly flat uniform dark navy background (#0a1622), nothing else in frame. Six small faceted emerald gems in thin gold bezels in a clean grid of three columns and two rows with wide empty space between them: round, teardrop and diamond cuts; the top row lit with a bright inner glow, the bottom row the same gems unlit, dull and cloudy. Nothing else in frame. Matte painted antique gold with fine engraved detail, deep vitreous emerald-green enamel, light from the upper left, soft deep teal shadows, crisp edges. Front orthographic view, centred, landscape 3:2 image. No text, no letters, no numbers, no watermark, no purple, no brown.
```
**Prompt B (modifica del mockup):**
```
(nessuna modalità B: non c'è un mockup da cui partire)
```

---

## Modello di riga per `trials.md`
```
| Prova | Elemento | Modalità | Allegati | Chat | Fedeltà | Simmetria | Difetti corretti | Nitidezza | Materiale | Pulizia | Note |
| T-001 | RO-01 | B | RO-01 | (url) | 2 | 1 | 2 | 3 | 2 | 3 | anello ok, gemme diverse |
```
Voti: 0 = fallito, 1 = scarso, 2 = accettabile, 3 = livello da gioco. *Fedeltà* = stesso disegno del mockup; *Pulizia* = niente testo, glifi, elementi in più.
