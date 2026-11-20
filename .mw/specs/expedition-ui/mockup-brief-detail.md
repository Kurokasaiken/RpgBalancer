# Detail del cassetto — brief di composizione (PLAN-125 §9 #1)

**Metodo:** mockup composto in DOM su token reali (`public/mockups/detail-lab/`,
stesso canale di `eventi-lab` e `scroll-band-lab` — harness HTML/CSS su
`skinScope.css`, `spike: remove`). Pezzi da golden registrati e slicekit
battezzati (REGISTERED.md). Nessuna generazione AI.

**Ruling di modello (dibattito web 2026-11-20, converged 4/4):**
`.mw/runs/20261120-detail-cassetto-debate/` (mind-weaver) →
`artifact-r002.md` sha `44ea7aab…`. Il dibattito ha risolto il conflitto
«flottante a sinistra» (ruling 17/11) vs «chiude/sostituisce» (spec) in
favore di **C + instrument strip**.

## Modello — «column swap + instrument strip»

1. **Swap di colonna:** il `›`/gesto su un blocco del cassetto trasforma la
   colonna (~512px, docked flush-right) nel Detail di quel blocco. Zero
   territorio mappa permanente; la mappa resta live.
2. **Instrument strip** persistente in cima a OGNI detail: %
   win/wound/death/wipe compatte **con delta flash** (variazione vs
   pre-edit, es. «wipe +2%») + 4 puntini sedi (piene/vuote) + giorni
   totali. È lo STESSO blocco telemetria del RISK del summary, rilocato in
   testa al detail — un componente, niente split-brain. Click sulla strip
   → salto al RISK detail.
3. **Navigazione:** barra `‹ Back to Expedition` persistente sopra la
   strip; Esc/X = stesso gesto; `›` di un'altra sezione re-targetta la
   colonna; click sulla sezione aperta = toggle back; spazio vuoto inerte;
   nessun auto-dismiss su click mappa.
4. **LAUNCH CTA solo nel summary** (argomento sostenuto: azione
   persistente con contesto non sempre appropriato); la readiness la
   porta la strip (puntini sedi + readiness).
5. **Hero sheet = hand-off** alla superficie flottante esistente (classe
   diversa, coesiste, stessa entry del Roster). Le righe membro portano
   l'affordance «inspect».
6. **Mobile ≤1100px:** il modello degrada nativamente a bottom-sheet swap
   (gemini).

## Mappa sezione → detail

| Blocco cassetto | Detail |
|---|---|
| `quest-banner` | vignetta ingrandita + briefing completo + sigilli Danger/Reward/Duration |
| `party-slots` | 4 righe membro (ritratto, ruolo, wound%/death%) + lista candidati + add/remove; riga → hero sheet |
| `bag-slots` | pozzetti bag + picker stash «porta con te» + costo cibo |
| `journey-strip` | 3 gambe + giorni + fattore durata da loadout + intel authored |
| `risk-rewards` | **forecast completo** — aggregati + per-member + key-stat prim/second con coverage ✓ + intel |
| `launch-cta` | nessun detail |

## Forecast (unanimo nel dibattito)

- **Summary:** % compatte dentro il blocco `risk-rewards` — oggi il
  cassetto mostra già `% riuscita` e `% morte` (R-357 2h); mancano
  wound/wipe. Il mockup mostra il blocco con le 4 % compatte.
- **Ogni detail:** la instrument strip (aggregati + delta + sedi + giorni).
- **RISK detail:** il breakdown completo — è qui che vive il «perché è
  salito il wipe%».

## Residual dichiarato

Il «perché» cross-sezione oltre la strip richiede `‹` → RISK detail
(accettato: costo occasionale vs costo mappa permanente).

## Sorgenti golden / asset (provenance)

| Parte | Asset | Stato |
|---|---|---|
| Colonna summary | `public/assets/ui/hud-real/cassetto/column-1440.webp` (colonna estratta dal golden) | golden |
| Cornice pannello | `public/assets/ui/hud-real/slicekit/panel-frame5/` (corner+edge webp) | battezzata |
| Vignetta quest | `public/assets/ui/hud-real/cassetto3/vignette.webp` | golden R-357 |
| Ritratti membri | `public/assets/ui/hud-real/bust/bust.webp` + `crest/crest.webp` | kit |
| Ghiera slot | `public/assets/ui/hud-real/ghiera-draghi.webp` | battezzata R-333 |
| Icone | `cassetto3/skull.webp`, `supply-bag.webp`, `chest.webp` | golden R-357 |
| CTA plaque | `cassetto3/cta-plaque.webp` | golden R-357 |
| Lacquer/tokens | `skinScope.css` `--skin-hud-lacquer-*`, `--skin-font-*` | kit |

## Cosa il mockup NON copre

Wiring (`›` sui blocchi, swap), stato reale sessione, bottom-sheet
≤1100px, animazioni di transizione. Solo composizione e grammatica.
