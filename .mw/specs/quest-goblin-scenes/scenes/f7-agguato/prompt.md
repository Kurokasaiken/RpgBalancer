# F7 — L'agguato (`gob-agguato`, `gob-agguato-scelta`) → `agguato.png` — BRIEF v2

Nodi: `gob-agguato` (harm), `gob-agguato-scelta` (choice trofeo/sangue).
Beat: l'istante dello scatto — archi tesi nella treeline, la prima freccia
in volo non ancora arrivata. Il palo è ancora pulito. Persone: nessuna.
Goblin: sagome mezze nascoste da scheda `creatures/goblin` v0.1.0.

> ⚠ **v2 (2026-10-24):** bake fallito su v1 — il palo isolato era l'unico
> near della depth map (R-213 confermato da bake reale). Rigenerazione con
> archetipo SHOULDER + contratto PLAN-052 v3 (amendment archetypes).

## Correlazione (archetype × shot × ambient)

- **Archetipo: SHOULDER** — dirty foreground / repoussoir singolo
  (cinema: Ipcress). La trappola si vede DA copertura: una massa near
  occupa ~35% di un angolo basso, il resto è la strada aperta e la
  treeline viva. È l'archetipo dell'osservatore esposto — il POV "siamo
  noi che stiamo per passare".
- **Shot grammar**: `enter-creep` (avvicinamento lento lungo la spalla —
  esige texture interna alla massa, altrimenti il creep non produce moto)
  → `pose-tense` → `idleDrift`. NON pan-lateral: perderebbe la spalla.
- **Ambient plan**: `dust` (strada assolata = il cono di polvere dipinto
  come bassa frequenza); `glint` sulle punte di freccia nella treeline
  (l'unico dettaglio "meccanico" che il runtime può far scintillare);
  `embers` NO (niente fuoco); `fog` NO (ruling OB-8: la nebbia non è
  di questa scena); `fireflies` NO (giorno pieno).
- **Kill list dedicata**: niente rami nudi/reticolati (smear), niente
  palo isolato = il near deve essere MASSA, niente nebbia dipinta.

## Contratto compositivo

- **Beat/focale**: la treeline che si tradisce — le sagome mezze nascoste
  sono il focale MID; la strada vuota è lo spazio negativo della tensione.
- **Staging**: near = massa radice/roccia muschiata angolo basso-sx
  (~35% frame, bordo pulito, gradini interni); mid = treeline con sagome
  + strada assolata; far = profondità bosco oltre la treeline.
- **Occluder**: UN solo bordo (sinistro+basso). Destro aperto = la via
  di fuga visiva e la vulnerabilità.
- **Calm zones**: fascia strada basso-centro per dust; la massa near
  come ancoraggio glint/falene se serve.
- **Cosa NON dipingere**: frecce in volo o conficcate (è outcome harm),
  party attaccato, volti/anatomie goblin, nebbia, shaft, polvere densa.

## Full prompt — generatori esterni (Gemini / Grok / GPT)

```text
AGGUATO — painted in heavy oil impasto. An ambush at its cocked instant, seen from behind cover — painted before a single arrow is loosed. SUBJECT: a quiet forest road openly sunlit, EMPTY — the attacked party is never drawn; at the treeline edge the wood betrays itself: half-hidden low goblin shapes crouched among roots and undergrowth, crude bows drawn, arrowheads catching stray light in scattered points of glint, ochre war-paint barely readable in the shade — a mass of hidden shapes, never a single readable face. NOTHING FLIES YET — the trap is loaded, not sprung. COMPOSITION: a broad mossy rock-and-root mass fills the lower-left corner and left edge, cropped by frame — the cover we hide behind — a single convex dark mass with a clean silhouette and visible inner depth steps (stacked stones, layered roots, moss strata — never a flat wall, never a thin post); the right two-thirds open onto the sunlit road curving past the treeline — the treeline a dense dark wall of undergrowth where the ambushers hide, stepping back in two clear depth planes; above the treeline a wedge of open sky, smooth low-frequency. NO symmetry — the mass leans asymmetric, the road bends off-axis. LIGHTING: the road blazing in hard midday sun, the near mass in deep saturated shadow — the ambushers read as saturated silhouettes and points of arrowhead glint against the lit road. PALETTE: amber sunlit road, deep teal treeline and mass shadow, Veronese undergrowth, ochre war-paint notes; NO grey, NO brown, NO mud. TECHNIQUE: thick oil impasto, broad palette-knife strokes in the Jaime Jones / Jeff Easley tradition, tactile matter on stone, root, moss and bark; Justin Gerard whimsy in the ambusher shapes — grotesque but vibrant, never horror; rude beauty — weathered and tactile, never squalid. MOOD: the held breath before shock — we are in the open and they are not. Luminous, high-chroma — never black murk. NO fog or mist painted, NO smoke, NO light shafts or god rays or visible beams, NO dense dust clouds — paint the sunlit air as soft wash only, NO embers or sparks, NO distinct cloud silhouettes, NO birds, NO people or humanoid figures other than the half-hidden ambushers, NO readable creature faces or anatomy, NO close-up goblins, NO arrows in flight or embedded, NO wounds, NO wire or cords, NO fences or structures, NO bare twig lattices against sky, NO text/UI/watermarks/frames, NO symmetry, NO grim, NO gore, NO blood, NO decay, NO flat digital, NO airbrushed smoothness, NO sci-fi. Ultra-wide cinematic 2.4:1.
```

**Tags riuso:** `shoulder-foreground, forest-road, sunlit, ambush, goblin-hidden, bows-drawn, trap-loaded, creep-served`

## Generation notes

- **Life plan (dipinto → runtime)**: massa near = plateau del warp;
  punte di freccia = anchor `glint` (misura sul raster, non a spanne);
  strada = zona calm per `dust`; treeline = campo statico (le sagome
  non si animano — il terrore è che sono ferme).
- **Shot**: `enter-creep` authored — se il bake della massa è gradiente
  (non plateau), il creep non legge: rigenerare con massa più convessa.
- **Scorecard**: veto su palo/massa sottile (il fallimento v1); la
  treeline deve leggersi "viva" senza volti — se il generatore mette
  occhi/denti leggibili, rigenerare.
- Aspect 2.4:1 — contratto theatre (`theaterAspect`, gate
  `npm run check:quest-art`); recode target 3168×1320; safe window 2.05:
  la treeline e la massa stanno dentro, il cielo può uscire.

## Interaction hooks (v2, PLAN-084)

- **A1 discovery bonus**: hotspot sulle sagome nella treeline —
  `revealedAmbush` → il check/choice seguente entra con vantaggio.
- **A4 wrong-spot cost** (candidato): cliccare la strada vuota o un
  volatile posato → reazione ambientale (uccello che si alza) che
  allerta un battito — da ruling Director se tenerla.
- Il prompt dipinge le sagome leggibili-ma-camuffate: contorni
  distinguibili a mezza occhiata, mai invisibili del tutto.
