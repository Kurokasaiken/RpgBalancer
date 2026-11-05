# PLAN-109: HUD Zanara, generazione del kit completo (K2–K17)

**Status:** **CHIUSO, FALLITO** (Director, 2026-11-02). Sostituito da `PLAN-110-hud-mockup-to-real-components.md` (§12) e `PLAN-111-hud-generation-trials.md`. Il lanciatore `kit-gen-all` è stato fermato.
**Parent:** PLAN-107, R-303. Ruling aggiunti: `zanara-Z9` (busti), `Z10` (roster a colonna), `Z11` (Voce). **Regole:** `.mw/specs/hud-zanara/LINGUAGGIO-v1.md` (approvato) + ruling `zanara-Z1…Z8` in `.mw/ui-catalog/ART-DIRECTION.md`.
**Esecutori:** agenti del Director (generazione e verifica). **Decide:** il Director, a vista, sui fogli di confronto.

## Obiettivo
Generare **tutti** i pezzi del kit in 4 varianti ciascuno, scontornarli e misurarli, e consegnare un foglio di confronto per pezzo e un report unico. Il Director poi sceglie le varianti in una sola seduta.

Questo piano **non** comprende: la scelta delle varianti, il montaggio, il codice React, le sagome di stato incise (sono SVG, si fanno a parte).

## Invarianti (non negoziabili)
1. **I mockup non si allegano mai.** Gli unici allegati ammessi sono quelli elencati nella tabella (anelli K1 approvati e il ritaglio del sole per K5).
2. **I prompt si usano alla lettera** dai file in `.mw/specs/hud-zanara/kit/prompts/`. Niente parafrasi, niente aggiunte (T-26). Se un prompt sembra sbagliato, l'agente si ferma e lo segnala; non lo corregge da solo.
3. **Gemini sempre in background:** CDP :9222, `Target.createTarget {background:true}`, mai una finestra in primo piano. Una chat nuova per ogni variante.
4. **Contare le immagini prima e dopo l'invio** e catturare all'indice nuovo, come fa già `scripts/gen-mappa2-sprite.mjs` (T-25). Se il conteggio non sale, è un fallimento, non un'immagine.
5. **Nulla va in `kit/approved/`:** lì scrive solo il Director.
6. **Formato:** Gemini può restituire 16:9 anche quando si chiede 1:1. Va bene se il pezzo è intero e non tagliato dal bordo.

## Allegati
- `R` = `.mw/specs/hud-zanara/kit/approved/K1-ring-ritratto-raw.png` (F3a, ex v2): materiale dei pezzi del roster e delle lastre.
- `I` = `.mw/specs/hud-zanara/kit/approved/K1-ring-insegna-raw.png` (F3b, ex v4): materiale di insegne, sigilli e quadranti.
- `S` = `.mw/specs/hud-zanara/kit/refs/emblem-subject-sun.png`: solo il soggetto dell'emblema.

## Pezzi

