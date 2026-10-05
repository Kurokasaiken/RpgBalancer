# Fix: ring clip in alto a sinistra

No separate plan needed (fix semplice e localizzato).

1. Portare la viewBox dello `.astro-bezel` da `-60 -60 1120 1120` a `-100 -100 1200 1200` per dare più spazio.
2. Aggiungere `overflow:visible` a `.astro-bezel` per permettere al ring spesso di disegnare fuori dal bounding box.
3. Allargare `.astro-bezel` con `inset:-80px` per evitare che il bordo del ring venga tagliato dal container.
4. Verificare con Puppeteer screenshot.
5. Passare `build:check`.
