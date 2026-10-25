# Digest critiche — village-building-pins (round 1, 1/3 raccolto, scope parziale)

Provider: chatgpt, claude, deepseek — run `20261025-critique-village-building-pins`,
turn T-001 (+retry T-002 per chatgpt), prompt verbatim R-282, 3 shot
allegati (ctx-a, ctx-b, iso-0).

**Provider failure dichiarati:**
- chatgpt — 6ª image-perception failure del giorno: `ATTACH_FAILED` ×2
  (T-001 e retry T-002, ora fail-fast a ~18s). Quota upload free-tier
  esaurita (~11h dal probe delle 06:38Z). Vedi `chatgpt.md`.
- claude — quota messaggi free-tier fino alle 12:20. T-001: POSTED con
  `image_attached: 3` ma il composer quota-bloccato ha ingoiato il
  messaggio — `response_count: 0`, banner «esaurito … fino alle» nel DOM
  del failure bundle. Vedi `claude.md`.

**Misread parziale (deepseek):** risposta image-grounded sul **pin
singolo** del crop iso-0 (lumbermill), trattato come «il componente» —
nessun riferimento alla famiglia di 11 pin, agli stati
built/buildable/locked (`data-pin-state`), al badge romano/«+», al
roving-tabindex né al layer tooltip che è dove vivono le azioni.
Inoltre identifica il gioco come «Against the Storm» — quello è il
riferimento dei pillar, non il prodotto.

Convergenza = 1/1 raccolto, con scope parziale. Valido come critica
dell'**elemento pin**, non del sistema pin.

## Punti della critica (deepseek, sul pin element)

1. **Medaglione "buco nero".** «Il cerchio nero pieno con un bordo giallo
   sottile non suggerisce alcuna azione. Non c'è profondità, non c'è
   un'icona centrale, non c'è un'ombra» — converge con la critica claude
   a village-slot-overlay («medaglioni grandi sono ciechi… solo anello
   oro e numero») sui medaglioni dello stesso pin system.
2. **State design assente.** «Un pulsante deve avere stati chiari:
   Default, Hover, Pressed, Disabled… il bordo giallo è statico e non
   reagisce». Sul pin reale gli stati esistono (built/buildable/locked +
   data-active) ma sono fuori dal crop iso — comunque il singolo stato
   mostrato non si auto-spiega.
3. **Contrasto/integrazione.** Il nero pieno «non si integra con la
   palette organica e pittorica»; il bordo giallo «troppo sottile, si
   perde contro i dettagli del background».
4. **«God button» da mobile** — forma ok, ma manca il "vetro"/texture
   dell'HUD.

## Soluzioni proposte (deepseek)

- Icona centrale vettoriale; gradiente radiale + ombra esterna; bordi
  in stile "metallo battuto"; stati Default/Hover/Pressed/Disabled
  espliciti (scale 0.95, opacità 40%, grayscale su disabled).
- CSS completo `.action-button` 48px con `--ui-gold` e radial-gradient.
- Se menu radiale: ripensare (6-8 opzioni attorno a un centro).

## Note di grounding

- Fatti osservati corretti sul crop: medaglione nero ~pieno, anello oro
  sottile, nessun glifo centrale visibile (coerente col bug "glifo
  nero-su-nero" ipotizzato da claude su village-slot-overlay).
- Fatti fuori scope: stati multipli, badge livello, toolbar/arrow-key,
  tooltip pinnable con azioni S4/S5 — nessuno citato.
- **Attenzione al fork:** il verdetto «segnaposto scivolato in
  produzione» nasce dal crop di UN solo pin; non scalarlo a verdetto sul
  sistema pin senza un secondo provider grounded.

## Raccomandazione operativa

- Il punto «medaglione cieco» è ora confermato da 2 critiche
  indipendenti (deepseek qui + claude su village-slot-overlay) — forte
  candidato P0 trasversale per il pin system.
- Ripetere il round dopo il reset delle quote (claude 12:20, chatgpt
  ~18:30) per una lettura della famiglia di pin, non del singolo crop.