| ID | Pezzo | Prompt | Allegati | Tipo per la verifica | Controlli specifici |
|---|---|---|---|---|---|
| K2 | Placca del nome (3 fette) | `K2-plaque.txt` | R | `plaque` | fetta centrale uniforme; punta con 1 gemma |
| K3 | Banda verticale ripetibile | `K3-band.txt` | R | `vtile` | un solo nodo; bordo alto = bordo basso |
| K4 | Castoni 3 forme × acceso/spento | `K4-gems.txt` | R | `sheet` | 6 elementi, 3×2, stesse misure |
| K5 | Emblema del sole nascente | `K5-emblem.txt` | I, S (in quest'ordine) | `ring` (pieno) | niente rosa dei venti, ali o testo |
| K6 | Terminale della banda con pendente | `K6-band-end.txt` | R | `plaque` | larghezza della banda = K3 ±5% |
| K7 | Lastra a 9 fette (F1) | `K7-lastra-9slice.txt` | R | `plaque` | lati uniformi, ornamenti solo agli angoli |
| K8 | Cartiglio dell'evento | `K8-cartiglio.txt` | R | `plaque` | due giunti piatti ai capi |
| K9 | Giunto / nodo (F7) | `K9-giunto.txt` | R | `plaque` | — |
| K10 | Foglio d'alabastro a 9 fette (F2) | `K10-foglio-alabastro.txt` | R | `plaque` | dorso di smalto a sinistra; campo avorio uniforme |
| K11 | Campo di smalto, tile | `K11-smalto-tile.txt` | R | `tile` | ripetibile su entrambi gli assi |
| K12 | Campo d'alabastro, tile | `K12-alabastro-tile.txt` | nessuno | `tile` | ripetibile su entrambi gli assi |
| K13 | Sigillo del verdetto (F5) | `K13-sigillo.txt` | I | `ring` (pieno) | centro vuoto; niente numeri né teschi |
| K14a | Quadrante del medaglione della Voce (Z5, Z11) | `K14a-quadrante.txt` | I | `ring` (pieno) | niente ago né lettere |
| K14b | Ago del quadrante della Voce (animato) | `K14b-ago.txt` | I | `plaque` | verticale, perno al centro dell'immagine |
| K15 | Icone del mondo (7) | `K15-icone-mondo.txt` | nessuno | `sheet` | 7 elementi, 4+3, niente cerchi dietro |
| K16a | Busto, capo sinistro della barra alta (Z9) | `K16a-busto-sinistro.txt` | R | `plaque` | guarda a destra; niente foglie |
| K16b | Busto, capo destro della barra alta (Z9) | `K16b-busto-destro.txt` | R | `plaque` | guarda a sinistra; niente foglie |
| K17 | Narratore della Voce: l'Amanuense (Z11) | `K17-voce-amanuense.txt` | R | `plaque` | guarda a destra; niente cornice; bordo pulito sullo sfondo |

**Priorità** (se il tempo non basta):
1. K2–K6, il roster;
2. K7, K10, K11, K12, la base di tutti i componenti;
3. K8, K9, K13;
4. K16a, K16b, K17, K14a, K14b (busti e Voce);
5. K15.

## Task

### T-0: estendere `scripts/kit-piece-verify.mjs` (prima di generare)
Oggi il ritaglio è quadrato sul pezzo e la regione blu notte al centro viene sempre resa trasparente: va bene solo per gli anelli. Aggiungere `--kind ring|ring-full|plaque|vtile|tile|sheet`:
- `ring`: comportamento attuale (foro trasparente).
- `ring-full`: come `ring` ma senza foro (emblema, sigillo, quadrante).
- `plaque`: flood-fill dai bordi, nessun foro, ritaglio al riquadro del pezzo con margine del 4%. Nel foglio, anteprima grande più anteprima all'altezza reale (sotto).
- `vtile`: come `plaque`, più una misura di cucitura (differenza media tra la riga in alto e quella in basso del periodo) e un'anteprima con 3 ripetizioni impilate.
- `tile`: nessuno scontorno. Misura di cucitura sui due assi e anteprima 3×3.
- `sheet`: flood-fill dai bordi, poi componenti connesse sopra una soglia d'area. Riporta il conteggio e ritaglia ogni elemento in un file a parte (`<label>-item-<n>.png`).

Metriche comuni da tenere: tonalità delle creste d'oro (mediana, % in 35–45°, % oltre 50°), frazione di viola. Da aggiungere: frazione di marrone, cioè pixel con tonalità 15–35°, saturazione < 0,55 e luminosità < 0,45, fuori dai bordi d'oro.

Altezze reali di anteprima nello spazio 1600×900: K2 44 px, K3 62 px di periodo, K6 60 px, K7 78 px, K8 88 px, K9 30 px, K10 300 px, K13 110 px, K14a 64 px, K14b 50 px, K16a/K16b 96 px, K17 150 px, K4 e K15 24 px a elemento.

Test: rieseguire su `kit/gen/K1/v*/ring-0.png` con `--kind ring` e verificare che i numeri restino identici a `K1-compare.json`.

### T-1: generazione
Per ogni pezzo, 4 varianti; ogni variante in una chat nuova:
```
node scripts/gen-mappa2-sprite.mjs --ref <allegati…> --prompt .mw/specs/hud-zanara/kit/prompts/<file> --out .mw/specs/hud-zanara/kit/gen/<ID>/v<n>/img
```
Uscita: `kit/gen/<ID>/v{1..4}/img-0.png`, più il log della chat (URL) in `kit/gen/<ID>/chats.txt`.

### T-2: verifica e foglio
```
node scripts/kit-piece-verify.mjs --kind <tipo> --sheet kit/gen/<ID>/<ID>-compare.png --alpha-dir kit/gen/<ID> --labels v1,v2,v3,v4 kit/gen/<ID>/v*/img-0.png
```
**Scarto automatico** di una variante. Va rigenerata, con al massimo 2 tentativi in più per variante e sempre in una chat nuova, se:
- contiene testo, lettere o numeri;
- contiene foglie o edera (escluso l'alloro di K13);
- la frazione di viola è > 0,5%;
- la frazione di marrone è > 3%;
- il pezzo è tagliato dal bordo;
- il numero di elementi è sbagliato (K4: 6, K15: 7);
- lo scontorno buca lo smalto interno (i "verdi cancellati");
- la cucitura di K3, K11 o K12 è > 6 livelli di differenza media.

Ogni scarto va registrato con il tipo di fallimento (GENERATION / EXTRACTION) e il motivo.

Le varianti che passano ma hanno l'oro oltre i 50° per più del 20% **non** vanno scartate: si segnalano nel report. Decide il Director.

### T-3: report
`.mw/specs/hud-zanara/kit/gen/REPORT.md` contiene:
- per ogni pezzo: il link al foglio di confronto, una tabella per variante con le metriche e le note (cosa la distingue, in una riga), i tentativi scartati e il loro motivo;
- un foglio unico `kit/gen/ALL-compare.png` con tutti i pezzi, una riga per pezzo, per scegliere in una seduta;
- l'aggiornamento di R-303 in `RICHIESTE.md` con l'avanzamento.

## Contratto di chiusura
- Ogni pezzo ha 4 varianti che passano lo scarto automatico. Se un pezzo resta sotto 4 dopo i tentativi, il report lo dichiara.
- `kit-piece-verify.mjs` estesa e verificata contro i numeri di K1.
- `REPORT.md` e `ALL-compare.png` presenti, nessun file in `kit/approved/` modificato.
- Nessuna finestra aperta in primo piano.

## Dopo (non in questo piano)
1. Il Director sceglie le varianti, che vanno in `kit/approved/`.
2. Montaggio a fette e `ZanaraRoster` come primo componente reale (anchor-first). Poi gli altri componenti dalle famiglie, verificati su `/hud-target`.

---

## Chiusura (2026-11-02)

**Esito:** fallito. Il kit generico di pezzi isolati (K2–K17) ha dato componenti poveri: campi verdi piatti con un filo d'oro, lontani dai mockup scelti. Il Director lo ha giudicato «fallimento totale, povertà».

**Cosa è stato prodotto**
- Generati e verificati: K2–K12 in 4 varianti (K9 in 2), con fogli di confronto in `.mw/specs/hud-zanara/kit/gen/`. Le varianti scelte sono in `kit/approved/`.
- **Mai generati:** K13–K17 (sigillo, quadrante, ago, busti, Amanuense) e K9 v3/v4: la quota di Gemini si era esaurita. Restano solo i file di errore (`img-NORESULT.png`, `img-ATTACHFAIL.png`).
- Costruiti sopra il kit: `ZanaraRoster`, `ZanaraResources`, `ZanaraTooltip`, visibili in `/hud-compose`. Sono prototipi, non componenti di produzione.

**Perché è fallito**
1. Ogni pezzo era generato **isolato e generico**, senza il disegno del mockup come base: la composizione risultava diversa dal concept.
2. Un prompt per pezzo intero: pochi pixel per ornamento, dettaglio medio.
3. Nessuna lista di difetti e nessun «cambia solo questo».
4. Lo scarto automatico non è stato applicato dagli agenti: varianti oltre soglia (marrone, cuciture) sono arrivate al Director.
5. Le regole che avevo proposto (scala ridotta, ornamento solo ai giunti, niente foglie, oro opaco) toglievano ricchezza ai mockup.
6. Quota esaurita a metà, kit incompleto.

**Cosa si tiene**
- Gli anelli K1 (Ritratto e Insegna) come **riferimento di materiale**.
- Gli script `scripts/kit-piece-verify.mjs`, `scripts/build-zanara-kit.py` e il vocabolario dei materiali dei prompt K1.
- Le lezioni: ruling `zanara-Z1…Z11` da rivedere, tracce in `PLAN-110` §2bis.

**Cosa non si fa più:** non si rilancia nessuna generazione di questo piano. I file generati restano dove sono; non sono stati cancellati.
