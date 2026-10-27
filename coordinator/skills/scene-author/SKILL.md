---
name: scene-author
description: Autoria scene dipinte per quest/teatro — pipeline obbligatoria. Usa SEMPRE quando si genera o itera arte di scena (Gemini). Vieta presentare risultati senza gate.
---

# Scene Author — pipeline obbligatoria (NON negoziabile)

Il Director ha ripetutamente rilevato che il protocollo esiste ma viene saltato.
Questa skill rende ogni step **meccanico**. Ogni violazione = lavoro invalido.

## Pre-flight (bloccante)

1. `context/recurring-traps.md` — T-04 (mai claim senza testimone visivo)
2. Leggi la fiction del nodo (`goblin.ts` body/transit/verdict) — la scheda
   scena deriva SOLO da lì + tag spec coerenti. Niente oggetti inventati.
3. Scrivi la **scheda-scena** e aspetta ok Director: cosa vede il giocatore,
   elementi+perché, meccaniche, effetti, vietato, staging profondità,
   occludenti/reveal.
4. Scegli la **ref battezzata** (A15): `villaggio` (diurno/famiglia),
   `assalto-goblin` (azione/bosco), `drago`, `aqueduct` (Prismatic).
   Ogni generazione allega la ref — mai solo testo.

## Generazione

5. Prompt completo: soggetto (da fiction) → struttura (fg/mid/far) →
   contenuto (elementi-vita, oggetti) → FX → palette (gemme) → hygiene.
6. `python scripts/check-scene-prompt.py <prompt.txt>` DEVE dare PASS
   prima del submit (gemme ≥2, vita ≥2 con aggettivo colore, zone, FX,
   stile, chiome varie per boschi, niente termini vietati).
7. **Una chat Gemini per scena** — ogni edit nella SUA chat, con la
   versione corrente allegata come ref ancorata. Mai chat condivise.
8. **Edit ancorato > rigenerare**: se esiste una versione valida, si
   edita quella. Non rigenerare da zero salvo decisione esplicita.

## Gate post-generazione (bloccanti, in quest'ordine)

9. `python scripts/check-scene-art.py <img> [ref]` — numeri:
   murk<10, brown<8, vibr≥4, impasto-std≥~20, ≥3 famiglie nel cielo,
   coppia complementare in OGNI zona (o giustificazione motivata),
   profilo warm/green/cool vs ref (±10pt green, cool≥8 outdoor).
10. **Lettura visiva** contro la scheda E la bibbia — scrivere in
    risposta: soggetto ok? registro? campi quieti? gemme sparse (A19:
    >15% vibrante = carnival, FAIL)? oggetti tutti con perché?
    impasto visibile? cielo non piatto? nessun elemento inventato?
11. Se QUALUNQUE punto falla → NON presentare: itera nella stessa chat
    con edit ancorato, una mossa alla volta, finché tutto passa.

## Integrazione

12. Bake `scripts/bake-depth.py`, entry in `sceneManifest.ts`
    (depth/aspect/entrance/pose/focus/ambient/reveal), re-point
    `questArt.ts`, entry legacy in LIBRARY_ART per gli id vecchi.
13. `npm run test -- tests/unit/idleVillage/questCinematics/` verdi.
14. Cattura runtime nel lab (theater-lab?scene=<id>) = testimone T-04.
15. Aggiorna `context/research/.../iterazioni-quest-goblin.html`
    (giro più recente IN ALTO) + commit.

## Vietato assoluto

- Presentare candidati con fail noti o numeri mancanti
- Dire "tutti i gate passano" se non sono stati TUTTI eseguiti
- Inventare oggetti/creature non nella fiction/scheda
- Più di un'immagine per fase; l'immagine non cambia per scelta/check
- Rigenerare un'immagine battezzata quando basta un edit
- Layer magenta/parallasse-layer nel moodboard o nella bible

## Battesimo (FROZEN)

Nessuna immagine entra in NODE_ART, manifest runtime o produzione senza
approvazione esplicita del Director. Integrare un candidato non
battezzato = violazione grave. Il flusso corretto: gate → mostra →
Director decide → SOLO ALLORA bake+manifest+re-point+commit.

## Battesimo (FROZEN)

Nessuna immagine entra in NODE_ART, manifest runtime o produzione senza
approvazione esplicita del Director. Integrare un candidato non
battezzato = violazione grave. Il flusso corretto: gate → mostra →
Director decide → SOLO ALLORA bake+manifest+re-point+commit.

## Studio-context trap

Mai usare "painting", "matte", "present", "frame", "canvas" nei prompt:
Gemini tende a rendere l'immagine come foto-di-quadro (cornice,
cavalletto, tavolozza). Usa "same image", "the forest scene",
"edge to edge". Se la chat ha già prodotto studio-context, OGNI output
successivo lo eredita — conviene croppare e restare su quella base.
