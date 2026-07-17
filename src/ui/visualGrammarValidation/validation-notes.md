# Visual Grammar Validation Spike — notes

**Domanda dello spike:** "Se domani creo una NUOVA schermata dello stesso genere di
una già bella, riesco a ottenere lo stesso linguaggio visivo senza copiarla?"

Route: `/visual-grammar-validation` · nessun refactor, nessuna astrazione (no
SurfacePreset / tier / registry). Solo primitivi esistenti.

## Golden reference (immutabile)
`ReferenceQuestDetail.tsx` — ricetta estratta VERBATIM da
`src/pages/v9-skin-sandbox.tsx`, tab "Layout Primitives" (la slice della
screenshot di reference: header composto + Field Group + Requisiti + Registro).

Ricetta (`recipe.ts`, condivisa perché È la grammatica, non il contenuto):
- `WanderlustSurface shape="panel" material="bronze"` + `materialLayer` reference
- interno avvolto in `WanderlustAmbientField` con `background: var(--skin-surface-bg)` (obsidian well)
- primitivi: header skin (`skin-plaque`/`skin-title-row`/`skin-titlesep`),
  `WanderlustDivider`, `WanderlustSectionHeader`, `WanderlustFieldGroup`,
  `WanderlustRequirementList`, `WanderlustRecordList`
- ambiente globale: `--skin-*` (`applySkinCssVariables('base')`), `skinScope.css`,
  `WanderlustSurfaceDefs` — tutti montati in `main.tsx`

## Rebuild (dalla grammatica, non copia)
`RebuiltQuestDetail.tsx` — stessi primitivi + stessa ricetta, contenuto diverso:
plaque "Spedizione", titolo "Valle Dimenticata", valori diversi, **4 requisiti
invece di 3** (prova che non è hardcoded), eventi diversi. NON importa il
componente reference.

Protocollo **blind**: il Rebuild è costruito dalla ricetta, non copiando i pixel.
Se combacia senza ritocchi manuali → la grammatica è autosufficiente. Se serve
ritoccare a mano per farlo combaciare → è un *finding*: la grammatica va corretta lì.

## Gate di accettazione

1. **Umano (principale).** «Sembrano due schermate dello stesso gioco?»
   - ✅ Sì → passa
   - ⚠️ Quasi → correggere la grammatica
   - ❌ No → spike fallito, si torna indietro

2. **Delta E (palette/material, supporto).** Su frame-oro, fill-superficie, colore-titolo:
   - < 3 = eccellente · 3–5 = accettabile · > 5 = probabilmente materiale diverso

3. **Chrome diff (supporto).** Confronto solo della *material region* (frame +
   background + superfici), con la *content region* mascherata (testo/dati
   volutamente diversi). La material region deve essere molto vicina.

4. **Blind naming test.** Tre screenshot senza etichetta: A (reference), B (rebuild),
   C (una schermata attuale a caso del progetto). Domanda: "quali due appartengono
   allo stesso gioco?"
   - A+B → la grammatica funziona
   - A+C → c'è ancora incoerenza nel progetto

## Regola permanente (da mettere nel documento)
> Nessuna architettura visiva è accettata finché non ricrea un componente di
> reference esistente ad alta qualità, con contenuto diverso, giudicato da un
> umano come appartenente allo stesso gioco — prima che venga scritta qualsiasi
> astrazione (preset/tier/registry).

## Finding emerso dallo spike (blind protocol)
`WanderlustSurface` di default renderizza il contenuto **dietro** il proprio
frame: `.ws-content` ha `z-index: 0`, `.ws-border-svg` ha `z-index: 1`
(`wanderlust-surface.css`). Il golden reference mostra il contenuto solo perché
il sandbox lo corregge localmente: `.ws-content { z-index: 2 }`
(`v9-skin-sandbox.tsx`, ~riga 1224). Ogni consumatore deve conoscere questo
override — è una dipendenza nascosta ed è ciò che ha fatto sembrare "vuoti" i
tentativi precedenti. **Nell'estrazione del sistema, il fix va nel componente**
(`.ws-content { z-index: 2 }` come default), non copiato in ogni pagina.

## Solo SE passa → estrazione del sistema
`WanderlustSurface → Visual Grammar (Material/Frame/Lighting/Texture/Motion) →
Surface Presets`. Non prima.
