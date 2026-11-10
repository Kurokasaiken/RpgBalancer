# MOCKUP → ASSET — la pipeline canonica dei port Zanara

Guida operativa per portare una superficie firmata (mockup approvato dal Director)
a componente reale in `/hud-compose` (e poi `/game`). Nata dagli errori del
2026-11-09: tre giri di "toppe" bocciati prima del metodo corretto.

## L'invariante violata (perché i primi giri erano sbagliati)

**Un mockup firmato NON è un asset.** È un concept: sfondo mappa cucito dentro,
testo inglese dipinto, widget finti dipinti (slot, gemme, cifre). Usarlo così com'è
come `<img>` + toppare le scritte con `<Cover>` opachi produce:

- halo beige/nuvola ai bordi (lo sfondo del mockup, non la mappa vera),
- rettangoli "sticker" che mangiano i bordi intagliati,
- residui di testo/widget dipinti che sbucano sotto le toppe,
- zone misurate a occhio → rack tagliati, titoli troncati.

L'asset corretto è quello di `panel/frame.webp` / `C1/emblem.webp`: **RGBA con
alpha vera scontornata al pixel** e **interni vuoti puliti** — il DOM vi monta
contenuto vero direttamente sullo smalto/pietra/vetro dipinto.

## La pipeline (6 passi, nessuno opzionale)

### 1. Identifica sorgente e approvazione
Il punto di partenza è il file firmato esatto (`cassetto-rich-0.png`,
`s08-reliquary-0.png`, `s09-levelup-0.png` …), non una rigenerazione libera.
Se serve un asset pulito di zona, la via preferita del progetto è un job di
generazione con il pattern di `prompt-panel-frame.txt`:
`"…keep the frame and ornaments, with ALL live content removed. Flat solid dark
navy background #0a1622 behind the element. No text, no letters, no interface
elements."` → poi `bra.cut()` (flood fill navy) in `build-*-assets.py`.

### 2. Scontorna la silhouette (alpha RGBA reale)
Quando il mockup ha lo sfondo cucito dentro (mappa sfocata), estrailo col
classificatore per materiale, MAI con un crop rettangolare + mask CSS:

```python
# ricetta usata per cassetto (scripts → da promuovere in build-cassetto-assets.py)
is_emerald = (H_deg 115..192) & (S > .26) & (G > R+8)
is_gold    = (H_deg 24..53) & (S > .42) & (V > .18) & near_sharp_grad
is_crevice = (V < .25) & (grad_smooth > 32) & near_sharp
fg = body | is_emerald | is_gold | is_crevice   # → connected component principale
alpha = feather 1px                             # NO maschera CSS dopo
```

Verifica: composite su sfondo teal — ogni ricciolo/forellino deve mostrare lo
sfondo attraverso, zero alone, zero rettangoli.

### 3. Svuota gli interni nell'ASSET (zero `<Cover>` nel DOM)
- Pozzi interni misurati via `connectedComponents` sul navy (`x=214..575` ecc. —
  mai a occhio).
- Sostituzioni pulite nell'asset: graft di pozzi vuoti da asset fratelli
  (es. `internals-v2-0.png` → vasca Party Slots già vuota, stessa cornicetta!),
  riempimento con gradiente smalto campionato, `cv2.inpaint` su testo/icone
  dipinte **preservando** bordi, medaglioni, teschio, forziere — tutto ciò che
  è stato firmato.
- La regola d'oro: il testo i18n vivo scrive su smalto vuoto, mai sopra testo
  dipinto.

### 4. Misura le zone CON LA GRIGLIA, mai a occhio
```python
# overlay con tacche ogni 100px su una copia del mockup → /tmp/grid-<nome>.png
for x in range(0, w, 100): cv2.line(...)
```
Leggi i bound delle zone a occhio sulla griglia e scrivili nella tabella `Z`.
Tutti gli errori di zona del 2026-11-09 venivano da misure a sentimento.

### 5. Monta DOM vivo nelle vasche misurate
- `aspectRatio: ART_W / ART_H` + `containerType: size` + font in `cqw`.
- Fit per la dimensione vincolante (fit-by-height per il drawer): tutto il pezzo
  firmato deve restare visibile, mai croppato.
- Componenti veri (`ResidentSlotRack`, stash tile, `lostReportModel`…) dentro
  le vasche; hit-button trasparenti sulle placche dipinte.
- Container host dimensionato sull'aspect reale dell'asset (il memoriale era
  montato 460×720 verticale su una galleria 694×334 orizzontale — errore da
  evitare misurando prima).

### 6. Verifica visiva sul confronto (T-04) — la parte che ho saltato
Cattura sulla **pagina/mappa vera** a scala reale e fai il confronto
**side-by-side con il mockup firmato**, non solo "il render esiste". Checklist:

- [ ] bordi netti o alone dove dovrebbe esserci trasparenza?
- [ ] testo dipinto che sbuca sotto le zone?
- [ ] widget/tagli del DOM fuori vasca (seat tagliati, righe che escono)?
- [ ] distorsione aspect (compresso/stirato)?
- [ ] **foto affiancata mockup vs render ispezionata a occhio** — non solo catturata

## Definition of done per un port visivo

- [ ] Sorgente = immagine firmata (o generazione pulita "#0a1622, no text")
- [ ] RGBA scontornato al pixel — niente rettangoli né fade CSS
- [ ] Zero `<Cover>` opache — testo dipinto rimosso **nell'asset**
- [ ] Zone misurate con griglia, non stimate
- [ ] Contenuto vivo = componenti/dati reali nei socket dipinti
- [ ] Side-by-side mockup vs render **ispezionato** (T-04) e dichiarato cosa NON è verificato
- [ ] Sonde funzionali ri-eseguite (interazioni invariate)
- [ ] Solo dopo: piani aggiornati e claim "allineato"

## Anti-pattern (tutti commessi, tutti bocciati)

1. Mockup grezzo come `<img>` + `mask-image` sfumata → alone visibile.
2. `<Cover>` smalto sopra testo dipinto → toppa sticker, sbordi.
3. Zone stimate → 2 seat su 4 visibili, CONFIRM fuori vista.
4. "Fit by width" su drawer più basso dell'arte → testa e piede tagliati.
5. Dichiarare "allineato" perché dati+interazioni sono veri, senza confronto
   visivo col firmato → la parte visiva era palesemente sotto.

## Posizione dei file

- Asset puliti: `public/assets/ui/hud-real/<surface>/frame.webp` (+ `-geometry.json` se serve)
- Script di estrazione: da promuovere in `scripts/hud-real/build-<surface>-assets.py`
  (oggi ricette inline: cut/inpaint sopra)
- Host live: `src/ui/idleVillage/hudReal/HudReal*.tsx` con `ART_W/ART_H` + tabella `Z`
- Sorgenti gen: `.mw/specs/hud-real/**` (`gen-jobs`, `runs.jsonl` storico)
