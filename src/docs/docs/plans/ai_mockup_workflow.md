# AI Mockup → Component/Asset Protocol

**Status:** active pilot — IP-Adapter funzionante, paintover consentito, **canon hard gate** aggiunto  
**Desiderata FROZEN:** `.mw/desiderata.md` v6  
**Pilot component:** `GoblinEventLabPage` (`/goblin-event-lab`)  
**Date:** 2026-08-14

---

## 0. Canon hard gate (NO-GENERATION without spec)

No AI image is generated for a new asset or mockup until the canonical spec exists in a `--spec-dir`:

```
<spec-dir>/
  design-intent.md   # why it exists, what it teaches, pillar/preset
  identity.md        # silhouette, materials, colors, kill list, no list
  prompt.md          # prompt built from art bible and prompt library
```

For UI components, `identity.md` can be `asset-identity.md` with the same fields.

**Enforcement:** `python scripts/rpg-gen-mockup.py --spec-dir <dir> --enforce-canon`.  
Without the spec, the script exits with an error. Without `--enforce-canon`, it warns but runs (legacy/escape hatch).

**Rationale:** a bad prompt produces a bad mockup; a bad mockup cannot be decomposed. This gate prevents wasted generation and wasted component work.

## 0.1 Where to build the spec

1. Read `src/docs/docs/plans/art_direction_plan.md`.
2. Read `src/docs/docs/prompts/prompt_library.md`.
3. If the asset is a creature, read the relevant `family-dna.md` and create `design-intent.md` + `identity.md` under `src/docs/docs/art-direction/creatures/creatures/<name>/`.
4. If the asset is UI, create `src/docs/docs/art-direction/ui/<name>/` or `.mw/specs/<name>/`.
5. The `prompt.md` is derived from the above; no hand-written generic prompt.

---

## Hypothesis (v6)

Per qualsiasi componente UI o World Surface: si parte da CSS/React al massimo possibile. Quando il Director non è soddisfatto, si passa a mockup (generato o esterno), lo si condiziona con IP-Adapter, lo si scompone in CSS/texture, e si fa paintover solo sulle aree che non sono riproducibili in React. Il pilot su `GoblinEventLabPage` dimostra che IP-Adapter su MPS produce un asset fedele al mockup in ~3 min, e paintover può pulire testo/sigilli se necessario.

---

## Tooling registrato

| Tool | Stato | Quando si usa |
|---|---|---|
| `stabilityai/stable-diffusion-xl-base-1.0` | Cache locale 6.6 GB, MPS verificato | Generatore primario per mockup e asset |
| txt2img | Funzionante | Mockup ex novo, esplorazione |
| IP-Adapter (`ip-adapter_sdxl.safetensors` + `laion/CLIP-ViT-H-14`) | ✅ Funzionante su MPS (~2,5 GB) | Rispettare composizione/style di mockup esterno |
| `ip-adapter-plus_sdxl_vit-h` | ❌ Mismatch 1664 vs 1280 | Non usare con diffusers 0.39/MPS |
| img2img | Non testato | Alternativa a IP-Adapter |
| FLUX.1 [schnell] | Ammesso per licenza, escluso per spazio | Non utilizzabile nell'hardware corrente |
| Paintover | Consentito | Pulire dettagli non riproducibili in CSS |

---

## Unresolved v5 — risoluzione con evidenza

| # | Domanda | Risposta finché non si smentisce |
|---|---|---|
| 1 | Quale generatore? | **SDXL 1.0 base**. IP-Adapter funzionante, registrato come conditioning. FLUX escluso. |
| 2 | Componente React o solo asset? | **CSS/React-first**; si produce il componente quando la scomposizione ha < 3 regioni semantiche. Altrimenti asset + decomposizione. |
| 3 | One-shot vs iterativo, chi valuta? | **One-shot per componenti semplici**; **iterativo con budget stretto** altrimenti. Gate automatici (silhouette, layout, palette) a carico dell'agente; gate estetico a carico del Director; paintover come strumento di correzione. |

---

## T0 — Risultato test white/black (MPS, 768×768, 20 step)

| Metrica | Valore | Nota |
|---|---|---|
| Tempo totale | 289.9 s | white 143.9 s, black 131.2 s |
| `% confident` | 11.71% | Soglia target > 95% — **fallito** |
| `% edge` | 88.29% | Quasi tutto bordo semi-trasparente |
| Conclusione | | SDXL base condiziona il colore dell'oggetto sullo sfondo. **Non usare white/black per alpha.** |

---

## T1 — IP-Adapter su MPS

| Configurazione | Risultato | Nota |
|---|---|---|
| `ip-adapter_sdxl.safetensors` + `laion/CLIP-ViT-H-14` | ✅ | 768×768/25 step in 166,8 s, fedele al mockup |
| `ip-adapter-plus_sdxl_vit-h` | ❌ | `RuntimeError: linear() shapes (257x1664 and 1280x1280)` |

**Asset pilota:** `public/mockups/goblin-totem-pilot/goblin-totem-ipadapter-20260816-20260814-225603.png`  
**Problema:** testo cotto (gibberish) preservato dal mockup.

---

## V6 — workflow operativo

1. **CSS/React-first** — massimizzare primitive, skin tokens, i18n, config.
2. **Soddisfatto?** Se sì, stop.
3. **Mockup** — generare txt2img/IP-Adapter o usare mockup esterno.
4. **Prompt dalla Bibbia** — `art_direction_plan.md` + `prompt_library.md` prima di generare.
5. **Conditioning** — mockup esterno entra come input IP-Adapter/img2img.
6. **Scomposizione** — ogni regione: `TOKEN` / `CSS_PROCEDURAL` / `SVG_INLINE` / `TEXTURE` / `PRIMITIVE` / `PAINTOVER`.
7. **Paintover** — pulire testo/sigilli/rumore sull'asset generato.
8. **Integrazione** — componente React, build:check, art gate.

---

## Budget stretto

| Fase | Tempo max | Iterazioni max | Azione se si supera |
|---|---|---|---|
| Test tecnico | 30 min | 1 test | Documentare fallimento e passare a alternativa. |
| Generazione asset | 30 min | 2 | Coniugare miglior asset con CSS/paintover. |
| Paintover | 20 min | 1 passata | Se non basta, asset non è convertibile; archiviare. |
| Iterazioni estetiche | Nessun limite numerico | Nessun limite | Loggare rischio loop aperto; decisione 8 v5. |

---

## Passi attivi

1. **T0 white/black** ✅ fallito.
2. **T1 IP-Adapter** ✅ funzionante.
3. **T2 paintover** — pulire testo/sigilli dal pannello IP-Adapter, se il Director approva.
4. **T3 integrazione** — usare l'asset pulito in `GoblinEventLabPage` (V15).
5. **T4 verifica** — `npm run build:check` e art gate umano.

---

## Fallback

Se IP-Adapter + paintover non producono un asset accettabile entro i budget, il componente viene ridisegnato in CSS/React semplificato, oppure l'asset diventa un `assetSlot` con tracciabilità della provenance.
